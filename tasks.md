## Seed Akun (Development)
- Super Admin: Username `superadmin`, Password `Reviewup@123`, Akses `/admin/dashboard`
- Admin Leader: Username `adminleader`, Password `Reviewup@123`, Akses `/admin/dashboard`
- Admin Staff: Username `adminstaff`, Password `Reviewup@123`, Akses `/admin/dashboard` (+ referral code `STAFF001`)
- Member: Username `member`, Password `Reviewup@123`, Akses `/profil` (saldo awal Rp30.000)
- Member test: Username `rinasyah`, Password `jika123` (referral `STAFF001`, sandi penarikan `123456`)


- Register akun OK
- halaman /task ( user )
- klik mulai tugas ( user )
- di arahkan ke halaman /order ( user )
- menunggu : "mohon menunggu... sistem sedang menetapkan produk" ( user)
- pada tabel admin muncul request status menunggu ( admin )
- admin pilih produk, status berubah menjadi "di pilih" ( admin )
- pada halaman /order muncul produk yang statusnya "di pilih" ( user )
- user klik kirimkan, muncul modal rating lalu klik kirimkan ( user )
- status berubah menjadi "dikerjakan" ( user )
- saldo user akun berkurang sesuai harga produk dan masuk saldo beku ( user )
- admin konfirmasi tugas ( admin )
- status berubah menjadi "selesai" ( admin | user )
- saldo user akun bertambah sesuai komisi dan hilang saldo beku ( user )


pada contoh di website lain saldo awal adalah rp. 30.000
kemudian user member mengerjakan tugas dengan harga produk 25000
nah pada saat selesai, saldo bertambah menjadi 35000 karena mendapatkan komisi 5000 dan saldo beku kembali menjadi rp. 0