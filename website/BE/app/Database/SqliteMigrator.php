<?php

declare(strict_types=1);

namespace Arduflow\Api\Database;

use PDO;

final class SqliteMigrator
{
    public function __construct(private readonly string $migrationDirectory)
    {
    }

    public function migrate(PDO $pdo): int
    {
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS schema_migrations (' .
            'version TEXT PRIMARY KEY, applied_at TEXT NOT NULL' .
            ')'
        );

        $applied = $pdo->query('SELECT version FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN);
        $count = 0;
        foreach (glob(rtrim($this->migrationDirectory, '/\\') . '/*.sql') ?: [] as $file) {
            $version = pathinfo($file, PATHINFO_FILENAME);
            if (in_array($version, $applied, true)) {
                continue;
            }

            $sql = file_get_contents($file);
            if ($sql === false) {
                throw new \RuntimeException('Migration SQLite tidak dapat dibaca.');
            }

            Transaction::immediate($pdo, static function () use ($pdo, $sql, $version): void {
                $pdo->exec($sql);
                $statement = $pdo->prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (:version, :applied_at)');
                $statement->execute(['version' => $version, 'applied_at' => gmdate('c')]);
            });
            $count++;
        }

        return $count;
    }
}
