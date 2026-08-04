# Migrasi Backend ArduFlow ke PHP

## Status

Dokumen ini mencatat migrasi bertahap. Backend Node.js pada `website/BE` tetap menjadi backend aktif sampai endpoint PHP lulus uji kompatibilitas. Fondasi PHP berada di `website/API`.

| Tahap | Status |
| --- | --- |
| Analisis repository | Selesai |
| Fondasi PHP, router, konfigurasi | Selesai |
| PDO SQLite/MySQL dan migrasi awal | Selesai |
| Auth user/admin | Selesai untuk endpoint inti |
| Repository dan outbox transaksi | Selesai untuk user/admin |
| Worker SQLite ke MySQL | Selesai untuk user/admin; pola siap diperluas |
| API internal HMAC dan idempotency MySQL | Selesai |
| Status/retry sinkronisasi admin | Selesai |
| Email SMTP | Selesai untuk verifikasi/reset |
| Dashboard admin API | Belum |
| MQTT opsional | Belum |
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
- PHP baru: `website/API/storage/database/arduflow.sqlite`

Kedua file sengaja dipisahkan selama migrasi. Jangan memakai file yang sama secara bersamaan dari Node dan PHP sebelum strategi cutover disetujui.

## Menjalankan PHP API lokal

```powershell
cd website/API
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

Salin `website/API/.env.example` menjadi `.env`. Nilai secret wajib dibuat sendiri dan tidak boleh di-commit:

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

Reset password dan soft delete mencabut seluruh sesi user yang aktif.

## Import auth dari Node

```powershell
php scripts/import-auth-from-node-sqlite.php
```

Sumber default adalah `website/BE/storage/database/arduflow.sqlite`, dapat diubah dengan `NODE_SQLITE_DATABASE_PATH`. Script membuat backup target ke `website/API/storage/backups/sqlite`, mempertahankan primary key, melakukan upsert user/admin, tidak membuat outbox, dan sengaja tidak mengimpor sesi lama.

Sesudah import, isi konfigurasi seed admin lalu jalankan:

```powershell
php scripts/seed-admin.php
```

## Pengujian auth

```powershell
composer test:auth
```

Test menggunakan SQLite `:memory:` dan memeriksa register, login, session, update profil, verifikasi email, reset password, pencabutan sesi, admin auth, soft delete, outbox, dan rollback perubahan utama ketika insert outbox dipaksa gagal.

## Frontend

Frontend masih diarahkan ke Node.js. Setelah auth dan endpoint utama PHP kompatibel, `website/FE/.env` dapat memakai:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Tidak ada perubahan UI yang diperlukan.

## Deployment FTP/PHP

Untuk hosting tanpa Composer CLI, jalankan `composer install --no-dev --optimize-autoloader` secara lokal lalu upload isi `website/API`, termasuk `vendor`, dengan document root diarahkan ke `website/API/public`. Folder `storage` harus writable dan tidak boleh berada di document root.

## Cron sinkronisasi

Worker belum dimigrasikan pada tahap fondasi. Target command dan cron:

```cron
*/5 * * * * php /path/to/project/website/API/scripts/sync-sqlite-to-mysql.php
```

Jika shared hosting tidak menyediakan cron, sinkronisasi harus dijalankan oleh cron eksternal atau worker terpisah. Sinkronisasi tidak boleh dipicu oleh setiap request pengguna.

## MQTT

Konfigurasi MQTT sudah disiapkan tetapi belum memasang client. `MQTT_ENABLED=false` adalah default. MQTT akan dipakai hanya untuk event realtime, notifikasi, telemetry, status device, dan command device. Auth dan CRUD tetap memakai HTTP API.

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
- Skema dashboard admin belum seluruhnya mempunyai data backend; beberapa halaman frontend masih memakai data contoh.
