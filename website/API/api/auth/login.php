<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
| Mendukung:
| - http://localhost:5173
| - http://127.0.0.1:5173
| - http://192.168.x.x:5173
| - http://10.x.x.x:5173
| - http://172.16.x.x - 172.31.x.x
| - domain production
|--------------------------------------------------------------------------
*/

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedOrigins = [
    'https://arduflow.indobilliard.com',
    'https://www.arduflow.indobilliard.com',
];

$isDevelopmentOrigin = preg_match(
    '#^http://('
    . 'localhost'
    . '|127\.0\.0\.1'
    . '|192\.168\.\d{1,3}\.\d{1,3}'
    . '|10\.\d{1,3}\.\d{1,3}\.\d{1,3}'
    . '|172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}'
    . '):[0-9]+$#',
    $origin
) === 1;

if (
    $isDevelopmentOrigin
    || in_array($origin, $allowedOrigins, true)
) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header(
    'Access-Control-Allow-Headers: Content-Type, Accept, Authorization'
);
header('Access-Control-Max-Age: 86400');

/*
|--------------------------------------------------------------------------
| Preflight OPTIONS
|--------------------------------------------------------------------------
*/

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| Content Type
|--------------------------------------------------------------------------
*/

header('Content-Type: application/json; charset=utf-8');

/*
|--------------------------------------------------------------------------
| Response JSON
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

    echo json_encode(
        $response,
        JSON_UNESCAPED_UNICODE
        | JSON_UNESCAPED_SLASHES
        | JSON_PRETTY_PRINT
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| Method
|--------------------------------------------------------------------------
*/

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST, OPTIONS');

    sendJson(
        405,
        false,
        'Method tidak diizinkan. Gunakan POST.'
    );
}

/*
|--------------------------------------------------------------------------
| Membaca Request JSON
|--------------------------------------------------------------------------
*/

$rawBody = file_get_contents('php://input');

if (
    $rawBody === false
    || trim($rawBody) === ''
) {
    sendJson(
        400,
        false,
        'Request body tidak boleh kosong.'
    );
}

try {
    $payload = json_decode(
        $rawBody,
        true,
        512,
        JSON_THROW_ON_ERROR
    );
} catch (JsonException $exception) {
    sendJson(
        400,
        false,
        'Format JSON tidak valid.',
        [
            'detail' => $exception->getMessage(),
        ]
    );
}

if (!is_array($payload)) {
    sendJson(
        400,
        false,
        'Struktur JSON harus berupa object.'
    );
}

/*
|--------------------------------------------------------------------------
| Input Login
|--------------------------------------------------------------------------
*/

$identifier = trim(
    (string) ($payload['identifier'] ?? '')
);

$password = (string) ($payload['password'] ?? '');

$errors = [];

if ($identifier === '') {
    $errors['identifier'] =
        'Nama, username, atau email wajib diisi.';
}

if ($password === '') {
    $errors['password'] =
        'Kata sandi wajib diisi.';
}

if ($errors !== []) {
    sendJson(
        422,
        false,
        'Data login belum valid.',
        [],
        $errors
    );
}

/*
|--------------------------------------------------------------------------
| Project Root
|--------------------------------------------------------------------------
|
| File saat ini:
|
| website/API/api/auth/login.php
|
| dirname(__DIR__, 2):
|
| website/API
|--------------------------------------------------------------------------
*/

$projectRoot = dirname(__DIR__, 2);

$configPath =
    $projectRoot
    . DIRECTORY_SEPARATOR
    . 'config'
    . DIRECTORY_SEPARATOR
    . 'database.php';

/*
|--------------------------------------------------------------------------
| Config Database
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Database Path
|--------------------------------------------------------------------------
*/

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
| Absolute / Relative Path
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

/*
|--------------------------------------------------------------------------
| Cek Database
|--------------------------------------------------------------------------
*/

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
| Koneksi SQLite
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
        . max(5000, $busyTimeout)
    );
} catch (Throwable $exception) {
    error_log(
        'Koneksi SQLite login gagal: '
        . $exception->getMessage()
    );

    sendJson(
        500,
        false,
        'Koneksi database gagal.',
        [
            'detail' => $exception->getMessage(),
            'database_path' => $databasePath,
        ]
    );
}

/*
|--------------------------------------------------------------------------
| Cari User
|--------------------------------------------------------------------------
*/

$sql = '
    SELECT
        id,
        name,
        username,
        email,
        password_hash,
        nickname,
        whatsapp,
        institution_name,
        occupation,
        email_verified_at,
        deleted_at
    FROM users
    WHERE (
        LOWER(email) = LOWER(:identifier)
        OR LOWER(username) = LOWER(:identifier)
        OR LOWER(name) = LOWER(:identifier)
    )
    AND deleted_at IS NULL
    LIMIT 1
';

try {
    $statement = $pdo->prepare($sql);

    $statement->execute([
        ':identifier' => $identifier,
    ]);

    $user = $statement->fetch();
} catch (Throwable $exception) {
    error_log(
        'Query login user gagal: '
        . $exception->getMessage()
    );

    sendJson(
        500,
        false,
        'Data pengguna gagal dibaca.',
        [
            'detail' => $exception->getMessage(),
        ]
    );
}

if (!$user) {
    sendJson(
        401,
        false,
        'Nama, username, email, atau kata sandi salah.'
    );
}

/*
|--------------------------------------------------------------------------
| Verifikasi Password
|--------------------------------------------------------------------------
*/

$passwordHash = trim(
    (string) ($user['password_hash'] ?? '')
);

if ($passwordHash === '') {
    sendJson(
        401,
        false,
        'Password pengguna tidak tersedia.'
    );
}

$passwordValid = false;

/*
|--------------------------------------------------------------------------
| Argon2 / bcrypt
|--------------------------------------------------------------------------
*/

if (
    str_starts_with($passwordHash, '$argon2')
    || str_starts_with($passwordHash, '$2y$')
    || str_starts_with($passwordHash, '$2b$')
) {
    $passwordValid = password_verify(
        $password,
        $passwordHash
    );
}

/*
|--------------------------------------------------------------------------
| Hash Scrypt Lama
|--------------------------------------------------------------------------
*/

if (
    !$passwordValid
    && str_starts_with(
        $passwordHash,
        'scrypt$'
    )
) {
    sendJson(
        401,
        false,
        'Password akun masih menggunakan hash scrypt dari backend Node.js lama. Silakan reset password terlebih dahulu.'
    );
}

/*
|--------------------------------------------------------------------------
| Password Salah
|--------------------------------------------------------------------------
*/

if (!$passwordValid) {
    sendJson(
        401,
        false,
        'Nama, username, email, atau kata sandi salah.'
    );
}

/*
|--------------------------------------------------------------------------
| Tabel Auth Tokens
|--------------------------------------------------------------------------
*/

try {
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS auth_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id)
                REFERENCES users(id)
                ON DELETE CASCADE
        )'
    );
} catch (Throwable $exception) {
    sendJson(
        500,
        false,
        'Tabel token login tidak dapat disiapkan.',
        [
            'detail' => $exception->getMessage(),
        ]
    );
}

/*
|--------------------------------------------------------------------------
| Generate Token
|--------------------------------------------------------------------------
*/

try {
    $plainToken = bin2hex(
        random_bytes(32)
    );
} catch (Throwable $exception) {
    sendJson(
        500,
        false,
        'Token login gagal dibuat.'
    );
}

$tokenHash = hash(
    'sha256',
    $plainToken
);

$now = gmdate(
    'Y-m-d\TH:i:s\Z'
);

$expiresAt = gmdate(
    'Y-m-d\TH:i:s\Z',
    time() + 86400
);

/*
|--------------------------------------------------------------------------
| Simpan Token
|--------------------------------------------------------------------------
*/

try {
    $pdo->beginTransaction();

    /*
    |--------------------------------------------------------------------------
    | Hapus Token Kadaluarsa
    |--------------------------------------------------------------------------
    */

    $deleteExpired = $pdo->prepare(
        'DELETE FROM auth_tokens
         WHERE expires_at <= :now'
    );

    $deleteExpired->execute([
        ':now' => $now,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Insert Token Baru
    |--------------------------------------------------------------------------
    */

    $insertToken = $pdo->prepare(
        'INSERT INTO auth_tokens (
            user_id,
            token_hash,
            expires_at,
            created_at
        ) VALUES (
            :user_id,
            :token_hash,
            :expires_at,
            :created_at
        )'
    );

    $insertToken->execute([
        ':user_id' =>
            (int) $user['id'],

        ':token_hash' =>
            $tokenHash,

        ':expires_at' =>
            $expiresAt,

        ':created_at' =>
            $now,
    ]);

    $pdo->commit();
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log(
        'Pembuatan auth token gagal: '
        . $exception->getMessage()
    );

    sendJson(
        500,
        false,
        'Token login gagal dibuat.',
        [
            'detail' => $exception->getMessage(),
        ]
    );
}

/*
|--------------------------------------------------------------------------
| Response User
|--------------------------------------------------------------------------
*/

$responseUser = [
    'id' =>
        (int) $user['id'],

    'name' =>
        (string) ($user['name'] ?? ''),

    'username' =>
        $user['username'] ?? null,

    'email' =>
        (string) ($user['email'] ?? ''),

    'nickname' =>
        $user['nickname'] ?? null,

    'whatsapp' =>
        $user['whatsapp'] ?? null,

    'institution_name' =>
        $user['institution_name'] ?? null,

    'occupation' =>
        $user['occupation'] ?? null,

    'email_verified_at' =>
        $user['email_verified_at'] ?? null,
];

/*
|--------------------------------------------------------------------------
| Login Success
|--------------------------------------------------------------------------
*/

sendJson(
    200,
    true,
    'Login berhasil.',
    [
        'token' =>
            $plainToken,

        'token_type' =>
            'Bearer',

        'expires_at' =>
            $expiresAt,

        'user' =>
            $responseUser,
    ]
);