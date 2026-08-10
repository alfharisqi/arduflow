<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'https://arduflow.indobilliard.com',
    'https://www.arduflow.indobilliard.com',
];

$isLocalOrigin = preg_match(
    '#^http://(localhost|127\.0\.0\.1):[0-9]+$#',
    $origin
) === 1;

$isLanOrigin = preg_match(
    '#^http://('
    . '192\.168\.\d{1,3}\.\d{1,3}'
    . '|10\.\d{1,3}\.\d{1,3}\.\d{1,3}'
    . '|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}'
    . '):[0-9]+$#',
    $origin
) === 1;

if (
    $isLocalOrigin
    || $isLanOrigin
    || in_array($origin, $allowedOrigins, true)
) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, OPTIONS');

header(
    'Access-Control-Allow-Headers: Content-Type, Accept, Authorization'
);

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

/*
|--------------------------------------------------------------------------
| OPTIONS
|--------------------------------------------------------------------------
*/

if (
    ($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS'
) {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| JSON
|--------------------------------------------------------------------------
*/

header('Content-Type: application/json; charset=utf-8');

/*
|--------------------------------------------------------------------------
| JSON RESPONSE
|--------------------------------------------------------------------------
*/

function sendJson(
    int $status,
    bool $success,
    string $message,
    array $data = [],
    array $errors = []
): void {
    http_response_code($status);

    $response = [
        'success' => $success,
        'message' => $message,
    ];

    if ($data !== []) {
        $response['data'] = $data;
    }

    if ($errors !== []) {
        $response['errors'] = $errors;
    }

    $json = json_encode(
        $response,
        JSON_UNESCAPED_UNICODE
        | JSON_UNESCAPED_SLASHES
        | JSON_PRETTY_PRINT
    );

    if ($json === false) {
        http_response_code(500);

        echo json_encode([
            'success' => false,
            'message' => 'Response JSON gagal dibuat.',
        ]);

        exit;
    }

    echo $json;
    exit;
}

/*
|--------------------------------------------------------------------------
| GLOBAL EXCEPTION
|--------------------------------------------------------------------------
*/

set_exception_handler(
    function (Throwable $exception): void {
        error_log(
            'Admin Session Exception: '
            . $exception->__toString()
        );

        sendJson(
            500,
            false,
            'Terjadi kesalahan pada session admin.',
            [
                'detail' => $exception->getMessage(),
            ]
        );
    }
);

/*
|--------------------------------------------------------------------------
| METHOD
|--------------------------------------------------------------------------
*/

if (
    ($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET'
) {
    header('Allow: GET, OPTIONS');

    sendJson(
        405,
        false,
        'Method tidak diizinkan. Gunakan GET.'
    );
}

/*
|--------------------------------------------------------------------------
| AUTHORIZATION HEADER
|--------------------------------------------------------------------------
*/

$authorizationHeader =
    $_SERVER['HTTP_AUTHORIZATION']
    ?? '';

if ($authorizationHeader === '') {
    /*
     * Fallback untuk beberapa konfigurasi server.
     */
    if (function_exists('getallheaders')) {
        $headers = getallheaders();

        $authorizationHeader =
            $headers['Authorization']
            ?? $headers['authorization']
            ?? '';
    }
}

if ($authorizationHeader === '') {
    sendJson(
        401,
        false,
        'Token admin tidak ditemukan.'
    );
}

/*
|--------------------------------------------------------------------------
| BEARER TOKEN
|--------------------------------------------------------------------------
*/

if (
    !preg_match(
        '/^Bearer\s+(.+)$/i',
        trim($authorizationHeader),
        $matches
    )
) {
    sendJson(
        401,
        false,
        'Format Authorization tidak valid.'
    );
}

$plainToken = trim(
    $matches[1] ?? ''
);

if ($plainToken === '') {
    sendJson(
        401,
        false,
        'Token admin kosong.'
    );
}

/*
|--------------------------------------------------------------------------
| PROJECT ROOT
|--------------------------------------------------------------------------
|
| File:
|
| website/API/api/admin/session.php
|
| dirname(__DIR__, 2)
|
| website/API
|--------------------------------------------------------------------------
*/

$projectRoot = dirname(
    __DIR__,
    2
);

$configPath =
    $projectRoot
    . DIRECTORY_SEPARATOR
    . 'config'
    . DIRECTORY_SEPARATOR
    . 'database.php';

if (!file_exists($configPath)) {
    sendJson(
        500,
        false,
        'Konfigurasi database tidak ditemukan.',
        [
            'config_path' => $configPath,
        ]
    );
}

/*
|--------------------------------------------------------------------------
| DATABASE CONFIG
|--------------------------------------------------------------------------
*/

$config = require $configPath;

if (
    !is_array($config)
    || !isset($config['sqlite'])
    || !is_array($config['sqlite'])
) {
    sendJson(
        500,
        false,
        'Konfigurasi SQLite tidak valid.'
    );
}

$databasePath = trim(
    (string) (
        $config['sqlite']['path']
        ?? ''
    )
);

$busyTimeout = (int) (
    $config['sqlite']['busy_timeout_ms']
    ?? 5000
);

if ($databasePath === '') {
    sendJson(
        500,
        false,
        'Path database SQLite belum dikonfigurasi.'
    );
}

/*
|--------------------------------------------------------------------------
| ABSOLUTE / RELATIVE DATABASE PATH
|--------------------------------------------------------------------------
*/

$isWindowsAbsolutePath = preg_match(
    '/^[A-Za-z]:[\\\\\/]/',
    $databasePath
) === 1;

$isUnixAbsolutePath = str_starts_with(
    $databasePath,
    '/'
);

if (
    !$isWindowsAbsolutePath
    && !$isUnixAbsolutePath
) {
    $databasePath =
        $projectRoot
        . DIRECTORY_SEPARATOR
        . str_replace(
            ['/', '\\'],
            DIRECTORY_SEPARATOR,
            $databasePath
        );
}

if (!file_exists($databasePath)) {
    sendJson(
        500,
        false,
        'File database SQLite tidak ditemukan.',
        [
            'database_path' => $databasePath,
        ]
    );
}

/*
|--------------------------------------------------------------------------
| DATABASE CONNECTION
|--------------------------------------------------------------------------
*/

try {
    $pdo = new PDO(
        'sqlite:' . $databasePath,
        null,
        null,
        [
            PDO::ATTR_ERRMODE =>
                PDO::ERRMODE_EXCEPTION,

            PDO::ATTR_DEFAULT_FETCH_MODE =>
                PDO::FETCH_ASSOC,

            PDO::ATTR_EMULATE_PREPARES =>
                false,
        ]
    );

    $pdo->exec(
        'PRAGMA foreign_keys = ON'
    );

    $pdo->exec(
        'PRAGMA busy_timeout = '
        . max(
            5000,
            $busyTimeout
        )
    );
} catch (Throwable $exception) {
    sendJson(
        500,
        false,
        'Koneksi database SQLite gagal.',
        [
            'detail' =>
                $exception->getMessage(),

            'database_path' =>
                $databasePath,
        ]
    );
}

/*
|--------------------------------------------------------------------------
| HASH TOKEN
|--------------------------------------------------------------------------
|
| login.php menyimpan SHA-256 token.
|--------------------------------------------------------------------------
*/

$tokenHash = hash(
    'sha256',
    $plainToken
);

$now = gmdate(
    'Y-m-d\TH:i:s\Z'
);

/*
|--------------------------------------------------------------------------
| CEK TABEL ADMIN AUTH TOKENS
|--------------------------------------------------------------------------
*/

$tableCheck = $pdo->query(
    "SELECT name
     FROM sqlite_master
     WHERE type = 'table'
       AND name = 'admin_auth_tokens'
     LIMIT 1"
);

if (!$tableCheck->fetch()) {
    sendJson(
        401,
        false,
        'Session admin belum tersedia. Silakan login kembali.'
    );
}

/*
|--------------------------------------------------------------------------
| CARI SESSION ADMIN
|--------------------------------------------------------------------------
*/

$sql = '
    SELECT
        t.id AS token_id,
        t.admin_id,
        t.expires_at,

        a.id,
        a.name,
        a.username,
        a.email

    FROM admin_auth_tokens AS t

    INNER JOIN admins AS a
        ON a.id = t.admin_id

    WHERE
        t.token_hash = :token_hash
        AND t.expires_at > :now

    LIMIT 1
';

try {
    $statement = $pdo->prepare(
        $sql
    );

    $statement->execute([
        ':token_hash' =>
            $tokenHash,

        ':now' =>
            $now,
    ]);

    $session =
        $statement->fetch();
} catch (Throwable $exception) {
    sendJson(
        500,
        false,
        'Session admin gagal dibaca.',
        [
            'detail' =>
                $exception->getMessage(),
        ]
    );
}

/*
|--------------------------------------------------------------------------
| SESSION INVALID
|--------------------------------------------------------------------------
*/

if (!$session) {
    sendJson(
        401,
        false,
        'Session admin tidak valid atau sudah kedaluwarsa.'
    );
}

/*
|--------------------------------------------------------------------------
| RESPONSE ADMIN
|--------------------------------------------------------------------------
*/

$admin = [
    'id' =>
        (int) $session['id'],

    'name' =>
        (string) (
            $session['name']
            ?? ''
        ),

    'username' =>
        $session['username']
        ?? null,

    'email' =>
        $session['email']
        ?? null,
];

/*
|--------------------------------------------------------------------------
| SUCCESS
|--------------------------------------------------------------------------
*/

sendJson(
    200,
    true,
    'Session admin valid.',
    [
        'admin' =>
            $admin,

        'expires_at' =>
            $session['expires_at'],
    ]
);