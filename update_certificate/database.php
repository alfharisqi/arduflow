<?php

declare(strict_types=1);

return [
    'sqlite' => [
        // Satu-satunya database SQLite ArduFlow.
        // File ini berada di website/API/config/database.php,
        // jadi ../database/arduflow.sqlite mengarah ke:
        // website/API/database/arduflow.sqlite
        'path' => __DIR__ . '/../database/arduflow.sqlite',
        'busy_timeout_ms' => 15000,
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