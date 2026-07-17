import "server-only";

import { createAdminClient } from "./admin";

/**
 * Resolve `proofUrl` di database menjadi URL yang bisa diakses admin.
 *
 * Bucket `deposits` itu private, jadi URL "/object/public/..." tidak akan pernah
 * berhasil diakses (404). Fungsi ini menormalisasi:
 *
 * 1. URL lama (legacy) format: `.../storage/v1/object/public/deposits/{path}`
 *    → extract path → createSignedUrl() baru (1 jam)
 * 2. URL baru (signed URL yang sudah valid <7 hari)
 *    → return apa adanya
 * 3. null/empty → return null
 *
 * Pakai service-role client (bypass RLS) karena RLS policy admin read-all
 * bergantung pada `auth.uid()` di postgres context yang tidak selalu ter-resolve
 * di server-component saat pakai createClient() biasa.
 */
export async function resolveProofUrl(
  proofUrl: string | null | undefined,
  expiresInSeconds = 60 * 60, // 1 jam, cukup untuk review session
): Promise<string | null> {
  if (!proofUrl) return null;

  const supabase = createAdminClient();

  // Detect URL lama yang mengandung "/object/public/deposits/"
  const PUBLIC_PREFIX = "/object/public/deposits/";
  const idx = proofUrl.indexOf(PUBLIC_PREFIX);
  if (idx >= 0) {
    const path = proofUrl.slice(idx + PUBLIC_PREFIX.length);
    if (!path) return null;
    const { data, error } = await supabase.storage
      .from("deposits")
      .createSignedUrl(path, expiresInSeconds);
    if (error || !data?.signedUrl) {
      console.error("[resolveProofUrl] createSignedUrl failed:", error?.message);
      return null;
    }
    return data.signedUrl;
  }

  // URL sudah signed (dari kode baru) atau path mentah — return apa adanya
  return proofUrl;
}
