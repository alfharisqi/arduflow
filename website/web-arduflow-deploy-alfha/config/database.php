<?php

declare(strict_types=1);

use Arduflow\Api\Support\Env;

return [
    'sqlite' => [
        'path' => Env::get('SQLITE_DATABASE_PATH', __DIR__ . '/../storage/database/arduflow.sqlite'),
        'busy_timeout_ms' => Env::int('SQLITE_BUSY_TIMEOUT_MS', 5000),
    ],

    'mysql' => [
        'host' => Env::get('DB_HOST', '127.0.0.1'),
        'port' => Env::int('DB_PORT', 3306),
        'database' => Env::get('DB_DATABASE', 'db_arduflow'),
        'username' => Env::get('DB_USERNAME', 'root'),
        'password' => Env::get('DB_PASSWORD', ''),
        'connect_timeout_seconds' => Env::int('DB_CONNECT_TIMEOUT_SECONDS', 3),
    ],
];
