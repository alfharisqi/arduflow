<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

$origin = isset($_SERVER['HTTP_ORIGIN'])
    ? $_SERVER['HTTP_ORIGIN']
    : '';

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

if (
    in_array($origin, $allowedOrigins, true)
    || $isLocalOrigin
) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header(
    'Access-Control-Allow-Headers: Content-Type, Accept, Authorization'
);
header('Access-Control-Max-Age: 86400');

/*
|--------------------------------------------------------------------------
| OPTIONS Request
|--------------------------------------------------------------------------
*/

$requestMethod = $_SERVER['REQUEST_METHOD'] ?? '';

if ($requestMethod === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/*
|--------------------------------------------------------------------------
| Path Project
|--------------------------------------------------------------------------
|
| Contoh:
|
| website/
| └── API/
|     ├── api/
|     │   └── materihandle.php
|     ├── config/
|     │   └── database.php
|     └── storage/
|         └── database/
|             └── arduflow.sqlite
|
*/

$projectRoot = dirname(__DIR__);

$imageStoragePath = $projectRoot
    . DIRECTORY_SEPARATOR
    . 'api'
    . DIRECTORY_SEPARATOR
    . 'support'
    . DIRECTORY_SEPARATOR
    . 'image-storage.php';

if (file_exists($imageStoragePath)) {
    require_once $imageStoragePath;
}

$articleImageStorage = function_exists('ensureUploadStorage')
    ? ensureUploadStorage($projectRoot, 'articles')
    : null;

$configPath = $projectRoot
    . DIRECTORY_SEPARATOR
    . 'config'
    . DIRECTORY_SEPARATOR
    . 'database.php';

/*
|--------------------------------------------------------------------------
| Cek Config Database
|--------------------------------------------------------------------------
*/

if (!file_exists($configPath)) {
    sendJsonResponse(
        [
            'success' => false,
            'message' => 'Konfigurasi database tidak ditemukan.',
            'data' => [
                'config_path' => $configPath,
            ],
        ],
        500
    );
}

/*
|--------------------------------------------------------------------------
| Membaca config/database.php
|--------------------------------------------------------------------------
*/

$databaseConfig = require $configPath;

if (!is_array($databaseConfig)) {
    sendJsonResponse(
        [
            'success' => false,
            'message' => 'Format konfigurasi database tidak valid.',
        ],
        500
    );
}

$sqliteConfig = $databaseConfig['sqlite'] ?? null;

if (!is_array($sqliteConfig)) {
    sendJsonResponse(
        [
            'success' => false,
            'message' => 'Konfigurasi SQLite tidak ditemukan.',
        ],
        500
    );
}

/*
|--------------------------------------------------------------------------
| Ambil Path SQLite
|--------------------------------------------------------------------------
*/

$databasePath = trim(
    (string) ($sqliteConfig['path'] ?? '')
);

$busyTimeout = (int) (
    $sqliteConfig['busy_timeout_ms']
    ?? 15000
);

if ($databasePath === '') {
    sendJsonResponse(
        [
            'success' => false,
            'message' => 'Path database SQLite belum dikonfigurasi.',
        ],
        500
    );
}

/*
|--------------------------------------------------------------------------
| Deteksi Absolute Path
|--------------------------------------------------------------------------
*/

$isWindowsAbsolutePath = preg_match(
    '/^[A-Za-z]:[\\\\\/]/',
    $databasePath
) === 1;

$isUnixAbsolutePath = str_starts_with(
    $databasePath,
    '/'
);

/*
|--------------------------------------------------------------------------
| Jika Relative Path
|--------------------------------------------------------------------------
|
| Config:
|
| 'path' => 'storage/database/arduflow.sqlite'
|
| akan menjadi:
|
| website/API/storage/database/arduflow.sqlite
|
*/

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

/*
|--------------------------------------------------------------------------
| Folder Database
|--------------------------------------------------------------------------
*/

$databaseDirectory = dirname($databasePath);

if (
    !is_dir($databaseDirectory)
    && !mkdir(
        $databaseDirectory,
        0775,
        true
    )
    && !is_dir($databaseDirectory)
) {
    sendJsonResponse(
        [
            'success' => false,
            'message' => 'Folder database tidak dapat dibuat.',
            'data' => [
                'database_directory' => $databaseDirectory,
            ],
        ],
        500
    );
}

if (!is_writable($databaseDirectory)) {
    sendJsonResponse(
        [
            'success' => false,
            'message' => 'Folder database tidak memiliki izin tulis.',
            'data' => [
                'database_directory' => $databaseDirectory,
            ],
        ],
        500
    );
}

/*
|--------------------------------------------------------------------------
| Koneksi Database
|--------------------------------------------------------------------------
*/

try {
    $database = new PDO(
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

    /*
    |--------------------------------------------------------------------------
    | SQLite Settings
    |--------------------------------------------------------------------------
    */

    $database->exec(
        'PRAGMA foreign_keys = ON'
    );

    $database->exec(
        'PRAGMA journal_mode = WAL'
    );

    $database->exec(
        'PRAGMA synchronous = NORMAL'
    );

    $database->exec(
        'PRAGMA busy_timeout = '
        . max(15000, $busyTimeout)
    );

    /*
    |--------------------------------------------------------------------------
    | Pastikan Table Ada
    |--------------------------------------------------------------------------
    */

    createTables($database);

    /*
    |--------------------------------------------------------------------------
    | Routing Method
    |--------------------------------------------------------------------------
    */

    switch ($requestMethod) {
        case 'GET':
            getAllMateri($database);
            break;

        case 'POST':
            createMateri($database);
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
            'database_path' => $databasePath ?? null,
        ],
        500
    );
}

/*
|--------------------------------------------------------------------------
| Membuat Table
|--------------------------------------------------------------------------
*/

function createTables(PDO $database): void
{
    /*
    |--------------------------------------------------------------------------
    | Table Tutorials
    |--------------------------------------------------------------------------
    */

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
            card_image_path TEXT,
            card_image_url TEXT,
            difficulty_level TEXT,
            estimated_time TEXT,
            page_order INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT "draft",
            user_level TEXT NOT NULL DEFAULT "semua_pengguna",
            access_requirement TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );

    /*
    |--------------------------------------------------------------------------
    | Table Tutorial Slides
    |--------------------------------------------------------------------------
    */

    $database->exec(
        'CREATE TABLE IF NOT EXISTS tutorial_slides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tutorial_id INTEGER NOT NULL,
            slide_order INTEGER NOT NULL,
            title TEXT NOT NULL,
            content_type TEXT NOT NULL DEFAULT "text",
            content TEXT,
            image_name TEXT,
            image_path TEXT,
            image_url TEXT,
            video_url TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,

            FOREIGN KEY (tutorial_id)
                REFERENCES tutorials(id)
                ON DELETE CASCADE
        )'
    );

    if (function_exists('addColumnIfMissing')) {
        addColumnIfMissing($database, 'tutorials', 'card_image_path', 'TEXT');
        addColumnIfMissing($database, 'tutorials', 'card_image_url', 'TEXT');
        addColumnIfMissing($database, 'tutorial_slides', 'image_path', 'TEXT');
        addColumnIfMissing($database, 'tutorial_slides', 'image_url', 'TEXT');
    }
}

function readCreateMateriRequest(): array
{
    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));

    if (
        isset($_POST['payload'])
        && is_string($_POST['payload'])
        && trim($_POST['payload']) !== ''
    ) {
        $requestData = json_decode((string) $_POST['payload'], true);

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

    $rawBody = file_get_contents('php://input');

    if (is_string($rawBody) && trim($rawBody) !== '') {
        try {
            $requestData = json_decode($rawBody, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $error) {
            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Body request harus berupa JSON yang valid.',
                    'error' => $error->getMessage(),
                    'debug' => [
                        'content_type' => $contentType,
                        'body_length' => strlen($rawBody),
                    ],
                ],
                400
            );
        }

        if (!is_array($requestData)) {
            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Body request harus berupa object JSON.',
                ],
                400
            );
        }

        return $requestData;
    }

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
    $uploadError = (int) ($uploadedFile['error'] ?? UPLOAD_ERR_NO_FILE);

    if ($uploadError === UPLOAD_ERR_NO_FILE) {
        throw new RuntimeException('File gambar belum dipilih.');
    }

    if ($uploadError !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Upload gambar gagal. Kode error: ' . $uploadError);
    }

    $temporaryPath = (string) ($uploadedFile['tmp_name'] ?? '');

    if ($temporaryPath === '' || !is_uploaded_file($temporaryPath)) {
        throw new RuntimeException('Temporary file upload tidak valid.');
    }

    $fileSize = (int) ($uploadedFile['size'] ?? 0);
    $maxFileSize = 3 * 1024 * 1024;

    if ($fileSize <= 0) {
        throw new RuntimeException('Ukuran gambar tidak valid.');
    }

    if ($fileSize > $maxFileSize) {
        throw new RuntimeException('Ukuran gambar maksimal 3 MB.');
    }

    $originalName = (string) ($uploadedFile['name'] ?? 'image');
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $allowedExtensions = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'svg' => 'image/svg+xml',
    ];

    if (!isset($allowedExtensions[$extension])) {
        throw new RuntimeException('Format gambar harus JPG, JPEG, PNG, atau SVG.');
    }

    $storage = $GLOBALS['articleImageStorage'] ?? [
        'path' => dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'articles',
        'url' => '/uploads/articles',
    ];

    $uploadDirectory = (string) ($storage['path'] ?? '');

    if (
        $uploadDirectory === ''
        || (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0775, true) && !is_dir($uploadDirectory))
    ) {
        throw new RuntimeException('Folder storage/uploads/articles gagal dibuat.');
    }

    if (!is_writable($uploadDirectory)) {
        throw new RuntimeException('Folder storage/uploads/articles tidak dapat ditulis.');
    }

    $storedFileName = bin2hex(random_bytes(16)) . '.' . $extension;
    $destination = $uploadDirectory . DIRECTORY_SEPARATOR . $storedFileName;

    if (!move_uploaded_file($temporaryPath, $destination)) {
        throw new RuntimeException('Gambar gagal disimpan ke storage/uploads/articles.');
    }

    return [
        'file_name' => $storedFileName,
        'file_type' => $allowedExtensions[$extension],
        'file_size' => $fileSize,
        'file_path' => $destination,
        'file_url' => rtrim((string) ($storage['url'] ?? '/uploads/articles'), '/') . '/' . $storedFileName,
    ];
}

function deleteArticleImageFile(?string $fileName, ?string $filePath = null): bool
{
    $path = trim((string) $filePath);

    if ($path === '' && $fileName !== null && trim($fileName) !== '') {
        $storage = $GLOBALS['articleImageStorage'] ?? [
            'path' => dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'articles',
        ];

        $path = (string) ($storage['path'] ?? '')
            . DIRECTORY_SEPARATOR
            . basename($fileName);
    }

    if ($path === '' || !is_file($path)) {
        return false;
    }

    return @unlink($path);
}

/*
|--------------------------------------------------------------------------
| GET Semua Materi
|--------------------------------------------------------------------------
*/

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
            card_image_path,
            card_image_url,
            difficulty_level,
            estimated_time,
            page_order,
            status,
            user_level,
            access_requirement,
            created_at,
            updated_at
         FROM tutorials
         ORDER BY display_order ASC, id DESC'
    );

    $tutorials = $statement->fetchAll();

    /*
    |--------------------------------------------------------------------------
    | Query Slides
    |--------------------------------------------------------------------------
    */

    $slideStatement = $database->prepare(
        'SELECT
            id,
            slide_order AS "order",
            title,
            content_type,
            content,
            image_name,
            image_path,
            image_url,
            video_url
         FROM tutorial_slides
         WHERE tutorial_id = :tutorial_id
         ORDER BY slide_order ASC, id ASC'
    );

    foreach ($tutorials as &$tutorial) {
        $slideStatement->execute([
            ':tutorial_id' => $tutorial['id'],
        ]);

        $tutorial['slides'] =
            $slideStatement->fetchAll();

        $tutorial['total_slides'] =
            count($tutorial['slides']);
    }

    unset($tutorial);

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    sendJsonResponse([
        'success' => true,
        'message' => 'Data materi berhasil diambil.',
        'data' => $tutorials,
        'total' => count($tutorials),
    ]);
}

/*
|--------------------------------------------------------------------------
| POST Tambah Materi
|--------------------------------------------------------------------------
*/

function createMateri(PDO $database): void
{
    /*
    |--------------------------------------------------------------------------
    | Membaca Request
    |--------------------------------------------------------------------------
    */

    $requestData = readCreateMateriRequest();

    /*
    |--------------------------------------------------------------------------
    | Validasi
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Nested Object
    |--------------------------------------------------------------------------
    */

    $descriptions =
        isset($requestData['descriptions'])
        && is_array($requestData['descriptions'])
            ? $requestData['descriptions']
            : [];

    $cardImage =
        isset($requestData['card_image'])
        && is_array($requestData['card_image'])
            ? $requestData['card_image']
            : [];

    if (
        isset($_FILES['card_image'])
        && is_array($_FILES['card_image'])
        && (int) ($_FILES['card_image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE
    ) {
        try {
            $cardImage = saveUploadedArticleImage($_FILES['card_image']);
            $requestData['card_image'] = $cardImage;
        } catch (RuntimeException $error) {
            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Gagal mengupload gambar materi.',
                    'errors' => [
                        'card_image' => $error->getMessage(),
                    ],
                ],
                422
            );
        }
    }

    $storedCardImage = function_exists('normalizeStoredImage')
        ? normalizeStoredImage(
            $cardImage,
            $GLOBALS['articleImageStorage'] ?? [
                'path' => dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'articles',
                'url' => '/uploads/articles',
            ],
            'article-card'
        )
        : null;

    $learning =
        isset($requestData['learning_information'])
        && is_array($requestData['learning_information'])
            ? $requestData['learning_information']
            : [];

    $pageSettings =
        isset($requestData['page_settings'])
        && is_array($requestData['page_settings'])
            ? $requestData['page_settings']
            : [];

    $accessSettings =
        isset($requestData['access_settings'])
        && is_array($requestData['access_settings'])
            ? $requestData['access_settings']
            : [];

    $slides =
        isset($requestData['slides'])
        && is_array($requestData['slides'])
            ? $requestData['slides']
            : [];

    /*
    |--------------------------------------------------------------------------
    | Timestamp Jakarta
    |--------------------------------------------------------------------------
    */

    $currentTimestamp = (
        new DateTimeImmutable(
            'now',
            new DateTimeZone('Asia/Jakarta')
        )
    )->format(DateTimeInterface::ATOM);

    /*
    |--------------------------------------------------------------------------
    | Simpan Materi
    |--------------------------------------------------------------------------
    */

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
                card_image_path,
                card_image_url,
                difficulty_level,
                estimated_time,
                page_order,
                status,
                user_level,
                access_requirement,
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
                :card_image_path,
                :card_image_url,
                :difficulty_level,
                :estimated_time,
                :page_order,
                :status,
                :user_level,
                :access_requirement,
                :created_at,
                :updated_at
            )'
        );

        /*
        |--------------------------------------------------------------------------
        | Execute Tutorial
        |--------------------------------------------------------------------------
        */

        $statement->execute([
            ':title' =>
                trim(
                    (string) $requestData['title']
                ),

            ':slug' =>
                trim(
                    (string) $requestData['slug']
                ),

            ':category' =>
                (string) $requestData['category'],

            ':display_order' =>
                (int) $requestData['display_order'],

            ':short_description' =>
                trim(
                    (string) $descriptions['short_description']
                ),

            ':full_description' =>
                trim(
                    (string) $descriptions['full_description']
                ),

            ':card_image_name' =>
                isset($storedCardImage['file_name'])
                    ? (string) $storedCardImage['file_name']
                    : null,

            ':card_image_type' =>
                isset($storedCardImage['file_type'])
                    ? (string) $storedCardImage['file_type']
                    : null,

            ':card_image_size' =>
                isset($storedCardImage['file_size'])
                    ? (int) $storedCardImage['file_size']
                    : null,

            ':card_image_path' =>
                isset($storedCardImage['file_path'])
                    ? (string) $storedCardImage['file_path']
                    : null,

            ':card_image_url' =>
                isset($storedCardImage['file_url'])
                    ? (string) $storedCardImage['file_url']
                    : null,

            ':difficulty_level' =>
                isset($learning['difficulty_level'])
                    ? (string) $learning['difficulty_level']
                    : null,

            ':estimated_time' =>
                isset($learning['estimated_time'])
                    ? (string) $learning['estimated_time']
                    : null,

            ':page_order' =>
                (int) $pageSettings['page_order'],

            ':status' =>
                isset($pageSettings['status'])
                    ? (string) $pageSettings['status']
                    : 'draft',

            ':user_level' =>
                isset($accessSettings['user_level'])
                    ? (string) $accessSettings['user_level']
                    : 'semua_pengguna',

            ':access_requirement' =>
                isset($accessSettings['access_requirement'])
                && $accessSettings['access_requirement'] !== ''
                    ? (string) $accessSettings['access_requirement']
                    : null,

            ':created_at' =>
                $currentTimestamp,

            ':updated_at' =>
                $currentTimestamp,
        ]);

        /*
        |--------------------------------------------------------------------------
        | ID Tutorial
        |--------------------------------------------------------------------------
        */

        $tutorialId =
            (int) $database->lastInsertId();

        /*
        |--------------------------------------------------------------------------
        | Simpan Slides
        |--------------------------------------------------------------------------
        */

        if ($slides !== []) {
            $slideStatement = $database->prepare(
                'INSERT INTO tutorial_slides (
                    tutorial_id,
                    slide_order,
                    title,
                    content_type,
                    content,
                    image_name,
                    image_path,
                    image_url,
                    video_url,
                    created_at,
                    updated_at
                ) VALUES (
                    :tutorial_id,
                    :slide_order,
                    :title,
                    :content_type,
                    :content,
                    :image_name,
                    :image_path,
                    :image_url,
                    :video_url,
                    :created_at,
                    :updated_at
                )'
            );

            foreach ($slides as $index => $slide) {
                if (!is_array($slide)) {
                    continue;
                }

                $slideImageData = isset($slide['image'])
                    && is_array($slide['image'])
                        ? $slide['image']
                        : (isset($slide['image_meta']) && is_array($slide['image_meta'])
                            ? $slide['image_meta']
                            : (isset($slide['image_name']) ? ['file_name' => (string) $slide['image_name']] : []));

                $storedSlideImage = function_exists('normalizeStoredImage')
                    ? normalizeStoredImage(
                        $slideImageData,
                        $GLOBALS['articleImageStorage'] ?? [
                            'path' => dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'articles',
                            'url' => '/uploads/articles',
                        ],
                        'article-slide'
                    )
                    : null;

                $slideStatement->execute([
                    ':tutorial_id' =>
                        $tutorialId,

                    ':slide_order' =>
                        isset($slide['order'])
                            ? (int) $slide['order']
                            : $index + 1,

                    ':title' =>
                        isset($slide['title'])
                            ? trim(
                                (string) $slide['title']
                            )
                            : 'Slide ' . ($index + 1),

                    ':content_type' =>
                        isset($slide['content_type'])
                            ? (string) $slide['content_type']
                            : 'text',

                    ':content' =>
                        isset($slide['content'])
                            ? (string) $slide['content']
                            : null,

                    ':image_name' =>
                        isset($storedSlideImage['file_name'])
                            ? (string) $storedSlideImage['file_name']
                            : (isset($slide['image_name'])
                                ? (string) $slide['image_name']
                                : null),

                    ':image_path' =>
                        isset($storedSlideImage['file_path'])
                            ? (string) $storedSlideImage['file_path']
                            : null,

                    ':image_url' =>
                        isset($storedSlideImage['file_url'])
                            ? (string) $storedSlideImage['file_url']
                            : null,

                    ':video_url' =>
                        isset($slide['video_url'])
                            ? (string) $slide['video_url']
                            : null,

                    ':created_at' =>
                        $currentTimestamp,

                    ':updated_at' =>
                        $currentTimestamp,
                ]);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Commit
        |--------------------------------------------------------------------------
        */

        $database->commit();

        /*
        |--------------------------------------------------------------------------
        | Response Sukses
        |--------------------------------------------------------------------------
        */

        sendJsonResponse(
            [
                'success' => true,
                'message' => 'Materi berhasil ditambahkan.',
                'data' => [
                    'id' =>
                        $tutorialId,

                    'title' =>
                        trim(
                            (string) $requestData['title']
                        ),

                    'slug' =>
                        trim(
                            (string) $requestData['slug']
                        ),

                    'category' =>
                        (string) $requestData['category'],

                    'status' =>
                        isset($pageSettings['status'])
                            ? (string) $pageSettings['status']
                            : 'draft',

                    'page_order' =>
                        (int) $pageSettings['page_order'],

                    'total_slides' =>
                        count($slides),

                    'created_at' =>
                        $currentTimestamp,
                ],
            ],
            201
        );
    } catch (PDOException $error) {
        /*
        |--------------------------------------------------------------------------
        | Rollback
        |--------------------------------------------------------------------------
        */

        if ($database->inTransaction()) {
            $database->rollBack();
        }

        $errorMessage =
            strtolower($error->getMessage());

        /*
        |--------------------------------------------------------------------------
        | Slug Duplikat
        |--------------------------------------------------------------------------
        */

        if (
            strpos(
                $errorMessage,
                'unique'
            ) !== false
        ) {
            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Slug sudah digunakan.',
                    'errors' => [
                        'slug' =>
                            'Slug sudah digunakan oleh materi lain.',
                    ],
                ],
                409
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Error SQLite
        |--------------------------------------------------------------------------
        */

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

/*
|--------------------------------------------------------------------------
| PUT Edit Materi
|--------------------------------------------------------------------------
*/

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
                'errors' => [
                    'id' => 'Parameter id wajib berupa angka positif.',
                ],
            ],
            400
        );
    }

    $checkStatement = $database->prepare(
        'SELECT
            id,
            card_image_name,
            card_image_type,
            card_image_size,
            card_image_path,
            card_image_url,
            created_at
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
                'data' => null,
            ],
            404
        );
    }

    $rawBody = file_get_contents('php://input');

    if ($rawBody === false || trim($rawBody) === '') {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Body request tidak boleh kosong.',
            ],
            400
        );
    }

    try {
        $requestData = json_decode(
            $rawBody,
            true,
            512,
            JSON_THROW_ON_ERROR
        );
    } catch (JsonException $error) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Body request harus berupa JSON yang valid.',
                'error' => $error->getMessage(),
            ],
            400
        );
    }

    if (!is_array($requestData)) {
        sendJsonResponse(
            [
                'success' => false,
                'message' => 'Body request harus berupa object JSON.',
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

    $descriptions =
        isset($requestData['descriptions'])
        && is_array($requestData['descriptions'])
            ? $requestData['descriptions']
            : [];

    $learning =
        isset($requestData['learning_information'])
        && is_array($requestData['learning_information'])
            ? $requestData['learning_information']
            : [];

    $pageSettings =
        isset($requestData['page_settings'])
        && is_array($requestData['page_settings'])
            ? $requestData['page_settings']
            : [];

    $accessSettings =
        isset($requestData['access_settings'])
        && is_array($requestData['access_settings'])
            ? $requestData['access_settings']
            : [];

    $slides =
        isset($requestData['slides'])
        && is_array($requestData['slides'])
            ? $requestData['slides']
            : [];

    $cardImageName = $existingTutorial['card_image_name'];
    $cardImageType = $existingTutorial['card_image_type'];
    $cardImageSize = $existingTutorial['card_image_size'];
    $cardImagePath = $existingTutorial['card_image_path'];
    $cardImageUrl = $existingTutorial['card_image_url'];

    if (
        isset($requestData['card_image'])
        && is_array($requestData['card_image'])
    ) {
        $cardImage = function_exists('normalizeStoredImage')
            ? normalizeStoredImage(
                $requestData['card_image'],
                $GLOBALS['articleImageStorage'] ?? [
                    'path' => dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'articles',
                    'url' => '/uploads/articles',
                ],
                'article-card'
            )
            : $requestData['card_image'];

        $cardImageName = isset($cardImage['file_name'])
            ? (string) $cardImage['file_name']
            : $cardImageName;

        $cardImageType = isset($cardImage['file_type'])
            ? (string) $cardImage['file_type']
            : $cardImageType;

        $cardImageSize = isset($cardImage['file_size'])
            ? (int) $cardImage['file_size']
            : $cardImageSize;

        $cardImagePath = isset($cardImage['file_path'])
            ? (string) $cardImage['file_path']
            : $cardImagePath;

        $cardImageUrl = isset($cardImage['file_url'])
            ? (string) $cardImage['file_url']
            : $cardImageUrl;
    }

    $currentTimestamp = (
        new DateTimeImmutable(
            'now',
            new DateTimeZone('Asia/Jakarta')
        )
    )->format(DateTimeInterface::ATOM);

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
                card_image_path = :card_image_path,
                card_image_url = :card_image_url,
                difficulty_level = :difficulty_level,
                estimated_time = :estimated_time,
                page_order = :page_order,
                status = :status,
                user_level = :user_level,
                access_requirement = :access_requirement,
                updated_at = :updated_at
             WHERE id = :id'
        );

        $statement->execute([
            ':title' => trim((string) $requestData['title']),
            ':slug' => trim((string) $requestData['slug']),
            ':category' => (string) $requestData['category'],
            ':display_order' => (int) $requestData['display_order'],
            ':short_description' => trim(
                (string) $descriptions['short_description']
            ),
            ':full_description' => trim(
                (string) $descriptions['full_description']
            ),
            ':card_image_name' => $cardImageName,
            ':card_image_type' => $cardImageType,
            ':card_image_size' => $cardImageSize,
            ':card_image_path' => $cardImagePath,
            ':card_image_url' => $cardImageUrl,
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
            ':user_level' => isset($accessSettings['user_level'])
                ? (string) $accessSettings['user_level']
                : 'semua_pengguna',
            ':access_requirement' =>
                isset($accessSettings['access_requirement'])
                && $accessSettings['access_requirement'] !== ''
                    ? (string) $accessSettings['access_requirement']
                    : null,
            ':updated_at' => $currentTimestamp,
            ':id' => $tutorialId,
        ]);

        $deleteSlides = $database->prepare(
            'DELETE FROM tutorial_slides
             WHERE tutorial_id = :tutorial_id'
        );

        $deleteSlides->execute([
            ':tutorial_id' => $tutorialId,
        ]);

        $slideStatement = $database->prepare(
            'INSERT INTO tutorial_slides (
                tutorial_id,
                slide_order,
                title,
                content_type,
                content,
                image_name,
                image_path,
                image_url,
                video_url,
                created_at,
                updated_at
            ) VALUES (
                :tutorial_id,
                :slide_order,
                :title,
                :content_type,
                :content,
                :image_name,
                :image_path,
                :image_url,
                :video_url,
                :created_at,
                :updated_at
            )'
        );

        foreach ($slides as $index => $slide) {
            if (!is_array($slide)) {
                continue;
            }

            $slideImageData = isset($slide['image'])
                && is_array($slide['image'])
                    ? $slide['image']
                    : (isset($slide['image_meta']) && is_array($slide['image_meta'])
                        ? $slide['image_meta']
                        : (isset($slide['image_name']) ? ['file_name' => (string) $slide['image_name']] : []));

            $storedSlideImage = function_exists('normalizeStoredImage')
                ? normalizeStoredImage(
                    $slideImageData,
                    $GLOBALS['articleImageStorage'] ?? [
                        'path' => dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'articles',
                        'url' => '/uploads/articles',
                    ],
                    'article-slide'
                )
                : null;

            $slideStatement->execute([
                ':tutorial_id' => $tutorialId,
                ':slide_order' => isset($slide['order'])
                    ? (int) $slide['order']
                    : $index + 1,
                ':title' => isset($slide['title'])
                    ? trim((string) $slide['title'])
                    : 'Slide ' . ($index + 1),
                ':content_type' => isset($slide['content_type'])
                    ? (string) $slide['content_type']
                    : 'text',
                ':content' => isset($slide['content'])
                    ? (string) $slide['content']
                    : null,
                ':image_name' => isset($slide['image_name'])
                    ? (string) $slide['image_name']
                    : (isset($storedSlideImage['file_name'])
                        ? (string) $storedSlideImage['file_name']
                        : null),
                ':image_path' => isset($storedSlideImage['file_path'])
                    ? (string) $storedSlideImage['file_path']
                    : null,
                ':image_url' => isset($storedSlideImage['file_url'])
                    ? (string) $storedSlideImage['file_url']
                    : null,
                ':video_url' => isset($slide['video_url'])
                    ? (string) $slide['video_url']
                    : null,
                ':created_at' => $currentTimestamp,
                ':updated_at' => $currentTimestamp,
            ]);
        }

        $database->commit();

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
                    'status' => isset($pageSettings['status'])
                        ? (string) $pageSettings['status']
                        : 'draft',
                    'page_order' => (int) $pageSettings['page_order'],
                    'total_slides' => count($slides),
                    'created_at' => $existingTutorial['created_at'],
                    'updated_at' => $currentTimestamp,
                ],
            ],
            200
        );
    } catch (PDOException $error) {
        if ($database->inTransaction()) {
            $database->rollBack();
        }

        $errorMessage =
            strtolower($error->getMessage());

        if (strpos($errorMessage, 'unique') !== false) {
            sendJsonResponse(
                [
                    'success' => false,
                    'message' => 'Slug sudah digunakan.',
                    'errors' => [
                        'slug' =>
                            'Slug sudah digunakan oleh materi lain.',
                    ],
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

/*
|--------------------------------------------------------------------------
| DELETE Hapus Materi
|--------------------------------------------------------------------------
*/

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
        'SELECT id, title, slug, card_image_name, card_image_path
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
                : null,
            isset($tutorial['card_image_path'])
                ? (string) $tutorial['card_image_path']
                : null
        );

        sendJsonResponse(
            [
                'success' => true,
                'message' => 'Materi berhasil dihapus.',
                'data' => [
                    'id' => (int) $tutorial['id'],
                    'title' => (string) $tutorial['title'],
                    'slug' => (string) $tutorial['slug'],
                    'deleted_slides' => $deletedSlides,
                    'image_deleted' => $imageDeleted,
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

/*
|--------------------------------------------------------------------------
| Validasi Materi
|--------------------------------------------------------------------------
*/

function validateMateri(array $data): array
{
    $errors = [];

    /*
    |--------------------------------------------------------------------------
    | Judul
    |--------------------------------------------------------------------------
    */

    if (
        trim(
            (string) ($data['title'] ?? '')
        ) === ''
    ) {
        $errors['title'] =
            'Kolom ini belum diisi.';
    }

    /*
    |--------------------------------------------------------------------------
    | Slug
    |--------------------------------------------------------------------------
    */

    if (
        trim(
            (string) ($data['slug'] ?? '')
        ) === ''
    ) {
        $errors['slug'] =
            'Kolom ini belum diisi.';
    }

    /*
    |--------------------------------------------------------------------------
    | Category
    |--------------------------------------------------------------------------
    */

    if (
        trim(
            (string) ($data['category'] ?? '')
        ) === ''
    ) {
        $errors['category'] =
            'Kolom ini belum diisi.';
    }

    /*
    |--------------------------------------------------------------------------
    | Display Order
    |--------------------------------------------------------------------------
    */

    if (
        !isset($data['display_order'])
        || (int) $data['display_order'] < 1
    ) {
        $errors['display_order'] =
            'Kolom ini belum diisi.';
    }

    /*
    |--------------------------------------------------------------------------
    | Description
    |--------------------------------------------------------------------------
    */

    $descriptions =
        isset($data['descriptions'])
        && is_array($data['descriptions'])
            ? $data['descriptions']
            : [];

    if (
        trim(
            (string) (
                $descriptions['short_description']
                ?? ''
            )
        ) === ''
    ) {
        $errors['short_description'] =
            'Kolom ini belum diisi.';
    }

    if (
        trim(
            (string) (
                $descriptions['full_description']
                ?? ''
            )
        ) === ''
    ) {
        $errors['full_description'] =
            'Kolom ini belum diisi.';
    }

    /*
    |--------------------------------------------------------------------------
    | Page Settings
    |--------------------------------------------------------------------------
    */

    $pageSettings =
        isset($data['page_settings'])
        && is_array($data['page_settings'])
            ? $data['page_settings']
            : [];

    if (
        !isset($pageSettings['page_order'])
        || (int) $pageSettings['page_order'] < 1
    ) {
        $errors['page_order'] =
            'Kolom ini belum diisi.';
    }

    /*
    |--------------------------------------------------------------------------
    | Slides
    |--------------------------------------------------------------------------
    */

    $slides =
        isset($data['slides'])
        && is_array($data['slides'])
            ? $data['slides']
            : [];

    if ($slides === []) {
        $errors['slides'] =
            'Daftar materi harus mempunyai minimal satu slide.';
    }

    return $errors;
}

/*
|--------------------------------------------------------------------------
| Response JSON
|--------------------------------------------------------------------------
*/

function sendJsonResponse(
    array $response,
    int $statusCode = 200
): void {
    http_response_code($statusCode);

    echo json_encode(
        $response,
        JSON_PRETTY_PRINT
        | JSON_UNESCAPED_UNICODE
        | JSON_UNESCAPED_SLASHES
    );

    exit;
}
