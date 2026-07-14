"use client";

import { useState } from "react";
import Link from "next/link";
import { PasswordInput } from "../_components/password-input";

const inputClass =
  "w-full rounded-xl border border-input-border bg-card px-4 py-2 text-sm text-foreground outline-none transition placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand/20 sm:px-5 sm:py-3 sm:text-base";

export default function RegisterPage() {
  const [kodeUndangan, setKodeUndangan] = useState("");
  const [namaPengguna, setNamaPengguna] = useState("");
  const [kataSandi, setKataSandi] = useState("");
  const [konfirmasiSandi, setKonfirmasiSandi] = useState("");
  const [sandiPenarikan, setSandiPenarikan] = useState("");
  const [konfirmasiSandiPenarikan, setKonfirmasiSandiPenarikan] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-6 sm:py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-sm sm:max-w-lg sm:p-9"
      >
        <h1 className="mb-5 text-center text-2xl font-bold text-brand sm:mb-7 sm:text-3xl">
          Daftar Akun
        </h1>

        <div className="space-y-2.5 sm:space-y-4">
          <input
            type="text"
            name="kodeUndangan"
            placeholder="Kode Undangan"
            value={kodeUndangan}
            onChange={(e) => setKodeUndangan(e.target.value)}
            autoComplete="off"
            className={inputClass}
          />
          <input
            type="text"
            name="namaPengguna"
            placeholder="Nama Pengguna"
            value={namaPengguna}
            onChange={(e) => setNamaPengguna(e.target.value)}
            autoComplete="username"
            className={inputClass}
          />
          <PasswordInput
            name="kataSandi"
            placeholder="Kata Sandi"
            value={kataSandi}
            onChange={(e) => setKataSandi(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordInput
            name="konfirmasiSandi"
            placeholder="Konfirmasi Sandi"
            value={konfirmasiSandi}
            onChange={(e) => setKonfirmasiSandi(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordInput
            name="sandiPenarikan"
            placeholder="Sandi Penarikan"
            value={sandiPenarikan}
            onChange={(e) => setSandiPenarikan(e.target.value)}
            autoComplete="off"
          />
          <PasswordInput
            name="konfirmasiSandiPenarikan"
            placeholder="Konfirmasi Sandi Penarikan"
            value={konfirmasiSandiPenarikan}
            onChange={(e) => setKonfirmasiSandiPenarikan(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="mt-5 sm:mt-7">
          <button
            type="submit"
            className="w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:brightness-95 active:brightness-90 sm:px-5 sm:py-3 sm:text-base sm:font-bold"
          >
            Daftar Sekarang
          </button>
        </div>

        <p className="mt-3 text-center text-sm text-brand sm:mt-4 sm:text-base">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold hover:underline">
            Masuk
          </Link>
        </p>
      </form>
    </div>
  );
}
