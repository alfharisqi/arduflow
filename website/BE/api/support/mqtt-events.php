<?php

declare(strict_types=1);

use Arduflow\Api\Services\MqttService;
use Arduflow\Api\Support\Config;
use Arduflow\Api\Support\Env;

function afwMqttService(string $projectRoot): ?MqttService
{
    static $service = null;
    static $loaded = false;

    if ($loaded) {
        return $service;
    }

    $loaded = true;
    $autoload = $projectRoot . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
    if (!class_exists(Config::class) && is_file($autoload)) {
        require_once $autoload;
    }

    if (!class_exists(Config::class) || !class_exists(Env::class) || !class_exists(MqttService::class)) {
        return null;
    }

    Env::load($projectRoot . DIRECTORY_SEPARATOR . '.env');
    $service = new MqttService(Config::fromDirectory($projectRoot . DIRECTORY_SEPARATOR . 'config'));
    return $service;
}

function afwPublishAdminEvent(string $projectRoot, string $topic, array $payload): bool
{
    try {
        return afwMqttService($projectRoot)?->publish($topic, [
            ...$payload,
            'publishedAt' => gmdate('c'),
        ]) ?? false;
    } catch (Throwable) {
        return false;
    }
}
