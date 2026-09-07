<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$root = dirname(__DIR__);
require $root . '/vendor/autoload.php';
require $root . '/api/support/query-indexes.php';
\Arduflow\Api\Support\Env::load($root . '/.env');
$config = require $root . '/config/database.php';
$path = (string) $config['sqlite']['path'];
if (!preg_match('~^(?:[A-Za-z]:[\\\\/]|/)~', $path)) {
    $path = $root . '/' . $path;
}
if (!is_file($path)) {
    throw new RuntimeException('Database tidak ditemukan: ' . $path);
}
$pdo = new PDO('sqlite:' . $path, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec('PRAGMA busy_timeout = ' . max(5000, (int) $config['sqlite']['busy_timeout_ms']));
$backupDirectory = $root . '/storage/backups';
if (!is_dir($backupDirectory) && !mkdir($backupDirectory, 0775, true) && !is_dir($backupDirectory)) {
    throw new RuntimeException('Folder backup tidak dapat dibuat.');
}
$backup = $backupDirectory . '/before-api-indexes-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(4)) . '.sqlite';
// Consistent SQLite snapshot, including committed WAL data, before adding indexes.
$pdo->exec('VACUUM INTO ' . $pdo->quote($backup));
$pdo->beginTransaction();
try {
    $result = afwInstallApiQueryIndexes($pdo);
    $pdo->commit();
} catch (Throwable $error) {
    $pdo->rollBack();
    throw $error;
}
$pdo->exec('PRAGMA optimize');
echo json_encode(['success' => true, 'backup' => $backup, ...$result], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
