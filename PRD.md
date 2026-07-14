Rangkuman Teknis Proyek
Overview
Nama proyek: E-Commerce Dropship Multi-Role & E-Wallet Manual
Referensi: reviewup.shop (branding mirip Tokopedia, UI diminta mirip tapi fungsionalitas bisa dikustomisasi)
Stack disebutkan di awal: React, Next.js, Laravel, WordPress (belum dikonfirmasi stack final yang dipakai)
Tanpa: payment gateway, tanpa integrasi pihak ketiga (Tokopedia dll)
Arsitektur Role & Akses (RBAC)
4 tingkat hierarki:

Super Admin — kontrol penuh sistem, approve/reject deposit & withdraw, membuat akun Leader
Admin Leader — dashboard monitoring performa tim Staf di bawahnya
Admin Staf — dashboard kelola member yang mendaftar via kode referal miliknya
Member (Dropshipper) — katalog produk, proses pesanan, riwayat mutasi saldo, ajukan deposit/withdraw

Modul & Logika Fungsional
1. Registrasi & Referal

Kode referal unik & statis per Admin Staf
Member yang daftar via kode tsb otomatis terkunci permanen di bawah staf bersangkutan
Bonus saldo awal otomatis Rp30.000 saat registrasi member baru

2. Alur Transaksi Pesanan

Member ambil tugas dari katalog → Admin Staf input harga manual per pesanan → sistem potong saldo e-wallet internal member
Jika saldo tidak cukup → sistem wajib block/redirect ke alur deposit dulu
Setelah dikonfirmasi selesai → sistem hitung otomatis & kredit komisi ke saldo member

3. Sistem Tiering & Kalkulasi Komisi Otomatis
Sistem harus membaca akumulasi jumlah transaksi sukses member untuk auto-update level:
LevelRange TransaksiKomisiClassic1–520% dari harga produkSilver6–1530% dari harga produkPlatinum16–20+35% dari harga produk
Level & skor kredit member juga harus bisa diedit manual oleh admin.
4. Modul E-Wallet (buku kas manual, non payment gateway)

Deposit: member lihat no. rekening di web → transfer manual → isi form konfirmasi + upload bukti transfer → status "Pending" → Super Admin/Staf ubah status "Disetujui" → saldo (angka fiktif) bertambah otomatis
Withdraw: member ajukan nominal → saldo langsung terpotong dengan status "Diproses" → admin transfer manual via m-banking → admin ubah status jadi "Selesai"
Perlu fitur reject dengan alasan manual (misal rekening tidak valid)

5. Modul Admin Tools yang Perlu Dibangun

Dashboard: ringkasan total member daftar, deposit, penarikan per hari
Tools Anggota: lihat saldo, edit level, edit skor kredit, edit saldo manual (tambah/kurang), reset password member, reset password penarikan
Tools Tugas: input/assign harga pesanan ke member
Tools Deposit & Penarikan: approve/reject dengan upload bukti & alasan
Tools Rekening: lihat & edit data rekening/e-wallet member
Tools Produk: CRUD produk (gambar + harga)
Tools Chat → diubah jadi "Layanan Pelanggan": admin input link eksternal (WA/Telegram); di sisi member muncul tombol akses layanan pelanggan

Fitur Tambahan (Requested Mid-Project)

Custom filter tanggal di dashboard: agar total member/deposit/penarikan tidak reset otomatis per hari, tapi bisa ditarik historinya berdasarkan rentang tanggal custom

Milestone Teknis
MilestoneCakupanM1 (Minggu 1)Struktur database, sistem login multi-role, sistem registrasi + referal staf, halaman katalog depan, form deposit manualM2 (Minggu 2)Logika transaksi dropship, kalkulasi komisi otomatis (3 tier), fitur withdraw manual, testing sistem, handover source code