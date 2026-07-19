"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { auditLogs, profiles, taskRequests, tasks } from "@/lib/db/schema";
import { type Level } from "@/lib/levels";
import { createClient } from "@/lib/supabase/server";

export type TaskRequestState = {
  error?: string;
  hasExisting?: boolean;
  success?: boolean;
  message?: string;
  taskId?: number;
  need?: number;
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

  // Tolak kalau member sudah punya request menunggu (admin belum memilih produk)
  const pendingRequests = await db
    .select({ id: taskRequests.id })
    .from(taskRequests)
    .where(eq(taskRequests.memberId, ctx.userId))
    .limit(1);

  if (pendingRequests.length > 0) {
    return { hasExisting: true };
  }

  // Tolak kalau member sudah punya tugas nyata yang sedang dipilih/dikerjakan.
  const activeTasks = await db
    .select({ id: tasks.id, status: tasks.status })
    .from(tasks)
    .where(
      sql`${tasks.memberId} = ${ctx.userId} AND ${tasks.status} = ANY(${sql.raw(`ARRAY[${ACTIVE_TASK_STATUSES.map((s) => `'${s}'::task_status`).join(",")}]`)})`,
    )
    .limit(1);

  if (activeTasks.length > 0) {
    return { hasExisting: true };
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
 *
 * Alur pada step ini:
 * - Cek saldo member cukup untuk harga produk.
 * - Potong `price` dari `balance` (uang jajan pesanan).
 * - Kredit `commission × level multiplier` ke `frozen_balance` (komisi
 *   yang akan pindah ke balance setelah admin konfirmasi selesai).
 * - Jika saldo kurang, tidak ada mutasi; return `need` agar UI bisa
 *   arahkan member ke halaman deposit.
 *
 * Saldo yang sudah dipotong akan dikembalikan ke `balance` jika admin
 * membatalkan tugas (lihat `updateTaskStatus` di tasks-admin.ts).
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

  // 1. Validasi task + harga + saldo member, lalu potong saldo & update
  //    status dalam satu CTE. Kalau saldo kurang, tidak ada mutasi yang
  //    terjadi — `shortfall` akan > 0 di hasil.
  const result = await db.execute<{
    member_id: string;
    level: Level;
    final_amount: string;
    price: string;
    current_balance: string;
    shortfall: string;
  }>(sql`
    WITH t AS (
      SELECT id, member_id, price, commission
      FROM tasks
      WHERE id = ${taskId}
        AND member_id = ${ctx.userId}
        AND status = 'dipilih'::task_status
      FOR UPDATE
    ),
    m AS (
      SELECT id, level, balance
      FROM profiles
      WHERE id = (SELECT member_id FROM t)
      FOR UPDATE
    ),
    fin AS (
      SELECT
        t.id AS task_id,
        t.member_id,
        t.price::numeric AS task_price,
        m.balance::numeric AS current_balance,
        m.level,
        (t.commission::numeric * CASE m.level
          WHEN 'classic' THEN 1.0
          WHEN 'silver' THEN 1.25
          WHEN 'gold' THEN 1.5
          WHEN 'platinum' THEN 1.75
          WHEN 'diamond' THEN 2.0
          WHEN 'premier' THEN 2.5
        END) AS final_amount,
        GREATEST(t.price::numeric - m.balance::numeric, 0)::numeric AS shortfall
      FROM t, m
    ),
    upd AS (
      UPDATE tasks
      SET status = 'dikerjakan'::task_status,
          updated_at = now()
      WHERE id = (SELECT task_id FROM fin)
        AND (SELECT shortfall FROM fin) = 0
      RETURNING id
    ),
    debit AS (
      UPDATE profiles
      SET balance = balance - (SELECT task_price FROM fin),
          updated_at = now()
      WHERE id = (SELECT member_id FROM fin)
        AND (SELECT shortfall FROM fin) = 0
      RETURNING id
    ),
    frz AS (
      UPDATE profiles
      SET frozen_balance = frozen_balance + (SELECT final_amount FROM fin),
          updated_at = now()
      WHERE id = (SELECT member_id FROM fin)
        AND (SELECT shortfall FROM fin) = 0
      RETURNING id
    )
    SELECT
      (SELECT member_id FROM fin) AS member_id,
      (SELECT level FROM m) AS level,
      COALESCE((SELECT final_amount FROM fin), 0)::text AS final_amount,
      COALESCE((SELECT task_price FROM fin), 0)::text AS price,
      COALESCE((SELECT current_balance FROM fin), 0)::text AS current_balance,
      COALESCE((SELECT shortfall FROM fin), 0)::text AS shortfall
  `);

  if (result.length === 0) {
    return {
      error: "Tugas tidak ditemukan, bukan milik Anda, atau belum dipilih admin.",
    };
  }

  const row = result[0];
  const shortfall = Number(row.shortfall);

  // Saldo tidak cukup → return info shortfall, tidak ada mutasi.
  if (shortfall > 0) {
    return {
      error: `Saldo tidak cukup. Kurang Rp ${shortfall.toLocaleString("id-ID")} untuk mengerjakan tugas ini.`,
      need: shortfall,
    };
  }

  // 2. Audit log
  const noteSuffix =
    rating && rating >= 1 && rating <= 5 ? ` Rating: ${rating}/5` : "";
  await db.insert(auditLogs).values({
    actorId: ctx.userId,
    targetId: row.member_id,
    action: "task_submitted",
    amount: row.final_amount,
    note: `Tugas #${taskId} dimulai. Harga Rp ${Number(row.price).toLocaleString("id-ID")} dipotong dari saldo, komisi masuk saldo beku.${noteSuffix}`,
    metadata: JSON.stringify({
      taskId,
      price: row.price,
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
    message: "Tugas berhasil dimulai. Mohon tunggu verifikasi admin.",
    taskId,
  };
}
