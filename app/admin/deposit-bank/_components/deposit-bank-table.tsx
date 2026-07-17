"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import {
  addDepositBankAccount,
  deleteDepositBankAccount,
  toggleDepositBankAccountActive,
  updateDepositBankAccount,
  type DepositBankAccountState,
} from "@/lib/actions/deposit-bank-accounts";

type Account = {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  notes: string | null;
  isActive: boolean;
};

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

const initialState: DepositBankAccountState = {};

function useModalLifecycle(onClose: () => void) {
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
}

function AccountFormModal({
  account,
  onClose,
  onSaved,
}: {
  account: Account | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [state, action] = useActionState(
    account ? updateDepositBankAccount : addDepositBankAccount,
    initialState,
  );
  const [pending, startTransition] = useTransition();
  const skipFirstRun = useRef(true);

  useEffect(() => {
    if (skipFirstRun.current) {
      skipFirstRun.current = false;
      return;
    }
    if (state.success && state.message) onSaved(state.message);
  }, [state, onSaved]);

  useModalLifecycle(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={account ? "Edit rekening" : "Tambah rekening"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <form
        action={(fd) => startTransition(() => action(fd))}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            {account ? "Edit Rekening" : "Tambah Rekening Tujuan"}
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
          {account && <input type="hidden" name="accountId" value={account.id} />}

          <div>
            <label htmlFor="bankName" className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
              Nama Bank
            </label>
            <input
              id="bankName"
              name="bankName"
              type="text"
              required
              maxLength={60}
              defaultValue={account?.bankName ?? ""}
              placeholder="cth: Bank MNC"
              disabled={pending}
              className={inputClass}
            />
            {state.fieldErrors?.bankName?.[0] && (
              <p className="mt-1 text-[11px] text-rose-600 sm:text-xs">
                {state.fieldErrors.bankName[0]}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="accountName" className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
              Nama Pemilik
            </label>
            <input
              id="accountName"
              name="accountName"
              type="text"
              required
              maxLength={80}
              defaultValue={account?.accountName ?? ""}
              placeholder="a.n ..."
              disabled={pending}
              className={inputClass}
            />
            {state.fieldErrors?.accountName?.[0] && (
              <p className="mt-1 text-[11px] text-rose-600 sm:text-xs">
                {state.fieldErrors.accountName[0]}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="accountNumber" className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
              Nomor Rekening
            </label>
            <input
              id="accountNumber"
              name="accountNumber"
              type="text"
              required
              maxLength={40}
              defaultValue={account?.accountNumber ?? ""}
              placeholder="cth: 1234567890"
              disabled={pending}
              className={`${inputClass} font-mono tracking-wider`}
            />
            {state.fieldErrors?.accountNumber?.[0] && (
              <p className="mt-1 text-[11px] text-rose-600 sm:text-xs">
                {state.fieldErrors.accountNumber[0]}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
              Catatan (opsional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              maxLength={200}
              defaultValue={account?.notes ?? ""}
              placeholder="cth: Transfer sebelum jam 3 sore"
              disabled={pending}
              className={inputClass}
            />
          </div>

          {state.error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-50 sm:text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:text-sm"
            >
              {pending && <Loader2 className="size-3 animate-spin" />}
              {account ? "Simpan" : "Tambah"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function DeleteAccountModal({
  account,
  onClose,
  onDeleted,
}: {
  account: Account;
  onClose: () => void;
  onDeleted: (msg: string) => void;
}) {
  const [state, action] = useActionState(deleteDepositBankAccount, initialState);
  const [pending, startTransition] = useTransition();
  const skipFirstRun = useRef(true);

  useEffect(() => {
    if (skipFirstRun.current) {
      skipFirstRun.current = false;
      return;
    }
    if (state.success && state.message) onDeleted(state.message);
  }, [state, onDeleted]);

  useModalLifecycle(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Hapus rekening"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-bold text-rose-700 sm:text-base">
          Hapus Rekening?
        </h2>
        <p className="mt-2 text-xs text-zinc-700 sm:text-sm">
          Anda akan menghapus rekening{" "}
          <strong>
            {account.bankName} - {account.accountNumber}
          </strong>{" "}
          a.n {account.accountName}.
        </p>

        <form
          action={(fd) => startTransition(() => action(fd))}
          className="mt-4"
        >
          <input type="hidden" name="accountId" value={account.id} />

          {state.error && (
            <p className="mb-3 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-50 sm:text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50 sm:text-sm"
            >
              {pending && <Loader2 className="size-3 animate-spin" />}
              <Trash2 className="size-3" />
              Hapus
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ToggleActiveButton({ account }: { account: Account }) {
  const [state, action] = useActionState(
    toggleDepositBankAccountActive,
    initialState,
  );
  const [pending, startTransition] = useTransition();

  function onToggle() {
    const fd = new FormData();
    fd.set("accountId", String(account.id));
    startTransition(() => action(fd));
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition disabled:opacity-50 sm:text-[11px] ${
        account.isActive
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
      }`}
    >
      {pending && <Loader2 className="size-3 animate-spin" />}
      {account.isActive ? "Aktif" : "Non-aktif"}
    </button>
  );
}

export function DepositBankTable({ initialAccounts }: { initialAccounts: Account[] }) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.bankName.toLowerCase().includes(q) ||
        a.accountName.toLowerCase().includes(q) ||
        a.accountNumber.includes(q),
    );
  }, [accounts, query]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari bank / nomor / pemilik..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${inputClass} pl-8`}
            />
          </div>
          <span className="text-xs text-zinc-500 sm:ml-auto sm:text-sm">
            {filtered.length} dari {accounts.length} rekening
          </span>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 sm:text-sm"
          >
            <Plus className="size-3.5" />
            Tambah Rekening
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={headerCellClass}>Bank</th>
              <th className={headerCellClass}>Pemilik</th>
              <th className={headerCellClass}>No. Rekening</th>
              <th className={headerCellClass}>Catatan</th>
              <th className={headerCellClass}>Status</th>
              <th className={headerCellClass}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  {accounts.length === 0
                    ? "Belum ada rekening tujuan. Tambahkan rekening untuk ditampilkan ke member."
                    : "Tidak ada rekening yang cocok."}
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-zinc-200 transition hover:bg-zinc-50/60"
                >
                  <td className={`${cellClass} font-medium text-zinc-900`}>
                    {a.bankName}
                  </td>
                  <td className={cellClass}>{a.accountName}</td>
                  <td className={`${cellClass} font-mono tabular-nums`}>
                    {a.accountNumber}
                  </td>
                  <td className={cellClass}>
                    {a.notes ?? <span className="text-zinc-400">—</span>}
                  </td>
                  <td className={cellClass}>
                    <ToggleActiveButton account={a} />
                  </td>
                  <td className={`${cellClass} whitespace-nowrap text-right`}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        aria-label={`Edit ${a.bankName}`}
                        onClick={() => setEditing(a)}
                        className="inline-flex items-center justify-center gap-1 rounded-md bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-200"
                      >
                        <Pencil className="size-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        aria-label={`Hapus ${a.bankName}`}
                        onClick={() => setDeleting(a)}
                        className="inline-flex items-center justify-center gap-1 rounded-md bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-200"
                      >
                        <Trash2 className="size-3" />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <AccountFormModal
          account={null}
          onClose={() => setCreating(false)}
          onSaved={(msg) => {
            setCreating(false);
            setToast({ type: "success", text: msg });
            window.location.reload();
          }}
        />
      )}

      {editing && (
        <AccountFormModal
          account={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            setToast({ type: "success", text: msg });
            window.location.reload();
          }}
        />
      )}

      {deleting && (
        <DeleteAccountModal
          account={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={(msg) => {
            setDeleting(null);
            setAccounts((cur) => cur.filter((a) => a.id !== deleting.id));
            setToast({ type: "success", text: msg });
          }}
        />
      )}

      {toast && (
        <div
          role="status"
          className={`fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-md px-4 py-2 text-xs font-medium shadow-lg sm:text-sm ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
          onClick={() => setToast(null)}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
