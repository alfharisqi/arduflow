<?php

declare(strict_types=1);

const MIGRATION_RUNNER_TOKEN = '4d30a705b17960f3261940595439567b599be50d33b35acb';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('X-Robots-Tag: noindex, nofollow');

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if (!in_array($method, ['GET', 'POST'], true)) {
    http_response_code(405);
    header('Allow: GET, POST');
    echo json_encode([
        'success' => false,
        'message' => 'Method tidak diizinkan.',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$token = (string) ($_GET['token'] ?? $_POST['token'] ?? '');

if (!hash_equals(MIGRATION_RUNNER_TOKEN, $token)) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Token migration tidak valid.',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$script = __DIR__ . '/scripts/migrate.php';

if (!is_file($script)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'File scripts/migrate.php tidak ditemukan.',
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

try {
    ob_start();
    require $script;
    $output = trim((string) ob_get_clean());
    $decoded = json_decode($output, true);

    echo json_encode([
        'success' => true,
        'message' => 'Migration selesai dijalankan. Hapus file run-migrate.php setelah ini.',
        'result' => is_array($decoded) ? $decoded : $output,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $exception) {
    if (ob_get_level() > 0) {
        ob_end_clean();
    }

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Migration gagal dijalankan.',
        'error' => $exception->getMessage(),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
