"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";

import { updateTaskStatus, type TaskReviewState } from "@/lib/actions/tasks-admin";

import { StatusBadge, type Status } from "./status-badge";

type Task = {
  id: number;
  memberId: string;
  memberUsername: string;
  productName: string;
  price: string;
  commission: string;
  status: string;
  queue: number | null;
  createdAt: string;
};

const STATUS_OPTIONS: { value: Status | "all"; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "menunggu", label: "Menunggu" },
  { value: "dipilih", label: "Dipilih" },
  { value: "dikerjakan", label: "Dikerjakan" },
  { value: "selesai", label: "Selesai" },
  { value: "dibatalkan", label: "Dibatalkan" },
];

const STATUS_EDITABLE: { value: Status; label: string }[] = [
  { value: "menunggu", label: "Menunggu" },
  { value: "dipilih", label: "Dipilih" },
  { value: "dikerjakan", label: "Dikerjakan" },
  { value: "selesai", label: "Selesai" },
  { value: "dibatalkan", label: "Dibatalkan" },
];

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const aksiHeaderClass =
  "sticky right-0 border-l border-zinc-200 bg-zinc-100 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:static sm:border-l-0 sm:px-4 sm:py-3 sm:text-xs";

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

const aksiCellClass =
  "sticky right-0 border-l border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 group-hover:bg-zinc-50/60 sm:static sm:border-l-0 sm:bg-transparent sm:group-hover:bg-transparent sm:px-4 sm:py-3 sm:text-sm";

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

const initialState: TaskReviewState = {};

function TaskStatusModal({
  task,
  onClose,
  onUpdated,
}: {
  task: Task;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [state, action] = useActionState(updateTaskStatus, initialState);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) onUpdated();
  }, [state.success, onUpdated]);

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detail tugas #${task.id}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
              Detail Tugas #{task.id}
            </h2>
            <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">
              @{task.memberUsername} • {task.productName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-md p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="size-4" />
          </button>
        </div>

        <dl className="mb-4 grid grid-cols-2 gap-3 rounded-md bg-zinc-50 p-3 text-[11px] sm:text-xs">
          <div>
            <dt className="text-zinc-500">Harga</dt>
            <dd className="font-semibold text-zinc-900">{formatRupiah(task.price)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Komisi Dasar</dt>
            <dd className="font-semibold text-zinc-900">
              {formatRupiah(task.commission)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Status</dt>
            <dd>
              <StatusBadge status={task.status} />
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Dibuat</dt>
            <dd className="text-zinc-700">{formatDate(task.createdAt)}</dd>
          </div>
        </dl>

        {task.status === "selesai" ? (
          <div className="rounded-md bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 sm:text-xs">
            Tugas ini sudah selesai dan komisi sudah dikredit ke saldo member.
          </div>
        ) : (
          <form
            action={(fd) => {
              fd.set("taskId", String(task.id));
              startTransition(() => action(fd));
            }}
            className="space-y-3"
          >
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
                Ubah Status
              </label>
              <select
                name="status"
                defaultValue={task.status as Status}
                className={inputClass}
                disabled={pending}
              >
                {STATUS_EDITABLE.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                Mengubah ke <strong>Selesai</strong> akan otomatis mengkredit komisi
                (berdasarkan level member) dan memperbarui level.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
                Catatan (opsional)
              </label>
              <textarea
                name="notes"
                rows={2}
                className={inputClass}
                placeholder="cth: Bukti pekerjaan lengkap"
                disabled={pending}
              />
            </div>

            {state.error && (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
                {state.error}
              </p>
            )}
            {state.success && state.message && (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 sm:text-xs">
                {state.message}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:text-sm"
              >
                {pending && <Loader2 className="size-3 animate-spin" />}
                Simpan
              </button>
            </div>
          </form>
        )}

        {task.status === "selesai" && (
          <div className="mt-4 flex justify-end border-t border-zinc-200 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-sm"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function TasksTable({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [editing, setEditing] = useState<Task | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      return (
        t.memberUsername.toLowerCase().includes(q) ||
        t.productName.toLowerCase().includes(q)
      );
    });
  }, [tasks, query, statusFilter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const selesai = tasks.filter((t) => t.status === "selesai").length;
    const totalCommission = tasks
      .filter((t) => t.status === "selesai")
      .reduce((sum, t) => sum + Number(t.commission), 0);
    return { total, selesai, totalCommission };
  }, [tasks]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
            Total Tugas
          </p>
          <p className="mt-0.5 text-xl font-bold text-zinc-900 sm:text-2xl">
            {stats.total}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
            Selesai
          </p>
          <p className="mt-0.5 text-xl font-bold text-emerald-700 sm:text-2xl">
            {stats.selesai}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
            Total Komisi
          </p>
          <p className="mt-0.5 text-xl font-bold text-indigo-700 sm:text-2xl">
            {formatRupiah(stats.totalCommission)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari member / produk..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${inputClass} pl-8`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
            className={`${inputClass} sm:w-auto`}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-500 sm:ml-auto sm:text-sm">
            {filtered.length} dari {tasks.length} tugas
          </span>
        </div>
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
              <th className={headerCellClass}>Antrian</th>
              <th className={headerCellClass}>Tanggal</th>
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
                  {tasks.length === 0
                    ? "Belum ada tugas."
                    : "Tidak ada tugas yang cocok."}
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
                    {t.memberUsername}
                  </td>
                  <td
                    className={`${cellClass} max-w-[220px] truncate`}
                    title={t.productName}
                  >
                    {t.productName}
                  </td>
                  <td className={cellClass}>{formatRupiah(t.price)}</td>
                  <td className={cellClass}>{formatRupiah(t.commission)}</td>
                  <td className={cellClass}>
                    <StatusBadge status={t.status} />
                  </td>
                  <td className={cellClass}>{t.queue ?? "—"}</td>
                  <td className={cellClass}>{formatDate(t.createdAt)}</td>
                  <td className={aksiCellClass}>
                    <button
                      type="button"
                      onClick={() => setEditing(t)}
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

      {editing && (
        <TaskStatusModal
          task={editing}
          onClose={() => setEditing(null)}
          onUpdated={() => setEditing(null)}
        />
      )}
    </div>
  );
}
