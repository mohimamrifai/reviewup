"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { registerSchema, loginSchema } from "@/lib/schemas/auth";

export type AuthState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
};

function syntheticEmail(username: string) {
  return `${username.toLowerCase()}@reviewup.app`;
}

/**
 * Sign in pakai Better Auth signInUsername (username plugin).
 * nextCookies plugin di lib/auth.ts auto-forward Set-Cookie ke Next.js.
 */
export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Sign out dulu agar tidak bentrok dengan sesi lama
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // No active session — aman untuk lanjut
  }

  let result;
  try {
    result = await auth.api.signInUsername({
      body: { username: parsed.data.username, password: parsed.data.password },
      headers: await headers(),
    });
  } catch {
    return { error: "Nama pengguna atau kata sandi salah." };
  }

  if (!result || !("user" in result) || !result.user) {
    return { error: "Nama pengguna atau kata sandi salah." };
  }

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, result.user.id))
    .limit(1);

  if (profile?.role && profile.role !== "member") {
    redirect("/admin/dashboard");
  }

  redirect("/profil");
}

/**
 * Admin sign in — sama dengan signIn tapi reject kalau role = member.
 */
export async function adminSignIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // ignore
  }

  let result;
  try {
    result = await auth.api.signInUsername({
      body: { username: parsed.data.username, password: parsed.data.password },
      headers: await headers(),
    });
  } catch {
    return { error: "Username atau password salah." };
  }

  if (!result || !("user" in result) || !result.user) {
    return { error: "Username atau password salah." };
  }

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, result.user.id))
    .limit(1);

  if (!profile || profile.role === "member") {
    // Sign out karena ini akun non-admin mencoba akses admin area
    try {
      await auth.api.signOut({ headers: await headers() });
    } catch {
      // ignore
    }
    return { error: "Akun ini tidak memiliki akses admin." };
  }

  redirect("/admin/dashboard");
}

function describeBetterAuthError(err: unknown): string {
  if (!err) return "Unknown error (no details returned).";
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    const anyErr = err as Error & {
      status?: number;
      code?: string;
      body?: { message?: string; code?: string };
    };
    const parts: string[] = [];
    if (anyErr.message) parts.push(anyErr.message);
    if (anyErr.body?.message) parts.push(`msg=${anyErr.body.message}`);
    if (anyErr.body?.code) parts.push(`code=${anyErr.body.code}`);
    if (anyErr.status !== undefined) parts.push(`http=${anyErr.status}`);
    return parts.length > 0 ? parts.join(" | ") : err.toString();
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Sign up member via Better Auth `signUpEmail`, sehingga hook database dan
 * cookie session tetap berjalan seperti flow produksi.
 */
export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    kodeUndangan: formData.get("kodeUndangan"),
    namaPengguna: formData.get("namaPengguna"),
    kataSandi: formData.get("kataSandi"),
    konfirmasiSandi: formData.get("konfirmasiSandi"),
    sandiPenarikan: formData.get("sandiPenarikan"),
    konfirmasiSandiPenarikan: formData.get("konfirmasiSandiPenarikan"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const username = parsed.data.namaPengguna;
  const referralCode = parsed.data.kodeUndangan;

  // Validasi kode undangan harus ada di tabel profiles
  const [staff] = await db
    .select({ id: profiles.id, username: profiles.username })
    .from(profiles)
    .where(eq(profiles.referralCode, referralCode))
    .limit(1);

  if (!staff) {
    return { fieldErrors: { kodeUndangan: ["Kode undangan tidak valid."] } };
  }

  // Cek username unik
  const [existing] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);

  if (existing) {
    return { fieldErrors: { namaPengguna: ["Nama pengguna sudah dipakai."] } };
  }

  // Drop sesi lama
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // ignore
  }

  let createdUser;
  try {
    createdUser = await auth.api.signUpEmail({
      headers: await headers(),
      body: {
        email: syntheticEmail(username),
        password: parsed.data.kataSandi,
        name: username,
        username,
      },
    });
  } catch (error) {
    console.error("[signUp] createUser error:", { username, error });
    return { error: describeBetterAuthError(error) };
  }

  if (!createdUser?.user) {
    return { error: "Gagal membuat akun baru." };
  }

  // 2. Set withdraw_password_hash di profile (sandi penarikan terpisah
  //    dari password login — di-hash via pgcrypto crypt()).
  const { sql } = await import("drizzle-orm");
  await db.execute(
    sql`
      UPDATE profiles
      SET
        referral_code = ${referralCode},
        referred_by = ${staff.id},
        withdraw_password_hash = crypt(${parsed.data.sandiPenarikan}, gen_salt('bf', 10)),
        updated_at = now()
      WHERE id = ${createdUser.user.id}
    `,
  );

  revalidatePath("/profil");
  redirect("/profil");
}

export async function signOut() {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // ignore
  }
  redirect("/login");
}

export async function adminSignOut() {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // ignore
  }
  redirect("/admin/login");
}
