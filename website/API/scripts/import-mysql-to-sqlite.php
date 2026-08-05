<?php

declare(strict_types=1);

use Arduflow\Api\Database\SqliteMigrator;
use Arduflow\Api\Database\Transaction;
use Arduflow\Api\Services\SqliteBackupService;

$context = require dirname(__DIR__) . '/bootstrap/context.php';
$sqlite = $context['connections']->sqlite();
(new SqliteMigrator($context['root'] . '/migrations/sqlite'))->migrate($sqlite);
$backup = (new SqliteBackupService(
    $sqlite,
    $context['config'],
    $context['root'],
    $context['connections']->sqlitePath(),
))->run(true);
$mysql = null;
try {
    $mysql = $context['connections']->mysql();
} catch (Throwable $exception) {
    fwrite(STDERR, json_encode([
        'status' => 'failed',
        'message' => 'MySQL tidak dapat dihubungi. SQLite dan backup tidak berubah.',
        'backup' => $backup['backup'],
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL);
    exit(1);
}
$tables = ['admins', 'users', 'leads', 'workshops', 'programs', 'tutorials', 'projects'];
$result = ['backup' => $backup['backup'], 'tables' => []];

foreach ($tables as $table) {
    $sqliteColumns = array_column($sqlite->query("PRAGMA table_info({$table})")->fetchAll(), 'name');
    $mysqlColumns = array_column($mysql->query("DESCRIBE `{$table}`")->fetchAll(), 'Field');
    $columns = array_values(array_intersect($sqliteColumns, $mysqlColumns));
    if (!in_array('id', $columns, true)) {
        throw new RuntimeException("Tabel {$table} tidak mempunyai primary key id yang kompatibel.");
    }
    $quoted = implode(', ', array_map(static fn (string $column): string => '"' . $column . '"', $columns));
    $parameters = implode(', ', array_map(static fn (string $column): string => ':' . $column, $columns));
    $updates = implode(', ', array_map(
        static fn (string $column): string => '"' . $column . '" = excluded."' . $column . '"',
        array_values(array_filter($columns, static fn (string $column): bool => $column !== 'id')),
    ));
    $upsert = $sqlite->prepare(
        "INSERT INTO {$table} ({$quoted}) VALUES ({$parameters}) ON CONFLICT(id) DO UPDATE SET {$updates}"
    );
    $imported = 0;
    $failed = 0;
    $lastId = 0;
    do {
        $statement = $mysql->prepare("SELECT * FROM `{$table}` WHERE id > :last_id ORDER BY id ASC LIMIT 500");
        $statement->bindValue('last_id', $lastId, \PDO::PARAM_INT);
        $statement->execute();
        $rows = $statement->fetchAll();
        if ($rows === []) {
            break;
        }
        Transaction::immediate($sqlite, static function () use ($rows, $columns, $upsert, &$imported, &$failed, &$lastId): void {
            foreach ($rows as $row) {
                $lastId = max($lastId, (int) $row['id']);
                try {
                    $payload = [];
                    foreach ($columns as $column) {
                        $payload[$column] = $row[$column] ?? null;
                    }
                    $upsert->execute($payload);
                    $imported++;
                } catch (Throwable) {
                    $failed++;
                }
            }
        });
    } while (count($rows) === 500);

    $sourceRows = (int) $mysql->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();
    $result['tables'][$table] = ['sourceRows' => $sourceRows, 'imported' => $imported, 'failed' => $failed];
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
