[x] proteksi halaman login
[x] integrasi login & register dengan Supabase Auth
[x] auto-create profile di tabel profiles saat register (server action / trigger)
[x] implementasi logout yang proper (hapus session Supabase)
[x] proteksi route /admin/* (require role admin_*)
[x] proteksi route member (require authenticated)
[] ganti hardcode "Testfs" dengan data dari session/profile
[] integrasi /recharge → insert ke tabel deposits + upload bukti ke Storage
[] integrasi /withdraw → insert ke tabel withdrawals + potong frozen_balance
[] integrasi /bank → CRUD ke tabel bank_accounts
[] tampilkan data profile (saldo, level, tier) di /profil dari tabel profiles
[] replace dummy products di /admin/product dengan data tabel products
[] replace dummy channels di /admin/pelayanan dengan data tabel customer_service_channels
[] integrasi /admin/users dengan data tabel profiles (list, search, role)
[] integrasi /admin/rechargelist dengan data tabel deposits + filter status
[] integrasi /admin/withdrawList dengan data tabel withdrawals + filter status
[] integrasi /admin/task dengan data tabel tasks (orders)
[] approve/reject deposit (update status → approved: kredit saldo member, rejected: isi notes)
[] approve/reject withdrawal (update status → completed: kosongkan frozen, rejected: kembalikan ke saldo)
[] tools anggota: edit level, credit_score, saldo manual (+/- dengan catatan), reset password
[] setup Supabase Storage bucket "deposits" (RLS: member upload, admin read)
[] setup Supabase Storage bucket "products" (RLS: admin only)
[] generate referral_code unik per Admin Staf
[] form register member dengan input referral_code (auto-link ke staf)
[] auto bonus saldo awal Rp30.000 saat member baru registrasi
[] hitung komisi otomatis saat task selesai (berdasarkan level member)
[] auto-update level member berdasarkan akumulasi transaksi sukses
[] dashboard admin (/admin/dashboard) dengan statistik real + filter date range custom
[] audit log tabel untuk perubahan saldo manual oleh admin
[] hapus lib/dummy-channels.ts & dummy lain yang sudah di-replace DB
[] loading & empty states di semua halaman yang query DB
[] error handling & toast notification global
[] form validation client + server (zod + react-hook-form)




### Seed akun
- Super Admin: Username `superadmin`, Password `Reviewup@123`, Akses `/admin/dashboard`
- Admin Leader: Username `adminleader`, Password `Reviewup@123`, Akses `/admin/dashboard`
- Admin Staff: Username `adminstaff`, Password `Reviewup@123`, Akses `/admin/dashboard` (+ referral code STAFF001)
- Member: Username `member`, Password `Reviewup@123`, Akses `/profil` (saldo awal Rp30.000)
