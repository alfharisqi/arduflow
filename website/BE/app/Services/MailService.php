<?php

declare(strict_types=1);

namespace Arduflow\Api\Services;

use Arduflow\Api\Support\Config;
use PHPMailer\PHPMailer\PHPMailer;

final class MailService
{
    public function __construct(private readonly Config $config)
    {
    }

    public function sendVerification(array $user, string $token): bool
    {
        $url = $this->backendUrl('/api/auth/verify-email') .
            '?token=' . rawurlencode($token) . '&redirect=1';
        $name = htmlspecialchars((string) $user['name'], ENT_QUOTES, 'UTF-8');
        $body = $this->buttonTemplate(
            'Verifikasi akun ArduFlow',
            "Halo {$name},",
            'Terima kasih sudah mendaftar di ArduFlow. Klik tombol di bawah untuk mengaktifkan akun Anda.',
            'Verifikasi Email',
            $url,
            'Jika tombol tidak bisa dibuka, salin tautan verifikasi berikut ke browser Anda.',
            'Jika Anda tidak membuat akun ini, abaikan email ini.',
        );

        return $this->send((string) $user['email'], (string) $user['name'], 'Verifikasi Email ArduFlow', $body);
    }

    public function sendPasswordReset(array $user, string $token): bool
    {
        $url = $this->backendUrl('/api/auth/password-reset/open') . '?token=' . rawurlencode($token);
        $name = htmlspecialchars((string) $user['name'], ENT_QUOTES, 'UTF-8');
        $body = $this->buttonTemplate(
            'Reset password ArduFlow',
            "Halo {$name},",
            'Kami menerima permintaan untuk mengatur ulang password akun ArduFlow Anda.',
            'Reset Password',
            $url,
            'Jika tombol tidak bisa dibuka, salin tautan reset password berikut ke browser Anda.',
            'Tautan ini berlaku selama 60 menit. Abaikan email ini jika Anda tidak meminta reset password.',
        );

        return $this->send((string) $user['email'], (string) $user['name'], 'Reset Password ArduFlow', $body);
    }

    public function sendPayoutCode(array $user, string $code, string $description): bool
    {
        $body = '<h2>Verifikasi pencairan ArduFlow</h2><p>' . htmlspecialchars($description, ENT_QUOTES, 'UTF-8') .
            '</p><p>Kode verifikasi: <strong>' . htmlspecialchars($code, ENT_QUOTES, 'UTF-8') .
            '</strong></p><p>Berlaku 10 menit. Jangan bagikan kode kepada siapa pun, termasuk admin. Jika bukan Anda, jangan konfirmasi dan amankan akun Anda.</p>';
        return $this->send((string) $user['email'], (string) $user['name'], 'Kode keamanan pencairan ArduFlow', $body);
    }

    public function sendUserNotification(string $address, string $name, string $subject, string $title, string $message, string $path = '/dashboard'): bool
    {
        $url = $this->frontendUrl($path);
        $safeName = htmlspecialchars($name !== '' ? $name : 'User ArduFlow', ENT_QUOTES, 'UTF-8');
        $body = $this->buttonTemplate(
            $title,
            "Halo {$safeName},",
            $message,
            'Buka Dashboard',
            $url,
            'Jika tombol tidak bisa dibuka, salin tautan berikut ke browser Anda.',
            'Email ini dikirim karena notifikasi email akun Anda aktif.',
        );

        return $this->send($address, $name !== '' ? $name : $address, $subject, $body);
    }

    private function send(string $address, string $name, string $subject, string $html): bool
    {
        if (!(bool) $this->config->get('mail.enabled', true)) {
            $this->logMail('disabled', $address, $subject, ['reason' => 'MAIL_ENABLED is false']);
            return false;
        }

        $mail = new PHPMailer(true);
        $username = (string) $this->config->get('mail.username', '');
        $secure = strtolower(trim((string) $this->config->get('mail.secure', '')));
        [$fromName, $fromAddress] = $this->parseFrom((string) $this->config->get('mail.from'));
        if ($fromAddress === '') {
            $fromAddress = $username !== '' ? $username : 'no-reply@arduflow.com';
        }
        $replyToAddress = '';
        if (filter_var($username, FILTER_VALIDATE_EMAIL) && filter_var($fromAddress, FILTER_VALIDATE_EMAIL)) {
            $usernameDomain = $this->emailDomain($username);
            $fromDomain = $this->emailDomain($fromAddress);
            if ($usernameDomain !== '' && $fromDomain !== '' && $usernameDomain !== $fromDomain) {
                $fromAddress = $username;
            }
        }
        $fromDomain = $this->emailDomain($fromAddress);

        try {
            $mail->isSMTP();
            $mail->Host = (string) $this->config->get('mail.host');
            $mail->Port = (int) $this->config->get('mail.port');
            if ($username !== '') {
                $mail->SMTPAuth = true;
                $mail->Username = $username;
                $mail->Password = (string) $this->config->get('mail.password', '');
            }
            if (in_array($secure, ['tls', 'starttls', 'true', '1', 'yes', 'on'], true)) {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            } elseif (in_array($secure, ['ssl', 'smtps'], true)) {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            }
            $mail->Timeout = 20;
            $mail->CharSet = 'UTF-8';
            if ($fromDomain !== '') {
                $mail->Hostname = $fromDomain;
                $mail->Sender = $fromAddress;
                $mail->MessageID = '<' . bin2hex(random_bytes(16)) . '@' . $fromDomain . '>';
            }
            $mail->setFrom($fromAddress, $fromName !== '' ? $fromName : 'Arduflow');
            if ($replyToAddress !== '' && strcasecmp($replyToAddress, $fromAddress) !== 0) {
                $mail->addReplyTo($replyToAddress, $fromName !== '' ? $fromName : 'Arduflow');
            }
            $mail->addAddress($address, $name);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $html;
            $mail->AltBody = strip_tags(str_replace(['</p>', '</a>'], [PHP_EOL, PHP_EOL], $html));
            $mail->send();

            $this->logMail('sent', $address, $subject, [
                'messageId' => $mail->getLastMessageID(),
                'from' => $fromAddress,
                'replyTo' => $replyToAddress,
            ]);
            return true;
        } catch (\Throwable $exception) {
            $this->logMail('failed', $address, $subject, [
                'from' => $fromAddress,
                'replyTo' => $replyToAddress,
                'error' => $exception->getMessage(),
                'errorInfo' => $mail->ErrorInfo,
            ]);
            return false;
        }
    }

    private function logMail(string $status, string $address, string $subject, array $context = []): void
    {
        $logPath = dirname(__DIR__, 2) . '/storage/logs/app.log';
        $directory = dirname($logPath);
        if (!is_dir($directory)) {
            @mkdir($directory, 0775, true);
        }

        $safeContext = [
            'status' => $status,
            'to' => $address,
            'subject' => $subject,
            'host' => (string) $this->config->get('mail.host'),
            'port' => (int) $this->config->get('mail.port'),
            'secure' => (string) $this->config->get('mail.secure', ''),
            'username' => (string) $this->config->get('mail.username', ''),
            ...$context,
        ];

        @error_log(sprintf(
            '[%s] MailService %s %s%s',
            gmdate('c'),
            $status,
            json_encode($safeContext, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            PHP_EOL
        ), 3, $logPath);
    }

    private function emailDomain(string $email): string
    {
        return strtolower((string) substr(strrchr($email, '@') ?: '', 1));
    }

    private function parseFrom(string $from): array
    {
        if (preg_match('/^\s*(.*?)\s*<([^>]+)>\s*$/', $from, $match) === 1) {
            return [trim($match[1]), trim($match[2])];
        }
        return ['Arduflow', trim($from)];
    }

    private function frontendUrl(string $path): string
    {
        $configured = trim((string) $this->config->get('app.frontend_url', 'http://127.0.0.1:5173'));
        $baseUrl = rtrim($configured !== '' ? $configured : 'http://127.0.0.1:5173', '/');
        $host = strtolower((string) (parse_url($baseUrl, PHP_URL_HOST) ?: ''));
        $basePath = trim((string) (parse_url($baseUrl, PHP_URL_PATH) ?: ''), '/');
        if ($host === 'arduflow.indobilliard.com' && $basePath === '') {
            $baseUrl = 'http://127.0.0.1:5173';
        }
        return $baseUrl . '/' . ltrim($path, '/');
    }

    private function backendUrl(string $path): string
    {
        $configured = trim((string) $this->config->get('app.url', ''));
        $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
        if ($host !== '') {
            $https = (string) ($_SERVER['HTTPS'] ?? '');
            $scheme = $https !== '' && strtolower($https) !== 'off' ? 'https' : 'http';
            $scriptDirectory = str_replace('\\', '/', dirname((string) ($_SERVER['SCRIPT_NAME'] ?? '')));
            $basePath = preg_replace('#/(public|api)$#', '', $scriptDirectory) ?: '';
            $basePath = $basePath === '/' ? '' : rtrim($basePath, '/');

            $configuredPath = (string) (parse_url($configured, PHP_URL_PATH) ?: '');
            $isDefaultLocalUrl = $configured === '' || str_contains($configured, '127.0.0.1:8000');
            if ($isDefaultLocalUrl || ($basePath !== '' && trim($configuredPath, '/') === '')) {
                return $scheme . '://' . $host . $basePath . '/' . ltrim($path, '/');
            }
        }

        $fallback = $configured !== '' ? $configured : 'http://127.0.0.1:8000';
        return rtrim($fallback, '/') . '/' . ltrim($path, '/');
    }

    private function buttonTemplate(
        string $title,
        string $greeting,
        string $message,
        string $label,
        string $url,
        string $linkHelp,
        string $footer,
    ): string {
        $safeTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
        $safeGreeting = htmlspecialchars($greeting, ENT_QUOTES, 'UTF-8');
        $safeMessage = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
        $safeLabel = htmlspecialchars($label, ENT_QUOTES, 'UTF-8');
        $safeUrl = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
        $safeLinkHelp = htmlspecialchars($linkHelp, ENT_QUOTES, 'UTF-8');
        $safeFooter = htmlspecialchars($footer, ENT_QUOTES, 'UTF-8');

        return '<div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#1d2b44">' .
            '<div style="display:none;max-height:0;overflow:hidden;color:transparent">' . $safeTitle . '</div>' .
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:28px 12px">' .
            '<tr><td align="center">' .
            '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e3e9f4;border-radius:18px;overflow:hidden">' .
            '<tr><td style="background:#06142e;padding:26px 32px">' .
            '<div style="font-size:24px;font-weight:800;color:#21a8ff;letter-spacing:.2px">ArduFlow</div>' .
            '<div style="font-size:13px;color:#9fb5d8;margin-top:6px">Platform karya dan pembelajaran IoT</div>' .
            '</td></tr>' .
            '<tr><td style="padding:34px 32px 28px">' .
            '<h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#071735">' . $safeTitle . '</h1>' .
            '<p style="margin:0 0 12px;font-size:16px;line-height:1.7;color:#263a5c">' . $safeGreeting . '</p>' .
            '<p style="margin:0;font-size:16px;line-height:1.7;color:#52627a">' . $safeMessage . '</p>' .
            '<div style="margin:28px 0 22px"><a href="' . $safeUrl . '" style="display:inline-block;background:#ff6a00;color:#ffffff;padding:14px 24px;border-radius:10px;text-decoration:none;font-size:16px;font-weight:700">' . $safeLabel . '</a></div>' .
            '<p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#6c7890">' . $safeLinkHelp . '</p>' .
            '<p style="margin:0;word-break:break-all;background:#f7f9fd;border:1px solid #e5ebf5;border-radius:10px;padding:12px;font-size:12px;line-height:1.6;color:#3f516e">' . $safeUrl . '</p>' .
            '</td></tr>' .
            '<tr><td style="background:#f8fafd;border-top:1px solid #e9eef6;padding:20px 32px">' .
            '<p style="margin:0;font-size:13px;line-height:1.6;color:#6c7890">' . $safeFooter . '</p>' .
            '</td></tr>' .
            '</table>' .
            '<p style="margin:16px 0 0;font-size:12px;color:#8a96aa">© ArduFlow</p>' .
            '</td></tr></table></div>';
    }
}
