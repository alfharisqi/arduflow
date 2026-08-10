<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
];

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['GET', 'POST'], true)) {
    http_response_code(405);

    echo json_encode([
        'success' => false,
        'message' => 'Method tidak diizinkan.'
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    exit;
}

/*
|--------------------------------------------------------------------------
| Path project dan konfigurasi database
|--------------------------------------------------------------------------
*/

$projectRoot = dirname(__DIR__);
$configPath = $projectRoot . '/config/database.php';

$imageStoragePath = $projectRoot . '/api/support/image-storage.php';

if (file_exists($imageStoragePath)) {
    require_once $imageStoragePath;
}

$projectImageStorage = function_exists('ensureUploadStorage')
    ? ensureUploadStorage($projectRoot, 'projects')
    : null;

if (!file_exists($configPath)) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Konfigurasi database tidak ditemukan.',
        'data' => [
            'path' => $configPath,
        ],
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

    exit;
}

try {

    $databaseConfig = require $configPath;
    $sqliteConfig = $databaseConfig['sqlite'] ?? null;

    if (!is_array($sqliteConfig)) {
        throw new RuntimeException(
            'Konfigurasi SQLite tidak ditemukan.'
        );
    }

    $databasePath = trim(
        (string) ($sqliteConfig['path'] ?? '')
    );

    $busyTimeout = (int) (
        $sqliteConfig['busy_timeout_ms'] ?? 15000
    );

    if ($databasePath === '') {
        throw new RuntimeException(
            'Path database SQLite belum dikonfigurasi.'
        );
    }

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

    $databaseDirectory = dirname($databasePath);

    if (
        !is_dir($databaseDirectory)
        && !mkdir($databaseDirectory, 0775, true)
        && !is_dir($databaseDirectory)
    ) {
        throw new RuntimeException(
            'Folder database tidak dapat dibuat.'
        );
    }

    if (!is_writable($databaseDirectory)) {
        throw new RuntimeException(
            'Folder database tidak memiliki izin tulis.'
        );
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
    $pdo->exec(
        'PRAGMA busy_timeout = ' . max(15000, $busyTimeout)
    );

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
    }

    if ($method === 'GET') {

        $statement = $pdo->query(
            'SELECT *
             FROM project_submissions
             ORDER BY id DESC'
        );

        $rows = $statement->fetchAll();

        $projects = [];

        foreach ($rows as $row) {

            $payload = json_decode(
                $row['payload_json'],
                true
            ) ?: [];

            $projects[] = [
                'id' => (int) $row['id'],

                'title' =>
                    $row['title'],

                'category' =>
                    $row['category'],

                'description' =>
                    $row['description'],

                'status' =>
                    $row['status'],

                'visibility' =>
                    $row['visibility'],

                'coverImage' => [
                    'file_name' => $row['cover_image_name'] ?? null,
                    'file_type' => $row['cover_image_type'] ?? null,
                    'file_size' => isset($row['cover_image_size']) ? (int) $row['cover_image_size'] : null,
                    'file_path' => $row['cover_image_path'] ?? null,
                    'file_url' => $row['cover_image_url'] ?? null,
                ],

                'ownerName' =>
                    $payload['ownerName'] ?? 'User',

                'ownerUsername' =>
                    $payload['ownerUsername'] ?? '-',

                'userId' =>
                    $payload['userId'] ?? null,

                'difficulty' =>
                    $payload['difficulty'] ?? '',

                'estimatedTime' =>
                    $payload['estimatedTime'] ?? '',

                'programmingLanguage' =>
                    $payload['programmingLanguage'] ?? '',

                'payment' =>
                    $payload['payment'] ?? null,

                'tags' =>
                    $payload['tags'] ?? [],

                'tools' =>
                    $payload['tools'] ?? [],

                'nodes' =>
                    $payload['nodes'] ?? [],

                'steps' =>
                    $payload['steps'] ?? [],

                'viewer' =>
                    $payload['viewer'] ?? 0,

                'likes' =>
                    $payload['likes'] ?? 0,

                'saves' =>
                    $payload['saves'] ?? 0,

                'createdAt' =>
                    $row['created_at'],

                'updatedAt' =>
                    $row['updated_at'],
            ];
        }

        echo json_encode([
            'success' => true,
            'message' => 'Data proyek berhasil diambil.',
            'total' => count($projects),
            'data' => $projects
        ], JSON_UNESCAPED_UNICODE |
           JSON_UNESCAPED_SLASHES |
           JSON_PRETTY_PRINT);

        exit;
    }

    if ($method === 'POST') {

        $rawJson = file_get_contents('php://input');

        if (
            $rawJson === false ||
            trim($rawJson) === ''
        ) {
            throw new InvalidArgumentException(
                'Body JSON tidak boleh kosong.'
            );
        }

        $data = json_decode(
            $rawJson,
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        if (!is_array($data)) {
            throw new InvalidArgumentException(
                'Struktur JSON harus berupa object.'
            );
        }

        $project =
            isset($data['data']) &&
            is_array($data['data'])
                ? $data['data']
                : $data;

        $title = trim(
            (string) ($project['title'] ?? '')
        );

        $category = trim(
            (string) ($project['category'] ?? '')
        );

        $description = trim(
            (string) ($project['description'] ?? '')
        );

        $status = trim(
            (string) ($project['status'] ?? 'draft')
        );

        $visibility = trim(
            (string) ($project['visibility'] ?? 'draft')
        );

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

        $coverImage = function_exists('normalizeStoredImage')
            ? normalizeStoredImage(
                $coverImageData,
                $GLOBALS['projectImageStorage'] ?? [
                    'path' => $projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'projects',
                    'url' => '/uploads/projects',
                ],
                'project-cover'
            )
            : null;

        if ($coverImage !== null) {
            $project['coverImage'] = $coverImage;
        }

        $errors = [];

        if ($title === '') {
            $errors['title'] =
                'Judul proyek wajib diisi.';
        }

        if ($category === '') {
            $errors['category'] =
                'Kategori proyek wajib diisi.';
        }

        if ($description === '') {
            $errors['description'] =
                'Deskripsi proyek wajib diisi.';
        }

        if ($errors !== []) {

            http_response_code(422);

            echo json_encode([
                'success' => false,
                'message' =>
                    'Validasi data proyek gagal.',
                'errors' => $errors
            ], JSON_UNESCAPED_UNICODE |
               JSON_PRETTY_PRINT);

            exit;
        }

        $now = (
            new DateTimeImmutable(
                'now',
                new DateTimeZone('Asia/Jakarta')
            )
        )->format(DateTimeInterface::ATOM);

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
                :payload_json,
                :created_at,
                :updated_at
            )'
        );

        $statement->execute([
            ':title' =>
                $title,

            ':category' =>
                $category,

            ':description' =>
                $description,

            ':status' =>
                $status !== ''
                    ? $status
                    : 'draft',

            ':visibility' =>
                $visibility !== ''
                    ? $visibility
                    : 'draft',

            ':cover_image_name' =>
                $coverImage['file_name'] ?? null,

            ':cover_image_type' =>
                $coverImage['file_type'] ?? null,

            ':cover_image_size' =>
                $coverImage['file_size'] ?? null,

            ':cover_image_path' =>
                $coverImage['file_path'] ?? null,

            ':cover_image_url' =>
                $coverImage['file_url'] ?? null,

            ':payload_json' =>
                $payloadJson,

            ':created_at' =>
                $now,

            ':updated_at' =>
                $now,
        ]);

        $projectId =
            (int) $pdo->lastInsertId();

        http_response_code(201);

        echo json_encode([
            'success' => true,
            'message' =>
                'Proyek berhasil disimpan ke SQLite.',
            'data' => [
                'id' =>
                    $projectId,

                'title' =>
                    $title,

                'category' =>
                    $category,

                'description' =>
                    $description,

                'status' =>
                    $status !== ''
                        ? $status
                        : 'draft',

                'visibility' =>
                    $visibility !== ''
                        ? $visibility
                        : 'draft',

                'coverImage' =>
                    $coverImage,

                'createdAt' =>
                    $now,

                'payload' =>
                    $project
            ]
        ], JSON_UNESCAPED_UNICODE |
           JSON_UNESCAPED_SLASHES |
           JSON_PRETTY_PRINT);

        exit;
    }

} catch (JsonException $error) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'JSON tidak valid.',
        'error' => $error->getMessage()
    ], JSON_UNESCAPED_UNICODE |
       JSON_PRETTY_PRINT);

} catch (InvalidArgumentException $error) {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => $error->getMessage()
    ], JSON_UNESCAPED_UNICODE |
       JSON_PRETTY_PRINT);

} catch (PDOException $error) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' =>
            'Gagal mengakses SQLite.',
        'error' =>
            $error->getMessage()
    ], JSON_UNESCAPED_UNICODE |
       JSON_PRETTY_PRINT);

} catch (Throwable $error) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' =>
            'Terjadi kesalahan pada server.',
        'error' =>
            $error->getMessage()
    ], JSON_UNESCAPED_UNICODE |
       JSON_PRETTY_PRINT);
}
