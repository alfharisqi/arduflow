# ArduFlow Backend FTP

Upload isi folder ini ke:

```text
https://arduflow.indobilliard.com/apk/uploads/web-arduflow-deploy-alfha
```

Frontend dapat diarahkan ke:

```env
VITE_API_URL=https://arduflow.indobilliard.com/apk/uploads/web-arduflow-deploy-alfha
```

Setelah upload, salin `.env.production.example` menjadi `.env` di server dan isi credential production. Pastikan folder berikut writable oleh PHP:

```text
storage/database
storage/logs
storage/backups/sqlite
storage/uploads
uploads
```

Endpoint health yang bisa dicek:

```text
https://arduflow.indobilliard.com/apk/uploads/web-arduflow-deploy-alfha/api/health
```
