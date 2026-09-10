Hotfix signup availability dan duplicate nomor/email

Upload file berikut ke hosting, sesuai path yang sama:

- app/Application.php
- app/Database/LegacyApiMigrator.php
- app/Controllers/UserAuthController.php
- app/Repositories/UserRepository.php

Tidak perlu build atau upload FE/dist karena FE berjalan lokal.

Masalah yang diperbaiki:

- Field nomor WhatsApp bisa hijau di cek realtime, tetapi setelah klik Daftar muncul Nomor WhatsApp sudah terdaftar.
- Penyebabnya availability sebelumnya memakai findByWhatsapp yang hanya membaca user aktif/deleted_at NULL, sedangkan UNIQUE index database tetap menolak nomor/email yang sudah ada walaupun row lama soft-deleted.
- Availability dan register sekarang memakai findAnyByEmail/findAnyByWhatsapp, yaitu cek yang mengikuti constraint database.
- WhatsApp juga dicek dengan beberapa variasi umum: +628xxx, 628xxx, dan 08xxx untuk mengurangi mismatch format lama.
- Jika submit tetap terkena duplicate dari database, backend mengembalikan 409 dengan pesan yang benar, bukan 500.

Urutan cek:

1. Upload semua file di atas.
2. Hard refresh FE lokal atau restart Vite.
3. Isi email/nomor yang sama seperti tadi.
4. Saat blur field nomor/email, status harus langsung merah jika datanya sudah pernah dipakai.
5. Untuk signup sukses, gunakan email baru dan nomor WhatsApp baru.
