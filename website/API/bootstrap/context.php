<?php

declare(strict_types=1);

use Arduflow\Api\Database\ConnectionFactory;
use Arduflow\Api\Support\Config;
use Arduflow\Api\Support\Env;

$root = dirname(__DIR__);
$autoload = $root . '/vendor/autoload.php';

if (!class_exists(Env::class)) {
    if (!is_file($autoload)) {
        throw new RuntimeException('Jalankan composer install pada website/API terlebih dahulu.');
    }
    require $autoload;
}

Env::load($root . '/.env');
$config = Config::fromDirectory($root . '/config');
date_default_timezone_set((string) $config->get('app.timezone', 'Asia/Jakarta'));

return [
    'root' => $root,
    'config' => $config,
    'connections' => new ConnectionFactory($config, $root),
];
