<?php

declare(strict_types=1);

use Arduflow\Api\Support\Env;

return [
    'enabled' => Env::bool('SYNC_ENABLED', true),
    'api_token' => Env::get('SYNC_API_TOKEN', ''),
    'hmac_secret' => Env::get('SYNC_HMAC_SECRET', ''),
    'max_clock_skew_seconds' => Env::int('SYNC_MAX_CLOCK_SKEW_SECONDS', 300),
    'batch_size' => max(1, min(500, Env::int('SYNC_BATCH_SIZE', 250))),
];
