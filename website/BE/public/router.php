<?php

declare(strict_types=1);

use Arduflow\Api\Http\ErrorHandler;

$root = dirname(__DIR__);
$autoload = $root . '/vendor/autoload.php';

if (!is_file($autoload)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['message' => 'Dependency PHP belum diinstal. Jalankan composer install.']);
    return true;
}

require_once $autoload;

$errorHandler = new ErrorHandler($root . '/storage/logs/app.log');
$errorHandler->register();

$path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';
$file = __DIR__ . $path;

if ($path !== '/' && is_file($file)) {
    return false;
}

if (str_starts_with($path, '/uploads/')) {
    $uploadCandidates = [
        [
            'path' => realpath(__DIR__ . '/../storage' . $path),
            'root' => realpath(__DIR__ . '/../storage/uploads'),
        ],
        [
            'path' => realpath(__DIR__ . '/..' . $path),
            'root' => realpath(__DIR__ . '/../uploads'),
        ],
    ];

    foreach ($uploadCandidates as $candidate) {
        $uploadPath = $candidate['path'];
        $uploadRoot = $candidate['root'];

        if (
            $uploadPath !== false
            && $uploadRoot !== false
            && str_starts_with($uploadPath, $uploadRoot . DIRECTORY_SEPARATOR)
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
}

$legacyRoutes = [
    '/api/formhandle.php' => __DIR__ . '/../api/formhandle.php',
    '/api/leads' => __DIR__ . '/../api/formhandle.php',
    '/api/article-api.php' => __DIR__ . '/../api/article-api.php',
    '/api/articles' => __DIR__ . '/../api/article-api.php',
    '/api/material-api.php' => __DIR__ . '/../api/materi-api.php',
    '/api/materi-api.php' => __DIR__ . '/../api/materi-api.php',
    '/api/materials' => __DIR__ . '/../api/materi-api.php',
    '/api/materi' => __DIR__ . '/../api/materi-api.php',
    '/api/projects-api.php' => __DIR__ . '/../api/projects-api.php',
    '/api/projects' => __DIR__ . '/../api/projects-api.php',
    '/api/partners-api.php' => __DIR__ . '/../api/partners-api.php',
    '/api/partners' => __DIR__ . '/../api/partners-api.php',
    '/api/testimonials-api.php' => __DIR__ . '/../api/testimonials-api.php',
    '/api/testimonials' => __DIR__ . '/../api/testimonials-api.php',
    '/api/transactions-api.php' => __DIR__ . '/../api/transactions-api.php',
    '/api/transactions' => __DIR__ . '/../api/transactions-api.php',
    '/api/user-notifications-api.php' => __DIR__ . '/../api/user-notifications-api.php',
    '/api/user-notifications' => __DIR__ . '/../api/user-notifications-api.php',
    '/api/ide-config-api.php' => __DIR__ . '/../api/ide-config-api.php',
    '/api/ide-config' => __DIR__ . '/../api/ide-config-api.php',
    '/api/certificate-api.php' => __DIR__ . '/../api/certificate-api.php',
    '/api/certificates' => __DIR__ . '/../api/certificate-api.php',
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
