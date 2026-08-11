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
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'POST' && isset($_POST['_method'])) {
    $methodOverride = strtoupper((string) $_POST['_method']);

    if (in_array($methodOverride, ['PUT', 'PATCH', 'DELETE'], true)) {
        $method = $methodOverride;
    }
}

if (!in_array($method, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    header('Allow: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    sendJson(405, [
        'success' => false,
        'message' => 'Method tidak diizinkan.',
    ]);
}

function sendJson(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode(
        $payload,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES |
        JSON_PRETTY_PRINT
    );
    exit;
}

function getProjectId(): ?int
{
    if (!isset($_GET['id']) || $_GET['id'] === '') {
        return null;
    }

    $id = filter_var($_GET['id'], FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1],
    ]);

    if ($id === false) {
        throw new InvalidArgumentException('ID proyek tidak valid.');
    }

    return (int) $id;
}

function readJsonBody(): array
{
    $rawJson = file_get_contents('php://input');

    if ($rawJson === false || trim($rawJson) === '') {
        throw new InvalidArgumentException('Body JSON tidak boleh kosong.');
    }

    $data = json_decode($rawJson, true, 512, JSON_THROW_ON_ERROR);

    if (!is_array($data)) {
        throw new InvalidArgumentException('Struktur JSON harus berupa object.');
    }

    return isset($data['data']) && is_array($data['data'])
        ? $data['data']
        : $data;
}

function readProjectBody(): array
{
    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));

    if (str_contains($contentType, 'multipart/form-data')) {
        $rawPayload = (string) ($_POST['payload'] ?? $_POST['data'] ?? '');

        if (trim($rawPayload) === '') {
            throw new InvalidArgumentException('Payload proyek tidak boleh kosong.');
        }

        $data = json_decode($rawPayload, true, 512, JSON_THROW_ON_ERROR);

        if (!is_array($data)) {
            throw new InvalidArgumentException('Struktur payload proyek harus berupa object.');
        }

        return isset($data['data']) && is_array($data['data'])
            ? $data['data']
            : $data;
    }

    return readJsonBody();
}

function resolveDatabasePath(string $projectRoot, array $databaseConfig): array
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
        $databasePath = $projectRoot . DIRECTORY_SEPARATOR . str_replace(
            ['/', '\\'],
            DIRECTORY_SEPARATOR,
            $databasePath
        );
    }

    return [$databasePath, $busyTimeout];
}

function jakartaNow(): string
{
    return (new DateTimeImmutable(
        'now',
        new DateTimeZone('Asia/Jakarta')
    ))->format(DateTimeInterface::ATOM);
}

function ensureProjectTables(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS project_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT "draft",
            visibility TEXT NOT NULL DEFAULT "draft",
            cover_image_name TEXT,
            cover_image_type TEXT,
            cover_image_size INTEGER,
            cover_image_path TEXT,
            cover_image_url TEXT,
            project_file_name TEXT,
            project_file_type TEXT,
            project_file_size INTEGER,
            project_file_path TEXT,
            project_file_url TEXT,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );

    if (function_exists('addColumnIfMissing')) {
        addColumnIfMissing($pdo, 'project_submissions', 'cover_image_name', 'TEXT');
        addColumnIfMissing($pdo, 'project_submissions', 'cover_image_type', 'TEXT');
        addColumnIfMissing($pdo, 'project_submissions', 'cover_image_size', 'INTEGER');
        addColumnIfMissing($pdo, 'project_submissions', 'cover_image_path', 'TEXT');
        addColumnIfMissing($pdo, 'project_submissions', 'cover_image_url', 'TEXT');
        addColumnIfMissing($pdo, 'project_submissions', 'project_file_name', 'TEXT');
        addColumnIfMissing($pdo, 'project_submissions', 'project_file_type', 'TEXT');
        addColumnIfMissing($pdo, 'project_submissions', 'project_file_size', 'INTEGER');
        addColumnIfMissing($pdo, 'project_submissions', 'project_file_path', 'TEXT');
        addColumnIfMissing($pdo, 'project_submissions', 'project_file_url', 'TEXT');
    }
}

function hasStoredFile(?array $file): bool
{
    return $file !== null && trim((string) ($file['file_name'] ?? $file['name'] ?? '')) !== '';
}

function rowToProject(array $row): array
{
    $payload = json_decode((string) ($row['payload_json'] ?? '{}'), true);
    $payload = is_array($payload) ? $payload : [];

    $coverImage = [
        'file_name' => $row['cover_image_name'] ?? null,
        'file_type' => $row['cover_image_type'] ?? null,
        'file_size' => isset($row['cover_image_size']) ? (int) $row['cover_image_size'] : null,
        'file_path' => $row['cover_image_path'] ?? null,
        'file_url' => $row['cover_image_url'] ?? null,
    ];
    $projectFile = [
        'file_name' => $row['project_file_name'] ?? null,
        'file_type' => $row['project_file_type'] ?? null,
        'file_size' => isset($row['project_file_size']) ? (int) $row['project_file_size'] : null,
        'file_path' => $row['project_file_path'] ?? null,
        'file_url' => $row['project_file_url'] ?? null,
    ];
    $payloadCoverImage = isset($payload['coverImage']) && is_array($payload['coverImage'])
        ? $payload['coverImage']
        : [];
    $payloadProjectFile = isset($payload['projectFile']) && is_array($payload['projectFile'])
        ? $payload['projectFile']
        : [];

    return [
        'id' => (int) $row['id'],
        'title' => $row['title'],
        'category' => $row['category'],
        'description' => $row['description'],
        'status' => $row['status'],
        'visibility' => $row['visibility'],
        'coverImage' => hasStoredFile($coverImage) ? array_replace($payloadCoverImage, $coverImage) : ($payload['coverImage'] ?? null),
        'projectFile' => hasStoredFile($projectFile) ? array_replace($payloadProjectFile, $projectFile) : ($payload['projectFile'] ?? null),
        'ownerName' => $payload['ownerName'] ?? 'User',
        'ownerUsername' => $payload['ownerUsername'] ?? '-',
        'userId' => $payload['userId'] ?? null,
        'difficulty' => $payload['difficulty'] ?? '',
        'estimatedTime' => $payload['estimatedTime'] ?? '',
        'programmingLanguage' => $payload['programmingLanguage'] ?? '',
        'payment' => $payload['payment'] ?? null,
        'tags' => $payload['tags'] ?? [],
        'tools' => $payload['tools'] ?? [],
        'nodes' => $payload['nodes'] ?? [],
        'steps' => $payload['steps'] ?? [],
        'viewer' => $payload['viewer'] ?? 0,
        'likes' => $payload['likes'] ?? 0,
        'saves' => $payload['saves'] ?? 0,
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
        'payload' => $payload,
    ];
}

function findProject(PDO $pdo, int $id): ?array
{
    $statement = $pdo->prepare(
        'SELECT * FROM project_submissions WHERE id = :id LIMIT 1'
    );
    $statement->execute([':id' => $id]);
    $row = $statement->fetch();

    return $row === false ? null : $row;
}

function validateProject(array $project): array
{
    $errors = [];

    if (trim((string) ($project['title'] ?? '')) === '') {
        $errors['title'] = 'Judul proyek wajib diisi.';
    }

    if (trim((string) ($project['category'] ?? '')) === '') {
        $errors['category'] = 'Kategori proyek wajib diisi.';
    }

    if (trim((string) ($project['description'] ?? '')) === '') {
        $errors['description'] = 'Deskripsi proyek wajib diisi.';
    }

    return $errors;
}

function extractCoverImage(array $project, array $fallbackStorage): ?array
{
    $coverImageData =
        isset($project['coverImage']) && is_array($project['coverImage'])
            ? $project['coverImage']
            : (isset($project['cover_image']) && is_array($project['cover_image'])
                ? $project['cover_image']
                : (isset($project['image']) && is_array($project['image'])
                    ? $project['image']
                    : (isset($project['thumbnail']) && is_array($project['thumbnail'])
                        ? $project['thumbnail']
                        : [])));

    return function_exists('normalizeStoredImage')
        ? normalizeStoredImage($coverImageData, $fallbackStorage, 'project-cover')
        : null;
}

function getUploadedFile(string $field): ?array
{
    $file = $_FILES[$field] ?? null;

    if (!is_array($file)) {
        return null;
    }

    $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);

    if ($error === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($error !== UPLOAD_ERR_OK) {
        throw new InvalidArgumentException('Upload file gagal. Kode error: ' . $error);
    }

    return $file;
}

function detectUploadedMimeType(array $file): string
{
    $tmpName = (string) ($file['tmp_name'] ?? '');

    if ($tmpName !== '' && is_file($tmpName) && function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);

        if ($finfo !== false) {
            $mimeType = finfo_file($finfo, $tmpName);
            finfo_close($finfo);

            if (is_string($mimeType) && $mimeType !== '') {
                return $mimeType;
            }
        }
    }

    return (string) ($file['type'] ?? 'application/octet-stream');
}

function storeUploadedFile(array $file, array $storage, string $prefix, array $allowedExtensions, int $maxBytes, bool $mustBeImage = false): array
{
    $originalName = sanitizeStoredFileName((string) ($file['name'] ?? 'upload.bin'));
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $size = (int) ($file['size'] ?? 0);
    $tmpName = (string) ($file['tmp_name'] ?? '');
    $mimeType = detectUploadedMimeType($file);

    if ($extension === '' || !in_array($extension, $allowedExtensions, true)) {
        throw new InvalidArgumentException('Format file tidak didukung.');
    }

    if ($size <= 0 || $size > $maxBytes) {
        throw new InvalidArgumentException('Ukuran file tidak valid atau melebihi batas.');
    }

    if ($mustBeImage && !str_starts_with(strtolower($mimeType), 'image/')) {
        throw new InvalidArgumentException('File cover harus berupa gambar.');
    }

    if ($tmpName === '' || !is_uploaded_file($tmpName)) {
        throw new InvalidArgumentException('File upload tidak valid.');
    }

    $storedName = sanitizeStoredFileName(
        $prefix . '-' . bin2hex(random_bytes(8)) . '.' . $extension
    );
    $absolutePath = rtrim((string) $storage['path'], DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $storedName;

    if (!move_uploaded_file($tmpName, $absolutePath)) {
        throw new RuntimeException('File upload tidak dapat disimpan.');
    }

    return [
        'file_name' => $storedName,
        'original_name' => $originalName,
        'file_type' => $mimeType,
        'file_size' => $size,
        'file_path' => $absolutePath,
        'file_url' => rtrim((string) $storage['url'], '/') . '/' . $storedName,
    ];
}

function storeUploadedCoverImage(array $storage): ?array
{
    $file = getUploadedFile('cover_image');

    return $file === null
        ? null
        : storeUploadedFile($file, $storage, 'project-cover', ['jpg', 'jpeg', 'png', 'webp'], 2 * 1024 * 1024, true);
}

function storeUploadedProjectFile(array $storage): ?array
{
    $file = getUploadedFile('project_file');

    return $file === null
        ? null
        : storeUploadedFile($file, $storage, 'project-file', ['json', 'flow'], 10 * 1024 * 1024);
}

try {
    $projectRoot = dirname(__DIR__);
    $configPath = $projectRoot . '/config/database.php';
    $imageStoragePath = $projectRoot . '/api/support/image-storage.php';

    if (file_exists($imageStoragePath)) {
        require_once $imageStoragePath;
    }

    $projectImageStorage = function_exists('ensureUploadStorage')
        ? ensureUploadStorage($projectRoot, 'projects')
        : [
            'path' => $projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'projects',
            'url' => '/uploads/projects',
        ];

    if (!file_exists($configPath)) {
        sendJson(500, [
            'success' => false,
            'message' => 'Konfigurasi database tidak ditemukan.',
            'data' => [
                'path' => $configPath,
            ],
        ]);
    }

    $databaseConfig = require $configPath;
    [$databasePath, $busyTimeout] = resolveDatabasePath($projectRoot, $databaseConfig);
    $databaseDirectory = dirname($databasePath);

    if (
        !is_dir($databaseDirectory)
        && !mkdir($databaseDirectory, 0775, true)
        && !is_dir($databaseDirectory)
    ) {
        throw new RuntimeException('Folder database tidak dapat dibuat.');
    }

    if (!is_writable($databaseDirectory)) {
        throw new RuntimeException('Folder database tidak memiliki izin tulis.');
    }

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

    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA busy_timeout = ' . max(15000, $busyTimeout));
    ensureProjectTables($pdo);

    $projectId = getProjectId();

    if ($method === 'GET') {
        if ($projectId !== null) {
            $row = findProject($pdo, $projectId);

            if ($row === null) {
                sendJson(404, [
                    'success' => false,
                    'message' => 'Proyek tidak ditemukan.',
                ]);
            }

            sendJson(200, [
                'success' => true,
                'message' => 'Detail proyek berhasil diambil.',
                'data' => rowToProject($row),
            ]);
        }

        $statement = $pdo->query(
            'SELECT * FROM project_submissions ORDER BY id DESC'
        );
        $projects = array_map('rowToProject', $statement->fetchAll());

        sendJson(200, [
            'success' => true,
            'message' => 'Data proyek berhasil diambil.',
            'total' => count($projects),
            'data' => $projects,
        ]);
    }

    if ($method === 'POST') {
        $project = readProjectBody();
        $errors = validateProject($project);

        if ($errors !== []) {
            sendJson(422, [
                'success' => false,
                'message' => 'Validasi data proyek gagal.',
                'errors' => $errors,
            ]);
        }

        $title = trim((string) $project['title']);
        $category = trim((string) $project['category']);
        $description = trim((string) $project['description']);
        $status = trim((string) ($project['status'] ?? 'draft')) ?: 'draft';
        $visibility = trim((string) ($project['visibility'] ?? 'draft')) ?: 'draft';
        $coverImage = storeUploadedCoverImage($projectImageStorage) ?? extractCoverImage($project, $projectImageStorage);
        $projectFile = storeUploadedProjectFile($projectImageStorage);

        $now = jakartaNow();
        $project['title'] = $title;
        $project['category'] = $category;
        $project['description'] = $description;
        $project['status'] = $status;
        $project['visibility'] = $visibility;

        if ($coverImage !== null) {
            $project['coverImage'] = $coverImage;
        }

        if ($projectFile !== null) {
            $project['projectFile'] = $projectFile;
        }

        $payloadJson = json_encode(
            $project,
            JSON_UNESCAPED_UNICODE |
            JSON_UNESCAPED_SLASHES |
            JSON_THROW_ON_ERROR
        );

        $statement = $pdo->prepare(
            'INSERT INTO project_submissions (
                title,
                category,
                description,
                status,
                visibility,
                cover_image_name,
                cover_image_type,
                cover_image_size,
                cover_image_path,
                cover_image_url,
                project_file_name,
                project_file_type,
                project_file_size,
                project_file_path,
                project_file_url,
                payload_json,
                created_at,
                updated_at
            ) VALUES (
                :title,
                :category,
                :description,
                :status,
                :visibility,
                :cover_image_name,
                :cover_image_type,
                :cover_image_size,
                :cover_image_path,
                :cover_image_url,
                :project_file_name,
                :project_file_type,
                :project_file_size,
                :project_file_path,
                :project_file_url,
                :payload_json,
                :created_at,
                :updated_at
            )'
        );

        $statement->execute([
            ':title' => $title,
            ':category' => $category,
            ':description' => $description,
            ':status' => $status,
            ':visibility' => $visibility,
            ':cover_image_name' => $coverImage['file_name'] ?? null,
            ':cover_image_type' => $coverImage['file_type'] ?? null,
            ':cover_image_size' => $coverImage['file_size'] ?? null,
            ':cover_image_path' => $coverImage['file_path'] ?? null,
            ':cover_image_url' => $coverImage['file_url'] ?? null,
            ':project_file_name' => $projectFile['file_name'] ?? null,
            ':project_file_type' => $projectFile['file_type'] ?? null,
            ':project_file_size' => $projectFile['file_size'] ?? null,
            ':project_file_path' => $projectFile['file_path'] ?? null,
            ':project_file_url' => $projectFile['file_url'] ?? null,
            ':payload_json' => $payloadJson,
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $newId = (int) $pdo->lastInsertId();
        $row = findProject($pdo, $newId);

        sendJson(201, [
            'success' => true,
            'message' => 'Proyek berhasil disimpan ke SQLite.',
            'data' => rowToProject($row),
        ]);
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        if ($projectId === null) {
            throw new InvalidArgumentException('Parameter id wajib diisi untuk edit proyek.');
        }

        $existingRow = findProject($pdo, $projectId);

        if ($existingRow === null) {
            sendJson(404, [
                'success' => false,
                'message' => 'Proyek yang akan diedit tidak ditemukan.',
            ]);
        }

        $incoming = readProjectBody();
        $existingPayload = json_decode((string) $existingRow['payload_json'], true);
        $existingPayload = is_array($existingPayload) ? $existingPayload : [];
        $project = array_replace_recursive($existingPayload, $incoming);

        $title = trim((string) ($incoming['title'] ?? $existingRow['title']));
        $category = trim((string) ($incoming['category'] ?? $existingRow['category']));
        $description = trim((string) ($incoming['description'] ?? $existingRow['description']));
        $status = trim((string) ($incoming['status'] ?? $existingRow['status']));
        $visibility = trim((string) ($incoming['visibility'] ?? $existingRow['visibility']));

        $project['title'] = $title;
        $project['category'] = $category;
        $project['description'] = $description;
        $project['status'] = $status !== '' ? $status : 'draft';
        $project['visibility'] = $visibility !== '' ? $visibility : 'draft';

        $errors = validateProject($project);

        if ($errors !== []) {
            sendJson(422, [
                'success' => false,
                'message' => 'Validasi data proyek gagal.',
                'errors' => $errors,
            ]);
        }

        $coverImage = storeUploadedCoverImage($projectImageStorage) ?? extractCoverImage($incoming, $projectImageStorage);
        $projectFile = storeUploadedProjectFile($projectImageStorage);

        if ($coverImage === null) {
            $coverImage = [
                'file_name' => $existingRow['cover_image_name'] ?? null,
                'file_type' => $existingRow['cover_image_type'] ?? null,
                'file_size' => isset($existingRow['cover_image_size']) ? (int) $existingRow['cover_image_size'] : null,
                'file_path' => $existingRow['cover_image_path'] ?? null,
                'file_url' => $existingRow['cover_image_url'] ?? null,
            ];
        }

        if (($coverImage['file_name'] ?? null) !== null) {
            $project['coverImage'] = $coverImage;
        }

        if ($projectFile === null) {
            $projectFile = [
                'file_name' => $existingRow['project_file_name'] ?? null,
                'file_type' => $existingRow['project_file_type'] ?? null,
                'file_size' => isset($existingRow['project_file_size']) ? (int) $existingRow['project_file_size'] : null,
                'file_path' => $existingRow['project_file_path'] ?? null,
                'file_url' => $existingRow['project_file_url'] ?? null,
            ];
        }

        if (($projectFile['file_name'] ?? null) !== null) {
            $project['projectFile'] = $projectFile;
        }

        $now = jakartaNow();
        $payloadJson = json_encode(
            $project,
            JSON_UNESCAPED_UNICODE |
            JSON_UNESCAPED_SLASHES |
            JSON_THROW_ON_ERROR
        );

        $statement = $pdo->prepare(
            'UPDATE project_submissions
             SET
                title = :title,
                category = :category,
                description = :description,
                status = :status,
                visibility = :visibility,
                cover_image_name = :cover_image_name,
                cover_image_type = :cover_image_type,
                cover_image_size = :cover_image_size,
                cover_image_path = :cover_image_path,
                cover_image_url = :cover_image_url,
                project_file_name = :project_file_name,
                project_file_type = :project_file_type,
                project_file_size = :project_file_size,
                project_file_path = :project_file_path,
                project_file_url = :project_file_url,
                payload_json = :payload_json,
                updated_at = :updated_at
             WHERE id = :id'
        );

        $statement->execute([
            ':title' => $title,
            ':category' => $category,
            ':description' => $description,
            ':status' => $project['status'],
            ':visibility' => $project['visibility'],
            ':cover_image_name' => $coverImage['file_name'] ?? null,
            ':cover_image_type' => $coverImage['file_type'] ?? null,
            ':cover_image_size' => $coverImage['file_size'] ?? null,
            ':cover_image_path' => $coverImage['file_path'] ?? null,
            ':cover_image_url' => $coverImage['file_url'] ?? null,
            ':project_file_name' => $projectFile['file_name'] ?? null,
            ':project_file_type' => $projectFile['file_type'] ?? null,
            ':project_file_size' => $projectFile['file_size'] ?? null,
            ':project_file_path' => $projectFile['file_path'] ?? null,
            ':project_file_url' => $projectFile['file_url'] ?? null,
            ':payload_json' => $payloadJson,
            ':updated_at' => $now,
            ':id' => $projectId,
        ]);

        $updatedRow = findProject($pdo, $projectId);

        sendJson(200, [
            'success' => true,
            'message' => 'Proyek berhasil diperbarui.',
            'data' => rowToProject($updatedRow),
        ]);
    }

    if ($method === 'DELETE') {
        if ($projectId === null) {
            throw new InvalidArgumentException('Parameter id wajib diisi untuk menghapus proyek.');
        }

        $existingRow = findProject($pdo, $projectId);

        if ($existingRow === null) {
            sendJson(404, [
                'success' => false,
                'message' => 'Proyek yang akan dihapus tidak ditemukan.',
            ]);
        }

        $statement = $pdo->prepare(
            'DELETE FROM project_submissions WHERE id = :id'
        );
        $statement->execute([':id' => $projectId]);

        sendJson(200, [
            'success' => true,
            'message' => 'Proyek berhasil dihapus.',
            'data' => [
                'id' => $projectId,
                'title' => $existingRow['title'],
            ],
        ]);
    }
} catch (JsonException $error) {
    sendJson(400, [
        'success' => false,
        'message' => 'JSON tidak valid.',
        'error' => $error->getMessage(),
    ]);
} catch (InvalidArgumentException $error) {
    sendJson(400, [
        'success' => false,
        'message' => $error->getMessage(),
    ]);
} catch (PDOException $error) {
    sendJson(500, [
        'success' => false,
        'message' => 'Gagal mengakses SQLite.',
        'error' => $error->getMessage(),
    ]);
} catch (Throwable $error) {
    sendJson(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error' => $error->getMessage(),
    ]);
}
