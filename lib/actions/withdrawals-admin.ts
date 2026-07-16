"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { profiles, withdrawals } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

const actionSchema = z.object({
  id: z.coerce.number().int().positive("ID tidak valid."),
  action: z.enum(["complete", "reject"], {
    message: "Aksi tidak valid.",
  }),
  notes: z.string().trim().max(500).optional(),
});

export type WithdrawReviewState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

async function requireAdmin() {
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

export async function reviewWithdrawal(
  _prev: WithdrawReviewState,
  formData: FormData,
): Promise<WithdrawReviewState> {
  let adminId: string;
  try {
    adminId = await requireAdmin();
  } catch (e) {
    const msg = (e as Error).message;
    return {
      error:
        msg === "FORBIDDEN"
          ? "Anda tidak memiliki akses admin."
          : "Sesi habis, silakan login ulang.",
    };
  }

  const parsed = actionSchema.safeParse({
    id: formData.get("id"),
    action: formData.get("action"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (parsed.data.action === "complete") {
    // Complete: kosongkan frozen_balance (uang sudah keluar)
    const updated = await db.execute<{ id: number; member_id: string; amount: string }>(sql`
      WITH w AS (
        SELECT id, member_id, amount, status FROM withdrawals WHERE id = ${parsed.data.id} FOR UPDATE
      ),
      upd AS (
        UPDATE withdrawals
        SET status = 'completed', reviewer_id = ${adminId}, notes = ${parsed.data.notes ?? null}, updated_at = now()
        FROM w
        WHERE withdrawals.id = w.id AND w.status = 'pending'
        RETURNING withdrawals.id, withdrawals.member_id, withdrawals.amount
      )
      UPDATE profiles
      SET frozen_balance = frozen_balance - upd.amount, updated_at = now()
      FROM upd
      WHERE profiles.id = upd.member_id AND frozen_balance >= upd.amount
      RETURNING profiles.id
    `);
    if (!updated.length) {
      return {
        error: "Penarikan tidak ditemukan, sudah diproses, atau saldo beku tidak cukup.",
      };
    }
  } else {
    // Reject: kembalikan ke saldo (tambah balance, kurangi frozen)
    const updated = await db.execute<{ id: number }>(sql`
      WITH w AS (
        SELECT id, member_id, amount, status FROM withdrawals WHERE id = ${parsed.data.id} FOR UPDATE
      ),
      upd AS (
        UPDATE withdrawals
        SET status = 'rejected', reviewer_id = ${adminId}, notes = ${parsed.data.notes ?? null}, updated_at = now()
        FROM w
        WHERE withdrawals.id = w.id AND w.status = 'pending'
        RETURNING withdrawals.id, withdrawals.member_id, withdrawals.amount
      )
      UPDATE profiles
      SET balance = balance + upd.amount,
          frozen_balance = frozen_balance - upd.amount,
          updated_at = now()
      FROM upd
      WHERE profiles.id = upd.member_id AND frozen_balance >= upd.amount
      RETURNING profiles.id
    `);
    if (!updated.length) {
      return {
        error: "Penarikan tidak ditemukan, sudah diproses, atau saldo beku tidak cukup.",
      };
    }
  }

  revalidatePath("/admin/withdrawlist");
  revalidatePath("/withdraw");
  revalidatePath("/profil");
  revalidatePath("/profil/withdrawlist");
  return { success: true };
}
