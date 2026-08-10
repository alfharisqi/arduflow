<?php

declare(strict_types=1);

use Arduflow\Api\Support\Env;

return [
    'enabled' => Env::bool('MAIL_ENABLED', true),
    'host' => Env::get('MAIL_HOST', '127.0.0.1'),
    'port' => Env::int('MAIL_PORT', 1025),
    'secure' => Env::bool('MAIL_SECURE', false),
    'username' => Env::get('MAIL_USERNAME', ''),
    'password' => Env::get('MAIL_PASSWORD', ''),
    'from' => Env::get('MAIL_FROM', 'Arduflow <no-reply@arduflow.local>'),
    'mailpit_url' => Env::get('MAILPIT_URL', 'http://localhost:8025/'),
];
