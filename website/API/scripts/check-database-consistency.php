<?php

declare(strict_types=1);

$context = require dirname(__DIR__) . '/bootstrap/context.php';
$sqlite = $context['connections']->sqlite();
try {
    $mysql = $context['connections']->mysql();
} catch (Throwable) {
    fwrite(STDERR, json_encode([
        'status' => 'failed',
        'message' => 'MySQL tidak dapat dihubungi. Pemeriksaan hanya membaca data dan tidak mengubah SQLite.',
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL);
    exit(1);
}
$tables = ['users', 'admins', 'leads', 'workshops', 'programs', 'tutorials', 'projects'];
$report = ['tables' => [], 'outboxPending' => 0];

foreach ($tables as $table) {
    $sqliteRows = $sqlite->query("SELECT id, version, updated_at, deleted_at FROM {$table}")->fetchAll();
    $mysqlRows = $mysql->query("SELECT id, version, updated_at, deleted_at FROM `{$table}`")->fetchAll();
    $sqliteById = [];
    $mysqlById = [];
    foreach ($sqliteRows as $row) {
        $sqliteById[(string) $row['id']] = $row;
    }
    foreach ($mysqlRows as $row) {
        $mysqlById[(string) $row['id']] = $row;
    }
    $common = array_intersect(array_keys($sqliteById), array_keys($mysqlById));
    $versionMismatch = $updatedMismatch = $deletedMismatch = [];
    foreach ($common as $id) {
        if ((int) $sqliteById[$id]['version'] !== (int) $mysqlById[$id]['version']) {
            $versionMismatch[] = $id;
        }
        if ((string) $sqliteById[$id]['updated_at'] !== (string) $mysqlById[$id]['updated_at']) {
            $updatedMismatch[] = $id;
        }
        if ((string) ($sqliteById[$id]['deleted_at'] ?? '') !== (string) ($mysqlById[$id]['deleted_at'] ?? '')) {
            $deletedMismatch[] = $id;
        }
    }
    $report['tables'][$table] = [
        'sqlite' => count($sqliteRows), 'mysql' => count($mysqlRows),
        'missingInMysql' => array_values(array_diff(array_keys($sqliteById), array_keys($mysqlById))),
        'missingInSqlite' => array_values(array_diff(array_keys($mysqlById), array_keys($sqliteById))),
        'versionMismatch' => $versionMismatch, 'updatedAtMismatch' => $updatedMismatch,
        'deletedAtMismatch' => $deletedMismatch,
    ];
}
$report['outboxPending'] = (int) $sqlite->query("SELECT COUNT(*) FROM sync_outbox WHERE status IN ('pending', 'processing', 'failed')")->fetchColumn();

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
