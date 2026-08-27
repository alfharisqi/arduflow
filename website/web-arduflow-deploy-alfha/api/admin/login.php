<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| DEBUG DEVELOPMENT
|--------------------------------------------------------------------------
| Aktifkan saat development.
| Untuk production sebaiknya display_errors = 0.
|--------------------------------------------------------------------------
*/

error_reporting(E_ALL);
ini_set('display_errors', '0');

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
    header(
        'Access-Control-Allow-Origin: ' . $origin
    );

    header('Vary: Origin');
}

header(
    'Access-Control-Allow-Methods: POST, OPTIONS'
);

header(
    'Access-Control-Allow-Headers: Content-Type, Accept, Authorization'
);

header(
    'Access-Control-Allow-Credentials: true'
);

header(
    'Access-Control-Max-Age: 86400'
);

/*
|--------------------------------------------------------------------------
| OPTIONS PREFLIGHT
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
| JSON CONTENT TYPE
|--------------------------------------------------------------------------
*/

header(
    'Content-Type: application/json; charset=utf-8'
);

/*
|--------------------------------------------------------------------------
| RESPONSE JSON
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
| EXCEPTION HANDLER
|--------------------------------------------------------------------------
*/

set_exception_handler(
    function (Throwable $exception): void {
        error_log(
            'Admin Login Exception: '
            . $exception->__toString()
        );

        sendJson(
            500,
            false,
            'Terjadi kesalahan pada server.',
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

$method = $_SERVER['REQUEST_METHOD'] ?? '';

if ($method !== 'POST') {
    header('Allow: POST, OPTIONS');

    sendJson(
        405,
        false,
        'Method tidak diizinkan. Gunakan POST.'
    );
}

/*
|--------------------------------------------------------------------------
| BACA REQUEST JSON
|--------------------------------------------------------------------------
*/

$rawBody = file_get_contents(
    'php://input'
);

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
        'Request JSON harus berupa object.'
    );
}

/*
|--------------------------------------------------------------------------
| LOGIN INPUT
|--------------------------------------------------------------------------
|
| Mendukung:
|
| {
|   "identifier": "...",
|   "password": "..."
| }
|
| maupun:
|
| {
|   "email": "...",
|   "password": "..."
| }
|--------------------------------------------------------------------------
*/

$identifier = trim(
    (string) (
        $payload['identifier']
        ?? $payload['email']
        ?? $payload['username']
        ?? ''
    )
);

$password = (string) (
    $payload['password'] ?? ''
);

$errors = [];

if ($identifier === '') {
    $errors['identifier'] =
        'Email, username, atau nama admin wajib diisi.';
}

if ($password === '') {
    $errors['password'] =
        'Kata sandi wajib diisi.';
}

if ($errors !== []) {
    sendJson(
        422,
        false,
        'Data login admin belum lengkap.',
        [],
        $errors
    );
}

/*
|--------------------------------------------------------------------------
| PROJECT ROOT
|--------------------------------------------------------------------------
|
| File:
|
| website/BE/api/admin/login.php
|
| dirname(__DIR__, 2) =
|
| website/BE
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

/*
|--------------------------------------------------------------------------
| DATABASE CONFIG
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
        'Path SQLite belum dikonfigurasi.'
    );
}

/*
|--------------------------------------------------------------------------
| ABSOLUTE / RELATIVE PATH
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
| DATABASE EXISTS
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
| SQLITE CONNECTION
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
    error_log(
        'Koneksi SQLite admin gagal: '
        . $exception->getMessage()
    );

    sendJson(
        500,
        false,
        'Koneksi database SQLite gagal.',
        [
            'database_path' =>
                $databasePath,

            'detail' =>
                $exception->getMessage(),
        ]
    );
}

/*
|--------------------------------------------------------------------------
| CEK TABLE ADMINS
|--------------------------------------------------------------------------
*/

$tableCheck = $pdo->query(
    "SELECT name
     FROM sqlite_master
     WHERE type = 'table'
       AND name = 'admins'
     LIMIT 1"
);

$adminTable = $tableCheck->fetch();

if (!$adminTable) {
    sendJson(
        500,
        false,
        'Tabel admins tidak ditemukan di database SQLite.',
        [
            'database_path' =>
                $databasePath,

            'expected_table' =>
                'admins',
        ]
    );
}

/*
|--------------------------------------------------------------------------
| CEK KOLOM TABLE ADMINS
|--------------------------------------------------------------------------
*/

$columns = $pdo
    ->query(
        'PRAGMA table_info(admins)'
    )
    ->fetchAll();

$columnNames = array_map(
    static function (array $column): string {
        return (string) (
            $column['name'] ?? ''
        );
    },
    $columns
);

/*
|--------------------------------------------------------------------------
| PASSWORD COLUMN
|--------------------------------------------------------------------------
|
| Mendukung:
|
| password_hash
| password
|--------------------------------------------------------------------------
*/

$passwordColumn = null;

if (
    in_array(
        'password_hash',
        $columnNames,
        true
    )
) {
    $passwordColumn =
        'password_hash';
} elseif (
    in_array(
        'password',
        $columnNames,
        true
    )
) {
    $passwordColumn =
        'password';
}

if ($passwordColumn === null) {
    sendJson(
        500,
        false,
        'Kolom password admin tidak ditemukan.',
        [
            'available_columns' =>
                $columnNames,
        ]
    );
}

/*
|--------------------------------------------------------------------------
| IDENTIFIER CONDITIONS
|--------------------------------------------------------------------------
*/

$identifierConditions = [];

if (
    in_array(
        'email',
        $columnNames,
        true
    )
) {
    $identifierConditions[] =
        'LOWER(email) = LOWER(:identifier)';
}

if (
    in_array(
        'username',
        $columnNames,
        true
    )
) {
    $identifierConditions[] =
        'LOWER(username) = LOWER(:identifier)';
}

if (
    in_array(
        'name',
        $columnNames,
        true
    )
) {
    $identifierConditions[] =
        'LOWER(name) = LOWER(:identifier)';
}

if ($identifierConditions === []) {
    sendJson(
        500,
        false,
        'Kolom email, username, atau name tidak ditemukan pada tabel admins.',
        [
            'available_columns' =>
                $columnNames,
        ]
    );
}

/*
|--------------------------------------------------------------------------
| SELECT COLUMNS
|--------------------------------------------------------------------------
*/

$selectColumns = [
    'id',
];

$optionalColumns = [
    'name',
    'username',
    'email',
    'role',
    'status',
    'is_active',
    'created_at',
    'updated_at',
    'deleted_at',
];

foreach (
    $optionalColumns
    as $column
) {
    if (
        in_array(
            $column,
            $columnNames,
            true
        )
    ) {
        $selectColumns[] =
            $column;
    }
}

$selectColumns[] =
    $passwordColumn;

/*
|--------------------------------------------------------------------------
| QUERY ADMIN
|--------------------------------------------------------------------------
*/

$whereConditions = [
    '('
    . implode(
        ' OR ',
        $identifierConditions
    )
    . ')',
];

/*
|--------------------------------------------------------------------------
| DELETED AT
|--------------------------------------------------------------------------
*/

if (
    in_array(
        'deleted_at',
        $columnNames,
        true
    )
) {
    $whereConditions[] =
        'deleted_at IS NULL';
}

/*
|--------------------------------------------------------------------------
| SQL
|--------------------------------------------------------------------------
*/

$sql =
    'SELECT '
    . implode(
        ', ',
        $selectColumns
    )
    . ' FROM admins'
    . ' WHERE '
    . implode(
        ' AND ',
        $whereConditions
    )
    . ' LIMIT 1';

try {
    $statement = $pdo->prepare(
        $sql
    );

    $statement->execute([
        ':identifier' =>
            $identifier,
    ]);

    $admin =
        $statement->fetch();
} catch (Throwable $exception) {
    error_log(
        'Query admin login gagal: '
        . $exception->getMessage()
    );

    sendJson(
        500,
        false,
        'Data admin gagal dibaca.',
        [
            'detail' =>
                $exception->getMessage(),
        ]
    );
}

/*
|--------------------------------------------------------------------------
| ADMIN TIDAK DITEMUKAN
|--------------------------------------------------------------------------
*/

if (!$admin) {
    sendJson(
        401,
        false,
        'Email, username, nama admin, atau kata sandi salah.'
    );
}

/*
|--------------------------------------------------------------------------
| STATUS ADMIN
|--------------------------------------------------------------------------
*/

if (
    array_key_exists(
        'is_active',
        $admin
    )
    && (int) $admin['is_active'] === 0
) {
    sendJson(
        403,
        false,
        'Akun admin tidak aktif.'
    );
}

if (
    isset($admin['status'])
) {
    $adminStatus = strtolower(
        trim(
            (string) $admin['status']
        )
    );

    if (
        in_array(
            $adminStatus,
            [
                'inactive',
                'disabled',
                'blocked',
                'suspended',
            ],
            true
        )
    ) {
        sendJson(
            403,
            false,
            'Akun admin tidak aktif.'
        );
    }
}

/*
|--------------------------------------------------------------------------
| PASSWORD HASH
|--------------------------------------------------------------------------
*/

$passwordHash = trim(
    (string) (
        $admin[$passwordColumn]
        ?? ''
    )
);

if ($passwordHash === '') {
    sendJson(
        401,
        false,
        'Password admin tidak tersedia.'
    );
}

/*
|--------------------------------------------------------------------------
| VERIFY PASSWORD
|--------------------------------------------------------------------------
*/

$passwordValid = false;

if (
    str_starts_with(
        $passwordHash,
        '$argon2'
    )
    || str_starts_with(
        $passwordHash,
        '$2y$'
    )
    || str_starts_with(
        $passwordHash,
        '$2b$'
    )
) {
    $passwordValid =
        password_verify(
            $password,
            $passwordHash
        );
}

/*
|--------------------------------------------------------------------------
| SCRYPT LEGACY
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
        'Password admin masih menggunakan hash scrypt dari backend lama. Silakan reset password admin terlebih dahulu.'
    );
}

/*
|--------------------------------------------------------------------------
| PASSWORD SALAH
|--------------------------------------------------------------------------
*/

if (!$passwordValid) {
    sendJson(
        401,
        false,
        'Email, username, nama admin, atau kata sandi salah.'
    );
}

/*
|--------------------------------------------------------------------------
| ADMIN AUTH TOKENS
|--------------------------------------------------------------------------
*/

try {
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS admin_auth_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            admin_id INTEGER NOT NULL,

            token_hash TEXT NOT NULL UNIQUE,

            expires_at TEXT NOT NULL,

            created_at TEXT NOT NULL,

            FOREIGN KEY (admin_id)
                REFERENCES admins(id)
                ON DELETE CASCADE
        )'
    );
} catch (Throwable $exception) {
    sendJson(
        500,
        false,
        'Tabel session admin tidak dapat disiapkan.',
        [
            'detail' =>
                $exception->getMessage(),
        ]
    );
}

/*
|--------------------------------------------------------------------------
| GENERATE TOKEN
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
        'Token admin gagal dibuat.'
    );
}

$tokenHash = hash(
    'sha256',
    $plainToken
);

/*
|--------------------------------------------------------------------------
| TOKEN TIME
|--------------------------------------------------------------------------
*/

$now = gmdate(
    'Y-m-d\TH:i:s\Z'
);

$expiresAt = gmdate(
    'Y-m-d\TH:i:s\Z',
    time() + 86400
);

/*
|--------------------------------------------------------------------------
| SIMPAN TOKEN
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
        'DELETE FROM admin_auth_tokens
         WHERE expires_at <= :now'
    );

    $deleteExpired->execute([
        ':now' =>
            $now,
    ]);

    /*
    |--------------------------------------------------------------------------
    | Insert Token
    |--------------------------------------------------------------------------
    */

    $insertToken = $pdo->prepare(
        'INSERT INTO admin_auth_tokens (
            admin_id,
            token_hash,
            expires_at,
            created_at
        ) VALUES (
            :admin_id,
            :token_hash,
            :expires_at,
            :created_at
        )'
    );

    $insertToken->execute([
        ':admin_id' =>
            (int) $admin['id'],

        ':token_hash' =>
            $tokenHash,

        ':expires_at' =>
            $expiresAt,

        ':created_at' =>
            $now,
    ]);

    $pdo->commit();
} catch (Throwable $exception) {
    if (
        $pdo->inTransaction()
    ) {
        $pdo->rollBack();
    }

    error_log(
        'Token admin gagal disimpan: '
        . $exception->getMessage()
    );

    sendJson(
        500,
        false,
        'Session admin gagal dibuat.',
        [
            'detail' =>
                $exception->getMessage(),
        ]
    );
}

/*
|--------------------------------------------------------------------------
| RESPONSE ADMIN
|--------------------------------------------------------------------------
*/

$responseAdmin = [
    'id' =>
        (int) $admin['id'],
];

if (
    array_key_exists(
        'name',
        $admin
    )
) {
    $responseAdmin['name'] =
        $admin['name'];
}

if (
    array_key_exists(
        'username',
        $admin
    )
) {
    $responseAdmin['username'] =
        $admin['username'];
}

if (
    array_key_exists(
        'email',
        $admin
    )
) {
    $responseAdmin['email'] =
        $admin['email'];
}

if (
    array_key_exists(
        'role',
        $admin
    )
) {
    $responseAdmin['role'] =
        $admin['role'];
}

/*
|--------------------------------------------------------------------------
| LOGIN BERHASIL
|--------------------------------------------------------------------------
*/

sendJson(
    200,
    true,
    'Login admin berhasil.',
    [
        'token' =>
            $plainToken,

        'token_type' =>
            'Bearer',

        'expires_at' =>
            $expiresAt,

        'admin' =>
            $responseAdmin,
    ]
);