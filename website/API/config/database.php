<?php

declare(strict_types=1);

return [
    'sqlite' => [
        'path' => __DIR__ . '/../storage/database/arduflow.sqlite',
        'busy_timeout_ms' => 5000,
    ],

    'mysql' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'database' => 'db_arduflow',
        'username' => 'root',
        'password' => '',
        'connect_timeout_seconds' => 3,
    ],
];