## Auth & Route Protection
- [x] proteksi halaman login
- [x] integrasi login & register dengan Supabase Auth
- [x] auto-create profile di tabel profiles saat register (server action / trigger)
- [x] implementasi logout yang proper (hapus session Supabase)
- [x] proteksi route /admin/* (require role admin_*)
- [x] proteksi route member (require authenticated)

## Member (fitur untuk user / role `member`)
- [x] tampilkan data profile (saldo, level, tier) di /profil dari tabel profiles
- [x] ganti hardcode "Testfs" dengan data dari session/profile
- [x] form register member dengan input referral_code (auto-link ke staf)
- [x] auto bonus saldo awal Rp30.000 saat member baru registrasi
- [x] integrasi /recharge → insert ke tabel deposits + upload bukti ke Storage
- [x] integrasi /withdraw → insert ke tabel withdrawals + potong frozen_balance
- [x] integrasi /bank → CRUD ke tabel bank_accounts

## Admin (fitur untuk user / role `admin_*`)
- [x] replace dummy products di /admin/product dengan data tabel products
- [x] replace dummy channels di /admin/pelayanan dengan data tabel customer_service_channels
- [x] integrasi /admin/users dengan data tabel profiles (list, search, role)
- [x] integrasi /admin/rechargelist dengan data tabel deposits + filter status
- [x] integrasi /admin/withdrawlist dengan data tabel withdrawals + filter status
- [x] integrasi /admin/task dengan data tabel tasks (orders)
- [x] approve/reject deposit (approved → kredit saldo member, rejected → isi notes)
- [x] approve/reject withdrawal (completed → kosongkan frozen, rejected → kembalikan ke saldo)
- [x] tools anggota: edit level, credit_score, saldo manual (+/- dengan catatan), reset password
- [x] generate referral_code unik per Admin Staf
- [x] dashboard admin (/admin/dashboard) dengan statistik real + filter date range custom
- [x] audit log tabel untuk perubahan saldo manual oleh admin

## Shared / Infrastructure
- [x] setup Supabase Storage bucket "deposits" (RLS: member upload, admin read)
- [x] setup Supabase Storage bucket "products" (RLS: admin only)
- [x] hitung komisi otomatis saat task selesai (berdasarkan level member)
- [x] auto-update level member berdasarkan akumulasi transaksi sukses
- [x] hapus lib/dummy-channels.ts & dummy lain yang sudah di-replace DB
- [x] loading & empty states di semua halaman yang query DB
- [x] error handling & toast notification global
- [x] form validation client + server (zod + react-hook-form)

---

## Audit CRUD (hasil temuan 2026-07-16)

### Profil (users)
- Create: ✅ via Supabase Auth signUp
- Read: ✅ `/admin/users`
- Update: ✅ level / credit_score / saldo / status / reset password (admin)
- Delete: ❌ belum ada UI hapus user (bisa ditambahkan atau ditahan)
- Catatan: halaman `/profil/change-password` sudah ada UI-nya, tapi `handleSubmit`-nya cuma validasi lokal lalu `setSuccess(true)` tanpa panggil server action/Supabase Auth — jadi anggota belum benar-benar bisa ganti password sendiri (lihat Perubahan Kritis)

### Produk
- Create: ✅ admin (`/admin/product`)
- Read: ✅ admin (`/admin/product`) & dipakai di `/task` & `/order`
- Update: ✅ admin
- Delete: ✅ admin

### Tugas (tasks)
- Read: ✅ admin (`/admin/task`) & member (`/order`)
- Update: ✅ admin & member (rating modal → status `selesai`)

### Deposit
- Create: ✅ member (`/recharge`)
- Read: ✅ admin (`/admin/rechargelist`) & member (`/profil/rechargelist`)
- Update: ✅ admin (approve/reject via `reviewDeposit`)

### Penarikan
- Create: ✅ member (`/withdraw`)
- Read: ✅ admin (`/admin/withdrawlist`) & member (`/profil/withdrawlist`)
- Update: ✅ admin (complete/reject via `reviewWithdrawal`)

### Rekening Bank (member)
- Create: ✅ `/bank` (add modal)
- Read: ✅ `/bank`
- Update: ❌ **belum ada edit rekening (hanya delete & set primary)**
- Delete: ✅
- Set primary: ✅

### Rekening Bank (admin)
- Read: ❌ **`/admin/account` masih pakai data dummy, belum query ke `bank_accounts`**
- Edit / hapus oleh admin: ❌

### Channel Pelayanan
- Create: ✅ admin (`/admin/pelayanan`)
- Read: ✅ admin & member (`/support`)
- Update: ✅ admin
- Delete: ✅ admin

### Audit Log ( Role leader nanti saja )
- Create: ✅ otomatis (saat admin adjust saldo / update level / reset password / task selesai)
- Read: ❌ **belum ada UI viewer untuk admin melihat histori perubahan (mis. `/admin/audit`)**
- Update / Delete: tidak applicable
                `       `       `   
### Perubahan Kritis (tambahan)
- [x] `/profil/change-password` masih fake success → wire ke `auth.updateUserById` (login) & update `withdraw_password_hash` via `crypt()` (withdraw)
- [x] Tambah server action `updateBankAccount` + tombol "Edit" di menu `/bank`
- [x] `/admin/account` query ke `bank_accounts` join `profiles` + search/role filter (paritas dengan `/admin/users`)

---

### Seed akun
- Super Admin: Username `superadmin`, Password `Reviewup@123`, Akses `/admin/dashboard`
- Admin Leader: Username `adminleader`, Password `Reviewup@123`, Akses `/admin/dashboard`
- Admin Staff: Username `adminstaff`, Password `Reviewup@123`, Akses `/admin/dashboard` (+ referral code `STAFF001`)
- Member: Username `member`, Password `Reviewup@123`, Akses `/profil` (saldo awal Rp30.000)
