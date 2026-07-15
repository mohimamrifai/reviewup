"use client";

import { useState } from "react";

import { PasswordInput } from "../../../_components/password-input";

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm";

const labelClass =
  "mb-1 block text-xs font-semibold text-zinc-900 sm:text-sm";

type TabKey = "login" | "withdraw";

const TABS: { key: TabKey; label: string }[] = [
  { key: "login", label: "Kata sandi masuk" },
  { key: "withdraw", label: "Kata Sandi Penarikan" },
];

export function ChangePasswordContent() {
  const [tab, setTab] = useState<TabKey>("login");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);

    if (!current.trim() || !next.trim() || !confirm.trim()) {
      setError("Semua kolom wajib diisi.");
      return;
    }
    if (next.length < 6) {
      setError("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (next !== confirm) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    if (next === current) {
      setError("Kata sandi baru tidak boleh sama dengan kata sandi lama.");
      return;
    }

    setError(null);
    setSuccess(true);
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <>
      <div className="sticky top-[52px] z-20 border-b border-zinc-200 bg-white sm:top-[58px]">
        <div className="mx-auto flex max-w-2xl">
          {TABS.map(({ key, label }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setTab(key);
                  setError(null);
                  setSuccess(false);
                }}
                className={`relative flex-1 px-2 py-3 text-center text-xs font-medium transition sm:py-3.5 sm:text-sm ${
                  active
                    ? "text-emerald-600"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {label}
                {active && (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-emerald-500 sm:inset-x-6" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto max-w-2xl space-y-3 px-4 pt-8 pb-5 sm:px-6 sm:pt-10 sm:pb-6"
      >
        <div>
          <label htmlFor="current-password" className={labelClass}>
            Kata sandi lama
          </label>
          <PasswordInput
            id="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder=""
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="new-password" className={labelClass}>
            Kata sandi baru
          </label>
          <PasswordInput
            id="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder=""
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className={labelClass}>
            Konfirmasi sandi
          </label>
          <PasswordInput
            id="confirm-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder=""
            className={inputClass}
          />
        </div>

        {error && (
          <p className="text-xs font-medium text-rose-600 sm:text-sm">
            {error}
          </p>
        )}

        {success && (
          <p className="text-xs font-medium text-emerald-600 sm:text-sm">
            Kata sandi berhasil diubah.
          </p>
        )}

        <button
          type="submit"
          className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:bg-emerald-800 sm:py-3 sm:text-sm"
        >
          Kirimkan
        </button>
      </form>
    </>
  );
}
