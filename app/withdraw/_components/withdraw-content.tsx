"use client";

import { useActionState, useState } from "react";
import { Landmark, ShieldCheck } from "lucide-react";
import Link from "next/link";

import {
  submitWithdrawal,
  type WithdrawState,
} from "@/lib/actions/withdrawals";

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm";

const labelClass = "text-xs font-semibold text-emerald-700 sm:text-sm";

const initialState: WithdrawState = {};

type Bank = {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isPrimary: boolean;
};

function formatRupiah(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  return "Rp " + num.toLocaleString("id-ID");
}

type Props = {
  username: string;
  balance: string;
  frozenBalance: string;
  banks: Bank[];
};

export function WithdrawContent({
  username,
  balance,
  frozenBalance,
  banks,
}: Props) {
  const [state, formAction, isPending] = useActionState(
    submitWithdrawal,
    initialState,
  );
  const [amount, setAmount] = useState("");
  const [bankId, setBankId] = useState<string>(
    banks.find((b) => b.isPrimary)?.id?.toString() ??
      banks[0]?.id?.toString() ??
      "",
  );

  if (state.success) {
    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-zinc-200/60 sm:p-6">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:size-16">
            <ShieldCheck className="size-7 sm:size-8" strokeWidth={1.8} />
          </div>
          <h2 className="mt-3 text-sm font-bold text-zinc-900 sm:text-base">
            Pengajuan Berhasil Dikirim
          </h2>
          <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
            Penarikan Anda sedang menunggu persetujuan admin. Saldo akan
            ditransfer ke rekening setelah disetujui.
          </p>
          <a
            href="/profil/withdrawlist"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 sm:text-sm"
          >
            Lihat Riwayat
          </a>
        </div>
      </div>
    );
  }

  if (banks.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-emerald-600 p-4 text-center text-white shadow-sm sm:p-5">
          <p className="text-2xl font-bold tracking-tight sm:text-3xl">
            {formatRupiah(balance)}
          </p>
          <p className="mt-1 text-xs text-white/85 sm:text-sm">Saldo Akun</p>
        </div>
        <div className="overflow-hidden rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-zinc-200/60 sm:p-6">
          <p className="text-sm font-semibold text-zinc-900 sm:text-base">
            Belum ada rekening
          </p>
          <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
            Tambahkan rekening tujuan penarikan terlebih dahulu.
          </p>
          <Link
            href="/bank"
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 sm:text-sm"
          >
            <Landmark className="size-4" />
            Tambah Rekening
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-emerald-600 p-4 text-center text-white shadow-sm sm:p-5">
        <p className="text-2xl font-bold tracking-tight sm:text-3xl">
          {formatRupiah(balance)}
        </p>
        <p className="mt-1 text-xs text-white/85 sm:text-sm">Saldo Akun</p>
        {Number(frozenBalance) > 0 && (
          <p className="mt-1 text-[11px] text-white/75 sm:text-xs">
            (Dicairkan: {formatRupiah(frozenBalance)})
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <div className="border-l-4 border-l-emerald-500 px-4 py-2.5 sm:px-5 sm:py-3">
          <h2 className="text-xs font-bold text-zinc-900 sm:text-sm">
            Informasi Akun
          </h2>
        </div>
        <div className="space-y-1 px-4 py-3.5 text-xs text-zinc-700 sm:px-5 sm:py-4 sm:text-sm">
          <p>
            Username:{" "}
            <span className="font-semibold text-zinc-900">{username}</span>
          </p>
          <p>
            Rekening:{" "}
            <span className="font-semibold text-zinc-900">
              {banks.find((b) => b.id.toString() === bankId)?.bankName} -{" "}
              {banks.find((b) => b.id.toString() === bankId)?.accountNumber}
            </span>
          </p>
        </div>
      </div>

      <form
        action={formAction}
        className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60"
      >
        <div className="border-l-4 border-l-emerald-500 px-4 py-2.5 sm:px-5 sm:py-3">
          <h2 className="text-xs font-bold text-zinc-900 sm:text-sm">
            Jumlah Penarikan
          </h2>
        </div>

        <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
          <div>
            <label className={`mb-1 block ${labelClass}`}>
              Rekening Tujuan
            </label>
            <select
              name="bankAccountId"
              value={bankId}
              onChange={(e) => setBankId(e.target.value)}
              className={inputClass}
            >
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} - {b.accountNumber} (a.n {b.accountName})
                  {b.isPrimary ? " • Utama" : ""}
                </option>
              ))}
            </select>
            {state.fieldErrors?.bankAccountId?.[0] && (
              <p className="mt-1 text-xs text-rose-600">
                {state.fieldErrors.bankAccountId[0]}
              </p>
            )}
          </div>

          <div>
            <label className={`mb-1 block ${labelClass}`}>
              Jumlah Penarikan
            </label>
            <input
              name="amount"
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value.replace(/[^\d]/g, ""))
              }
              placeholder="cth: 150000"
              className={inputClass}
            />
            {state.fieldErrors?.amount?.[0] && (
              <p className="mt-1 text-xs text-rose-600">
                {state.fieldErrors.amount[0]}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="withdraw-password"
              className={`mb-1 block ${labelClass}`}
            >
              Kata Sandi Penarikan
            </label>
            <input
              id="withdraw-password"
              name="withdrawPassword"
              type="password"
              placeholder="Kata sandi penarikan"
              className={inputClass}
            />
            {state.fieldErrors?.withdrawPassword?.[0] && (
              <p className="mt-1 text-xs text-rose-600">
                {state.fieldErrors.withdrawPassword[0]}
              </p>
            )}
          </div>

          {state.error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 sm:text-sm">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 sm:py-3 sm:text-sm"
          >
            <ShieldCheck className="size-4" />
            {isPending ? "Mengirim..." : "Kirimkan"}
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
