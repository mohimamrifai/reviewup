"use client";

import { useMemo, useState } from "react";
import { Search, UserCog } from "lucide-react";
import Link from "next/link";

type Staff = {
  id: string;
  username: string;
  referralCode: string | null;
  status: string;
  createdAt: string;
  memberCount: number;
  totalDeposit: string;
  totalWithdrawal: string;
  leaderUsername: string | null;
};

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

function formatRupiah(value: string | number): string {
  const num = typeof value === "string" ? Number(value) : value;
  return "Rp " + num.toLocaleString("id-ID");
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function StaffsTable({ initialStaffs }: { initialStaffs: Staff[] }) {
  const [staffs] = useState<Staff[]>(initialStaffs);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return staffs;
    return staffs.filter(
      (s) =>
        s.username.toLowerCase().includes(q) ||
        (s.referralCode?.toLowerCase().includes(q) ?? false) ||
        (s.leaderUsername?.toLowerCase().includes(q) ?? false),
    );
  }, [staffs, query]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari username / referral / leader..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${inputClass} pl-8`}
            />
          </div>
          <span className="text-xs text-zinc-500 sm:ml-auto sm:text-sm">
            {filtered.length} dari {staffs.length} staff
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={headerCellClass}>Staff</th>
              <th className={headerCellClass}>Leader</th>
              <th className={headerCellClass}>Referral</th>
              <th className={headerCellClass}>Jml. Member</th>
              <th className={headerCellClass}>Total Deposit</th>
              <th className={headerCellClass}>Total Penarikan</th>
              <th className={headerCellClass}>Status</th>
              <th className={headerCellClass}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  {staffs.length === 0
                    ? "Belum ada staff."
                    : "Tidak ada staff yang cocok."}
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-zinc-200 transition hover:bg-zinc-50/60"
                >
                  <td className={`${cellClass} font-medium text-zinc-900`}>
                    <div className="flex items-center gap-2">
                      <UserCog className="size-3.5 text-sky-600" />
                      @{s.username}
                    </div>
                  </td>
                  <td className={cellClass}>
                    {s.leaderUsername ? (
                      `@${s.leaderUsername}`
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className={`${cellClass} font-mono text-[11px]`}>
                    {s.referralCode ?? "—"}
                  </td>
                  <td className={cellClass}>{s.memberCount}</td>
                  <td className={`${cellClass} font-medium text-emerald-700`}>
                    {formatRupiah(s.totalDeposit)}
                  </td>
                  <td className={`${cellClass} font-medium text-rose-700`}>
                    {formatRupiah(s.totalWithdrawal)}
                  </td>
                  <td className={cellClass}>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${
                        s.status === "banned"
                          ? "bg-rose-100 text-rose-700"
                          : s.status === "online"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className={cellClass}>
                    <Link
                      href={`/admin/staff/${s.id}`}
                      className="inline-flex items-center justify-center gap-1 rounded-md bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-200"
                    >
                      Detail
                    </Link>
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
