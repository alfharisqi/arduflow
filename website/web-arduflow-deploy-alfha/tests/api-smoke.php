<?php

declare(strict_types=1);

// Run legacy entrypoints in subprocesses against disposable, consistent DB snapshots.
$projectRoot = dirname(__DIR__);
require $projectRoot . '/vendor/autoload.php';

if (($argv[1] ?? '') === '--request') {
    $fixtureRoot = $argv[2];
    $endpoint = $argv[3];
    parse_str($argv[4] ?? '', $_GET);
    foreach (['SQLITE_DATABASE_PATH' => $fixtureRoot . '/storage/database/arduflow.sqlite', 'MAIL_ENABLED' => 'false', 'MQTT_ENABLED' => 'false', 'SYNC_ENABLED' => 'false'] as $key => $value) {
        putenv($key . '=' . $value);
        $_ENV[$key] = $value;
    }
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_SERVER['REQUEST_URI'] = '/api/' . $endpoint;
    $_SERVER['SCRIPT_NAME'] = '/api/' . $endpoint;
    $_SERVER['HTTP_HOST'] = '127.0.0.1:8000';
    $_SERVER['SERVER_PORT'] = '8000';
    http_response_code(200);
    register_shutdown_function(static function (): void {
        fwrite(STDERR, 'API_STATUS=' . http_response_code() . PHP_EOL);
    });
    require $fixtureRoot . '/api/' . $endpoint;
    exit;
}

$baseline = $argv[1] ?? null;
$runRoot = sys_get_temp_dir() . '/arduflow-api-smoke-' . bin2hex(random_bytes(8));
mkdir($runRoot, 0700, true);
\Arduflow\Api\Support\Env::load($projectRoot . '/.env');
$config = require $projectRoot . '/config/database.php';
$sourceDatabase = (string) $config['sqlite']['path'];
if (!preg_match('~^(?:[A-Za-z]:[\\\\/]|/)~', $sourceDatabase)) { $sourceDatabase = $projectRoot . '/' . $sourceDatabase; }
if (!is_file($sourceDatabase)) { throw new RuntimeException('Source database missing'); }
$db = new PDO('sqlite:' . $sourceDatabase, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$db->exec('VACUUM INTO ' . $db->quote($runRoot . '/content.sqlite'));
$certificateSource = $projectRoot . '/database/arduflow.sqlite';
if (is_file($certificateSource)) {
    $cert = new PDO('sqlite:' . $certificateSource, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $cert->exec('VACUUM INTO ' . $cert->quote($runRoot . '/certificates.sqlite'));
}

$variants = ['current' => $projectRoot . '/api'];
if ($baseline !== null) { $variants['baseline'] = $baseline; }
foreach ($variants as $variant => $source) {
    $fixture = $runRoot . '/' . $variant;
    foreach (['api', 'config', 'storage/database', 'database', 'vendor'] as $directory) { mkdir($fixture . '/' . $directory, 0700, true); }
    file_put_contents($fixture . '/vendor/autoload.php', '<?php require_once ' . var_export($projectRoot . '/vendor/autoload.php', true) . ';');
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($source, FilesystemIterator::SKIP_DOTS));
    foreach ($iterator as $file) {
        if (!$file->isFile() || $file->getExtension() !== 'php') { continue; }
        $relative = substr($file->getPathname(), strlen($source) + 1);
        $target = $fixture . '/api/' . $relative;
        if (!is_dir(dirname($target))) { mkdir(dirname($target), 0700, true); }
        copy($file->getPathname(), $target);
    }
    copy($projectRoot . '/config/database.php', $fixture . '/config/database.php');
    copy($runRoot . '/content.sqlite', $fixture . '/storage/database/arduflow.sqlite');
    if ($variant === 'current') {
        $fixtureDatabase = new PDO('sqlite:' . $fixture . '/storage/database/arduflow.sqlite', null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);
        (new \Arduflow\Api\Database\LegacyApiMigrator())->migrate($fixtureDatabase);
    }
    if (is_file($runRoot . '/certificates.sqlite')) { copy($runRoot . '/certificates.sqlite', $fixture . '/database/arduflow.sqlite'); }
}

$cases = [
    ['article-api.php', '', 200], ['materi-api.php', '', 200],
    ['projects-api.php', '', 200], ['partners-api.php', '', 200],
    ['testimonials-api.php', '', 200], ['galery-api.php', '', 200],
    ['workshop-api.php', '', 200], ['transactions-api.php', '', 200],
    ['transactions-api.php', 'action=payment-methods', 200],
    ['formhandle.php', 'scope=user&email=audit-performance%40example.invalid', 200],
    ['formhandle.php', '', 200], ['ide-config-api.php', '', 200],
    ['certificate-api.php', '', 200],
    ['user-notifications-api.php', 'email=audit-performance%40example.invalid&sendEmail=0', 200],
    ['auth/session.php', '', 401], ['auth/login.php', '', 405],
    ['auth/profile.php', '', 405], ['admin/session.php', '', 401], ['admin/login.php', '', 405],
];
$fixturePaths = [];
foreach (array_keys($variants) as $variant) {
    $fixturePaths[] = $runRoot . '/' . $variant;
    $fixturePaths[] = str_replace('/', DIRECTORY_SEPARATOR, $runRoot . '/' . $variant);
}
$normalize = static function (mixed $value) use (&$normalize, $fixturePaths): mixed {
    if (is_string($value)) { return str_replace($fixturePaths, '<fixture>', $value); }
    if (!is_array($value)) { return $value; }
    // Request timestamp and fixture-specific filesystem diagnostics are not content.
    unset($value['generated_at'], $value['database']);
    return array_map($normalize, $value);
};
$results = [];
$passed = true;
foreach ($cases as [$endpoint, $query, $expected]) {
    $responses = [];
    foreach ($variants as $variant => $_source) {
        $process = proc_open([PHP_BINARY, '-d', 'display_errors=stderr', __FILE__, '--request', $runRoot . '/' . $variant, $endpoint, $query],
            [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        if (!is_resource($process)) { throw new RuntimeException('Cannot start PHP subprocess'); }
        fclose($pipes[0]);
        $body = stream_get_contents($pipes[1]); fclose($pipes[1]);
        $errors = stream_get_contents($pipes[2]); fclose($pipes[2]);
        $exitCode = proc_close($process);
        preg_match('/API_STATUS=(\d+)/', $errors, $match);
        $decoded = json_decode($body, true);
        $responses[$variant] = ['status' => (int) ($match[1] ?? 0), 'body' => $decoded, 'bytes' => strlen($body), 'exit' => $exitCode];
    }
    $current = $responses['current'];
    $ok = $current['exit'] === 0 && $current['status'] === $expected && is_array($current['body']);
    $equal = !isset($responses['baseline']) || ($responses['baseline']['status'] === $current['status']
        && $normalize($responses['baseline']['body']) === $normalize($current['body']));
    $passed = $passed && $ok && $equal;
    $results[] = ['endpoint' => $endpoint . ($query ? '?' . $query : ''), 'status' => $current['status'],
        'passed' => $ok, 'baseline_equal' => $equal,
        'bytes_before' => $responses['baseline']['bytes'] ?? null, 'bytes_after' => $current['bytes']];
}
echo json_encode(['success' => $passed, 'cases' => count($results), 'fixtures' => $runRoot, 'results' => $results], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
exit($passed ? 0 : 1);
