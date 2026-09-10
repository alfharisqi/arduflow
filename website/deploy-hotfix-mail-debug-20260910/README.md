Hotfix debug dan deliverability SMTP

Upload file berikut ke hosting, sesuai path yang sama:

- app/Services/MailService.php
- app/Controllers/UserAuthController.php
- api/mail-test.php
- index.php

Tidak perlu build atau upload FE/dist karena FE berjalan lokal.

Temuan terbaru:

- Endpoint mail-test sudah success=true. Ini berarti koneksi SMTP berhasil dan server SMTP menerima email.
- Response config masih menunjukkan from: Arduflow <no-reply@arduflow.indobilliard.com>.
- DNS untuk arduflow.indobilliard.com tidak punya SPF/DKIM/DMARC.
- Domain arduino/arduflow.com dan canvexis.com punya SPF, DMARC, dan default DKIM.

Perubahan terbaru:

- MailService sekarang otomatis memakai MAIL_USERNAME sebagai From jika MAIL_FROM memakai domain berbeda dari username SMTP.
- Alamat MAIL_FROM lama tetap dipasang sebagai Reply-To jika berbeda.
- Ini mencegah email dikirim dari domain yang tidak punya SPF/DKIM seperti no-reply@arduflow.indobilliard.com.
- MailService tetap mencatat hasil sent/failed ke storage/logs/app.log tanpa password.

Config paling aman untuk mail.arduflow.com:

MAIL_ENABLED=true
MAIL_HOST=mail.arduflow.com
MAIL_PORT=587
MAIL_SECURE=tls
MAIL_USERNAME=mailler@arduflow.com
MAIL_PASSWORD=password_smtp_asli
MAIL_FROM="Arduflow <mailler@arduflow.com>"

Config paling aman untuk cPanel canvexis port 465:

MAIL_ENABLED=true
MAIL_HOST=mail.canvexis.com
MAIL_PORT=465
MAIL_SECURE=ssl
MAIL_USERNAME=_mainaccount@canvexis.com
MAIL_PASSWORD=password_cPanel_kamu
MAIL_FROM="Arduflow <_mainaccount@canvexis.com>"

Cara test setelah upload:

1. Pastikan MAIL_TEST_TOKEN ada di .env hosting.
2. Buka /api/mail-test.php?token=TOKEN_RAHASIA&to=emailtujuan@example.com.
3. Cek storage/logs/app.log.
4. Jika log MailService sent berisi from=mailler@arduflow.com atau from=_mainaccount@canvexis.com, pengirim sudah benar.
5. Jika tetap tidak masuk inbox, cek spam/quarantine dan cPanel Track Delivery karena SMTP sudah menerima email.
