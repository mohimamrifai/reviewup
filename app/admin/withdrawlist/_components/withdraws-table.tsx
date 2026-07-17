"use client";

import { useActionState, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";

import { reviewWithdrawal } from "@/lib/actions/withdrawals-admin";
import {
  OTHER_REASON,
  WITHDRAWAL_REJECTION_REASONS,
} from "@/lib/constants/withdrawal";

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Menunggu" },
  { value: "completed", label: "Selesai" },
  { value: "rejected", label: "Ditolak" },
] as const;

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  completed: "Selesai",
  rejected: "Ditolak",
};

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const aksiHeaderClass =
  "sticky right-0 border-l border-zinc-200 bg-zinc-100 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:static sm:border-l-0 sm:px-4 sm:py-3 sm:text-xs";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

const aksiCellClass =
  "sticky right-0 border-l border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 group-hover:bg-zinc-50/60 sm:static sm:border-l-0 sm:bg-transparent sm:group-hover:bg-transparent sm:px-4 sm:py-3 sm:text-sm";

const inputClass =
  "rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

type WithdrawStatus = "pending" | "completed" | "rejected";

type Withdraw = {
  id: number;
  memberUsername: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  amount: string;
  status: WithdrawStatus;
  notes: string | null;
  createdAt: string;
};

function formatRupiah(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  return "Rp " + num.toLocaleString("id-ID");
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function WithdrawsTable({
  initialWithdraws,
}: {
  initialWithdraws: Withdraw[];
}) {
  const [withdraws, setWithdraws] = useState<Withdraw[]>(initialWithdraws);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return withdraws.filter((w) => {
      if (statusFilter !== "all" && w.status !== statusFilter) return false;
      if (!q) return true;
      return (
        w.memberUsername.toLowerCase().includes(q) ||
        w.bankName.toLowerCase().includes(q) ||
        w.accountNumber.includes(q)
      );
    });
  }, [withdraws, query, statusFilter]);

  const totalAmount = useMemo(() => {
    return filtered
      .filter((w) => w.status === "completed")
      .reduce((sum, w) => sum + Number(w.amount), 0);
  }, [filtered]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari user / bank / rekening..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${inputClass} w-full pl-8`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={inputClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-500 sm:ml-auto sm:text-sm">
            {filtered.length} item • Total selesai:{" "}
            <span className="font-semibold text-emerald-700">
              {formatRupiah(totalAmount)}
            </span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[860px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={headerCellClass}>User</th>
              <th className={headerCellClass}>Bank</th>
              <th className={headerCellClass}>Pemilik</th>
              <th className={headerCellClass}>No. Rekening</th>
              <th className={headerCellClass}>Jumlah</th>
              <th className={headerCellClass}>Tanggal</th>
              <th className={headerCellClass}>Status</th>
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
                  {withdraws.length === 0
                    ? "Belum ada pengajuan penarikan."
                    : "Tidak ada data yang cocok."}
                </td>
              </tr>
            ) : (
              filtered.map((w) => (
                <Row
                  key={w.id}
                  withdraw={w}
                  onUpdated={(updated) =>
                    setWithdraws((cur) =>
                      cur.map((x) => (x.id === updated.id ? updated : x)),
                    )
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type ReviewState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  success?: boolean;
};

const initialReview: ReviewState = {};

function Row({
  withdraw,
  onUpdated,
}: {
  withdraw: Withdraw;
  onUpdated: (w: Withdraw) => void;
}) {
  const [reviewing, setReviewing] = useState<"complete" | "reject" | null>(null);

  return (
    <tr className="group border-t border-zinc-200 transition hover:bg-zinc-50/60">
      <td className={`${cellClass} font-medium text-zinc-900`}>
        {withdraw.memberUsername}
      </td>
      <td className={cellClass}>{withdraw.bankName}</td>
      <td className={cellClass}>{withdraw.accountName}</td>
      <td className={`${cellClass} font-mono tabular-nums`}>
        {withdraw.accountNumber}
      </td>
      <td className={cellClass}>{formatRupiah(withdraw.amount)}</td>
      <td className={cellClass}>{formatDate(withdraw.createdAt)}</td>
      <td className={cellClass}>
        <span
          className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${statusStyles[withdraw.status]}`}
        >
          {statusLabels[withdraw.status]}
        </span>
        {withdraw.notes && (
          <p className="mt-1 text-[10px] text-zinc-500 sm:text-xs">
            {withdraw.notes}
          </p>
        )}
      </td>
      <td className={aksiCellClass}>
        {withdraw.status === "pending" ? (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setReviewing("complete")}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700"
            >
              <Check className="size-3" />
              Selesai
            </button>
            <button
              type="button"
              onClick={() => setReviewing("reject")}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-rose-700"
            >
              <X className="size-3" />
              Tolak
            </button>
          </div>
        ) : (
          <span className="text-xs text-zinc-400">—</span>
        )}
      </td>

      {reviewing && (
        <ReviewModal
          withdraw={withdraw}
          action={reviewing}
          onClose={() => setReviewing(null)}
          onSuccess={(updated) => {
            onUpdated(updated);
            setReviewing(null);
          }}
        />
      )}
    </tr>
  );
}

function ReviewModal({
  withdraw,
  action,
  onClose,
  onSuccess,
}: {
  withdraw: Withdraw;
  action: "complete" | "reject";
  onClose: () => void;
  onSuccess: (updated: Withdraw) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    reviewWithdrawal,
    initialReview,
  );
  const [reasonCode, setReasonCode] = useState<string>("");

  if (state.success) {
    const newNotes =
      action === "reject"
        ? reasonCode === OTHER_REASON
          ? `Alasan: Lainnya`
          : `Alasan: ${reasonCode || "—"}`
        : withdraw.notes;
    onSuccess({
      ...withdraw,
      status: action === "complete" ? "completed" : "rejected",
      notes: newNotes,
    });
  }

  const isComplete = action === "complete";
  const isOther = reasonCode === OTHER_REASON;
  const canSubmit = isComplete || (reasonCode && reasonCode.length > 0);
  const submitDisabled = isPending || !canSubmit;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isComplete ? "Selesaikan penarikan" : "Tolak penarikan"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <form
        action={formAction}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl sm:p-5"
      >
        <input type="hidden" name="id" value={withdraw.id} />
        <input type="hidden" name="action" value={action} />
        {isComplete ? null : (
          <input type="hidden" name="reasonCode" value={reasonCode} />
        )}

        <h2
          className={`text-sm font-bold sm:text-base ${isComplete ? "text-emerald-700" : "text-rose-700"}`}
        >
          {isComplete ? "Selesaikan Penarikan" : "Tolak Penarikan"}
        </h2>
        <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
          <span className="font-medium text-zinc-900">
            {withdraw.memberUsername}
          </span>{" "}
          • {withdraw.bankName} {withdraw.accountNumber} •{" "}
          {formatRupiah(withdraw.amount)}
        </p>

        {isComplete ? (
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-semibold text-zinc-900 sm:text-sm">
              Catatan (opsional)
            </span>
            <textarea
              name="notes"
              rows={3}
              defaultValue={withdraw.notes ?? ""}
              placeholder="cth: Dana sudah ditransfer via ATM."
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm"
            />
          </label>
        ) : (
          <div className="mt-3 space-y-2">
            <label htmlFor="reasonCode" className="block">
              <span className="mb-1 block text-xs font-semibold text-zinc-900 sm:text-sm">
                Alasan Penolakan <span className="text-rose-600">*</span>
              </span>
              <select
                id="reasonCode"
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                required
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 sm:text-sm"
              >
                <option value="" disabled>
                  Pilih alasan...
                </option>
                {WITHDRAWAL_REJECTION_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                <option value={OTHER_REASON}>{OTHER_REASON}</option>
              </select>
            </label>

            {isOther && (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-zinc-900 sm:text-sm">
                  Tulis Alasan <span className="text-rose-600">*</span>
                </span>
                <textarea
                  name="otherReason"
                  rows={3}
                  required
                  placeholder="cth: Rekening dibekukan oleh bank."
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 sm:text-sm"
                />
              </label>
            )}
          </div>
        )}

        {state.fieldErrors?.reasonCode?.[0] && (
          <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 sm:text-sm">
            {state.fieldErrors.reasonCode[0]}
          </p>
        )}
        {state.fieldErrors?.otherReason?.[0] && (
          <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 sm:text-sm">
            {state.fieldErrors.otherReason[0]}
          </p>
        )}
        {state.error && (
          <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 sm:text-sm">
            {state.error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitDisabled}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${
              isComplete
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {isComplete ? <Check className="size-3.5" /> : <X className="size-3.5" />}
            {isPending ? "Memproses..." : isComplete ? "Selesaikan" : "Tolak"}
          </button>
        </div>
      </form>
    </div>
  );
}
