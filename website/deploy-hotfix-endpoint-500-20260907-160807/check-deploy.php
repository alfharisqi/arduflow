<?php

declare(strict_types=1);

const DEPLOY_CHECK_TOKEN = '4d30a705b17960f3261940595439567b599be50d33b35acb';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Robots-Tag: noindex, nofollow');

$token = (string) ($_GET['token'] ?? '');

if (!hash_equals(DEPLOY_CHECK_TOKEN, $token)) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Token deploy check tidak valid.',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

spl_autoload_register(static function (string $class): void {
    $prefix = 'Arduflow\\Api\\';

    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relativeClass = substr($class, strlen($prefix));
    $file = __DIR__ . '/app/' . str_replace('\\', '/', $relativeClass) . '.php';

    if (is_file($file)) {
        require_once $file;
    }
});

$root = __DIR__;
$requiredFiles = [
    'api/testimonials-api.php',
    'api/user-notifications-api.php',
    'api/auth/session.php',
    'api/support/bootstrap.php',
    'app/Database/LegacyApiMigrator.php',
    'app/Database/ApiQueryIndexes.php',
    'app/Database/SqliteMigrator.php',
    'app/Support/Env.php',
    'bootstrap/context.php',
    'config/database.php',
    'migrations/sqlite/001_initial.sql',
    'scripts/migrate.php',
];

$files = [];

foreach ($requiredFiles as $file) {
    $path = $root . '/' . $file;
    $files[$file] = [
        'exists' => is_file($path),
        'size' => is_file($path) ? filesize($path) : null,
    ];
}

$classes = [];

foreach ([
    'Arduflow\\Api\\Support\\Env',
    'Arduflow\\Api\\Database\\LegacyApiMigrator',
    'Arduflow\\Api\\Database\\ApiQueryIndexes',
    'Arduflow\\Api\\Database\\SqliteMigrator',
] as $class) {
    $classes[$class] = class_exists($class);
}

$database = [
    'config_loaded' => false,
    'path' => null,
    'exists' => false,
    'tables' => [],
    'error' => null,
];

try {
    if (class_exists('Arduflow\\Api\\Support\\Env')) {
        \Arduflow\Api\Support\Env::load($root . '/.env');
    }

    $config = require $root . '/config/database.php';
    $database['config_loaded'] = true;
    $databasePath = (string) ($config['sqlite']['path'] ?? '');

    if ($databasePath !== '' && !preg_match('/^([A-Za-z]:[\\\\\\/]|\\/)/', $databasePath)) {
        $databasePath = $root . '/' . str_replace(['/', '\\'], '/', $databasePath);
    }

    $database['path'] = $databasePath;
    $database['exists'] = is_file($databasePath);

    if (is_file($databasePath)) {
        $pdo = new PDO('sqlite:' . $databasePath, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        foreach ([
            'users',
            'auth_tokens',
            'admin_auth_tokens',
            'articles',
            'workshops',
            'materi',
            'materi_chapters',
            'materi_learning_objectives',
            'materi_slides',
            'projects',
            'partners',
            'testimonials',
            'transactions',
            'user_notifications',
            'schema_migrations',
            'legacy_api_migrations',
        ] as $table) {
            $statement = $pdo->prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = :name");
            $statement->execute([':name' => $table]);
            $exists = (bool) $statement->fetchColumn();
            $columns = [];

            if ($exists) {
                $columnRows = $pdo->query('PRAGMA table_info(' . $table . ')')->fetchAll();
                $columns = array_map(static fn (array $row): string => (string) $row['name'], $columnRows);
            }

            $database['tables'][$table] = [
                'exists' => $exists,
                'columns' => $columns,
            ];
        }
    }
} catch (Throwable $exception) {
    $database['error'] = $exception->getMessage();
}

echo json_encode([
    'success' => true,
    'message' => 'Deploy check selesai. Hapus file check-deploy.php setelah dipakai.',
    'php_version' => PHP_VERSION,
    'root' => $root,
    'files' => $files,
    'classes' => $classes,
    'database' => $database,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
