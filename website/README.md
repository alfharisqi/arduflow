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

## Menjalankan Frontend

```bash
cd website/FE
npm install
copy .env.example .env
npm run dev
```

Frontend berjalan di `http://127.0.0.1:5173`.

Ganti `DB_CONNECTION=mysql` di `website/BE/.env` bila ingin memakai MySQL, lalu import `website/BE/database/mysql/schema.sql` ke database `arduflow`.
