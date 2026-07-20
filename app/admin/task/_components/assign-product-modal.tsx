"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";

import { assignProduct } from "@/lib/actions/tasks-admin";
import { formatRupiah } from "@/lib/format-rupiah";

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
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const activeProducts = useMemo(
    () => products.filter((p) => p.isActive),
    [products],
  );
  const selectedProduct = useMemo(
    () => activeProducts.find((p) => p.id === selectedId) ?? null,
    [activeProducts, selectedId],
  );

  // Filter berdasar query (case-insensitive substring match di nama).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeProducts;
    return activeProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [activeProducts, query]);

  // Tutup dropdown saat klik di luar wrapper.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Sync input dengan produk yang dipilih.
  useEffect(() => {
    if (selectedProduct) {
      // Sync query string dengan selectedProduct prop. Pola yang benar untuk
      // sinkronisasi state lokal dengan perubahan prop (uncontrolled-like UX).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery(selectedProduct.name);
    } else {
      setQuery("");
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (state === initialAssignState) return;
    if (state.success && state.message) {
      onAssigned(state.message);
    }
  }, [state, onAssigned]);

  useModalEscape(onClose);

  function pickProduct(id: number) {
    setSelectedId(id);
    setOpen(false);
  }

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
            <div ref={wrapperRef} className="relative">
              <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
                Produk
              </label>
              <input type="hidden" name="productId" value={selectedId ?? ""} />

              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  role="combobox"
                  aria-expanded={open}
                  aria-controls="product-listbox"
                  aria-autocomplete="list"
                  autoComplete="off"
                  placeholder="Cari produk..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                    // Kalau teks berubah manual, reset pilihan
                    if (
                      selectedProduct &&
                      e.target.value !== selectedProduct.name
                    ) {
                      setSelectedId(null);
                    }
                  }}
                  onFocus={() => setOpen(true)}
                  disabled={pending}
                  className={`${inputClass} pl-7 pr-8`}
                />
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  tabIndex={-1}
                  aria-label="Buka daftar produk"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-150 ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {open && (
                <ul
                  id="product-listbox"
                  role="listbox"
                  className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg"
                >
                  {filtered.length === 0 ? (
                    <li className="px-3 py-2 text-[11px] text-zinc-500 sm:text-xs">
                      Tidak ada produk cocok.
                    </li>
                  ) : (
                    filtered.map((p) => {
                      const isSelected = p.id === selectedId;
                      return (
                        <li
                          key={p.id}
                          role="option"
                          aria-selected={isSelected}
                          onMouseDown={(e) => {
                            // Pakai onMouseDown supaya klik tetap register
                            // sebelum input kehilangan fokus.
                            e.preventDefault();
                            pickProduct(p.id);
                          }}
                          className={`flex cursor-pointer items-center gap-2.5 border-b border-zinc-100 px-2.5 py-2 last:border-b-0 transition ${
                            isSelected
                              ? "bg-indigo-50"
                              : "hover:bg-zinc-50"
                          }`}
                        >
                          {p.imageUrl ? (
                            <Image
                              src={p.imageUrl}
                              alt=""
                              width={36}
                              height={36}
                              unoptimized
                              className="size-9 shrink-0 rounded object-cover ring-1 ring-zinc-200"
                            />
                          ) : (
                            <div className="flex size-9 shrink-0 items-center justify-center rounded bg-zinc-100 text-[10px] font-medium text-zinc-400 ring-1 ring-zinc-200">
                              {p.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-medium text-zinc-900 sm:text-sm">
                              {p.name}
                            </div>
                            <div className="text-[11px] text-zinc-500 sm:text-xs">
                              {formatRupiah(p.price)}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="size-3.5 shrink-0 text-indigo-600" />
                          )}
                        </li>
                      );
                    })
                  )}
                </ul>
              )}

              {!selectedProduct && query && !open && (
                <p className="mt-1 text-[11px] text-amber-600 sm:text-xs">
                  Pilih produk dari daftar.
                </p>
              )}
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
                disabled={pending || !selectedId}
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
