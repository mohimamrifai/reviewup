function formatRupiah(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;

  if (!Number.isFinite(num)) {
    return "Rp 0";
  }

  return `Rp ${num.toLocaleString("id-ID")}`;
}

export default formatRupiah;