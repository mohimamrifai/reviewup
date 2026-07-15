"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { EditMemberModal } from "./edit-member-modal";
import { MemberRow } from "./member-row";

type Level =
  | "Classic"
  | "Silver"
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Premier";

type Member = {
  id: number;
  username: string;
  level: Level;
  creditScore: number;
  balance: string;
  frozenBalance: string;
  registeredAt: string;
};

const initialMembers: Member[] = [
  {
    id: 2801,
    username: "David",
    level: "Classic",
    creditScore: 100,
    balance: "Rp 30.000",
    frozenBalance: "Rp 0",
    registeredAt: "14-07-2026 16:29",
  },
  {
    id: 2784,
    username: "Tess",
    level: "Classic",
    creditScore: 100,
    balance: "Rp 30.000",
    frozenBalance: "Rp 0",
    registeredAt: "14-07-2026 12:40",
  },
];

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const aksiHeaderClass =
  "sticky right-0 border-l border-zinc-200 bg-zinc-100 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:static sm:border-l-0 sm:px-4 sm:py-3 sm:text-xs";

const searchInputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

export function MembersTable() {
  const [query, setQuery] = useState("");
  const [editingUsername, setEditingUsername] = useState<string | null>(null);

  const filtered = initialMembers.filter((m) =>
    m.username.toLowerCase().includes(query.toLowerCase())
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
              <th className={headerCellClass}>ID</th>
              <th className={headerCellClass}>Username</th>
              <th className={headerCellClass}>Level</th>
              <th className={headerCellClass}>Skor Kredit</th>
              <th className={headerCellClass}>Saldo</th>
              <th className={headerCellClass}>Saldo Beku</th>
              <th className={headerCellClass}>Terdaftar</th>
              <th className={aksiHeaderClass}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  Tidak ada anggota yang cocok.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <MemberRow key={m.id} {...m} onEdit={setEditingUsername} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingUsername !== null && (
        <EditMemberModal
          username={editingUsername}
          onClose={() => setEditingUsername(null)}
        />
      )}
    </div>
  );
}
