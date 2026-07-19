"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const ACTION_BADGES: Record<string, string> = {
  create_admin: "bg-indigo-100 text-indigo-700",
  update_admin: "bg-sky-100 text-sky-700",
  delete_admin: "bg-rose-100 text-rose-700",
  create_task: "bg-violet-100 text-violet-700",
  task_completed: "bg-emerald-100 text-emerald-700",
  update_level: "bg-amber-100 text-amber-700",
  update_credit_score: "bg-amber-100 text-amber-700",
  adjust_balance: "bg-amber-100 text-amber-700",
  reset_login_password: "bg-zinc-200 text-zinc-700",
  reset_withdraw_password: "bg-zinc-200 text-zinc-700",
  set_status: "bg-rose-100 text-rose-700",
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super",
  admin_leader: "Leader",
  admin_staff: "Staff",
  member: "Member",
};

type AuditLog = {
  id: string;
  action: string;
  amount: string | null;
  note: string | null;
  metadata: string | null;
  createdAt: string;
  actorId: string | null;
  actorUsername: string | null;
  actorRole: string | null;
  targetId: string | null;
  targetUsername: string | null;
  targetRole: string | null;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

function formatRupiah(value: string | null) {
  if (!value) return null;
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return "Rp " + num.toLocaleString("id-ID");
}

function safeJsonParse(s: string | null): Record<string, unknown> | null {
  if (!s) return null;
  try {
    const v = JSON.parse(s);
    if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

export function AuditLogsTable({
  initialLogs,
  actionLabels,
}: {
  initialLogs: AuditLog[];
  actionLabels: Record<string, string>;
}) {
  const [logs] = useState<AuditLog[]>(initialLogs);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [actorFilter, setActorFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Unique actors (yang muncul di log)
  const actorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const l of logs) {
      if (l.actorId && l.actorUsername) {
        map.set(l.actorId, l.actorUsername);
      }
    }
    return Array.from(map.entries()).map(([id, username]) => ({
      id,
      username,
    }));
  }, [logs]);

  // Unique actions (yang muncul di log)
  const actionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of logs) set.add(l.action);
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return logs.filter((l) => {
      if (actionFilter !== "all" && l.action !== actionFilter) return false;
      if (actorFilter !== "all" && l.actorId !== actorFilter) return false;
      if (!q) return true;
      const haystack = [
        l.action,
        l.note ?? "",
        l.actorUsername ?? "",
        l.targetUsername ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [logs, query, actionFilter, actorFilter]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200/60 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari aksi / note / username..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${inputClass} pl-8`}
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className={inputClass}
          >
            <option value="all">Semua Aksi</option>
            {actionOptions.map((a) => (
              <option key={a} value={a}>
                {actionLabels[a] ?? a}
              </option>
            ))}
          </select>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className={inputClass}
          >
            <option value="all">Semua Actor</option>
            {actorOptions.map((a) => (
              <option key={a.id} value={a.id}>
                @{a.username}
              </option>
            ))}
          </select>
          <span className="text-xs text-zinc-500 sm:ml-auto sm:text-sm">
            {filtered.length} / {logs.length} entri
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[900px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={`${headerCellClass} w-8`}></th>
              <th className={headerCellClass}>Waktu</th>
              <th className={headerCellClass}>Aksi</th>
              <th className={headerCellClass}>Actor</th>
              <th className={headerCellClass}>Target</th>
              <th className={headerCellClass}>Jumlah</th>
              <th className={headerCellClass}>Catatan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  {logs.length === 0
                    ? "Belum ada audit log."
                    : "Tidak ada data yang cocok."}
                </td>
              </tr>
            ) : (
              filtered.map((l) => (
                <LogRow
                  key={l.id}
                  log={l}
                  actionLabels={actionLabels}
                  expanded={expandedId === l.id}
                  onToggle={() =>
                    setExpandedId((cur) => (cur === l.id ? null : l.id))
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

function LogRow({
  log,
  actionLabels,
  expanded,
  onToggle,
}: {
  log: AuditLog;
  actionLabels: Record<string, string>;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = safeJsonParse(log.metadata);
  const badgeClass = ACTION_BADGES[log.action] ?? "bg-zinc-200 text-zinc-700";
  const actionLabel = actionLabels[log.action] ?? log.action;
  const amountText = formatRupiah(log.amount);

  return (
    <>
      <tr
        className="group cursor-pointer border-t border-zinc-200 transition hover:bg-zinc-50/60"
        onClick={onToggle}
      >
        <td className={`${cellClass} text-zinc-400`}>
          {meta ? (
            expanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )
          ) : null}
        </td>
        <td className={`${cellClass} font-mono text-[11px] text-zinc-600 sm:text-xs`}>
          {formatDate(log.createdAt)}
        </td>
        <td className={cellClass}>
          <span
            className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold sm:text-xs ${badgeClass}`}
          >
            {actionLabel}
          </span>
        </td>
        <td className={cellClass}>
          <div className="flex flex-col">
            <span className="font-medium text-zinc-900">
              {log.actorUsername ?? "(dihapus)"}
            </span>
            <span className="text-[10px] text-zinc-500 sm:text-[11px]">
              {log.actorRole ? ROLE_LABELS[log.actorRole] ?? log.actorRole : "—"}
            </span>
          </div>
        </td>
        <td className={cellClass}>
          <div className="flex flex-col">
            <span className="font-medium text-zinc-900">
              {log.targetUsername ?? "(dihapus)"}
            </span>
            <span className="text-[10px] text-zinc-500 sm:text-[11px]">
              {log.targetRole ? ROLE_LABELS[log.targetRole] ?? log.targetRole : "—"}
            </span>
          </div>
        </td>
        <td className={`${cellClass} font-mono`}>
          {amountText ?? <span className="text-zinc-400">—</span>}
        </td>
        <td className={cellClass}>
          <span className="line-clamp-2 text-zinc-600">{log.note ?? "—"}</span>
        </td>
      </tr>
      {expanded && meta && (
        <tr className="border-t border-zinc-200 bg-zinc-50/50">
          <td colSpan={7} className="px-3 py-2 sm:px-4 sm:py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-xs">
              Metadata
            </div>
            <pre className="mt-1 overflow-x-auto rounded-md bg-zinc-900 px-3 py-2 text-[11px] text-zinc-100 sm:text-xs">
              {JSON.stringify(meta, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}
