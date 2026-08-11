<?php

declare(strict_types=1);

ini_set('display_errors', '0');
error_reporting(E_ALL);
date_default_timezone_set('Asia/Jakarta');

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

$isLocalOrigin = preg_match(
    '#^http://(localhost|127\.0\.0\.1|192\.168\.[0-9]+\.[0-9]+|10\.[0-9]+\.[0-9]+\.[0-9]+|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]+\.[0-9]+):[0-9]+$#',
    $origin
) === 1;

if (in_array($origin, $allowedOrigins, true) || $isLocalOrigin) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

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

function cleanText(?string $value): string
{
    return trim((string) $value);
}

function stripDangerousHtml(string $html): string
{
    $html = preg_replace('#<(script|style)\b[^>]*>.*?</\1>#is', '', $html) ?? '';
    $html = preg_replace('/\son\w+\s*=\s*(["\']).*?\1/i', '', $html) ?? '';
    $html = preg_replace('/\son\w+\s*=\s*[^\s>]+/i', '', $html) ?? '';

    return trim($html);
}

function htmlToText(string $html): string
{
    return trim(html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
}

function readJsonBody(): array
{
    $rawBody = file_get_contents('php://input');

    if ($rawBody === false || trim($rawBody) === '') {
        return [];
    }

    $data = json_decode($rawBody, true);

    if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) {
        respond(400, [
            'success' => false,
            'message' => 'JSON tidak valid.',
            'error' => json_last_error_msg(),
        ]);
    }

    return isset($data['data']) && is_array($data['data']) ? $data['data'] : $data;
}

function fileToPayload(?array $file, ?string $coverPath, ?string $coverUrl): ?array
{
    if (!$file || !$coverPath) {
        return null;
    }

    return [
        'name' => $file['name'] ?? null,
        'size' => isset($file['size']) ? (int) $file['size'] : 0,
        'type' => $file['type'] ?? 'application/octet-stream',
        'path' => $coverPath,
        'url' => $coverUrl,
    ];
}

function getRequestId(): int
{
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if ($id <= 0) {
        respond(400, [
            'success' => false,
            'message' => 'Parameter id wajib berupa angka lebih dari 0.',
        ]);
    }

    return $id;
}

function galleryRowToPayload(array $row): array
{
    $payload = json_decode((string) ($row['payload_json'] ?? ''), true) ?: [];

    return [
        'id' => (int) $row['id'],
        'title' => $row['title'],
        'tag' => $row['tag'],
        'description' => $row['description'],
        'userName' => $row['user_name'],
        'eventDate' => $row['event_date'],
        'detailLink' => $row['detail_link'],
        'note' => $row['note'],
        'coverImage' => $payload['coverImage'] ?? [
            'name' => $row['cover_original_name'],
            'size' => isset($row['cover_size']) ? (int) $row['cover_size'] : 0,
            'type' => $row['cover_mime'],
            'path' => $row['cover_path'],
            'url' => $row['cover_url'] ?? null,
        ],
        'coverPath' => $row['cover_path'],
        'coverUrl' => $row['cover_url'] ?? null,
        'status' => $row['status'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
        'payload' => $payload,
    ];
}

function resolveDatabasePath(string $projectRoot, array $databaseConfig): string
{
    $sqliteConfig = $databaseConfig['sqlite'] ?? null;

    if (!is_array($sqliteConfig)) {
        throw new RuntimeException('Konfigurasi SQLite tidak ditemukan.');
    }

    $databasePath = trim((string) ($sqliteConfig['path'] ?? ''));

    if ($databasePath === '') {
        throw new RuntimeException('Path database SQLite belum dikonfigurasi.');
    }

    $isWindowsAbsolutePath = preg_match('/^[A-Za-z]:[\\\\\/]/', $databasePath) === 1;
    $isUnixAbsolutePath = str_starts_with($databasePath, '/');

    if (!$isWindowsAbsolutePath && !$isUnixAbsolutePath) {
        $databasePath = $projectRoot . DIRECTORY_SEPARATOR . str_replace(
            ['/', '\\'],
            DIRECTORY_SEPARATOR,
            $databasePath
        );
    }

    return $databasePath;
}

function ensureGalleryTables(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS gallery_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            tag TEXT NOT NULL,
            description TEXT NOT NULL,
            user_name TEXT NOT NULL,
            event_date TEXT NOT NULL,
            detail_link TEXT NULL,
            note TEXT NULL,
            cover_path TEXT NULL,
            cover_url TEXT NULL,
            cover_original_name TEXT NULL,
            cover_mime TEXT NULL,
            cover_size INTEGER NULL,
            status TEXT NOT NULL DEFAULT "draft",
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );

    if (function_exists('addColumnIfMissing')) {
        addColumnIfMissing($pdo, 'gallery_submissions', 'cover_url', 'TEXT');
        addColumnIfMissing($pdo, 'gallery_submissions', 'cover_path', 'TEXT');
        addColumnIfMissing($pdo, 'gallery_submissions', 'cover_original_name', 'TEXT');
        addColumnIfMissing($pdo, 'gallery_submissions', 'cover_mime', 'TEXT');
        addColumnIfMissing($pdo, 'gallery_submissions', 'cover_size', 'INTEGER');
    }
}

function uploadedCover(array $uploadDirectory): array
{
    $coverFile = $_FILES['cover_image'] ?? null;
    $errors = [];
    $coverPath = null;
    $coverUrl = null;
    $coverOriginalName = null;
    $coverMime = null;
    $coverSize = null;
    $targetFile = null;

    if (
        $coverFile &&
        isset($coverFile['error']) &&
        $coverFile['error'] !== UPLOAD_ERR_NO_FILE
    ) {
        if ($coverFile['error'] !== UPLOAD_ERR_OK) {
            $errors['cover_image'] = 'Upload cover gagal.';
        } else {
            $coverSize = (int) ($coverFile['size'] ?? 0);

            if ($coverSize <= 0) {
                $errors['cover_image'] = 'File cover tidak valid.';
            }

            if ($coverSize > 5 * 1024 * 1024) {
                $errors['cover_image'] = 'Ukuran cover maksimal 5 MB.';
            }

            $temporaryFile = (string) ($coverFile['tmp_name'] ?? '');

            if ($temporaryFile === '' || !is_uploaded_file($temporaryFile)) {
                $errors['cover_image'] = 'File upload tidak valid.';
            } else {
                $fileInfo = new finfo(FILEINFO_MIME_TYPE);
                $detectedMime = $fileInfo->file($temporaryFile) ?: '';

                $allowedMimeTypes = [
                    'image/jpeg' => 'jpg',
                    'image/png' => 'png',
                    'image/webp' => 'webp',
                ];

                if (!array_key_exists($detectedMime, $allowedMimeTypes)) {
                    $errors['cover_image'] = 'Cover hanya boleh JPG, JPEG, PNG, atau WEBP.';
                } else {
                    $coverMime = $detectedMime;
                    $coverOriginalName = basename((string) ($coverFile['name'] ?? 'cover'));
                    $fileName = 'gallery_' . date('Ymd_His') . '_' . bin2hex(random_bytes(8)) . '.' . $allowedMimeTypes[$detectedMime];
                    $targetFile = $uploadDirectory['path'] . DIRECTORY_SEPARATOR . $fileName;
                    $coverPath = 'storage/uploads/gallery/' . $fileName;
                    $coverUrl = rtrim((string) $uploadDirectory['url'], '/') . '/' . $fileName;
                }
            }
        }
    }

    return [
        'file' => $coverFile,
        'errors' => $errors,
        'targetFile' => $targetFile,
        'coverPath' => $coverPath,
        'coverUrl' => $coverUrl,
        'coverOriginalName' => $coverOriginalName,
        'coverMime' => $coverMime,
        'coverSize' => $coverSize,
    ];
}

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if (!in_array($method, ['GET', 'POST', 'PUT', 'DELETE'], true)) {
        header('Allow: GET, POST, PUT, DELETE, OPTIONS');

        respond(405, [
            'success' => false,
            'message' => 'Method tidak diizinkan.',
        ]);
    }

    $projectRoot = dirname(__DIR__);
    $configPath = $projectRoot . '/config/database.php';
    $imageStoragePath = $projectRoot . '/api/support/image-storage.php';

    if (file_exists($imageStoragePath)) {
        require_once $imageStoragePath;
    }

    if (!file_exists($configPath)) {
        respond(500, [
            'success' => false,
            'message' => 'Konfigurasi database tidak ditemukan.',
            'data' => ['path' => $configPath],
        ]);
    }

    $databaseConfig = require $configPath;
    $databasePath = resolveDatabasePath($projectRoot, $databaseConfig);
    $databaseDirectory = dirname($databasePath);

    if (!is_dir($databaseDirectory) && !mkdir($databaseDirectory, 0775, true) && !is_dir($databaseDirectory)) {
        throw new RuntimeException('Folder database tidak dapat dibuat: ' . $databaseDirectory);
    }

    if (!is_writable($databaseDirectory)) {
        throw new RuntimeException('Folder database tidak memiliki izin tulis: ' . $databaseDirectory);
    }

    $galleryStorage = function_exists('ensureUploadStorage')
        ? ensureUploadStorage($projectRoot, 'gallery')
        : [
            'path' => $projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'gallery',
            'url' => '/uploads/gallery',
        ];

    $pdo = new PDO(
        'sqlite:' . $databasePath,
        null,
        null,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    $busyTimeout = (int) (($databaseConfig['sqlite']['busy_timeout_ms'] ?? 5000));

    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA busy_timeout = ' . max(5000, $busyTimeout));
    ensureGalleryTables($pdo);

    if ($method === 'GET') {
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

        if ($id > 0) {
            $statement = $pdo->prepare(
                'SELECT * FROM gallery_submissions
                 WHERE id = :id
                 LIMIT 1'
            );
            $statement->execute([':id' => $id]);
            $row = $statement->fetch();

            if (!$row) {
                respond(404, [
                    'success' => false,
                    'message' => 'Galeri tidak ditemukan.',
                ]);
            }

            respond(200, [
                'success' => true,
                'message' => 'Detail galeri berhasil diambil.',
                'database' => $databasePath,
                'data' => galleryRowToPayload($row),
            ]);
        }

        $statement = $pdo->query(
            'SELECT * FROM gallery_submissions
             ORDER BY id DESC'
        );

        $galleries = array_map('galleryRowToPayload', $statement->fetchAll());

        respond(200, [
            'success' => true,
            'message' => 'Data galeri berhasil diambil.',
            'database' => $databasePath,
            'total' => count($galleries),
            'data' => $galleries,
        ]);
    }

    if ($method === 'DELETE') {
        $id = getRequestId();
        $statement = $pdo->prepare('DELETE FROM gallery_submissions WHERE id = :id');
        $statement->execute([':id' => $id]);

        respond(200, [
            'success' => true,
            'message' => 'Galeri berhasil dihapus.',
            'data' => ['id' => $id],
        ]);
    }

    $input = stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false
        ? readJsonBody()
        : $_POST;

    $title = cleanText($input['title'] ?? '');
    $tag = cleanText($input['tag'] ?? '');
    $description = stripDangerousHtml((string) ($input['description'] ?? ''));
    $userName = cleanText($input['user_name'] ?? $input['userName'] ?? '');
    $eventDate = cleanText($input['event_date'] ?? $input['eventDate'] ?? '');
    $detailLink = cleanText($input['detail_link'] ?? $input['detailLink'] ?? '');
    $note = cleanText($input['note'] ?? '');
    $status = cleanText($input['status'] ?? 'draft');

    $allowedStatuses = ['draft', 'published'];
    $allowedTags = ['Workshop', 'Program', 'Komunitas', 'Partner', 'Event', 'Dokumentasi'];
    $isDraft = $status === 'draft';
    $errors = [];

    if (!in_array($status, $allowedStatuses, true)) {
        $errors['status'] = 'Status hanya boleh draft atau published.';
    }

    if (!$isDraft && $title === '') {
        $errors['title'] = 'Judul kegiatan wajib diisi.';
    }

    if (!$isDraft && $tag === '') {
        $errors['tag'] = 'Tag kegiatan wajib dipilih.';
    }

    if ($tag !== '' && !in_array($tag, $allowedTags, true)) {
        $errors['tag'] = 'Tag kegiatan tidak valid.';
    }

    if (!$isDraft && htmlToText($description) === '') {
        $errors['description'] = 'Deskripsi kegiatan wajib diisi.';
    }

    if (!$isDraft && $userName === '') {
        $errors['user_name'] = 'Nama user wajib diisi.';
    }

    if (!$isDraft && $eventDate === '') {
        $errors['event_date'] = 'Tanggal kegiatan wajib dipilih.';
    }

    if ($eventDate !== '') {
        $date = DateTimeImmutable::createFromFormat('Y-m-d', $eventDate);
        $isValidDate = $date !== false && $date->format('Y-m-d') === $eventDate;

        if (!$isValidDate) {
            $errors['event_date'] = 'Format tanggal kegiatan harus YYYY-MM-DD.';
        }
    }

    if ($detailLink !== '' && filter_var($detailLink, FILTER_VALIDATE_URL) === false) {
        $errors['detail_link'] = 'Link detail harus berupa URL yang valid.';
    }

    $uploadedCover = uploadedCover($galleryStorage);

    if (
        !$isDraft &&
        !$uploadedCover['coverPath'] &&
        $method === 'POST'
    ) {
        $errors['cover_image'] = 'Cover kegiatan wajib diupload.';
    }

    $errors = array_merge($errors, $uploadedCover['errors']);

    if ($errors !== []) {
        respond(422, [
            'success' => false,
            'message' => 'Validasi data galeri gagal.',
            'errors' => $errors,
        ]);
    }

    if ($isDraft) {
        $title = $title !== '' ? $title : 'Draft Galeri';
        $tag = $tag !== '' ? $tag : 'Dokumentasi';
        $description = $description !== '' ? $description : 'Draft galeri belum memiliki deskripsi.';
        $userName = $userName !== '' ? $userName : 'Admin';
        $eventDate = $eventDate !== '' ? $eventDate : date('Y-m-d');
    }

    if ($uploadedCover['targetFile'] !== null) {
        if (!move_uploaded_file((string) $uploadedCover['file']['tmp_name'], (string) $uploadedCover['targetFile'])) {
            throw new RuntimeException('File cover gagal dipindahkan ke folder upload.');
        }
    }

    $now = (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))
        ->format(DateTimeInterface::ATOM);

    $coverPayload = fileToPayload(
        $uploadedCover['file'],
        $uploadedCover['coverPath'],
        $uploadedCover['coverUrl']
    );

    if ($method === 'PUT') {
        $id = getRequestId();
        $check = $pdo->prepare(
            'SELECT cover_path, cover_url, cover_original_name, cover_mime, cover_size, created_at
             FROM gallery_submissions
             WHERE id = :id
             LIMIT 1'
        );
        $check->execute([':id' => $id]);
        $existing = $check->fetch();

        if (!$existing) {
            respond(404, [
                'success' => false,
                'message' => 'Galeri yang akan diedit tidak ditemukan.',
            ]);
        }

        if ($coverPayload === null) {
            $coverPayload = [
                'name' => $existing['cover_original_name'],
                'size' => isset($existing['cover_size']) ? (int) $existing['cover_size'] : 0,
                'type' => $existing['cover_mime'],
                'path' => $existing['cover_path'],
                'url' => $existing['cover_url'],
            ];
            $uploadedCover['coverPath'] = $existing['cover_path'];
            $uploadedCover['coverUrl'] = $existing['cover_url'];
            $uploadedCover['coverOriginalName'] = $existing['cover_original_name'];
            $uploadedCover['coverMime'] = $existing['cover_mime'];
            $uploadedCover['coverSize'] = $existing['cover_size'];
        }
    }

    $galleryPayload = [
        'title' => $title,
        'tag' => $tag,
        'description' => $description,
        'userName' => $userName,
        'eventDate' => $eventDate,
        'detailLink' => $detailLink !== '' ? $detailLink : null,
        'note' => $note !== '' ? $note : null,
        'coverImage' => $coverPayload,
        'status' => $status !== '' ? $status : 'draft',
        'updatedAt' => $now,
    ];

    if ($method === 'POST') {
        $galleryPayload['createdAt'] = $now;
    }

    $payloadJson = json_encode(
        $galleryPayload,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES |
        JSON_THROW_ON_ERROR
    );

    if ($method === 'POST') {
        $statement = $pdo->prepare(
            'INSERT INTO gallery_submissions (
                title,
                tag,
                description,
                user_name,
                event_date,
                detail_link,
                note,
                cover_path,
                cover_url,
                cover_original_name,
                cover_mime,
                cover_size,
                status,
                payload_json,
                created_at,
                updated_at
            ) VALUES (
                :title,
                :tag,
                :description,
                :user_name,
                :event_date,
                :detail_link,
                :note,
                :cover_path,
                :cover_url,
                :cover_original_name,
                :cover_mime,
                :cover_size,
                :status,
                :payload_json,
                :created_at,
                :updated_at
            )'
        );

        $statement->execute([
            ':title' => $title,
            ':tag' => $tag,
            ':description' => $description,
            ':user_name' => $userName,
            ':event_date' => $eventDate,
            ':detail_link' => $detailLink !== '' ? $detailLink : null,
            ':note' => $note !== '' ? $note : null,
            ':cover_path' => $uploadedCover['coverPath'],
            ':cover_url' => $uploadedCover['coverUrl'],
            ':cover_original_name' => $uploadedCover['coverOriginalName'],
            ':cover_mime' => $uploadedCover['coverMime'],
            ':cover_size' => $uploadedCover['coverSize'],
            ':status' => $status !== '' ? $status : 'draft',
            ':payload_json' => $payloadJson,
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $galleryId = (int) $pdo->lastInsertId();

        respond(201, [
            'success' => true,
            'message' => $status === 'published'
                ? 'Galeri berhasil disimpan ke SQLite.'
                : 'Draft galeri berhasil disimpan ke SQLite.',
            'database' => $databasePath,
            'data' => [
                'id' => $galleryId,
                'title' => $title,
                'tag' => $tag,
                'description' => $description,
                'userName' => $userName,
                'eventDate' => $eventDate,
                'detailLink' => $detailLink !== '' ? $detailLink : null,
                'note' => $note !== '' ? $note : null,
                'coverPath' => $uploadedCover['coverPath'],
                'coverUrl' => $uploadedCover['coverUrl'],
                'coverImage' => $coverPayload,
                'status' => $status !== '' ? $status : 'draft',
                'createdAt' => $now,
                'payload' => $galleryPayload,
            ],
        ]);
    }

    $statement = $pdo->prepare(
        'UPDATE gallery_submissions
         SET
            title = :title,
            tag = :tag,
            description = :description,
            user_name = :user_name,
            event_date = :event_date,
            detail_link = :detail_link,
            note = :note,
            cover_path = :cover_path,
            cover_url = :cover_url,
            cover_original_name = :cover_original_name,
            cover_mime = :cover_mime,
            cover_size = :cover_size,
            status = :status,
            payload_json = :payload_json,
            updated_at = :updated_at
         WHERE id = :id'
    );

    $statement->execute([
        ':title' => $title,
        ':tag' => $tag,
        ':description' => $description,
        ':user_name' => $userName,
        ':event_date' => $eventDate,
        ':detail_link' => $detailLink !== '' ? $detailLink : null,
        ':note' => $note !== '' ? $note : null,
        ':cover_path' => $uploadedCover['coverPath'],
        ':cover_url' => $uploadedCover['coverUrl'],
        ':cover_original_name' => $uploadedCover['coverOriginalName'],
        ':cover_mime' => $uploadedCover['coverMime'],
        ':cover_size' => $uploadedCover['coverSize'],
        ':status' => $status !== '' ? $status : 'draft',
        ':payload_json' => $payloadJson,
        ':updated_at' => $now,
        ':id' => $id,
    ]);

    respond(200, [
        'success' => true,
        'message' => 'Galeri berhasil diperbarui.',
        'database' => $databasePath,
        'data' => [
            'id' => $id,
            'coverPath' => $uploadedCover['coverPath'],
            'coverUrl' => $uploadedCover['coverUrl'],
            'coverImage' => $coverPayload,
            'payload' => $galleryPayload,
        ],
    ]);
} catch (JsonException $error) {
    respond(400, [
        'success' => false,
        'message' => 'JSON tidak valid.',
        'error' => $error->getMessage(),
    ]);
} catch (PDOException $error) {
    respond(500, [
        'success' => false,
        'message' => 'Gagal mengakses SQLite.',
        'error' => $error->getMessage(),
    ]);
} catch (Throwable $error) {
    respond(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error' => $error->getMessage(),
    ]);
}
