"use client";

import { useMemo, useState } from "react";
import { Package, Plus, Search } from "lucide-react";

import { Pagination } from "./pagination";

type Product = {
  id: number;
  name: string;
  price: number;
};

const initialProducts: Product[] = [
  {
    id: 1,
    name: "Genset Perkins 30KVA Mobile Type (HT30P) - Hartech",
    price: 30052544,
  },
  {
    id: 2,
    name: "Sulwhasoo First Care Activating Serum 60ml - Review SOCO by Sociolla",
    price: 1200000,
  },
  {
    id: 3,
    name: "✨ SPECIAL PRICE ALERT! ✨ Produk viral SKINTIFIC lagi HEMAT BESAR ...",
    price: 181000,
  },
  {
    id: 4,
    name: "Jual EMINA Bright Stuff Face Wash 100ml || Sabun Muka Cerah ...",
    price: 31500,
  },
  {
    id: 5,
    name: "MOISTURIZER glad2glow, originote, EIM, SKINTIFIC, ELFORMULA ...",
    price: 35000,
  },
  {
    id: 6,
    name: "MOISTURIZER glad2glow, originote, EIM, SKINTIFIC, ELFORMULA ...",
    price: 29500,
  },
  {
    id: 7,
    name: "Genset Perkins 20KVA Silent Type (HT20P) - Hartech",
    price: 22450000,
  },
  {
    id: 8,
    name: "Wardah Lightening Day Cream 30ml - Pelembab Wajah ...",
    price: 27500,
  },
  {
    id: 9,
    name: "Skintific 5X Ceramide Barrier Repair Moisturizer 30g",
    price: 89000,
  },
  {
    id: 10,
    name: "Somethinc Niacinamide 10% + Moisture Sabun Cuci Muka 100ml",
    price: 64500,
  },
  {
    id: 11,
    name: "Avoskin Miraculous Refining Toner 100ml - Eksfoliasi Wajah",
    price: 135000,
  },
  {
    id: 12,
    name: "L'Oreal Paris Extraordinary Oil Serum 100ml - Hair Treatment",
    price: 158000,
  },
];

const ITEMS_PER_PAGE = 6;

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export function ProductsTable() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return initialProducts;
    return initialProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60">
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <button
          type="button"
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
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  Tidak ada produk yang cocok.
                </td>
              </tr>
            ) : (
              paginated.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-zinc-200 transition hover:bg-zinc-50/60"
                >
                  <td className="px-3 py-2 sm:px-4 sm:py-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-zinc-100 ring-1 ring-zinc-200/60">
                      <Package className="size-5 text-zinc-400" />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm">
                    {p.name}
                  </td>
                  <td className="px-3 py-2 text-xs font-medium text-zinc-900 sm:px-4 sm:py-3 sm:text-sm">
                    {formatRupiah(p.price)}
                  </td>
                  <td className="px-3 py-2 sm:px-4 sm:py-3">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        className="rounded-md bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-md bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-200"
                      >
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
  );
}
