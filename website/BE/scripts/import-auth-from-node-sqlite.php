<?php

declare(strict_types=1);

use Arduflow\Api\Database\SqliteMigrator;
use Arduflow\Api\Support\Env;
use Arduflow\Api\Support\Path;
$context = require dirname(__DIR__) . '/bootstrap/context.php';
$root = $context['root'];
$target = $context['connections']->sqlite();
(new SqliteMigrator($root . '/migrations/sqlite'))->migrate($target);

$sourcePath = Path::resolve(
    $root,
    (string) Env::get('NODE_SQLITE_DATABASE_PATH', '../BE/storage/database/arduflow.sqlite'),
);
$targetPath = $context['connections']->sqlitePath();

if (!is_file($sourcePath)) {
    fwrite(STDERR, "SQLite backend Node tidak ditemukan: {$sourcePath}" . PHP_EOL);
    exit(1);
}
if (realpath($sourcePath) === realpath($targetPath)) {
    fwrite(STDERR, 'Database sumber dan target tidak boleh sama.' . PHP_EOL);
    exit(1);
}

$backupDirectory = Path::resolve($root, 'storage/backups/sqlite');
if (!is_dir($backupDirectory) && !mkdir($backupDirectory, 0775, true) && !is_dir($backupDirectory)) {
    throw new RuntimeException('Folder backup SQLite tidak dapat dibuat.');
}
$backupPath = $backupDirectory . DIRECTORY_SEPARATOR . 'pre-auth-import-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.sqlite';
$escapedBackup = str_replace("'", "''", $backupPath);
$target->exec("VACUUM INTO '{$escapedBackup}'");

$source = new PDO('sqlite:' . $sourcePath, null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);
$source->exec('PRAGMA query_only = ON');

$definitions = [
    'users' => [
        'id', 'name', 'username', 'nickname', 'email', 'whatsapp', 'occupation', 'institution_name',
        'profile_image', 'password_hash', 'email_verified_at', 'verification_token', 'verification_sent_at',
        'password_reset_token', 'password_reset_sent_at', 'password_reset_expires_at', 'deleted_at',
        'version', 'created_at', 'updated_at',
    ],
    'admins' => [
        'id', 'username', 'email', 'name', 'password_hash', 'role', 'is_active', 'last_login_at',
        'deleted_at', 'version', 'created_at', 'updated_at',
    ],
];

$summary = [];
foreach ($definitions as $table => $columns) {
    $rows = $source->query('SELECT * FROM ' . $table . ' ORDER BY id')->fetchAll();
    $columnList = implode(', ', $columns);
    $placeholders = implode(', ', array_map(static fn (string $column): string => ':' . $column, $columns));
    $updates = implode(', ', array_map(
        static fn (string $column): string => $column . ' = excluded.' . $column,
        array_values(array_filter($columns, static fn (string $column): bool => $column !== 'id')),
    ));
    $statement = $target->prepare(
        "INSERT INTO {$table} ({$columnList}) VALUES ({$placeholders}) " .
        "ON CONFLICT(id) DO UPDATE SET {$updates}"
    );

    $imported = 0;
    $failed = 0;
    $target->beginTransaction();
    foreach ($rows as $index => $row) {
        $savepoint = 'import_' . $table . '_' . $index;
        $target->exec('SAVEPOINT ' . $savepoint);
        try {
            $payload = [];
            foreach ($columns as $column) {
                $payload[$column] = $row[$column] ?? null;
            }
            if ($table === 'admins' && trim((string) $payload['email']) === '') {
                $payload['email'] = $payload['username'] . '@arduflow.local';
            }
            $payload['version'] = max(1, (int) ($payload['version'] ?? 1));
            $statement->execute($payload);
            $target->exec('RELEASE SAVEPOINT ' . $savepoint);
            $imported++;
        } catch (Throwable $exception) {
            $target->exec('ROLLBACK TO SAVEPOINT ' . $savepoint);
            $target->exec('RELEASE SAVEPOINT ' . $savepoint);
            $failed++;
            fwrite(STDERR, sprintf(
                "%s id=%s gagal: %s%s",
                $table,
                (string) ($row['id'] ?? '?'),
                $exception->getMessage(),
                PHP_EOL,
            ));
        }
    }
    $target->commit();
    $summary[$table] = ['sourceRows' => count($rows), 'imported' => $imported, 'failed' => $failed];
}

// Sesi Node tidak dipindahkan agar semua token lama dicabut saat cutover.
$target->exec('DELETE FROM user_sessions');
$target->exec('DELETE FROM admin_sessions');

echo json_encode([
    'source' => $sourcePath,
    'target' => $targetPath,
    'backup' => $backupPath,
    'outboxCreated' => 0,
    'sessionsImported' => 0,
    'tables' => $summary,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;

exit(array_sum(array_column($summary, 'failed')) > 0 ? 1 : 0);
