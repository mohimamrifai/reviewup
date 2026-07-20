"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath, refresh } from "next/cache";
import { z } from "zod";

import {
  MAX_WITHDRAWAL_AMOUNT,
  MIN_WITHDRAWAL_AMOUNT,
} from "@/lib/constants/withdrawal";
import { db } from "@/lib/db";
import { auditLogs, bankAccounts, profiles, withdrawals } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";

const withdrawSchema = z.object({
  bankAccountId: z
    .number({ message: "Pilih rekening tujuan." })
    .int()
    .positive("Rekening tidak valid."),
  amount: z
    .number({ message: "Nominal wajib diisi." })
    .min(
      MIN_WITHDRAWAL_AMOUNT,
      `Minimal penarikan Rp ${MIN_WITHDRAWAL_AMOUNT.toLocaleString("id-ID")}.`,
    )
    .max(
      MAX_WITHDRAWAL_AMOUNT,
      `Maksimal penarikan Rp ${MAX_WITHDRAWAL_AMOUNT.toLocaleString("id-ID")}.`,
    ),
  withdrawPassword: z
    .string()
    .min(6, "Kata sandi penarikan minimal 6 karakter."),
});

export type WithdrawState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function submitWithdrawal(
  _prev: WithdrawState,
  formData: FormData,
): Promise<WithdrawState> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { error: "Sesi habis, silakan login ulang." };
  }

  const parsed = withdrawSchema.safeParse({
    bankAccountId: Number(formData.get("bankAccountId")),
    amount: Number(String(formData.get("amount") ?? "").replace(/[^\d]/g, "")),
    withdrawPassword: formData.get("withdrawPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Cek status akun: banned member tidak boleh withdraw
  const [me] = await db
    .select({ status: profiles.status })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);
  if (me?.status === "banned") {
    return { error: "Akun Anda diblokir. Hubungi staff terkait untuk konfirmasi." };
  }

  // Verifikasi sandi penarikan via DB (bcrypt crypt).
  // PENTING: `withdraw_password_hash` adalah bcrypt hash, jadi tidak bisa
  // dibandingkan langsung dengan plaintext — harus lewat `crypt()` agar
  // plaintext di-hash dengan salt yang sama, lalu dibandingkan.
  const [verify] = await db.execute<{ ok: boolean }>(sql`
    SELECT (
      withdraw_password_hash = extensions.crypt(
        ${parsed.data.withdrawPassword},
        withdraw_password_hash
      )
    ) AS ok
    FROM profiles WHERE id = ${user.id}
  `);
  if (!verify?.ok) {
    return {
      fieldErrors: { withdrawPassword: ["Kata sandi penarikan salah."] },
    };
  }

  // Cek rekening milik user
  const [bank] = await db
    .select({ id: bankAccounts.id })
    .from(bankAccounts)
    .where(
      and(
        eq(bankAccounts.id, parsed.data.bankAccountId),
        eq(bankAccounts.userId, user.id),
      ),
    )
    .limit(1);
  if (!bank) {
    return { fieldErrors: { bankAccountId: ["Rekening tidak ditemukan."] } };
  }

  // Cek saldo cukup (atomic check + decrement)
  const amountStr = parsed.data.amount.toFixed(2);
  const updated = await db.execute<{ id: string; balance: string }>(sql`
    UPDATE profiles
    SET balance = balance - ${amountStr}::numeric,
        frozen_balance = frozen_balance + ${amountStr}::numeric,
        updated_at = now()
    WHERE id = ${user.id}
      AND balance >= ${amountStr}::numeric
    RETURNING id, balance
  `);

  if (!updated.length) {
    return { error: "Saldo tidak cukup." };
  }

  // Insert withdrawal row
  const [created] = await db.insert(withdrawals).values({
    memberId: user.id,
    bankAccountId: parsed.data.bankAccountId,
    amount: amountStr,
    status: "pending",
  }).returning({ id: withdrawals.id });

  await db.insert(auditLogs).values({
    actorId: user.id,
    targetId: user.id,
    action: "withdrawal_submitted",
    amount: amountStr,
    note: `Pengajuan penarikan #${created.id} dibuat.`,
    metadata: JSON.stringify({
      withdrawalId: created.id,
      amount: parsed.data.amount,
    }),
  });

  revalidatePath("/withdraw");
  revalidatePath("/profil");
  revalidatePath("/profil/withdrawlist");
  revalidatePath("/admin/withdrawlist");
  refresh();
  return { success: true };
}
