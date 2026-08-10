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

header('Access-Control-Allow-Methods: PUT, OPTIONS');
header(
    'Access-Control-Allow-Headers: Content-Type, Accept, Authorization'
);
header('Access-Control-Max-Age: 86400');

/*
|--------------------------------------------------------------------------
| Handle CORS preflight
|--------------------------------------------------------------------------
*/

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| JSON Response
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
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| Method
|--------------------------------------------------------------------------
*/

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'PUT') {
    sendJson(
        405,
        false,
        'Method tidak diizinkan. Gunakan PUT.'
    );
}

/*
|--------------------------------------------------------------------------
| Authorization Bearer Token
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
| Database config
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
    || !is_array($config['sqlite'])
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

/*
|--------------------------------------------------------------------------
| Connect SQLite
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
    sendJson(
        500,
        false,
        'Koneksi database gagal.',
        [
            'detail' =>
                $exception->getMessage(),
        ]
    );
}

/*
|--------------------------------------------------------------------------
| Validate token
|--------------------------------------------------------------------------
*/

$now = gmdate(
    'Y-m-d\TH:i:s\Z'
);

try {
    $statement = $pdo->prepare(
        'SELECT
            t.user_id,
            t.expires_at,
            u.id,
            u.email
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
        'Session gagal diperiksa.',
        [
            'detail' =>
                $exception->getMessage(),
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

$userId = (int) $session['user_id'];

/*
|--------------------------------------------------------------------------
| Read JSON body
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
} catch (JsonException) {
    sendJson(
        400,
        false,
        'Format JSON tidak valid.'
    );
}

if (!is_array($payload)) {
    sendJson(
        400,
        false,
        'Data profil tidak valid.'
    );
}

/*
|--------------------------------------------------------------------------
| Normalize input
|--------------------------------------------------------------------------
*/

$name = trim(
    (string) ($payload['name'] ?? '')
);

$username = trim(
    (string) ($payload['username'] ?? '')
);

$nickname = trim(
    (string) ($payload['nickname'] ?? '')
);

$whatsapp = trim(
    (string) ($payload['whatsapp'] ?? '')
);

$occupation = trim(
    (string) ($payload['occupation'] ?? '')
);

$institutionName = trim(
    (string) (
        $payload['institution_name']
        ?? $payload['institutionName']
        ?? ''
    )
);

$profileImage = trim(
    (string) (
        $payload['profile_image']
        ?? $payload['profileImage']
        ?? ''
    )
);

/*
|--------------------------------------------------------------------------
| Validation
|--------------------------------------------------------------------------
*/

$errors = [];

if ($name === '') {
    $errors['name'] =
        'Nama lengkap wajib diisi.';
}

if ($username === '') {
    $errors['username'] =
        'Username wajib diisi.';
}

if ($errors !== []) {
    sendJson(
        422,
        false,
        'Data profil belum valid.',
        [],
        $errors
    );
}

/*
|--------------------------------------------------------------------------
| Check username duplicate
|--------------------------------------------------------------------------
*/

try {
    $checkUsername = $pdo->prepare(
        'SELECT id
         FROM users
         WHERE LOWER(username) = LOWER(:username)
         AND id != :user_id
         AND deleted_at IS NULL
         LIMIT 1'
    );

    $checkUsername->execute([
        ':username' => $username,
        ':user_id' => $userId,
    ]);

    if ($checkUsername->fetch()) {
        sendJson(
            409,
            false,
            'Username sudah digunakan pengguna lain.',
            [],
            [
                'username' =>
                    'Username sudah digunakan.',
            ]
        );
    }
} catch (Throwable $exception) {
    sendJson(
        500,
        false,
        'Username gagal diperiksa.',
        [
            'detail' =>
                $exception->getMessage(),
        ]
    );
}

/*
|--------------------------------------------------------------------------
| Update profile
|--------------------------------------------------------------------------
*/

$updatedAt = gmdate(
    'Y-m-d\TH:i:s\Z'
);

try {
    $update = $pdo->prepare(
        'UPDATE users
         SET
            name = :name,
            username = :username,
            nickname = :nickname,
            whatsapp = :whatsapp,
            occupation = :occupation,
            institution_name = :institution_name,
            profile_image = :profile_image,
            updated_at = :updated_at
         WHERE id = :id
         AND deleted_at IS NULL'
    );

    $update->execute([
        ':name' => $name,
        ':username' => $username,
        ':nickname' =>
            $nickname !== ''
                ? $nickname
                : null,

        ':whatsapp' =>
            $whatsapp !== ''
                ? $whatsapp
                : null,

        ':occupation' =>
            $occupation !== ''
                ? $occupation
                : null,

        ':institution_name' =>
            $institutionName !== ''
                ? $institutionName
                : null,

        ':profile_image' =>
            $profileImage !== ''
                ? $profileImage
                : null,

        ':updated_at' => $updatedAt,
        ':id' => $userId,
    ]);
} catch (Throwable $exception) {
    sendJson(
        500,
        false,
        'Profil gagal diperbarui.',
        [
            'detail' =>
                $exception->getMessage(),
        ]
    );
}

/*
|--------------------------------------------------------------------------
| Get updated user
|--------------------------------------------------------------------------
*/

try {
    $statement = $pdo->prepare(
        'SELECT
            id,
            name,
            username,
            email,
            nickname,
            whatsapp,
            institution_name,
            occupation,
            profile_image,
            avatar_path,
            email_verified_at,
            updated_at
         FROM users
         WHERE id = :id
         AND deleted_at IS NULL
         LIMIT 1'
    );

    $statement->execute([
        ':id' => $userId,
    ]);

    $user = $statement->fetch();
} catch (Throwable $exception) {
    sendJson(
        500,
        false,
        'Profil berhasil diperbarui tetapi data terbaru gagal dibaca.',
        [
            'detail' =>
                $exception->getMessage(),
        ]
    );
}

if (!$user) {
    sendJson(
        404,
        false,
        'Data pengguna tidak ditemukan.'
    );
}

/*
|--------------------------------------------------------------------------
| Response
|--------------------------------------------------------------------------
*/

$responseUser = [
    'id' =>
        (int) $user['id'],

    'name' =>
        $user['name'],

    'username' =>
        $user['username'],

    'email' =>
        $user['email'],

    'nickname' =>
        $user['nickname'],

    'whatsapp' =>
        $user['whatsapp'],

    'institution_name' =>
        $user['institution_name'],

    'occupation' =>
        $user['occupation'],

    'profile_image' =>
        $user['profile_image'],

    'avatar_path' =>
        $user['avatar_path'],

    'email_verified_at' =>
        $user['email_verified_at'],

    'updated_at' =>
        $user['updated_at'],
];

sendJson(
    200,
    true,
    'Profil berhasil diperbarui.',
    [
        'user' => $responseUser,
    ]
);