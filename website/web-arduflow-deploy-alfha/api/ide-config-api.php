<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
];

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respondIde(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function resolveIdeDatabasePath(string $projectRoot, array $databaseConfig): array
{
    $sqliteConfig = $databaseConfig['sqlite'] ?? null;

    if (!is_array($sqliteConfig)) {
        throw new RuntimeException('Konfigurasi SQLite tidak ditemukan.');
    }

    $databasePath = trim((string) ($sqliteConfig['path'] ?? ''));
    $busyTimeout = (int) ($sqliteConfig['busy_timeout_ms'] ?? 15000);

    if ($databasePath === '') {
        throw new RuntimeException('Path database SQLite belum dikonfigurasi.');
    }

    $isWindowsAbsolutePath = preg_match('/^[A-Za-z]:[\\\\\/]/', $databasePath) === 1;
    $isUnixAbsolutePath = str_starts_with($databasePath, '/');

    if (!$isWindowsAbsolutePath && !$isUnixAbsolutePath) {
        $databasePath = $projectRoot . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $databasePath);
    }

    return [$databasePath, $busyTimeout];
}

function jakartaIdeNow(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))->format(DateTimeInterface::ATOM);
}

function ensureIdeConfigTable(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS ide_config (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            title TEXT NOT NULL DEFAULT "Akses ArduFlow IDE",
            price INTEGER NOT NULL DEFAULT 150000,
            currency TEXT NOT NULL DEFAULT "IDR",
            duration_days INTEGER NOT NULL DEFAULT 365,
            is_active INTEGER NOT NULL DEFAULT 1,
            description TEXT,
            updated_at TEXT NOT NULL
        )'
    );

    $statement = $pdo->query('SELECT COUNT(*) FROM ide_config WHERE id = 1');

    if ((int) $statement->fetchColumn() === 0) {
        $insert = $pdo->prepare(
            'INSERT INTO ide_config (
                id, title, price, currency, duration_days, is_active, description, updated_at
            ) VALUES (
                1, :title, 150000, "IDR", 365, 1, :description, :updated_at
            )'
        );

        $insert->execute([
            ':title' => 'Akses ArduFlow IDE',
            ':description' => 'Akses visual programming ArduFlow IDE untuk membuat dan mengelola project Arduino dan IoT.',
            ':updated_at' => jakartaIdeNow(),
        ]);
    }
}

function getIdeConfig(PDO $pdo): array
{
    $statement = $pdo->query('SELECT * FROM ide_config WHERE id = 1 LIMIT 1');
    $row = $statement->fetch(PDO::FETCH_ASSOC) ?: [];

    return [
        'title' => (string) ($row['title'] ?? 'Akses ArduFlow IDE'),
        'price' => (int) ($row['price'] ?? 150000),
        'currency' => (string) ($row['currency'] ?? 'IDR'),
        'durationDays' => (int) ($row['duration_days'] ?? 365),
        'isActive' => ((int) ($row['is_active'] ?? 1)) === 1,
        'description' => (string) ($row['description'] ?? ''),
        'updatedAt' => (string) ($row['updated_at'] ?? ''),
    ];
}

try {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

    if (!in_array($method, ['GET', 'POST', 'PUT'], true)) {
        respondIde(405, [
            'success' => false,
            'message' => 'Method tidak diizinkan.',
        ]);
    }

    $projectRoot = dirname(__DIR__);
    $autoloadPath = $projectRoot . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
    $configPath = $projectRoot . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'database.php';

    if (is_file($autoloadPath)) {
        require_once $autoloadPath;
    }

    if (class_exists(\Arduflow\Api\Support\Env::class)) {
        \Arduflow\Api\Support\Env::load($projectRoot . DIRECTORY_SEPARATOR . '.env');
    }

    if (!is_file($configPath)) {
        throw new RuntimeException('File konfigurasi database tidak ditemukan.');
    }

    $databaseConfig = require $configPath;
    [$databasePath, $busyTimeout] = resolveIdeDatabasePath($projectRoot, $databaseConfig);
    $databaseDirectory = dirname($databasePath);

    if (!is_dir($databaseDirectory) && !mkdir($databaseDirectory, 0775, true) && !is_dir($databaseDirectory)) {
        throw new RuntimeException('Folder database gagal dibuat.');
    }

    $pdo = new PDO('sqlite:' . $databasePath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA busy_timeout = ' . max(1000, $busyTimeout));
    ensureIdeConfigTable($pdo);

    if ($method === 'GET') {
        respondIde(200, [
            'success' => true,
            'message' => 'Konfigurasi IDE berhasil diambil.',
            'data' => [
                'config' => getIdeConfig($pdo),
            ],
        ]);
    }

    $rawBody = file_get_contents('php://input');
    $decoded = $rawBody ? json_decode($rawBody, true) : [];
    $incoming = is_array($decoded) ? ($decoded['data'] ?? $decoded) : [];

    if (!is_array($incoming)) {
        $incoming = [];
    }

    $title = trim((string) ($incoming['title'] ?? 'Akses ArduFlow IDE'));
    $price = (int) ($incoming['price'] ?? 150000);
    $durationDays = (int) ($incoming['durationDays'] ?? $incoming['duration_days'] ?? 365);
    $isActive = filter_var($incoming['isActive'] ?? $incoming['is_active'] ?? true, FILTER_VALIDATE_BOOL) ? 1 : 0;
    $description = trim((string) ($incoming['description'] ?? ''));

    $errors = [];

    if ($title === '') {
        $errors['title'] = 'Judul produk IDE wajib diisi.';
    }

    if ($price < 0) {
        $errors['price'] = 'Harga IDE tidak boleh negatif.';
    }

    if ($durationDays < 1) {
        $errors['durationDays'] = 'Durasi akses minimal 1 hari.';
    }

    if ($errors !== []) {
        respondIde(422, [
            'success' => false,
            'message' => 'Validasi konfigurasi IDE gagal.',
            'errors' => $errors,
        ]);
    }

    $statement = $pdo->prepare(
        'UPDATE ide_config SET
            title = :title,
            price = :price,
            duration_days = :duration_days,
            is_active = :is_active,
            description = :description,
            updated_at = :updated_at
         WHERE id = 1'
    );

    $statement->execute([
        ':title' => $title,
        ':price' => $price,
        ':duration_days' => $durationDays,
        ':is_active' => $isActive,
        ':description' => $description,
        ':updated_at' => jakartaIdeNow(),
    ]);

    respondIde(200, [
        'success' => true,
        'message' => 'Konfigurasi IDE berhasil disimpan.',
        'data' => [
            'config' => getIdeConfig($pdo),
        ],
    ]);
} catch (Throwable $error) {
    respondIde(500, [
        'success' => false,
        'message' => 'Gagal mengakses konfigurasi IDE.',
        'data' => [
            'detail' => $error->getMessage(),
        ],
    ]);
}
