"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { StatusBadge, type Status } from "./status-badge";

type Task = {
  id: number;
  member: string;
  product: string;
  price: number;
  commission: number;
  status: Status;
  balance: number;
  queue: number;
};

const initialTasks: Task[] = [
  {
    id: 1,
    member: "David",
    product: "Gelang Emas Wanita Dewasa Bangkok BK 8K 5.5gr",
    price: 38100,
    commission: 7620,
    status: "dipilih",
    balance: 37000,
    queue: 3,
  },
  {
    id: 2,
    member: "David",
    product: "Lanne Jewelry Gelang Kristal Semanggi Emas",
    price: 30000,
    commission: 6000,
    status: "selesai",
    balance: 37000,
    queue: 2,
  },
  {
    id: 3,
    member: "David",
    product: "Tirai foil biru muda / backdrop foil fringe curtain",
    price: 5000,
    commission: 1000,
    status: "selesai",
    balance: 37000,
    queue: 1,
  },
];

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const aksiHeaderClass =
  "sticky right-0 border-l border-zinc-200 bg-zinc-100 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:static sm:border-l-0 sm:px-4 sm:py-3 sm:text-xs";

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const selectClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

const aksiCellClass =
  "sticky right-0 border-l border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 group-hover:bg-zinc-50/60 sm:static sm:border-l-0 sm:bg-transparent sm:group-hover:bg-transparent sm:px-4 sm:py-3 sm:text-sm";

function formatNumber(n: number): string {
  return n.toLocaleString("id-ID");
}

export function TasksTable() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "">("");

  const filtered = initialTasks.filter((t) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      t.member.toLowerCase().includes(q) ||
      t.product.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Cari member / produk..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputClass} sm:w-64`}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | "")}
          className={`${selectClass} sm:w-40`}
        >
          <option value="">---</option>
          <option value="menunggu">Menunggu</option>
          <option value="dipilih">Dipilih</option>
          <option value="dikerjakan">Dikerjakan</option>
          <option value="selesai">Selesai</option>
        </select>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1.5 self-start rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800 sm:self-auto sm:text-sm"
        >
          <Search className="size-3.5" />
          Terapkan
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[860px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={headerCellClass}>No</th>
              <th className={headerCellClass}>Member</th>
              <th className={headerCellClass}>Produk</th>
              <th className={headerCellClass}>Harga</th>
              <th className={headerCellClass}>Komisi</th>
              <th className={headerCellClass}>Status</th>
              <th className={headerCellClass}>Saldo</th>
              <th className={headerCellClass}>Ke</th>
              <th className={aksiHeaderClass}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  Tidak ada tugas yang cocok.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr
                  key={t.id}
                  className="group border-t border-zinc-200 transition hover:bg-zinc-50/60"
                >
                  <td className={cellClass}>{t.id}</td>
                  <td className={`${cellClass} font-medium text-zinc-900`}>
                    {t.member}
                  </td>
                  <td
                    className={`${cellClass} max-w-[220px] truncate`}
                    title={t.product}
                  >
                    {t.product}
                  </td>
                  <td className={cellClass}>{formatNumber(t.price)}</td>
                  <td className={cellClass}>{formatNumber(t.commission)}</td>
                  <td className={cellClass}>
                    <StatusBadge status={t.status} />
                  </td>
                  <td className={cellClass}>{formatNumber(t.balance)}</td>
                  <td className={cellClass}>{t.queue}</td>
                  <td className={aksiCellClass}>
                    <button
                      type="button"
                      className="rounded-md bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-200 sm:text-sm"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
