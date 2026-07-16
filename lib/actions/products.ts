"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";

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
  imageUrl: z
    .string()
    .trim()
    .url("URL gambar tidak valid.")
    .optional()
    .or(z.literal("")),
  isActive: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export type ProductState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
};

export async function createProduct(
  _prev: ProductState,
  formData: FormData,
): Promise<ProductState> {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    price: Number(String(formData.get("price") ?? "").replace(/[^\d]/g, "")),
    imageUrl: formData.get("imageUrl") || undefined,
    isActive: formData.get("isActive") ?? "on",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.insert(products).values({
    name: parsed.data.name,
    price: parsed.data.price.toFixed(2),
    imageUrl: parsed.data.imageUrl || null,
    isActive: parsed.data.isActive,
  });

  revalidatePath("/admin/product");
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
    imageUrl: formData.get("imageUrl") || undefined,
    isActive: formData.get("isActive") ?? "on",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db
    .update(products)
    .set({
      name: parsed.data.name,
      price: parsed.data.price.toFixed(2),
      imageUrl: parsed.data.imageUrl || null,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  revalidatePath("/admin/product");
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
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/product");
  return {};
}
