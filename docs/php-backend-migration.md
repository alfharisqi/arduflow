# Migrasi Backend ArduFlow ke PHP

## Status

Dokumen ini mencatat migrasi bertahap. Backend Node.js pada `website/BE` tetap menjadi backend aktif sampai endpoint PHP lulus uji kompatibilitas. Fondasi PHP berada di `website/BE`.

| Tahap | Status |
| --- | --- |
| Analisis repository | Selesai |
| Fondasi PHP, router, konfigurasi | Selesai |
| PDO SQLite/MySQL dan migrasi awal | Selesai |
| Auth user/admin | Selesai untuk endpoint inti |
| Repository dan outbox transaksi | Selesai untuk user/admin/workshop/program |
| Worker SQLite ke MySQL | Selesai untuk user/admin/workshop/program |
| API internal HMAC dan idempotency MySQL | Selesai |
| Status/retry sinkronisasi admin | Selesai |
| Email SMTP | Selesai untuk verifikasi/reset |
| Dashboard admin API | Selesai untuk ringkasan utama |
| CRUD workshop/program | Selesai |
| Import/check/backup database | Selesai |
| MQTT opsional | Selesai sebagai publisher QoS 0; default nonaktif |
| Peralihan frontend | Belum |

## Arsitektur lama

```text
React/Vite -> Node.js/Express -> SQLite utama -> sync_outbox -> API HMAC -> MySQL
```

Backend Node memakai `express`, `mysql2`, `nodemailer`, dan `node:sqlite`. Tidak ada ORM. Session user/admin disimpan di SQLite dan token bearer disimpan dalam bentuk hash.

## Arsitektur target

```text
React/Vite -> PHP HTTP API -> SQLite utama -> sync_outbox -> worker PHP -> MySQL
                                      |
                                      +-> MQTT publish opsional
```

MySQL bukan dependency request pengguna. Jika MySQL mati, request tetap menggunakan SQLite dan event tertahan di outbox.

## Lokasi database

- Node aktif saat ini: `website/BE/storage/database/arduflow.sqlite`
- PHP baru: `website/BE/storage/database/arduflow.sqlite`

Kedua file sengaja dipisahkan selama migrasi. Jangan memakai file yang sama secara bersamaan dari Node dan PHP sebelum strategi cutover disetujui.

## Menjalankan PHP API lokal

```powershell
cd website/BE
composer install
Copy-Item .env.example .env
php scripts/check-runtime.php
php scripts/init-sqlite.php
php scripts/import-auth-from-node-sqlite.php
php scripts/seed-admin.php
php scripts/inspect-sqlite.php
php -S 127.0.0.1:8000 -t public public/router.php
```

Uji:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
Invoke-RestMethod http://127.0.0.1:8000/api/health/database
```

## Environment awal

Salin `website/BE/.env.example` menjadi `.env`. Nilai secret wajib dibuat sendiri dan tidak boleh di-commit:

- `SYNC_API_TOKEN`
- `SYNC_HMAC_SECRET`
- `ADMIN_SEED_PASSWORD`
- credential SMTP, MySQL, dan MQTT

`SQLITE_DATABASE_PATH` harus menunjuk ke folder privat di luar `public`.

## Inisialisasi MySQL

Perintah berikut hanya dijalankan setelah `.env` diverifikasi dan backup MySQL tersedia:

```powershell
php scripts/init-mysql.php
```

Pada tahap fondasi, migrasi memakai `CREATE TABLE IF NOT EXISTS`. Migrasi ini tidak menghapus data. Perubahan kolom database produksi lama akan ditangani migration tambahan yang eksplisit.

## PRAGMA SQLite

Setiap koneksi PHP mengaktifkan:

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
```

Operasi tulis dan outbox pada tahap repository akan menggunakan satu transaksi `BEGIN IMMEDIATE`.

## Kompatibilitas password

Password lama Node disimpan dengan format `scrypt$<salt>$<hash>`. Verifier legacy tersedia melalui `vinsaj9/scrypt`, tetapi implementasi PHP murni sangat lambat pada environment Windows/XAMPP yang diuji. Karena itu `AUTH_LEGACY_SCRYPT_ENABLED=false` menjadi default. Akun hasil import menerima kode `LEGACY_PASSWORD_RESET_REQUIRED` dan harus memakai reset password; password baru disimpan dengan Argon2id jika tersedia. Admin lama harus di-seed ulang. Jika extension/runtime scrypt yang cepat tersedia, opsi legacy dapat diaktifkan dan hash otomatis diubah setelah login berhasil.

## Auth dan session PHP

Endpoint auth user dan admin mempertahankan path serta bentuk respons yang dipakai `website/FE/src/services/authApi.js`. Token session mentah hanya dikirim ke client, sedangkan SQLite menyimpan hash SHA-256. Session tidak memakai MySQL sehingga login tetap bekerja saat MySQL mati.

Operasi berikut menulis row utama dan event `sync_outbox` dalam satu transaksi `BEGIN IMMEDIATE`:

- registrasi user;
- verifikasi email;
- reset password;
- update profil;
- soft delete user pada repository;
- seed/update admin dan rehash password.
- create, update, dan soft delete workshop;
- create, update, dan soft delete program.

Reset password dan soft delete mencabut seluruh sesi user yang aktif.

## Import auth dari Node

```powershell
php scripts/import-auth-from-node-sqlite.php
```

Sumber default adalah `website/BE/storage/database/arduflow.sqlite`, dapat diubah dengan `NODE_SQLITE_DATABASE_PATH`. Script membuat backup target ke `website/BE/storage/backups/sqlite`, mempertahankan primary key, melakukan upsert user/admin, tidak membuat outbox, dan sengaja tidak mengimpor sesi lama.

Sesudah import, isi konfigurasi seed admin lalu jalankan:

```powershell
php scripts/seed-admin.php
```

## Pengujian auth

```powershell
composer test:auth
```

Test menggunakan SQLite `:memory:` dan memeriksa register, login, session, update profil, verifikasi email, reset password, pencabutan sesi, admin auth, soft delete, outbox, dan rollback perubahan utama ketika insert outbox dipaksa gagal.

## Pengujian sinkronisasi

```powershell
composer test:sync
```

Test memeriksa claim dan locking antarkerja, batch HMAC, status `synced`, retry dan exponential backoff, payload JSON invalid, allowlist tabel/kolom, token/HMAC/timestamp salah, proteksi endpoint admin/internal, serta status admin ketika MySQL tidak tersedia. Uji idempotency langsung ke MySQL memerlukan server MySQL test yang aktif.

## Frontend

Frontend masih diarahkan ke Node.js. Setelah auth dan endpoint utama PHP kompatibel, `website/FE/.env` dapat memakai:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Tidak ada perubahan UI yang diperlukan.

## Dashboard dan konten

Endpoint PHP berikut tersedia dan mempertahankan struktur data yang dipakai frontend:

- `GET /api/admin/dashboard` (admin)
- `GET /api/workshops`
- `GET /api/workshops/{id}`
- `POST /api/workshops` (admin)
- `PUT /api/workshops/{id}` (admin)
- `DELETE /api/workshops/{id}` (admin, soft delete)
- `GET /api/programs`
- `GET /api/programs/{id}`
- `POST /api/programs` (admin)
- `PUT /api/programs/{id}` (admin)
- `DELETE /api/programs/{id}` (admin, soft delete)

Dashboard hanya membaca SQLite. Status MySQL berasal dari hasil worker terakhir, sehingga membuka dashboard tidak membuat request menunggu MySQL.

## Import, pemeriksaan, dan backup

```powershell
composer db:backup
composer db:import
composer db:check
```

`db:backup` memakai `VACUUM INTO` dan menjalankan `PRAGMA quick_check` pada hasilnya. `db:import` membuat backup target terlebih dahulu, mempertahankan ID, memakai upsert idempotent, dan tidak membuat outbox. `db:check` bersifat read-only serta membandingkan jumlah row, ID hilang, versi, `updated_at`, dan `deleted_at`.

Backup dikendalikan oleh:

```env
SQLITE_BACKUP_ENABLED=true
SQLITE_BACKUP_DIRECTORY=storage/backups/sqlite
SQLITE_BACKUP_RETENTION_DAYS=14
```

## Deployment FTP/PHP

Untuk hosting tanpa Composer CLI, jalankan `composer install --no-dev --optimize-autoloader` secara lokal lalu upload isi `website/BE`, termasuk `vendor`, dengan document root diarahkan ke `website/BE/public`. Folder `storage` harus writable dan tidak boleh berada di document root.

## Cron sinkronisasi

Worker PHP mengambil event `pending` paling lama, menguncinya dengan `worker_id`, lalu mengirim batch ke endpoint internal menggunakan Bearer token, timestamp, nonce, dan HMAC SHA-256. Event sukses ditandai `synced`; kegagalan koneksi kembali menjadi `pending` dengan backoff 1, 5, 15, 30, lalu maksimal 60 menit. Payload invalid ditandai `failed` agar tidak menghambat batch lain.

Jalankan manual:

```powershell
cd website/BE
composer sync:run
```

Cron production:

```cron
*/5 * * * * cd /path/to/project/website/BE && php scripts/sync-sqlite-to-mysql.php >> storage/logs/sync-cron.log 2>&1
```

Jika shared hosting tidak menyediakan cron, sinkronisasi harus dijalankan oleh cron eksternal atau worker terpisah. Sinkronisasi tidak boleh dipicu oleh setiap request pengguna.

Variabel wajib:

```env
SYNC_ENABLED=true
SYNC_API_URL=https://domain-api/api/internal/sync/sqlite-to-mysql
SYNC_API_TOKEN=token-random-panjang
SYNC_HMAC_SECRET=secret-random-panjang
SYNC_MAX_CLOCK_SKEW_SECONDS=300
SYNC_BATCH_SIZE=250
SYNC_HTTP_TIMEOUT_SECONDS=30
SYNC_PROCESSING_TIMEOUT_MINUTES=15
SYNC_IP_ALLOWLIST=
```

Endpoint internal menolak token/HMAC salah, timestamp kedaluwarsa, nonce replay, tabel atau kolom di luar allowlist, dan event versi lama. MySQL mencatat `event_id` pada `processed_sync_events`, sehingga pengiriman ulang tidak membuat data duplikat.

Endpoint admin terlindungi bearer session admin:

- `GET /api/admin/database-sync/status`
- `POST /api/admin/database-sync/run`
- `POST /api/admin/database-sync/retry-failed`

`status` tetap dapat dibaca ketika MySQL mati dan mengembalikan `mysql_reachable: false`. Untuk local development dengan PHP built-in server, jalankan worker melalui CLI di terminal lain agar request worker tidak menunggu request balik ke server satu proses yang sama.

## Simulasi MySQL mati

1. Jalankan PHP API dan arahkan `DB_PORT` sementara ke port yang tidak aktif.
2. Register atau update profil user.
3. Pastikan request berhasil dan row beserta event `sync_outbox` tersimpan di SQLite.
4. Jalankan `composer sync:run`; command gagal dengan event tetap `pending` dan `retry_count` bertambah.
5. Kembalikan konfigurasi MySQL, jalankan migration MySQL bila diperlukan, lalu jalankan worker setelah `next_retry_at` atau gunakan endpoint retry admin untuk event berstatus `failed`.
6. Periksa `processed_sync_events` di MySQL dan status `synced` di SQLite.

## MQTT

Publisher MQTT 3.1.1 QoS 0 tersedia tanpa proses subscriber permanen. `MQTT_ENABLED=false` tetap menjadi default; saat broker mati atau MQTT nonaktif, request HTTP dan transaksi SQLite tetap berhasil. Event yang saat ini dipublish meliputi registrasi/verifikasi/update profil serta create/update/delete workshop dan program.

```env
MQTT_ENABLED=false
MQTT_HOST=127.0.0.1
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=arduflow-php-api
MQTT_TOPIC_PREFIX=arduflow
MQTT_TIMEOUT_SECONDS=2
```

Topik memakai prefix, misalnya `arduflow/admin/notifications` dan `arduflow/users/{id}/notifications`. Login, register, verifikasi, dan CRUD tetap dilakukan melalui HTTP; MQTT hanya membawa event setelah operasi utama berhasil.

## Rollback

1. Jangan hapus `website/BE`.
2. Jangan menimpa SQLite Node selama pengembangan PHP.
3. Simpan konfigurasi frontend yang masih menunjuk ke Node.
4. Jika cutover PHP gagal, kembalikan `VITE_API_URL` ke backend Node dan deploy ulang build frontend.
5. Jalankan pemeriksaan konsistensi sebelum dan sesudah cutover.

## Risiko

- Hash scrypt Node memerlukan verifier kompatibel di PHP.
- Shared hosting dapat membatasi cron, extension SQLite/PDO, ukuran upload, dan koneksi MQTT.
- Dua backend tidak boleh menulis ke file SQLite yang sama tanpa rencana cutover dan locking yang diuji.
- Halaman admin selain dashboard utama dan workshop/program masih memakai sebagian data contoh dan perlu dimigrasikan bertahap.
