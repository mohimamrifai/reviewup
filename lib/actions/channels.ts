"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { customerServiceChannels } from "@/lib/db/schema";

const channelSchema = z.object({
  type: z.enum(["whatsapp", "telegram"], {
    message: "Pilih jenis channel.",
  }),
  label: z
    .string()
    .trim()
    .min(2, "Label minimal 2 karakter.")
    .max(80, "Label maksimal 80 karakter."),
  url: z
    .string()
    .trim()
    .url("URL tidak valid.")
    .max(500, "URL terlalu panjang."),
  isActive: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.literal("")])
    .optional()
    .transform((v) => v === "on" || v === "true"),
  sortOrder: z
    .union([z.literal(""), z.coerce.number().int()])
    .optional()
    .transform((v) => (v === "" || v == null ? 0 : Number(v))),
});

export type ChannelState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
};

export async function createChannel(
  _prev: ChannelState,
  formData: FormData,
): Promise<ChannelState> {
  const parsed = channelSchema.safeParse({
    type: formData.get("type"),
    label: formData.get("label"),
    url: formData.get("url"),
    isActive: formData.get("isActive") ?? "on",
    sortOrder: String(formData.get("sortOrder") ?? "0"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.insert(customerServiceChannels).values({
    type: parsed.data.type,
    label: parsed.data.label,
    url: parsed.data.url,
    isActive: parsed.data.isActive,
    sortOrder: parsed.data.sortOrder,
  });

  revalidatePath("/admin/pelayanan");
  revalidatePath("/support");
  return {};
}

export async function updateChannel(
  _prev: ChannelState,
  formData: FormData,
): Promise<ChannelState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "ID channel tidak valid." };
  }

  const parsed = channelSchema.safeParse({
    type: formData.get("type"),
    label: formData.get("label"),
    url: formData.get("url"),
    isActive: formData.get("isActive") ?? "off",
    sortOrder: String(formData.get("sortOrder") ?? "0"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db
    .update(customerServiceChannels)
    .set({
      type: parsed.data.type,
      label: parsed.data.label,
      url: parsed.data.url,
      isActive: parsed.data.isActive,
      sortOrder: parsed.data.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(customerServiceChannels.id, id));

  revalidatePath("/admin/pelayanan");
  revalidatePath("/support");
  return {};
}

export async function deleteChannel(
  _prev: ChannelState,
  formData: FormData,
): Promise<ChannelState> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return { error: "ID channel tidak valid." };
  }
  await db
    .delete(customerServiceChannels)
    .where(eq(customerServiceChannels.id, id));
  revalidatePath("/admin/pelayanan");
  revalidatePath("/support");
  return {};
}
