<?php

declare(strict_types=1);

/**
 * Arduflow Certificate API - SQLite CRUD
 *
 * GET    /api/certificate-api.php
 * GET    /api/certificate-api.php?id=1
 * POST   /api/certificate-api.php
 * PUT    /api/certificate-api.php?id=1
 * DELETE /api/certificate-api.php?id=1
 * POST   /api/certificate-api.php?action=upload-certificate&id=1 (multipart/form-data)
 */

date_default_timezone_set('Asia/Jakarta');

const CERTIFICATE_API_VERSION = '2026-08-12-pathfix-v5';

header('Content-Type: application/json; charset=utf-8');
header('X-ArduFlow-Certificate-Version: ' . CERTIFICATE_API_VERSION);
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond(int $statusCode, array $body): never
{
    http_response_code($statusCode);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function readJsonBody(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'application/json') === false) {
        respond(415, [
            'success' => false,
            'message' => 'Content-Type harus application/json.',
        ]);
    }

    $rawBody = file_get_contents('php://input');

    if ($rawBody === false || trim($rawBody) === '') {
        respond(400, [
            'success' => false,
            'message' => 'Request body JSON kosong.',
        ]);
    }

    $data = json_decode($rawBody, true);

    if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) {
        respond(400, [
            'success' => false,
            'message' => 'JSON tidak valid.',
            'error' => json_last_error_msg(),
        ]);
    }

    return $data;
}

function getRequestId(): int
{
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if ($id <= 0) {
        respond(400, [
            'success' => false,
            'message' => 'Parameter id sertifikat wajib dan harus berupa angka lebih dari 0.',
        ]);
    }

    return $id;
}

function tableExists(PDO $pdo, string $table): bool
{
    $statement = $pdo->prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = :table LIMIT 1");
    $statement->execute([':table' => $table]);

    return (bool) $statement->fetchColumn();
}

function getColumnNames(PDO $pdo, string $table): array
{
    if (!tableExists($pdo, $table)) {
        return [];
    }

    $columns = [];
    $statement = $pdo->query('PRAGMA table_info(' . $table . ')');

    foreach ($statement->fetchAll() as $column) {
        $columns[] = (string) $column['name'];
    }

    return $columns;
}

function firstFilled(array $data, array $keys, string $fallback = ''): string
{
    foreach ($keys as $key) {
        if (array_key_exists($key, $data) && trim((string) $data[$key]) !== '') {
            return trim((string) $data[$key]);
        }
    }

    return $fallback;
}

function validDateOrNull($value): ?string
{
    if ($value === null || trim((string) $value) === '') {
        return null;
    }

    $date = trim((string) $value);
    $parsed = DateTime::createFromFormat('Y-m-d', $date);

    if ($parsed === false || $parsed->format('Y-m-d') !== $date) {
        respond(422, [
            'success' => false,
            'message' => 'Format tanggal harus YYYY-MM-DD.',
        ]);
    }

    return $date;
}

function generateCertificateNumber(): string
{
    try {
        $suffix = strtoupper(bin2hex(random_bytes(3)));
    } catch (Throwable $exception) {
        $suffix = strtoupper(substr(str_replace('.', '', uniqid('', true)), -6));
    }

    return 'AFW-CERT-' . date('Y') . '-' . $suffix;
}

function decodeCertificateRow(array $row): array
{
    $payload = json_decode((string) ($row['payload_json'] ?? ''), true);
    $file = json_decode((string) ($row['file_json'] ?? ''), true);

    if (!is_array($payload)) {
        $payload = [];
    }

    if (!is_array($file)) {
        $file = null;
    }

    return [
        'id' => (int) $row['id'],
        'userId' => isset($row['user_id']) && $row['user_id'] !== null ? (int) $row['user_id'] : null,
        'userName' => $row['user_name'],
        'email' => $row['email'],
        'workshopId' => $row['workshop_id'] !== null ? (int) $row['workshop_id'] : null,
        'workshopTitle' => $row['workshop_title'],
        'certificateTitle' => $row['certificate_title'],
        'type' => $row['certificate_type'],
        'completedAt' => $row['completed_at'],
        'issuedAt' => $row['issued_at'],
        'certificateNumber' => $row['certificate_number'],
        'status' => $row['status'],
        'downloads' => (int) $row['downloads'],
        'file' => $file,
        'payload' => $payload,
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}

function decodeWorkshopOption(array $row): array
{
    $payload = json_decode((string) ($row['payload_json'] ?? ''), true);

    if (!is_array($payload)) {
        $payload = [];
    }

    return [
        'id' => (int) $row['id'],
        'title' => $row['title'] ?: ($payload['title'] ?? 'Workshop tanpa judul'),
        'category' => $row['category'] ?: ($payload['category'] ?? 'Workshop'),
        'status' => $row['status'] ?: ($payload['publication']['status'] ?? null),
    ];
}

function getWorkshopTitleById(PDO $pdo, ?int $workshopId): ?string
{
    if (!$workshopId || !tableExists($pdo, 'workshops')) {
        return null;
    }

    $statement = $pdo->prepare('SELECT title, payload_json FROM workshops WHERE id = :id LIMIT 1');
    $statement->execute([':id' => $workshopId]);
    $row = $statement->fetch();

    if (!$row) {
        return null;
    }

    $payload = json_decode((string) ($row['payload_json'] ?? ''), true);

    return (string) ($row['title'] ?: ($payload['title'] ?? ''));
}

function validateCertificatePayload(array $data, PDO $pdo): array
{
    $userName = firstFilled($data, ['userName', 'user_name']);
    $userId = isset($data['userId']) && (int) $data['userId'] > 0
        ? (int) $data['userId']
        : (isset($data['user_id']) && (int) $data['user_id'] > 0 ? (int) $data['user_id'] : null);
    $email = firstFilled($data, ['email']);
    $workshopId = isset($data['workshopId']) && (int) $data['workshopId'] > 0
        ? (int) $data['workshopId']
        : (isset($data['workshop_id']) && (int) $data['workshop_id'] > 0 ? (int) $data['workshop_id'] : null);
    $workshopTitle = firstFilled($data, ['workshopTitle', 'workshop_title', 'programTitle'], '');

    if ($workshopTitle === '') {
        $workshopTitle = (string) (getWorkshopTitleById($pdo, $workshopId) ?? '');
    }

    $certificateTitle = firstFilled($data, ['certificateTitle', 'certificate_title'], '');

    if ($certificateTitle === '' && $workshopTitle !== '') {
        $certificateTitle = 'Sertifikat ' . $workshopTitle;
    }

    $type = firstFilled($data, ['type', 'certificate_type'], 'Workshop');
    $status = firstFilled($data, ['status'], 'Menunggu');
    $certificateNumber = firstFilled($data, ['certificateNumber', 'certificate_number'], generateCertificateNumber());
    $completedAt = validDateOrNull($data['completedAt'] ?? $data['completed_at'] ?? null);
    $issuedAt = validDateOrNull($data['issuedAt'] ?? $data['issued_at'] ?? null);

    $errors = [];

    if ($userName === '') {
        $errors['userName'] = 'Nama user wajib diisi.';
    }

    if ($email === '') {
        $email = 'peserta-' . strtolower(substr(md5($userName . microtime(true)), 0, 10)) . '@arduflow.local';
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Email user wajib valid.';
    }

    if ($workshopTitle === '') {
        $errors['workshopTitle'] = 'Workshop / program wajib dipilih atau diisi.';
    }

    if ($certificateTitle === '') {
        $errors['certificateTitle'] = 'Nama sertifikat wajib diisi.';
    }

    $allowedTypes = ['Workshop', 'Program', 'Course'];
    if (!in_array($type, $allowedTypes, true)) {
        $errors['type'] = 'Jenis sertifikat tidak valid.';
    }

    $allowedStatuses = ['Menunggu', 'Tersedia', 'Tidak Lulus', 'Error', 'Expired'];
    if (!in_array($status, $allowedStatuses, true)) {
        $errors['status'] = 'Status sertifikat tidak valid.';
    }

    if ($errors !== []) {
        respond(422, [
            'success' => false,
            'message' => 'Validasi sertifikat gagal.',
            'errors' => $errors,
        ]);
    }

    return [
        'user_name' => $userName,
        'user_id' => $userId,
        'email' => $email,
        'workshop_id' => $workshopId,
        'workshop_title' => $workshopTitle,
        'certificate_title' => $certificateTitle,
        'certificate_type' => $type,
        'completed_at' => $completedAt,
        'issued_at' => $issuedAt,
        'certificate_number' => $certificateNumber,
        'status' => $status,
        'payload_json' => json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ];
}

function handleCertificateUpload(PDO $pdo): void
{
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    $file = $_FILES['certificate'] ?? $_FILES['certificateFile'] ?? null;

    if (!is_array($file)) {
        respond(400, [
            'success' => false,
            'message' => 'File sertifikat wajib dikirim dengan field certificate.',
        ]);
    }

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        respond(400, [
            'success' => false,
            'message' => 'Upload sertifikat gagal.',
            'uploadError' => $file['error'] ?? null,
        ]);
    }

    $tmpName = (string) $file['tmp_name'];
    $originalName = basename((string) ($file['name'] ?? 'sertifikat'));
    $fileSize = (int) ($file['size'] ?? 0);

    if ($fileSize <= 0 || $fileSize > 10 * 1024 * 1024) {
        respond(413, [
            'success' => false,
            'message' => 'Ukuran file sertifikat maksimal 10 MB.',
        ]);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = (string) $finfo->file($tmpName);
    $allowedTypes = [
        'application/pdf' => 'pdf',
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    if (!isset($allowedTypes[$mimeType])) {
        respond(422, [
            'success' => false,
            'message' => 'Format sertifikat harus PDF, JPG, PNG, atau WEBP.',
            'detectedType' => $mimeType,
        ]);
    }

    $uploadDirectory = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'certificates';

    if (!is_dir($uploadDirectory)) {
        if (!mkdir($uploadDirectory, 0775, true) && !is_dir($uploadDirectory)) {
            respond(500, [
                'success' => false,
                'message' => 'Folder uploads/certificates gagal dibuat.',
                'directory' => $uploadDirectory,
            ]);
        }
    }

    try {
        $randomPart = bin2hex(random_bytes(6));
    } catch (Throwable $exception) {
        $randomPart = str_replace('.', '', uniqid('', true));
    }

    $storedName = sprintf('certificate-%s-%s.%s', date('YmdHis'), $randomPart, $allowedTypes[$mimeType]);
    $destination = $uploadDirectory . DIRECTORY_SEPARATOR . $storedName;

    if (!move_uploaded_file($tmpName, $destination)) {
        respond(500, [
            'success' => false,
            'message' => 'File sertifikat gagal disimpan ke folder uploads/certificates.',
            'destination' => $destination,
        ]);
    }

    $scheme = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off') ? 'https' : 'http';
    $host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');
    $scriptName = (string) ($_SERVER['SCRIPT_NAME'] ?? '');
    $basePath = preg_replace('#/api/[^/]+$#', '', $scriptName) ?: '';
    $relativeUrl = $basePath . '/uploads/certificates/' . rawurlencode($storedName);
    $fileUrl = sprintf('%s://%s%s', $scheme, $host, $relativeUrl);
    $metadata = [
        'name' => $storedName,
        'originalName' => $originalName,
        'type' => $mimeType,
        'size' => $fileSize,
        'sizeKB' => round($fileSize / 1024, 2),
        'url' => $fileUrl,
        'relativeUrl' => $relativeUrl,
        'uploadedAt' => date('Y-m-d H:i:s'),
    ];

    if ($id > 0) {
        $statement = $pdo->prepare(
            'UPDATE certificates
             SET file_json = :file_json,
                 status = CASE WHEN status IN ("Menunggu", "Error") THEN "Tersedia" ELSE status END,
                 issued_at = COALESCE(issued_at, :issued_at),
                 updated_at = :updated_at
             WHERE id = :id'
        );
        $statement->execute([
            ':file_json' => json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':issued_at' => date('Y-m-d'),
            ':updated_at' => date('Y-m-d H:i:s'),
            ':id' => $id,
        ]);
    }

    respond(201, [
        'success' => true,
        'message' => 'File sertifikat berhasil diupload.',
        'data' => [
            'file' => $metadata,
            'certificateId' => $id > 0 ? $id : null,
        ],
    ]);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? trim((string) $_GET['action']) : '';

/*
|--------------------------------------------------------------------------
| Database configuration
|--------------------------------------------------------------------------
| File API ini berada di: website/API/api/certificate-api.php
| Konfigurasi database berada di: website/API/config/database.php
*/
$configPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'database.php';

if (!is_file($configPath)) {
    respond(500, [
        'success' => false,
        'message' => 'File konfigurasi database tidak ditemukan.',
        'debug' => [
            'configPath' => $configPath,
        ],
    ]);
}

$config = require $configPath;

if (!is_array($config)) {
    respond(500, [
        'success' => false,
        'message' => 'Konfigurasi database tidak valid. database.php harus mengembalikan array konfigurasi.',
        'debug' => [
            'configPath' => $configPath,
        ],
    ]);
}

$databaseFile = (string) (
    $config['sqlite']['path']
    ?? $config['sqlite_path']
    ?? $config['database']['sqlite_path']
    ?? ''
);

if ($databaseFile === '') {
    respond(500, [
        'success' => false,
        'message' => 'Path database SQLite belum dikonfigurasi di database.php.',
        'debug' => [
            'configPath' => $configPath,
            'expectedKeys' => [
                'sqlite.path',
                'sqlite_path',
                'database.sqlite_path',
            ],
        ],
    ]);
}

// Normalisasi separator terlebih dahulu.
$databaseFile = trim($databaseFile);

// Deteksi path absolut tanpa regex agar aman di Windows.
$isWindowsDrivePath = strlen($databaseFile) >= 3
    && ctype_alpha($databaseFile[0])
    && $databaseFile[1] === ':'
    && ($databaseFile[2] === '\\' || $databaseFile[2] === '/');

$isWindowsUncPath = str_starts_with($databaseFile, '\\\\');
$isUnixAbsolutePath = str_starts_with($databaseFile, '/');
$isAbsolutePath = $isWindowsDrivePath || $isWindowsUncPath || $isUnixAbsolutePath;

$databaseFile = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $databaseFile);

if (!$isAbsolutePath) {
    $databaseFile = dirname(__DIR__)
        . DIRECTORY_SEPARATOR
        . ltrim($databaseFile, DIRECTORY_SEPARATOR);
}

// Rapikan segmen . dan .. agar path seperti config/../storage tidak bermasalah.
function normalizeFilesystemPath(string $path): string
{
    $path = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
    $prefix = '';

    if (strlen($path) >= 2 && ctype_alpha($path[0]) && $path[1] === ':') {
        $prefix = substr($path, 0, 2);
        $path = substr($path, 2);
    } elseif (str_starts_with($path, DIRECTORY_SEPARATOR . DIRECTORY_SEPARATOR)) {
        $prefix = DIRECTORY_SEPARATOR . DIRECTORY_SEPARATOR;
        $path = substr($path, 2);
    } elseif (str_starts_with($path, DIRECTORY_SEPARATOR)) {
        $prefix = DIRECTORY_SEPARATOR;
        $path = ltrim($path, DIRECTORY_SEPARATOR);
    }

    $parts = [];
    foreach (explode(DIRECTORY_SEPARATOR, $path) as $part) {
        if ($part === '' || $part === '.') {
            continue;
        }

        if ($part === '..') {
            if ($parts !== []) {
                array_pop($parts);
            }
            continue;
        }

        $parts[] = $part;
    }

    $joined = implode(DIRECTORY_SEPARATOR, $parts);

    if ($prefix !== '' && $prefix !== DIRECTORY_SEPARATOR && $prefix !== DIRECTORY_SEPARATOR . DIRECTORY_SEPARATOR) {
        return $prefix . DIRECTORY_SEPARATOR . $joined;
    }

    return $prefix . $joined;
}

$databaseFile = normalizeFilesystemPath($databaseFile);
$databaseDirectory = dirname($databaseFile);

if (!is_dir($databaseDirectory)) {
    if (!mkdir($databaseDirectory, 0775, true) && !is_dir($databaseDirectory)) {
        respond(500, [
            'success' => false,
            'message' => 'Folder database SQLite gagal dibuat.',
            'debug' => [
                'databaseDirectory' => $databaseDirectory,
            ],
        ]);
    }
}

try {
    $pdo = new PDO('sqlite:' . $databaseFile, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $busyTimeout = (int) (
        $config['sqlite']['busy_timeout_ms']
        ?? $config['busy_timeout_ms']
        ?? $config['database']['busy_timeout_ms']
        ?? 5000
    );

    if ($busyTimeout < 0) {
        $busyTimeout = 5000;
    }

    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA synchronous = NORMAL');
    $pdo->exec('PRAGMA busy_timeout = ' . $busyTimeout);

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NULL,
            user_name TEXT NOT NULL,
            email TEXT NOT NULL,
            workshop_id INTEGER NULL,
            workshop_title TEXT NOT NULL,
            certificate_title TEXT NOT NULL,
            certificate_type TEXT NOT NULL,
            completed_at TEXT NULL,
            issued_at TEXT NULL,
            certificate_number TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL,
            downloads INTEGER NOT NULL DEFAULT 0,
            file_json TEXT NULL,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );

    $certificateColumns = getColumnNames($pdo, 'certificates');
    if (!in_array('user_id', $certificateColumns, true)) {
        $pdo->exec('ALTER TABLE certificates ADD COLUMN user_id INTEGER NULL');
    }

    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_certificates_email ON certificates(email)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_certificates_workshop ON certificates(workshop_id)');
} catch (Throwable $exception) {
    respond(500, [
        'success' => false,
        'message' => 'Gagal terhubung ke database SQLite.',
        'debug' => [
            'error' => $exception->getMessage(),
            'databaseFile' => $databaseFile,
        ],
    ]);
}

if ($action === 'upload-certificate') {
    if ($method !== 'POST') {
        header('Allow: POST, OPTIONS');
        respond(405, [
            'success' => false,
            'message' => 'Upload sertifikat hanya menerima method POST.',
        ]);
    }

    handleCertificateUpload($pdo);
}

if ($method === 'GET') {
    try {
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

        if ($id > 0) {
            $statement = $pdo->prepare('SELECT * FROM certificates WHERE id = :id LIMIT 1');
            $statement->execute([':id' => $id]);
            $row = $statement->fetch();

            if (!$row) {
                respond(404, [
                    'success' => false,
                    'message' => 'Sertifikat tidak ditemukan.',
                ]);
            }

            respond(200, [
                'success' => true,
                'message' => 'Detail sertifikat berhasil diambil.',
                'data' => [
                    'certificate' => decodeCertificateRow($row),
                ],
            ]);
        }

        $certificateRows = $pdo
            ->query('SELECT * FROM certificates ORDER BY id DESC')
            ->fetchAll();
        $certificates = array_map('decodeCertificateRow', $certificateRows);
        $workshops = [];

        if (tableExists($pdo, 'workshops')) {
            $workshopRows = $pdo
                ->query('SELECT id, title, status, category, payload_json FROM workshops ORDER BY id DESC')
                ->fetchAll();
            $workshops = array_map('decodeWorkshopOption', $workshopRows);
        }

        respond(200, [
            'success' => true,
            'apiVersion' => CERTIFICATE_API_VERSION,
            'message' => 'Data sertifikat berhasil diambil dari SQLite.',
            'data' => [
                'certificates' => $certificates,
                'workshops' => $workshops,
                'options' => [
                    'workshops' => $workshops,
                ],
                'total' => count($certificates),
            ],
        ]);
    } catch (Throwable $exception) {
        respond(500, [
            'success' => false,
            'message' => 'Gagal mengambil data sertifikat.',
            'debug' => [
                'error' => $exception->getMessage(),
            ],
        ]);
    }
}

if ($method === 'POST') {
    $data = readJsonBody();
    $payload = validateCertificatePayload($data, $pdo);
    $now = date('Y-m-d H:i:s');

    try {
        $statement = $pdo->prepare(
            'INSERT INTO certificates (
                user_id, user_name, email, workshop_id, workshop_title, certificate_title, certificate_type,
                completed_at, issued_at, certificate_number, status, file_json, payload_json, created_at, updated_at
            ) VALUES (
                :user_id, :user_name, :email, :workshop_id, :workshop_title, :certificate_title, :certificate_type,
                :completed_at, :issued_at, :certificate_number, :status, NULL, :payload_json, :created_at, :updated_at
            )'
        );
        $statement->execute([
            ':user_id' => $payload['user_id'],
            ':user_name' => $payload['user_name'],
            ':email' => $payload['email'],
            ':workshop_id' => $payload['workshop_id'],
            ':workshop_title' => $payload['workshop_title'],
            ':certificate_title' => $payload['certificate_title'],
            ':certificate_type' => $payload['certificate_type'],
            ':completed_at' => $payload['completed_at'],
            ':issued_at' => $payload['issued_at'],
            ':certificate_number' => $payload['certificate_number'],
            ':status' => $payload['status'],
            ':payload_json' => $payload['payload_json'],
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $id = (int) $pdo->lastInsertId();
        $row = $pdo->query('SELECT * FROM certificates WHERE id = ' . $id)->fetch();

        respond(201, [
            'success' => true,
            'message' => 'Sertifikat berhasil dibuat.',
            'data' => [
                'certificate' => decodeCertificateRow($row),
            ],
        ]);
    } catch (Throwable $exception) {
        respond(500, [
            'success' => false,
            'message' => 'Sertifikat gagal dibuat.',
            'debug' => [
                'error' => $exception->getMessage(),
            ],
        ]);
    }
}

if ($method === 'PUT') {
    $id = getRequestId();
    $data = readJsonBody();
    $payload = validateCertificatePayload($data, $pdo);
    $now = date('Y-m-d H:i:s');

    try {
        $statement = $pdo->prepare(
            'UPDATE certificates
             SET user_id = :user_id,
                 user_name = :user_name,
                 email = :email,
                 workshop_id = :workshop_id,
                 workshop_title = :workshop_title,
                 certificate_title = :certificate_title,
                 certificate_type = :certificate_type,
                 completed_at = :completed_at,
                 issued_at = :issued_at,
                 certificate_number = :certificate_number,
                 status = :status,
                 payload_json = :payload_json,
                 updated_at = :updated_at
             WHERE id = :id'
        );
        $statement->execute([
            ':user_id' => $payload['user_id'],
            ':user_name' => $payload['user_name'],
            ':email' => $payload['email'],
            ':workshop_id' => $payload['workshop_id'],
            ':workshop_title' => $payload['workshop_title'],
            ':certificate_title' => $payload['certificate_title'],
            ':certificate_type' => $payload['certificate_type'],
            ':completed_at' => $payload['completed_at'],
            ':issued_at' => $payload['issued_at'],
            ':certificate_number' => $payload['certificate_number'],
            ':status' => $payload['status'],
            ':payload_json' => $payload['payload_json'],
            ':updated_at' => $now,
            ':id' => $id,
        ]);

        if ($statement->rowCount() === 0) {
            respond(404, [
                'success' => false,
                'message' => 'Sertifikat tidak ditemukan atau tidak ada perubahan.',
            ]);
        }

        $rowStatement = $pdo->prepare('SELECT * FROM certificates WHERE id = :id LIMIT 1');
        $rowStatement->execute([':id' => $id]);

        respond(200, [
            'success' => true,
            'message' => 'Sertifikat berhasil diperbarui.',
            'data' => [
                'certificate' => decodeCertificateRow($rowStatement->fetch()),
            ],
        ]);
    } catch (Throwable $exception) {
        respond(500, [
            'success' => false,
            'message' => 'Sertifikat gagal diperbarui.',
            'debug' => [
                'error' => $exception->getMessage(),
            ],
        ]);
    }
}

if ($method === 'DELETE') {
    $id = getRequestId();

    try {
        $statement = $pdo->prepare('DELETE FROM certificates WHERE id = :id');
        $statement->execute([':id' => $id]);

        if ($statement->rowCount() === 0) {
            respond(404, [
                'success' => false,
                'message' => 'Sertifikat tidak ditemukan.',
            ]);
        }

        respond(200, [
            'success' => true,
            'message' => 'Sertifikat berhasil dihapus.',
        ]);
    } catch (Throwable $exception) {
        respond(500, [
            'success' => false,
            'message' => 'Sertifikat gagal dihapus.',
            'debug' => [
                'error' => $exception->getMessage(),
            ],
        ]);
    }
}

header('Allow: GET, POST, PUT, DELETE, OPTIONS');
respond(405, [
    'success' => false,
    'message' => 'Method tidak didukung.',
]);
