"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { auditLogs, profiles, taskRequests, tasks } from "@/lib/db/schema";
import { type Level } from "@/lib/levels";
import { createClient } from "@/lib/supabase/server";

export type TaskRequestState = {
  error?: string;
  success?: boolean;
  message?: string;
  taskId?: number;
};

const ACTIVE_TASK_STATUSES = ["dipilih", "dikerjakan"] as const;

async function getMemberContext(): Promise<
  | { ok: true; userId: string; referredBy: string | null }
  | { ok: false; error: TaskRequestState }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: { error: "Sesi habis, silakan login ulang." } };

  const [profile] = await db
    .select({ role: profiles.role, referredBy: profiles.referredBy })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile) return { ok: false, error: { error: "Profil tidak ditemukan." } };
  if (profile.role !== "member") {
    return { ok: false, error: { error: "Hanya member yang bisa meminta tugas." } };
  }
  return { ok: true, userId: user.id, referredBy: profile.referredBy };
}

/**
 * Member meminta tugas baru.
 * Permintaan disimpan terpisah di task_requests agar belum dihitung sebagai tugas aktif.
 * Klik berulang hanya meng-update request yang sama, tidak membuat duplikat.
 */
export async function requestTask(
  _prev: TaskRequestState,
  _formData: FormData,
): Promise<TaskRequestState> {
  const ctx = await getMemberContext();
  if (!ctx.ok) return ctx.error;

  // Tolak hanya kalau member sudah punya tugas nyata yang sedang dipilih/dikerjakan.
  const activeTasks = await db
    .select({ id: tasks.id, status: tasks.status })
    .from(tasks)
    .where(
      sql`${tasks.memberId} = ${ctx.userId} AND ${tasks.status} = ANY(${sql.raw(`ARRAY[${ACTIVE_TASK_STATUSES.map((s) => `'${s}'::task_status`).join(",")}]`)})`,
    )
    .limit(1);

  if (activeTasks.length > 0) {
    return {
      error: "Kamu masih memiliki tugas aktif. Selesaikan dulu sebelum meminta lagi.",
    };
  }

  const [created] = await db
    .insert(taskRequests)
    .values({
      memberId: ctx.userId,
      requestCount: 1,
    })
    .onConflictDoUpdate({
      target: taskRequests.memberId,
      set: {
        requestCount: sql`${taskRequests.requestCount} + 1`,
        requestedAt: sql`now()`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: taskRequests.id });

  if (!created) return { error: "Gagal membuat permintaan tugas." };

  revalidatePath("/task");
  revalidatePath("/order");
  revalidatePath("/admin/task");
  return {
    success: true,
    message: "Permintaan tugas dikirim. Mohon tunggu admin memilihkan produk.",
    taskId: created.id,
  };
}

/**
 * Member submit tugas: 'dipilih' -> 'dikerjakan'.
 * Komisi (level multiplier) langsung masuk ke frozen_balance (saldo beku)
 * dan menunggu persetujuan admin sebelum berpindah ke balance.
 */
export async function submitTask(
  _prev: TaskRequestState,
  formData: FormData,
): Promise<TaskRequestState> {
  const ctx = await getMemberContext();
  if (!ctx.ok) return ctx.error;

  const taskId = Number(formData.get("taskId"));
  const ratingRaw = formData.get("rating");
  const rating = ratingRaw ? Number(ratingRaw) : null;
  if (!Number.isFinite(taskId) || taskId <= 0) {
    return { error: "ID tugas tidak valid." };
  }

  // 1. Update status 'dipilih' -> 'dikerjakan' (hanya untuk tugas milik member ini),
  //    dan sekaligus kredit frozen_balance dengan commission × level multiplier.
  const result = await db.execute<{
    member_id: string;
    level: Level;
    final_amount: string;
  }>(sql`
    WITH t AS (
      SELECT id, member_id, commission
      FROM tasks
      WHERE id = ${taskId}
        AND member_id = ${ctx.userId}
        AND status = 'dipilih'::task_status
      FOR UPDATE
    ),
    m AS (
      SELECT id, level
      FROM profiles
      WHERE id = (SELECT member_id FROM t)
      FOR UPDATE
    ),
    fin AS (
      SELECT
        t.id AS task_id,
        t.member_id,
        (t.commission::numeric * CASE m.level
          WHEN 'classic' THEN 1.0
          WHEN 'silver' THEN 1.25
          WHEN 'gold' THEN 1.5
          WHEN 'platinum' THEN 1.75
          WHEN 'diamond' THEN 2.0
          WHEN 'premier' THEN 2.5
        END) AS final_amount
      FROM t, m
    ),
    upd AS (
      UPDATE tasks
      SET status = 'dikerjakan'::task_status,
          updated_at = now()
      WHERE id = (SELECT task_id FROM fin)
      RETURNING id, member_id
    ),
    frz AS (
      UPDATE profiles
      SET frozen_balance = frozen_balance + (SELECT final_amount FROM fin),
          updated_at = now()
      WHERE id = (SELECT member_id FROM fin)
      RETURNING id, level, frozen_balance
    )
    SELECT
      frz.id AS member_id,
      frz.level,
      (SELECT final_amount FROM fin)::text AS final_amount
    FROM frz
  `);

  if (result.length === 0) {
    return {
      error: "Tugas tidak ditemukan, bukan milik Anda, atau belum dipilih admin.",
    };
  }

  const row = result[0];

  // 2. Audit log
  const noteSuffix =
    rating && rating >= 1 && rating <= 5 ? ` Rating: ${rating}/5` : "";
  await db.insert(auditLogs).values({
    actorId: ctx.userId,
    targetId: row.member_id,
    action: "task_submitted",
    amount: row.final_amount,
    note: `Tugas #${taskId} dikirim (status: dikerjakan, masuk saldo beku).${noteSuffix}`,
    metadata: JSON.stringify({
      taskId,
      finalAmount: row.final_amount,
      rating: rating && rating >= 1 && rating <= 5 ? rating : null,
    }),
  });

  revalidatePath("/order");
  revalidatePath("/admin/task");
  revalidatePath("/admin/users");
  revalidatePath("/profil");
  return {
    success: true,
    message: "Tugas berhasil dikirim. Mohon tunggu verifikasi admin.",
    taskId,
  };
}
