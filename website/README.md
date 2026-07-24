# Website Arduflow

Scaffold website Arduflow berdasarkan halaman Notion "Pengembangan Website Arduflow".

## Struktur

- `app/Pages`: halaman publik terpisah.
- `app/Components`: komponen UI reusable.
- `app/Features`: fitur/domain website.
- `app/Support`: helper konfigurasi, render, routing, dan database.
- `database/sqlite`: schema SQLite.
- `database/mysql`: schema MySQL.
- `public`: document root untuk web server.

## Menjalankan

```bash
cd website
cp .env.example .env
php scripts/init-sqlite.php
php -S 127.0.0.1:8080 -t public
```

Ganti `DB_CONNECTION=mysql` di `.env` bila ingin memakai MySQL, lalu import `database/mysql/schema.sql`.
