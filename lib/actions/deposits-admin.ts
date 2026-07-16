"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { deposits, profiles } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

const actionSchema = z.object({
  id: z.coerce.number().int().positive("ID tidak valid."),
  action: z.enum(["approve", "reject"], {
    message: "Aksi tidak valid.",
  }),
  notes: z.string().trim().max(500).optional(),
});

export type DepositReviewState = {
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

export async function reviewDeposit(
  _prev: DepositReviewState,
  formData: FormData,
): Promise<DepositReviewState> {
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

  if (parsed.data.action === "approve") {
    // Atomic: update deposit + credit member's balance
    const updated = await db.execute<{ member_id: string; amount: string }>(sql`
      WITH d AS (
        SELECT id, member_id, amount, status FROM deposits WHERE id = ${parsed.data.id} FOR UPDATE
      ),
      upd AS (
        UPDATE deposits
        SET status = 'approved', reviewer_id = ${adminId}, notes = ${parsed.data.notes ?? null}, updated_at = now()
        FROM d
        WHERE deposits.id = d.id AND d.status = 'pending'
        RETURNING deposits.member_id, deposits.amount
      )
      UPDATE profiles
      SET balance = balance + upd.amount, updated_at = now()
      FROM upd
      WHERE profiles.id = upd.member_id
      RETURNING profiles.id
    `);
    if (!updated.length) {
      return { error: "Deposit tidak ditemukan atau sudah diproses." };
    }
  } else {
    // Reject
    const updated = await db
      .update(deposits)
      .set({
        status: "rejected",
        approvedBy: adminId,
        notes: parsed.data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(deposits.id, parsed.data.id))
      .returning({ id: deposits.id });
    if (!updated.length) {
      return { error: "Deposit tidak ditemukan." };
    }
  }

  revalidatePath("/admin/rechargelist");
  revalidatePath("/profil");
  revalidatePath("/profil/rechargelist");
  return { success: true };
}
