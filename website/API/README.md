# ArduFlow PHP API

Backend PHP ini adalah target migrasi bertahap dari `website/BE`. Backend Node.js belum dihapus dan frontend belum dialihkan selama endpoint PHP belum kompatibel.

## Menjalankan fondasi lokal

```bash
cd website/API
composer install
copy .env.example .env
php scripts/check-runtime.php
php scripts/init-sqlite.php
php -S 127.0.0.1:8000 -t public public/router.php
```

Endpoint fondasi:

- `GET /api/health`
- `GET /api/health/database`

Jangan meletakkan `storage/database/arduflow.sqlite` di bawah `public`.

## Status migrasi

Tersedia pada tahap fondasi:

- Router HTTP dan respons JSON.
- CORS berbasis allowlist.
- PDO SQLite dengan WAL, foreign key, busy timeout, dan synchronous normal.
- PDO MySQL opsional untuk migrasi dan health check.
- Migrasi skema awal SQLite dan MySQL.
- Tabel outbox dan log sinkronisasi.
- Health check yang tetap sukses ketika MySQL tidak dapat dijangkau.

Belum dialihkan ke PHP:

- Auth user dan admin.
- Email verifikasi/reset password.
- Repository CRUD dan pembuatan outbox.
- Worker sinkronisasi.
- Dashboard API.
- MQTT.

Lihat `docs/php-backend-migration.md` untuk rencana dan status lengkap.
