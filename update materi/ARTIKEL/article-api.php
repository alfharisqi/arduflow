<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$origin = isset($_SERVER['HTTP_ORIGIN']) ? trim((string) $_SERVER['HTTP_ORIGIN']) : '';

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
    '#^http://(localhost|127\.0\.0\.1|192\.168\.[0-9]+\.[0-9]+|10\.[0-9]+\.[0-9]+\.[0-9]+|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]+\.[0-9]+):[0-9]+$#',
    $origin
) === 1;

if ($origin !== '' && (in_array($origin, $allowedOrigins, true) || $isLocalOrigin)) {
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

require_once dirname(__DIR__) . '/config/database.php';

if (!function_exists('getDatabaseConnection')) {
    function getDatabaseConnection(): PDO
    {
        $config = require dirname(__DIR__) . '/config/database.php';

        if (!is_array($config) || !isset($config['sqlite'])) {
            throw new RuntimeException('Konfigurasi SQLite tidak ditemukan.');
        }

        $sqliteConfig = is_array($config['sqlite']) ? $config['sqlite'] : [];
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

function sendJsonResponse(array $payload, int $statusCode = 200): never
{
    http_response_code($statusCode);

    echo json_encode(
        $payload,
        JSON_UNESCAPED_UNICODE
        | JSON_UNESCAPED_SLASHES
        | JSON_INVALID_UTF8_SUBSTITUTE
    );

    exit;
}

function nowIso(): string
{
    return date(DATE_ATOM);
}

function getRequestScheme(): string
{
    $forwardedProto = strtolower(trim((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')));

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
    $host = trim((string) ($_SERVER['HTTP_HOST'] ?? '127.0.0.1:8000'));

    return getRequestScheme() . '://' . $host . '/api';
}

function getArticleUploadDirectory(): string
{
    return dirname(__DIR__)
        . DIRECTORY_SEPARATOR
        . 'storage'
        . DIRECTORY_SEPARATOR
        . 'uploads'
        . DIRECTORY_SEPARATOR
        . 'articles';
}

function getCoverPath(?string $fileName): ?string
{
    if ($fileName === null || trim($fileName) === '') {
        return null;
    }

    return getArticleUploadDirectory()
        . DIRECTORY_SEPARATOR
        . basename($fileName);
}

function getCoverUrl(?string $fileName): ?string
{
    if ($fileName === null || trim($fileName) === '') {
        return null;
    }

    return getApiBaseUrl()
        . '/article-api.php?action=image&file='
        . rawurlencode(basename($fileName));
}

function serveStoredImage(): never
{
    $requestedFile = trim((string) ($_GET['file'] ?? ''));

    if ($requestedFile === '') {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Parameter file wajib diisi.',
            ],
            400
        );
    }

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

    $filePath = getCoverPath($fileName);

    if ($filePath === null || !is_file($filePath) || !is_readable($filePath)) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Cover artikel tidak ditemukan.',
            ],
            404
        );
    }

    $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

    $mimeTypes = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
    ];

    header_remove('Content-Type');
    header('Content-Type: ' . ($mimeTypes[$extension] ?? 'application/octet-stream'));
    header('Content-Length: ' . (string) filesize($filePath));
    header('Cache-Control: public, max-age=3600');
    header('X-Content-Type-Options: nosniff');

    readfile($filePath);
    exit;
}

function createTables(PDO $database): void
{
    $database->exec(
        'CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            category TEXT NOT NULL,
            author TEXT NOT NULL DEFAULT "Admin ArduFlow",
            excerpt TEXT NOT NULL DEFAULT "",
            content TEXT NOT NULL,
            cover_image_name TEXT,
            cover_image_type TEXT,
            cover_image_size INTEGER,
            tags TEXT NOT NULL DEFAULT "[]",
            status TEXT NOT NULL DEFAULT "draft",
            featured INTEGER NOT NULL DEFAULT 0,
            viewer INTEGER NOT NULL DEFAULT 0,
            published_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );

    $database->exec(
        'CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug
         ON articles (slug)'
    );

    $database->exec(
        'CREATE INDEX IF NOT EXISTS idx_articles_status
         ON articles (status, published_at)'
    );

    $database->exec(
        'CREATE INDEX IF NOT EXISTS idx_articles_category
         ON articles (category)'
    );
}

function slugify(string $value): string
{
    $value = trim($value);

    if ($value === '') {
        return '';
    }

    if (function_exists('iconv')) {
        $converted = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);

        if (is_string($converted) && $converted !== '') {
            $value = $converted;
        }
    }

    $value = strtolower($value);
    $value = preg_replace('/[^a-z0-9]+/i', '-', $value) ?? '';
    $value = trim($value, '-');

    return $value;
}

function normalizeStatus(mixed $value): string
{
    $status = strtolower(trim((string) $value));

    if (in_array($status, ['draft', 'published', 'archived'], true)) {
        return $status;
    }

    return 'draft';
}

function normalizeTags(mixed $value): array
{
    if (is_string($value)) {
        $trimmed = trim($value);

        if ($trimmed === '') {
            return [];
        }

        $decoded = json_decode($trimmed, true);

        if (is_array($decoded)) {
            $value = $decoded;
        } else {
            $value = preg_split('/[,;]/', $trimmed) ?: [];
        }
    }

    if (!is_array($value)) {
        return [];
    }

    $tags = [];

    foreach ($value as $tag) {
        $tag = trim((string) $tag);

        if ($tag !== '') {
            $tags[] = $tag;
        }
    }

    return array_values(array_unique($tags));
}

function boolToInt(mixed $value): int
{
    if (is_bool($value)) {
        return $value ? 1 : 0;
    }

    if (is_int($value)) {
        return $value === 0 ? 0 : 1;
    }

    return in_array(
        strtolower(trim((string) $value)),
        ['1', 'true', 'yes', 'on'],
        true
    ) ? 1 : 0;
}

function readArticleRequest(): array
{
    if (
        isset($_POST['payload'])
        && is_string($_POST['payload'])
        && trim($_POST['payload']) !== ''
    ) {
        $decoded = json_decode($_POST['payload'], true);

        if (!is_array($decoded)) {
            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Payload multipart bukan JSON yang valid.',
                ],
                400
            );
        }

        return $decoded;
    }

    $rawBody = file_get_contents('php://input');

    if (is_string($rawBody) && trim($rawBody) !== '') {
        $decoded = json_decode($rawBody, true);

        if (!is_array($decoded)) {
            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Body request harus berupa JSON yang valid.',
                ],
                400
            );
        }

        return $decoded;
    }

    if ($_POST !== []) {
        return $_POST;
    }

    return [];
}

function validateArticle(array $request): array
{
    $errors = [];

    $title = trim((string) ($request['title'] ?? ''));
    $slug = slugify((string) ($request['slug'] ?? $title));
    $category = trim((string) ($request['category'] ?? ''));
    $content = trim((string) ($request['content'] ?? ''));

    if (mb_strlen($title) < 3) {
        $errors['title'] = 'Judul artikel minimal 3 karakter.';
    }

    if ($slug === '') {
        $errors['slug'] = 'Slug artikel wajib diisi.';
    }

    if ($category === '') {
        $errors['category'] = 'Kategori artikel wajib diisi.';
    }

    if ($content === '') {
        $errors['content'] = 'Isi artikel wajib diisi.';
    }

    return $errors;
}

function saveUploadedCover(array $uploadedFile): array
{
    $uploadError = (int) ($uploadedFile['error'] ?? UPLOAD_ERR_NO_FILE);

    if ($uploadError === UPLOAD_ERR_NO_FILE) {
        throw new RuntimeException('Cover belum dipilih.');
    }

    if ($uploadError !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Upload cover gagal. Kode: ' . $uploadError);
    }

    $temporaryPath = (string) ($uploadedFile['tmp_name'] ?? '');

    if ($temporaryPath === '' || !is_uploaded_file($temporaryPath)) {
        throw new RuntimeException('Temporary file cover tidak valid.');
    }

    $size = (int) ($uploadedFile['size'] ?? 0);

    if ($size <= 0) {
        throw new RuntimeException('Ukuran cover tidak valid.');
    }

    if ($size > 5 * 1024 * 1024) {
        throw new RuntimeException('Ukuran cover maksimal 5 MB.');
    }

    $originalName = (string) ($uploadedFile['name'] ?? 'cover');
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    $allowed = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
    ];

    if (!isset($allowed[$extension])) {
        throw new RuntimeException('Cover harus JPG, JPEG, PNG, atau WEBP.');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $detectedMime = (string) $finfo->file($temporaryPath);

    if (!in_array($detectedMime, array_values($allowed), true)) {
        throw new RuntimeException('Tipe file cover tidak valid.');
    }

    $directory = getArticleUploadDirectory();

    if (
        !is_dir($directory)
        && !mkdir($directory, 0775, true)
        && !is_dir($directory)
    ) {
        throw new RuntimeException('Folder upload artikel gagal dibuat.');
    }

    if (!is_writable($directory)) {
        throw new RuntimeException('Folder upload artikel tidak dapat ditulis.');
    }

    $fileName = 'article_' . date('Ymd_His') . '_' . bin2hex(random_bytes(8)) . '.' . $extension;
    $destination = $directory . DIRECTORY_SEPARATOR . $fileName;

    if (!move_uploaded_file($temporaryPath, $destination)) {
        throw new RuntimeException('Cover artikel gagal disimpan.');
    }

    return [
        'file_name' => $fileName,
        'file_type' => $detectedMime,
        'file_size' => $size,
        'file_path' => $destination,
    ];
}

function deleteCoverFile(?string $fileName): void
{
    $path = getCoverPath($fileName);

    if ($path !== null && is_file($path)) {
        @unlink($path);
    }
}

function mapArticle(array $row): array
{
    $row['id'] = (int) ($row['id'] ?? 0);
    $row['featured'] = (bool) ($row['featured'] ?? 0);
    $row['viewer'] = (int) ($row['viewer'] ?? 0);

    $decodedTags = json_decode((string) ($row['tags'] ?? '[]'), true);
    $row['tags'] = is_array($decodedTags) ? array_values($decodedTags) : [];

    $coverName = isset($row['cover_image_name'])
        ? (string) $row['cover_image_name']
        : null;

    $row['cover_image_url'] = getCoverUrl($coverName);

    return $row;
}

function findArticleById(PDO $database, int $id): ?array
{
    $statement = $database->prepare(
        'SELECT * FROM articles WHERE id = :id LIMIT 1'
    );

    $statement->execute([':id' => $id]);

    $row = $statement->fetch();

    return is_array($row) ? $row : null;
}

function assertUniqueSlug(PDO $database, string $slug, ?int $exceptId = null): void
{
    if ($exceptId !== null) {
        $statement = $database->prepare(
            'SELECT id FROM articles
             WHERE slug = :slug AND id != :id
             LIMIT 1'
        );

        $statement->execute([
            ':slug' => $slug,
            ':id' => $exceptId,
        ]);
    } else {
        $statement = $database->prepare(
            'SELECT id FROM articles WHERE slug = :slug LIMIT 1'
        );

        $statement->execute([':slug' => $slug]);
    }

    if ($statement->fetch()) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Slug artikel sudah digunakan.',
                'errors' => [
                    'slug' => 'Gunakan slug yang berbeda.',
                ],
            ],
            409
        );
    }
}

function getArticles(PDO $database): never
{
    $requestedId = isset($_GET['id'])
        ? filter_var($_GET['id'], FILTER_VALIDATE_INT)
        : null;

    $requestedSlug = trim((string) ($_GET['slug'] ?? ''));

    $sql = 'SELECT * FROM articles';
    $parameters = [];

    if ($requestedId !== null && $requestedId !== false && $requestedId > 0) {
        $sql .= ' WHERE id = :id';
        $parameters[':id'] = (int) $requestedId;
    } elseif ($requestedSlug !== '') {
        $sql .= ' WHERE slug = :slug';
        $parameters[':slug'] = $requestedSlug;
    }

    $sql .= ' ORDER BY
        CASE WHEN status = "published" THEN 0 ELSE 1 END ASC,
        COALESCE(published_at, created_at) DESC,
        id DESC';

    $statement = $database->prepare($sql);
    $statement->execute($parameters);

    $rows = array_map('mapArticle', $statement->fetchAll());

    sendJsonResponse([
        'success' => true,
        'message' => 'Data artikel berhasil diambil.',
        'data' => $rows,
        'total' => count($rows),
    ]);
}

function createArticle(PDO $database): never
{
    $request = readArticleRequest();
    $errors = validateArticle($request);

    if ($errors !== []) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Form artikel belum lengkap.',
                'errors' => $errors,
            ],
            422
        );
    }

    $title = trim((string) $request['title']);
    $slug = slugify((string) ($request['slug'] ?? $title));
    $category = trim((string) $request['category']);
    $author = trim((string) ($request['author'] ?? 'Admin ArduFlow')) ?: 'Admin ArduFlow';
    $excerpt = trim((string) ($request['excerpt'] ?? ''));
    $content = (string) $request['content'];
    $tags = normalizeTags($request['tags'] ?? []);
    $status = normalizeStatus($request['status'] ?? 'draft');
    $featured = boolToInt($request['featured'] ?? false);
    $timestamp = nowIso();
    $publishedAt = $status === 'published' ? $timestamp : null;

    assertUniqueSlug($database, $slug);

    $uploadedCover = null;

    if (
        isset($_FILES['cover_image'])
        && is_array($_FILES['cover_image'])
        && (int) ($_FILES['cover_image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE
    ) {
        try {
            $uploadedCover = saveUploadedCover($_FILES['cover_image']);
        } catch (Throwable $error) {
            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Cover artikel gagal diupload.',
                    'errors' => [
                        'cover_image' => $error->getMessage(),
                    ],
                ],
                422
            );
        }
    }

    try {
        $database->beginTransaction();

        $statement = $database->prepare(
            'INSERT INTO articles (
                title,
                slug,
                category,
                author,
                excerpt,
                content,
                cover_image_name,
                cover_image_type,
                cover_image_size,
                tags,
                status,
                featured,
                viewer,
                published_at,
                created_at,
                updated_at
            ) VALUES (
                :title,
                :slug,
                :category,
                :author,
                :excerpt,
                :content,
                :cover_image_name,
                :cover_image_type,
                :cover_image_size,
                :tags,
                :status,
                :featured,
                0,
                :published_at,
                :created_at,
                :updated_at
            )'
        );

        $statement->execute([
            ':title' => $title,
            ':slug' => $slug,
            ':category' => $category,
            ':author' => $author,
            ':excerpt' => $excerpt,
            ':content' => $content,
            ':cover_image_name' => $uploadedCover['file_name'] ?? null,
            ':cover_image_type' => $uploadedCover['file_type'] ?? null,
            ':cover_image_size' => $uploadedCover['file_size'] ?? null,
            ':tags' => json_encode($tags, JSON_UNESCAPED_UNICODE),
            ':status' => $status,
            ':featured' => $featured,
            ':published_at' => $publishedAt,
            ':created_at' => $timestamp,
            ':updated_at' => $timestamp,
        ]);

        $articleId = (int) $database->lastInsertId();

        $database->commit();

        $article = findArticleById($database, $articleId);

        sendJsonResponse(
            [
                'success' => true,
                'message' => $status === 'published'
                    ? 'Artikel berhasil dipublikasikan.'
                    : 'Draft artikel berhasil disimpan.',
                'data' => $article ? mapArticle($article) : ['id' => $articleId],
            ],
            201
        );
    } catch (Throwable $error) {
        if ($database->inTransaction()) {
            $database->rollBack();
        }

        if ($uploadedCover !== null) {
            deleteCoverFile($uploadedCover['file_name'] ?? null);
        }

        throw $error;
    }
}

function updateArticle(PDO $database): never
{
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);

    if ($id === false || $id === null || $id < 1) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'ID artikel tidak valid.',
            ],
            400
        );
    }

    $existing = findArticleById($database, (int) $id);

    if ($existing === null) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Artikel tidak ditemukan.',
            ],
            404
        );
    }

    $request = readArticleRequest();

    $merged = [
        'title' => $request['title'] ?? $existing['title'],
        'slug' => $request['slug'] ?? $existing['slug'],
        'category' => $request['category'] ?? $existing['category'],
        'author' => $request['author'] ?? $existing['author'],
        'excerpt' => $request['excerpt'] ?? $existing['excerpt'],
        'content' => $request['content'] ?? $existing['content'],
        'tags' => $request['tags'] ?? $existing['tags'],
        'status' => $request['status'] ?? $existing['status'],
        'featured' => $request['featured'] ?? $existing['featured'],
    ];

    $errors = validateArticle($merged);

    if ($errors !== []) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Form artikel belum lengkap.',
                'errors' => $errors,
            ],
            422
        );
    }

    $title = trim((string) $merged['title']);
    $slug = slugify((string) $merged['slug']);
    $category = trim((string) $merged['category']);
    $author = trim((string) $merged['author']) ?: 'Admin ArduFlow';
    $excerpt = trim((string) $merged['excerpt']);
    $content = (string) $merged['content'];
    $tags = normalizeTags($merged['tags']);
    $status = normalizeStatus($merged['status']);
    $featured = boolToInt($merged['featured']);
    $timestamp = nowIso();

    $publishedAt = $status === 'published'
        ? ((string) ($existing['published_at'] ?? '') !== ''
            ? (string) $existing['published_at']
            : $timestamp)
        : null;

    assertUniqueSlug($database, $slug, (int) $id);

    $newCover = null;

    $coverName = $existing['cover_image_name'] ?? null;
    $coverType = $existing['cover_image_type'] ?? null;
    $coverSize = $existing['cover_image_size'] ?? null;

    if (
        isset($_FILES['cover_image'])
        && is_array($_FILES['cover_image'])
        && (int) ($_FILES['cover_image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE
    ) {
        try {
            $newCover = saveUploadedCover($_FILES['cover_image']);
            $coverName = $newCover['file_name'];
            $coverType = $newCover['file_type'];
            $coverSize = $newCover['file_size'];
        } catch (Throwable $error) {
            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Cover artikel gagal diupload.',
                    'errors' => [
                        'cover_image' => $error->getMessage(),
                    ],
                ],
                422
            );
        }
    }

    if (boolToInt($request['remove_cover'] ?? false) === 1) {
        $coverName = null;
        $coverType = null;
        $coverSize = null;
    }

    try {
        $database->beginTransaction();

        $statement = $database->prepare(
            'UPDATE articles SET
                title = :title,
                slug = :slug,
                category = :category,
                author = :author,
                excerpt = :excerpt,
                content = :content,
                cover_image_name = :cover_image_name,
                cover_image_type = :cover_image_type,
                cover_image_size = :cover_image_size,
                tags = :tags,
                status = :status,
                featured = :featured,
                published_at = :published_at,
                updated_at = :updated_at
             WHERE id = :id'
        );

        $statement->execute([
            ':title' => $title,
            ':slug' => $slug,
            ':category' => $category,
            ':author' => $author,
            ':excerpt' => $excerpt,
            ':content' => $content,
            ':cover_image_name' => $coverName,
            ':cover_image_type' => $coverType,
            ':cover_image_size' => $coverSize,
            ':tags' => json_encode($tags, JSON_UNESCAPED_UNICODE),
            ':status' => $status,
            ':featured' => $featured,
            ':published_at' => $publishedAt,
            ':updated_at' => $timestamp,
            ':id' => (int) $id,
        ]);

        $database->commit();

        $oldCoverName = $existing['cover_image_name'] ?? null;

        if (
            $oldCoverName
            && (
                ($newCover !== null && $oldCoverName !== $coverName)
                || $coverName === null
            )
        ) {
            deleteCoverFile((string) $oldCoverName);
        }

        $article = findArticleById($database, (int) $id);

        sendJsonResponse([
            'success' => true,
            'message' => $status === 'published'
                ? 'Artikel berhasil diperbarui dan dipublikasikan.'
                : 'Artikel berhasil diperbarui.',
            'data' => $article ? mapArticle($article) : ['id' => (int) $id],
        ]);
    } catch (Throwable $error) {
        if ($database->inTransaction()) {
            $database->rollBack();
        }

        if ($newCover !== null) {
            deleteCoverFile($newCover['file_name'] ?? null);
        }

        throw $error;
    }
}

function deleteArticle(PDO $database): never
{
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);

    if ($id === false || $id === null || $id < 1) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'ID artikel tidak valid.',
            ],
            400
        );
    }

    $existing = findArticleById($database, (int) $id);

    if ($existing === null) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Artikel tidak ditemukan.',
            ],
            404
        );
    }

    $statement = $database->prepare(
        'DELETE FROM articles WHERE id = :id'
    );

    $statement->execute([':id' => (int) $id]);

    deleteCoverFile(
        isset($existing['cover_image_name'])
            ? (string) $existing['cover_image_name']
            : null
    );

    sendJsonResponse([
        'success' => true,
        'message' => 'Artikel berhasil dihapus.',
        'data' => [
            'id' => (int) $id,
        ],
    ]);
}

function incrementViewer(PDO $database): never
{
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);

    if ($id === false || $id === null || $id < 1) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'ID artikel tidak valid.',
            ],
            400
        );
    }

    $statement = $database->prepare(
        'UPDATE articles
         SET viewer = viewer + 1
         WHERE id = :id'
    );

    $statement->execute([':id' => (int) $id]);

    if ($statement->rowCount() === 0) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Artikel tidak ditemukan.',
            ],
            404
        );
    }

    sendJsonResponse([
        'success' => true,
        'message' => 'Viewer artikel diperbarui.',
    ]);
}

if (
    $_SERVER['REQUEST_METHOD'] === 'GET'
    && ($_GET['action'] ?? '') === 'image'
) {
    serveStoredImage();
}

try {
    $database = getDatabaseConnection();
    createTables($database);

    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            getArticles($database);
            break;

        case 'POST':
            if (($_GET['action'] ?? '') === 'view') {
                incrementViewer($database);
            }

            if (isset($_GET['id'])) {
                updateArticle($database);
            }

            createArticle($database);
            break;

        case 'PUT':
            updateArticle($database);
            break;

        case 'DELETE':
            deleteArticle($database);
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
