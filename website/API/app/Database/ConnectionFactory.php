<?php

declare(strict_types=1);

namespace Arduflow\Api\Database;

use Arduflow\Api\Support\Config;
use Arduflow\Api\Support\Path;
use PDO;

final class ConnectionFactory
{
    private ?PDO $sqlite = null;
    private ?PDO $mysql = null;

    public function __construct(
        private readonly Config $config,
        private readonly string $root,
    ) {
    }

    public function sqlite(): PDO
    {
        if ($this->sqlite instanceof PDO) {
            return $this->sqlite;
        }

        $path = $this->sqlitePath();
        Path::ensurePrivate($this->root, $path);
        $directory = dirname($path);
        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            throw new \RuntimeException('Folder database SQLite tidak dapat dibuat.');
        }

        $pdo = new PDO('sqlite:' . $path, null, null, $this->pdoOptions());
        $pdo->exec('PRAGMA journal_mode = WAL');
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA busy_timeout = ' . (int) $this->config->get('database.sqlite.busy_timeout_ms', 5000));
        $pdo->exec('PRAGMA synchronous = NORMAL');
        $this->sqlite = $pdo;

        return $pdo;
    }

    public function mysql(bool $withDatabase = true): PDO
    {
        if ($withDatabase && $this->mysql instanceof PDO) {
            return $this->mysql;
        }

        $host = (string) $this->config->get('database.mysql.host');
        $port = (int) $this->config->get('database.mysql.port', 3306);
        $database = (string) $this->config->get('database.mysql.database');
        $dsn = sprintf('mysql:host=%s;port=%d;charset=utf8mb4', $host, $port);
        if ($withDatabase) {
            $dsn .= ';dbname=' . $database;
        }

        $pdo = new PDO(
            $dsn,
            (string) $this->config->get('database.mysql.username'),
            (string) $this->config->get('database.mysql.password'),
            [
                ...$this->pdoOptions(),
                PDO::ATTR_TIMEOUT => (int) $this->config->get('database.mysql.connect_timeout_seconds', 3),
            ],
        );

        if ($withDatabase) {
            $this->mysql = $pdo;
        }
        return $pdo;
    }

    public function sqlitePath(): string
    {
        return Path::resolve($this->root, (string) $this->config->get('database.sqlite.path'));
    }

    private function pdoOptions(): array
    {
        return [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
    }
}
