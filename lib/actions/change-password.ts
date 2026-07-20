"use server";

import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const loginSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi lama wajib diisi."),
    newPassword: z
      .string()
      .min(6, "Kata sandi baru minimal 6 karakter.")
      .max(72, "Kata sandi terlalu panjang (maks 72 karakter)."),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "Kata sandi baru tidak boleh sama dengan yang lama.",
    path: ["newPassword"],
  });

const withdrawSchema = z
  .object({
    currentPassword: z.string().min(1, "Sandi penarikan lama wajib diisi."),
    newPassword: z
      .string()
      .min(6, "Sandi penarikan baru minimal 6 karakter.")
      .max(72, "Sandi penarikan terlalu panjang (maks 72 karakter)."),
    confirmPassword: z.string().min(1, "Konfirmasi sandi wajib diisi."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Konfirmasi sandi tidak cocok.",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "Sandi baru tidak boleh sama dengan yang lama.",
    path: ["newPassword"],
  });

export type ChangePasswordState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
  message?: string;
};

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("UNAUTHENTICATED");
  return { user: session.user };
}

export async function changeLoginPassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const parsed = loginSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await requireUser();
  } catch {
    return { error: "Sesi habis, silakan login ulang." };
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: false,
      },
      headers: await headers(),
    });
  } catch {
    return { fieldErrors: { currentPassword: ["Kata sandi lama salah."] } };
  }

  revalidatePath("/profil/change-password");
  return { success: true, message: "Kata sandi masuk berhasil diperbarui." };
}

export async function changeWithdrawPassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const parsed = withdrawSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let user;
  try {
    const ctx = await requireUser();
    user = ctx.user;
  } catch {
    return { error: "Sesi habis, silakan login ulang." };
  }

  // Verifikasi sandi penarikan lama (bcrypt crypt — hash tidak bisa
  // dibandingkan langsung dengan plaintext, harus lewat `crypt()`).
  const [verify] = await db.execute<{ ok: boolean }>(sql`
    SELECT (
      withdraw_password_hash = extensions.crypt(
        ${parsed.data.currentPassword},
        withdraw_password_hash
      )
    ) AS ok
    FROM profiles WHERE id = ${user.id}
  `);
  if (!verify?.ok) {
    return { fieldErrors: { currentPassword: ["Sandi penarikan lama salah."] } };
  }

  const updated = await db.execute<{ id: string }>(sql`
    UPDATE profiles
    SET withdraw_password_hash = extensions.crypt(
          ${parsed.data.newPassword},
          extensions.gen_salt('bf', 10)
        ),
        updated_at = now()
    WHERE id = ${user.id}
    RETURNING id
  `);
  if (!updated.length) {
    return { error: "Gagal memperbarui sandi penarikan." };
  }

  revalidatePath("/profil/change-password");
  return { success: true, message: "Sandi penarikan berhasil diperbarui." };
}
