<?php

declare(strict_types=1);

use Arduflow\Api\Support\Env;

return [
    'env' => Env::get('APP_ENV', 'local'),
    'debug' => Env::bool('APP_DEBUG', false),
    'url' => Env::get('APP_URL', 'http://127.0.0.1:8000'),
    'frontend_url' => Env::get('FRONTEND_URL', 'http://127.0.0.1:5173'),
    'cors_origins' => Env::csv('CORS_ORIGIN', [
        'http://127.0.0.1:5173',
        'http://localhost:5173',
        'http://127.0.0.1:4173',
        'http://localhost:4173',
    ]),
    'timezone' => Env::get('APP_TIMEZONE', 'Asia/Jakarta'),
];
