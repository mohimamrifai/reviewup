"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { loginSchema, registerSchema } from "@/lib/schemas/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
};

function syntheticEmail(username: string) {
  return `${username.toLowerCase()}@reviewup.app`;
}

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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: syntheticEmail(parsed.data.username),
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Nama pengguna atau kata sandi salah." };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Gagal memuat sesi." };

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (profile?.role && profile.role !== "member") {
    redirect("/admin/dashboard");
  }

  redirect("/profil");
}

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

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: syntheticEmail(parsed.data.username),
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Username atau password salah." };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Gagal memuat sesi." };

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role === "member") {
    await supabase.auth.signOut();
    return { error: "Akun ini tidak memiliki akses admin." };
  }

  redirect("/admin/dashboard");
}

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

  // Validasi kode undangan harus ada di tabel profiles (admin/leader/staff)
  const [staff] = await db
    .select({ id: profiles.id, username: profiles.username })
    .from(profiles)
    .where(eq(profiles.referralCode, referralCode))
    .limit(1);

  if (!staff) {
    return { fieldErrors: { kodeUndangan: ["Kode undangan tidak valid."] } };
  }

  // Cek username unik sebelum signUp
  const [existing] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);

  if (existing) {
    return { fieldErrors: { namaPengguna: ["Nama pengguna sudah dipakai."] } };
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  // 1. Create user via admin client with email_confirm: true
  //    → trigger handle_new_user() otomatis insert ke public.profiles
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: syntheticEmail(username),
    password: parsed.data.kataSandi,
    email_confirm: true,
    user_metadata: {
      username,
      role: "member",
      referral_code: referralCode,
      withdraw_password_hash: parsed.data.sandiPenarikan,
    },
  });

  if (createError || !created?.user) {
    // Kemungkinan duplicate email
    if (createError?.message?.toLowerCase().includes("already")) {
      return { fieldErrors: { namaPengguna: ["Nama pengguna sudah dipakai."] } };
    }
    return { error: createError?.message ?? "Gagal membuat akun." };
  }

  // 2. Sign in dengan anon client (email sudah confirmed, jadi tidak butuh
  //    email confirmation lagi). Ini yang nge-set session cookies.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: syntheticEmail(username),
    password: parsed.data.kataSandi,
  });

  if (signInError) {
    return {
      error:
        "Akun berhasil dibuat, tetapi login otomatis gagal: " +
        signInError.message,
    };
  }

  revalidatePath("/profil");
  redirect("/profil");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function adminSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
