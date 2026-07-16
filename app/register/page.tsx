"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  signUp,
  type AuthState,
} from "@/lib/actions/auth";
import { PasswordInput } from "../_components/password-input";

const initialState: AuthState = {};

const inputClass =
  "w-full rounded-xl border border-input-border bg-card px-4 py-2 text-sm text-foreground outline-none transition placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand/20 sm:px-5 sm:py-3 sm:text-base";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-6 sm:py-12">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-sm sm:max-w-lg sm:p-9"
      >
        <h1 className="mb-5 text-center text-2xl font-bold text-brand sm:mb-7 sm:text-3xl">
          Daftar Akun
        </h1>

        <div className="space-y-2.5 sm:space-y-4">
          <div>
            <input
              type="text"
              name="kodeUndangan"
              placeholder="Kode Undangan"
              autoComplete="off"
              className={inputClass}
              required
            />
            {state.fieldErrors?.kodeUndangan?.[0] && (
              <p className="mt-1 text-xs text-rose-600">
                {state.fieldErrors.kodeUndangan[0]}
              </p>
            )}
          </div>
          <div>
            <input
              type="text"
              name="namaPengguna"
              placeholder="Nama Pengguna"
              autoComplete="username"
              className={inputClass}
              required
            />
            {state.fieldErrors?.namaPengguna?.[0] && (
              <p className="mt-1 text-xs text-rose-600">
                {state.fieldErrors.namaPengguna[0]}
              </p>
            )}
          </div>
          <div>
            <PasswordInput
              name="kataSandi"
              placeholder="Kata Sandi"
              autoComplete="new-password"
            />
            {state.fieldErrors?.kataSandi?.[0] && (
              <p className="mt-1 text-xs text-rose-600">
                {state.fieldErrors.kataSandi[0]}
              </p>
            )}
          </div>
          <div>
            <PasswordInput
              name="konfirmasiSandi"
              placeholder="Konfirmasi Sandi"
              autoComplete="new-password"
            />
            {state.fieldErrors?.konfirmasiSandi?.[0] && (
              <p className="mt-1 text-xs text-rose-600">
                {state.fieldErrors.konfirmasiSandi[0]}
              </p>
            )}
          </div>
          <div>
            <PasswordInput
              name="sandiPenarikan"
              placeholder="Sandi Penarikan"
              autoComplete="off"
            />
            {state.fieldErrors?.sandiPenarikan?.[0] && (
              <p className="mt-1 text-xs text-rose-600">
                {state.fieldErrors.sandiPenarikan[0]}
              </p>
            )}
          </div>
          <div>
            <PasswordInput
              name="konfirmasiSandiPenarikan"
              placeholder="Konfirmasi Sandi Penarikan"
              autoComplete="off"
            />
            {state.fieldErrors?.konfirmasiSandiPenarikan?.[0] && (
              <p className="mt-1 text-xs text-rose-600">
                {state.fieldErrors.konfirmasiSandiPenarikan[0]}
              </p>
            )}
          </div>
        </div>

        {state.error && (
          <p className="mt-3 text-center text-xs font-medium text-rose-600 sm:mt-4 sm:text-sm">
            {state.error}
          </p>
        )}

        <div className="mt-5 sm:mt-7">
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:brightness-95 active:brightness-90 disabled:opacity-60 sm:px-5 sm:py-3 sm:text-base sm:font-bold"
          >
            {isPending ? "Memproses..." : "Daftar Sekarang"}
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
