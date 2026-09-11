# Hotfix interaksi proyek — 9 September 2026

Hosting mengembalikan HTTP 422 "Validasi data proyek gagal." untuk POST
?action=interaction karena request masuk ke validasi pembuatan proyek.
Kode lokal sudah mempunyai handler interaksi sebelum validasi tersebut.
Paket ini berisi salinan handler lokal yang sudah diuji.

## Pemasangan
1. Cadangkan file projects-api.php yang sekarang di hosting.
2. Unggah api/projects-api.php dari paket ini untuk mengganti:
   /apk/uploads/web-arduflow-deploy-alfha/api/projects-api.php
3. Jika hosting masih memakai kode lama, reset PHP OPcache/restart PHP melalui panel hosting.
4. Buka detail proyek, klik like/save, lalu periksa Network:
   POST action=interaction harus mengembalikan HTTP 200 dan success=true.
   Klik kembali untuk memastikan penghitung berkurang.
5. Untuk menguji viewer yang sebelumnya gagal, hapus hanya entri localStorage
   viewed proyek terkait sebelum memuat ulang; frontend menandainya sebelum request selesai.

Tidak perlu mengganti database, .env, atau membangun ulang frontend.
Rollback: kembalikan file API cadangan.

## Verifikasi lokal
- PHP 8.2 syntax: PASS.
- HTTP POST pada database SQLite fixture terpisah: viewer, likes, saves,
  shares bertambah: PASS.
- likes/saves berkurang dan tidak menjadi negatif: PASS.
- Probe hosting dengan metric tidak valid mengembalikan validasi title,
  category, description (422), bukan penolakan metric dari handler lokal.
- Belum diunggah ke hosting; verifikasi produksi tetap diperlukan.

Peringatan Lit dev mode adalah pesan terpisah dari error API 422.
