<?php

declare(strict_types=1);

namespace Arduflow\Api\Security;

use Vinsaj9\Crypto\Scrypt\Scrypt;

final class PasswordHasher
{
    public function __construct(private readonly bool $legacyScryptEnabled)
    {
    }

    public function hash(string $password): string
    {
        $algorithm = $this->algorithm();
        $hash = password_hash($password, $algorithm);
        if ($hash === false) {
            throw new \RuntimeException('Password tidak dapat di-hash.');
        }
        return $hash;
    }

    public function verify(string $password, string $storedHash): PasswordCheck
    {
        if (str_starts_with($storedHash, 'scrypt$')) {
            if (!$this->legacyScryptEnabled) {
                return new PasswordCheck(false, false, true);
            }

            $parts = explode('$', $storedHash, 3);
            if (count($parts) !== 3 || $parts[1] === '' || !ctype_xdigit($parts[2])) {
                return new PasswordCheck(false);
            }

            $derived = bin2hex(Scrypt::calc($password, $parts[1], 16384, 8, 1, 64));
            return new PasswordCheck(hash_equals(strtolower($parts[2]), $derived), true);
        }

        $valid = password_verify($password, $storedHash);
        return new PasswordCheck($valid, $valid && password_needs_rehash($storedHash, $this->algorithm()));
    }

    private function algorithm(): string|int|null
    {
        return defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
    }
}
