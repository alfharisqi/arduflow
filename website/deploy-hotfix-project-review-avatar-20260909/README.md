# Foto profil pada review proyek
Ganti file hosting /apk/uploads/web-arduflow-deploy-alfha/api/projects-api.php
dengan api/projects-api.php dari paket ini, setelah mencadangkan file lama.
File ini juga mencakup handler interaksi proyek dari hotfix sebelumnya.

Frontend localhost otomatis memuat perubahan melalui Vite.
Untuk frontend produksi, build dan deploy frontend terbaru juga diperlukan.
Muat ulang halaman detail proyek setelah API diperbarui. Jika masih memakai kode
lama, reset OPcache melalui panel hosting.

API mengisi authorAvatarUrl dari users.profile_image atau users.avatar_path.
Review lama dicocokkan berdasarkan identity user ID atau email.
Akun tanpa foto atau gambar yang gagal dimuat memakai inisial.

Validasi: php -l; php website/BE/tests/project-review-avatars.php (8 assertions).
Paket belum diunggah ke hosting.
