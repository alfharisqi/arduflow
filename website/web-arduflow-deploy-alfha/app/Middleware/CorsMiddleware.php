<?php

declare(strict_types=1);

namespace Arduflow\Api\Middleware;

use Arduflow\Api\Http\HttpException;
use Arduflow\Api\Http\Request;
use Arduflow\Api\Http\Response;

final class CorsMiddleware
{
    public function __construct(private readonly array $allowedOrigins)
    {
    }

    private function isAllowedOrigin(string $origin): bool
    {
        if (in_array($origin, $this->allowedOrigins, true)) {
            return true;
        }

        return preg_match(
            '#^http://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}):[0-9]+$#',
            $origin
        ) === 1;
    }

    public function handle(Request $request): ?Response
    {
        $origin = $request->header('origin');
        if ($origin === null) {
            return $request->method === 'OPTIONS' ? Response::empty(204) : null;
        }

        if (!$this->isAllowedOrigin($origin)) {
            throw new HttpException(403, 'Origin tidak diizinkan.');
        }

        $headers = [
            'Access-Control-Allow-Origin' => $origin,
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Accept, Authorization, X-Auth-Token, X-Sync-Timestamp, X-Sync-Nonce, X-Sync-Signature',
            'Access-Control-Max-Age' => '600',
            'Vary' => 'Origin',
        ];

        return $request->method === 'OPTIONS' ? Response::empty(204, $headers) : null;
    }

    public function headers(Request $request): array
    {
        $origin = $request->header('origin');
        if ($origin === null || !$this->isAllowedOrigin($origin)) {
            return [];
        }

        return [
            'Access-Control-Allow-Origin' => $origin,
            'Access-Control-Allow-Credentials' => 'true',
            'Vary' => 'Origin',
        ];
    }
}
