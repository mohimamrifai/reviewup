"use client";

import { Copy, Landmark, ShieldCheck } from "lucide-react";

const bankInfo = {
  bank: "BANK MNC",
  accountNumber: "206010007263495",
  accountName: "VENDA FAISHA ANANTA",
};

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm";

const labelClass = "text-xs font-semibold text-zinc-900 sm:text-sm";

function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export function RechargeForm() {
  function handleCopy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(bankInfo.accountNumber).catch(() => {});
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:size-14">
            <Landmark className="size-5 sm:size-6" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-[10px] font-bold tracking-wider text-emerald-600 sm:text-xs">
              {bankInfo.bank}
            </p>
            <p className="mt-1 text-lg font-bold tracking-wide text-zinc-900 sm:text-xl">
              {bankInfo.accountNumber}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">
              a.n {bankInfo.accountName}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Salin nomor rekening"
            className="ml-auto inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 sm:size-10"
          >
            <Copy className="size-4 sm:size-5" />
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60"
      >
        <div className="border-b border-l-4 border-l-emerald-500 border-zinc-200 px-4 py-2.5 sm:px-5 sm:py-3">
          <h2 className="text-xs font-bold text-zinc-900 sm:text-sm">
            Formulir Isi Ulang
          </h2>
        </div>

        <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
          <div>
            <label
              htmlFor="amount"
              className={`mb-1 block ${labelClass}`}
            >
              Jumlah Isi Ulang
            </label>
            <input
              id="amount"
              type="text"
              placeholder="Minimal Rp 30.000"
              className={inputClass}
            />
            <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
              {formatRupiah(0)}
            </p>
          </div>

          <div>
            <label
              htmlFor="proof"
              className={`mb-1 block ${labelClass}`}
            >
              Upload Bukti Transfer
            </label>
            <input
              id="proof"
              type="file"
              accept="image/*"
              className="block w-full text-xs text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 sm:text-sm sm:file:text-sm"
            />
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:bg-emerald-800 sm:py-3 sm:text-sm"
          >
            <ShieldCheck className="size-4" />
            Kirimkan
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl bg-emerald-50/70 p-4 ring-1 ring-emerald-200/60 sm:p-5">
        <h3 className="text-xs font-bold text-emerald-700 sm:text-sm">
          Panduan Isi Ulang:
        </h3>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] text-emerald-900 sm:pl-5 sm:text-xs">
          <li>Lakukan transfer ke rekening yang tertera.</li>
          <li>Masukkan nominal yang sesuai tanpa tanda titik.</li>
          <li>Unggah bukti transfer.</li>
          <li>
            Klik tombol <span className="font-bold">Kirimkan</span> untuk
            memproses isi ulang.
          </li>
          <li>Tunggu beberapa saat hingga isi ulang berhasil.</li>
        </ol>
      </div>
    </div>
  );
}
