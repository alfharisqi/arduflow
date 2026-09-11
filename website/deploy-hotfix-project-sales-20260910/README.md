Hotfix histori penjualan proyek

Upload file berikut ke hosting:

- api/transactions-api.php

Catatan: FE kamu berjalan lokal, jadi tidak perlu upload FE/dist untuk perubahan backend ini. Kalau perubahan frontend lokal belum aktif, restart Vite atau hard refresh browser.

Perubahan:

- Menambahkan endpoint GET action=project-sales.
- Endpoint mengembalikan pembelian user, sales proyek milik user login, transaksi pencairan terkait, balances, dan commissionRate.
- Request transaksi mengirim Authorization dan fallback X-Auth-Token supaya session tetap terbaca di shared hosting yang tidak meneruskan header Authorization ke PHP.
- Backend transaksi mengizinkan dan membaca header X-Auth-Token, getallheaders(), apache_request_headers(), dan REDIRECT_HTTP_AUTHORIZATION.
- Backend transaksi sekarang membaca token user dari user_sessions dan auth_tokens. Ini penting karena login utama menyimpan session user di user_sessions.
- Deteksi proyek milik user dibuat lebih toleran: userId/user_id/ownerId/authorId/creatorId/createdBy dan email owner/author/user.
- Frontend Proyek Saya memakai endpoint project-sales untuk tabel Histori Penjualan, bukan mengambil semua transaksi umum.

Urutan cek:

1. Upload api/transactions-api.php dari folder hotfix ini ke folder api di hosting.
2. Restart Vite lokal atau hard refresh browser.
3. Login ulang.
4. Buka Proyek User Dashboard.
5. Cek Network request action=project-sales harus 200.
