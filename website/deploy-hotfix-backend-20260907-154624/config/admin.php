<?php

declare(strict_types=1);

use Arduflow\Api\Support\Env;

return [
    'seed' => [
        'username' => Env::get('ADMIN_SEED_USERNAME', 'adminarduflow2026'),
        'password' => Env::get('ADMIN_SEED_PASSWORD', ''),
        'name' => Env::get('ADMIN_SEED_NAME', 'Admin Arduflow'),
        'email' => Env::get('ADMIN_SEED_EMAIL', 'admin@arduflow.local'),
        'role' => Env::get('ADMIN_SEED_ROLE', 'super_admin'),
    ],
];
