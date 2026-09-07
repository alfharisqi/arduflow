<?php

declare(strict_types=1);

namespace Arduflow\Api\Services;

use Arduflow\Api\Support\Config;
use Arduflow\Api\Support\Path;
use PDO;

final class SqliteBackupService
{
    public function __construct(
        private readonly PDO $sqlite,
        private readonly Config $config,
        private readonly string $root,
        private readonly string $sourcePath,
    ) {
    }

    public function run(bool $force = false): array
    {
        if (!$force && !(bool) $this->config->get('backup.enabled', true)) {
            return ['enabled' => false, 'backup' => null, 'removed' => 0];
        }
        if ($this->sourcePath === ':memory:') {
            throw new \RuntimeException('Database SQLite memory tidak dapat dibackup sebagai file operasional.');
        }

        $directory = Path::resolve($this->root, (string) $this->config->get('backup.directory', 'storage/backups/sqlite'));
        Path::ensurePrivate($this->root, $directory);
        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            throw new \RuntimeException('Folder backup SQLite tidak dapat dibuat.');
        }

        $target = $directory . DIRECTORY_SEPARATOR . 'arduflow-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(3)) . '.sqlite';
        $this->sqlite->exec('VACUUM INTO ' . $this->sqlite->quote($target));
        $check = new PDO('sqlite:' . $target);
        if ($check->query('PRAGMA quick_check')->fetchColumn() !== 'ok') {
            @unlink($target);
            throw new \RuntimeException('Hasil backup SQLite gagal pemeriksaan integritas.');
        }

        return ['enabled' => true, 'backup' => $target, 'removed' => $this->prune($directory)];
    }

    private function prune(string $directory): int
    {
        $retentionDays = max(1, (int) $this->config->get('backup.retention_days', 14));
        $cutoff = time() - ($retentionDays * 86400);
        $removed = 0;
        foreach (glob($directory . DIRECTORY_SEPARATOR . 'arduflow-*.sqlite') ?: [] as $file) {
            if (is_file($file) && filemtime($file) < $cutoff && @unlink($file)) {
                $removed++;
            }
        }
        return $removed;
    }
}
