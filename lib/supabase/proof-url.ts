import "server-only";

/**
 * Resolve `proofUrl` di database menjadi URL yang bisa diakses admin.
 *
 * Setelah migrasi ke local file storage, `proofUrl` disimpan sebagai URL internal
 * seperti `/api/files/:id`. Legacy URL Supabase dibiarkan apa adanya agar tidak
 * merusak data lama yang belum dimigrasi.
 *
 * Behaviour:
 * 1. `/api/files/:id` → return apa adanya
 * 2. URL HTTP lama Supabase → return apa adanya (sementara, backward-compatible)
 * 3. null/empty → return null
 */
export async function resolveProofUrl(
  proofUrl: string | null | undefined,
): Promise<string | null> {
  if (!proofUrl) return null;
  return proofUrl;
}
