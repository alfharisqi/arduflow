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
npm run dev
```

API berjalan di `http://127.0.0.1:3001`.

### Auth, Database, dan Mailpit

Backend mendukung dua koneksi database:

```env
# SQLite
DB_CONNECTION=sqlite
DB_SQLITE_PATH=storage/sqlite/arduflow.sqlite

# MySQL
DB_CONNECTION=mysql
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

## Menjalankan Frontend

```bash
cd website/FE
npm install
copy .env.example .env
npm run dev
```

Frontend berjalan di `http://127.0.0.1:5173`.
