"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

const levelOptions = ["Classic", "Silver", "Gold", "Platinum", "Diamond", "Premier"] as const;
type Level = (typeof levelOptions)[number];

type Props = {
  id: number;
  username: string;
  level: Level;
  creditScore: number;
  balance: string;
  frozenBalance: string;
  registeredAt: string;
  onEdit: (username: string) => void;
};

const selectClass =
  "rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const inputClass =
  "w-20 rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const okBadgeClass = "text-xs font-semibold text-emerald-600 sm:text-sm";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

const aksiCellClass =
  "sticky right-0 border-l border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 group-hover:bg-zinc-50/60 sm:static sm:border-l-0 sm:bg-transparent sm:group-hover:bg-transparent sm:px-4 sm:py-3 sm:text-sm";

export function MemberRow({
  id,
  username,
  level,
  creditScore,
  balance,
  frozenBalance,
  registeredAt,
  onEdit,
}: Props) {
  const [currentLevel, setCurrentLevel] = useState<Level>(level);
  const [currentScore, setCurrentScore] = useState(creditScore);

  return (
    <tr className="border-t border-zinc-200 transition hover:bg-zinc-50/60">
      <td className={cellClass}>{id}</td>
      <td className={`${cellClass} font-medium text-zinc-900`}>{username}</td>
      <td className={cellClass}>
        <div className="flex items-center gap-2">
          <select
            value={currentLevel}
            onChange={(e) => setCurrentLevel(e.target.value as Level)}
            className={selectClass}
          >
            {levelOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className={okBadgeClass}>OK</span>
        </div>
      </td>
      <td className={cellClass}>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={currentScore}
            onChange={(e) => setCurrentScore(Number(e.target.value))}
            className={inputClass}
          />
          <span className={okBadgeClass}>OK</span>
        </div>
      </td>
      <td className={cellClass}>{balance}</td>
      <td className={cellClass}>{frozenBalance}</td>
      <td className={`${cellClass} whitespace-nowrap`}>{registeredAt}</td>
      <td className={aksiCellClass}>
        <button
          type="button"
          aria-label={`Edit ${username}`}
          onClick={() => onEdit(username)}
          className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-indigo-600"
        >
          <Pencil className="size-4" />
        </button>
      </td>
    </tr>
  );
}
