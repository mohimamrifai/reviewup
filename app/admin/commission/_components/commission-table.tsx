"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Pencil, Percent, Save, X } from "lucide-react";

import { setStaffCommissionRate, type CommissionState } from "@/lib/actions/commission";

type Row = {
  staffId: string;
  username: string;
  referralCode: string | null;
  leaderUsername: string | null;
  commissionRate: string | null;
  totalDeposit: string;
  totalWithdrawal: string;
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

function useModalLifecycle(onClose: () => void) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);
}

function EditRateModal({
  row,
  onClose,
  onSaved,
}: {
  row: Row;
  onClose: () => void;
  onSaved: (msg: string, newRate: string | null) => void;
}) {
  const [state, action] = useActionState(setStaffCommissionRate, {});
  const [pending, startTransition] = useTransition();
  const [rate, setRate] = useState<string>(row.commissionRate ?? "");
  const skipFirstRun = useRef(true);

  useEffect(() => {
    if (skipFirstRun.current) {
      skipFirstRun.current = false;
      return;
    }
    if (state.success && state.message) {
      onSaved(state.message, rate.trim() === "" ? null : rate.trim());
    }
  }, [state, onSaved, rate]);

  useModalLifecycle(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Atur komisi @${row.username}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            Atur Komisi @{row.username}
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

        <form
          action={(fd) => startTransition(() => action(fd))}
          className="space-y-3"
        >
          <input type="hidden" name="staffId" value={row.staffId} />

          <div>
            <label
              htmlFor="rate"
              className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
            >
              Rate Komisi (%)
            </label>
            <div className="relative">
              <Percent className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                id="rate"
                name="rate"
                type="text"
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="cth: 5 (kosongkan untuk nonaktifkan)"
                disabled={pending}
                className={`${inputClass} pl-8`}
              />
            </div>
            <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
              0–100. Kosongkan untuk menonaktifkan komisi staff ini.
            </p>
            {state.fieldErrors?.rate?.[0] && (
              <p className="mt-1 text-[11px] text-rose-600">
                {state.fieldErrors.rate[0]}
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
              disabled={pending}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:text-sm"
            >
              {pending ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CommissionTable({
  initialRows,
  isCurrentSuperAdmin,
}: {
  initialRows: Row[];
  isCurrentSuperAdmin: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [editing, setEditing] = useState<Row | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={headerCellClass}>Staff</th>
              <th className={headerCellClass}>Leader</th>
              <th className={headerCellClass}>Referral</th>
              <th className={headerCellClass}>Total Deposit</th>
              <th className={headerCellClass}>Total Penarikan</th>
              <th className={headerCellClass}>Rate Komisi</th>
              {isCurrentSuperAdmin && <th className={headerCellClass}>Aksi</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={isCurrentSuperAdmin ? 7 : 6}
                  className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  Belum ada staff.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.staffId}
                  className="border-t border-zinc-200 transition hover:bg-zinc-50/60"
                >
                  <td className={`${cellClass} font-medium text-zinc-900`}>
                    @{r.username}
                  </td>
                  <td className={cellClass}>
                    {r.leaderUsername ? (
                      `@${r.leaderUsername}`
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className={`${cellClass} font-mono text-[11px]`}>
                    {r.referralCode ?? "—"}
                  </td>
                  <td className={`${cellClass} font-medium text-emerald-700`}>
                    {formatRupiah(r.totalDeposit)}
                  </td>
                  <td className={`${cellClass} font-medium text-rose-700`}>
                    {formatRupiah(r.totalWithdrawal)}
                  </td>
                  <td className={cellClass}>
                    {r.commissionRate !== null ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 sm:text-xs">
                        <Percent className="size-3" />
                        {r.commissionRate}%
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400 sm:text-sm">
                        Nonaktif
                      </span>
                    )}
                  </td>
                  {isCurrentSuperAdmin && (
                    <td className={cellClass}>
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        aria-label={`Atur komisi @${r.username}`}
                        className="inline-flex items-center justify-center gap-1 rounded-md bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-200"
                      >
                        <Pencil className="size-3" />
                        Atur
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditRateModal
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg, newRate) => {
            setRows((cur) =>
              cur.map((r) =>
                r.staffId === editing.staffId ? { ...r, commissionRate: newRate } : r,
              ),
            );
            setEditing(null);
            setToast({ type: "success", text: msg });
          }}
        />
      )}

      {toast && (
        <div
          role="status"
          className={`fixed left-1/2 top-4 z-[60] -translate-x-1/2 rounded-md px-4 py-2 text-xs font-medium shadow-lg sm:text-sm ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
          onClick={() => setToast(null)}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
