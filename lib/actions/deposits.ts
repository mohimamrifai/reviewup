"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { deposits } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

const depositSchema = z.object({
  amount: z
    .number({ message: "Nominal wajib diisi." })
    .min(30000, "Minimal isi ulang Rp 30.000.")
    .max(100_000_000, "Maksimal isi ulang Rp 100.000.000."),
});

export type DepositState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function submitDeposit(
  _prev: DepositState,
  formData: FormData,
): Promise<DepositState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi habis, silakan login ulang." };

  // Parse amount
  const amountStr = String(formData.get("amount") ?? "").replace(/[^\d]/g, "");
  const amount = Number(amountStr);
  const parsed = depositSchema.safeParse({ amount });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Validate file
  const file = formData.get("proof");
  if (!(file instanceof File) || file.size === 0) {
    return { fieldErrors: { proof: ["Bukti transfer wajib diunggah."] } };
  }
  if (file.size > MAX_SIZE) {
    return { fieldErrors: { proof: ["Ukuran file maksimal 5MB."] } };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { fieldErrors: { proof: ["Format harus JPG, PNG, atau WEBP."] } };
  }

  // Upload ke Storage (path: {userId}/{timestamp}.{ext})
  const ext = file.type.split("/")[1] ?? "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("deposits")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: `Gagal upload bukti: ${uploadError.message}` };
  }

  // Get public URL (bucket private, jadi simpan path saja)
  // Admin nanti akan resolve via signed URL saat review
  const { data: urlData } = supabase.storage
    .from("deposits")
    .getPublicUrl(path);

  // Insert deposit row
  await db.insert(deposits).values({
    memberId: user.id,
    amount: amount.toFixed(2),
    proofUrl: urlData.publicUrl,
    status: "pending",
  });

  revalidatePath("/recharge");
  revalidatePath("/profil");
  revalidatePath("/admin/rechargelist");
  return { success: true };
}
