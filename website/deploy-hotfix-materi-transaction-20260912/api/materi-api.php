<?php

declare(strict_types=1);

use Arduflow\Api\Support\Env;

const MATERI_API_VERSION = 'materi-v7-tutorials-schema';

$projectRoot = dirname(__DIR__);

// Tetap kompatibel jika composer/vendor tersedia.
$autoloadPath = $projectRoot . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
if (is_file($autoloadPath)) {
    require_once $autoloadPath;
}

// Fallback untuk hosting yang tidak memuat composer autoload.
if (!class_exists(Env::class)) {
    $envPath = $projectRoot . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'Support' . DIRECTORY_SEPARATOR . 'Env.php';
    if (is_file($envPath)) {
        require_once $envPath;
    }
}

if (class_exists(Env::class)) {
    Env::load($projectRoot . DIRECTORY_SEPARATOR . '.env');
}

header('Content-Type: application/json; charset=utf-8');
header('X-ArduFlow-Materi-API: ' . MATERI_API_VERSION);

$origin = trim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''));
$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'https://arduflow.indobilliard.com',
    'https://www.arduflow.indobilliard.com',
    'https://web.arduflow.com',
];

if (class_exists(Env::class)) {
    $configuredOrigins = array_filter(
        array_map('trim', explode(',', Env::get('CORS_ORIGIN', ''))),
        static fn (string $value): bool => $value !== ''
    );
    $allowedOrigins = array_values(array_unique([...$allowedOrigins, ...$configuredOrigins]));
}

$isLocalOrigin = preg_match(
    '#^http://(localhost|127\.0\.0\.1|192\.168\.[0-9]+\.[0-9]+|10\.[0-9]+\.[0-9]+\.[0-9]+|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]+\.[0-9]+):[0-9]+$#',
    $origin
) === 1;

if ($origin !== '' && (in_array($origin, $allowedOrigins, true) || $isLocalOrigin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Auth-Token');
header('Access-Control-Max-Age: 86400');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function sendJsonResponse(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function tableExists(PDO $database, string $table): bool
{
    $statement = $database->prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = :name LIMIT 1"
    );
    $statement->execute([':name' => $table]);
    return (bool) $statement->fetchColumn();
}

function tableColumns(PDO $database, string $table): array
{
    if (!preg_match('/^[A-Za-z0-9_]+$/', $table)) {
        return [];
    }

    $rows = $database->query('PRAGMA table_info(' . $table . ')')->fetchAll(PDO::FETCH_ASSOC);
    $columns = [];

    foreach ($rows as $row) {
        $name = trim((string) ($row['name'] ?? ''));
        if ($name !== '') {
            $columns[$name] = true;
        }
    }

    return $columns;
}

function resolveDatabasePath(string $projectRoot, string $path): string
{
    $path = trim($path);
    if ($path === '') {
        return $projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'arduflow.sqlite';
    }

    $isWindows = preg_match('/^[A-Za-z]:[\\\\\/]/', $path) === 1;
    $isUnix = str_starts_with($path, '/');

    if (!$isWindows && !$isUnix) {
        return $projectRoot . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
    }

    return $path;
}

function getDatabaseConnection(): PDO
{
    global $projectRoot;

    $configPath = $projectRoot . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'database.php';

    if (!is_file($configPath)) {
        throw new RuntimeException('File config/database.php tidak ditemukan.');
    }

    $config = require $configPath;

    if (!is_array($config) || !isset($config['sqlite']) || !is_array($config['sqlite'])) {
        throw new RuntimeException('Konfigurasi SQLite tidak ditemukan.');
    }

    $databasePath = resolveDatabasePath(
        $projectRoot,
        (string) ($config['sqlite']['path'] ?? '')
    );

    if (!is_file($databasePath)) {
        throw new RuntimeException('Database SQLite tidak ditemukan: ' . $databasePath);
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
    $database->exec(
        'PRAGMA busy_timeout = ' .
        max(5000, (int) ($config['sqlite']['busy_timeout_ms'] ?? 5000))
    );

    return $database;
}

function requestScheme(): string
{
    $forwarded = strtolower(trim((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')));
    if ($forwarded === 'https') {
        return 'https';
    }

    $https = strtolower(trim((string) ($_SERVER['HTTPS'] ?? '')));
    return $https !== '' && $https !== 'off' ? 'https' : 'http';
}

function deployBaseUrl(): string
{
    $host = trim((string) ($_SERVER['HTTP_HOST'] ?? ''));
    $scriptName = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? '/api/materi-api.php'));

    // /apk/uploads/web-arduflow-deploy-alfha/api/materi-api.php
    // -> /apk/uploads/web-arduflow-deploy-alfha
    $apiDir = rtrim(dirname($scriptName), '/');
    $deployPath = rtrim(dirname($apiDir), '/');

    return requestScheme() . '://' . $host . ($deployPath !== '/' ? $deployPath : '');
}

function materiUploadDirectory(): string
{
    global $projectRoot;
    return $projectRoot . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'materi';
}

function legacyArticleUploadDirectory(): string
{
    global $projectRoot;
    return $projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'articles';
}

function ensureMateriUploadDirectory(): string
{
    $directory = materiUploadDirectory();

    if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
        throw new RuntimeException('Folder uploads/materi tidak dapat dibuat.');
    }

    if (!is_writable($directory)) {
        throw new RuntimeException('Folder uploads/materi tidak dapat ditulis.');
    }

    return $directory;
}

function findMateriFile(?string $fileName): ?string
{
    $fileName = trim((string) $fileName);
    if ($fileName === '') {
        return null;
    }

    $safe = basename($fileName);

    $candidates = [
        materiUploadDirectory() . DIRECTORY_SEPARATOR . $safe,
        legacyArticleUploadDirectory() . DIRECTORY_SEPARATOR . $safe,
        legacyArticleUploadDirectory() . DIRECTORY_SEPARATOR . 'slides' . DIRECTORY_SEPARATOR . $safe,
        legacyArticleUploadDirectory() . DIRECTORY_SEPARATOR . 'videos' . DIRECTORY_SEPARATOR . $safe,
    ];

    foreach ($candidates as $candidate) {
        if (is_file($candidate)) {
            return $candidate;
        }
    }

    return null;
}

function materiFileUrl(?string $fileName): ?string
{
    $fileName = trim((string) $fileName);
    if ($fileName === '') {
        return null;
    }

    return deployBaseUrl() . '/uploads/materi/' . rawurlencode(basename($fileName));
}

function saveUploadedFile(array $file, string $prefix, array $allowedExtensions, int $maxBytes): array
{
    $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);

    if ($error === UPLOAD_ERR_NO_FILE) {
        throw new RuntimeException('File belum dipilih.');
    }

    if ($error !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Upload gagal. Kode error: ' . $error);
    }

    $temporaryPath = (string) ($file['tmp_name'] ?? '');
    if ($temporaryPath === '' || !is_uploaded_file($temporaryPath)) {
        throw new RuntimeException('Temporary file upload tidak valid.');
    }

    $size = (int) ($file['size'] ?? 0);
    if ($size <= 0 || $size > $maxBytes) {
        throw new RuntimeException('Ukuran file tidak valid atau melebihi batas.');
    }

    $originalName = (string) ($file['name'] ?? '');
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

    if (!isset($allowedExtensions[$extension])) {
        throw new RuntimeException('Format file tidak didukung.');
    }

    $directory = ensureMateriUploadDirectory();
    $storedName = $prefix . '-' . bin2hex(random_bytes(12)) . '.' . $extension;
    $destination = $directory . DIRECTORY_SEPARATOR . $storedName;

    if (!move_uploaded_file($temporaryPath, $destination)) {
        throw new RuntimeException('File gagal disimpan.');
    }

    return [
        'file_name' => $storedName,
        'file_type' => $allowedExtensions[$extension],
        'file_size' => $size,
        'file_path' => $destination,
        'file_url' => materiFileUrl($storedName),
    ];
}

function readRequestData(): array
{
    if (
        isset($_POST['payload']) &&
        is_string($_POST['payload']) &&
        trim($_POST['payload']) !== ''
    ) {
        $decoded = json_decode($_POST['payload'], true);
        if (!is_array($decoded)) {
            throw new InvalidArgumentException('Payload multipart bukan JSON yang valid.');
        }

        return isset($decoded['data']) && is_array($decoded['data'])
            ? $decoded['data']
            : $decoded;
    }

    $raw = file_get_contents('php://input');
    if (is_string($raw) && trim($raw) !== '') {
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            throw new InvalidArgumentException('Body JSON tidak valid.');
        }

        return isset($decoded['data']) && is_array($decoded['data'])
            ? $decoded['data']
            : $decoded;
    }

    if (!empty($_POST)) {
        return $_POST;
    }

    return [];
}

function boolInt(mixed $value, int $default = 0): int
{
    if ($value === null || $value === '') {
        return $default;
    }

    if (is_bool($value)) {
        return $value ? 1 : 0;
    }

    if (is_int($value)) {
        return $value === 0 ? 0 : 1;
    }

    return in_array(
        strtolower(trim((string) $value)),
        ['1', 'true', 'yes', 'on', 'aktif', 'active'],
        true
    ) ? 1 : 0;
}

function firstValue(array $sources, array $keys, mixed $default = null): mixed
{
    foreach ($sources as $source) {
        if (!is_array($source)) {
            continue;
        }

        foreach ($keys as $key) {
            if (array_key_exists($key, $source)) {
                return $source[$key];
            }
        }
    }

    return $default;
}

function slugify(string $value): string
{
    $value = strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/i', '-', $value) ?? '';
    return trim($value, '-');
}

function normalizeTutorialInput(array $data, array $existing = []): array
{
    $descriptions = is_array($data['descriptions'] ?? null) ? $data['descriptions'] : [];
    $learning = is_array($data['learning_information'] ?? null) ? $data['learning_information'] : [];
    $page = is_array($data['page_settings'] ?? null) ? $data['page_settings'] : [];
    $access = is_array($data['access_settings'] ?? null) ? $data['access_settings'] : [];
    $cta = is_array($data['cta'] ?? null) ? $data['cta'] : [];

    $title = trim((string) firstValue([$data], ['title'], $existing['title'] ?? ''));
    $slug = trim((string) firstValue([$data], ['slug'], $existing['slug'] ?? ''));
    if ($slug === '' && $title !== '') {
        $slug = slugify($title);
    }

    $values = [
        'title' => $title,
        'slug' => $slug,
        'category' => trim((string) firstValue([$data], ['category'], $existing['category'] ?? 'Umum')),
        'display_order' => max(1, (int) firstValue([$data, $page], ['display_order', 'displayOrder'], $existing['display_order'] ?? 1)),
        'short_description' => (string) firstValue([$data, $descriptions], ['short_description', 'shortDescription', 'short'], $existing['short_description'] ?? ''),
        'full_description' => (string) firstValue([$data, $descriptions], ['full_description', 'fullDescription', 'full'], $existing['full_description'] ?? ''),
        'difficulty_level' => (string) firstValue([$data, $learning], ['difficulty_level', 'difficultyLevel', 'difficulty'], $existing['difficulty_level'] ?? ''),
        'estimated_time' => (string) firstValue([$data, $learning], ['estimated_time', 'estimatedTime'], $existing['estimated_time'] ?? ''),
        'page_order' => max(1, (int) firstValue([$data, $page], ['page_order', 'pageOrder'], $existing['page_order'] ?? 1)),
        'status' => trim((string) firstValue([$data, $page], ['status'], $existing['status'] ?? 'draft')),
        'active' => boolInt(firstValue([$data, $page], ['active'], $existing['active'] ?? 1), 1),
        'show_on_page' => boolInt(firstValue([$data, $page], ['show_on_page', 'showOnPage'], $existing['show_on_page'] ?? 1), 1),
        'featured' => boolInt(firstValue([$data, $page], ['featured'], $existing['featured'] ?? 0), 0),
        'comments' => boolInt(firstValue([$data, $page], ['comments'], $existing['comments'] ?? 1), 1),
        'access_type' => (string) firstValue([$data, $page, $access], ['access_type', 'accessType'], $existing['access_type'] ?? 'Gratis'),
        'featured_order' => (int) firstValue([$data, $page], ['featured_order', 'featuredOrder'], $existing['featured_order'] ?? 0),
        'user_level' => (string) firstValue([$data, $access], ['user_level', 'userLevel'], $existing['user_level'] ?? 'semua_pengguna'),
        'access_requirement' => (string) firstValue([$data, $access], ['access_requirement', 'accessRequirement'], $existing['access_requirement'] ?? ''),
        'prerequisite' => (string) firstValue([$data, $access], ['prerequisite'], $existing['prerequisite'] ?? ''),
        'cta_text' => (string) firstValue([$data, $cta], ['cta_text', 'text'], $existing['cta_text'] ?? ''),
        'cta_target_link' => (string) firstValue([$data, $cta], ['cta_target_link', 'target_link', 'targetLink'], $existing['cta_target_link'] ?? ''),
        'cta_url_slug' => (string) firstValue([$data, $cta], ['cta_url_slug', 'url_slug', 'urlSlug'], $existing['cta_url_slug'] ?? ''),
        'publish_schedule' => (string) firstValue([$data, $page], ['publish_schedule', 'publishSchedule'], $existing['publish_schedule'] ?? ''),
        'price' => max(0, (int) firstValue([$data, $page, $access], ['price', 'material_price', 'materialPrice'], $existing['price'] ?? 0)),
    ];

    return $values;
}

function normalizeChapters(array $data): array
{
    $raw = is_array($data['chapters'] ?? null) ? $data['chapters'] : [];
    $result = [];

    foreach ($raw as $index => $chapter) {
        if (!is_array($chapter)) {
            continue;
        }

        $title = trim((string) ($chapter['title'] ?? $chapter['chapter_title'] ?? ''));
        if ($title === '') {
            $title = 'Bab ' . ($index + 1);
        }

        $clientId = (string) (
            $chapter['id'] ??
            $chapter['chapter_id'] ??
            $chapter['client_id'] ??
            ('chapter-' . ($index + 1))
        );

        $result[] = [
            'client_id' => $clientId,
            'order' => max(1, (int) ($chapter['order'] ?? $chapter['chapter_order'] ?? ($index + 1))),
            'title' => $title,
        ];
    }

    usort($result, static fn (array $a, array $b): int => $a['order'] <=> $b['order']);

    return $result;
}

function normalizeObjectives(array $data): array
{
    $learning = is_array($data['learning_information'] ?? null) ? $data['learning_information'] : [];
    $raw = $learning['learning_objectives'] ?? $data['learning_objectives'] ?? [];
    if (!is_array($raw)) {
        return [];
    }

    return array_values(array_filter(
        array_map(static fn ($item): string => trim((string) $item), $raw),
        static fn (string $item): bool => $item !== ''
    ));
}

function normalizeSlides(array $data): array
{
    return is_array($data['slides'] ?? null) ? $data['slides'] : [];
}

function fetchTutorialStructure(PDO $database, array $tutorialIds): array
{
    $result = [
        'chapters' => [],
        'objectives' => [],
        'slides' => [],
    ];

    if ($tutorialIds === []) {
        return $result;
    }

    $placeholders = implode(',', array_fill(0, count($tutorialIds), '?'));

    if (tableExists($database, 'tutorial_chapters')) {
        $statement = $database->prepare(
            'SELECT * FROM tutorial_chapters
             WHERE tutorial_id IN (' . $placeholders . ')
             ORDER BY tutorial_id ASC, chapter_order ASC, id ASC'
        );
        $statement->execute($tutorialIds);

        foreach ($statement->fetchAll() as $row) {
            $tutorialId = (int) $row['tutorial_id'];
            $row['order'] = (int) ($row['chapter_order'] ?? 1);
            $result['chapters'][$tutorialId][] = $row;
        }
    }

    if (tableExists($database, 'tutorial_learning_objectives')) {
        $statement = $database->prepare(
            'SELECT * FROM tutorial_learning_objectives
             WHERE tutorial_id IN (' . $placeholders . ')
             ORDER BY tutorial_id ASC, objective_order ASC, id ASC'
        );
        $statement->execute($tutorialIds);

        foreach ($statement->fetchAll() as $row) {
            $tutorialId = (int) $row['tutorial_id'];
            $objective = trim((string) ($row['objective'] ?? ''));
            if ($objective !== '') {
                $result['objectives'][$tutorialId][] = $objective;
            }
        }
    }

    if (tableExists($database, 'tutorial_slides')) {
        $statement = $database->prepare(
            'SELECT * FROM tutorial_slides
             WHERE tutorial_id IN (' . $placeholders . ')
             ORDER BY tutorial_id ASC, slide_order ASC, id ASC'
        );
        $statement->execute($tutorialIds);

        foreach ($statement->fetchAll() as $row) {
            $tutorialId = (int) $row['tutorial_id'];
            $row['order'] = (int) ($row['slide_order'] ?? 1);
            $row['body_text'] = (string) ($row['content'] ?? '');
            $row['allow_copy'] = (bool) ($row['allow_copy'] ?? 0);

            $imageName = trim((string) ($row['image_name'] ?? ''));
            $row['image_url'] = $imageName !== '' ? materiFileUrl($imageName) : null;
            $row['image_path'] = $imageName !== '' ? findMateriFile($imageName) : null;

            $result['slides'][$tutorialId][] = $row;
        }
    }

    return $result;
}

function enrichTutorialRows(PDO $database, array $rows): array
{
    $ids = array_map(static fn (array $row): int => (int) $row['id'], $rows);
    $structure = fetchTutorialStructure($database, $ids);

    foreach ($rows as &$tutorial) {
        $id = (int) $tutorial['id'];

        $tutorial['active'] = (bool) ($tutorial['active'] ?? 1);
        $tutorial['show_on_page'] = (bool) ($tutorial['show_on_page'] ?? 1);
        $tutorial['featured'] = (bool) ($tutorial['featured'] ?? 0);
        $tutorial['comments'] = (bool) ($tutorial['comments'] ?? 1);
        $tutorial['price'] = max(0, (int) ($tutorial['price'] ?? 0));

        $cardImageName = trim((string) ($tutorial['card_image_name'] ?? ''));
        if ($cardImageName !== '') {
            $tutorial['card_image_path'] = findMateriFile($cardImageName);
            $tutorial['card_image_url'] = materiFileUrl($cardImageName);
        }

        $tutorial['chapters'] = $structure['chapters'][$id] ?? [];
        $tutorial['learning_objectives'] = $structure['objectives'][$id] ?? [];
        $tutorial['slides'] = $structure['slides'][$id] ?? [];
        $tutorial['slide_count'] = count($tutorial['slides']);
        $tutorial['total_slides'] = count($tutorial['slides']);

        $tutorial['page_settings'] = [
            'price' => $tutorial['price'],
            'access_type' => $tutorial['access_type'] ?? null,
            'active' => $tutorial['active'],
            'show_on_page' => $tutorial['show_on_page'],
            'featured' => $tutorial['featured'],
        ];
    }
    unset($tutorial);

    return $rows;
}

function getMateri(PDO $database): never
{
    if (!tableExists($database, 'tutorials')) {
        throw new RuntimeException('Tabel tutorials tidak ditemukan pada database.');
    }

    $id = isset($_GET['id']) && ctype_digit((string) $_GET['id'])
        ? (int) $_GET['id']
        : null;
    $slug = trim((string) ($_GET['slug'] ?? ''));

    if ($id !== null) {
        $statement = $database->prepare('SELECT * FROM tutorials WHERE id = :id LIMIT 1');
        $statement->execute([':id' => $id]);
        $row = $statement->fetch();

        if (!$row) {
            sendJsonResponse(['success' => false, 'message' => 'Materi tidak ditemukan.'], 404);
        }

        $rows = enrichTutorialRows($database, [$row]);
        sendJsonResponse(['success' => true, 'data' => $rows[0], 'material' => $rows[0]]);
    }

    if ($slug !== '') {
        $statement = $database->prepare('SELECT * FROM tutorials WHERE slug = :slug LIMIT 1');
        $statement->execute([':slug' => $slug]);
        $row = $statement->fetch();

        if (!$row) {
            sendJsonResponse(['success' => false, 'message' => 'Materi tidak ditemukan.'], 404);
        }

        $rows = enrichTutorialRows($database, [$row]);
        sendJsonResponse(['success' => true, 'data' => $rows[0], 'material' => $rows[0]]);
    }

    $rows = $database
        ->query('SELECT * FROM tutorials ORDER BY display_order ASC, id DESC')
        ->fetchAll();

    $rows = enrichTutorialRows($database, $rows);

    sendJsonResponse([
        'success' => true,
        'message' => 'Data materi berhasil diambil.',
        'data' => $rows,
        'materials' => $rows,
        'total' => count($rows),
    ]);
}

function insertFiltered(PDO $database, string $table, array $values): int
{
    $columns = tableColumns($database, $table);
    $filtered = [];

    foreach ($values as $key => $value) {
        if (isset($columns[$key])) {
            $filtered[$key] = $value;
        }
    }

    if ($filtered === []) {
        throw new RuntimeException('Tidak ada kolom valid untuk disimpan ke ' . $table . '.');
    }

    $names = array_keys($filtered);
    $sql = 'INSERT INTO ' . $table .
        ' (' . implode(', ', $names) . ')' .
        ' VALUES (:' . implode(', :', $names) . ')';

    $statement = $database->prepare($sql);
    $bindings = [];
    foreach ($filtered as $key => $value) {
        $bindings[':' . $key] = $value;
    }

    $statement->execute($bindings);
    return (int) $database->lastInsertId();
}

function updateFiltered(PDO $database, string $table, int $id, array $values): void
{
    $columns = tableColumns($database, $table);
    $filtered = [];

    foreach ($values as $key => $value) {
        if ($key !== 'id' && isset($columns[$key])) {
            $filtered[$key] = $value;
        }
    }

    if ($filtered === []) {
        return;
    }

    $set = implode(', ', array_map(
        static fn (string $key): string => $key . ' = :' . $key,
        array_keys($filtered)
    ));

    $statement = $database->prepare(
        'UPDATE ' . $table . ' SET ' . $set . ' WHERE id = :id'
    );

    $bindings = [':id' => $id];
    foreach ($filtered as $key => $value) {
        $bindings[':' . $key] = $value;
    }

    $statement->execute($bindings);
}

function replaceTutorialStructure(
    PDO $database,
    int $tutorialId,
    array $chapters,
    array $objectives,
    array $slides,
    bool $replace
): void {
    $hasAnyStructure =
        array_key_exists('chapters', $GLOBALS['requestDataForStructure'] ?? []) ||
        array_key_exists('slides', $GLOBALS['requestDataForStructure'] ?? []) ||
        array_key_exists('learning_objectives', $GLOBALS['requestDataForStructure'] ?? []) ||
        array_key_exists('learning_information', $GLOBALS['requestDataForStructure'] ?? []);

    if (!$hasAnyStructure && $replace) {
        return;
    }

    if ($replace) {
        if (tableExists($database, 'tutorial_slides')) {
            $statement = $database->prepare('DELETE FROM tutorial_slides WHERE tutorial_id = :id');
            $statement->execute([':id' => $tutorialId]);
        }

        if (tableExists($database, 'tutorial_learning_objectives')) {
            $statement = $database->prepare('DELETE FROM tutorial_learning_objectives WHERE tutorial_id = :id');
            $statement->execute([':id' => $tutorialId]);
        }

        if (tableExists($database, 'tutorial_chapters')) {
            $statement = $database->prepare('DELETE FROM tutorial_chapters WHERE tutorial_id = :id');
            $statement->execute([':id' => $tutorialId]);
        }
    }

    $now = gmdate('c');
    $chapterIdMap = [];

    if (tableExists($database, 'tutorial_chapters')) {
        foreach ($chapters as $index => $chapter) {
            $chapterId = insertFiltered($database, 'tutorial_chapters', [
                'tutorial_id' => $tutorialId,
                'chapter_order' => (int) ($chapter['order'] ?? ($index + 1)),
                'title' => (string) ($chapter['title'] ?? ('Bab ' . ($index + 1))),
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $clientId = (string) ($chapter['client_id'] ?? $chapterId);
            $chapterIdMap[$clientId] = $chapterId;
            $chapterIdMap[(string) $chapterId] = $chapterId;
        }
    }

    if (tableExists($database, 'tutorial_learning_objectives')) {
        foreach ($objectives as $index => $objective) {
            insertFiltered($database, 'tutorial_learning_objectives', [
                'tutorial_id' => $tutorialId,
                'objective_order' => $index + 1,
                'objective' => $objective,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    if (tableExists($database, 'tutorial_slides')) {
        $chapterCounters = [];

        foreach ($slides as $index => $slide) {
            if (!is_array($slide)) {
                continue;
            }

            $chapterClientId = (string) (
                $slide['chapter_id'] ??
                $slide['chapterId'] ??
                ''
            );

            $chapterId = $chapterIdMap[$chapterClientId]
                ?? (count($chapterIdMap) ? reset($chapterIdMap) : null);

            if ($chapterId !== null) {
                if (!isset($chapterCounters[$chapterId])) {
                    $chapterCounters[$chapterId] = 0;
                }
                $chapterCounters[$chapterId]++;
            }

            $imageData = [];
            $imageField = 'slide_image_' . $index;

            if (
                isset($_FILES[$imageField]) &&
                is_array($_FILES[$imageField]) &&
                (int) ($_FILES[$imageField]['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE
            ) {
                $imageData = saveUploadedFile(
                    $_FILES[$imageField],
                    'slide',
                    [
                        'jpg' => 'image/jpeg',
                        'jpeg' => 'image/jpeg',
                        'png' => 'image/png',
                        'webp' => 'image/webp',
                        'gif' => 'image/gif',
                        'svg' => 'image/svg+xml',
                    ],
                    3 * 1024 * 1024
                );
            }

            $videoUrl = trim((string) ($slide['video_url'] ?? $slide['videoUrl'] ?? ''));
            $videoField = 'slide_video_' . $index;

            if (
                isset($_FILES[$videoField]) &&
                is_array($_FILES[$videoField]) &&
                (int) ($_FILES[$videoField]['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE
            ) {
                $videoData = saveUploadedFile(
                    $_FILES[$videoField],
                    'video',
                    [
                        'mp4' => 'video/mp4',
                        'webm' => 'video/webm',
                        'ogg' => 'video/ogg',
                    ],
                    50 * 1024 * 1024
                );
                $videoUrl = (string) $videoData['file_url'];
            }

            $existingImage = is_array($slide['image'] ?? null) ? $slide['image'] : [];
            $imageName =
                $imageData['file_name'] ??
                $existingImage['file_name'] ??
                $slide['image_name'] ??
                null;
            $imageType =
                $imageData['file_type'] ??
                $existingImage['file_type'] ??
                $slide['image_type'] ??
                null;
            $imageSize =
                $imageData['file_size'] ??
                $existingImage['file_size'] ??
                $slide['image_size'] ??
                null;

            $contentType = strtolower(trim((string) ($slide['content_type'] ?? $slide['contentType'] ?? 'text')));

            insertFiltered($database, 'tutorial_slides', [
                'tutorial_id' => $tutorialId,
                'chapter_id' => $chapterId,
                'slide_order' => $chapterId !== null
                    ? ($chapterCounters[$chapterId] ?? ($index + 1))
                    : ($index + 1),
                'title' => trim((string) ($slide['title'] ?? ('Materi ' . ($index + 1)))),
                'content_type' => $contentType,
                'content' => $contentType === 'code'
                    ? null
                    : (string) ($slide['body_text'] ?? $slide['content'] ?? ''),
                'code_title' => $contentType === 'code' ? ($slide['code_title'] ?? null) : null,
                'code_language' => $contentType === 'code' ? ($slide['code_language'] ?? 'text') : null,
                'code_content' => $contentType === 'code' ? ($slide['code_content'] ?? '') : null,
                'allow_copy' => $contentType === 'code'
                    ? boolInt($slide['allow_copy'] ?? true, 1)
                    : 0,
                'estimated_time' => (string) ($slide['estimated_time'] ?? $slide['estimatedTime'] ?? ''),
                'status' => (string) ($slide['status'] ?? 'published'),
                'image_name' => $imageName,
                'image_type' => $imageType,
                'image_size' => $imageSize,
                'video_url' => $videoUrl !== '' ? $videoUrl : null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}

function saveMateri(PDO $database, ?int $id = null): never
{
    $data = readRequestData();
    $GLOBALS['requestDataForStructure'] = $data;

    $existing = [];

    if ($id !== null) {
        $statement = $database->prepare('SELECT * FROM tutorials WHERE id = :id LIMIT 1');
        $statement->execute([':id' => $id]);
        $existing = $statement->fetch() ?: [];

        if ($existing === []) {
            sendJsonResponse(['success' => false, 'message' => 'Materi tidak ditemukan.'], 404);
        }
    }

    $values = normalizeTutorialInput($data, $existing);

    if ($values['title'] === '') {
        sendJsonResponse(['success' => false, 'message' => 'Judul materi wajib diisi.'], 422);
    }

    if ($values['slug'] === '') {
        sendJsonResponse(['success' => false, 'message' => 'Slug materi wajib diisi.'], 422);
    }

    $now = gmdate('c');
    $values['updated_at'] = $now;

    if ($id === null) {
        $values['created_at'] = $now;
    }

    if (
        isset($_FILES['card_image']) &&
        is_array($_FILES['card_image']) &&
        (int) ($_FILES['card_image']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE
    ) {
        $cardImage = saveUploadedFile(
            $_FILES['card_image'],
            'card',
            [
                'jpg' => 'image/jpeg',
                'jpeg' => 'image/jpeg',
                'png' => 'image/png',
                'webp' => 'image/webp',
                'gif' => 'image/gif',
                'svg' => 'image/svg+xml',
            ],
            3 * 1024 * 1024
        );

        $values['card_image_name'] = $cardImage['file_name'];
        $values['card_image_type'] = $cardImage['file_type'];
        $values['card_image_size'] = $cardImage['file_size'];
        $values['card_image_path'] = $cardImage['file_path'];
        $values['card_image_url'] = $cardImage['file_url'];
    }

    $database->beginTransaction();

    try {
        if ($id === null) {
            $id = insertFiltered($database, 'tutorials', $values);
        } else {
            updateFiltered($database, 'tutorials', $id, $values);
        }

        replaceTutorialStructure(
            $database,
            $id,
            normalizeChapters($data),
            normalizeObjectives($data),
            normalizeSlides($data),
            $existing !== []
        );

        $database->commit();
    } catch (Throwable $error) {
        if ($database->inTransaction()) {
            $database->rollBack();
        }
        throw $error;
    }

    $statement = $database->prepare('SELECT * FROM tutorials WHERE id = :id LIMIT 1');
    $statement->execute([':id' => $id]);
    $row = $statement->fetch();

    $rows = enrichTutorialRows($database, [$row]);

    sendJsonResponse([
        'success' => true,
        'message' => $existing === []
            ? 'Materi berhasil dibuat.'
            : 'Materi berhasil diperbarui.',
        'data' => $rows[0],
        'material' => $rows[0],
    ], $existing === [] ? 201 : 200);
}

function deleteMateri(PDO $database, int $id): never
{
    $statement = $database->prepare('SELECT id FROM tutorials WHERE id = :id LIMIT 1');
    $statement->execute([':id' => $id]);

    if (!$statement->fetchColumn()) {
        sendJsonResponse(['success' => false, 'message' => 'Materi tidak ditemukan.'], 404);
    }

    $database->beginTransaction();

    try {
        foreach (
            [
                'tutorial_slides',
                'tutorial_learning_objectives',
                'tutorial_chapters',
            ] as $table
        ) {
            if (tableExists($database, $table)) {
                $statement = $database->prepare(
                    'DELETE FROM ' . $table . ' WHERE tutorial_id = :id'
                );
                $statement->execute([':id' => $id]);
            }
        }

        $statement = $database->prepare('DELETE FROM tutorials WHERE id = :id');
        $statement->execute([':id' => $id]);

        $database->commit();
    } catch (Throwable $error) {
        if ($database->inTransaction()) {
            $database->rollBack();
        }
        throw $error;
    }

    sendJsonResponse([
        'success' => true,
        'message' => 'Materi berhasil dihapus.',
    ]);
}

try {
    if (
        ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET' &&
        ($_GET['action'] ?? '') === 'health'
    ) {
        $database = getDatabaseConnection();

        sendJsonResponse([
            'success' => true,
            'api' => 'materi-api.php',
            'version' => MATERI_API_VERSION,
            'database' => [
                'tutorials' => tableExists($database, 'tutorials'),
                'tutorial_chapters' => tableExists($database, 'tutorial_chapters'),
                'tutorial_learning_objectives' => tableExists($database, 'tutorial_learning_objectives'),
                'tutorial_slides' => tableExists($database, 'tutorial_slides'),
            ],
            'supports' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        ]);
    }

    $database = getDatabaseConnection();

    if (!tableExists($database, 'tutorials')) {
        throw new RuntimeException(
            'Tabel tutorials tidak ditemukan. API ini tidak mengubah atau me-rename tabel database.'
        );
    }

    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

    if ($method === 'GET') {
        getMateri($database);
    }

    if ($method === 'POST') {
        $id = isset($_GET['id']) && ctype_digit((string) $_GET['id'])
            ? (int) $_GET['id']
            : null;
        saveMateri($database, $id);
    }

    if (in_array($method, ['PUT', 'PATCH'], true)) {
        $id = isset($_GET['id']) && ctype_digit((string) $_GET['id'])
            ? (int) $_GET['id']
            : 0;

        if ($id <= 0) {
            sendJsonResponse(['success' => false, 'message' => 'Parameter id wajib diisi.'], 400);
        }

        saveMateri($database, $id);
    }

    if ($method === 'DELETE') {
        $id = isset($_GET['id']) && ctype_digit((string) $_GET['id'])
            ? (int) $_GET['id']
            : 0;

        if ($id <= 0) {
            sendJsonResponse(['success' => false, 'message' => 'Parameter id wajib diisi.'], 400);
        }

        deleteMateri($database, $id);
    }

    sendJsonResponse([
        'success' => false,
        'message' => 'Method tidak diizinkan.',
    ], 405);
} catch (Throwable $error) {
    sendJsonResponse([
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error' => $error->getMessage(),
        'api_version' => MATERI_API_VERSION,
    ], 500);
}
