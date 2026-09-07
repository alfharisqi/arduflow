# BE API performance audit

Tanggal audit: 2026-09-07

## Tujuan

Optimasi difokuskan pada file di `website/BE/api` agar request harian lebih ringan tanpa mengubah kontrak response frontend. Perubahan yang dilakukan bersifat konservatif: mengurangi query berulang, mengurangi payload JSON yang tidak perlu, memindahkan schema setup dari request endpoint ke migration CLI, dan menambahkan index database untuk pola query yang sering dipakai.

## Ringkasan perubahan

| Area | Sebelum | Sesudah |
| --- | --- | --- |
| `materi-api.php` | 100 materi membutuhkan 301 query karena chapters, objectives, dan slides diambil per item | 100 materi membutuhkan 4 query dengan response yang sama |
| `transactions-api.php` | Pemeriksaan schema membaca metadata kolom 32 kali pada request umum | Metadata schema turun menjadi 3 kali pada request umum |
| Schema setup endpoint | Endpoint legacy menjalankan `CREATE TABLE`, `ALTER TABLE`, atau ensure schema saat request | Schema setup dipindahkan ke `composer db:migrate`; endpoint memakai database yang sudah dimigrasi |
| `user-notifications-api.php` | Status email 100 notifikasi dicek dengan 100 query | Status email 100 notifikasi dicek dengan 1 query batch |
| Response JSON | Beberapa endpoint memakai pretty JSON pada response produksi | Response dibuat compact untuk mengurangi byte transfer |
| List endpoint | Beberapa endpoint memakai `fetchAll()` lalu mapping besar di memory | Mapping diproses per row untuk menekan memory puncak |
| Database | Belum ada kumpulan index khusus pola API | 21 index tambahan tersedia dan sudah dipasang di database lokal |

## File yang diperiksa

| File | Hasil |
| --- | --- |
| `article-api.php` | Mapping list dibuat streaming row-by-row. |
| `certificate-api.php` | List diproses row-by-row, fallback pencarian workshop title di-cache per request agar tidak scan payload workshop berkali-kali. Schema sertifikat dipindahkan ke migration database sertifikat. |
| `certificate-pdf-generator.php` | Dipertahankan. Biaya utama bounded pada render teks/PDF, bukan query atau payload list. |
| `formhandle.php` | Schema fallback submit form dilepas dari request. Query filter email terbantu index baru; pagination tidak ditambahkan agar tidak mengubah tampilan frontend. |
| `galery-api.php` | Dipertahankan. Sudah memakai select eksplisit dan alur cukup ringan untuk list gambar yang ada. |
| `ide-config-api.php` | Inisialisasi table dipindahkan ke migration. |
| `materi-api.php` | N+1 query dihapus dan ensure schema dikelompokkan. |
| `partners-api.php` | Schema fallback dilepas dari request. Behavior sinkronisasi leads/collaborations dipertahankan; query list terbantu index baru. |
| `projects-api.php` | Dipertahankan untuk kontrak response list; query list terbantu index baru. Catatan: download ZIP masih area yang bisa dioptimasi lebih lanjut jika file proyek makin besar. |
| `router.php` | Tidak perlu perubahan, hanya wrapper routing. |
| `testimonials-api.php` | Dipertahankan; query status/list terbantu index baru. |
| `transactions-api.php` | Ensure schema dikelompokkan, sync infra tidak dipanggil untuk GET, list diproses row-by-row. |
| `user-notifications-api.php` | Query feed dibuat lebih selektif dan status email dikumpulkan dalam batch. |
| `workshop-api.php` | Storage upload hanya disiapkan untuk POST/PUT, ensure schema dikelompokkan, list diproses row-by-row. |
| `admin/login.php` | Response JSON dibuat compact; alur auth tidak diubah. |
| `admin/session.php` | Response JSON dibuat compact; alur session tidak diubah. |
| `auth/login.php` | Dipertahankan; index login ditambahkan di database. |
| `auth/session.php` | Dipertahankan; index token expiry ditambahkan di database. |
| `auth/profile.php` | Dipertahankan; index lookup user ditambahkan di database. |
| `support/bootstrap.php` | Dipertahankan; koneksi PDO sudah di-cache per request. |
| `support/image-storage.php` | Helper schema dikelompokkan untuk caller upload/image. |
| `support/mqtt-events.php` | Dipertahankan; publish tetap hanya pada mutation. |
| `support/sync-outbox.php` | Enqueue/touch tidak lagi membuat tabel atau kolom saat request. Infrastruktur sync disiapkan oleh migration. |

## Helper baru

| File | Fungsi |
| --- | --- |
| `app/Database/ApiQueryIndexes.php` | Definisi dan installer index API. Installer idempotent dan melewati table/kolom lama yang tidak ada. |
| `scripts/optimize-api-indexes.php` | Script maintenance CLI untuk backup SQLite, memasang index API, lalu menjalankan `PRAGMA optimize`. |
| `scripts/migrate.php` | Runner migration utama: menjalankan migration SQLite modern, schema legacy API, index API, dan schema database sertifikat. |
| `app/Database/LegacyApiMigrator.php` | Migration idempotent untuk tabel/kolom legacy yang sebelumnya disiapkan langsung oleh endpoint API. |
| `tests/api-performance.php` | Regression test in-memory untuk query count, schema reads, batch email lookup, sync outbox, dan index plan. |
| `tests/api-smoke.php` | Smoke test entrypoint di salinan database lokal, membandingkan response penting dengan snapshot baseline. |

## Index database

Script `composer db:migrate` sudah dijalankan pada database lokal utama dan database sertifikat terpisah. Script `composer db:optimize-api` juga sudah pernah dijalankan pada database lokal utama. Sebelum pemasangan index, script membuat backup SQLite:

`website/BE/storage/backups/before-api-indexes-20260905-152916-a61712e1.sqlite`

Index yang dipasang meliputi lookup login user/admin, token session, transaksi per email/user, workshop title/id legacy, project submissions, partners, testimonials, tutorials, dan slides.

## Hasil testing

Perintah yang sudah lolos:

```bash
php website/BE/tests/api-performance.php C:/Users/alpa_/AppData/Local/Temp/arduflow-api-audit-c49188bedb554d66a0c8b56478f0f53b/api
php website/BE/tests/api-smoke.php C:/Users/alpa_/AppData/Local/Temp/arduflow-api-audit-c49188bedb554d66a0c8b56478f0f53b/api
php website/BE/tests/auth-integration.php
php website/BE/tests/content-integration.php
php website/BE/tests/sync-integration.php
```

Hasil penting:

| Test | Hasil |
| --- | --- |
| API performance | 126 assertions berhasil |
| Materi 100 item | 301 query menjadi 4 query, response identik |
| Schema setup endpoint | Dipindahkan ke CLI migration |
| Notifikasi email 100 item | 100 query menjadi 1 query |
| Smoke endpoint | 19 endpoint lolos dan response JSON setara baseline |
| Auth integration | 24 assertions berhasil |
| Content integration | 22 assertions berhasil |
| Sync integration | 23 assertions berhasil |

Catatan: test integrasi receiver MySQL tetap skip karena server MySQL test tidak tersedia di mesin ini. SMTP/MQTT juga tidak dikirim sungguhan oleh test agar tidak mengirim email/event produksi.

## Cara menjalankan ulang

```bash
cd website/BE
composer test
composer test:api-smoke
composer db:migrate
composer db:optimize-api
```

`composer db:migrate` perlu dijalankan sekali pada database deployment/hosting setelah file terbaru dinaikkan. `composer db:optimize-api` tetap tersedia untuk maintenance index/PRAGMA optimize.
