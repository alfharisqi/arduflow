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

    private function send(string $address, string $name, string $subject, string $html): bool
    {
        if (!(bool) $this->config->get('mail.enabled', true)) {
            return false;
        }

        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = (string) $this->config->get('mail.host');
        $mail->Port = (int) $this->config->get('mail.port');
        $username = (string) $this->config->get('mail.username', '');
        if ($username !== '') {
            $mail->SMTPAuth = true;
            $mail->Username = $username;
            $mail->Password = (string) $this->config->get('mail.password', '');
        }
        if ((bool) $this->config->get('mail.secure', false)) {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        }
        $mail->Timeout = 10;
        $mail->CharSet = 'UTF-8';

        [$fromName, $fromAddress] = $this->parseFrom((string) $this->config->get('mail.from'));
        $mail->setFrom($fromAddress, $fromName);
        $mail->addAddress($address, $name);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body = $html;
        $mail->AltBody = strip_tags(str_replace(['</p>', '</a>'], [PHP_EOL, PHP_EOL], $html));
        $mail->send();

        return true;
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
