<?php
declare(strict_types=1);

/**
 * Arduflow Workshop API
 *
 * GET  /api/workshops.php
 *      Mengambil data workshop dari SQLite.
 *
 * GET  /api/workshops.php?id=1
 *      Mengambil satu workshop berdasarkan ID.
 *
 * POST /api/workshops.php
 *      Menerima JSON dari AdminTambahWorkshop.jsx,
 *      memvalidasi, lalu menyimpan seluruh payload ke SQLite.
 */

date_default_timezone_set('Asia/Jakarta');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$projectRoot = dirname(__DIR__);
$imageStoragePath = $projectRoot . '/api/support/image-storage.php';

if (file_exists($imageStoragePath)) {
    require_once $imageStoragePath;
}

$workshopImageStorage = function_exists('ensureUploadStorage')
    ? ensureUploadStorage($projectRoot, 'workshops')
    : null;

function respond(int $statusCode, array $body): never
{
    http_response_code($statusCode);

    echo json_encode(
        $body,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES |
        JSON_PRETTY_PRINT
    );

    exit;
}

function getNestedValue(array $data, string $path)
{
    $segments = explode('.', $path);
    $value = $data;

    foreach ($segments as $segment) {
        if (!is_array($value) || !array_key_exists($segment, $value)) {
            return null;
        }

        $value = $value[$segment];
    }

    return $value;
}

function isEmptyRequiredValue($value): bool
{
    if ($value === null) {
        return true;
    }

    if (is_string($value)) {
        return trim($value) === '';
    }

    if (is_array($value)) {
        return count($value) === 0;
    }

    return false;
}

function textLength(string $value): int
{
    return function_exists('mb_strlen')
        ? mb_strlen($value)
        : strlen($value);
}

function validDateYmd(string $date): bool
{
    $parsed = DateTime::createFromFormat('Y-m-d', $date);

    return $parsed !== false &&
        $parsed->format('Y-m-d') === $date;
}

function getRequestId(): int
{
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if ($id <= 0) {
        respond(400, [
            'success' => false,
            'message' => 'Parameter id workshop wajib dan harus berupa angka lebih dari 0.',
        ]);
    }

    return $id;
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

    if (strlen($rawBody) > 2 * 1024 * 1024) {
        respond(413, [
            'success' => false,
            'message' => 'Payload JSON terlalu besar. Maksimal 2 MB.',
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

function decodeWorkshopRow(array $row): array
{
    $payload = json_decode(
        (string) ($row['payload_json'] ?? ''),
        true
    );

    if (!is_array($payload)) {
        $payload = [];
    }

    return [
        'id' => (int) $row['id'],
        'title' => $row['title'],
        'slug' => $row['slug'],
        'status' => $row['status'],
        'category' => $row['category'],
        'coverImage' => [
            'file_name' => $row['cover_image_name'] ?? null,
            'file_type' => $row['cover_image_type'] ?? null,
            'file_size' => isset($row['cover_image_size']) ? (int) $row['cover_image_size'] : null,
            'file_path' => $row['cover_image_path'] ?? null,
            'file_url' => $row['cover_image_url'] ?? null,
        ],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
        'payload' => $payload,
    ];
}

function validateWorkshop(array $data): array
{
    $requiredFields = [
        'title' => 'Judul Workshop',
        'slug' => 'Slug',
        'summary' => 'Deskripsi Singkat',
        'level' => 'Level',
        'duration' => 'Durasi',
        'platform' => 'Platform / Tempat',
        'category' => 'Kategori',
        'type' => 'Tipe Workshop',
        'schedule.date' => 'Tanggal',
        'schedule.time' => 'Waktu',
        'location' => 'Lokasi',
        'price' => 'Harga',
        'about' => 'Tentang Workshop',
        'media.coverImage' => 'Gambar Sampul',
    ];
    $errors = [];

    foreach ($requiredFields as $path => $label) {
        $value = getNestedValue($data, $path);

        if (isEmptyRequiredValue($value)) {
            $errors[$path] = $label . ' wajib diisi.';
        }
    }

    if (isset($data['title']) && is_string($data['title']) && textLength(trim($data['title'])) > 200) {
        $errors['title'] = 'Judul Workshop maksimal 200 karakter.';
    }

    if (isset($data['slug']) && is_string($data['slug'])) {
        $slug = trim($data['slug']);

        if ($slug !== '' && !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug)) {
            $errors['slug'] = 'Slug hanya boleh berisi huruf kecil, angka, dan tanda "-".';
        }

        if (textLength($slug) > 220) {
            $errors['slug'] = 'Slug maksimal 220 karakter.';
        }
    }

    if (isset($data['summary']) && is_string($data['summary']) && textLength($data['summary']) > 150) {
        $errors['summary'] = 'Deskripsi Singkat maksimal 150 karakter.';
    }

    $allowedLevels = ['Pemula', 'Menengah', 'Lanjutan'];
    if (isset($data['level']) && !in_array($data['level'], $allowedLevels, true)) {
        $errors['level'] = 'Level tidak valid.';
    }

    $allowedCategories = ['Arduino', 'IoT', 'Visual Programming', 'Sekolah'];
    if (isset($data['category']) && !in_array($data['category'], $allowedCategories, true)) {
        $errors['category'] = 'Kategori tidak valid.';
    }

    $allowedTypes = ['Online', 'Offline', 'Hybrid'];
    if (isset($data['type']) && !in_array($data['type'], $allowedTypes, true)) {
        $errors['type'] = 'Tipe Workshop tidak valid.';
    }

    $date = getNestedValue($data, 'schedule.date');
    if (is_string($date) && trim($date) !== '' && !validDateYmd($date)) {
        $errors['schedule.date'] = 'Tanggal harus menggunakan format YYYY-MM-DD.';
    }

    $timezone = getNestedValue($data, 'schedule.timezone');
    $allowedTimezones = ['WIB (GMT+7)', 'WITA (GMT+8)', 'WIT (GMT+9)'];
    if ($timezone !== null && !in_array($timezone, $allowedTimezones, true)) {
        $errors['schedule.timezone'] = 'Zona waktu tidak valid.';
    }

    if (isset($data['price'])) {
        $price = trim((string) $data['price']);

        if ($price !== '' && !preg_match('/^\d+$/', $price)) {
            $errors['price'] = 'Harga harus berupa angka tanpa pemisah ribuan.';
        }
    }

    $status = getNestedValue($data, 'publication.status');
    $allowedStatuses = ['Draft', 'Terjadwal', 'Terbit', 'Selesai'];
    if ($status !== null && !in_array($status, $allowedStatuses, true)) {
        $errors['publication.status'] = 'Status publikasi tidak valid.';
    }

    $visibility = getNestedValue($data, 'publication.visibility');
    $allowedVisibilities = ['Publik', 'Privat'];
    if ($visibility !== null && !in_array($visibility, $allowedVisibilities, true)) {
        $errors['publication.visibility'] = 'Visibilitas tidak valid.';
    }

    $homepageVisible = getNestedValue($data, 'publication.homepageVisible');
    if ($homepageVisible !== null && !is_bool($homepageVisible)) {
        $errors['publication.homepageVisible'] = 'homepageVisible harus boolean true/false.';
    }

    $coverImage = getNestedValue($data, 'media.coverImage');
    if ($coverImage !== null && !is_array($coverImage)) {
        $errors['media.coverImage'] = 'Gambar Sampul harus berupa object metadata file.';
    }

    if (is_array($coverImage)) {
        if (empty($coverImage['name']) || !is_string($coverImage['name'])) {
            $errors['media.coverImage.name'] = 'Nama file gambar sampul wajib tersedia.';
        }

        if (isset($coverImage['size']) && !is_numeric($coverImage['size'])) {
            $errors['media.coverImage.size'] = 'Ukuran file gambar sampul harus berupa angka.';
        }

        if (
            isset($coverImage['type']) &&
            is_string($coverImage['type']) &&
            strpos($coverImage['type'], 'image/') !== 0
        ) {
            $errors['media.coverImage.type'] = 'Tipe Gambar Sampul harus berupa image/*.';
        }
    }

    $gallery = getNestedValue($data, 'media.gallery');
    if ($gallery !== null && !is_array($gallery)) {
        $errors['media.gallery'] = 'Galeri harus berupa array.';
    }

    $module = getNestedValue($data, 'attachment.module');
    if ($module !== null && !is_array($module)) {
        $errors['attachment.module'] = 'Lampiran modul harus berupa object metadata file atau null.';
    }

    $metaDescription = getNestedValue($data, 'seo.metaDescription');
    if (is_string($metaDescription) && textLength($metaDescription) > 160) {
        $errors['seo.metaDescription'] = 'Meta Description maksimal 160 karakter.';
    }

    return $errors;
}

function isDatabaseLocked(Throwable $exception): bool
{
    return stripos($exception->getMessage(), 'database is locked') !== false ||
        stripos($exception->getMessage(), 'database table is locked') !== false;
}

function writeWithRetry(PDO $pdo, callable $callback, int $maxAttempts = 5)
{
    for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
        try {
            return $callback();
        } catch (PDOException $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            if (isDatabaseLocked($exception) && $attempt < $maxAttempts) {
                usleep(250000 * $attempt);
                continue;
            }

            throw $exception;
        } catch (Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $exception;
        }
    }

    throw new RuntimeException('Operasi database gagal setelah beberapa percobaan.');
}

function handleImageUpload(): never
{
    if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
        respond(400, [
            'success' => false,
            'message' => 'File gambar tidak ditemukan. Gunakan field multipart bernama image.',
        ]);
    }

    $file = $_FILES['image'];
    $errorCode = isset($file['error']) ? (int) $file['error'] : UPLOAD_ERR_NO_FILE;

    if ($errorCode !== UPLOAD_ERR_OK) {
        $uploadMessages = [
            UPLOAD_ERR_INI_SIZE => 'Ukuran file melebihi upload_max_filesize PHP.',
            UPLOAD_ERR_FORM_SIZE => 'Ukuran file melebihi batas form.',
            UPLOAD_ERR_PARTIAL => 'File hanya terupload sebagian.',
            UPLOAD_ERR_NO_FILE => 'Tidak ada file yang dipilih.',
            UPLOAD_ERR_NO_TMP_DIR => 'Folder temporary PHP tidak tersedia.',
            UPLOAD_ERR_CANT_WRITE => 'PHP gagal menulis file ke disk.',
            UPLOAD_ERR_EXTENSION => 'Upload dihentikan oleh ekstensi PHP.',
        ];

        respond(400, [
            'success' => false,
            'message' => $uploadMessages[$errorCode] ?? 'Upload gambar gagal.',
            'errorCode' => $errorCode,
        ]);
    }

    $tmpName = (string) ($file['tmp_name'] ?? '');
    $originalName = basename((string) ($file['name'] ?? 'image'));
    $fileSize = (int) ($file['size'] ?? 0);

    if ($tmpName === '' || !is_uploaded_file($tmpName)) {
        respond(400, [
            'success' => false,
            'message' => 'Temporary file upload tidak valid.',
        ]);
    }

    if ($fileSize <= 0) {
        respond(400, [
            'success' => false,
            'message' => 'Ukuran file gambar tidak valid.',
        ]);
    }

    if ($fileSize > 5 * 1024 * 1024) {
        respond(413, [
            'success' => false,
            'message' => 'Ukuran gambar maksimal 5 MB.',
        ]);
    }

    if (!class_exists('finfo')) {
        respond(500, [
            'success' => false,
            'message' => 'Ekstensi PHP fileinfo belum aktif.',
        ]);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = (string) $finfo->file($tmpName);
    $allowedTypes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    if (!isset($allowedTypes[$mimeType])) {
        respond(415, [
            'success' => false,
            'message' => 'Format gambar harus JPG, JPEG, PNG, WEBP, atau GIF.',
            'detectedType' => $mimeType,
        ]);
    }

    $projectRoot = dirname(__DIR__);
    $storage = function_exists('ensureUploadStorage')
        ? ensureUploadStorage($projectRoot, 'workshops')
        : [
            'path' => $projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'workshops',
            'url' => '/uploads/workshops',
        ];

    if (!is_dir($storage['path']) && !mkdir($storage['path'], 0775, true) && !is_dir($storage['path'])) {
        respond(500, [
            'success' => false,
            'message' => 'Folder upload workshop gagal dibuat.',
            'directory' => $storage['path'],
        ]);
    }

    $extension = $allowedTypes[$mimeType];

    try {
        $randomPart = bin2hex(random_bytes(6));
    } catch (Throwable) {
        $randomPart = str_replace('.', '', uniqid('', true));
    }

    $storedName = sprintf(
        'workshop-%s-%s.%s',
        date('YmdHis'),
        $randomPart,
        $extension
    );
    $destination = $storage['path'] . DIRECTORY_SEPARATOR . $storedName;

    if (!move_uploaded_file($tmpName, $destination)) {
        respond(500, [
            'success' => false,
            'message' => 'Gambar gagal disimpan ke folder upload workshop.',
            'destination' => $destination,
        ]);
    }

    $relativeUrl = rtrim((string) $storage['url'], '/') . '/' . rawurlencode($storedName);

    respond(201, [
        'success' => true,
        'message' => 'Gambar berhasil diupload.',
        'data' => [
            'name' => $storedName,
            'file_name' => $storedName,
            'originalName' => $originalName,
            'type' => $mimeType,
            'file_type' => $mimeType,
            'size' => $fileSize,
            'file_size' => $fileSize,
            'sizeKB' => round($fileSize / 1024, 2),
            'path' => $destination,
            'file_path' => $destination,
            'url' => $relativeUrl,
            'file_url' => $relativeUrl,
            'relativeUrl' => $relativeUrl,
            'uploadedAt' => date('Y-m-d H:i:s'),
        ],
    ]);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? trim((string) $_GET['action']) : '';

if ($action === 'upload-image') {
    if ($method !== 'POST') {
        header('Allow: POST, OPTIONS');

        respond(405, [
            'success' => false,
            'message' => 'Upload gambar hanya menerima method POST.',
        ]);
    }

    handleImageUpload();
}

if ($action !== '') {
    respond(400, [
        'success' => false,
        'message' => 'Action API tidak dikenal.',
        'action' => $action,
    ]);
}

/* =========================================================
 * PROJECT PATH & DATABASE CONFIG
 * =========================================================
 *
 * File endpoint:
 * website/API/api/workshops.php
 *
 * Project root:
 * website/API
 *
 * Database config:
 * website/API/config/database.php
 */

$projectRoot = dirname(__DIR__);
$configPath = $projectRoot . '/config/database.php';

if (!file_exists($configPath)) {
    respond(500, [
        'success' => false,
        'message' => 'Konfigurasi database tidak ditemukan.',
        'debug' => [
            'configPath' => $configPath,
        ],
    ]);
}

$databaseConfig = require $configPath;
$sqliteConfig = $databaseConfig['sqlite'] ?? null;

if (!is_array($sqliteConfig)) {
    respond(500, [
        'success' => false,
        'message' => 'Konfigurasi SQLite tidak ditemukan di config/database.php.',
    ]);
}

$databaseFile = trim(
    (string) ($sqliteConfig['path'] ?? '')
);

$busyTimeout = (int) (
    $sqliteConfig['busy_timeout_ms'] ?? 15000
);

if ($databaseFile === '') {
    respond(500, [
        'success' => false,
        'message' => 'Path database SQLite belum dikonfigurasi.',
    ]);
}

$isWindowsAbsolutePath = preg_match(
    '/^[A-Za-z]:[\\\\\/]/',
    $databaseFile
) === 1;

$isUnixAbsolutePath = str_starts_with(
    $databaseFile,
    '/'
);

if (
    !$isWindowsAbsolutePath &&
    !$isUnixAbsolutePath
) {
    $databaseFile =
        $projectRoot .
        DIRECTORY_SEPARATOR .
        str_replace(
            ['/', '\\'],
            DIRECTORY_SEPARATOR,
            $databaseFile
        );
}

$databaseDirectory = dirname($databaseFile);

if (
    !is_dir($databaseDirectory) &&
    !mkdir($databaseDirectory, 0775, true) &&
    !is_dir($databaseDirectory)
) {
    respond(500, [
        'success' => false,
        'message' => 'Folder database tidak dapat dibuat.',
        'debug' => [
            'databaseDirectory' => $databaseDirectory,
        ],
    ]);
}

/* =========================================================
 * SQLITE CONNECTION
 * ========================================================= */

try {
    $pdo = new PDO(
        'sqlite:' . $databaseFile,
        null,
        null,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA synchronous = NORMAL');
    $pdo->exec(
        'PRAGMA busy_timeout = ' .
        max(15000, $busyTimeout)
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS workshops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            status TEXT,
            category TEXT,
            cover_image_name TEXT,
            cover_image_type TEXT,
            cover_image_size INTEGER,
            cover_image_path TEXT,
            cover_image_url TEXT,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );

    if (function_exists('addColumnIfMissing')) {
        addColumnIfMissing($pdo, 'workshops', 'cover_image_name', 'TEXT');
        addColumnIfMissing($pdo, 'workshops', 'cover_image_type', 'TEXT');
        addColumnIfMissing($pdo, 'workshops', 'cover_image_size', 'INTEGER');
        addColumnIfMissing($pdo, 'workshops', 'cover_image_path', 'TEXT');
        addColumnIfMissing($pdo, 'workshops', 'cover_image_url', 'TEXT');
    }

    $pdo->exec(
        'CREATE INDEX IF NOT EXISTS idx_workshops_status
         ON workshops(status)'
    );

    $pdo->exec(
        'CREATE INDEX IF NOT EXISTS idx_workshops_category
         ON workshops(category)'
    );
} catch (Throwable $exception) {
    error_log(
        '[Workshop API SQLite Connection] ' .
        $exception->getMessage()
    );

    respond(500, [
        'success' => false,
        'message' => 'Gagal terhubung ke database SQLite.',
        'debug' => [
            'error' => $exception->getMessage(),
            'databaseFile' => $databaseFile,
            'configPath' => $configPath,
        ],
    ]);
}

/* =========================================================
 * GET - AMBIL DATA WORKSHOP
 * ========================================================= */

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $id = isset($_GET['id'])
            ? (int) $_GET['id']
            : 0;

        if ($id > 0) {
            $statement = $pdo->prepare(
                'SELECT
                    id,
                    title,
                    slug,
                    status,
                    category,
                    cover_image_name,
                    cover_image_type,
                    cover_image_size,
                    cover_image_path,
                    cover_image_url,
                    payload_json,
                    created_at,
                    updated_at
                 FROM workshops
                 WHERE id = :id
                 LIMIT 1'
            );

            $statement->execute([
                ':id' => $id,
            ]);

            $row = $statement->fetch();

            if (!$row) {
                respond(404, [
                    'success' => false,
                    'message' => 'Workshop tidak ditemukan.',
                ]);
            }

            respond(200, [
                'success' => true,
                'message' => 'Detail workshop berhasil diambil.',
                'data' => [
                    'workshop' => decodeWorkshopRow($row),
                ],
            ]);
        }

        $statement = $pdo->query(
            'SELECT
                id,
                title,
                slug,
                status,
                category,
                cover_image_name,
                cover_image_type,
                cover_image_size,
                cover_image_path,
                cover_image_url,
                payload_json,
                created_at,
                updated_at
             FROM workshops
             ORDER BY id DESC'
        );

        $rows = $statement->fetchAll();

        $workshops = array_map(
            'decodeWorkshopRow',
            $rows
        );

        respond(200, [
            'success' => true,
            'message' => 'Data workshop berhasil diambil dari SQLite.',
            'data' => [
                'workshops' => $workshops,
                'total' => count($workshops),
            ],
        ]);
    } catch (Throwable $exception) {
        error_log(
            '[Workshop API GET Error] ' .
            $exception->getMessage()
        );

        respond(500, [
            'success' => false,
            'message' => 'Gagal mengambil data workshop dari SQLite.',
            'debug' => [
                'error' => $exception->getMessage(),
            ],
        ]);
    }
}

/* =========================================================
 * DELETE - HAPUS DATA WORKSHOP
 * ========================================================= */

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'DELETE') {
    $id = getRequestId();

    try {
        $check = $pdo->prepare('SELECT id, title FROM workshops WHERE id = :id LIMIT 1');
        $check->execute([':id' => $id]);
        $existing = $check->fetch();

        if (!$existing) {
            respond(404, [
                'success' => false,
                'message' => 'Workshop tidak ditemukan.',
            ]);
        }

        writeWithRetry($pdo, function () use ($pdo, $id): void {
            $pdo->beginTransaction();

            $statement = $pdo->prepare('DELETE FROM workshops WHERE id = :id');
            $statement->execute([':id' => $id]);

            $pdo->commit();
        });

        respond(200, [
            'success' => true,
            'message' => 'Workshop berhasil dihapus dari SQLite.',
            'data' => [
                'id' => $id,
                'title' => $existing['title'],
            ],
        ]);
    } catch (Throwable $exception) {
        error_log('[Workshop API DELETE Error] ' . $exception->getMessage());

        respond(500, [
            'success' => false,
            'message' => 'Terjadi kesalahan saat menghapus workshop dari SQLite.',
            'debug' => [
                'error' => $exception->getMessage(),
            ],
        ]);
    }
}

/* =========================================================
 * POST / PUT - SIMPAN DAN UPDATE DATA WORKSHOP
 * ========================================================= */

if (!in_array($method, ['POST', 'PUT'], true)) {
    header('Allow: GET, POST, PUT, DELETE, OPTIONS');

    respond(405, [
        'success' => false,
        'message' => 'Method tidak diizinkan. Gunakan GET, POST, PUT, atau DELETE.',
    ]);
}

$data = readJsonBody();
$errors = validateWorkshop($data);

if (!empty($errors)) {
    respond(422, [
        'success' => false,
        'message' => 'Validasi gagal. Masih ada data yang belum benar.',
        'errors' => $errors,
        'received' => $data,
    ]);
}

$title = trim((string) $data['title']);
$slug = trim((string) $data['slug']);
$statusValue = (string) (getNestedValue($data, 'publication.status') ?? 'Draft');
$category = (string) ($data['category'] ?? '');
$coverImageData = getNestedValue($data, 'media.coverImage');
$coverImage = null;

if (is_array($coverImageData) && function_exists('normalizeStoredImage')) {
    $coverImage = normalizeStoredImage(
        $coverImageData,
        $GLOBALS['workshopImageStorage'] ?? [
            'path' => $projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'workshops',
            'url' => '/uploads/workshops',
        ],
        'workshop-cover'
    );

    if ($coverImage !== null) {
        $data['media']['coverImage'] = $coverImage;
    }
}

$payloadJson = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

if ($payloadJson === false) {
    respond(500, [
        'success' => false,
        'message' => 'Payload gagal dikonversi menjadi JSON.',
    ]);
}

$now = date('Y-m-d H:i:s');

if ($method === 'POST') {
    try {
        $workshopId = writeWithRetry($pdo, function () use (
            $pdo,
            $title,
            $slug,
            $statusValue,
            $category,
            $coverImage,
            $payloadJson,
            $now
        ): int {
            $pdo->beginTransaction();

            $statement = $pdo->prepare(
                'INSERT INTO workshops (
                    title,
                    slug,
                    status,
                    category,
                    cover_image_name,
                    cover_image_type,
                    cover_image_size,
                    cover_image_path,
                    cover_image_url,
                    payload_json,
                    created_at,
                    updated_at
                ) VALUES (
                    :title,
                    :slug,
                    :status,
                    :category,
                    :cover_image_name,
                    :cover_image_type,
                    :cover_image_size,
                    :cover_image_path,
                    :cover_image_url,
                    :payload_json,
                    :created_at,
                    :updated_at
                )'
            );

            $statement->execute([
                ':title' => $title,
                ':slug' => $slug,
                ':status' => $statusValue,
                ':category' => $category,
                ':cover_image_name' => $coverImage['file_name'] ?? null,
                ':cover_image_type' => $coverImage['file_type'] ?? null,
                ':cover_image_size' => $coverImage['file_size'] ?? null,
                ':cover_image_path' => $coverImage['file_path'] ?? null,
                ':cover_image_url' => $coverImage['file_url'] ?? null,
                ':payload_json' => $payloadJson,
                ':created_at' => $now,
                ':updated_at' => $now,
            ]);

            $id = (int) $pdo->lastInsertId();
            $pdo->commit();

            return $id;
        });

        respond(201, [
            'success' => true,
            'message' => 'Workshop berhasil disimpan ke database SQLite.',
            'data' => [
                'id' => $workshopId,
                'title' => $title,
                'slug' => $slug,
                'status' => $statusValue,
                'category' => $category,
                'coverImage' => $coverImage,
                'createdAt' => $now,
                'updatedAt' => $now,
                'payload' => $data,
            ],
        ]);
    } catch (PDOException $exception) {
        if (
            (string) $exception->getCode() === '23000' ||
            stripos($exception->getMessage(), 'UNIQUE constraint failed') !== false
        ) {
            respond(409, [
                'success' => false,
                'message' => 'Slug workshop sudah digunakan.',
                'errors' => [
                    'slug' => 'Gunakan slug yang berbeda.',
                ],
            ]);
        }

        error_log('[Workshop API POST Error] ' . $exception->getMessage());

        respond(500, [
            'success' => false,
            'message' => 'Terjadi kesalahan saat menyimpan workshop ke SQLite.',
            'debug' => [
                'error' => $exception->getMessage(),
            ],
        ]);
    } catch (Throwable $exception) {
        error_log('[Workshop API POST Error] ' . $exception->getMessage());

        respond(500, [
            'success' => false,
            'message' => 'Terjadi kesalahan internal saat menyimpan workshop.',
            'debug' => [
                'error' => $exception->getMessage(),
            ],
        ]);
    }
}

$id = getRequestId();

try {
    $check = $pdo->prepare('SELECT id, created_at FROM workshops WHERE id = :id LIMIT 1');
    $check->execute([':id' => $id]);
    $existing = $check->fetch();

    if (!$existing) {
        respond(404, [
            'success' => false,
            'message' => 'Workshop yang akan diedit tidak ditemukan.',
        ]);
    }

    writeWithRetry($pdo, function () use (
        $pdo,
        $id,
        $title,
        $slug,
        $statusValue,
        $category,
        $coverImage,
        $payloadJson,
        $now
    ): void {
        $pdo->beginTransaction();

        $statement = $pdo->prepare(
            'UPDATE workshops
             SET
                title = :title,
                slug = :slug,
                status = :status,
                category = :category,
                cover_image_name = :cover_image_name,
                cover_image_type = :cover_image_type,
                cover_image_size = :cover_image_size,
                cover_image_path = :cover_image_path,
                cover_image_url = :cover_image_url,
                payload_json = :payload_json,
                updated_at = :updated_at
             WHERE id = :id'
        );

        $statement->execute([
            ':title' => $title,
            ':slug' => $slug,
            ':status' => $statusValue,
            ':category' => $category,
            ':cover_image_name' => $coverImage['file_name'] ?? null,
            ':cover_image_type' => $coverImage['file_type'] ?? null,
            ':cover_image_size' => $coverImage['file_size'] ?? null,
            ':cover_image_path' => $coverImage['file_path'] ?? null,
            ':cover_image_url' => $coverImage['file_url'] ?? null,
            ':payload_json' => $payloadJson,
            ':updated_at' => $now,
            ':id' => $id,
        ]);

        $pdo->commit();
    });

    respond(200, [
        'success' => true,
        'message' => 'Workshop berhasil diperbarui di SQLite.',
        'data' => [
            'id' => $id,
            'title' => $title,
            'slug' => $slug,
            'status' => $statusValue,
            'category' => $category,
            'coverImage' => $coverImage,
            'createdAt' => $existing['created_at'],
            'updatedAt' => $now,
            'payload' => $data,
        ],
    ]);
} catch (PDOException $exception) {
    if (
        (string) $exception->getCode() === '23000' ||
        stripos($exception->getMessage(), 'UNIQUE constraint failed') !== false
    ) {
        respond(409, [
            'success' => false,
            'message' => 'Slug workshop sudah digunakan oleh workshop lain.',
            'errors' => [
                'slug' => 'Gunakan slug yang berbeda.',
            ],
        ]);
    }

    error_log('[Workshop API PUT Error] ' . $exception->getMessage());

    respond(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan saat memperbarui workshop di SQLite.',
        'debug' => [
            'error' => $exception->getMessage(),
        ],
    ]);
} catch (Throwable $exception) {
    error_log('[Workshop API PUT Error] ' . $exception->getMessage());

    respond(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan internal saat memperbarui workshop.',
        'debug' => [
            'error' => $exception->getMessage(),
        ],
    ]);
}

/* =========================================================
 * METHOD CHECK UNTUK POST
 * ========================================================= */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: GET, POST, OPTIONS');

    respond(405, [
        'success' => false,
        'message' => 'Method tidak diizinkan. Gunakan GET atau POST.',
    ]);
}

/* =========================================================
 * POST CONTENT TYPE
 * ========================================================= */

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';

if (
    stripos(
        $contentType,
        'application/json'
    ) === false
) {
    respond(415, [
        'success' => false,
        'message' => 'Content-Type harus application/json.',
    ]);
}

/* =========================================================
 * BACA JSON
 * ========================================================= */

$rawBody = file_get_contents('php://input');

if (
    $rawBody === false ||
    trim($rawBody) === ''
) {
    respond(400, [
        'success' => false,
        'message' => 'Request body JSON kosong.',
    ]);
}

if (
    strlen($rawBody) >
    2 * 1024 * 1024
) {
    respond(413, [
        'success' => false,
        'message' => 'Payload JSON terlalu besar. Maksimal 2 MB.',
    ]);
}

$data = json_decode(
    $rawBody,
    true
);

if (
    !is_array($data) ||
    json_last_error() !== JSON_ERROR_NONE
) {
    respond(400, [
        'success' => false,
        'message' => 'JSON tidak valid.',
        'error' => json_last_error_msg(),
    ]);
}

/* =========================================================
 * VALIDASI WAJIB
 * ========================================================= */

$requiredFields = [
    'title' => 'Judul Workshop',
    'slug' => 'Slug',
    'summary' => 'Deskripsi Singkat',
    'level' => 'Level',
    'duration' => 'Durasi',
    'platform' => 'Platform / Tempat',
    'category' => 'Kategori',
    'type' => 'Tipe Workshop',
    'schedule.date' => 'Tanggal',
    'schedule.time' => 'Waktu',
    'location' => 'Lokasi',
    'price' => 'Harga',
    'about' => 'Tentang Workshop',
    'media.coverImage' => 'Gambar Sampul',
];

$errors = [];

foreach (
    $requiredFields as
    $path => $label
) {
    $value = getNestedValue(
        $data,
        $path
    );

    if (
        isEmptyRequiredValue($value)
    ) {
        $errors[$path] =
            $label .
            ' wajib diisi.';
    }
}

/* =========================================================
 * VALIDASI FORMAT
 * ========================================================= */

if (
    isset($data['title']) &&
    is_string($data['title']) &&
    mb_strlen(trim($data['title'])) > 200
) {
    $errors['title'] =
        'Judul Workshop maksimal 200 karakter.';
}

if (
    isset($data['slug']) &&
    is_string($data['slug'])
) {
    $slug = trim(
        $data['slug']
    );

    if (
        $slug !== '' &&
        !preg_match(
            '/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
            $slug
        )
    ) {
        $errors['slug'] =
            'Slug hanya boleh berisi huruf kecil, angka, dan tanda "-".';
    }

    if (
        mb_strlen($slug) > 220
    ) {
        $errors['slug'] =
            'Slug maksimal 220 karakter.';
    }
}

if (
    isset($data['summary']) &&
    is_string($data['summary']) &&
    mb_strlen($data['summary']) > 150
) {
    $errors['summary'] =
        'Deskripsi Singkat maksimal 150 karakter.';
}

$allowedLevels = [
    'Pemula',
    'Menengah',
    'Lanjutan',
];

if (
    isset($data['level']) &&
    !in_array(
        $data['level'],
        $allowedLevels,
        true
    )
) {
    $errors['level'] =
        'Level tidak valid.';
}

$allowedCategories = [
    'Arduino',
    'IoT',
    'Visual Programming',
    'Sekolah',
];

if (
    isset($data['category']) &&
    !in_array(
        $data['category'],
        $allowedCategories,
        true
    )
) {
    $errors['category'] =
        'Kategori tidak valid.';
}

$allowedTypes = [
    'Online',
    'Offline',
    'Hybrid',
];

if (
    isset($data['type']) &&
    !in_array(
        $data['type'],
        $allowedTypes,
        true
    )
) {
    $errors['type'] =
        'Tipe Workshop tidak valid.';
}

$date = getNestedValue(
    $data,
    'schedule.date'
);

if (
    is_string($date) &&
    trim($date) !== '' &&
    !validDateYmd($date)
) {
    $errors['schedule.date'] =
        'Tanggal harus menggunakan format YYYY-MM-DD.';
}

$timezone = getNestedValue(
    $data,
    'schedule.timezone'
);

$allowedTimezones = [
    'WIB (GMT+7)',
    'WITA (GMT+8)',
    'WIT (GMT+9)',
];

if (
    $timezone !== null &&
    !in_array(
        $timezone,
        $allowedTimezones,
        true
    )
) {
    $errors['schedule.timezone'] =
        'Zona waktu tidak valid.';
}

if (
    isset($data['price'])
) {
    $price = trim(
        (string) $data['price']
    );

    if (
        $price !== '' &&
        !preg_match(
            '/^\d+$/',
            $price
        )
    ) {
        $errors['price'] =
            'Harga harus berupa angka tanpa pemisah ribuan.';
    }
}

$status = getNestedValue(
    $data,
    'publication.status'
);

$allowedStatuses = [
    'Draft',
    'Terjadwal',
    'Terbit',
    'Selesai',
];

if (
    $status !== null &&
    !in_array(
        $status,
        $allowedStatuses,
        true
    )
) {
    $errors['publication.status'] =
        'Status publikasi tidak valid.';
}

$visibility = getNestedValue(
    $data,
    'publication.visibility'
);

$allowedVisibilities = [
    'Publik',
    'Privat',
];

if (
    $visibility !== null &&
    !in_array(
        $visibility,
        $allowedVisibilities,
        true
    )
) {
    $errors['publication.visibility'] =
        'Visibilitas tidak valid.';
}

$coverImage = getNestedValue(
    $data,
    'media.coverImage'
);

if (
    $coverImage !== null &&
    !is_array($coverImage)
) {
    $errors['media.coverImage'] =
        'Gambar Sampul harus berupa object metadata file.';
}

if (
    is_array($coverImage)
) {
    if (
        empty($coverImage['name']) ||
        !is_string($coverImage['name'])
    ) {
        $errors['media.coverImage.name'] =
            'Nama file gambar sampul wajib tersedia.';
    }

    if (
        isset($coverImage['size']) &&
        !is_numeric($coverImage['size'])
    ) {
        $errors['media.coverImage.size'] =
            'Ukuran file gambar sampul harus berupa angka.';
    }

    if (
        isset($coverImage['type']) &&
        is_string($coverImage['type']) &&
        strpos(
            $coverImage['type'],
            'image/'
        ) !== 0
    ) {
        $errors['media.coverImage.type'] =
            'Tipe Gambar Sampul harus berupa image/*.';
    }
}

if (!empty($errors)) {
    respond(422, [
        'success' => false,
        'message' => 'Validasi gagal. Masih ada data yang belum benar.',
        'errors' => $errors,
        'received' => $data,
    ]);
}

/* =========================================================
 * INSERT SQLITE
 * ========================================================= */

try {
    $title = trim(
        (string) $data['title']
    );

    $slug = trim(
        (string) $data['slug']
    );

    $statusValue =
        (string) (
            getNestedValue(
                $data,
                'publication.status'
            ) ?? 'Draft'
        );

    $category =
        (string) (
            $data['category'] ?? ''
        );

    $coverImageData = getNestedValue($data, 'media.coverImage');
    $coverImage = null;

    if (is_array($coverImageData) && function_exists('normalizeStoredImage')) {
        $coverImage = normalizeStoredImage(
            $coverImageData,
            $GLOBALS['workshopImageStorage'] ?? [
                'path' => $projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'workshops',
                'url' => '/uploads/workshops',
            ],
            'workshop-cover'
        );

        if ($coverImage !== null) {
            $data['media']['coverImage'] = $coverImage;
        }
    }

    $payloadJson = json_encode(
        $data,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

    if ($payloadJson === false) {
        throw new RuntimeException(
            'Payload gagal dikonversi menjadi JSON.'
        );
    }

    $now = date(
        'Y-m-d H:i:s'
    );

    $pdo->beginTransaction();

    $statement = $pdo->prepare(
        'INSERT INTO workshops (
            title,
            slug,
            status,
            category,
            cover_image_name,
            cover_image_type,
            cover_image_size,
            cover_image_path,
            cover_image_url,
            payload_json,
            created_at,
            updated_at
        ) VALUES (
            :title,
            :slug,
            :status,
            :category,
            :cover_image_name,
            :cover_image_type,
            :cover_image_size,
            :cover_image_path,
            :cover_image_url,
            :payload_json,
            :created_at,
            :updated_at
        )'
    );

    $statement->execute([
        ':title' => $title,
        ':slug' => $slug,
        ':status' => $statusValue,
        ':category' => $category,
        ':cover_image_name' => $coverImage['file_name'] ?? null,
        ':cover_image_type' => $coverImage['file_type'] ?? null,
        ':cover_image_size' => $coverImage['file_size'] ?? null,
        ':cover_image_path' => $coverImage['file_path'] ?? null,
        ':cover_image_url' => $coverImage['file_url'] ?? null,
        ':payload_json' => $payloadJson,
        ':created_at' => $now,
        ':updated_at' => $now,
    ]);

    $workshopId =
        (int) $pdo->lastInsertId();

    $pdo->commit();

    respond(201, [
        'success' => true,
        'message' => 'Workshop berhasil disimpan ke database SQLite.',
        'data' => [
            'id' => $workshopId,
            'title' => $title,
            'slug' => $slug,
            'status' => $statusValue,
            'category' => $category,
            'coverImage' => $coverImage,
            'createdAt' => $now,
            'database' => 'SQLite',
            'table' => 'workshops',
            'payload' => $data,
        ],
    ]);
} catch (PDOException $exception) {
    if (
        $pdo->inTransaction()
    ) {
        $pdo->rollBack();
    }

    if (
        (string) $exception->getCode() === '23000' ||
        strpos(
            $exception->getMessage(),
            'UNIQUE constraint failed'
        ) !== false
    ) {
        respond(409, [
            'success' => false,
            'message' => 'Slug workshop sudah digunakan.',
            'errors' => [
                'slug' => 'Gunakan slug yang berbeda.',
            ],
        ]);
    }

    error_log(
        '[Workshop API SQLite Error] ' .
        $exception->getMessage()
    );

    respond(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan saat menyimpan workshop ke SQLite.',
        'debug' => [
            'error' => $exception->getMessage(),
        ],
    ]);
} catch (Throwable $exception) {
    if (
        $pdo->inTransaction()
    ) {
        $pdo->rollBack();
    }

    error_log(
        '[Workshop API Error] ' .
        $exception->getMessage()
    );

    respond(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan internal pada API.',
        'debug' => [
            'error' => $exception->getMessage(),
        ],
    ]);
}
