"use client";

import { useActionState, useEffect, useTransition } from "react";
import { Loader2, X } from "lucide-react";

import { assignProduct } from "@/lib/actions/tasks-admin";

import {
  initialAssignState,
  inputClass,
  useModalEscape,
  type ProductOption,
  type Task,
} from "./task-shared";

export function AssignProductModal({
  task,
  products,
  onClose,
  onAssigned,
}: {
  task: Task;
  products: ProductOption[];
  onClose: () => void;
  onAssigned: (msg: string) => void;
}) {
  const [state, action] = useActionState(assignProduct, initialAssignState);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state === initialAssignState) return;
    if (state.success && state.message) {
      onAssigned(state.message);
    }
  }, [state, onAssigned]);

  useModalEscape(onClose);

  const activeProducts = products.filter((p) => p.isActive);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pilih produk untuk request #${task.id}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
              Pilih Produk untuk Request #{task.id}
            </h2>
            <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">
              Untuk anggota @{task.memberUsername}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="size-4" />
          </button>
        </div>

        {activeProducts.length === 0 ? (
          <div className="rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800 sm:text-xs">
            Belum ada produk aktif. Tambahkan produk dulu di halaman{" "}
            <strong>Produk</strong>.
          </div>
        ) : (
          <form
            action={(fd) => {
              fd.set("taskId", String(task.id));
              startTransition(() => action(fd));
            }}
            className="space-y-3"
          >
            <div>
              <label
                htmlFor="productId"
                className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
              >
                Produk
              </label>
              <select
                id="productId"
                name="productId"
                required
                defaultValue=""
                disabled={pending}
                className={inputClass}
              >
                <option value="" disabled>
                  Pilih produk...
                </option>
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="price"
                className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
              >
                Harga (Rp)
              </label>
              <input
                id="price"
                name="price"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                required
                placeholder="cth: 50000"
                disabled={pending}
                className={inputClass}
              />
              <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                Komisi dihitung otomatis berdasar level anggota (Classic 20%,
                Silver 30%, Gold 35%, Platinum 40%, Diamond 45%, Premier 50%).
              </p>
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
                Pilih Produk
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
