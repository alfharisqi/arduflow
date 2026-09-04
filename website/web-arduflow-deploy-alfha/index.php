<?php

declare(strict_types=1);

$root = __DIR__;

$requestUri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
$query = parse_url($requestUri, PHP_URL_QUERY);
$path = parse_url($requestUri, PHP_URL_PATH) ?: '/';
$scriptName = (string) ($_SERVER['SCRIPT_NAME'] ?? '/index.php');
$normalizedScriptName = str_replace('\\', '/', $scriptName);
$basePath = basename($normalizedScriptName) === 'index.php'
    ? rtrim(str_replace('\\', '/', dirname($normalizedScriptName)), '/')
    : '';

if ($basePath !== '' && $basePath !== '/' && str_starts_with($path, $basePath . '/')) {
    $path = substr($path, strlen($basePath));
    $path = $path === '' ? '/' : $path;
    $_SERVER['REQUEST_URI'] = $path . ($query !== null && $query !== '' ? '?' . $query : '');
}

if (str_starts_with($path, '/uploads/')) {
    $uploadCandidates = [
        [
            'path' => realpath($root . '/storage' . $path),
            'root' => realpath($root . '/storage/uploads'),
        ],
        [
            'path' => realpath($root . $path),
            'root' => realpath($root . '/uploads'),
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
            return;
        }
    }
}

$legacyRoutes = [
    '/api/formhandle.php' => $root . '/api/formhandle.php',
    '/api/leads' => $root . '/api/formhandle.php',
    '/api/article-api.php' => $root . '/api/article-api.php',
    '/api/articles' => $root . '/api/article-api.php',
    '/api/material-api.php' => $root . '/api/materi-api.php',
    '/api/materi-api.php' => $root . '/api/materi-api.php',
    '/api/materials' => $root . '/api/materi-api.php',
    '/api/materi' => $root . '/api/materi-api.php',
    '/api/projects-api.php' => $root . '/api/projects-api.php',
    '/api/projects' => $root . '/api/projects-api.php',
    '/api/partners-api.php' => $root . '/api/partners-api.php',
    '/api/partners' => $root . '/api/partners-api.php',
    '/api/testimonials-api.php' => $root . '/api/testimonials-api.php',
    '/api/testimonials' => $root . '/api/testimonials-api.php',
    '/api/transactions-api.php' => $root . '/api/transactions-api.php',
    '/api/transactions' => $root . '/api/transactions-api.php',
    '/api/user-notifications-api.php' => $root . '/api/user-notifications-api.php',
    '/api/user-notifications' => $root . '/api/user-notifications-api.php',
    '/api/ide-config-api.php' => $root . '/api/ide-config-api.php',
    '/api/ide-config' => $root . '/api/ide-config-api.php',
    '/api/certificate-api.php' => $root . '/api/certificate-api.php',
    '/api/certificates' => $root . '/api/certificate-api.php',
    '/api/galery-api.php' => $root . '/api/galery-api.php',
    '/api/gallery-api.php' => $root . '/api/galery-api.php',
    '/api/galery' => $root . '/api/galery-api.php',
    '/api/gallery' => $root . '/api/galery-api.php',
    '/api/workshop-api.php' => $root . '/api/workshop-api.php',
    '/api/workshops' => $root . '/api/workshop-api.php',
    '/api/workshops-api.php' => $root . '/api/workshop-api.php',
    '/api/workshops-api' => $root . '/api/workshop-api.php',
    '/api/sqlite_odbc.php' => $root . '/api/sqlite_odbc.php',
    '/api/auth/login.php' => $root . '/api/auth/login.php',
    '/api/auth/session.php' => $root . '/api/auth/session.php',
    '/api/auth/profile.php' => $root . '/api/auth/profile.php',
    '/api/admin/login.php' => $root . '/api/admin/login.php',
    '/api/admin/session.php' => $root . '/api/admin/session.php',
    '/api/admin/dashboard.php' => null,
];

if (array_key_exists($path, $legacyRoutes)) {
    if ($legacyRoutes[$path] === null) {
        $_SERVER['REQUEST_URI'] = '/api/admin/dashboard';
        require $root . '/public/index.php';
        return;
    }

    require $legacyRoutes[$path];
    return;
}

require $root . '/public/index.php';
