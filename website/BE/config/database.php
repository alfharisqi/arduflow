<?php

declare(strict_types=1);

use Arduflow\Api\Support\Env;

return [
    'sqlite' => [
        'path' => dirname(__DIR__)
            . DIRECTORY_SEPARATOR . 'storage'
            . DIRECTORY_SEPARATOR . 'database'
            . DIRECTORY_SEPARATOR . 'arduflow.sqlite',

        'busy_timeout_ms' => 15000,
    ],

    'mysql' => [
        'host' => Env::get('DB_HOST', '127.0.0.1'),
        'port' => Env::int('DB_PORT', 3306),
        'database' => Env::get('DB_DATABASE', 'db_arduflow'),
        'username' => Env::get('DB_USERNAME', 'root'),
        'password' => Env::get('DB_PASSWORD', ''),
        'connect_timeout_seconds' => Env::int(
            'DB_CONNECT_TIMEOUT_SECONDS',
            3
        ),
    ],
];