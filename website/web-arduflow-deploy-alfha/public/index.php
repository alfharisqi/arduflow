<?php

declare(strict_types=1);

use Arduflow\Api\Http\ErrorHandler;
use Arduflow\Api\Http\Request;

$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
$isDevelopmentOrigin = preg_match(
    '#^http://(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}):[0-9]+$#',
    $origin
) === 1;
$allowedOrigins = [
    'https://arduflow.indobilliard.com',
    'https://www.arduflow.indobilliard.com',
    'https://web.arduflow.com',
];

if ($origin !== '' && ($isDevelopmentOrigin || in_array($origin, $allowedOrigins, true))) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Auth-Token, X-Sync-Timestamp, X-Sync-Nonce, X-Sync-Signature');
    header('Access-Control-Max-Age: 86400');
    header('Vary: Origin');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$root = dirname(__DIR__);
$autoload = $root . '/vendor/autoload.php';

if (!is_file($autoload)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['message' => 'Dependency PHP belum diinstal. Jalankan composer install.']);
    exit;
}

require $autoload;

$errorHandler = new ErrorHandler($root . '/storage/logs/app.log');
$errorHandler->register();

try {
    $app = require $root . '/bootstrap/app.php';
    $app->handle(Request::fromGlobals())->send();
} catch (Throwable $exception) {
    $errorHandler->render($exception)->send();
}
