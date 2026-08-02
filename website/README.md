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

Backend memakai dua database secara bersamaan:

- MySQL sebagai database utama untuk user, auth, leads, dan data utama.
- SQLite sebagai database lokal untuk cache/log seperti `auth_logs`.

```env
# Primary database
DB_PRIMARY=mysql

# SQLite local/cache/log
DB_SQLITE_PATH=storage/sqlite/arduflow.sqlite

# MySQL main database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=db_arduflow
DB_USERNAME=root
DB_PASSWORD=
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

Hapus data user lama dari SQLite dan MySQL:

```bash
cd website/BE
npm run db:reset-users
```

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
