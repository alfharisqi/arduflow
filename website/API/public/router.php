<?php

declare(strict_types=1);

$path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';
$file = __DIR__ . $path;

if ($path !== '/' && is_file($file)) {
    return false;
}

$legacyRoutes = [
    '/api/leads' => __DIR__ . '/../api/formhandle.php',
    '/api/articles' => __DIR__ . '/../api/article-api.php',
    '/api/projects' => __DIR__ . '/../api/projects-api.php',
];

if (isset($legacyRoutes[$path])) {
    require $legacyRoutes[$path];
    return true;
}

require __DIR__ . '/index.php';
