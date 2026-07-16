"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { type Level } from "@/lib/levels";
import { auditLogs, profiles, tasks } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

const statusSchema = z.object({
  taskId: z.coerce.number().int().positive("ID tugas tidak valid."),
  status: z.enum(
    ["menunggu", "dipilih", "dikerjakan", "selesai", "dibatalkan"],
    { message: "Status tidak valid." },
  ),
  notes: z.string().trim().max(500).optional(),
});

export type TaskReviewState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
  message?: string;
};

async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (!profile || profile.role === "member") {
    throw new Error("FORBIDDEN");
  }
  return user.id;
}

function handleAuthError(e: unknown): TaskReviewState {
  const msg = (e as Error).message;
  if (msg === "FORBIDDEN") return { error: "Anda tidak memiliki akses admin." };
  return { error: "Sesi habis, silakan login ulang." };
}

export async function updateTaskStatus(
  _prev: TaskReviewState,
  formData: FormData,
): Promise<TaskReviewState> {
  let adminId: string;
  try {
    adminId = await requireAdmin();
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = statusSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { taskId, status: newStatus, notes } = parsed.data;

  // 1. Update task status atomically + ambil member_id & commission kalau transisi ke 'selesai'
  const updated = await db.execute<{
    id: number;
    member_id: string;
    commission: string;
    prev_status: string;
  }>(sql`
    UPDATE tasks
    SET status = ${newStatus}::task_status,
        updated_at = now(),
        completed_at = CASE
          WHEN ${newStatus}::task_status = 'selesai' THEN now()
          ELSE completed_at
        END
    WHERE id = ${taskId}
    RETURNING id, member_id, commission, status AS prev_status
  `);

  if (updated.length === 0) {
    return { error: "Tugas tidak ditemukan." };
  }

  const row = updated[0];
  const wasAlreadySelesai = row.prev_status === "selesai";
  const justCompleted = newStatus === "selesai" && !wasAlreadySelesai;

  if (!justCompleted) {
    revalidatePath("/admin/task");
    return {
      success: true,
      message: wasAlreadySelesai
        ? "Tugas sudah pernah ditandai selesai."
        : "Status tugas diperbarui.",
    };
  }

  // 2. Credit komisi (level multiplier) + auto-update level dalam satu CTE
  const result = await db.execute<{
    member_id: string;
    level: Level;
    final_commission: string;
    new_balance: string;
    completed_count: number;
  }>(sql`
    WITH 
      m AS (
        SELECT id, level, balance 
        FROM profiles 
        WHERE id = ${row.member_id} 
        FOR UPDATE
      ),
      rate AS (
        SELECT 
          CASE m.level
            WHEN 'classic' THEN 1.0
            WHEN 'silver' THEN 1.25
            WHEN 'gold' THEN 1.5
            WHEN 'platinum' THEN 1.75
            WHEN 'diamond' THEN 2.0
            WHEN 'premier' THEN 2.5
          END::numeric AS multiplier
        FROM m
      ),
      fin AS (
        SELECT 
          m.id AS member_id,
          (${row.commission}::numeric * rate.multiplier) AS final_amount
        FROM m, rate
      ),
      cnt AS (
        SELECT member_id, COUNT(*)::int AS total_done
        FROM tasks
        WHERE member_id = ${row.member_id} AND status = 'selesai'
        GROUP BY member_id
      ),
      new_lvl AS (
        SELECT 
          cnt.member_id,
          CASE 
            WHEN cnt.total_done >= 100 THEN 'premier'::user_level
            WHEN cnt.total_done >= 50 THEN 'diamond'::user_level
            WHEN cnt.total_done >= 30 THEN 'platinum'::user_level
            WHEN cnt.total_done >= 15 THEN 'gold'::user_level
            WHEN cnt.total_done >= 5 THEN 'silver'::user_level
            ELSE 'classic'::user_level
          END AS lvl
        FROM cnt
      ),
      credit AS (
        UPDATE profiles
        SET balance = balance + fin.final_amount,
            level = COALESCE((SELECT lvl FROM new_lvl), profiles.level),
            updated_at = now()
        FROM fin
        WHERE profiles.id = fin.member_id
        RETURNING profiles.id, profiles.balance, profiles.level
      )
    SELECT 
      credit.id AS member_id,
      credit.level,
      fin.final_amount::text AS final_commission,
      credit.balance::text AS new_balance,
      COALESCE((SELECT total_done FROM cnt), 0) AS completed_count
    FROM credit, fin
  `);

  if (result.length === 0) {
    return { error: "Gagal mengkredit komisi." };
  }

  const r = result[0];

  // 3. Audit log
  await db.insert(auditLogs).values({
    actorId: adminId,
    targetId: r.member_id,
    action: "task_completed",
    amount: r.final_commission,
    note: notes
      ? `Tugas #${taskId} selesai: ${notes}`
      : `Tugas #${taskId} selesai.`,
    metadata: JSON.stringify({
      taskId,
      completedCount: r.completed_count,
      newLevel: r.level,
    }),
  });

  revalidatePath("/admin/task");
  revalidatePath("/admin/users");
  revalidatePath("/profil");
  return {
    success: true,
    message: `Tugas selesai. Komisi Rp ${Number(r.final_commission).toLocaleString("id-ID")} dikredit. Level: ${r.level} (${r.completed_count} tugas).`,
  };
}
