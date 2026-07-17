"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Landmark, MoreVertical, Pencil, Plus, Save, Star, Trash2, X } from "lucide-react";

import {
  addBankAccount,
  deleteBankAccount,
  setPrimaryBankAccount,
  updateBankAccount,
  type BankAccountState,
} from "@/lib/actions/bank-accounts";
import { useToast } from "@/app/_components/toast";

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm";

const labelClass = "text-xs font-semibold text-zinc-900 sm:text-sm";

type Bank = {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  backupPhone: string | null;
  isPrimary: boolean;
};

const initialState: BankAccountState = {};

export function BankContent({ banks: initialBanks }: { banks: Bank[] }) {
  const [menuId, setMenuId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Bank | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        {initialBanks.length === 0 ? (
          <div className="px-4 py-3.5 text-xs text-zinc-700 sm:px-5 sm:py-4 sm:text-sm">
            Belum ada informasi penarikan.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {initialBanks.map((b, idx) => (
              <li
                key={b.id}
                className={`flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4 ${
                  idx === 0 ? "rounded-t-2xl" : ""
                }${idx === initialBanks.length - 1 ? " rounded-b-2xl" : ""}`}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:size-11">
                  <Landmark className="size-4 sm:size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-zinc-900 sm:text-base">
                      {b.bankName} - {b.accountNumber}
                    </p>
                    {b.isPrimary && (
                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        <Star className="size-2.5 fill-current" />
                        Utama
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-zinc-500 sm:text-xs">
                    a.n {b.accountName}
                  </p>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setMenuId((cur) => (cur === b.id ? null : b.id))
                    }
                    aria-label="Menu rekening"
                    className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                  {menuId === b.id && (
                    <div
                      className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setMenuId(null);
                          setEditing(b);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-700 transition hover:bg-zinc-50 sm:text-sm"
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </button>
                      {!b.isPrimary && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuId(null);
                            const fd = new FormData();
                            fd.set("id", String(b.id));
                            startPrimary(fd);
                          }}
                          className="flex w-full items-center gap-2 border-t border-zinc-100 px-3 py-2 text-left text-xs text-zinc-700 transition hover:bg-zinc-50 sm:text-sm"
                        >
                          <Star className="size-3.5" />
                          Jadikan Utama
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMenuId(null);
                          setDeleteId(b.id);
                        }}
                        className="flex w-full items-center gap-2 border-t border-zinc-100 px-3 py-2 text-left text-xs text-rose-600 transition hover:bg-rose-50 sm:text-sm"
                      >
                        <Trash2 className="size-3.5" />
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => setAdding(true)}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:bg-emerald-800 sm:py-3 sm:text-sm"
      >
        <Plus className="size-4" />
        Menambahkan
      </button>

      {adding && (
        <BankFormModal
          mode="create"
          onClose={() => setAdding(false)}
        />
      )}

      {editing && (
        <BankFormModal
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
        />
      )}

      {deleteId !== null && (
        <DeleteConfirm
          id={deleteId}
          onCancel={() => setDeleteId(null)}
          onDeleted={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

function BankFormModal({
  mode,
  initial,
  onClose,
}: {
  mode: "create" | "edit";
  initial?: Bank;
  onClose: () => void;
}) {
  const action = mode === "create" ? addBankAccount : updateBankAccount;
  const [state, formAction, isPending] = useActionState(action, initialState);

  // Tutup modal HANYA setelah action return nilai baru (bukan initial mount).
  // Cek via reference equality: `state === initialState` artinya action belum pernah dipanggil.
  // Aman terhadap React StrictMode (yang double-invoke effect di dev) karena
  // reference `initialState` stabil di setiap render.
  useEffect(() => {
    if (state === initialState) return;
    if (isPending) return;
    if (state.error || state.fieldErrors) return;
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, state]);

  return (
    <ModalShell
      onClose={onClose}
      title={mode === "create" ? "Tambah Rekening" : "Edit Rekening"}
    >
      <form
        action={(fd) => {
          if (mode === "edit" && initial) fd.set("id", String(initial.id));
          formAction(fd);
        }}
        className="space-y-3"
      >
        <BankFormFields state={state} initial={initial} />
        <ModalActions
          onCancel={onClose}
          isPending={isPending}
          submitLabel={mode === "create" ? "Simpan" : "Perbarui"}
        />
      </form>
    </ModalShell>
  );
}

function DeleteConfirm({
  id,
  onCancel,
  onDeleted,
}: {
  id: number;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const [, startTransition] = useTransition();
  const { show } = useToast();

  function handleDelete() {
    const fd = new FormData();
    fd.set("id", String(id));
    startTransition(async () => {
      const res = await deleteBankAccount({}, fd);
      if (res.error) {
        show(res.error, "error");
        return;
      }
      show("Rekening dihapus.", "success");
      onDeleted();
    });
  }

  return (
    <ModalShell onClose={onCancel} title="Hapus Rekening">
      <p className="text-xs text-zinc-700 sm:text-sm">
        Yakin ingin menghapus rekening ini? Tindakan ini tidak dapat dibatalkan.
      </p>
      <ModalActions
        onCancel={onCancel}
        onSubmit={handleDelete}
        submitLabel="Hapus"
        submitVariant="danger"
      />
    </ModalShell>
  );
}

function startPrimary(fd: FormData) {
  setPrimaryBankAccount({}, fd);
}

function ModalShell({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-5"
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            {title}
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
        {children}
      </div>
    </div>
  );
}

function BankFormFields({
  state,
  initial,
}: {
  state: BankAccountState;
  initial?: Bank;
}) {
  return (
    <div className="space-y-3">
      <Field
        label="Nama Bank"
        name="bankName"
        defaultValue={initial?.bankName}
        placeholder="cth: BCA, BNI, BRI"
        error={state.fieldErrors?.bankName?.[0]}
      />
      <Field
        label="Nama Pemilik"
        name="accountName"
        defaultValue={initial?.accountName}
        placeholder="Sesuai buku tabungan"
        error={state.fieldErrors?.accountName?.[0]}
      />
      <Field
        label="Nomor Rekening"
        name="accountNumber"
        defaultValue={initial?.accountNumber}
        placeholder="cth: 1234567890"
        inputMode="numeric"
        error={state.fieldErrors?.accountNumber?.[0]}
      />
      <Field
        label={
          <>
            Nomor Ponsel Cadangan{" "}
            <span className="font-normal text-zinc-500">(opsional)</span>
          </>
        }
        name="backupPhone"
        defaultValue={initial?.backupPhone ?? ""}
        placeholder="cth: 081234567890"
        inputMode="tel"
        error={state.fieldErrors?.backupPhone?.[0]}
      />
      {state.error && (
        <p className="text-xs font-medium text-rose-600 sm:text-sm">
          {state.error}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  inputMode,
  error,
}: {
  label: React.ReactNode;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  inputMode?: "numeric" | "tel" | "text";
  error?: string;
}) {
  return (
    <label className="block">
      <span className={`mb-1 block ${labelClass}`}>{label}</span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        inputMode={inputMode}
        className={inputClass}
      />
      {error && (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      )}
    </label>
  );
}

function ModalActions({
  onCancel,
  onSubmit,
  isPending,
  submitLabel,
  submitVariant = "primary",
}: {
  onCancel: () => void;
  onSubmit?: () => void;
  isPending?: boolean;
  submitLabel: string;
  submitVariant?: "primary" | "danger";
}) {
  const submitClass =
    submitVariant === "danger"
      ? "bg-rose-600 hover:bg-rose-700 active:bg-rose-800"
      : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800";

  if (onSubmit) {
    return (
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className={`inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white transition sm:text-sm ${submitClass}`}
        >
          <Save className="size-3.5" />
          {submitLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
      >
        Batal
      </button>
      <button
        type="submit"
        disabled={isPending}
        className={`inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-60 sm:text-sm ${submitClass}`}
      >
        <Save className="size-3.5" />
        {isPending ? "Menyimpan..." : submitLabel}
      </button>
    </div>
  );
}
