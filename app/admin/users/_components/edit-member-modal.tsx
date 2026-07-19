"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Lock, Unlock, X } from "lucide-react";

import {
  adjustMemberBalance,
  resetMemberLoginPassword,
  resetMemberWithdrawPassword,
  setMemberWithdrawLock,
  updateMemberCreditScore,
  updateMemberLevel,
  type MemberToolState,
} from "@/lib/actions/member-tools";

import type { Member, MemberLevel } from "./members-table";

const TABS = [
  { key: "level", label: "Level & Skor" },
  { key: "saldo", label: "Edit Saldo" },
  { key: "penarikan", label: "Status Penarikan" },
  { key: "password", label: "Password" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const LEVEL_OPTIONS: { value: MemberLevel; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "platinum", label: "Platinum" },
  { value: "diamond", label: "Diamond" },
  { value: "premier", label: "Premier" },
];

const PASSWORD_TABS = [
  { key: "login", label: "Login" },
  { key: "withdraw", label: "Penarikan" },
] as const;

type PasswordTab = (typeof PASSWORD_TABS)[number]["key"];

const initialState: MemberToolState = {};

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const tabBtnClass = (active: boolean) =>
  `flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition sm:text-xs ${
    active
      ? "bg-white text-indigo-700 shadow-sm"
      : "text-zinc-600 hover:text-zinc-900"
  }`;

const primaryBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:text-sm";

const secondaryBtn =
  "rounded-md border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 sm:text-sm";

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-[11px] text-rose-600 sm:text-xs">{msg}</p>;
}

function FieldError({ errs }: { errs?: string[] }) {
  if (!errs || errs.length === 0) return null;
  return <ErrorMsg msg={errs[0]} />;
}

function StatusMessage({ state }: { state: MemberToolState }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    setShow(true);
  }, [state]);
  if (!show) return null;
  if (state.error) {
    return (
      <div className="mt-3 flex items-start justify-between gap-2 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
        <span>{state.error}</span>
        <button type="button" onClick={() => setShow(false)} aria-label="Tutup pesan">
          <X className="size-3" />
        </button>
      </div>
    );
  }
  if (state.success) {
    return (
      <div className="mt-3 flex items-start justify-between gap-2 rounded-md bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 sm:text-xs">
        <span>{state.message ?? "Berhasil."}</span>
        <button type="button" onClick={() => setShow(false)} aria-label="Tutup pesan">
          <X className="size-3" />
        </button>
      </div>
    );
  }
  return null;
}

function LevelForm({
  member,
  onSaved,
}: {
  member: Member;
  onSaved: (m: Member) => void;
}) {
  const router = useRouter();
  const [levelState, levelAction] = useActionState(updateMemberLevel, initialState);
  const [scoreState, scoreAction] = useActionState(updateMemberCreditScore, initialState);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (levelState.success) {
      onSaved({ ...member });
      router.refresh();
    }
  }, [levelState.success, member, onSaved, router]);
  useEffect(() => {
    if (scoreState.success) {
      onSaved({ ...member });
      router.refresh();
    }
  }, [scoreState.success, member, onSaved, router]);

  return (
    <div className="space-y-3">
      <form
        action={(fd) => {
          fd.set("memberId", member.id);
          startTransition(() => levelAction(fd));
        }}
        className="space-y-2"
      >
        <div>
          <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
            Level
          </label>
          <select
            name="level"
            defaultValue={member.level}
            className={inputClass}
            disabled={pending}
          >
            {LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <FieldError errs={levelState.fieldErrors?.level} />
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className={primaryBtn}>
            {pending && <Loader2 className="size-3 animate-spin" />}
            Simpan Level
          </button>
        </div>
      </form>

      <div className="border-t border-zinc-200 pt-3">
        <form
          action={(fd) => {
            fd.set("memberId", member.id);
            startTransition(() => scoreAction(fd));
          }}
          className="space-y-2"
        >
          <div>
            <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
              Skor Kredit
            </label>
            <input
              type="number"
              name="creditScore"
              min={0}
              max={1000}
              defaultValue={member.creditScore}
              className={inputClass}
              placeholder="0-1000"
              disabled={pending}
            />
            <FieldError errs={scoreState.fieldErrors?.creditScore} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={pending} className={primaryBtn}>
              {pending && <Loader2 className="size-3 animate-spin" />}
              Simpan Skor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BalanceForm({
  member,
  onSaved,
}: {
  member: Member;
  onSaved: (m: Member) => void;
}) {
  const router = useRouter();
  const [state, action] = useActionState(adjustMemberBalance, initialState);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.success) {
      onSaved({ ...member });
      router.refresh();
    }
  }, [state.success, member, onSaved, router]);

  return (
    <form
      action={(fd) => {
        fd.set("memberId", member.id);
        startTransition(() => action(fd));
      }}
      className="space-y-2"
    >
      <div>
        <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
          Saldo Saat Ini
        </label>
        <p className="rounded-md bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-900 sm:text-sm">
          Rp {Number(member.balance).toLocaleString("id-ID")}
        </p>
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
          Nominal (positif = tambah, negatif = kurangi)
        </label>
        <input
          type="number"
          name="amount"
          step="1000"
          required
          className={inputClass}
          placeholder="cth: 50000 atau -20000"
          disabled={pending}
        />
        <FieldError errs={state.fieldErrors?.amount} />
      </div>
      <StatusMessage state={state} />
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={primaryBtn}>
          {pending && <Loader2 className="size-3 animate-spin" />}
          Sesuaikan Saldo
        </button>
      </div>
    </form>
  );
}

function WithdrawStatusForm({
  member,
  onSaved,
}: {
  member: Member;
  onSaved: (m: Member) => void;
}) {
  const router = useRouter();
  const [state, action] = useActionState(setMemberWithdrawLock, initialState);
  const [pending, startTransition] = useTransition();
  const initialLocked = member.status === "banned";
  const [locked, setLocked] = useState(initialLocked);
  const [reason, setReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (state.success) {
      onSaved({ ...member });
      router.refresh();
      setReason("");
      setConfirmOpen(false);
    }
  }, [state.success, member, onSaved, router]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (locked && !confirmOpen) {
      setConfirmOpen(true);
      return;
    }
    const fd = new FormData();
    fd.set("memberId", member.id);
    fd.set("lock", locked ? "true" : "false");
    if (locked) fd.set("reason", reason.trim());
    startTransition(() => action(fd));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 text-[11px] sm:text-xs">
        <span className="text-zinc-600">Status saat ini</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs ${
            initialLocked
              ? "bg-rose-100 text-rose-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {initialLocked ? "Diblokir" : "Aktif"}
        </span>
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-md border border-zinc-200 bg-white p-3 transition hover:bg-zinc-50">
        <input
          type="checkbox"
          checked={locked}
          onChange={(e) => setLocked(e.target.checked)}
          disabled={pending}
          className="mt-0.5 size-4 rounded border-zinc-300 text-rose-600 focus:ring-2 focus:ring-rose-500/20"
        />
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 sm:text-sm">
            {locked ? (
              <Lock className="size-3.5 text-rose-600" />
            ) : (
              <Unlock className="size-3.5 text-emerald-600" />
            )}
            Kunci penarikan anggota
          </div>
          <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">
            Centang untuk melarang anggota melakukan transaksi penarikan saldo.
          </p>
        </div>
      </label>

      {locked && (
        <div>
          <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
            Alasan Penguncian <span className="text-rose-600">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            required
            minLength={3}
            maxLength={500}
            disabled={pending}
            className={inputClass}
            placeholder="cth: Aktivitas mencurigakan, pelanggaran aturan, dsb."
          />
          <FieldError errs={state.fieldErrors?.reason} />
          <p className="mt-1 text-[10px] text-zinc-500 sm:text-[11px]">
            Alasan akan dicatat di log audit untuk dokumentasi.
          </p>
        </div>
      )}

      <StatusMessage state={state} />

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={primaryBtn}>
          {pending && <Loader2 className="size-3 animate-spin" />}
          {locked ? "Konfirmasi Blokir" : "Buka Penarikan"}
        </button>
      </div>

      {confirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi blokir"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
          onClick={() => !pending && setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <AlertTriangle className="size-5" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 sm:text-base">
                  Konfirmasi Blokir Penarikan
                </h3>
                <p className="mt-1 text-[11px] text-zinc-600 sm:text-xs">
                  Anda akan memblokir penarikan saldo untuk anggota
                  <span className="font-semibold text-zinc-900"> @{member.username}</span>.
                  Tindakan ini akan dicatat di log audit.
                </p>
              </div>
            </div>
            {reason.trim() && (
              <div className="mb-3 rounded-md bg-zinc-50 px-3 py-2 text-[11px] sm:text-xs">
                <span className="block text-zinc-500">Alasan:</span>
                <p className="mt-0.5 text-zinc-900">{reason.trim()}</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={pending}
                className={secondaryBtn}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const fd = new FormData();
                  fd.set("memberId", member.id);
                  fd.set("lock", "true");
                  fd.set("reason", reason.trim());
                  startTransition(() => action(fd));
                }}
                disabled={pending || reason.trim().length < 3}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50 sm:text-sm"
              >
                {pending && <Loader2 className="size-3 animate-spin" />}
                Ya, Blokir
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function PasswordForm({
  member,
  onSaved,
}: {
  member: Member;
  onSaved: (m: Member) => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<PasswordTab>("login");
  const [loginState, loginAction] = useActionState(resetMemberLoginPassword, initialState);
  const [withdrawState, withdrawAction] = useActionState(
    resetMemberWithdrawPassword,
    initialState,
  );
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (loginState.success || withdrawState.success) {
      onSaved({ ...member });
      router.refresh();
    }
  }, [loginState.success, withdrawState.success, member, onSaved, router]);

  const isLogin = tab === "login";
  const state = isLogin ? loginState : withdrawState;
  const action = isLogin ? loginAction : withdrawAction;
  const minLength = isLogin ? 8 : 6;
  const helpText = isLogin
    ? "Digunakan untuk masuk ke aplikasi."
    : "Digunakan saat melakukan penarikan saldo.";

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-1">
        {PASSWORD_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            disabled={pending}
            className={tabBtnClass(tab === t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form
        action={(fd) => {
          fd.set("memberId", member.id);
          startTransition(() => action(fd));
        }}
        className="space-y-2"
      >
        <p className="text-[11px] text-zinc-500 sm:text-xs">{helpText}</p>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
            Kata Sandi Baru
          </label>
          <input
            type="password"
            name="newPassword"
            minLength={minLength}
            maxLength={72}
            required
            className={inputClass}
            placeholder={`Minimal ${minLength} karakter`}
            disabled={pending}
            autoComplete="new-password"
          />
          <FieldError errs={state.fieldErrors?.newPassword} />
        </div>
        <StatusMessage state={state} />
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className={primaryBtn}>
            {pending && <Loader2 className="size-3 animate-spin" />}
            Reset {isLogin ? "Login" : "Penarikan"}
          </button>
        </div>
      </form>
    </div>
  );
}

type Props = {
  member: Member;
  onClose: () => void;
  onSaved: (member: Member) => void;
};

export function EditMemberModal({ member, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<TabKey>("level");

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
      aria-label={`Edit anggota ${member.username}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
              Tools Anggota
            </h2>
            <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">
              @{member.username}
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

        <div className="mb-3 flex gap-1 rounded-lg bg-zinc-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={tabBtnClass(tab === t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {tab === "level" && <LevelForm member={member} onSaved={onSaved} />}
          {tab === "saldo" && <BalanceForm member={member} onSaved={onSaved} />}
          {tab === "penarikan" && <WithdrawStatusForm member={member} onSaved={onSaved} />}
          {tab === "password" && <PasswordForm member={member} onSaved={onSaved} />}
        </div>

        <div className="mt-4 flex justify-end border-t border-zinc-200 pt-3">
          <button type="button" onClick={onClose} className={secondaryBtn}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
