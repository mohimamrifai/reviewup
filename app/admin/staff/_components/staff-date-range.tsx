"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, RotateCcw } from "lucide-react";

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 sm:text-sm";

const labelClass = "text-[11px] font-medium text-zinc-500 sm:text-xs";

const presetBtn = (active: boolean) =>
  `rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition sm:text-xs ${
    active
      ? "bg-indigo-600 text-white shadow-sm"
      : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100"
  }`;

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getThisMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toLocalISODate(from), to: toLocalISODate(now) };
}

function getLastMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 0);
  return { from: toLocalISODate(from), to: toLocalISODate(to) };
}

export function StaffDateRange() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const hasCustomRange = Boolean(from && to);

  const thisMonth = getThisMonthRange();
  const lastMonth = getLastMonthRange();
  const isThisMonth = from === thisMonth.from && to === thisMonth.to;
  const isLastMonth = from === lastMonth.from && to === lastMonth.to;

  function applyRange(nextFrom: string, nextTo: string) {
    const next = new URLSearchParams();
    next.set("from", nextFrom);
    next.set("to", nextTo);
    startTransition(() => {
      router.replace(`/admin/staff?${next.toString()}`);
    });
  }

  function setThisMonth() {
    applyRange(thisMonth.from, thisMonth.to);
  }

  function setLastMonth() {
    applyRange(lastMonth.from, lastMonth.to);
  }

  function updateCustom(key: "from" | "to", value: string) {
    const next = new URLSearchParams();
    if (key === "from") {
      next.set("from", value);
      next.set("to", to);
    } else {
      next.set("from", from);
      next.set("to", value);
    }
    startTransition(() => {
      router.replace(`/admin/staff?${next.toString()}`);
    });
  }

  function resetToThisMonth() {
    setThisMonth();
  }

  return (
    <div className="rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
        <div className="flex items-center gap-2 text-zinc-700">
          <Calendar className="size-4 text-indigo-600" />
          <span className="text-xs font-semibold sm:text-sm">Periode</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={setThisMonth}
            disabled={pending}
            className={presetBtn(isThisMonth)}
          >
            Bulan Ini
          </button>
          <button
            type="button"
            onClick={setLastMonth}
            disabled={pending}
            className={presetBtn(isLastMonth)}
          >
            Bulan Lalu
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:gap-2">
          <label className="flex flex-1 flex-col gap-1">
            <span className={labelClass}>Custom Dari</span>
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => updateCustom("from", e.target.value)}
              disabled={pending}
              className={inputClass}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className={labelClass}>Custom Sampai</span>
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => updateCustom("to", e.target.value)}
              disabled={pending}
              className={inputClass}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={resetToThisMonth}
          disabled={!hasCustomRange || pending}
          className="inline-flex items-center justify-center gap-1.5 self-start rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto sm:text-sm"
        >
          <RotateCcw className="size-3.5" />
          Bulan Ini
        </button>
      </div>
    </div>
  );
}
