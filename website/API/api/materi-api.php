<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

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

header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond([
        'success' => false,
        'message' => 'Endpoint materi hanya menerima method GET.',
    ], 405);
}

require_once dirname(__DIR__) . '/config/database.php';

try {
    $database = getMaterialDatabaseConnection();
    ensureMaterialTables($database);

    $identifier = trim((string) ($_GET['id'] ?? $_GET['slug'] ?? ''));

    if ($identifier !== '') {
        $material = findMaterial($database, $identifier);

        if ($material === null) {
            respond([
                'success' => false,
                'message' => 'Materi tidak ditemukan.',
            ], 404);
        }

        respond([
            'success' => true,
            'message' => 'Detail materi berhasil diambil.',
            'data' => $material,
        ]);
    }

    $materials = getMaterials($database);

    respond([
        'success' => true,
        'message' => 'Data materi berhasil diambil.',
        'data' => $materials,
        'total' => count($materials),
    ]);
} catch (Throwable $error) {
    respond([
        'success' => false,
        'message' => 'Terjadi kesalahan pada endpoint materi.',
        'error' => $error->getMessage(),
    ], 500);
}

function getMaterialDatabaseConnection(): PDO
{
    if (function_exists('getDatabaseConnection')) {
        return getDatabaseConnection();
    }

    $config = require dirname(__DIR__) . '/config/database.php';
    $sqliteConfig = is_array($config['sqlite'] ?? null) ? $config['sqlite'] : [];
    $databasePath = trim((string) ($sqliteConfig['path'] ?? ''));

    if ($databasePath === '') {
        throw new RuntimeException('Path database SQLite belum dikonfigurasi.');
    }

    $databaseDirectory = dirname($databasePath);

    if (!is_dir($databaseDirectory) && !mkdir($databaseDirectory, 0775, true) && !is_dir($databaseDirectory)) {
        throw new RuntimeException('Folder database SQLite tidak dapat dibuat.');
    }

    $database = new PDO('sqlite:' . $databasePath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $database->exec('PRAGMA foreign_keys = ON');
    $database->exec('PRAGMA busy_timeout = 15000');

    return $database;
}

function ensureMaterialTables(PDO $database): void
{
    $database->exec(
        'CREATE TABLE IF NOT EXISTS materi (
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
            page_order INTEGER NOT NULL DEFAULT 1,
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
        'CREATE TABLE IF NOT EXISTS materi_slides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            materi_id INTEGER NOT NULL,
            slide_order INTEGER NOT NULL,
            title TEXT NOT NULL,
            content_type TEXT NOT NULL DEFAULT "text",
            content TEXT,
            estimated_time TEXT,
            status TEXT NOT NULL DEFAULT "draft",
            image_name TEXT,
            image_type TEXT,
            image_size INTEGER,
            video_url TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (materi_id) REFERENCES materi(id) ON DELETE CASCADE
        )'
    );
}

function getMaterials(PDO $database): array
{
    $statement = $database->query(
        'SELECT *
         FROM materi
         ORDER BY page_order ASC, display_order ASC, id DESC'
    );

    return array_map(
        static fn(array $row): array => hydrateMaterial($database, $row),
        $statement->fetchAll()
    );
}

function findMaterial(PDO $database, string $identifier): ?array
{
    $isNumericId = ctype_digit($identifier);
    $statement = $database->prepare(
        $isNumericId
            ? 'SELECT * FROM materi WHERE id = :identifier LIMIT 1'
            : 'SELECT * FROM materi WHERE slug = :identifier LIMIT 1'
    );
    $statement->execute([':identifier' => $identifier]);
    $row = $statement->fetch();

    return $row ? hydrateMaterial($database, $row) : null;
}

function hydrateMaterial(PDO $database, array $row): array
{
    $slides = getMaterialSlides($database, (int) $row['id']);
    $imageName = trim((string) ($row['card_image_name'] ?? ''));

    return [
        'id' => (int) $row['id'],
        'title' => (string) ($row['title'] ?? 'Materi Tanpa Judul'),
        'slug' => (string) ($row['slug'] ?? ''),
        'category' => (string) ($row['category'] ?? 'Umum'),
        'display_order' => (int) ($row['display_order'] ?? 1),
        'short_description' => (string) ($row['short_description'] ?? ''),
        'full_description' => (string) ($row['full_description'] ?? ''),
        'card_image_name' => $imageName,
        'card_image_url' => $imageName !== '' ? getArticleMediaUrl('image', 'card', $imageName) : null,
        'difficulty_level' => (string) ($row['difficulty_level'] ?? 'Semua Level'),
        'estimated_time' => (string) ($row['estimated_time'] ?? ''),
        'page_order' => (int) ($row['page_order'] ?? 1),
        'status' => (string) ($row['status'] ?? 'draft'),
        'active' => (bool) ($row['active'] ?? 1),
        'show_on_page' => (bool) ($row['show_on_page'] ?? 1),
        'featured' => (bool) ($row['featured'] ?? 0),
        'comments' => (int) ($row['comments'] ?? 0),
        'featured_order' => $row['featured_order'] !== null ? (int) $row['featured_order'] : null,
        'user_level' => (string) ($row['user_level'] ?? 'semua_pengguna'),
        'access_requirement' => $row['access_requirement'] ?? null,
        'slides' => $slides,
        'total_slides' => count($slides),
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
    ];
}

function getMaterialSlides(PDO $database, int $materialId): array
{
    $statement = $database->prepare(
        'SELECT
            id,
            slide_order,
            title,
            content_type,
            content,
            estimated_time,
            status,
            image_name,
            image_type,
            image_size,
            video_url
         FROM materi_slides
         WHERE materi_id = :materi_id
         ORDER BY slide_order ASC, id ASC'
    );
    $statement->execute([':materi_id' => $materialId]);

    return array_map(static function (array $slide): array {
        $imageName = trim((string) ($slide['image_name'] ?? ''));

        return [
            'id' => (int) $slide['id'],
            'order' => (int) ($slide['slide_order'] ?? 1),
            'title' => (string) ($slide['title'] ?? 'Materi'),
            'content_type' => (string) ($slide['content_type'] ?? 'text'),
            'content' => (string) ($slide['content'] ?? ''),
            'body_text' => (string) ($slide['content'] ?? ''),
            'estimated_time' => (string) ($slide['estimated_time'] ?? ''),
            'status' => (string) ($slide['status'] ?? 'draft'),
            'image_name' => $imageName,
            'image_type' => $slide['image_type'] ?? null,
            'image_size' => isset($slide['image_size']) ? (int) $slide['image_size'] : null,
            'image_url' => $imageName !== '' ? getArticleMediaUrl('image', 'slide', $imageName) : null,
            'video_url' => (string) ($slide['video_url'] ?? ''),
        ];
    }, $statement->fetchAll());
}

function getArticleMediaUrl(string $action, string $scope, string $fileName): string
{
    $host = trim((string) ($_SERVER['HTTP_HOST'] ?? '127.0.0.1:8000'));
    $scheme = (
        isset($_SERVER['HTTPS']) &&
        $_SERVER['HTTPS'] !== '' &&
        strtolower((string) $_SERVER['HTTPS']) !== 'off'
    ) ? 'https' : 'http';

    $query = $action === 'image'
        ? '?action=image&scope=' . rawurlencode($scope) . '&file=' . rawurlencode(basename($fileName))
        : '?action=video&file=' . rawurlencode(basename($fileName));

    return $scheme . '://' . $host . '/api/article-api.php' . $query;
}

function respond(array $response, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
