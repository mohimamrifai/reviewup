/**
 * Format angka sebagai mata uang Rupiah: "Rp 2.352.727".
 *
 * Single source of truth untuk format Rupiah di seluruh app.
 * Handles `number`, numeric `string`, `null`, `undefined`, dan empty string.
 *
 * @example
 *   formatRupiah(2_352_727)        // "Rp 2.352.727"
 *   formatRupiah("50000")          // "Rp 50.000"
 *   formatRupiah(null)             // "Rp -"
 *   formatRupiah(0)                // "Rp 0"
 *   formatRupiah(NaN)              // "Rp -"
 *
 * @param value - Nilai yang akan diformat
 * @param options.placeholder - Placeholder untuk null/undefined/empty/non-finite (default "Rp -")
 * @returns String berformat "Rp X.XXX.XXX" (atau placeholder)
 */
export function formatRupiah(
  value: number | string | null | undefined,
  options: { placeholder?: string } = {},
): string {
  const placeholder = options.placeholder ?? "Rp -";

  if (value === null || value === undefined || value === "") {
    return placeholder;
  }

  const num = typeof value === "string" ? Number(value) : value;

  if (!Number.isFinite(num)) {
    return placeholder;
  }

  return `Rp ${num.toLocaleString("id-ID")}`;
}
