"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";

const PRODUCTS_BUCKET = "products";
const MAX_SIZE = 2 * 1024 * 1024; // 2MB (sesuai limit bucket)
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama produk minimal 2 karakter.")
    .max(200, "Nama produk maksimal 200 karakter."),
  price: z
    .number({ message: "Harga wajib diisi." })
    .min(0, "Harga tidak boleh negatif.")
    .max(1_000_000_000, "Harga terlalu besar."),
  isActive: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export type ProductState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
};

async function processImageUpload(
  file: File,
  oldPath: string | null,
): Promise<
  | { ok: true; publicUrl: string; path: string }
  | { ok: false; error: string }
> {
  if (file.size > MAX_SIZE) {
    return { ok: false, error: "Ukuran file maksimal 2MB." };
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    return { ok: false, error: "Format harus JPG, PNG, atau WEBP." };
  }

  const supabase = createAdminClient();
  const ext = (file.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCTS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { ok: false, error: `Gagal upload gambar: ${uploadError.message}` };
  }

  const { data: urlData } = supabase.storage
    .from(PRODUCTS_BUCKET)
    .getPublicUrl(path);

  // Cleanup best-effort: hapus file lama kalau ada
  if (oldPath) {
    const oldKey = oldPath.split(`${PRODUCTS_BUCKET}/`)[1] ?? oldPath;
    await supabase.storage.from(PRODUCTS_BUCKET).remove([oldKey]);
  }

  return { ok: true, publicUrl: urlData.publicUrl, path };
}

export async function createProduct(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    price: Number(String(formData.get("price") ?? "").replace(/[^\d]/g, "")),
    isActive: formData.get("isActive") ?? "on",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let imageUrl: string | null = null;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const upload = await processImageUpload(image, null);
    if (!upload.ok) {
      return { fieldErrors: { image: [upload.error] } };
    }
    imageUrl = upload.publicUrl;
  }

  await db.insert(products).values({
    name: parsed.data.name,
    price: parsed.data.price.toFixed(2),
    imageUrl,
    isActive: parsed.data.isActive,
  });

  revalidatePath("/admin/product");
  revalidatePath("/");
  return {};
}

export async function updateProduct(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "ID produk tidak valid." };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    price: Number(String(formData.get("price") ?? "").replace(/[^\d]/g, "")),
    isActive: formData.get("isActive") ?? "on",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const [current] = await db
    .select({ imageUrl: products.imageUrl })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!current) return { error: "Produk tidak ditemukan." };

  let imageUrl: string | null = current.imageUrl;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const upload = await processImageUpload(image, current.imageUrl);
    if (!upload.ok) {
      return { fieldErrors: { image: [upload.error] } };
    }
    imageUrl = upload.publicUrl;
  }

  await db
    .update(products)
    .set({
      name: parsed.data.name,
      price: parsed.data.price.toFixed(2),
      imageUrl,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  revalidatePath("/admin/product");
  revalidatePath("/");
  return {};
}

export async function deleteProduct(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "ID produk tidak valid." };
  }

  // Ambil imageUrl dulu untuk cleanup storage
  const [row] = await db
    .select({ imageUrl: products.imageUrl })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (row?.imageUrl) {
    const supabase = createAdminClient();
    const key = row.imageUrl.split(`${PRODUCTS_BUCKET}/`)[1] ?? row.imageUrl;
    await supabase.storage.from(PRODUCTS_BUCKET).remove([key]);
  }

  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/product");
  revalidatePath("/");
  return {};
}
