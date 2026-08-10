<?php

declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = '/' . trim($path, '/');

$routes = [
    '/api/auth/login' => __DIR__ . '/auth/login.php',
    '/api/auth/session' => __DIR__ . '/auth/session.php',
    '/api/auth/profile' => __DIR__ . '/auth/profile.php',
    '/api/admin/login' => __DIR__ . '/admin/login.php',
    '/api/admin/session' => __DIR__ . '/admin/session.php',
    '/api/leads' => __DIR__ . '/formhandle.php',
    '/api/articles' => __DIR__ . '/article-api.php',
    '/api/projects' => __DIR__ . '/projects-api.php',
    '/api/workshops' => __DIR__ . '/workshop-api.php',
];

$publicFile = __DIR__ . $path;

if ($path !== '/' && is_file($publicFile)) {
    return false;
}

if (isset($routes[$path])) {
    require $routes[$path];
    return true;
}

header('Content-Type: application/json; charset=utf-8');
http_response_code(404);

echo json_encode(
    [
        'success' => false,
        'message' => 'Endpoint API tidak ditemukan.',
    ],
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);

return true;
