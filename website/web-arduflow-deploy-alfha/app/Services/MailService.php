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
        $url = rtrim((string) $this->config->get('app.frontend_url'), '/') .
            '/verify-email?token=' . rawurlencode($token);
        $name = htmlspecialchars((string) $user['name'], ENT_QUOTES, 'UTF-8');
        $body = $this->buttonTemplate(
            "Halo {$name},",
            'Klik tombol berikut untuk memverifikasi akun ArduFlow.',
            'Verifikasi Email',
            $url,
            'Jika Anda tidak membuat akun ini, abaikan email ini.',
        );

        return $this->send((string) $user['email'], (string) $user['name'], 'Verifikasi Email ArduFlow', $body);
    }

    public function sendPasswordReset(array $user, string $token): bool
    {
        $url = rtrim((string) $this->config->get('app.frontend_url'), '/') .
            '/reset-password/form?token=' . rawurlencode($token);
        $name = htmlspecialchars((string) $user['name'], ENT_QUOTES, 'UTF-8');
        $body = $this->buttonTemplate(
            "Halo {$name},",
            'Kami menerima permintaan untuk mengatur ulang password akun ArduFlow Anda.',
            'Reset Password',
            $url,
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
            $usernameDomain = strtolower((string) substr(strrchr($username, '@') ?: '', 1));
            $fromDomain = strtolower((string) substr(strrchr($fromAddress, '@') ?: '', 1));
            if ($usernameDomain !== '' && $fromDomain !== '' && $usernameDomain !== $fromDomain) {
                $replyToAddress = $fromAddress;
                $fromAddress = $username;
            }
        }

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

    private function parseFrom(string $from): array
    {
        if (preg_match('/^\s*(.*?)\s*<([^>]+)>\s*$/', $from, $match) === 1) {
            return [trim($match[1]), trim($match[2])];
        }
        return ['Arduflow', trim($from)];
    }

    private function buttonTemplate(string $greeting, string $message, string $label, string $url, string $footer): string
    {
        $safeUrl = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
        return '<div style="font-family:Arial,sans-serif;background:#030B1E;color:#fff;padding:32px">' .
            '<h2 style="margin-top:0;color:#00A2FF">ArduFlow</h2>' .
            '<p>' . $greeting . '</p><p>' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</p>' .
            '<p style="margin:28px 0"><a href="' . $safeUrl . '" style="background:#FF6A00;color:#fff;' .
            'padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">' .
            htmlspecialchars($label, ENT_QUOTES, 'UTF-8') . '</a></p>' .
            '<p style="color:#b8c2d8;font-size:13px">' . htmlspecialchars($footer, ENT_QUOTES, 'UTF-8') . '</p></div>';
    }
}
