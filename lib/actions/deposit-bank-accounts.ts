"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { type Scope, getScope } from "@/lib/access";
import { db } from "@/lib/db";
import { depositBankAccounts } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

const baseSchema = z.object({
  bankName: z
    .string()
    .trim()
    .min(2, "Nama bank minimal 2 karakter.")
    .max(60, "Nama bank maksimal 60 karakter."),
  accountName: z
    .string()
    .trim()
    .min(2, "Nama pemilik minimal 2 karakter.")
    .max(80, "Nama pemilik maksimal 80 karakter."),
  accountNumber: z
    .string()
    .trim()
    .min(3, "Nomor rekening minimal 3 digit.")
    .max(40, "Nomor rekening maksimal 40 digit.")
    .regex(/^[0-9\-\s]+$/, "Nomor rekening hanya angka, spasi, atau strip."),
  notes: z.string().trim().max(200).optional(),
});

const addSchema = baseSchema;
const updateSchema = baseSchema.extend({
  accountId: z.coerce
    .number()
    .int()
    .positive("ID rekening tidak valid."),
});

const toggleSchema = z.object({
  accountId: z.coerce.number().int().positive("ID rekening tidak valid."),
});

const deleteSchema = z.object({
  accountId: z.coerce.number().int().positive("ID rekening tidak valid."),
});

export type DepositBankAccountState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
  message?: string;
};

/**
 * Pemeriksaan peran + override untuk aksi CRUD deposit bank accounts.
 * Yang boleh: super_admin, admin_leader (role-based), atau siapa saja yang
 * punya override flag `depositBankCrud = true` di `access_overrides`.
 */
async function requireBankAccountManager(): Promise<{ actorId: string; scope: Scope }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  const scope = await getScope(user.id);
  if (!scope) throw new Error("FORBIDDEN");

  const isSuper = scope.role === "super_admin";
  const isLeader = scope.role === "admin_leader";
  const hasOverride = scope.overrides.depositBankCrud === true;

  if (!isSuper && !isLeader && !hasOverride) {
    throw new Error("FORBIDDEN");
  }
  return { actorId: user.id, scope };
}

function handleAuthError(e: unknown): DepositBankAccountState {
  const msg = (e as Error).message;
  if (msg === "FORBIDDEN")
    return { error: "Anda tidak memiliki akses untuk aksi ini." };
  return { error: "Sesi habis, silakan login ulang." };
}

export async function addDepositBankAccount(
  _prev: DepositBankAccountState,
  formData: FormData,
): Promise<DepositBankAccountState> {
  let actorId: string;
  try {
    ({ actorId } = await requireBankAccountManager());
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = addSchema.safeParse({
    bankName: formData.get("bankName"),
    accountName: formData.get("accountName"),
    accountNumber: formData.get("accountNumber"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.insert(depositBankAccounts).values({
    bankName: parsed.data.bankName,
    accountName: parsed.data.accountName,
    accountNumber: parsed.data.accountNumber,
    notes: parsed.data.notes ?? null,
    createdBy: actorId,
  });

  revalidatePath("/admin/deposit-bank");
  revalidatePath("/recharge");
  return { success: true, message: "Rekening tujuan berhasil ditambahkan." };
}

export async function updateDepositBankAccount(
  _prev: DepositBankAccountState,
  formData: FormData,
): Promise<DepositBankAccountState> {
  try {
    await requireBankAccountManager();
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = updateSchema.safeParse({
    accountId: formData.get("accountId"),
    bankName: formData.get("bankName"),
    accountName: formData.get("accountName"),
    accountNumber: formData.get("accountNumber"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db
    .update(depositBankAccounts)
    .set({
      bankName: parsed.data.bankName,
      accountName: parsed.data.accountName,
      accountNumber: parsed.data.accountNumber,
      notes: parsed.data.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(depositBankAccounts.id, parsed.data.accountId));

  revalidatePath("/admin/deposit-bank");
  revalidatePath("/recharge");
  return { success: true, message: "Rekening tujuan berhasil diperbarui." };
}

export async function deleteDepositBankAccount(
  _prev: DepositBankAccountState,
  formData: FormData,
): Promise<DepositBankAccountState> {
  try {
    await requireBankAccountManager();
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = deleteSchema.safeParse({
    accountId: formData.get("accountId"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db
    .delete(depositBankAccounts)
    .where(eq(depositBankAccounts.id, parsed.data.accountId));

  revalidatePath("/admin/deposit-bank");
  revalidatePath("/recharge");
  return { success: true, message: "Rekening tujuan berhasil dihapus." };
}

export async function toggleDepositBankAccountActive(
  _prev: DepositBankAccountState,
  formData: FormData,
): Promise<DepositBankAccountState> {
  try {
    await requireBankAccountManager();
  } catch (e) {
    return handleAuthError(e);
  }

  const parsed = toggleSchema.safeParse({
    accountId: formData.get("accountId"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const [current] = await db
    .select({ isActive: depositBankAccounts.isActive })
    .from(depositBankAccounts)
    .where(eq(depositBankAccounts.id, parsed.data.accountId))
    .limit(1);
  if (!current) return { error: "Rekening tidak ditemukan." };

  await db
    .update(depositBankAccounts)
    .set({ isActive: !current.isActive, updatedAt: new Date() })
    .where(eq(depositBankAccounts.id, parsed.data.accountId));

  revalidatePath("/admin/deposit-bank");
  revalidatePath("/recharge");
  return {
    success: true,
    message: current.isActive
      ? "Rekening di-nonaktifkan."
      : "Rekening diaktifkan.",
  };
}
