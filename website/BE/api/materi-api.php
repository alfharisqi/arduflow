<?php

declare(strict_types=1);

const MATERI_API_VERSION = 'materi-v5-post';

header('Content-Type: application/json; charset=utf-8');
header('X-ArduFlow-Materi-API: ' . MATERI_API_VERSION);

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
];

$isLocalOrigin = preg_match(
    '#^http://(localhost|127\.0\.0\.1|192\.168\.[0-9]+\.[0-9]+|10\.[0-9]+\.[0-9]+\.[0-9]+|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]+\.[0-9]+):[0-9]+$#',
    $origin
) === 1;

if (in_array($origin, $allowedOrigins, true) || $isLocalOrigin) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (
    $_SERVER['REQUEST_METHOD'] === 'GET'
    && isset($_GET['action'])
    && $_GET['action'] === 'health'
) {
    echo json_encode(
        [
            'success' => true,
            'api' => 'materi-api.php',
            'version' => MATERI_API_VERSION,
            'supports' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        ],
        JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
    );
    exit;
}

/*
|--------------------------------------------------------------------------
| File image endpoint
|--------------------------------------------------------------------------
|
| URL contoh:
| /api/materi-api.php?action=image&scope=card&file=abc.jpg
| /api/materi-api.php?action=image&scope=slide&file=abc.jpg
|
| Image dilayani lewat endpoint PHP agar tidak bergantung pada konfigurasi
| static-file router.
|
*/
if (
    $_SERVER['REQUEST_METHOD'] === 'GET'
    && isset($_GET['action'])
    && $_GET['action'] === 'image'
) {
    serveStoredImage();
}

if (
    $_SERVER['REQUEST_METHOD'] === 'GET'
    && isset($_GET['action'])
    && $_GET['action'] === 'video'
) {
    serveStoredVideo();
}

require_once dirname(__DIR__) . '/config/database.php';

if (!function_exists('getDatabaseConnection')) {
    function getDatabaseConnection(): PDO
    {
        $config = require dirname(__DIR__) . '/config/database.php';

        if (!is_array($config) || !isset($config['sqlite'])) {
            throw new RuntimeException('Konfigurasi SQLite tidak ditemukan.');
        }

        $sqliteConfig = is_array($config['sqlite'])
            ? $config['sqlite']
            : [];

        $databasePath = trim((string) ($sqliteConfig['path'] ?? ''));

        if ($databasePath === '') {
            throw new RuntimeException('Path database SQLite belum dikonfigurasi.');
        }

        $databaseDirectory = dirname($databasePath);

        if (
            !is_dir($databaseDirectory)
            && !mkdir($databaseDirectory, 0775, true)
            && !is_dir($databaseDirectory)
        ) {
            throw new RuntimeException('Folder database SQLite tidak dapat dibuat.');
        }

        $database = new PDO(
            'sqlite:' . $databasePath,
            null,
            null,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );

        $database->exec('PRAGMA foreign_keys = ON');
        $database->exec('PRAGMA journal_mode = WAL');
        $database->exec('PRAGMA synchronous = NORMAL');
        $database->exec(
            'PRAGMA busy_timeout = '
            . max(15000, (int) ($sqliteConfig['busy_timeout_ms'] ?? 15000))
        );

        return $database;
    }
}

try {
    $database = getDatabaseConnection();
    createTables($database);

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            getAllMateri($database);
            break;

        case 'POST':
            if (isset($_GET['id'])) {
                updateMateri($database);
            } else {
                createMateri($database);
            }
            break;

        case 'PUT':
            updateMateri($database);
            break;

        case 'DELETE':
            deleteMateri($database);
            break;

        default:
            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Method tidak diizinkan.',
                ],
                405
            );
    }
} catch (Throwable $error) {
    sendJsonResponse(
        [
            'success' => false,
            'message' => 'Terjadi kesalahan pada server.',
            'error' => $error->getMessage(),
        ],
        500
    );
}

function createTables(PDO $database): void
{
    $database->exec(
        'CREATE TABLE IF NOT EXISTS tutorials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            category TEXT NOT NULL,
            display_order INTEGER NOT NULL DEFAULT 1,
            short_description TEXT NOT NULL,
            full_description TEXT NOT NULL,
            card_image_name TEXT,
            card_image_type TEXT,
            card_image_size INTEGER,
            difficulty_level TEXT,
            estimated_time TEXT,
            page_order INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT "draft",
            active INTEGER NOT NULL DEFAULT 1,
            show_on_page INTEGER NOT NULL DEFAULT 1,
            featured INTEGER NOT NULL DEFAULT 0,
            comments INTEGER NOT NULL DEFAULT 1,
            access_type TEXT,
            featured_order INTEGER,
            user_level TEXT NOT NULL DEFAULT "semua_pengguna",
            access_requirement TEXT,
            prerequisite TEXT,
            cta_text TEXT,
            cta_target_link TEXT,
            cta_url_slug TEXT,
            publish_schedule TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );

    $database->exec(
        'CREATE TABLE IF NOT EXISTS tutorial_chapters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tutorial_id INTEGER NOT NULL,
            chapter_order INTEGER NOT NULL DEFAULT 1,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (tutorial_id)
                REFERENCES tutorials(id)
                ON DELETE CASCADE
        )'
    );

    $database->exec(
        'CREATE TABLE IF NOT EXISTS tutorial_learning_objectives (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tutorial_id INTEGER NOT NULL,
            objective_order INTEGER NOT NULL DEFAULT 1,
            objective TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (tutorial_id)
                REFERENCES tutorials(id)
                ON DELETE CASCADE
        )'
    );

    $database->exec(
        'CREATE TABLE IF NOT EXISTS tutorial_slides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tutorial_id INTEGER NOT NULL,
            chapter_id INTEGER,
            slide_order INTEGER NOT NULL,
            title TEXT NOT NULL,
            content_type TEXT NOT NULL DEFAULT "text",
            content TEXT,
            code_title TEXT,
            code_language TEXT,
            code_content TEXT,
            allow_copy INTEGER NOT NULL DEFAULT 1,
            estimated_time TEXT,
            status TEXT NOT NULL DEFAULT "draft",
            image_name TEXT,
            image_type TEXT,
            image_size INTEGER,
            video_url TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (tutorial_id)
                REFERENCES tutorials(id)
                ON DELETE CASCADE,
            FOREIGN KEY (chapter_id)
                REFERENCES tutorial_chapters(id)
                ON DELETE SET NULL
        )'
    );

    /*
     * Migration otomatis untuk database SQLite lama.
     * ALTER TABLE hanya dijalankan jika kolom belum ada.
     * Data tutorial dan slide lama tetap dipertahankan.
     */
    ensureTableColumn(
        $database,
        'tutorials',
        'active',
        'INTEGER NOT NULL DEFAULT 1'
    );
    ensureTableColumn(
        $database,
        'tutorials',
        'show_on_page',
        'INTEGER NOT NULL DEFAULT 1'
    );
    ensureTableColumn(
        $database,
        'tutorials',
        'featured',
        'INTEGER NOT NULL DEFAULT 0'
    );
    ensureTableColumn(
        $database,
        'tutorials',
        'comments',
        'INTEGER NOT NULL DEFAULT 1'
    );
    ensureTableColumn($database, 'tutorials', 'access_type', 'TEXT');
    ensureTableColumn($database, 'tutorials', 'featured_order', 'INTEGER');
    ensureTableColumn($database, 'tutorials', 'prerequisite', 'TEXT');
    ensureTableColumn($database, 'tutorials', 'cta_text', 'TEXT');
    ensureTableColumn($database, 'tutorials', 'cta_target_link', 'TEXT');
    ensureTableColumn($database, 'tutorials', 'cta_url_slug', 'TEXT');
    ensureTableColumn($database, 'tutorials', 'publish_schedule', 'TEXT');

    ensureTableColumn($database, 'tutorial_slides', 'chapter_id', 'INTEGER');
    ensureTableColumn(
        $database,
        'tutorial_slides',
        'estimated_time',
        'TEXT'
    );
    ensureTableColumn(
        $database,
        'tutorial_slides',
        'status',
        'TEXT NOT NULL DEFAULT "draft"'
    );
    ensureTableColumn(
        $database,
        'tutorial_slides',
        'image_type',
        'TEXT'
    );
    ensureTableColumn(
        $database,
        'tutorial_slides',
        'image_size',
        'INTEGER'
    );
    ensureTableColumn($database, 'tutorial_slides', 'code_title', 'TEXT');
    ensureTableColumn($database, 'tutorial_slides', 'code_language', 'TEXT');
    ensureTableColumn($database, 'tutorial_slides', 'code_content', 'TEXT');
    ensureTableColumn(
        $database,
        'tutorial_slides',
        'allow_copy',
        'INTEGER NOT NULL DEFAULT 1'
    );

    $database->exec(
        'CREATE INDEX IF NOT EXISTS idx_tutorial_chapters_tutorial
         ON tutorial_chapters (tutorial_id, chapter_order)'
    );

    $database->exec(
        'CREATE INDEX IF NOT EXISTS idx_tutorial_objectives_tutorial
         ON tutorial_learning_objectives (tutorial_id, objective_order)'
    );

    $database->exec(
        'CREATE INDEX IF NOT EXISTS idx_tutorial_slides_chapter
         ON tutorial_slides (tutorial_id, chapter_id, slide_order)'
    );
}


function ensureTableColumn(
    PDO $database,
    string $tableName,
    string $columnName,
    string $definition
): void {
    $allowedTables = [
        'tutorials',
        'tutorial_slides',
        'tutorial_chapters',
        'tutorial_learning_objectives',
    ];

    if (!in_array($tableName, $allowedTables, true)) {
        throw new InvalidArgumentException('Nama tabel migration tidak valid.');
    }

    $columns = $database->query(
        'PRAGMA table_info(' . $tableName . ')'
    )->fetchAll();

    foreach ($columns as $column) {
        if (
            isset($column['name'])
            && (string) $column['name'] === $columnName
        ) {
            return;
        }
    }

    $database->exec(
        'ALTER TABLE '
        . $tableName
        . ' ADD COLUMN '
        . $columnName
        . ' '
        . $definition
    );
}

function booleanToInteger(mixed $value, int $default = 0): int
{
    if ($value === null) {
        return $default;
    }

    if (is_bool($value)) {
        return $value ? 1 : 0;
    }

    if (is_int($value)) {
        return $value === 0 ? 0 : 1;
    }

    $normalized = strtolower(trim((string) $value));

    return in_array(
        $normalized,
        ['1', 'true', 'yes', 'on'],
        true
    ) ? 1 : 0;
}


function getArticleUploadDirectory(): string
{
    /*
     * Path fisik gambar.
     *
     * materi-api.php berada di:
     * BE/api/materi-api.php
     *
     * sehingga dirname(__DIR__) = API
     */
    return dirname(__DIR__)
        . DIRECTORY_SEPARATOR
        . 'storage'
        . DIRECTORY_SEPARATOR
        . 'uploads'
        . DIRECTORY_SEPARATOR
        . 'articles';
}

function getArticleImagePath(?string $fileName): ?string
{
    if ($fileName === null || trim($fileName) === '') {
        return null;
    }

    return getArticleUploadDirectory()
        . DIRECTORY_SEPARATOR
        . basename($fileName);
}

function getArticleImageUrl(?string $fileName): ?string
{
    if ($fileName === null || trim($fileName) === '') {
        return null;
    }

    return getApiBaseUrl()
        . '/materi-api.php?action=image&scope=card&file='
        . rawurlencode(basename($fileName));
}


function getSlideUploadDirectory(): string
{
    return getArticleUploadDirectory()
        . DIRECTORY_SEPARATOR
        . 'slides';
}

function getSlideImagePath(?string $fileName): ?string
{
    if ($fileName === null || trim($fileName) === '') {
        return null;
    }

    $safeFileName = basename($fileName);

    /*
     * Lokasi baru.
     */
    $slidePath = getSlideUploadDirectory()
        . DIRECTORY_SEPARATOR
        . $safeFileName;

    if (is_file($slidePath)) {
        return $slidePath;
    }

    /*
     * Kompatibilitas data lama:
     * sebelumnya gambar slide pernah disimpan langsung di:
     * storage/uploads/articles/
     */
    $legacyPath = getArticleUploadDirectory()
        . DIRECTORY_SEPARATOR
        . $safeFileName;

    if (is_file($legacyPath)) {
        return $legacyPath;
    }

    /*
     * Tetap return lokasi baru untuk debug meskipun file belum ada.
     */
    return $slidePath;
}


function getSlideImageUrl(?string $fileName): ?string
{
    if ($fileName === null || trim($fileName) === '') {
        return null;
    }

    return getApiBaseUrl()
        . '/materi-api.php?action=image&scope=slide&file='
        . rawurlencode(basename($fileName));
}


function saveUploadedSlideImage(array $uploadedFile): array
{
    $uploadError = isset($uploadedFile['error'])
        ? (int) $uploadedFile['error']
        : UPLOAD_ERR_NO_FILE;

    if ($uploadError === UPLOAD_ERR_NO_FILE) {
        throw new RuntimeException('File gambar slide belum dipilih.');
    }

    if ($uploadError !== UPLOAD_ERR_OK) {
        throw new RuntimeException(
            'Upload gambar slide gagal. Kode error: ' . $uploadError
        );
    }

    $temporaryPath = isset($uploadedFile['tmp_name'])
        ? (string) $uploadedFile['tmp_name']
        : '';

    if (
        $temporaryPath === ''
        || !is_uploaded_file($temporaryPath)
    ) {
        throw new RuntimeException(
            'Temporary file gambar slide tidak valid.'
        );
    }

    $fileSize = isset($uploadedFile['size'])
        ? (int) $uploadedFile['size']
        : 0;

    $maxFileSize = 3 * 1024 * 1024;

    if ($fileSize <= 0) {
        throw new RuntimeException(
            'Ukuran gambar slide tidak valid.'
        );
    }

    if ($fileSize > $maxFileSize) {
        throw new RuntimeException(
            'Ukuran gambar slide maksimal 3 MB.'
        );
    }

    $originalName = isset($uploadedFile['name'])
        ? (string) $uploadedFile['name']
        : 'slide-image';

    $extension = strtolower(
        pathinfo($originalName, PATHINFO_EXTENSION)
    );

    $allowedExtensions = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'svg' => 'image/svg+xml',
    ];

    if (!isset($allowedExtensions[$extension])) {
        throw new RuntimeException(
            'Format gambar slide harus JPG, JPEG, PNG, WEBP, atau SVG.'
        );
    }

    $uploadDirectory = getSlideUploadDirectory();

    if (
        !is_dir($uploadDirectory)
        && !mkdir($uploadDirectory, 0775, true)
        && !is_dir($uploadDirectory)
    ) {
        throw new RuntimeException(
            'Folder storage/uploads/articles/slides gagal dibuat.'
        );
    }

    if (!is_writable($uploadDirectory)) {
        throw new RuntimeException(
            'Folder gambar slide tidak dapat ditulis.'
        );
    }

    $storedFileName = bin2hex(random_bytes(16))
        . '.'
        . $extension;

    $destination = $uploadDirectory
        . DIRECTORY_SEPARATOR
        . $storedFileName;

    if (!move_uploaded_file($temporaryPath, $destination)) {
        throw new RuntimeException(
            'Gambar slide gagal disimpan.'
        );
    }

    return [
        'file_name' => $storedFileName,
        'file_type' => $allowedExtensions[$extension],
        'file_size' => $fileSize,
        'file_path' => $destination,
        'file_url' => getSlideImageUrl($storedFileName),
    ];
}

function deleteSlideImageFile(?string $fileName): bool
{
    $path = getSlideImagePath($fileName);

    if ($path === null || !is_file($path)) {
        return false;
    }

    return @unlink($path);
}

function getSlideVideoUploadDirectory(): string
{
    return getArticleUploadDirectory()
        . DIRECTORY_SEPARATOR
        . 'videos';
}

function getSlideVideoPath(?string $fileName): ?string
{
    if ($fileName === null || trim($fileName) === '') {
        return null;
    }

    return getSlideVideoUploadDirectory()
        . DIRECTORY_SEPARATOR
        . basename($fileName);
}

function getSlideVideoUrl(?string $fileName): ?string
{
    if ($fileName === null || trim($fileName) === '') {
        return null;
    }

    return getApiBaseUrl()
        . '/materi-api.php?action=video&file='
        . rawurlencode(basename($fileName));
}

function saveUploadedSlideVideo(array $uploadedFile): array
{
    $uploadError = isset($uploadedFile['error'])
        ? (int) $uploadedFile['error']
        : UPLOAD_ERR_NO_FILE;

    if ($uploadError === UPLOAD_ERR_NO_FILE) {
        throw new RuntimeException('File video belum dipilih.');
    }

    if ($uploadError !== UPLOAD_ERR_OK) {
        throw new RuntimeException(
            'Upload video gagal. Kode error: ' . $uploadError
        );
    }

    $temporaryPath = isset($uploadedFile['tmp_name'])
        ? (string) $uploadedFile['tmp_name']
        : '';

    if (
        $temporaryPath === ''
        || !is_uploaded_file($temporaryPath)
    ) {
        throw new RuntimeException(
            'Temporary file video tidak valid.'
        );
    }

    $fileSize = isset($uploadedFile['size'])
        ? (int) $uploadedFile['size']
        : 0;

    $maxFileSize = 50 * 1024 * 1024;

    if ($fileSize <= 0) {
        throw new RuntimeException('Ukuran video tidak valid.');
    }

    if ($fileSize > $maxFileSize) {
        throw new RuntimeException(
            'Ukuran video maksimal 50 MB.'
        );
    }

    $originalName = isset($uploadedFile['name'])
        ? (string) $uploadedFile['name']
        : 'slide-video';

    $extension = strtolower(
        pathinfo($originalName, PATHINFO_EXTENSION)
    );

    $allowedExtensions = [
        'mp4' => 'video/mp4',
        'webm' => 'video/webm',
        'ogg' => 'video/ogg',
    ];

    if (!isset($allowedExtensions[$extension])) {
        throw new RuntimeException(
            'Format video harus MP4, WEBM, atau OGG.'
        );
    }

    $uploadDirectory = getSlideVideoUploadDirectory();

    if (
        !is_dir($uploadDirectory)
        && !mkdir($uploadDirectory, 0775, true)
        && !is_dir($uploadDirectory)
    ) {
        throw new RuntimeException(
            'Folder storage/uploads/articles/videos gagal dibuat.'
        );
    }

    if (!is_writable($uploadDirectory)) {
        throw new RuntimeException(
            'Folder video tidak dapat ditulis.'
        );
    }

    $storedFileName = bin2hex(random_bytes(16))
        . '.'
        . $extension;

    $destination = $uploadDirectory
        . DIRECTORY_SEPARATOR
        . $storedFileName;

    if (!move_uploaded_file($temporaryPath, $destination)) {
        throw new RuntimeException('Video gagal disimpan.');
    }

    return [
        'file_name' => $storedFileName,
        'file_type' => $allowedExtensions[$extension],
        'file_size' => $fileSize,
        'file_path' => $destination,
        'file_url' => getSlideVideoUrl($storedFileName),
    ];
}

function deleteSlideVideoFile(?string $fileName): bool
{
    $path = getSlideVideoPath($fileName);

    if ($path === null || !is_file($path)) {
        return false;
    }

    return @unlink($path);
}

function getLocalVideoFileNameFromUrl(?string $videoUrl): ?string
{
    if ($videoUrl === null || trim($videoUrl) === '') {
        return null;
    }

    $query = parse_url($videoUrl, PHP_URL_QUERY);

    if (!is_string($query) || $query === '') {
        return null;
    }

    parse_str($query, $parameters);

    if (
        ($parameters['action'] ?? null) !== 'video'
        || empty($parameters['file'])
    ) {
        return null;
    }

    return basename((string) $parameters['file']);
}

function getRequestScheme(): string
{
    $forwardedProto = isset($_SERVER['HTTP_X_FORWARDED_PROTO'])
        ? strtolower(trim((string) $_SERVER['HTTP_X_FORWARDED_PROTO']))
        : '';

    if ($forwardedProto === 'https') {
        return 'https';
    }

    if (
        isset($_SERVER['HTTPS'])
        && $_SERVER['HTTPS'] !== ''
        && strtolower((string) $_SERVER['HTTPS']) !== 'off'
    ) {
        return 'https';
    }

    return 'http';
}

function getApiBaseUrl(): string
{
    $host = isset($_SERVER['HTTP_HOST'])
        ? trim((string) $_SERVER['HTTP_HOST'])
        : '127.0.0.1:8000';

    /*
     * materi-api.php berada di /api/.
     */
    return getRequestScheme()
        . '://'
        . $host
        . '/api';
}

function serveStoredImage(): void
{
    $scope = isset($_GET['scope'])
        ? strtolower(trim((string) $_GET['scope']))
        : 'card';

    $requestedFile = isset($_GET['file'])
        ? trim((string) $_GET['file'])
        : '';

    if ($requestedFile === '') {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Parameter file wajib diisi.',
            ],
            400
        );
    }

    /*
     * basename mencegah ../ path traversal.
     */
    $fileName = basename($requestedFile);

    if ($fileName !== $requestedFile) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Nama file tidak valid.',
            ],
            400
        );
    }

    if ($scope === 'slide') {
        $filePath = getSlideImagePath($fileName);
    } else {
        $filePath = getArticleImagePath($fileName);
    }

    if (
        $filePath === null
        || !is_file($filePath)
        || !is_readable($filePath)
    ) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'File gambar tidak ditemukan.',
                'data' => [
                    'scope' => $scope,
                    'file' => $fileName,
                    'path' => $filePath,
                ],
            ],
            404
        );
    }

    $extension = strtolower(
        pathinfo($fileName, PATHINFO_EXTENSION)
    );

    $mimeTypes = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'svg' => 'image/svg+xml',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
    ];

    $mimeType = $mimeTypes[$extension]
        ?? 'application/octet-stream';

    /*
     * Header JSON di awal file dioverride di sini.
     */
    header_remove('Content-Type');
    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . (string) filesize($filePath));
    header('Cache-Control: public, max-age=3600');
    header('X-Content-Type-Options: nosniff');

    readfile($filePath);
    exit;
}

function serveStoredVideo(): void
{
    $requestedFile = isset($_GET['file'])
        ? trim((string) $_GET['file'])
        : '';

    if ($requestedFile === '') {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Parameter file video wajib diisi.',
            ],
            400
        );
    }

    $fileName = basename($requestedFile);

    if ($fileName !== $requestedFile) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Nama file video tidak valid.',
            ],
            400
        );
    }

    $filePath = getSlideVideoPath($fileName);

    if (
        $filePath === null
        || !is_file($filePath)
        || !is_readable($filePath)
    ) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'File video tidak ditemukan.',
            ],
            404
        );
    }

    $extension = strtolower(
        pathinfo($fileName, PATHINFO_EXTENSION)
    );

    $mimeTypes = [
        'mp4' => 'video/mp4',
        'webm' => 'video/webm',
        'ogg' => 'video/ogg',
    ];

    $mimeType = $mimeTypes[$extension]
        ?? 'application/octet-stream';

    header_remove('Content-Type');
    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . (string) filesize($filePath));
    header('Accept-Ranges: bytes');
    header('Cache-Control: public, max-age=3600');
    header('X-Content-Type-Options: nosniff');

    readfile($filePath);
    exit;
}


function readCreateMateriRequest(): array
{
    $contentType = isset($_SERVER['CONTENT_TYPE'])
        ? strtolower((string) $_SERVER['CONTENT_TYPE'])
        : '';

    /*
     * PRIORITAS 1:
     * Request dari AdminTutorialCreate.jsx menggunakan FormData.
     *
     * FormData:
     * - payload    = JSON string
     * - card_image = file gambar
     *
     * Untuk multipart/form-data JANGAN mengandalkan php://input.
     * PHP sudah mem-parsing request ke $_POST dan $_FILES.
     */
    if (
        isset($_POST['payload'])
        && is_string($_POST['payload'])
        && trim($_POST['payload']) !== ''
    ) {
        $requestData = json_decode(
            (string) $_POST['payload'],
            true
        );

        if (!is_array($requestData)) {
            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Payload multipart bukan JSON yang valid.',
                    'debug' => [
                        'content_type' => $contentType,
                        'post_keys' => array_keys($_POST),
                        'file_keys' => array_keys($_FILES),
                    ],
                ],
                400
            );
        }

        return $requestData;
    }

    /*
     * PRIORITAS 2:
     * Tetap kompatibel dengan request application/json lama.
     */
    $rawBody = file_get_contents('php://input');

    if (
        is_string($rawBody)
        && trim($rawBody) !== ''
    ) {
        $requestData = json_decode(
            $rawBody,
            true
        );

        if (!is_array($requestData)) {
            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Body request harus berupa JSON yang valid.',
                    'debug' => [
                        'content_type' => $contentType,
                        'body_length' => strlen($rawBody),
                    ],
                ],
                400
            );
        }

        return $requestData;
    }

    /*
     * Jika sampai sini:
     * - payload tidak masuk ke $_POST
     * - php://input juga kosong
     *
     * Biasanya terjadi jika API lama masih aktif, field FormData berbeda,
     * atau ukuran request melebihi post_max_size.
     */
    sendJsonResponse(
        [
            'success' => false,
            'message' => 'Payload request tidak ditemukan.',
            'debug' => [
                'content_type' => $contentType,
                'post_keys' => array_keys($_POST),
                'file_keys' => array_keys($_FILES),
                'post_max_size' => ini_get('post_max_size'),
                'upload_max_filesize' => ini_get('upload_max_filesize'),
                'content_length' => isset($_SERVER['CONTENT_LENGTH'])
                    ? (string) $_SERVER['CONTENT_LENGTH']
                    : null,
            ],
        ],
        400
    );
}


function saveUploadedArticleImage(array $uploadedFile): array
{
    $uploadError = isset($uploadedFile['error'])
        ? (int) $uploadedFile['error']
        : UPLOAD_ERR_NO_FILE;

    if ($uploadError === UPLOAD_ERR_NO_FILE) {
        throw new RuntimeException('File gambar belum dipilih.');
    }

    if ($uploadError !== UPLOAD_ERR_OK) {
        throw new RuntimeException(
            'Upload gambar gagal. Kode error: ' . $uploadError
        );
    }

    $temporaryPath = isset($uploadedFile['tmp_name'])
        ? (string) $uploadedFile['tmp_name']
        : '';

    if (
        $temporaryPath === ''
        || !is_uploaded_file($temporaryPath)
    ) {
        throw new RuntimeException(
            'Temporary file upload tidak valid.'
        );
    }

    $fileSize = isset($uploadedFile['size'])
        ? (int) $uploadedFile['size']
        : 0;

    $maxFileSize = 3 * 1024 * 1024;

    if ($fileSize <= 0) {
        throw new RuntimeException(
            'Ukuran gambar tidak valid.'
        );
    }

    if ($fileSize > $maxFileSize) {
        throw new RuntimeException(
            'Ukuran gambar maksimal 3 MB.'
        );
    }

    $originalName = isset($uploadedFile['name'])
        ? (string) $uploadedFile['name']
        : 'image';

    $extension = strtolower(
        pathinfo($originalName, PATHINFO_EXTENSION)
    );

    $allowedExtensions = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'svg' => 'image/svg+xml',
    ];

    if (!isset($allowedExtensions[$extension])) {
        throw new RuntimeException(
            'Format gambar harus JPG, JPEG, PNG, WEBP, atau SVG.'
        );
    }

    $uploadDirectory = getArticleUploadDirectory();

    if (
        !is_dir($uploadDirectory)
        && !mkdir($uploadDirectory, 0775, true)
        && !is_dir($uploadDirectory)
    ) {
        throw new RuntimeException(
            'Folder storage/uploads/articles gagal dibuat.'
        );
    }

    if (!is_writable($uploadDirectory)) {
        throw new RuntimeException(
            'Folder storage/uploads/articles tidak dapat ditulis.'
        );
    }

    $storedFileName = bin2hex(random_bytes(16))
        . '.'
        . $extension;

    $destination = $uploadDirectory
        . DIRECTORY_SEPARATOR
        . $storedFileName;

    if (!move_uploaded_file($temporaryPath, $destination)) {
        throw new RuntimeException(
            'Gambar gagal disimpan ke storage/uploads/articles.'
        );
    }

    return [
        'file_name' => $storedFileName,
        'file_type' => $allowedExtensions[$extension],
        'file_size' => $fileSize,
        'file_path' => $destination,
        'file_url' => getArticleImageUrl($storedFileName),
    ];
}

function deleteArticleImageFile(?string $fileName): bool
{
    $path = getArticleImagePath($fileName);

    if ($path === null || !is_file($path)) {
        return false;
    }

    return @unlink($path);
}


function normalizeRequestChapters(array $requestData): array
{
    $rawChapters = isset($requestData['chapters'])
        && is_array($requestData['chapters'])
        ? $requestData['chapters']
        : [];

    $chapters = [];

    foreach ($rawChapters as $index => $chapter) {
        if (!is_array($chapter)) {
            continue;
        }

        $clientId = $chapter['id']
            ?? $chapter['chapter_id']
            ?? ('chapter-' . ($index + 1));

        $title = trim((string) (
            $chapter['title']
            ?? $chapter['chapter_title']
            ?? ''
        ));

        if ($title === '') {
            $title = 'Bab ' . ($index + 1);
        }

        $chapters[] = [
            'client_id' => (string) $clientId,
            'order' => isset($chapter['order'])
                ? max(1, (int) $chapter['order'])
                : (
                    isset($chapter['chapter_order'])
                        ? max(1, (int) $chapter['chapter_order'])
                        : $index + 1
                ),
            'title' => $title,
        ];
    }

    if ($chapters === []) {
        return [];
    }

    usort(
        $chapters,
        static fn(array $first, array $second): int =>
            $first['order'] <=> $second['order']
    );

    foreach ($chapters as $index => &$chapter) {
        $chapter['order'] = $index + 1;
    }
    unset($chapter);

    return $chapters;
}


function normalizeLearningObjectives(array $learning): array
{
    $rawObjectives = isset($learning['learning_objectives'])
        && is_array($learning['learning_objectives'])
        ? $learning['learning_objectives']
        : [];

    $objectives = [];

    foreach ($rawObjectives as $objective) {
        $value = trim((string) $objective);

        if ($value !== '') {
            $objectives[] = $value;
        }
    }

    return array_values($objectives);
}


function insertTutorialStructure(
    PDO $database,
    int $tutorialId,
    array $chapters,
    array $learningObjectives,
    array $slides,
    string $currentTimestamp
): void {
    $chapterStatement = $database->prepare(
        'INSERT INTO tutorial_chapters (
            tutorial_id,
            chapter_order,
            title,
            created_at,
            updated_at
        ) VALUES (
            :tutorial_id,
            :chapter_order,
            :title,
            :created_at,
            :updated_at
        )'
    );

    if ($chapters === []) {
        throw new RuntimeException(
            'Tutorial harus mempunyai minimal satu Bab.'
        );
    }

    $chapterIdMap = [];

    foreach ($chapters as $index => $chapter) {
        $chapterStatement->execute([
            ':tutorial_id' => $tutorialId,
            ':chapter_order' => isset($chapter['order'])
                ? (int) $chapter['order']
                : $index + 1,
            ':title' => trim((string) ($chapter['title'] ?? ('Bab ' . ($index + 1)))),
            ':created_at' => $currentTimestamp,
            ':updated_at' => $currentTimestamp,
        ]);

        $databaseChapterId = (int) $database->lastInsertId();

        $clientId = isset($chapter['client_id'])
            ? (string) $chapter['client_id']
            : (string) ($chapter['id'] ?? $databaseChapterId);

        $chapterIdMap[$clientId] = $databaseChapterId;
        $chapterIdMap[(string) $databaseChapterId] = $databaseChapterId;
    }

    $objectiveStatement = $database->prepare(
        'INSERT INTO tutorial_learning_objectives (
            tutorial_id,
            objective_order,
            objective,
            created_at,
            updated_at
        ) VALUES (
            :tutorial_id,
            :objective_order,
            :objective,
            :created_at,
            :updated_at
        )'
    );

    foreach ($learningObjectives as $index => $objective) {
        $objectiveStatement->execute([
            ':tutorial_id' => $tutorialId,
            ':objective_order' => $index + 1,
            ':objective' => (string) $objective,
            ':created_at' => $currentTimestamp,
            ':updated_at' => $currentTimestamp,
        ]);
    }

    $slideStatement = $database->prepare(
        'INSERT INTO tutorial_slides (
            tutorial_id,
            chapter_id,
            slide_order,
            title,
            content_type,
            content,
            code_title,
            code_language,
            code_content,
            allow_copy,
            estimated_time,
            status,
            image_name,
            image_type,
            image_size,
            video_url,
            created_at,
            updated_at
        ) VALUES (
            :tutorial_id,
            :chapter_id,
            :slide_order,
            :title,
            :content_type,
            :content,
            :code_title,
            :code_language,
            :code_content,
            :allow_copy,
            :estimated_time,
            :status,
            :image_name,
            :image_type,
            :image_size,
            :video_url,
            :created_at,
            :updated_at
        )'
    );

    $chapterSlideCounters = [];

    foreach ($slides as $index => $slide) {
        if (!is_array($slide)) {
            continue;
        }

        $chapterClientId = isset($slide['chapter_id'])
            && $slide['chapter_id'] !== null
            && trim((string) $slide['chapter_id']) !== ''
                ? (string) $slide['chapter_id']
                : (
                    isset($slide['chapterId'])
                    && $slide['chapterId'] !== null
                    && trim((string) $slide['chapterId']) !== ''
                        ? (string) $slide['chapterId']
                        : null
                );

        if (
            $chapterClientId === null
            || !isset($chapterIdMap[$chapterClientId])
        ) {
            $slideTitle = isset($slide['title'])
                && trim((string) $slide['title']) !== ''
                    ? trim((string) $slide['title'])
                    : 'Slide ' . ($index + 1);

            throw new RuntimeException(
                'Materi "' . $slideTitle . '" tidak mempunyai Bab yang valid.'
            );
        }

        $chapterId = $chapterIdMap[$chapterClientId];

        if (!isset($chapterSlideCounters[$chapterId])) {
            $chapterSlideCounters[$chapterId] = 0;
        }

        $chapterSlideCounters[$chapterId]++;
        $slideOrder = $chapterSlideCounters[$chapterId];

        $slideImage = isset($slide['uploaded_image'])
            && is_array($slide['uploaded_image'])
            ? $slide['uploaded_image']
            : [];

        if ($slideImage === []) {
            $imagePayload = isset($slide['image'])
                && is_array($slide['image'])
                ? $slide['image']
                : [];

            $slideImage = [
                'file_name' => $imagePayload['file_name']
                    ?? $slide['image_name']
                    ?? null,
                'file_type' => $imagePayload['file_type']
                    ?? $slide['image_type']
                    ?? null,
                'file_size' => $imagePayload['file_size']
                    ?? $slide['image_size']
                    ?? null,
            ];
        }

        $contentType = isset($slide['content_type'])
            ? strtolower(trim((string) $slide['content_type']))
            : 'text';

        $videoUrl = isset($slide['uploaded_video_url'])
            && trim((string) $slide['uploaded_video_url']) !== ''
                ? trim((string) $slide['uploaded_video_url'])
                : (
                    isset($slide['video_url'])
                    && trim((string) $slide['video_url']) !== ''
                        ? trim((string) $slide['video_url'])
                        : null
                );

        $bodyContent = isset($slide['body_text'])
            ? (string) $slide['body_text']
            : (
                isset($slide['content'])
                    ? (string) $slide['content']
                    : null
            );

        $slideStatement->execute([
            ':tutorial_id' => $tutorialId,
            ':chapter_id' => $chapterId,
            ':slide_order' => $slideOrder,
            ':title' => isset($slide['title'])
                ? trim((string) $slide['title'])
                : 'Slide ' . ($index + 1),
            ':content_type' => $contentType,
            ':content' => $contentType === 'code'
                ? null
                : $bodyContent,
            ':code_title' => $contentType === 'code'
                && isset($slide['code_title'])
                && trim((string) $slide['code_title']) !== ''
                    ? trim((string) $slide['code_title'])
                    : null,
            ':code_language' => $contentType === 'code'
                ? trim((string) ($slide['code_language'] ?? 'text'))
                : null,
            ':code_content' => $contentType === 'code'
                ? (string) ($slide['code_content'] ?? '')
                : null,
            ':allow_copy' => $contentType === 'code'
                ? booleanToInteger($slide['allow_copy'] ?? true, 1)
                : 0,
            ':estimated_time' => isset($slide['estimated_time'])
                ? (string) $slide['estimated_time']
                : null,
            ':status' => isset($slide['status'])
                ? (string) $slide['status']
                : 'draft',
            ':image_name' => !empty($slideImage['file_name'])
                ? (string) $slideImage['file_name']
                : null,
            ':image_type' => !empty($slideImage['file_type'])
                ? (string) $slideImage['file_type']
                : null,
            ':image_size' => isset($slideImage['file_size'])
                && $slideImage['file_size'] !== null
                    ? (int) $slideImage['file_size']
                    : null,
            ':video_url' => $contentType === 'video'
                ? $videoUrl
                : null,
            ':created_at' => $currentTimestamp,
            ':updated_at' => $currentTimestamp,
        ]);
    }
}


function replaceTutorialStructure(
    PDO $database,
    int $tutorialId,
    array $chapters,
    array $learningObjectives,
    array $slides,
    string $currentTimestamp
): void {
    $deleteSlides = $database->prepare(
        'DELETE FROM tutorial_slides
         WHERE tutorial_id = :tutorial_id'
    );
    $deleteSlides->execute([
        ':tutorial_id' => $tutorialId,
    ]);

    $deleteObjectives = $database->prepare(
        'DELETE FROM tutorial_learning_objectives
         WHERE tutorial_id = :tutorial_id'
    );
    $deleteObjectives->execute([
        ':tutorial_id' => $tutorialId,
    ]);

    $deleteChapters = $database->prepare(
        'DELETE FROM tutorial_chapters
         WHERE tutorial_id = :tutorial_id'
    );
    $deleteChapters->execute([
        ':tutorial_id' => $tutorialId,
    ]);

    insertTutorialStructure(
        $database,
        $tutorialId,
        $chapters,
        $learningObjectives,
        $slides,
        $currentTimestamp
    );
}


function getAllMateri(PDO $database): void
{
    $statement = $database->query(
        'SELECT
            id,
            title,
            slug,
            category,
            display_order,
            short_description,
            full_description,
            card_image_name,
            card_image_type,
            card_image_size,
            difficulty_level,
            estimated_time,
            page_order,
            status,
            active,
            show_on_page,
            featured,
            comments,
            access_type,
            featured_order,
            user_level,
            access_requirement,
            prerequisite,
            cta_text,
            cta_target_link,
            cta_url_slug,
            publish_schedule,
            created_at,
            updated_at
         FROM tutorials
         ORDER BY display_order ASC, id DESC'
    );

    $tutorials = $statement->fetchAll();

    $chapterStatement = $database->prepare(
        'SELECT
            id,
            chapter_order AS "order",
            title,
            created_at,
            updated_at
         FROM tutorial_chapters
         WHERE tutorial_id = :tutorial_id
         ORDER BY chapter_order ASC, id ASC'
    );

    $objectiveStatement = $database->prepare(
        'SELECT
            objective
         FROM tutorial_learning_objectives
         WHERE tutorial_id = :tutorial_id
         ORDER BY objective_order ASC, id ASC'
    );

    $slideStatement = $database->prepare(
        'SELECT
            id,
            chapter_id,
            slide_order AS "order",
            title,
            content_type,
            content,
            code_title,
            code_language,
            code_content,
            allow_copy,
            estimated_time,
            status,
            image_name,
            image_type,
            image_size,
            video_url
         FROM tutorial_slides
         WHERE tutorial_id = :tutorial_id
         ORDER BY slide_order ASC, id ASC'
    );

    foreach ($tutorials as &$tutorial) {
        $tutorialId = (int) $tutorial['id'];

        $chapterStatement->execute([
            ':tutorial_id' => $tutorialId,
        ]);
        $chapters = $chapterStatement->fetchAll();

        $objectiveStatement->execute([
            ':tutorial_id' => $tutorialId,
        ]);
        $objectiveRows = $objectiveStatement->fetchAll();

        $learningObjectives = array_values(
            array_filter(
                array_map(
                    static fn(array $row): string =>
                        trim((string) ($row['objective'] ?? '')),
                    $objectiveRows
                ),
                static fn(string $value): bool => $value !== ''
            )
        );

        $slideStatement->execute([
            ':tutorial_id' => $tutorialId,
        ]);
        $slides = $slideStatement->fetchAll();

        if ($chapters === [] && $slides !== []) {
            $legacyChapterId = 'legacy-' . $tutorialId;

            $chapters = [
                [
                    'id' => $legacyChapterId,
                    'order' => 1,
                    'title' => 'Materi',
                    'virtual' => true,
                ],
            ];

            foreach ($slides as &$legacySlide) {
                if (
                    !isset($legacySlide['chapter_id'])
                    || $legacySlide['chapter_id'] === null
                    || $legacySlide['chapter_id'] === ''
                ) {
                    $legacySlide['chapter_id'] = $legacyChapterId;
                }
            }
            unset($legacySlide);
        } elseif ($chapters !== []) {
            $firstChapterId = $chapters[0]['id'];

            foreach ($slides as &$unassignedSlide) {
                if (
                    !isset($unassignedSlide['chapter_id'])
                    || $unassignedSlide['chapter_id'] === null
                    || $unassignedSlide['chapter_id'] === ''
                ) {
                    $unassignedSlide['chapter_id'] = $firstChapterId;
                }
            }
            unset($unassignedSlide);
        }

        foreach ($slides as &$slide) {
            $slide['body_text'] = isset($slide['content'])
                ? (string) $slide['content']
                : '';

            $slide['allow_copy'] = (bool) ($slide['allow_copy'] ?? 0);

            $slideImageName = isset($slide['image_name'])
                ? (string) $slide['image_name']
                : null;

            $slide['image_path'] = getSlideImagePath(
                $slideImageName
            );

            $slide['image_url'] = getSlideImageUrl(
                $slideImageName
            );

            $slide['image'] = $slideImageName
                ? [
                    'file_name' => $slideImageName,
                    'file_type' => $slide['image_type'] ?? null,
                    'file_size' => isset($slide['image_size'])
                        ? (int) $slide['image_size']
                        : null,
                    'url' => $slide['image_url'],
                ]
                : null;
        }
        unset($slide);

        $tutorial['chapters'] = $chapters;
        $tutorial['learning_objectives'] = $learningObjectives;
        $tutorial['slides'] = $slides;
        $tutorial['total_slides'] = count($slides);
        $tutorial['total_chapters'] = count($chapters);

        $imageName = isset($tutorial['card_image_name'])
            ? (string) $tutorial['card_image_name']
            : null;

        $tutorial['card_image_path'] = getArticleImagePath(
            $imageName
        );

        $tutorial['card_image_url'] = getArticleImageUrl(
            $imageName
        );

        $tutorial['active'] = (bool) ($tutorial['active'] ?? 0);
        $tutorial['show_on_page'] = (bool) ($tutorial['show_on_page'] ?? 0);
        $tutorial['featured'] = (bool) ($tutorial['featured'] ?? 0);
        $tutorial['comments'] = (bool) ($tutorial['comments'] ?? 0);

        $tutorial['learning_information'] = [
            'difficulty_level' => $tutorial['difficulty_level'] ?? null,
            'estimated_time' => $tutorial['estimated_time'] ?? null,
            'learning_objectives' => $learningObjectives,
        ];

        $tutorial['page_settings'] = [
            'page_order' => isset($tutorial['page_order'])
                ? (int) $tutorial['page_order']
                : null,
            'status' => $tutorial['status'] ?? 'draft',
            'active' => $tutorial['active'],
            'show_on_page' => $tutorial['show_on_page'],
            'featured' => $tutorial['featured'],
            'comments' => $tutorial['comments'],
            'access_type' => $tutorial['access_type'] ?? null,
            'featured_order' => isset($tutorial['featured_order'])
                ? (int) $tutorial['featured_order']
                : null,
        ];

        $tutorial['access_settings'] = [
            'user_level' => $tutorial['user_level'] ?? 'semua_pengguna',
            'access_requirement' => $tutorial['access_requirement'] ?? null,
            'prerequisite' => $tutorial['prerequisite'] ?? null,
        ];

        $tutorial['cta'] = [
            'text' => $tutorial['cta_text'] ?? null,
            'target_link' => $tutorial['cta_target_link'] ?? null,
            'url_slug' => $tutorial['cta_url_slug'] ?? null,
            'publish_schedule' => $tutorial['publish_schedule'] ?? null,
        ];
    }
    unset($tutorial);

    sendJsonResponse([
        'success' => true,
        'message' => 'Data materi berhasil diambil.',
        'data' => $tutorials,
        'total' => count($tutorials),
    ]);
}


function createMateri(PDO $database): void
{
    try {
        $requestData = readCreateMateriRequest();
    } catch (InvalidArgumentException $error) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => $error->getMessage(),
            ],
            400
        );
    }

    $errors = validateMateri($requestData);

    if ($errors !== []) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Data materi belum lengkap.',
                'errors' => $errors,
                'data' => null,
            ],
            422
        );
    }

    $descriptions = isset($requestData['descriptions'])
        && is_array($requestData['descriptions'])
        ? $requestData['descriptions']
        : [];

    $cardImage = isset($requestData['card_image'])
        && is_array($requestData['card_image'])
        ? $requestData['card_image']
        : [];

    $learning = isset($requestData['learning_information'])
        && is_array($requestData['learning_information'])
        ? $requestData['learning_information']
        : [];

    $pageSettings = isset($requestData['page_settings'])
        && is_array($requestData['page_settings'])
        ? $requestData['page_settings']
        : [];

    $accessSettings = isset($requestData['access_settings'])
        && is_array($requestData['access_settings'])
        ? $requestData['access_settings']
        : [];

    $cta = isset($requestData['cta'])
        && is_array($requestData['cta'])
        ? $requestData['cta']
        : [];

    $slides = isset($requestData['slides'])
        && is_array($requestData['slides'])
        ? $requestData['slides']
        : [];

    $chapters = normalizeRequestChapters($requestData);
    $learningObjectives = normalizeLearningObjectives($learning);

    $uploadedCardImage = null;
    $uploadedSlideImages = [];
    $uploadedSlideVideos = [];

    if (
        isset($_FILES['card_image'])
        && is_array($_FILES['card_image'])
        && (int) ($_FILES['card_image']['error'] ?? UPLOAD_ERR_NO_FILE)
            !== UPLOAD_ERR_NO_FILE
    ) {
        try {
            $uploadedCardImage = saveUploadedArticleImage(
                $_FILES['card_image']
            );
            $cardImage = $uploadedCardImage;
        } catch (Throwable $error) {
            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Gagal mengupload gambar card materi.',
                    'errors' => [
                        'card_image' => $error->getMessage(),
                    ],
                ],
                422
            );
        }
    }

    /*
     * Upload gambar setiap slide.
     *
     * AdminTutorialCreate.jsx mengirim field:
     * slide_image_0
     * slide_image_1
     * slide_image_2
     * dst.
     */
    foreach ($slides as $index => &$slide) {
        if (!is_array($slide)) {
            continue;
        }

        $uploadField = 'slide_image_' . $index;

        if (
            isset($_FILES[$uploadField])
            && is_array($_FILES[$uploadField])
            && (int) ($_FILES[$uploadField]['error'] ?? UPLOAD_ERR_NO_FILE)
                !== UPLOAD_ERR_NO_FILE
        ) {
            try {
                $uploaded = saveUploadedSlideImage(
                    $_FILES[$uploadField]
                );

                $uploadedSlideImages[] = $uploaded;

                $slide['uploaded_image'] = $uploaded;
            } catch (Throwable $error) {
                if (
                    isset($uploadedCardImage['file_name'])
                    && $uploadedCardImage['file_name'] !== ''
                ) {
                    deleteArticleImageFile(
                        (string) $uploadedCardImage['file_name']
                    );
                }

                foreach ($uploadedSlideImages as $uploadedSlideImage) {
                    if (isset($uploadedSlideImage['file_name'])) {
                        deleteSlideImageFile(
                            (string) $uploadedSlideImage['file_name']
                        );
                    }
                }

                sendJsonResponse(
                    [
                        'success' => false,
                        'message' => 'Gagal mengupload gambar slide.',
                        'errors' => [
                            $uploadField => $error->getMessage(),
                        ],
                    ],
                    422
                );
            }
        }

        $videoUploadField = 'slide_video_' . $index;

        if (
            isset($_FILES[$videoUploadField])
            && is_array($_FILES[$videoUploadField])
            && (int) (
                $_FILES[$videoUploadField]['error']
                ?? UPLOAD_ERR_NO_FILE
            ) !== UPLOAD_ERR_NO_FILE
        ) {
            try {
                $uploadedVideo = saveUploadedSlideVideo(
                    $_FILES[$videoUploadField]
                );

                $uploadedSlideVideos[] = $uploadedVideo;

                $slide['uploaded_video_url'] =
                    $uploadedVideo['file_url'];
            } catch (Throwable $error) {
                if (
                    isset($uploadedCardImage['file_name'])
                    && $uploadedCardImage['file_name'] !== ''
                ) {
                    deleteArticleImageFile(
                        (string) $uploadedCardImage['file_name']
                    );
                }

                foreach ($uploadedSlideImages as $uploadedSlideImage) {
                    if (isset($uploadedSlideImage['file_name'])) {
                        deleteSlideImageFile(
                            (string) $uploadedSlideImage['file_name']
                        );
                    }
                }

                foreach ($uploadedSlideVideos as $uploadedSlideVideo) {
                    if (isset($uploadedSlideVideo['file_name'])) {
                        deleteSlideVideoFile(
                            (string) $uploadedSlideVideo['file_name']
                        );
                    }
                }

                sendJsonResponse(
                    [
                        'success' => false,
                        'message' => 'Gagal mengupload video slide.',
                        'errors' => [
                            $videoUploadField => $error->getMessage(),
                        ],
                    ],
                    422
                );
            }
        }
    }
    unset($slide);

    $currentTimestamp = date(DATE_ATOM);

    try {
        $database->beginTransaction();

        $statement = $database->prepare(
            'INSERT INTO tutorials (
                title,
                slug,
                category,
                display_order,
                short_description,
                full_description,
                card_image_name,
                card_image_type,
                card_image_size,
                difficulty_level,
                estimated_time,
                page_order,
                status,
                active,
                show_on_page,
                featured,
                comments,
                access_type,
                featured_order,
                user_level,
                access_requirement,
                prerequisite,
                cta_text,
                cta_target_link,
                cta_url_slug,
                publish_schedule,
                created_at,
                updated_at
            ) VALUES (
                :title,
                :slug,
                :category,
                :display_order,
                :short_description,
                :full_description,
                :card_image_name,
                :card_image_type,
                :card_image_size,
                :difficulty_level,
                :estimated_time,
                :page_order,
                :status,
                :active,
                :show_on_page,
                :featured,
                :comments,
                :access_type,
                :featured_order,
                :user_level,
                :access_requirement,
                :prerequisite,
                :cta_text,
                :cta_target_link,
                :cta_url_slug,
                :publish_schedule,
                :created_at,
                :updated_at
            )'
        );

        $statement->execute([
            ':title' => trim((string) $requestData['title']),
            ':slug' => trim((string) $requestData['slug']),
            ':category' => (string) $requestData['category'],
            ':display_order' => (int) $requestData['display_order'],
            ':short_description' => trim(
                (string) ($descriptions['short_description'] ?? '')
            ),
            ':full_description' => trim(
                (string) ($descriptions['full_description'] ?? '')
            ),
            ':card_image_name' => isset($cardImage['file_name'])
                ? (string) $cardImage['file_name']
                : null,
            ':card_image_type' => isset($cardImage['file_type'])
                ? (string) $cardImage['file_type']
                : null,
            ':card_image_size' => isset($cardImage['file_size'])
                ? (int) $cardImage['file_size']
                : null,
            ':difficulty_level' => isset($learning['difficulty_level'])
                ? (string) $learning['difficulty_level']
                : null,
            ':estimated_time' => isset($learning['estimated_time'])
                ? (string) $learning['estimated_time']
                : null,
            ':page_order' => (int) $pageSettings['page_order'],
            ':status' => isset($pageSettings['status'])
                ? (string) $pageSettings['status']
                : 'draft',
            ':active' => booleanToInteger(
                $pageSettings['active'] ?? true,
                1
            ),
            ':show_on_page' => booleanToInteger(
                $pageSettings['show_on_page'] ?? true,
                1
            ),
            ':featured' => booleanToInteger(
                $pageSettings['featured'] ?? false,
                0
            ),
            ':comments' => booleanToInteger(
                $pageSettings['comments'] ?? true,
                1
            ),
            ':access_type' => isset($pageSettings['access_type'])
                ? (string) $pageSettings['access_type']
                : null,
            ':featured_order' =>
                isset($pageSettings['featured_order'])
                && $pageSettings['featured_order'] !== ''
                    ? (int) $pageSettings['featured_order']
                    : null,
            ':user_level' => isset($accessSettings['user_level'])
                ? (string) $accessSettings['user_level']
                : 'semua_pengguna',
            ':access_requirement' =>
                isset($accessSettings['access_requirement'])
                && $accessSettings['access_requirement'] !== ''
                    ? (string) $accessSettings['access_requirement']
                    : null,
            ':prerequisite' =>
                isset($accessSettings['prerequisite'])
                && $accessSettings['prerequisite'] !== ''
                    ? (string) $accessSettings['prerequisite']
                    : null,
            ':cta_text' => isset($cta['text'])
                ? (string) $cta['text']
                : null,
            ':cta_target_link' => isset($cta['target_link'])
                ? (string) $cta['target_link']
                : null,
            ':cta_url_slug' => isset($cta['url_slug'])
                ? (string) $cta['url_slug']
                : null,
            ':publish_schedule' =>
                isset($cta['publish_schedule'])
                && $cta['publish_schedule'] !== ''
                    ? (string) $cta['publish_schedule']
                    : null,
            ':created_at' => $currentTimestamp,
            ':updated_at' => $currentTimestamp,
        ]);

        $tutorialId = (int) $database->lastInsertId();

        insertTutorialStructure(
            $database,
            $tutorialId,
            $chapters,
            $learningObjectives,
            $slides,
            $currentTimestamp
        );

        $database->commit();

        sendJsonResponse(
            [
                'success' => true,
                'message' => 'Materi berhasil ditambahkan.',
                'data' => [
                    'id' => $tutorialId,
                    'title' => trim((string) $requestData['title']),
                    'slug' => trim((string) $requestData['slug']),
                    'category' => (string) $requestData['category'],
                    'status' => isset($pageSettings['status'])
                        ? (string) $pageSettings['status']
                        : 'draft',
                    'page_order' => (int) $pageSettings['page_order'],
                    'total_slides' => count($slides),
                    'total_chapters' => count($chapters),
                    'total_learning_objectives' => count($learningObjectives),
                    'uploaded_slide_images' => count($uploadedSlideImages),
                    'uploaded_slide_videos' => count($uploadedSlideVideos),
                    'card_image_name' => isset($cardImage['file_name'])
                        ? (string) $cardImage['file_name']
                        : null,
                    'card_image_path' => isset($cardImage['file_name'])
                        ? getArticleImagePath(
                            (string) $cardImage['file_name']
                        )
                        : null,
                    'card_image_url' => isset($cardImage['file_name'])
                        ? getArticleImageUrl(
                            (string) $cardImage['file_name']
                        )
                        : null,
                    'created_at' => $currentTimestamp,
                ],
            ],
            201
        );
    } catch (Throwable $error) {
        if ($database->inTransaction()) {
            $database->rollBack();
        }

        if (
            isset($uploadedCardImage['file_name'])
            && $uploadedCardImage['file_name'] !== ''
        ) {
            deleteArticleImageFile(
                (string) $uploadedCardImage['file_name']
            );
        }

        foreach ($uploadedSlideImages as $uploadedSlideImage) {
            if (isset($uploadedSlideImage['file_name'])) {
                deleteSlideImageFile(
                    (string) $uploadedSlideImage['file_name']
                );
            }
        }

        foreach ($uploadedSlideVideos as $uploadedSlideVideo) {
            if (isset($uploadedSlideVideo['file_name'])) {
                deleteSlideVideoFile(
                    (string) $uploadedSlideVideo['file_name']
                );
            }
        }

        $errorMessage = strtolower($error->getMessage());

        if (strpos($errorMessage, 'unique') !== false) {
            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Slug sudah digunakan.',
                    'errors' => [
                        'slug' => 'Slug sudah digunakan oleh materi lain.',
                    ],
                ],
                409
            );
        }

        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Gagal menyimpan materi.',
                'error' => $error->getMessage(),
            ],
            500
        );
    }
}



function updateMateri(PDO $database): void
{
    $tutorialId = isset($_GET['id'])
        ? filter_var($_GET['id'], FILTER_VALIDATE_INT)
        : false;

    if ($tutorialId === false || $tutorialId < 1) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'ID materi tidak valid.',
            ],
            400
        );
    }

    $checkStatement = $database->prepare(
        'SELECT *
         FROM tutorials
         WHERE id = :id
         LIMIT 1'
    );

    $checkStatement->execute([
        ':id' => $tutorialId,
    ]);

    $existingTutorial = $checkStatement->fetch();

    if (!$existingTutorial) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Materi tidak ditemukan.',
            ],
            404
        );
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $requestData = readCreateMateriRequest();
    } else {
        $rawBody = file_get_contents('php://input');
        $requestData = json_decode($rawBody, true);

        if (!is_array($requestData)) {
            sendJsonResponse(
                [
                    'success' => false,
                    'message' =>
                        'Body request harus berupa JSON yang valid.',
                ],
                400
            );
        }
    }

    $errors = validateMateri($requestData);

    if ($errors !== []) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Data materi belum lengkap.',
                'errors' => $errors,
            ],
            422
        );
    }

    $descriptions = isset($requestData['descriptions'])
        && is_array($requestData['descriptions'])
        ? $requestData['descriptions']
        : [];

    $learning = isset($requestData['learning_information'])
        && is_array($requestData['learning_information'])
        ? $requestData['learning_information']
        : [];

    $pageSettings = isset($requestData['page_settings'])
        && is_array($requestData['page_settings'])
        ? $requestData['page_settings']
        : [];

    $accessSettings = isset($requestData['access_settings'])
        && is_array($requestData['access_settings'])
        ? $requestData['access_settings']
        : [];

    $cta = isset($requestData['cta'])
        && is_array($requestData['cta'])
        ? $requestData['cta']
        : [];

    $slides = isset($requestData['slides'])
        && is_array($requestData['slides'])
        ? $requestData['slides']
        : [];

    $chapters = normalizeRequestChapters($requestData);
    $learningObjectives = normalizeLearningObjectives($learning);

    $cardImageName = $existingTutorial['card_image_name'] ?? null;
    $cardImageType = $existingTutorial['card_image_type'] ?? null;
    $cardImageSize = $existingTutorial['card_image_size'] ?? null;

    $uploadedCardImage = null;
    $uploadedSlideImages = [];
    $uploadedSlideVideos = [];

    if (
        isset($_FILES['card_image'])
        && is_array($_FILES['card_image'])
        && (int) ($_FILES['card_image']['error'] ?? UPLOAD_ERR_NO_FILE)
            !== UPLOAD_ERR_NO_FILE
    ) {
        try {
            $uploadedCardImage = saveUploadedArticleImage(
                $_FILES['card_image']
            );

            $cardImageName = $uploadedCardImage['file_name'];
            $cardImageType = $uploadedCardImage['file_type'];
            $cardImageSize = $uploadedCardImage['file_size'];
        } catch (Throwable $error) {
            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Gagal mengupload gambar card.',
                    'errors' => [
                        'card_image' => $error->getMessage(),
                    ],
                ],
                422
            );
        }
    } elseif (
        isset($requestData['card_image'])
        && is_array($requestData['card_image'])
    ) {
        $cardImage = $requestData['card_image'];

        $cardImageName = $cardImage['file_name']
            ?? $cardImageName;
        $cardImageType = $cardImage['file_type']
            ?? $cardImageType;
        $cardImageSize = $cardImage['file_size']
            ?? $cardImageSize;
    }

    foreach ($slides as $index => &$slide) {
        if (!is_array($slide)) {
            continue;
        }

        $imageUploadField = 'slide_image_' . $index;

        if (
            isset($_FILES[$imageUploadField])
            && is_array($_FILES[$imageUploadField])
            && (int) (
                $_FILES[$imageUploadField]['error']
                ?? UPLOAD_ERR_NO_FILE
            ) !== UPLOAD_ERR_NO_FILE
        ) {
            try {
                $uploadedImage = saveUploadedSlideImage(
                    $_FILES[$imageUploadField]
                );

                $uploadedSlideImages[] = $uploadedImage;
                $slide['uploaded_image'] = $uploadedImage;
            } catch (Throwable $error) {
                sendJsonResponse(
                    [
                        'success' => false,
                        'message' => 'Gagal mengupload gambar slide.',
                        'errors' => [
                            $imageUploadField => $error->getMessage(),
                        ],
                    ],
                    422
                );
            }
        }

        $videoUploadField = 'slide_video_' . $index;

        if (
            isset($_FILES[$videoUploadField])
            && is_array($_FILES[$videoUploadField])
            && (int) (
                $_FILES[$videoUploadField]['error']
                ?? UPLOAD_ERR_NO_FILE
            ) !== UPLOAD_ERR_NO_FILE
        ) {
            try {
                $uploadedVideo = saveUploadedSlideVideo(
                    $_FILES[$videoUploadField]
                );

                $uploadedSlideVideos[] = $uploadedVideo;
                $slide['uploaded_video_url'] =
                    $uploadedVideo['file_url'];
            } catch (Throwable $error) {
                sendJsonResponse(
                    [
                        'success' => false,
                        'message' => 'Gagal mengupload video slide.',
                        'errors' => [
                            $videoUploadField => $error->getMessage(),
                        ],
                    ],
                    422
                );
            }
        }
    }
    unset($slide);

    $currentTimestamp = date(DATE_ATOM);

    try {
        $database->beginTransaction();

        $statement = $database->prepare(
            'UPDATE tutorials
             SET
                title = :title,
                slug = :slug,
                category = :category,
                display_order = :display_order,
                short_description = :short_description,
                full_description = :full_description,
                card_image_name = :card_image_name,
                card_image_type = :card_image_type,
                card_image_size = :card_image_size,
                difficulty_level = :difficulty_level,
                estimated_time = :estimated_time,
                page_order = :page_order,
                status = :status,
                active = :active,
                show_on_page = :show_on_page,
                featured = :featured,
                comments = :comments,
                access_type = :access_type,
                featured_order = :featured_order,
                user_level = :user_level,
                access_requirement = :access_requirement,
                prerequisite = :prerequisite,
                cta_text = :cta_text,
                cta_target_link = :cta_target_link,
                cta_url_slug = :cta_url_slug,
                publish_schedule = :publish_schedule,
                updated_at = :updated_at
             WHERE id = :id'
        );

        $statement->execute([
            ':title' => trim((string) $requestData['title']),
            ':slug' => trim((string) $requestData['slug']),
            ':category' => (string) $requestData['category'],
            ':display_order' => (int) $requestData['display_order'],
            ':short_description' => trim(
                (string) ($descriptions['short_description'] ?? '')
            ),
            ':full_description' => trim(
                (string) ($descriptions['full_description'] ?? '')
            ),
            ':card_image_name' => $cardImageName,
            ':card_image_type' => $cardImageType,
            ':card_image_size' => $cardImageSize,
            ':difficulty_level' => $learning['difficulty_level']
                ?? $existingTutorial['difficulty_level']
                ?? null,
            ':estimated_time' => $learning['estimated_time']
                ?? $existingTutorial['estimated_time']
                ?? null,
            ':page_order' => (int) $pageSettings['page_order'],
            ':status' => $pageSettings['status']
                ?? $existingTutorial['status']
                ?? 'draft',
            ':active' => booleanToInteger(
                $pageSettings['active']
                    ?? $existingTutorial['active']
                    ?? true,
                1
            ),
            ':show_on_page' => booleanToInteger(
                $pageSettings['show_on_page']
                    ?? $existingTutorial['show_on_page']
                    ?? true,
                1
            ),
            ':featured' => booleanToInteger(
                $pageSettings['featured']
                    ?? $existingTutorial['featured']
                    ?? false,
                0
            ),
            ':comments' => booleanToInteger(
                $pageSettings['comments']
                    ?? $existingTutorial['comments']
                    ?? true,
                1
            ),
            ':access_type' => $pageSettings['access_type']
                ?? $existingTutorial['access_type']
                ?? null,
            ':featured_order' =>
                isset($pageSettings['featured_order'])
                && $pageSettings['featured_order'] !== ''
                    ? (int) $pageSettings['featured_order']
                    : ($existingTutorial['featured_order'] ?? null),
            ':user_level' => $accessSettings['user_level']
                ?? $existingTutorial['user_level']
                ?? 'semua_pengguna',
            ':access_requirement' => array_key_exists(
                'access_requirement',
                $accessSettings
            )
                ? (
                    $accessSettings['access_requirement'] !== ''
                        ? (string) $accessSettings['access_requirement']
                        : null
                )
                : ($existingTutorial['access_requirement'] ?? null),
            ':prerequisite' => array_key_exists(
                'prerequisite',
                $accessSettings
            )
                ? (
                    $accessSettings['prerequisite'] !== ''
                        ? (string) $accessSettings['prerequisite']
                        : null
                )
                : ($existingTutorial['prerequisite'] ?? null),
            ':cta_text' => $cta['text']
                ?? $existingTutorial['cta_text']
                ?? null,
            ':cta_target_link' => $cta['target_link']
                ?? $existingTutorial['cta_target_link']
                ?? null,
            ':cta_url_slug' => $cta['url_slug']
                ?? $existingTutorial['cta_url_slug']
                ?? null,
            ':publish_schedule' => array_key_exists(
                'publish_schedule',
                $cta
            )
                ? (
                    $cta['publish_schedule'] !== ''
                        ? (string) $cta['publish_schedule']
                        : null
                )
                : ($existingTutorial['publish_schedule'] ?? null),
            ':updated_at' => $currentTimestamp,
            ':id' => $tutorialId,
        ]);

        replaceTutorialStructure(
            $database,
            $tutorialId,
            $chapters,
            $learningObjectives,
            $slides,
            $currentTimestamp
        );

        $database->commit();

        if (
            $uploadedCardImage !== null
            && !empty($existingTutorial['card_image_name'])
            && $existingTutorial['card_image_name'] !== $cardImageName
        ) {
            deleteArticleImageFile(
                (string) $existingTutorial['card_image_name']
            );
        }

        sendJsonResponse(
            [
                'success' => true,
                'message' => 'Materi berhasil diperbarui.',
                'data' => [
                    'id' => $tutorialId,
                    'title' => trim((string) $requestData['title']),
                    'slug' => trim((string) $requestData['slug']),
                    'category' => (string) $requestData['category'],
                    'display_order' => (int) $requestData['display_order'],
                    'status' => $pageSettings['status']
                        ?? $existingTutorial['status']
                        ?? 'draft',
                    'page_order' => (int) $pageSettings['page_order'],
                    'total_slides' => count($slides),
                    'total_chapters' => count($chapters),
                    'total_learning_objectives' => count($learningObjectives),
                    'uploaded_slide_images' =>
                        count($uploadedSlideImages),
                    'uploaded_slide_videos' =>
                        count($uploadedSlideVideos),
                    'card_image_name' => $cardImageName,
                    'card_image_url' => getArticleImageUrl(
                        $cardImageName
                    ),
                    'created_at' => $existingTutorial['created_at'],
                    'updated_at' => $currentTimestamp,
                ],
            ],
            200
        );
    } catch (Throwable $error) {
        if ($database->inTransaction()) {
            $database->rollBack();
        }

        if (
            isset($uploadedCardImage['file_name'])
            && $uploadedCardImage['file_name'] !== ''
        ) {
            deleteArticleImageFile(
                (string) $uploadedCardImage['file_name']
            );
        }

        foreach ($uploadedSlideImages as $uploadedSlideImage) {
            if (isset($uploadedSlideImage['file_name'])) {
                deleteSlideImageFile(
                    (string) $uploadedSlideImage['file_name']
                );
            }
        }

        foreach ($uploadedSlideVideos as $uploadedSlideVideo) {
            if (isset($uploadedSlideVideo['file_name'])) {
                deleteSlideVideoFile(
                    (string) $uploadedSlideVideo['file_name']
                );
            }
        }

        $errorMessage = strtolower($error->getMessage());

        if (strpos($errorMessage, 'unique') !== false) {
            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Slug sudah digunakan.',
                ],
                409
            );
        }

        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Gagal memperbarui materi.',
                'error' => $error->getMessage(),
            ],
            500
        );
    }
}



function deleteMateri(PDO $database): void
{
    $tutorialId = isset($_GET['id'])
        ? filter_var($_GET['id'], FILTER_VALIDATE_INT)
        : false;

    if ($tutorialId === false || $tutorialId < 1) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'ID materi tidak valid.',
                'errors' => [
                    'id' => 'Parameter id wajib berupa angka positif.',
                ],
            ],
            400
        );
    }

    $checkStatement = $database->prepare(
        'SELECT id, title, slug, card_image_name
         FROM tutorials
         WHERE id = :id
         LIMIT 1'
    );

    $checkStatement->execute([
        ':id' => $tutorialId,
    ]);

    $tutorial = $checkStatement->fetch();

    if (!$tutorial) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Materi tidak ditemukan.',
                'data' => null,
            ],
            404
        );
    }

    $slideImageStatement = $database->prepare(
        'SELECT image_name, video_url
         FROM tutorial_slides
         WHERE tutorial_id = :tutorial_id'
    );

    $slideImageStatement->execute([
        ':tutorial_id' => $tutorialId,
    ]);

    $slideMediaRows = $slideImageStatement->fetchAll();

    $slideImageNames = array_values(
        array_filter(
            array_map(
                static fn(array $row): ?string =>
                    isset($row['image_name'])
                    && trim((string) $row['image_name']) !== ''
                        ? (string) $row['image_name']
                        : null,
                $slideMediaRows
            )
        )
    );

    $slideVideoNames = array_values(
        array_filter(
            array_map(
                static fn(array $row): ?string =>
                    getLocalVideoFileNameFromUrl(
                        isset($row['video_url'])
                            ? (string) $row['video_url']
                            : null
                    ),
                $slideMediaRows
            )
        )
    );

    try {
        $database->beginTransaction();

        $deleteSlides = $database->prepare(
            'DELETE FROM tutorial_slides
             WHERE tutorial_id = :tutorial_id'
        );

        $deleteSlides->execute([
            ':tutorial_id' => $tutorialId,
        ]);

        $deletedSlides = $deleteSlides->rowCount();

        $deleteTutorial = $database->prepare(
            'DELETE FROM tutorials
             WHERE id = :id'
        );

        $deleteTutorial->execute([
            ':id' => $tutorialId,
        ]);

        if ($deleteTutorial->rowCount() < 1) {
            $database->rollBack();

            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Materi gagal dihapus karena data tidak ditemukan.',
                    'data' => null,
                ],
                404
            );
        }

        $database->commit();

        $imageDeleted = deleteArticleImageFile(
            isset($tutorial['card_image_name'])
                ? (string) $tutorial['card_image_name']
                : null
        );

        $deletedSlideImages = 0;

        foreach ($slideImageNames as $slideImageName) {
            if (deleteSlideImageFile($slideImageName)) {
                $deletedSlideImages++;
            }
        }

        $deletedSlideVideos = 0;

        foreach ($slideVideoNames as $slideVideoName) {
            if (deleteSlideVideoFile($slideVideoName)) {
                $deletedSlideVideos++;
            }
        }

        sendJsonResponse(
            [
                'success' => true,
                'message' => 'Materi berhasil dihapus.',
                'data' => [
                    'id' => (int) $tutorial['id'],
                    'title' => (string) $tutorial['title'],
                    'slug' => (string) $tutorial['slug'],
                    'deleted_slides' => $deletedSlides,
                    'card_image_deleted' => $imageDeleted,
                    'slide_images_deleted' => $deletedSlideImages,
                    'slide_videos_deleted' => $deletedSlideVideos,
                ],
            ],
            200
        );
    } catch (PDOException $error) {
        if ($database->inTransaction()) {
            $database->rollBack();
        }

        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Gagal menghapus materi.',
                'error' => $error->getMessage(),
            ],
            500
        );
    }
}


function validateMateri(array $data): array
{
    $errors = [];

    if (trim((string) ($data['title'] ?? '')) === '') {
        $errors['title'] = 'Kolom ini belum diisi.';
    }

    if (trim((string) ($data['slug'] ?? '')) === '') {
        $errors['slug'] = 'Kolom ini belum diisi.';
    }

    if (trim((string) ($data['category'] ?? '')) === '') {
        $errors['category'] = 'Kolom ini belum diisi.';
    }

    if (
        !isset($data['display_order'])
        || (int) $data['display_order'] < 1
    ) {
        $errors['display_order'] = 'Kolom ini belum diisi.';
    }

    $descriptions = isset($data['descriptions'])
        && is_array($data['descriptions'])
        ? $data['descriptions']
        : [];

    if (
        trim((string) ($descriptions['short_description'] ?? '')) === ''
    ) {
        $errors['short_description'] = 'Kolom ini belum diisi.';
    }

    if (
        trim((string) ($descriptions['full_description'] ?? '')) === ''
    ) {
        $errors['full_description'] = 'Kolom ini belum diisi.';
    }

    $pageSettings = isset($data['page_settings'])
        && is_array($data['page_settings'])
        ? $data['page_settings']
        : [];

    if (
        !isset($pageSettings['page_order'])
        || (int) $pageSettings['page_order'] < 1
    ) {
        $errors['page_order'] = 'Kolom ini belum diisi.';
    }

    $learning = isset($data['learning_information'])
        && is_array($data['learning_information'])
        ? $data['learning_information']
        : [];

    if (
        isset($learning['learning_objectives'])
        && !is_array($learning['learning_objectives'])
    ) {
        $errors['learning_objectives'] =
            'Tujuan pembelajaran harus berupa array.';
    }

    $chapters = isset($data['chapters'])
        && is_array($data['chapters'])
        ? $data['chapters']
        : [];

    if ($chapters === []) {
        $errors['chapters'] =
            'Tutorial harus mempunyai minimal satu Bab.';
    }

    $chapterIds = [];

    foreach ($chapters as $index => $chapter) {
        if (!is_array($chapter)) {
            $errors['chapters_' . $index] =
                'Format data bab tidak valid.';
            continue;
        }

        $chapterId = $chapter['id']
            ?? $chapter['chapter_id']
            ?? ('chapter-' . ($index + 1));

        $chapterIds[] = (string) $chapterId;

        if (
            trim((string) (
                $chapter['title']
                ?? $chapter['chapter_title']
                ?? ''
            )) === ''
        ) {
            $errors['chapters_' . $index . '_title'] =
                'Judul bab wajib diisi.';
        }
    }

    $slides = isset($data['slides']) && is_array($data['slides'])
        ? $data['slides']
        : [];

    if ($slides === []) {
        $errors['slides'] =
            'Daftar materi harus mempunyai minimal satu slide.';
    }

    $allowedContentTypes = [
        'text',
        'text_image',
        'image',
        'video',
        'code',
    ];

    foreach ($slides as $index => $slide) {
        if (!is_array($slide)) {
            $errors['slides_' . $index] =
                'Format data slide tidak valid.';
            continue;
        }

        if (trim((string) ($slide['title'] ?? '')) === '') {
            $errors['slides_' . $index . '_title'] =
                'Judul slide wajib diisi.';
        }

        $contentType = strtolower(
            trim((string) ($slide['content_type'] ?? 'text'))
        );

        if (!in_array($contentType, $allowedContentTypes, true)) {
            $errors['slides_' . $index . '_content_type'] =
                'Tipe konten slide tidak valid.';
        }

        if (
            $contentType === 'code'
            && trim((string) ($slide['code_content'] ?? '')) === ''
        ) {
            $errors['slides_' . $index . '_code_content'] =
                'Isi code wajib diisi untuk tipe Code Block.';
        }

        $slideChapterId = $slide['chapter_id']
            ?? $slide['chapterId']
            ?? null;

        if (
            $slideChapterId === null
            || trim((string) $slideChapterId) === ''
        ) {
            $errors['slides_' . $index . '_chapter_id'] =
                'Setiap materi wajib berada di dalam Bab.';
            continue;
        }

        if (
            !in_array(
                (string) $slideChapterId,
                $chapterIds,
                true
            )
        ) {
            $errors['slides_' . $index . '_chapter_id'] =
                'Bab untuk materi tidak ditemukan.';
        }
    }

    return $errors;
}


function sendJsonResponse(array $response, int $statusCode = 200): void
{
    http_response_code($statusCode);

    echo json_encode(
        $response,
        JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
    );

    exit;
}
