Hotfix CORS signup dari FE lokal

Upload dua file berikut ke hosting, sesuai path yang sama:

- app/Middleware/CorsMiddleware.php
- public/index.php

Tidak perlu build atau upload FE/dist karena FE kamu berjalan lokal.

Masalah yang diperbaiki:

- Signup dari http://127.0.0.1:5173 diblokir browser karena response backend tidak mengirim Access-Control-Allow-Origin.
- Endpoint /api/auth/register berjalan lewat router public/index.php dan CorsMiddleware global.
- public/index.php sekarang mengirim header CORS paling awal, sebelum autoload, middleware, controller, atau error handler berjalan.
- CorsMiddleware sekarang mengizinkan origin development lokal: localhost, 127.0.0.1, 192.168.x.x, 10.x.x.x, dan 172.16-31.x.x pada port apa pun.
- Access-Control-Allow-Headers sekarang menyertakan Content-Type, Accept, Authorization, X-Auth-Token, dan header sync.

Urutan cek:

1. Upload app/Middleware/CorsMiddleware.php dari folder hotfix ini ke path yang sama di hosting.
2. Upload public/index.php dari folder hotfix ini ke path yang sama di hosting.
3. Hard refresh FE lokal.
4. Buka http://127.0.0.1:5173/signup.
5. Coba signup lagi.
6. Jika masih gagal, cek Network tab: request /api/auth/register harus punya response header Access-Control-Allow-Origin: http://127.0.0.1:5173.
