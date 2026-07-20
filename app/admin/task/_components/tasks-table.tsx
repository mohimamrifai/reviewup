"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { StatusBadge, type Status } from "./status-badge";
import { AssignProductModal } from "./assign-product-modal";
import { ConfirmTaskModal } from "./confirm-task-modal";
import { CreateTaskModal } from "./create-task-modal";
import { TaskStatusModal } from "./task-status-modal";
import {
  STATUS_OPTIONS,
  aksiCellClass,
  aksiHeaderClass,
  cellClass,
  headerCellClass,
  inputClass,
  type MemberOption,
  type ProductOption,
  type Task,
} from "./task-shared";
import { formatRupiah } from "@/lib/format-rupiah";

export function TasksTable({
  initialTasks,
  members = [],
  products = [],
}: {
  initialTasks: Task[];
  members?: MemberOption[];
  products?: ProductOption[];
}) {
  const tasks = initialTasks;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState<Task | null>(null);
  const [confirming, setConfirming] = useState<Task | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      const productMatch = t.productName
        ? t.productName.toLowerCase().includes(q)
        : false;
      return (
        t.memberUsername.toLowerCase().includes(q) || productMatch
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
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 sm:text-sm"
          >
            <Plus className="size-3.5" />
            Tambah Tugas
          </button>
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
              <th className={headerCellClass}>Saldo</th>
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
                  {tasks.length === 0
                    ? "Belum ada tugas."
                    : "Tidak ada tugas yang cocok."}
                </td>
              </tr>
            ) : (
              filtered.map((t, i) => (
                <tr
                  key={`${t.kind}-${t.id}`}
                  className="group border-t border-zinc-200 transition hover:bg-zinc-50/60"
                >
                  <td className={cellClass}>{i + 1}</td>
                  <td className={`${cellClass} font-medium text-zinc-900`}>
                    {t.memberUsername}
                  </td>
                  <td
                    className={`${cellClass} max-w-[220px] truncate ${
                      t.productId === null ? "italic text-zinc-400" : ""
                    }`}
                    title={t.productName ?? "Belum dipilih"}
                  >
                    {t.productName ?? "Belum dipilih"}
                  </td>
                  <td className={cellClass}>
                    {t.productId === null ? "Rp 0" : formatRupiah(t.price)}
                  </td>
                  <td className={cellClass}>
                    {t.productId === null
                      ? "Rp 0"
                      : formatRupiah(t.commission)}
                  </td>
                  <td className={cellClass}>
                    <StatusBadge status={t.status} />
                  </td>
                  <td className={cellClass}>
                    {formatRupiah(t.memberBalance)}
                  </td>
                  <td className={aksiCellClass}>
                    <div className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center sm:justify-end">
                      {t.kind === "request" ? (
                        <button
                          type="button"
                          onClick={() => setAssigning(t)}
                          className="rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-200 sm:text-sm"
                        >
                          Pilih
                        </button>
                      ) : null}
                      {t.kind === "task" && t.status === "dikerjakan" ? (
                        <button
                          type="button"
                          onClick={() => setConfirming(t)}
                          className="rounded-md bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200 sm:text-sm"
                        >
                          Konfirmasi
                        </button>
                      ) : null}
                      {t.kind === "task" && t.status !== "dikerjakan" ? (
                        <button
                          type="button"
                          onClick={() => setEditing(t)}
                          className="rounded-md bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-200 sm:text-sm"
                        >
                          Detail
                        </button>
                      ) : null}
                    </div>
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

      {creating && (
        <CreateTaskModal
          members={members}
          products={products}
          onClose={() => setCreating(false)}
          onCreated={(msg) => {
            setCreating(false);
            setToast({ type: "success", text: msg });
          }}
        />
      )}

      {assigning && (
        <AssignProductModal
          task={assigning}
          products={products}
          onClose={() => setAssigning(null)}
          onAssigned={(msg: string) => {
            setAssigning(null);
            setToast({ type: "success", text: msg });
          }}
        />
      )}

      {confirming && (
        <ConfirmTaskModal
          task={confirming}
          onClose={() => setConfirming(null)}
          onConfirmed={(msg: string) => {
            setConfirming(null);
            setToast({ type: "success", text: msg });
          }}
        />
      )}

      {toast && (
        <div
          role="status"
          className={`fixed left-1/2 top-4 z-60 -translate-x-1/2 rounded-md px-4 py-2 text-xs font-medium shadow-lg sm:text-sm ${
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
