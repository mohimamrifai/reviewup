"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath, refresh } from "next/cache";
import { z } from "zod";

import { assertCanAccessMember, getScope } from "@/lib/access";
import { db } from "@/lib/db";
import { deposits, profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

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
  const user = await getCurrentUser();
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

function handleAuthError(e: unknown): DepositReviewState {
  const msg = (e as Error).message;
  if (msg === "FORBIDDEN") return { error: "Anda tidak memiliki akses admin." };
  if (msg === "FORBIDDEN_SCOPE")
    return { error: "Deposit ini bukan dari anggota tim Anda." };
  return { error: "Sesi habis, silakan login ulang." };
}

async function assertScopeForMember(memberId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  const scope = await getScope(user.id);
  if (!scope) throw new Error("FORBIDDEN");
  try {
    assertCanAccessMember(scope, memberId);
  } catch {
    throw new Error("FORBIDDEN_SCOPE");
  }
}

export async function reviewDeposit(
  _prev: DepositReviewState,
  formData: FormData,
): Promise<DepositReviewState> {
  let adminId: string;
  try {
    adminId = await requireAdmin();
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = actionSchema.safeParse({
    id: formData.get("id"),
    action: formData.get("action"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Ambil member_id dari deposit, lalu validasi scope
  const [depositRow] = await db
    .select({ memberId: deposits.memberId })
    .from(deposits)
    .where(eq(deposits.id, parsed.data.id))
    .limit(1);
  if (!depositRow) {
    return { error: "Deposit tidak ditemukan." };
  }
  try {
    await assertScopeForMember(depositRow.memberId);
  } catch (e) {
    return handleAuthError(e);
  }

  if (parsed.data.action === "approve") {
    // Atomic: update deposit + credit member's balance
    const updated = await db.execute<{ member_id: string; amount: string }>(sql`
      WITH d AS (
        SELECT id, member_id, amount, status FROM deposits WHERE id = ${parsed.data.id} FOR UPDATE
      ),
      upd AS (
        UPDATE deposits
        SET status = 'approved', approved_by = ${adminId}, notes = ${parsed.data.notes ?? null}, updated_at = now(), approved_at = now()
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
  refresh();
  return { success: true };
}
