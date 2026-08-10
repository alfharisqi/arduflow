<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (
    preg_match(
        '#^http://(localhost|127\.0\.0\.1):[0-9]+$#',
        $origin
    )
) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, OPTIONS');
header(
    'Access-Control-Allow-Headers: Content-Type, Accept, Authorization'
);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function sendJson(
    int $status,
    bool $success,
    string $message,
    array $data = []
): void {
    http_response_code($status);

    $response = [
        'success' => $success,
        'message' => $message,
    ];

    if ($data !== []) {
        $response['data'] = $data;
    }

    echo json_encode(
        $response,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    sendJson(
        405,
        false,
        'Method tidak diizinkan. Gunakan GET.'
    );
}

/*
|--------------------------------------------------------------------------
| Ambil Bearer Token
|--------------------------------------------------------------------------
*/

$authorizationHeader =
    $_SERVER['HTTP_AUTHORIZATION']
    ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
    ?? '';

if (
    !preg_match(
        '/Bearer\s+(.+)/i',
        $authorizationHeader,
        $matches
    )
) {
    sendJson(
        401,
        false,
        'Token autentikasi tidak ditemukan.'
    );
}

$plainToken = trim($matches[1]);

if ($plainToken === '') {
    sendJson(
        401,
        false,
        'Token autentikasi kosong.'
    );
}

$tokenHash = hash(
    'sha256',
    $plainToken
);

/*
|--------------------------------------------------------------------------
| Database
|--------------------------------------------------------------------------
*/

$projectRoot = dirname(__DIR__, 2);
$configPath = $projectRoot . '/config/database.php';

if (!file_exists($configPath)) {
    sendJson(
        500,
        false,
        'Konfigurasi database tidak ditemukan.'
    );
}

$config = require $configPath;

if (
    !is_array($config)
    || !isset($config['sqlite'])
) {
    sendJson(
        500,
        false,
        'Konfigurasi SQLite tidak valid.'
    );
}

$databasePath =
    (string) ($config['sqlite']['path'] ?? '');

$busyTimeout =
    (int) ($config['sqlite']['busy_timeout_ms'] ?? 5000);

if (
    $databasePath === ''
    || !file_exists($databasePath)
) {
    sendJson(
        500,
        false,
        'File database SQLite tidak ditemukan.',
        [
            'database_path' => $databasePath,
        ]
    );
}

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

    $pdo->exec('PRAGMA foreign_keys = ON');

    $pdo->exec(
        'PRAGMA busy_timeout = '
        . max(5000, $busyTimeout)
    );
} catch (Throwable $exception) {
    sendJson(
        500,
        false,
        'Koneksi database gagal.',
        [
            'detail' => $exception->getMessage(),
        ]
    );
}

/*
|--------------------------------------------------------------------------
| Cari session
|--------------------------------------------------------------------------
*/

$now = gmdate('Y-m-d\TH:i:s\Z');

try {
    $statement = $pdo->prepare(
        'SELECT
            t.id AS token_id,
            t.user_id,
            t.expires_at,

            u.id,
            u.name,
            u.username,
            u.email,
            u.nickname,
            u.whatsapp,
            u.institution_name,
            u.occupation,
            u.email_verified_at

         FROM auth_tokens t

         INNER JOIN users u
            ON u.id = t.user_id

         WHERE t.token_hash = :token_hash
         AND t.expires_at > :now
         AND u.deleted_at IS NULL

         LIMIT 1'
    );

    $statement->execute([
        ':token_hash' => $tokenHash,
        ':now' => $now,
    ]);

    $session = $statement->fetch();
} catch (Throwable $exception) {
    sendJson(
        500,
        false,
        'Session gagal dibaca.',
        [
            'detail' => $exception->getMessage(),
        ]
    );
}

if (!$session) {
    sendJson(
        401,
        false,
        'Session tidak valid atau sudah kedaluwarsa.'
    );
}

/*
|--------------------------------------------------------------------------
| Response
|--------------------------------------------------------------------------
*/

$user = [
    'id' => (int) $session['id'],
    'name' => $session['name'],
    'username' => $session['username'],
    'email' => $session['email'],
    'nickname' => $session['nickname'],
    'whatsapp' => $session['whatsapp'],
    'institution_name' =>
        $session['institution_name'],
    'occupation' => $session['occupation'],
    'email_verified_at' =>
        $session['email_verified_at'],
];

sendJson(
    200,
    true,
    'Session valid.',
    [
        'user' => $user,
        'expires_at' => $session['expires_at'],
    ]
);