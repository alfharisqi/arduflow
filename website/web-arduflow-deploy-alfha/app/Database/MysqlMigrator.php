<?php

declare(strict_types=1);

namespace Arduflow\Api\Database;

use Arduflow\Api\Support\Config;
use PDO;

final class MysqlMigrator
{
    public function __construct(
        private readonly ConnectionFactory $connections,
        private readonly Config $config,
        private readonly string $migrationDirectory,
    ) {
    }

    public function migrate(): int
    {
        $database = (string) $this->config->get('database.mysql.database');
        if (preg_match('/^[A-Za-z0-9_]+$/', $database) !== 1) {
            throw new \RuntimeException('Nama database MySQL tidak valid.');
        }

        $server = $this->connections->mysql(false);
        $server->exec(sprintf(
            'CREATE DATABASE IF NOT EXISTS `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
            $database,
        ));

        $pdo = $this->connections->mysql();
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS schema_migrations (' .
            'version VARCHAR(191) PRIMARY KEY, applied_at DATETIME NOT NULL' .
            ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
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
                throw new \RuntimeException('Migration MySQL tidak dapat dibaca.');
            }

            // MySQL DDL performs an implicit commit, so migration DDL cannot be
            // represented as one reliable PDO transaction.
            foreach ($this->splitStatements($sql) as $statement) {
                $pdo->exec($statement);
            }
            $insert = $pdo->prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (:version, UTC_TIMESTAMP())');
            $insert->execute(['version' => $version]);
            $count++;
        }

        return $count;
    }

    /** @return list<string> */
    private function splitStatements(string $sql): array
    {
        return array_values(array_filter(
            array_map('trim', preg_split('/;\s*(?:\r?\n|$)/', $sql) ?: []),
            static fn (string $statement): bool => $statement !== '' && !str_starts_with($statement, '--'),
        ));
    }
}
