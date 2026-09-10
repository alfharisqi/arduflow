Hotfix signup 500

Upload file berikut ke hosting, sesuai path yang sama:

- app/Application.php
- app/Database/LegacyApiMigrator.php

Tidak perlu build atau upload FE/dist karena FE berjalan lokal.

Masalah yang diperbaiki:

- CORS sudah lewat, tetapi signup valid masuk status 500.
- Penyebab paling kuat: database hosting sudah pernah menandai migration 001_initial sebagai applied, sementara isi 001_initial kemudian bertambah tabel/kolom seperti sync_outbox.
- Saat register user berhasil insert, UserRepository menulis event ke sync_outbox. Jika sync_outbox belum ada karena migrasi lama tidak dijalankan ulang, request register crash 500.
- Application sekarang menjalankan LegacyApiMigrator setelah SqliteMigrator. Migrator ini membuat/menambah tabel kompatibilitas lama seperti sync_outbox, auth_tokens, transaksi, payment_methods, dan tabel pendukung lain tanpa menghapus data.

Urutan cek:

1. Upload app/Application.php.
2. Upload app/Database/LegacyApiMigrator.php.
3. Hard refresh FE lokal.
4. Coba signup ulang dengan email baru.
5. Jika masih 500, buka file hosting storage/logs/app.log dan kirim 10 baris terakhir supaya stack trace pasti terlihat.
