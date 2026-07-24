# Website Arduflow React + Vite

Scaffold website Arduflow berdasarkan halaman Notion "Pengembangan Website Arduflow".

## Struktur

- `src/pages`: halaman publik terpisah.
- `src/components`: komponen UI reusable.
- `src/features`: fitur/domain website.
- `server`: API Express untuk leads dan koneksi database.
- `database/sqlite`: schema SQLite.
- `database/mysql`: schema MySQL.
- `public`: aset statis Vite.

## Menjalankan

```bash
cd website
npm install
copy .env.example .env
npm run db:sqlite
npm run dev
```

Frontend berjalan di `http://127.0.0.1:5173`, API di `http://127.0.0.1:3001`.

Ganti `DB_CONNECTION=mysql` di `.env` bila ingin memakai MySQL, lalu import `database/mysql/schema.sql` ke database `arduflow`.
