# ArduFlow PHP API

Backend PHP ini adalah target migrasi dari `website/BE`. Entry point utama ada di `public/index.php` dan routing utama ada di `app/Application.php`.

## Struktur folder

```text
API/
  app/                 Kode utama backend PHP: controller, service, repository, HTTP, security.
  api/                 Endpoint legacy/prosedural yang belum dipindah ke app/.
  bootstrap/           Bootstrap aplikasi dan context konfigurasi.
  config/              Konfigurasi app, auth, database, mail, MQTT, sync, backup.
  migrations/          Migrasi SQLite dan MySQL.
  public/              Document root untuk PHP built-in server atau web server.
  scripts/             Script operasional database, import, seed, backup, sync.
  storage/             Database aktif, backup, dan log runtime.
  tests/               Test integrasi sederhana.
  router.php           Wrapper root untuk development server.
```

Catatan folder:

- Jalankan server dari root `website/API` agar semua path config, storage, dan autoload konsisten.
- `storage/database/arduflow.sqlite` adalah database aktif sesuai `config/database.php`.
- `api/` dipertahankan untuk endpoint legacy seperti `/api/leads`, `/api/articles`, dan `/api/projects`.
- Endpoint auth/admin/workshop/program utama dilayani dari `app/`, bukan dari file prosedural di `api/`.

## Menjalankan API lokal

```bash
cd website/API
composer install
copy .env.example .env
php scripts/check-runtime.php
php scripts/init-sqlite.php
php scripts/import-auth-from-node-sqlite.php
php scripts/seed-admin.php
php -S 0.0.0.0:8000 router.php
```

Alternatif yang setara jika ingin memakai document root `public` secara eksplisit:

```bash
php -S 0.0.0.0:8000 -t public public/router.php
```

Isi `ADMIN_SEED_PASSWORD` dan variabel admin lain pada `.env` sebelum menjalankan seed. Import auth membuat backup SQLite PHP, mempertahankan ID user/admin, tidak membawa sesi lama, dan tidak membuat event outbox.

Endpoint yang tersedia:

- `GET /api/health`
- `GET /api/health/database`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `GET|POST /api/auth/verify-email`
- `POST /api/auth/password-reset/request`
- `POST /api/auth/password-reset/confirm`
- `GET|POST /api/auth/check-availability`
- `PUT /api/auth/profile`
- `POST /api/admin/login`
- `GET /api/admin/session`
- `POST /api/admin/logout`
- `GET /api/admin/database-sync/status`
- `POST /api/admin/database-sync/run`
- `POST /api/admin/database-sync/retry-failed`
- `POST /api/internal/sync/sqlite-to-mysql` (Bearer + HMAC, bukan untuk pengguna)
- `POST /api/leads` (legacy procedural)
- `GET|POST /api/articles` (legacy procedural)
- `GET|POST /api/projects` (legacy procedural)

Jangan meletakkan `storage/database/arduflow.sqlite` di bawah `public`.

## Status migrasi

Sudah tersedia:

- Router HTTP dan respons JSON.
- CORS berbasis allowlist.
- PDO SQLite dengan WAL, foreign key, busy timeout, dan synchronous normal.
- PDO MySQL opsional untuk migrasi dan health check.
- Migrasi skema awal SQLite dan MySQL.
- Tabel outbox dan log sinkronisasi.
- Health check yang tetap sukses ketika MySQL tidak dapat dijangkau.
- Auth user dan admin berbasis bearer token yang seluruhnya membaca SQLite.
- Register, update profil, verifikasi email, reset password, dan seed admin dengan transaksi outbox.
- SMTP PHPMailer untuk tombol verifikasi dan reset password.
- Import awal user/admin dari SQLite Node tanpa outbox dan tanpa sesi lama.
- Integration test auth, sesi, rollback outbox, soft delete, dan admin.

Belum dialihkan ke PHP:

- Dashboard API.
- CRUD workshop/program dan modul konten lain.
- MQTT.

## Sinkronisasi SQLite ke MySQL

Isi `SYNC_API_URL`, `SYNC_API_TOKEN`, dan `SYNC_HMAC_SECRET`, lalu jalankan:

```bash
composer sync:run
```

Worker mengunci batch agar tidak diproses dua worker, mengirim Bearer token dan HMAC, dan memakai backoff 1, 5, 15, 30, lalu maksimal 60 menit. Event baru ditandai `synced` setelah endpoint MySQL mengembalikan sukses.

```cron
*/5 * * * * cd /path/to/arduflow/website/API && php scripts/sync-sqlite-to-mysql.php >> storage/logs/sync-cron.log 2>&1
```

Pada PHP development server satu proses, jalankan worker CLI dari terminal lain. Jangan memicu endpoint `database-sync/run` jika `SYNC_API_URL` menunjuk kembali ke development server yang sama.

Jalankan test dengan:

```bash
composer test:auth
composer test:sync
# atau seluruh test
composer test
composer db:backup
composer db:import
composer db:check
```

Lihat `docs/php-backend-migration.md` untuk rencana dan status lengkap.
