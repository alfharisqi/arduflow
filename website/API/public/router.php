<?php

declare(strict_types=1);

$path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';
$file = __DIR__ . $path;

if ($path !== '/' && is_file($file)) {
    return false;
}

$legacyRoutes = [
    '/api/formhandle.php' => __DIR__ . '/../api/formhandle.php',
    '/api/leads' => __DIR__ . '/../api/formhandle.php',
    '/api/article-api.php' => __DIR__ . '/../api/article-api.php',
    '/api/articles' => __DIR__ . '/../api/article-api.php',
    '/api/projects-api.php' => __DIR__ . '/../api/projects-api.php',
    '/api/projects' => __DIR__ . '/../api/projects-api.php',
    '/api/workshop-api.php' => __DIR__ . '/../api/workshop-api.php',
    '/api/auth/login.php' => __DIR__ . '/../api/auth/login.php',
    '/api/auth/session.php' => __DIR__ . '/../api/auth/session.php',
    '/api/auth/profile.php' => __DIR__ . '/../api/auth/profile.php',
    '/api/admin/login.php' => __DIR__ . '/../api/admin/login.php',
    '/api/admin/session.php' => __DIR__ . '/../api/admin/session.php',
];

if (isset($legacyRoutes[$path])) {
    require $legacyRoutes[$path];
    return true;
}

require __DIR__ . '/index.php';
