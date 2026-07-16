"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { ImageIcon, Package, Plus, Save, Search, Trash2, X } from "lucide-react";

import {
  createProduct,
  deleteProduct,
  updateProduct,
  type ProductState,
} from "@/lib/actions/products";

import { Pagination } from "./pagination";

type Product = {
  id: number;
  name: string;
  imageUrl: string | null;
  price: string;
  isActive: boolean;
};

const ITEMS_PER_PAGE = 6;
const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";
const labelClass = "text-xs font-semibold text-zinc-900 sm:text-sm";
const initialState: ProductState = {};

function formatRupiah(n: string | number): string {
  const num = typeof n === "string" ? Number(n) : n;
  return `Rp ${num.toLocaleString("id-ID")}`;
}

export function ProductsTable({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <>
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center justify-center gap-1.5 self-start rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800 sm:text-sm"
          >
            <Plus className="size-4" />
            Tambah Produk
          </button>
          <input
            type="text"
            placeholder="Cari produk..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className={`${inputClass} sm:w-64`}
          />
        </div>

        <div className="border-t border-zinc-200">
          <table className="w-full border-collapse">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                  Gambar
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                  Nama Produk
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                  Harga
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-xs text-zinc-500 sm:text-sm"
                  >
                    {products.length === 0
                      ? "Belum ada produk. Klik \"Tambah Produk\" untuk mulai."
                      : "Tidak ada produk yang cocok."}
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-zinc-200 transition hover:bg-zinc-50/60"
                  >
                    <td className="px-3 py-2 sm:px-4 sm:py-3">
                      {p.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="h-12 w-12 rounded-md object-cover ring-1 ring-zinc-200/60"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100 ring-1 ring-zinc-200/60">
                          <Package className="size-5 text-zinc-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm">
                      {p.name}
                    </td>
                    <td className="px-3 py-2 text-xs font-medium text-zinc-900 sm:px-4 sm:py-3 sm:text-sm">
                      {formatRupiah(p.price)}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs ${
                          p.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {p.isActive ? "Aktif" : "Non-aktif"}
                      </span>
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-3">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => setEditing(p)}
                          className="rounded-md bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-200"
                        >
                          Edit
                        </button>
                        <DeleteButton
                          id={p.id}
                          onDeleted={() =>
                            setProducts((cur) => cur.filter((x) => x.id !== p.id))
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-zinc-200 p-3 sm:flex-row sm:p-4">
          <span className="text-xs text-zinc-500 sm:text-sm">
            Menampilkan {paginated.length === 0 ? 0 : startIndex + 1}–
            {startIndex + paginated.length} dari {filtered.length} produk
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {creating && (
        <ProductFormModal
          mode="create"
          onClose={() => setCreating(false)}
          onSaved={(p) => {
            setProducts((cur) => [p, ...cur]);
            setCreating(false);
          }}
        />
      )}
      {editing && (
        <ProductFormModal
          mode="edit"
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={(p) => {
            setProducts((cur) => cur.map((x) => (x.id === p.id ? p : x)));
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function DeleteButton({
  id,
  onDeleted,
}: {
  id: number;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  function handleDelete() {
    const fd = new FormData();
    fd.set("id", String(id));
    startTransition(async () => {
      await deleteProduct({}, fd);
      onDeleted();
    });
  }

  if (confirm) {
    return (
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-rose-700 disabled:opacity-60"
        >
          {isPending ? "..." : "Yakin?"}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200"
        >
          Batal
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      className="rounded-md bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-200"
    >
      Hapus
    </button>
  );
}

function ProductFormModal({
  mode,
  product,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  product?: Product;
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    mode === "create" ? createProduct : updateProduct,
    initialState,
  );

  // After successful save, parent should close & update list. We rely on the
  // revalidation done server-side; modal stays until user dismisses.
  return (
    <ModalShell
      title={mode === "create" ? "Tambah Produk" : "Edit Produk"}
      onClose={onClose}
    >
      <form
        action={async (fd) => {
          await formAction(fd);
          // Optimistically resolve by reading state (server returns fieldErrors or empty)
          // We let parent decide via revalidatePath; here we close & pass optimistic data.
          if (mode === "create") {
            onSaved({
              id: Date.now(), // temporary id, real list will refresh via revalidate
              name: String(fd.get("name") ?? ""),
              imageUrl: String(fd.get("imageUrl") ?? "") || null,
              price: String(fd.get("price") ?? "0"),
              isActive: fd.get("isActive") === "on",
            });
          } else if (product) {
            onSaved({
              ...product,
              name: String(fd.get("name") ?? product.name),
              imageUrl: String(fd.get("imageUrl") ?? "") || product.imageUrl,
              price: String(fd.get("price") ?? product.price),
              isActive: fd.get("isActive") === "on",
            });
          }
        }}
        className="space-y-3"
      >
        {mode === "edit" && <input type="hidden" name="id" value={product?.id} />}

        <Field
          label="Nama Produk"
          name="name"
          defaultValue={product?.name}
          error={state.fieldErrors?.name?.[0]}
        />
        <Field
          label="Harga (Rp)"
          name="price"
          inputMode="numeric"
          defaultValue={
            product ? String(Math.round(Number(product.price))) : ""
          }
          error={state.fieldErrors?.price?.[0]}
        />
        <Field
          label="URL Gambar"
          name="imageUrl"
          defaultValue={product?.imageUrl ?? ""}
          placeholder="https://..."
          error={state.fieldErrors?.imageUrl?.[0]}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={product?.isActive ?? true}
            className="size-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className={labelClass}>Aktif</span>
        </label>

        {state.error && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 sm:text-sm">
            {state.error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60 sm:text-sm"
          >
            <Save className="size-3.5" />
            {isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </ModalShell>
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
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  inputMode?: "numeric" | "text";
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
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
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
