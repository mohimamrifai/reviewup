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

### Seed akun
- Super Admin: Username `superadmin`, Password `Reviewup@123`, Akses `/admin/dashboard`
- Admin Leader: Username `adminleader`, Password `Reviewup@123`, Akses `/admin/dashboard`
- Admin Staff: Username `adminstaff`, Password `Reviewup@123`, Akses `/admin/dashboard` (+ referral code `STAFF001`)
- Member: Username `member`, Password `Reviewup@123`, Akses `/profil` (saldo awal Rp30.000)
