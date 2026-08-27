<?php

declare(strict_types=1);

use Arduflow\Api\Support\Env;

return [
    'enabled' => Env::bool('MQTT_ENABLED', false),
    'host' => Env::get('MQTT_HOST', '127.0.0.1'),
    'port' => Env::int('MQTT_PORT', 1883),
    'username' => Env::get('MQTT_USERNAME', ''),
    'password' => Env::get('MQTT_PASSWORD', ''),
    'client_id' => Env::get('MQTT_CLIENT_ID', 'arduflow-php-api'),
    'topic_prefix' => Env::get('MQTT_TOPIC_PREFIX', 'arduflow'),
    'timeout_seconds' => Env::int('MQTT_TIMEOUT_SECONDS', 2),
    'websocket_url' => Env::get('MQTT_WS_URL', 'ws://127.0.0.1:9001/mqtt'),
    'browser_username' => Env::get('MQTT_BROWSER_USERNAME', ''),
    'browser_password' => Env::get('MQTT_BROWSER_PASSWORD', ''),
];
