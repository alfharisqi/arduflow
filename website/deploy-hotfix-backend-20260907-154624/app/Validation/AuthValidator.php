<?php

declare(strict_types=1);

namespace Arduflow\Api\Validation;

final class AuthValidator
{
    public static function email(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function password(string $password): bool
    {
        return preg_match('/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/', $password) === 1;
    }

    public static function normalizeWhatsapp(string $value): string
    {
        $raw = trim($value);
        if ($raw === '') {
            return '';
        }

        $digits = preg_replace('/\D+/', '', $raw) ?? '';
        if (str_starts_with($raw, '+')) {
            return '+' . $digits;
        }
        if (str_starts_with($digits, '0')) {
            return '+62' . ltrim($digits, '0');
        }
        if (str_starts_with($digits, '62')) {
            return '+' . $digits;
        }
        return '+' . $digits;
    }

    public static function whatsapp(string $value): bool
    {
        return preg_match('/^\+\d{8,15}$/', $value) === 1;
    }
}
