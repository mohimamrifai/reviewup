# Reviewup — Task List

> Diupdate: 2026-07-17 (rewrite: fokus ke task testing, hapus task development yang sudah selesai)

## Legend
- `[x]` = selesai
- `[ ]` = belum
- `[~]` = sebagian / placeholder

---

## Seed Akun (Development)
- Super Admin: Username `superadmin`, Password `Reviewup@123`, Akses `/admin/dashboard`
- Admin Leader: Username `adminleader`, Password `Reviewup@123`, Akses `/admin/dashboard`
- Admin Staff: Username `adminstaff`, Password `Reviewup@123`, Akses `/admin/dashboard` (+ referral code `STAFF001`)
- Member: Username `member`, Password `Reviewup@123`, Akses `/profil` (saldo awal Rp30.000)
- Member test: Username `rinasyah`, Password `jika123` (referral `STAFF001`, sandi penarikan `123456`)

---

## Auth (Login)
- [ ] **Test login admin** — `/admin/login` dengan username `superadmin` / `adminleader` / `adminstaff` → redirect ke `/admin/dashboard`
- [ ] **Test login member** — `/login` dengan username `member` / `rinasyah` → redirect ke `/`
- [ ] **Test login gagal** — password salah → toast error, tidak redirect
- [ ] **Test proteksi route admin** — akses `/admin/dashboard` tanpa login → redirect ke `/admin/login`
- [ ] **Test proteksi route member** — akses `/profil` tanpa login → redirect ke `/login`
- [ ] **Test signOut** — logout dari admin → redirect ke `/admin/login`; logout dari member → redirect ke `/login`
- [ ] **Test register member** — `/register` dengan referral code valid → auto-create profile + login
- [ ] **Test register member gagal** — referral code tidak valid → error
- [ ] **Test tidak ada register admin publik** — tidak ada route `/admin/register`
- [ ] **Test ganti password login** — `/profil/change-password` (tab Login) → berhasil update
- [ ] **Test ganti password penarikan** — `/profil/change-password` (tab Penarikan) → berhasil update

---

## Task Testing

> **Tidak perlu dikerjakan dulu** — hanya dokumentasi untuk QA / developer saat akan release.

### A. Unit Testing
- [ ] Setup framework testing (Vitest / Jest) — config + dependencies
- [ ] Test helper `getScope(userId)` di `lib/access.ts` — semua role: super_admin, admin_leader, admin_staff, member
- [ ] Test `assertCanAccessMember(scope, targetMemberId)` — positive & negative cases (FORBIDDEN_SCOPE)
- [ ] Test `canAccessMember(scope, targetMemberId)` — return true/false sesuai role
- [ ] Test `AccessOverrides` parsing — `fullAccess`, `canCreateStaff`, `canCreateLeader`, `commissionEdit`, `depositBankCrud` (true/false/missing)
- [ ] Test `getCommissionRate(level)` di `lib/levels.ts` — DB hit + cache hit + fallback ke `LEVEL_RATE_PERCENT`
- [ ] Test `revalidateCommissionCache()` — cache reset
- [ ] Test `formatRupiah()` di `lib/constants/withdrawal.ts` — angka bulat, desimal, 0, negatif
- [ ] Test `MIN_WITHDRAWAL_AMOUNT` & `MAX_WITHDRAWAL_AMOUNT` enforcement (Zod schema)
- [ ] Test `WITHDRAWAL_REJECTION_REASONS.includes()` (validasi enum)
- [ ] Test `WITHDRAWAL_AUTO_BAN_REASONS.includes()` (auto-ban trigger)
- [ ] Test `LEVEL_RATE_PERCENT` — semua level punya rate default
- [ ] Test `lib/team.ts` helpers: `getStaffStats`, `getStaffDetailStats`, `getStaffCommissionSummary` (mock DB)
- [ ] Test zod schemas — `submitWithdrawal`, `reviewWithdrawal`, `createAdminUser`, `updateAdminUser`, `setStaffCommissionRate`, `setAccessOverrides`, `addDepositBankAccount`, `submitDeposit`, `submitRating`

### B. Server Action Testing
- [ ] Test `signIn` & `adminSignIn` — credentials valid, invalid, locked account
- [ ] Test `signUp` — referral valid, referral invalid, duplicate username, weak password
- [ ] Test `signOut` & `adminSignOut` — session cleared
- [ ] Test `changeLoginPassword` & `changeWithdrawPassword` — old password salah, password baru sama dengan lama
- [ ] Test `submitWithdrawal` — saldo cukup, saldo kurang, saldo beku, bank tidak valid, min amount < 50.000
- [ ] Test `reviewWithdrawal` complete — pending → completed, frozen balance → 0, audit log ditulis
- [ ] Test `reviewWithdrawal` reject — pending → rejected, balance + amount, frozen - amount, notes format `[REJECT] Alasan: <reason>`
- [ ] Test `reviewWithdrawal` reject + auto-ban — alasan "Rekening tidak valid" → `profiles.status = 'banned'` + audit log `auto_ban_on_reject`
- [ ] Test `reviewWithdrawal` reject tanpa auto-ban — alasan "Saldo tidak cukup" → tidak ban
- [ ] Test `reviewWithdrawal` scope check — admin_staff review withdrawal dari member yang BUKAN referensinya → `FORBIDDEN_SCOPE`
- [ ] Test `reviewDeposit` — pending → approved/rejected, balance += amount, audit log
- [ ] Test `createTask` — member valid, level valid, price valid, commission dihitung via `getCommissionRate`
- [ ] Test `updateTaskStatus` — pending → completed/cancelled, scope check
- [ ] Test `setMemberStatus` — banned ↔ online, scope check
- [ ] Test `adjustBalance` — tambah/kurang saldo, audit log
- [ ] Test `updateLevel` & `updateCreditScore` — scope check
- [ ] Test `resetLoginPw` & `resetWithdrawPw` — generate password baru
- [ ] Test `createAdminUser` — role=admin_staff (oleh leader/super), role=admin_leader (super only), scope check `canCreateStaff` / `canCreateLeader`
- [ ] Test `updateAdminUser` — leader hanya edit staff di bawahnya, super edit semua (kecuali super lain & diri sendiri)
- [ ] Test `deleteAdminUser` — proteksi diri sendiri, proteksi super admin terakhir
- [ ] Test `addDepositBankAccount` & `updateDepositBankAccount` & `deleteDepositBankAccount` & `toggleDepositBankAccountActive` — scope `depositBankCrud`
- [ ] Test `setStaffCommissionRate` — super admin, atau `commissionEdit` override, range 0-100
- [ ] Test `updateCommissionSetting` — super admin, atau `commissionEdit` override, upsert per level
- [ ] Test `setAccessOverrides` — super admin only, target validation
- [ ] Test `submitDeposit` — upload proof, file size validation
- [ ] Test `submitRating` — 1-5 stars, duplicate detection
- [ ] Test `addBankAccount` & `updateBankAccount` & `deleteBankAccount` — CRUD validation

### C. Integration Testing (E2E flow)
- [ ] **Flow register → login → lihat katalog → ambil tugas → submit rating**
- [ ] **Flow member deposit → upload bukti → admin approve → saldo bertambah**
- [ ] **Flow member withdrawal → admin reject dengan alasan valid → saldo dikembalikan + member banned**
- [ ] **Flow member withdrawal → admin reject dengan alasan "Saldo tidak cukup" → saldo dikembalikan, member TIDAK banned**
- [ ] **Flow leader create staff → staff invite member → member register via referral**
- [ ] **Flow super admin create leader → leader create staff → hierarchy valid**
- [ ] **Flow super admin set access_overrides → leader kehilangan akses (e.g. depositBankCrud=false)**
- [ ] **Flow super admin update commission_settings → next task creation pakai rate baru**
- [ ] **Flow admin reject withdrawal dengan auto-ban → member tidak bisa transaksi lagi (deposit & withdraw ditolak)**
- [ ] **Flow admin lock member → member tidak bisa transaksi, admin unlock → normal lagi**

### D. Security Testing
- [ ] **Test scope enforcement** — admin_staff coba akses UUID member di luar timnya (manual via curl/Postman) → `FORBIDDEN_SCOPE`
- [ ] **Test role escalation** — admin_staff coba panggil `createAdminUser` → ditolak
- [ ] **Test SQL injection** — input form (username, bank name, notes) — harus aman via Drizzle parameterized queries
- [ ] **Test XSS** — input notes, username — harus di-escape saat render
- [ ] **Test CSRF** — server actions harus protected (Next.js otomatis, tapi verify)
- [ ] **Test file upload validation** — upload file non-image (e.g. .exe rename ke .jpg) → ditolak
- [ ] **Test file size limit** — upload > 5MB → ditolak
- [ ] **Test auth bypass** — akses `/admin/dashboard` dengan session expired → redirect login
- [ ] **Test super admin protection** — tidak ada cara delete satu-satunya super admin
- [ ] **Test audit log integrity** — semua perubahan penting (saldo, status, withdrawal) tercatat di `audit_logs`

### E. Manual UI/UX Testing
- [ ] **Test responsive** — mobile (375px), tablet (768px), desktop (1280px) untuk setiap halaman
- [ ] **Test empty states** — tabel kosong, list kosong, belum ada data
- [ ] **Test loading states** — skeleton muncul saat data fetch
- [ ] **Test error states** — toast error saat network failure / DB error
- [ ] **Test form validation** — semua error message muncul sesuai field (react-hook-form + zod)
- [ ] **Test modal lifecycle** — Escape close, backdrop click close, body scroll lock
- [ ] **Test toast top-center** — muncul 2-3 detik lalu hilang, click dismiss
- [ ] **Test mobile bottom nav** — klik tiap tab, active state visible
- [ ] **Test dark/light mode** (jika ada) — semua kontras teks cukup
- [ ] **Test accessibility** — keyboard navigation (Tab, Enter, Escape), focus ring visible, aria-label pada icon button
- [ ] **Test print preview** (jika ada) — halaman invoice/laporan

### F. Database Testing
- [ ] **Test trigger `handle_new_user`** — signup baru → profile auto-create dengan role benar
- [ ] **Test trigger referral code** — staff punya referral code, member tidak
- [ ] **Test trigger leader_id** — admin_staff yang dibuat leader dapat `leader_id = leader.id`
- [ ] **Test migration scripts** — semua SQL migration di folder `supabase/migrations/` bisa di-run di environment baru
- [ ] **Test seed data** — akun superadmin, adminleader, adminstaff, member, rinasyah tersedia setelah seed
- [ ] **Test orphan user cleanup** — jika createUser di Auth sukses tapi trigger gagal, user di-delete otomatis (auto-recovery)
- [ ] **Test cascade delete** — hapus admin_staff → `referredBy` member jadi NULL, tidak FK error
- [ ] **Test unique constraint** — username duplicate, referral code duplicate, email synthetic duplicate
- [ ] **Test frozen_balance integrity** — withdrawal pending → frozen = amount, complete → frozen = 0, reject → frozen = 0
- [ ] **Test concurrent updates** — 2 admin approve withdrawal yang sama → hanya 1 sukses
- [ ] **Test decimal precision** — amount 50.000, 100.000, 1.000.000, 100.000.000 — semua akurat
- [ ] **Test audit log retention** — log 6 bulan lalu masih bisa diakses (jika ada retention policy)

### G. Performance Testing
- [ ] **Test first page load** — `/` (homepage/katalog produk) < 2 detik
- [ ] **Test admin dashboard load** — `< 2 detik` untuk data aggregate
- [ ] **Test staff detail page** (`/admin/staff/[id]`) — query 12 bulan breakdown < 3 detik
- [ ] **Test commission summary** — `/admin/commission` dengan 50+ staff < 3 detik
- [ ] **Test concurrent users** — 10 user login bersamaan → tidak ada deadlock
- [ ] **Test large dataset** — query 1000+ member, pagination works
- [ ] **Test cache TTL** — `getCommissionRate` cache invalidate setelah update
- [ ] **Test revalidatePath coverage** — perubahan data di-reflect di semua halaman yang relevan (cek `revalidatePath` calls)

### H. Deployment Testing
- [ ] **Test Vercel build** — `pnpm build` sukses tanpa error/warning (sudah verified 2026-07-17)
- [ ] **Test environment variables** — `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` ada di Vercel
- [ ] **Test port 6543 pooler** — DATABASE_URL pakai port 6543 (transaction pooler)
- [ ] **Test Supabase storage** — bucket `products` (public), `deposits` (private) tersedia
- [ ] **Test RLS policies** (jika ada) — member tidak bisa query data member lain
- [ ] **Test production URL** — domain custom (jika ada) → HTTPS, redirect dari www ke non-www (atau sebaliknya)
- [ ] **Test backup** — backup Supabase DB harian aktif

### I. Compatibility Testing
- [ ] **Browser** — Chrome, Firefox, Safari, Edge (versi terbaru)
- [ ] **Mobile OS** — iOS Safari, Android Chrome
- [ ] **Network** — 3G (slow), 4G, WiFi — page load acceptable
- [ ] **Screen reader** — NVDA / VoiceOver — navigasi dasar berfungsi

### J. Regression Testing (after each release)
- [ ] **Smoke test full flow member** — register → deposit → ambil tugas → rating → withdrawal
- [ ] **Smoke test full flow admin** — login → lihat dashboard → approve deposit → reject withdrawal → manage staff
- [ ] **Smoke test full flow super admin** — login → create leader → create staff → set commission rate → audit log
- [ ] **Test back-button navigation** — dari modal ke list, state ter-reset dengan benar
- [ ] **Test refresh page** — state client (modal, search filter, dll) ter-reset dengan benar
- [ ] **Test sign-in dari multiple tab** — signOut di tab A → tab B juga logout

### K. Documentation Testing
- [ ] **Test PRD.md** — masih match dengan implementation actual
- [ ] **Test tasks.md** — masih match dengan implementation actual
- [ ] **Test SQL migration docs** — setiap migration file ada comment kapan dibuat & untuk apa
- [ ] **Test README** (jika ada) — setup steps benar, environment variables lengkap
- [ ] **Test API docs** (jika ada) — endpoint list lengkap dengan request/response

---

## Catatan Penting
- File `PRD.md` masih ada, baca sebelum mulai testing untuk reference.
- `tasks.md` ini sekarang hanya berisi task **testing** — task development sudah selesai (lihat git history untuk detail).
- **Migration SQL** yang perlu dijalankan di Supabase SQL editor sebelum deploy (sudah dibuat, jangan lupa eksekusi):
  - `add_leader_id_to_profiles.sql` (sudah)
  - `update_trigger_handle_leader_id.sql` (sudah)
  - `add_deposit_bank_accounts.sql` (sudah, table `deposit_bank_accounts`)
  - `add_commission_rate.sql` (sudah, kolom `profiles.commission_rate`)
  - `add_access_overrides.sql` (sudah, kolom `profiles.access_overrides`)
  - `add_commission_settings.sql` (sudah, table `commission_settings` + seed default)
- **Build status**: `pnpm build` lulus tanpa error/warning per 2026-07-17.
