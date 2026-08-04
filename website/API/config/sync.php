<?php

declare(strict_types=1);

use Arduflow\Api\Support\Env;

return [
    'enabled' => Env::bool('SYNC_ENABLED', true),
    'api_url' => Env::get(
        'SYNC_API_URL',
        rtrim((string) Env::get('APP_URL', 'http://127.0.0.1:8000'), '/') . '/api/internal/sync/sqlite-to-mysql',
    ),
    'api_token' => Env::get('SYNC_API_TOKEN', ''),
    'hmac_secret' => Env::get('SYNC_HMAC_SECRET', ''),
    'max_clock_skew_seconds' => Env::int('SYNC_MAX_CLOCK_SKEW_SECONDS', 300),
    'batch_size' => max(1, min(500, Env::int('SYNC_BATCH_SIZE', 250))),
    'http_timeout_seconds' => max(1, min(120, Env::int('SYNC_HTTP_TIMEOUT_SECONDS', 30))),
    'processing_timeout_minutes' => max(1, Env::int('SYNC_PROCESSING_TIMEOUT_MINUTES', 15)),
    'ip_allowlist' => Env::csv('SYNC_IP_ALLOWLIST'),
];
