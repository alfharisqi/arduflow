# Legacy API Endpoints

Folder ini berisi endpoint prosedural yang belum dipindah ke arsitektur utama `app/`.

Gunakan entrypoint utama dari root project:

```powershell
cd "C:\Users\alpa_\OneDrive\Documents\semester 7\pengembangan website arduflow\arduflow-code\website\BE"
php -S 0.0.0.0:8000 router.php
```

Jangan menjalankan file endpoint satu per satu kecuali untuk debugging.

Routing legacy yang masih aktif melalui `public/router.php`:

- `POST /api/leads` -> `api/formhandle.php`
- `GET|POST /api/articles` -> `api/article-api.php`
- `GET|POST /api/projects` -> `api/projects-api.php`

Endpoint auth, admin, workshop, program, health, dan sync utama sudah dilayani dari `app/`.
