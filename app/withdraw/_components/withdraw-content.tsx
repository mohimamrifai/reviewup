"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm";

const labelClass = "text-xs font-semibold text-emerald-700 sm:text-sm";

export function WithdrawContent() {
  const [amount, setAmount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount.trim() || !password.trim()) {
      setError("Jumlah dan kata sandi penarikan wajib diisi.");
      return;
    }
    if (!/^\d+$/.test(amount.trim())) {
      setError("Jumlah penarikan harus berupa angka tanpa titik atau koma.");
      return;
    }
    setError(null);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-emerald-600 p-4 text-center text-white shadow-sm sm:p-5">
        <p className="text-2xl font-bold tracking-tight sm:text-3xl">
          Rp 35.900
        </p>
        <p className="mt-1 text-xs text-white/85 sm:text-sm">Saldo Akun</p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <div className="border-l-4 border-l-emerald-500 px-4 py-2.5 sm:px-5 sm:py-3">
          <h2 className="text-xs font-bold text-zinc-900 sm:text-sm">
            Informasi Akun
          </h2>
        </div>
        <div className="space-y-1 px-4 py-3.5 text-xs text-zinc-700 sm:px-5 sm:py-4 sm:text-sm">
          <p>
            Username: <span className="font-semibold text-zinc-900">Testfs</span>
          </p>
          <p>Belum ada rekening yang disimpan.</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60"
      >
        <div className="border-l-4 border-l-emerald-500 px-4 py-2.5 sm:px-5 sm:py-3">
          <h2 className="text-xs font-bold text-zinc-900 sm:text-sm">
            Jumlah Penarikan
          </h2>
        </div>

        <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Jumlah penarikan"
            className={inputClass}
          />

          <div>
            <label
              htmlFor="withdraw-password"
              className={`mb-1 block ${labelClass}`}
            >
              Kata Sandi Penarikan
            </label>
            <input
              id="withdraw-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kata sandi penarikan"
              className={inputClass}
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-rose-600 sm:text-sm">
              {error}
            </p>
          )}

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
          Catatan Penting
        </h3>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] text-emerald-900 sm:pl-5 sm:text-xs">
          <li>
            Masukkan nominal penarikan dalam angka, tanpa menggunakan tanda
            titik, koma, atau simbol lainnya. Contoh: 150000.
          </li>
          <li>
            Gunakan kata sandi penarikan khusus yang telah Anda buat, bukan
            kata sandi login akun.
          </li>
          <li>
            Pastikan informasi rekening bank yang Anda gunakan sudah benar dan
            sesuai.
          </li>
          <li>
            Jika mengalami kendala atau pertanyaan, silakan hubungi layanan
            pelanggan kami untuk mendapatkan bantuan.
          </li>
        </ol>
      </div>
    </div>
  );
}
