"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  createAdminUser,
  deleteAdminUser,
  resetAdminPassword,
  setStaffLeader,
  updateAdminUser,
  type AdminUserState,
} from "@/lib/actions/admin-users";

type AdminRole = "admin_leader" | "admin_staff";

type Admin = {
  id: string;
  username: string;
  role: AdminRole;
  referralCode: string | null;
  status: string;
  createdAt: string;
  memberCount: number;
  leaderId: string | null;
  leaderUsername: string | null;
};

type LeaderOption = { id: string; username: string };

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin_leader: "Admin Leader",
  admin_staff: "Admin Staff",
};

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 sm:text-sm";

const headerCellClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-600 sm:px-4 sm:py-3 sm:text-xs";

const cellClass =
  "px-3 py-2 text-xs text-zinc-700 sm:px-4 sm:py-3 sm:text-sm";

const initialState: AdminUserState = {};

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

function LeaderSelect({
  leaders,
  name,
  defaultValue,
  disabled,
  required,
}: {
  leaders: LeaderOption[];
  name: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  if (leaders.length === 0) {
    return (
      <div>
        <label
          htmlFor={name}
          className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
        >
          Leader <span className="text-rose-600">*</span>
        </label>
        <p className="rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800 sm:text-xs">
          Belum ada Admin Leader. Buat leader terlebih dahulu sebelum menambah staff.
        </p>
        <input type="hidden" name={name} value="" />
      </div>
    );
  }
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
      >
        Leader <span className="text-rose-600">*</span>
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue ?? ""}
        disabled={disabled}
        className={inputClass}
      >
        <option value="" disabled>
          Pilih leader...
        </option>
        {leaders.map((l) => (
          <option key={l.id} value={l.id}>
            @{l.username}
          </option>
        ))}
      </select>
    </div>
  );
}

function ResetPasswordModal({
  admin,
  onClose,
  onReset,
}: {
  admin: Admin;
  onClose: () => void;
  onReset: (msg: string) => void;
}) {
  const [state, action] = useActionState(resetAdminPassword, initialState);
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  // Simpan callback terbaru di ref agar useEffect tidak retrigger tiap parent re-render
  // (arrow function dari parent bikin reference identity berubah setiap render).
  const onResetRef = useRef(onReset);
  useEffect(() => {
    onResetRef.current = onReset;
  }, [onReset]);

  useEffect(() => {
    if (state === initialState) return;
    if (state.success) onResetRef.current(state.message ?? "Password di-reset.");
  }, [state]);

  useModalLifecycle(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Reset password @${admin.username}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            Reset Password @{admin.username}
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

        {state.success ? (
          <div className="space-y-3">
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 sm:text-xs">
              {state.message}
            </div>
            <p className="rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800 sm:text-xs">
              <strong>Penting:</strong> Berikan password baru ke admin terkait
              melalui channel yang aman. Password tidak akan ditampilkan lagi di
              sistem.
            </p>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 sm:text-sm"
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[11px] text-zinc-600 sm:text-xs">
              Masukkan password baru untuk admin{" "}
              <span className="font-semibold text-zinc-900">@{admin.username}</span>.
              Password lama akan diganti dengan yang baru.
            </p>
            <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800 sm:text-xs">
              <strong>Catatan:</strong> Pastikan untuk membagikan password baru
              ke admin terkait karena tidak akan ditampilkan lagi.
            </p>

            <form
              action={(fd) => startTransition(() => action(fd))}
              className="mt-4 space-y-3"
            >
              <input type="hidden" name="adminId" value={admin.id} />

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
                >
                  Password Baru <span className="text-rose-600">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={72}
                    autoComplete="new-password"
                    placeholder="Minimal 6 karakter"
                    disabled={pending}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                    className="rounded-md bg-zinc-100 p-2 text-zinc-600 transition hover:bg-zinc-200"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {state.fieldErrors?.password ? (
                  <p className="mt-1 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
                    {state.fieldErrors.password[0]}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="passwordConfirmation"
                  className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
                >
                  Konfirmasi Password Baru{" "}
                  <span className="text-rose-600">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="passwordConfirmation"
                    name="passwordConfirmation"
                    type={showPasswordConfirmation ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={72}
                    autoComplete="new-password"
                    placeholder="Ketik ulang password"
                    disabled={pending}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirmation((v) => !v)}
                    aria-label={showPasswordConfirmation ? "Sembunyikan" : "Tampilkan"}
                    className="rounded-md bg-zinc-100 p-2 text-zinc-600 transition hover:bg-zinc-200"
                  >
                    {showPasswordConfirmation ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {state.fieldErrors?.passwordConfirmation ? (
                  <p className="mt-1 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
                    {state.fieldErrors.passwordConfirmation[0]}
                  </p>
                ) : null}
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
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50 sm:text-sm"
                >
                  {pending && <Loader2 className="size-3 animate-spin" />}
                  <KeyRound className="size-3" />
                  Reset Password
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function EditAdminModal({
  admin,
  leaders,
  canEditRole,
  onClose,
  onSaved,
  onResetPassword,
}: {
  admin: Admin;
  leaders: LeaderOption[];
  /**
   * `true` untuk super admin (boleh ganti role/leader).
   * `false` untuk admin leader (hanya boleh ubah username & leaderId otomatis).
   */
  canEditRole: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
  onResetPassword: (a: Admin) => void;
}) {
  const [state, action] = useActionState(updateAdminUser, initialState);
  const [pending, startTransition] = useTransition();
  const [currentRole, setCurrentRole] = useState<AdminRole>(admin.role);
  // Simpan callback terbaru di ref agar useEffect tidak retrigger tiap parent re-render.
  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  // Pakai reference equality: `state === initialState` artinya action belum pernah dipanggil.
  // Aman terhadap React StrictMode (double-invoke effect di dev).
  useEffect(() => {
    if (state === initialState) return;
    if (state.success && state.message) onSavedRef.current(state.message);
  }, [state]);

  useModalLifecycle(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Edit admin @${admin.username}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            Edit Admin @{admin.username}
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
          <input type="hidden" name="adminId" value={admin.id} />

          <div>
            <label
              htmlFor="newRole"
              className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
            >
              Role
            </label>
            {canEditRole ? (
              <select
                id="newRole"
                name="newRole"
                required
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as AdminRole)}
                disabled={pending}
                className={inputClass}
              >
                <option value="admin_leader">Admin Leader</option>
                <option value="admin_staff">Admin Staff</option>
              </select>
            ) : (
              <>
                <input type="hidden" name="newRole" value={admin.role} />
                <input
                  type="text"
                  readOnly
                  value={admin.role === "admin_leader" ? "Admin Leader" : "Admin Staff"}
                  className={`${inputClass} bg-zinc-50`}
                />
                <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                  Leader tidak dapat mengubah role staff.
                </p>
              </>
            )}
            {admin.role === "admin_staff" && (
              <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                Referral code saat ini:{" "}
                <span className="font-mono">{admin.referralCode}</span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="newUsername"
              className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
            >
              Username
            </label>
            <input
              id="newUsername"
              name="newUsername"
              type="text"
              required
              minLength={3}
              maxLength={20}
              autoComplete="off"
              defaultValue={admin.username}
              disabled={pending}
              className={inputClass}
            />
          </div>

          {canEditRole && currentRole === "admin_staff" && (
            <div>
              <label
                htmlFor="newReferralCode"
                className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
              >
                Referral Code
              </label>
              <input
                id="newReferralCode"
                name="newReferralCode"
                type="text"
                maxLength={20}
                autoComplete="off"
                defaultValue={admin.referralCode ?? ""}
                placeholder="cth: 12345 atau staff_andi"
                disabled={pending}
                className={`${inputClass} font-mono`}
              />
              <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                Boleh angka, huruf, underscore, dan hyphen. 3-20 karakter. Kosongkan
                untuk mempertahankan yang ada.
              </p>
              {state.fieldErrors?.newReferralCode ? (
                <p className="mt-1 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                  {state.fieldErrors.newReferralCode[0]}
                </p>
              ) : null}
            </div>
          )}

          {state.fieldErrors?.newLeaderId ? (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
              {state.fieldErrors.newLeaderId[0]}
            </p>
          ) : null}

          {state.error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
              {state.error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => onResetPassword(admin)}
              disabled={pending}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800 transition hover:bg-amber-200 disabled:opacity-50 sm:text-sm"
            >
              <KeyRound className="size-3" />
              Reset Password
            </button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
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
                {pending && <Loader2 className="size-3 animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteAdminModal({
  admin,
  onClose,
  onDeleted,
}: {
  admin: Admin;
  onClose: () => void;
  onDeleted: (msg: string) => void;
}) {
  const [state, action] = useActionState(deleteAdminUser, initialState);
  const [pending, startTransition] = useTransition();
  const onDeletedRef = useRef(onDeleted);
  useEffect(() => {
    onDeletedRef.current = onDeleted;
  }, [onDeleted]);

  useEffect(() => {
    if (state === initialState) return;
    if (state.success && state.message) onDeletedRef.current(state.message);
  }, [state]);

  useModalLifecycle(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Hapus admin @${admin.username}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <h2 className="text-sm font-bold text-rose-700 sm:text-base">
            Hapus Admin?
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

        <p className="text-xs text-zinc-700 sm:text-sm">
          Anda akan menghapus akun{" "}
          <strong>@{admin.username}</strong> ({ROLE_LABELS[admin.role] ?? admin.role}).
        </p>
        {admin.role === "admin_staff" && admin.memberCount > 0 && (
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800 sm:text-xs">
            <strong>Perhatian:</strong> {admin.memberCount} anggota akan kehilangan
            koneksi referral (akan jadi orphan, tidak di bawah siapa-siapa).
          </p>
        )}

        <form
          action={(fd) => startTransition(() => action(fd))}
          className="mt-4 space-y-3"
        >
          <input type="hidden" name="adminId" value={admin.id} />

          {state.error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-2">
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
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50 sm:text-sm"
            >
              {pending && <Loader2 className="size-3 animate-spin" />}
              <Trash2 className="size-3" />
              Hapus
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SetLeaderModal({
  staff,
  leaders,
  isCurrentSuperAdmin,
  currentLeaderId,
  currentLeaderUsername,
  onClose,
  onSaved,
}: {
  staff: Admin;
  leaders: LeaderOption[];
  isCurrentSuperAdmin: boolean;
  /**
   * ID leader yang sedang login. Dipakai sebagai default value (dan
   * satu-satunya pilihan) untuk role `admin_leader`.
   */
  currentLeaderId: string;
  /** Username leader yang sedang login, untuk fallback ketika leaders belum termuat. */
  currentLeaderUsername: string;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [state, action] = useActionState(setStaffLeader, initialState);
  const [pending, startTransition] = useTransition();
  const onSavedRef = useRef(onSaved);
  useEffect(() => {
    onSavedRef.current = onSaved;
  }, [onSaved]);

  useEffect(() => {
    if (state === initialState) return;
    if (state.success && state.message) onSavedRef.current(state.message);
  }, [state]);

  useModalLifecycle(onClose);

  // Daftar opsi leader yang boleh dipilih:
  //  - super admin: semua leader
  //  - admin leader: hanya diri sendiri (dropdown disabled, value terkunci)
  const options: LeaderOption[] = isCurrentSuperAdmin
    ? leaders
    : [{ id: currentLeaderId, username: currentLeaderUsername }];

  const isOrphan = !staff.leaderUsername;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Set leader untuk @${staff.username}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <form
        action={(fd) => startTransition(() => action(fd))}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            {isOrphan ? "Kaitkan Staff ke Leader" : "Ganti Leader Staff"}
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

        <p className="text-[11px] text-zinc-600 sm:text-xs">
          Staff{" "}
          <span className="font-semibold text-zinc-900">@{staff.username}</span>{" "}
          {isOrphan ? (
            <>
              saat ini{" "}
              <span className="font-semibold text-rose-600">belum terikat</span> ke
              leader manapun. Pilih leader untuk staff ini.
            </>
          ) : (
            <>
              saat ini di bawah{" "}
              <span className="font-semibold text-zinc-900">@{staff.leaderUsername}</span>.
              Pilih leader baru.
            </>
          )}
        </p>

        {options.length === 0 ? (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-800 sm:text-xs">
            Belum ada Admin Leader. Buat leader terlebih dahulu.
          </p>
        ) : (
          <div className="mt-3">
            <label
              htmlFor="newLeaderId"
              className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
            >
              Leader <span className="text-rose-600">*</span>
            </label>
            <select
              id="newLeaderId"
              name="newLeaderId"
              required
              defaultValue={isOrphan ? currentLeaderId : staff.leaderId ?? currentLeaderId}
              disabled={pending || !isCurrentSuperAdmin}
              className={inputClass}
            >
              {isCurrentSuperAdmin && (
                <option value="" disabled>
                  Pilih leader...
                </option>
              )}
              {options.map((l) => (
                <option key={l.id} value={l.id}>
                  @{l.username}
                </option>
              ))}
            </select>
            {!isCurrentSuperAdmin && (
              <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                Leader hanya dapat menetapkan diri sendiri sebagai leader.
              </p>
            )}
            {state.fieldErrors?.newLeaderId?.[0] && (
              <p className="mt-1 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
                {state.fieldErrors.newLeaderId[0]}
              </p>
            )}
          </div>
        )}

        <input type="hidden" name="staffId" value={staff.id} />

        {state.error && (
          <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
            {state.error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
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
            disabled={pending || options.length === 0}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:text-sm"
          >
            {pending && <Loader2 className="size-3 animate-spin" />}
            <Link2 className="size-3" />
            {isOrphan ? "Kaitkan" : "Ganti Leader"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CreateAdminModal({
  leaders,
  canCreateLeader,
  currentLeaderId,
  onClose,
  onCreated,
}: {
  leaders: LeaderOption[];
  /**
   * `true` untuk super admin (boleh membuat Admin Leader).
   * `false` untuk admin leader (hanya boleh membuat Admin Staff, dengan leaderId otomatis).
   */
  canCreateLeader: boolean;
  /**
   * ID admin leader yang sedang login. Dipakai sebagai default leaderId
   * ketika admin leader membuat staff baru.
   */
  currentLeaderId: string;
  onClose: () => void;
  onCreated: (result: AdminUserState) => void;
}) {
  const [state, action] = useActionState(createAdminUser, initialState);
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [role, setRole] = useState<"admin_leader" | "admin_staff" | "">(
    canCreateLeader ? "" : "admin_staff",
  );
  // Simpan callback terbaru di ref agar useEffect tidak retrigger tiap parent re-render.
  const onCreatedRef = useRef(onCreated);
  useEffect(() => {
    onCreatedRef.current = onCreated;
  }, [onCreated]);

  // Pakai reference equality: `state === initialState` artinya action belum pernah dipanggil.
  // Aman terhadap React StrictMode (double-invoke effect di dev).
  useEffect(() => {
    if (state === initialState) return;
    if (state.success) {
      onCreatedRef.current(state);
    }
  }, [state]);

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
      aria-label="Tambah Admin"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-5">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            Tambah Admin
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

        {state.success ? (
          <div className="space-y-3">
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800 sm:text-xs">
              {state.message}
            </div>
            {state.generatedReferralCode && (
              <div>
                <label className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs">
                  Referral Code
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={state.generatedReferralCode}
                    className={`${inputClass} font-mono tracking-wider`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (state.generatedReferralCode) {
                        navigator.clipboard.writeText(state.generatedReferralCode);
                      }
                    }}
                    aria-label="Salin referral"
                    className="rounded-md bg-indigo-100 p-2 text-indigo-700 transition hover:bg-indigo-200"
                  >
                    <Copy className="size-4" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 sm:text-sm"
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <form
            action={(fd) => startTransition(() => action(fd))}
            className="space-y-3"
          >
            <div>
              <label
                htmlFor="role"
                className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
              >
                Role
              </label>
              {canCreateLeader ? (
                <select
                  id="role"
                  name="role"
                  required
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as "admin_leader" | "admin_staff" | "")
                  }
                  disabled={pending}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Pilih role...
                  </option>
                  <option value="admin_leader">Admin Leader</option>
                  <option value="admin_staff">Admin Staff</option>
                </select>
              ) : (
                <>
                  <input type="hidden" name="role" value="admin_staff" />
                  <input
                    type="text"
                    readOnly
                    value="Admin Staff"
                    className={`${inputClass} bg-zinc-50`}
                  />
                  <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                    Leader hanya dapat membuat Admin Staff di bawah dirinya.
                  </p>
                </>
              )}
            </div>

            {role === "admin_staff" && canCreateLeader && (
              <LeaderSelect
                leaders={leaders}
                name="leaderId"
                disabled={pending}
                required
              />
            )}

            {role === "admin_staff" && !canCreateLeader && (
              <input type="hidden" name="leaderId" value={currentLeaderId} />
            )}

            <div>
              <label
                htmlFor="username"
                className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                minLength={3}
                maxLength={20}
                autoComplete="off"
                placeholder="cth: leader_budi atau staff_ana"
                disabled={pending}
                className={inputClass}
              />
              <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                3-20 karakter, hanya huruf, angka, dan underscore.
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
              >
                Password <span className="text-rose-600">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  maxLength={72}
                  autoComplete="new-password"
                  placeholder="Minimal 6 karakter"
                  disabled={pending}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                  className="rounded-md bg-zinc-100 p-2 text-zinc-600 transition hover:bg-zinc-200"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                Password diisi manual oleh admin. Minimal 6 karakter.
              </p>
              {state.fieldErrors?.password ? (
                <p className="mt-1 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
                  {state.fieldErrors.password[0]}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="passwordConfirmation"
                className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
              >
                Konfirmasi Password <span className="text-rose-600">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="passwordConfirmation"
                  name="passwordConfirmation"
                  type={showPasswordConfirmation ? "text" : "password"}
                  required
                  minLength={6}
                  maxLength={72}
                  autoComplete="new-password"
                  placeholder="Ketik ulang password"
                  disabled={pending}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirmation((v) => !v)}
                  aria-label={showPasswordConfirmation ? "Sembunyikan" : "Tampilkan"}
                  className="rounded-md bg-zinc-100 p-2 text-zinc-600 transition hover:bg-zinc-200"
                >
                  {showPasswordConfirmation ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {state.fieldErrors?.passwordConfirmation ? (
                <p className="mt-1 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
                  {state.fieldErrors.passwordConfirmation[0]}
                </p>
              ) : null}
            </div>

            {role === "admin_staff" && (
              <div>
                <label
                  htmlFor="referralCode"
                  className="mb-1 block text-[11px] font-medium text-zinc-700 sm:text-xs"
                >
                  Referral Code Manual <span className="text-zinc-400">(opsional)</span>
                </label>
                <input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  maxLength={20}
                  autoComplete="off"
                  placeholder="cth: 12345 atau staff_andi"
                  disabled={pending}
                  className={`${inputClass} font-mono`}
                />
                <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
                  Boleh angka, huruf, underscore, dan hyphen. 3-20 karakter. Kosongkan
                  untuk auto-generate.
                </p>
                {state.fieldErrors?.referralCode ? (
                  <p className="mt-1 rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
                    {state.fieldErrors.referralCode[0]}
                  </p>
                ) : null}
              </div>
            )}

            {state.fieldErrors?.username ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
                {state.fieldErrors.username[0]}
              </p>
            ) : null}
            {state.fieldErrors?.leaderId ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
                {state.fieldErrors.leaderId[0]}
              </p>
            ) : null}
            {state.fieldErrors?.role ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-xs">
                {state.fieldErrors.role[0]}
              </p>
            ) : null}

            {state.error && (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-[11px] text-rose-700 sm:text-sm">
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
                disabled={
                  pending ||
                  (role === "admin_staff" && canCreateLeader && leaders.length === 0)
                }
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50 sm:text-sm"
              >
                {pending && <Loader2 className="size-3 animate-spin" />}
                Buat Admin
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700",
    admin_leader: "bg-indigo-100 text-indigo-700",
    admin_staff: "bg-sky-100 text-sky-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${
        map[role] ?? "bg-zinc-100 text-zinc-700"
      }`}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function TeamTable({
  initialAdmins,
  leaders,
  isCurrentSuperAdmin,
  currentLeaderId,
  currentLeaderUsername,
}: {
  initialAdmins: Admin[];
  leaders: LeaderOption[];
  isCurrentSuperAdmin: boolean;
  /** ID admin leader yang sedang login. Untuk membuat staff baru. */
  currentLeaderId: string;
  /** Username leader yang sedang login, default value saat leader klaim orphan. */
  currentLeaderUsername: string;
}) {
  const [admins, setAdmins] = useState<Admin[]>(initialAdmins);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin_leader" | "admin_staff">("all");
  const [creating, setCreating] = useState(false);
  /** True setelah admin baru berhasil dibuat, untuk memicu reload hanya saat user menutup modal dari success view (bukan dari batal). */
  const [justCreated, setJustCreated] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [deleting, setDeleting] = useState<Admin | null>(null);
  const [resetting, setResetting] = useState<Admin | null>(null);
  /**
   * Staff yang sedang di-set leader-nya. Dipakai oleh `SetLeaderModal`.
   * Tombol "Set Leader" hanya muncul untuk admin_staff:
   *  - orphan (`leaderId == null`): semua leader & super admin boleh kaitkan
   *  - punya leader (`leaderId != null`): hanya super admin yang boleh ganti
   */
  const [settingLeader, setSettingLeader] = useState<Admin | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return admins.filter((a) => {
      if (roleFilter !== "all" && a.role !== roleFilter) return false;
      if (!q) return true;
      return (
        a.username.toLowerCase().includes(q) ||
        (a.referralCode?.toLowerCase().includes(q) ?? false) ||
        (a.leaderUsername?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [admins, query, roleFilter]);

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
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
            className={`${inputClass} sm:w-auto`}
          >
            <option value="all">Semua Role</option>
            <option value="admin_leader">Admin Leader</option>
            <option value="admin_staff">Admin Staff</option>
          </select>
          <span className="text-xs text-zinc-500 sm:ml-auto sm:text-sm">
            {filtered.length} dari {admins.length} admin
          </span>
          {currentLeaderId && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 sm:text-sm"
            >
              <Plus className="size-3.5" />
              Tambah Staff
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-zinc-200/60">
        <table className="w-full min-w-[860px] border-collapse">
          <thead className="bg-zinc-100">
            <tr>
              <th className={headerCellClass}>Username</th>
              <th className={headerCellClass}>Role</th>
              <th className={headerCellClass}>Leader</th>
              <th className={headerCellClass}>Referral Code</th>
              <th className={headerCellClass}>Jml. Member</th>
              <th className={headerCellClass}>Status</th>
              <th className={headerCellClass}>Dibuat</th>
              {currentLeaderId && (
                <th className={headerCellClass}>Aksi</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={currentLeaderId ? 8 : 7}
                  className="px-3 py-6 text-center text-xs text-zinc-500 sm:text-sm"
                >
                  {admins.length === 0
                    ? "Belum ada admin selain Anda."
                    : "Tidak ada admin yang cocok."}
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-zinc-200 transition hover:bg-zinc-50/60"
                >
                  <td className={`${cellClass} font-medium text-zinc-900`}>
                    @{a.username}
                  </td>
                  <td className={cellClass}>
                    <RoleBadge role={a.role} />
                  </td>
                  <td className={cellClass}>
                    {a.role === "admin_staff" ? (
                      a.leaderUsername ? (
                        <span>@{a.leaderUsername}</span>
                      ) : (
                        <span className="text-rose-600">(tanpa leader)</span>
                      )
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className={`${cellClass} font-mono text-[11px]`}>
                    {a.referralCode ?? "—"}
                  </td>
                  <td className={cellClass}>
                    {a.role === "admin_staff" ? a.memberCount : "—"}
                  </td>
                  <td className={cellClass}>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${
                        a.status === "banned"
                          ? "bg-rose-100 text-rose-700"
                          : a.status === "online"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className={cellClass}>{formatDate(a.createdAt)}</td>
                  {currentLeaderId && (
                    <td className={`${cellClass} whitespace-nowrap text-right`}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          aria-label={`Edit @${a.username}`}
                          onClick={() => setEditing(a)}
                          className="inline-flex items-center justify-center gap-1 rounded-md bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-200"
                        >
                          <Pencil className="size-3" />
                          Edit
                        </button>
                        {a.role === "admin_staff" && (isCurrentSuperAdmin || !a.leaderId) && (
                          <button
                            type="button"
                            aria-label={a.leaderId ? `Ganti leader @${a.username}` : `Kaitkan @${a.username} ke leader`}
                            onClick={() => setSettingLeader(a)}
                            className={`inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                              a.leaderId
                                ? "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                            }`}
                          >
                            <Link2 className="size-3" />
                            {a.leaderId ? "Ganti Leader" : "Set Leader"}
                          </button>
                        )}
                        {a.id !== currentLeaderId && (
                          <button
                            type="button"
                            aria-label={`Reset password @${a.username}`}
                            onClick={() => setResetting(a)}
                            className="inline-flex items-center justify-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-200"
                          >
                            <KeyRound className="size-3" />
                            Reset
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={`Hapus @${a.username}`}
                          onClick={() => setDeleting(a)}
                          className="inline-flex items-center justify-center gap-1 rounded-md bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-200"
                        >
                          <Trash2 className="size-3" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <CreateAdminModal
          leaders={leaders}
          canCreateLeader={isCurrentSuperAdmin}
          currentLeaderId={currentLeaderId}
          onClose={() => {
            setCreating(false);
            if (justCreated) {
              setJustCreated(false);
              window.location.reload();
            }
          }}
          onCreated={(result) => {
            setJustCreated(true);
            setToast({
              type: "success",
              text:
                result.message ??
                "Admin berhasil dibuat. Salin passwordnya di modal.",
            });
          }}
        />
      )}

      {editing && (
        <EditAdminModal
          admin={editing}
          leaders={leaders}
          canEditRole={isCurrentSuperAdmin}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            setToast({ type: "success", text: msg });
            window.location.reload();
          }}
          onResetPassword={(a) => {
            setEditing(null);
            setResetting(a);
          }}
        />
      )}

      {resetting && (
        <ResetPasswordModal
          admin={resetting}
          onClose={() => setResetting(null)}
          onReset={(msg) => {
            setToast({ type: "success", text: msg });
          }}
        />
      )}

      {deleting && (
        <DeleteAdminModal
          admin={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={(msg) => {
            setDeleting(null);
            setAdmins((cur) => cur.filter((a) => a.id !== deleting.id));
            setToast({ type: "success", text: msg });
          }}
        />
      )}

      {settingLeader && (
        <SetLeaderModal
          staff={settingLeader}
          leaders={leaders}
          isCurrentSuperAdmin={isCurrentSuperAdmin}
          currentLeaderId={currentLeaderId}
          currentLeaderUsername={currentLeaderUsername}
          onClose={() => setSettingLeader(null)}
          onSaved={(msg) => {
            setSettingLeader(null);
            setToast({ type: "success", text: msg });
            window.location.reload();
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
