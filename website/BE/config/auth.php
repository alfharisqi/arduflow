<?php

declare(strict_types=1);

use Arduflow\Api\Support\Env;

return [
    'session_hours' => max(1, Env::int('AUTH_SESSION_HOURS', 8)),
    'legacy_scrypt_enabled' => Env::bool('AUTH_LEGACY_SCRYPT_ENABLED', false),
];
