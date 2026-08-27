<?php

declare(strict_types=1);

const AFW_PROJECT_ROOT = __DIR__ . '/../..';

function afwSendJson(
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
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

function afwApplyCors(array $methods): void
{
    header('Content-Type: application/json; charset=utf-8');

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

    if ($isDevelopmentOrigin || in_array($origin, $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }

    $allowedMethods = array_values(array_unique([...$methods, 'OPTIONS']));

    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: ' . implode(', ', $allowedMethods));
    header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization');
    header('Access-Control-Max-Age: 86400');

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function afwRequireMethod(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') === $method) {
        return;
    }

    header('Allow: ' . $method . ', OPTIONS');
    afwSendJson(405, false, "Method tidak diizinkan. Gunakan {$method}.");
}

function afwReadJsonBody(string $emptyMessage = 'Request body tidak boleh kosong.'): array
{
    $rawBody = file_get_contents('php://input');

    if ($rawBody === false || trim($rawBody) === '') {
        afwSendJson(400, false, $emptyMessage);
    }

    try {
        $payload = json_decode($rawBody, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException $exception) {
        afwSendJson(400, false, 'Format JSON tidak valid.', [
            'detail' => $exception->getMessage(),
        ]);
    }

    if (!is_array($payload)) {
        afwSendJson(400, false, 'Struktur JSON harus berupa object.');
    }

    return $payload;
}

function afwBearerToken(): string
{
    $authorizationHeader =
        $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';

    if (!preg_match('/Bearer\s+(.+)/i', $authorizationHeader, $matches)) {
        afwSendJson(401, false, 'Token autentikasi tidak ditemukan.');
    }

    $token = trim($matches[1]);

    if ($token === '') {
        afwSendJson(401, false, 'Token autentikasi kosong.');
    }

    return $token;
}

function afwDatabasePath(): array
{
    $configPath = AFW_PROJECT_ROOT . '/config/database.php';

    if (!file_exists($configPath)) {
        afwSendJson(500, false, 'Konfigurasi database tidak ditemukan.', [
            'config_path' => $configPath,
        ]);
    }

    $config = require $configPath;

    if (!is_array($config) || !isset($config['sqlite']) || !is_array($config['sqlite'])) {
        afwSendJson(500, false, 'Konfigurasi SQLite tidak valid.');
    }

    $databasePath = trim((string) ($config['sqlite']['path'] ?? ''));
    $busyTimeout = (int) ($config['sqlite']['busy_timeout_ms'] ?? 5000);

    if ($databasePath === '') {
        afwSendJson(500, false, 'Path database SQLite belum dikonfigurasi.');
    }

    $isWindowsAbsolutePath = preg_match('/^[A-Za-z]:[\\\\\/]/', $databasePath) === 1;
    $isUnixAbsolutePath = str_starts_with($databasePath, '/');

    if (!$isWindowsAbsolutePath && !$isUnixAbsolutePath) {
        $databasePath = AFW_PROJECT_ROOT . '/' . str_replace(['/', '\\'], '/', $databasePath);
    }

    if (!file_exists($databasePath)) {
        afwSendJson(500, false, 'File database SQLite tidak ditemukan.', [
            'database_path' => $databasePath,
        ]);
    }

    return [$databasePath, max(5000, $busyTimeout)];
}

function afwPdo(): PDO
{
    [$databasePath, $busyTimeout] = afwDatabasePath();

    try {
        $pdo = new PDO('sqlite:' . $databasePath, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA busy_timeout = ' . $busyTimeout);

        return $pdo;
    } catch (Throwable $exception) {
        error_log('Koneksi SQLite gagal: ' . $exception->getMessage());

        afwSendJson(500, false, 'Koneksi database gagal.', [
            'detail' => $exception->getMessage(),
            'database_path' => $databasePath,
        ]);
    }
}

function afwUserResponse(array $user): array
{
    return [
        'id' => (int) $user['id'],
        'name' => (string) ($user['name'] ?? ''),
        'username' => $user['username'] ?? null,
        'email' => (string) ($user['email'] ?? ''),
        'nickname' => $user['nickname'] ?? null,
        'whatsapp' => $user['whatsapp'] ?? null,
        'institution_name' => $user['institution_name'] ?? null,
        'occupation' => $user['occupation'] ?? null,
        'profile_image' => $user['profile_image'] ?? null,
        'avatar_path' => $user['avatar_path'] ?? null,
        'email_verified_at' => $user['email_verified_at'] ?? null,
        'updated_at' => $user['updated_at'] ?? null,
    ];
}

function afwCurrentUserSession(PDO $pdo, string $plainToken): array
{
    $statement = $pdo->prepare(
        'SELECT
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
            u.profile_image,
            u.avatar_path,
            u.email_verified_at,
            u.updated_at
         FROM auth_tokens t
         INNER JOIN users u ON u.id = t.user_id
         WHERE t.token_hash = :token_hash
         AND t.expires_at > :now
         AND u.deleted_at IS NULL
         LIMIT 1'
    );

    $statement->execute([
        ':token_hash' => hash('sha256', $plainToken),
        ':now' => gmdate('Y-m-d\TH:i:s\Z'),
    ]);

    $session = $statement->fetch();

    if (!$session) {
        afwSendJson(401, false, 'Session tidak valid atau sudah kedaluwarsa.');
    }

    return $session;
}
