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
$tables = [
    'users',
    'admins',
    'leads',
    'workshops',
    'programs',
    'tutorials',
    'projects',
    'project_submissions',
    'transactions',
    'payment_methods',
    'user_entitlements',
];
$report = ['tables' => [], 'outboxPending' => 0];

function sqliteTableExists(PDO $pdo, string $table): bool
{
    $statement = $pdo->prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = :table LIMIT 1");
    $statement->execute(['table' => $table]);
    return $statement->fetchColumn() !== false;
}

function mysqlTableExists(PDO $pdo, string $table): bool
{
    $statement = $pdo->prepare(
        'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table LIMIT 1'
    );
    $statement->execute(['table' => $table]);
    return $statement->fetchColumn() !== false;
}

function sqliteColumns(PDO $pdo, string $table): array
{
    return array_map(
        static fn (array $column): string => (string) $column['name'],
        $pdo->query("PRAGMA table_info({$table})")->fetchAll(PDO::FETCH_ASSOC),
    );
}

function mysqlColumns(PDO $pdo, string $table): array
{
    $statement = $pdo->prepare(
        'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table'
    );
    $statement->execute(['table' => $table]);
    return array_map('strval', $statement->fetchAll(PDO::FETCH_COLUMN));
}

foreach ($tables as $table) {
    if (!sqliteTableExists($sqlite, $table) || !mysqlTableExists($mysql, $table)) {
        $report['tables'][$table] = [
            'sqliteTableExists' => sqliteTableExists($sqlite, $table),
            'mysqlTableExists' => mysqlTableExists($mysql, $table),
            'skipped' => true,
            'reason' => 'table_missing',
        ];
        continue;
    }

    $sqliteColumns = sqliteColumns($sqlite, $table);
    $mysqlColumns = mysqlColumns($mysql, $table);
    $columns = array_values(array_intersect(['id', 'version', 'updated_at', 'deleted_at'], $sqliteColumns, $mysqlColumns));
    if (!in_array('id', $columns, true)) {
        $report['tables'][$table] = [
            'skipped' => true,
            'reason' => 'id_column_missing',
        ];
        continue;
    }

    $select = implode(', ', $columns);
    $mysqlSelect = implode(', ', array_map(static fn (string $column): string => "`{$column}`", $columns));
    $sqliteRows = $sqlite->query("SELECT {$select} FROM {$table}")->fetchAll();
    $mysqlRows = $mysql->query("SELECT {$mysqlSelect} FROM `{$table}`")->fetchAll();
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
        if (in_array('version', $columns, true) && (int) $sqliteById[$id]['version'] !== (int) $mysqlById[$id]['version']) {
            $versionMismatch[] = $id;
        }
        if (in_array('updated_at', $columns, true) && (string) $sqliteById[$id]['updated_at'] !== (string) $mysqlById[$id]['updated_at']) {
            $updatedMismatch[] = $id;
        }
        if (in_array('deleted_at', $columns, true) && (string) ($sqliteById[$id]['deleted_at'] ?? '') !== (string) ($mysqlById[$id]['deleted_at'] ?? '')) {
            $deletedMismatch[] = $id;
        }
    }
    $report['tables'][$table] = [
        'sqlite' => count($sqliteRows), 'mysql' => count($mysqlRows),
        'checkedColumns' => $columns,
        'missingInMysql' => array_values(array_diff(array_keys($sqliteById), array_keys($mysqlById))),
        'missingInSqlite' => array_values(array_diff(array_keys($mysqlById), array_keys($sqliteById))),
        'versionMismatch' => $versionMismatch, 'updatedAtMismatch' => $updatedMismatch,
        'deletedAtMismatch' => $deletedMismatch,
    ];
}
$report['outboxPending'] = (int) $sqlite->query("SELECT COUNT(*) FROM sync_outbox WHERE status IN ('pending', 'processing', 'failed')")->fetchColumn();

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
