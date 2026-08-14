<?php

declare(strict_types=1);

$path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';
$file = __DIR__ . $path;

if ($path !== '/' && is_file($file)) {
    return false;
}

if (str_starts_with($path, '/uploads/')) {
    $uploadPath = realpath(__DIR__ . '/../storage' . $path);
    $uploadRoot = realpath(__DIR__ . '/../storage/uploads');

    if (
        $uploadPath !== false
        && $uploadRoot !== false
        && str_starts_with($uploadPath, $uploadRoot)
        && is_file($uploadPath)
    ) {
        $mimeType = function_exists('mime_content_type')
            ? mime_content_type($uploadPath)
            : 'application/octet-stream';

        header('Content-Type: ' . ($mimeType ?: 'application/octet-stream'));
        header('Content-Length: ' . filesize($uploadPath));
        readfile($uploadPath);
        return true;
    }
}

$legacyRoutes = [
    '/api/formhandle.php' => __DIR__ . '/../api/formhandle.php',
    '/api/leads' => __DIR__ . '/../api/formhandle.php',
    '/api/article-api.php' => __DIR__ . '/../api/article-api.php',
    '/api/articles' => __DIR__ . '/../api/article-api.php',
    '/api/projects-api.php' => __DIR__ . '/../api/projects-api.php',
    '/api/projects' => __DIR__ . '/../api/projects-api.php',
    '/api/transactions-api.php' => __DIR__ . '/../api/transactions-api.php',
    '/api/transactions' => __DIR__ . '/../api/transactions-api.php',
    '/api/galery-api.php' => __DIR__ . '/../api/galery-api.php',
    '/api/gallery-api.php' => __DIR__ . '/../api/galery-api.php',
    '/api/galery' => __DIR__ . '/../api/galery-api.php',
    '/api/gallery' => __DIR__ . '/../api/galery-api.php',
    '/api/workshop-api.php' => __DIR__ . '/../api/workshop-api.php',
    '/api/workshops' => __DIR__ . '/../api/workshop-api.php',
    '/api/workshops-api.php' => __DIR__ . '/../api/workshop-api.php',
    '/api/workshops-api' => __DIR__ . '/../api/workshop-api.php',
    '/api/auth/login.php' => __DIR__ . '/../api/auth/login.php',
    '/api/auth/session.php' => __DIR__ . '/../api/auth/session.php',
    '/api/auth/profile.php' => __DIR__ . '/../api/auth/profile.php',
    '/api/admin/login.php' => __DIR__ . '/../api/admin/login.php',
    '/api/admin/session.php' => __DIR__ . '/../api/admin/session.php',
    '/api/admin/dashboard.php' => null,
];

if (array_key_exists($path, $legacyRoutes)) {
    if ($legacyRoutes[$path] === null) {
        $_SERVER['REQUEST_URI'] = '/api/admin/dashboard';
        require __DIR__ . '/index.php';
        return true;
    }

    require $legacyRoutes[$path];
    return true;
}

require __DIR__ . '/index.php';
