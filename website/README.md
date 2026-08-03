# Website Arduflow

Scaffold website Arduflow berdasarkan halaman Notion "Pengembangan Website Arduflow".

## Struktur

- `FE`: frontend React + Vite.
- `FE/src/pages`: halaman publik terpisah.
- `FE/src/components`: komponen UI reusable.
- `FE/src/features`: fitur/domain website.
- `BE`: backend Express untuk leads dan koneksi database.
- `BE/database/sqlite`: schema SQLite.
- `BE/database/mysql`: schema MySQL.

## Menjalankan Backend

```bash
cd website/BE
npm install
copy .env.example .env
npm run db:sqlite
npm run db:mysql
npm run dev
```

API berjalan di `http://127.0.0.1:3001`.

### Auth, Database, dan Mailpit

Backend memakai arsitektur SQLite-primary dengan sinkronisasi satu arah:

- SQLite sebagai database operasional utama untuk user, auth, leads, workshop, dan data lokal.
- MySQL sebagai salinan pusat untuk backup, laporan, dan integrasi.
- `sync_outbox` mengirim perubahan secara asynchronous sehingga request pengguna tidak menunggu MySQL.

```env
# SQLite operational database
SQLITE_DATABASE_PATH=storage/database/arduflow.sqlite

# MySQL main database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=db_arduflow
DB_USERNAME=root
DB_PASSWORD=

SYNC_ENABLED=true
SYNC_API_URL=http://127.0.0.1:3001/api/internal/sync/sqlite-to-mysql
SYNC_API_TOKEN=<random-token>
SYNC_HMAC_SECRET=<random-secret>
```

Inisialisasi SQLite:

```bash
cd website/BE
npm run db:sqlite
```

Inisialisasi MySQL:

```bash
cd website/BE
npm run db:mysql
```

Jalankan satu batch sinkronisasi dan pemeriksaan konsistensi:

```bash
cd website/BE
npm run sync:run
npm run db:check
```

Dokumentasi lengkap tersedia di `docs/sqlite-mysql-sync.md`.

Untuk email register/verifikasi, jalankan Mailpit dan gunakan SMTP default berikut:

```env
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_SECURE=false
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM="Arduflow <no-reply@arduflow.local>"
```

Mailpit UI biasanya tersedia di `http://127.0.0.1:8025`.

### Test API dengan Postman

Import file berikut ke Postman:

- `website/BE/postman/Arduflow API.postman_collection.json`
- `website/BE/postman/Arduflow Local.postman_environment.json`

Urutan test:

1. Jalankan backend dengan `npm run dev`.
2. Jalankan request `Health`.
3. Jalankan `Auth / Register`.
4. Buka Mailpit di `http://127.0.0.1:8025`, salin token dari link verifikasi.
5. Isi variable `verification_token` di environment Postman.
6. Jalankan `Auth / Verify Email`.
7. Jalankan `Auth / Login`.

## Menjalankan Frontend

```bash
cd website/FE
npm install
copy .env.example .env
npm run dev
```

Frontend berjalan di `http://127.0.0.1:5173`.
