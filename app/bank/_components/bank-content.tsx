"use client";

import { useEffect, useState } from "react";
import { Landmark, Plus, Save, X } from "lucide-react";

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm";

const labelClass = "text-xs font-semibold text-zinc-900 sm:text-sm";

type Bank = {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
};

const initialBanks: Bank[] = [];

export function BankContent() {
  const [banks] = useState<Bank[]>(initialBanks);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        {banks.length === 0 ? (
          <div className="px-4 py-3.5 text-xs text-zinc-700 sm:px-5 sm:py-4 sm:text-sm">
            Belum ada informasi penarikan.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {banks.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:size-11">
                  <Landmark className="size-4 sm:size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900 sm:text-base">
                    {b.bankName} - {b.accountNumber}
                  </p>
                  <p className="truncate text-xs text-zinc-500 sm:text-xs">
                    a.n {b.accountName}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:bg-emerald-800 sm:py-3 sm:text-sm"
      >
        <Plus className="size-4" />
        Menambahkan
      </button>

      {open && <AddBankModal onClose={() => setOpen(false)} />}
    </div>
  );
}

function AddBankModal({ onClose }: { onClose: () => void }) {
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [backupPhone, setBackupPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bankName.trim() || !accountName.trim() || !accountNumber.trim()) {
      setError("Semua field wajib diisi.");
      return;
    }
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tambah rekening"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            Tambah Rekening
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className={`mb-1 block ${labelClass}`}>Nama Bank</span>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="cth: BCA, BNI, BRI"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={`mb-1 block ${labelClass}`}>Nama Pemilik</span>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Sesuai buku tabungan"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={`mb-1 block ${labelClass}`}>Nomor Rekening</span>
            <input
              type="text"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="cth: 1234567890"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className={`mb-1 block ${labelClass}`}>
              Nomor Ponsel Cadangan{" "}
              <span className="font-normal text-zinc-500">(opsional)</span>
            </span>
            <input
              type="tel"
              inputMode="numeric"
              value={backupPhone}
              onChange={(e) => setBackupPhone(e.target.value)}
              placeholder="cth: 081234567890"
              className={inputClass}
            />
          </label>

          {error && (
            <p className="text-xs font-medium text-rose-600 sm:text-sm">
              {error}
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 active:bg-emerald-800 sm:text-sm"
          >
            <Save className="size-3.5" />
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
