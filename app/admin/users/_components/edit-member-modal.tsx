"use client";

import { useEffect, useState } from "react";

const menus = [
  { key: "saldo", label: "Edit Saldo" },
  { key: "status", label: "Status Penarikan" },
  { key: "password-login", label: "Password Login" },
  { key: "password-penarikan", label: "Password Penarikan" },
] as const;

type MenuKey = (typeof menus)[number]["key"];

type Props = {
  username: string;
  onClose: () => void;
};

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const labelClass = "text-xs font-bold text-zinc-900 sm:text-sm";

export function EditMemberModal({ username, onClose }: Props) {
  const [active, setActive] = useState<MenuKey>("saldo");

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Edit anggota ${username}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-xl sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <div className="flex w-full flex-row gap-2 overflow-x-auto sm:w-44 sm:flex-col sm:overflow-visible">
            {menus.map((m) => {
              const isActive = active === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setActive(m.key)}
                  className={`whitespace-nowrap rounded-md px-3 py-2 text-xs font-medium transition sm:text-sm ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1">
            {active === "saldo" && <SaldoPanel />}
            {active === "status" && <StatusPanel />}
            {active === "password-login" && <PasswordLoginPanel />}
            {active === "password-penarikan" && (
              <PasswordPenarikanPanel />
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2 sm:mt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800 sm:text-sm"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

function SaldoPanel() {
  const [amount, setAmount] = useState("");
  return (
    <div className="space-y-2">
      <label className={`block ${labelClass}`}>(-) Untuk Mengurangi:</label>
      <input
        type="text"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

function StatusPanel() {
  const [locked, setLocked] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <div className="space-y-3">
      <label
        className={`flex cursor-pointer items-center gap-2 ${labelClass}`}
      >
        <input
          type="checkbox"
          checked={locked}
          onChange={(e) => setLocked(e.target.checked)}
          className="size-4 rounded border-zinc-300 text-indigo-600 accent-indigo-600 focus:ring-indigo-500"
        />
        Kunci Penarikan
      </label>
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Masukkan alasan penguncian"
        className={inputClass}
      />
    </div>
  );
}

function PasswordLoginPanel() {
  const [value, setValue] = useState("");
  return (
    <div className="space-y-2">
      <label className={`block ${labelClass}`}>Password Login:</label>
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Minimal 6 karakter"
        className={inputClass}
      />
    </div>
  );
}

function PasswordPenarikanPanel() {
  const [value, setValue] = useState("");
  return (
    <div className="space-y-2">
      <label className={`block ${labelClass}`}>Password Penarikan:</label>
      <input
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Minimal 6 karakter"
        className={inputClass}
      />
    </div>
  );
}
