<?php

declare(strict_types=1);

namespace Arduflow\Api\Security;

use Arduflow\Api\Http\Request;

final class TokenService
{
    public function random(): string
    {
        return bin2hex(random_bytes(32));
    }

    public function hash(string $token): string
    {
        return hash('sha256', $token);
    }

    public function bearer(Request $request): string
    {
        $header = trim((string) $request->header('authorization', ''));
        if (preg_match('/^Bearer\s+(.+)$/i', $header, $match) !== 1) {
            return '';
        }

        return trim($match[1]);
    }
}
