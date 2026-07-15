"use client";

import { useState } from "react";
import { Search } from "lucide-react";

type Status = "menunggu" | "sukses" | "gagal";

type Recharge = {
  id: number;
  user: string;
  amount: number;
  date: string;
  status: Status;
};

const initialRecharges: Recharge[] = [
  {
    id: 1,
    user: "David",
    amount: 50000,
    date: "14-07-2026 16:30",
    status: "sukses",
  },
  {
    id: 2,
    user: "Tess",
    amount: 100000,
    date: "14-07-2026 12:45",
    status: "menunggu",
  },
  {
    id: 3,
    user: "David",
    amount: 75000,
    date: "13-07-2026 09:15",
    status: "sukses",
  },
];

const statusStyles: Record<Status, string> = {
  menunggu: "bg-amber-100 text-amber-700",
  sukses: "bg-emerald-100 text-emerald-700",
  gagal: "bg-rose-100 text-rose-700",
};

const statusLabels: Record<Status, string> = {
  menunggu: "Menunggu",
  sukses: "Sukses",
  gagal: "Gagal",
};

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const aksiHeaderClass =
  "sticky right-0 border-l border-zinc-200 bg-zinc-100 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:static sm:border-l-0 sm:px-4 sm:py-3 sm:text-xs";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

const aksiCellClass =
  "sticky right-0 border-l border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 group-hover:bg-zinc-50/60 sm:static sm:border-l-0 sm:bg-transparent sm:group-hover:bg-transparent sm:px-4 sm:py-3 sm:text-sm";

const searchInputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

function formatRupiah(n: number): string {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export function RechargesTable() {
  const [query, setQuery] = useState("");

  const filtered = initialRecharges.filter((r) =>
    !query || r.user.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Cari username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${searchInputClass} sm:w-64`}
        />
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1.5 self-start rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800 sm:self-auto sm:text-sm"
        >
          <Search className="size-3.5" />
          Cari
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={headerCellClass}>No</th>
              <th className={headerCellClass}>User</th>
              <th className={headerCellClass}>Jumlah</th>
              <th className={headerCellClass}>Tanggal</th>
              <th className={headerCellClass}>Bukti</th>
              <th className={headerCellClass}>Status</th>
              <th className={aksiHeaderClass}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  Tidak ada data ditemukan
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className="group border-t border-zinc-200 transition hover:bg-zinc-50/60"
                >
                  <td className={cellClass}>{r.id}</td>
                  <td className={`${cellClass} font-medium text-zinc-900`}>
                    {r.user}
                  </td>
                  <td className={cellClass}>{formatRupiah(r.amount)}</td>
                  <td className={cellClass}>{r.date}</td>
                  <td className={cellClass}>
                    <button
                      type="button"
                      className="text-xs font-medium text-indigo-600 hover:underline sm:text-sm"
                    >
                      Lihat
                    </button>
                  </td>
                  <td className={cellClass}>
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${statusStyles[r.status]}`}
                    >
                      {statusLabels[r.status]}
                    </span>
                  </td>
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
