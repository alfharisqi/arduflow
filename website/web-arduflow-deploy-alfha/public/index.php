<?php

declare(strict_types=1);

use Arduflow\Api\Http\ErrorHandler;
use Arduflow\Api\Http\Request;

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
