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

    public function handle(Request $request): ?Response
    {
        $origin = $request->header('origin');
        if ($origin === null) {
            return $request->method === 'OPTIONS' ? Response::empty(204) : null;
        }

        if (!in_array($origin, $this->allowedOrigins, true)) {
            throw new HttpException(403, 'Origin tidak diizinkan.');
        }

        $headers = [
            'Access-Control-Allow-Origin' => $origin,
            'Access-Control-Allow-Credentials' => 'true',
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Sync-Timestamp, X-Sync-Nonce, X-Sync-Signature',
            'Access-Control-Max-Age' => '600',
            'Vary' => 'Origin',
        ];

        return $request->method === 'OPTIONS' ? Response::empty(204, $headers) : null;
    }

    public function headers(Request $request): array
    {
        $origin = $request->header('origin');
        if ($origin === null || !in_array($origin, $this->allowedOrigins, true)) {
            return [];
        }

        return [
            'Access-Control-Allow-Origin' => $origin,
            'Access-Control-Allow-Credentials' => 'true',
            'Vary' => 'Origin',
        ];
    }
}
