<?php

declare(strict_types=1);

namespace Arduflow\Api\Controllers;

use Arduflow\Api\Database\ConnectionFactory;
use Arduflow\Api\Http\Request;
use Arduflow\Api\Http\Response;
use Arduflow\Api\Repositories\SyncOutboxRepository;
use Arduflow\Api\Repositories\SyncStatusRepository;
use Arduflow\Api\Services\AuthSessionService;
use Arduflow\Api\Services\SqliteBackupService;
use Arduflow\Api\Services\SqliteToMysqlSyncService;
use Arduflow\Api\Support\Config;

final class AdminDatabaseSyncController
{
    public function __construct(
        private readonly Config $config,
        private readonly ConnectionFactory $connections,
        private readonly AuthSessionService $sessions,
        private readonly SyncStatusRepository $statusRepository,
        private readonly SyncOutboxRepository $outbox,
        private readonly SqliteToMysqlSyncService $worker,
        private readonly SqliteBackupService $backup,
    ) {
    }

    public function status(Request $request): Response
    {
        if (!$this->sessions->admin($request)) {
            return Response::json(['message' => 'Akses admin diperlukan.'], 401);
        }
        $summary = $this->statusRepository->summary();
        return Response::json([
            'enabled' => (bool) $this->config->get('sync.enabled', true),
            'pending' => $summary['pending'],
            'processing' => $summary['processing'],
            'failed' => $summary['failed'],
            'synced_today' => $summary['synced_today'],
            'last_sync_at' => $summary['last_sync_at'],
            'last_success_at' => $summary['last_success_at'],
            'mysql_reachable' => $this->mysqlReachable(),
            'scheduler' => $this->schedulerStatus(),
            'logs' => $this->statusRepository->logs(10),
        ]);
    }

    public function run(Request $request): Response
    {
        if (!$this->sessions->admin($request)) {
            return Response::json(['message' => 'Akses admin diperlukan.'], 401);
        }
        try {
            $result = $this->worker->run();
            return Response::json(['message' => 'Worker sinkronisasi selesai dijalankan.', 'result' => $result]);
        } catch (\Throwable $exception) {
            return Response::json(['message' => $exception->getMessage()], 503);
        }
    }

    public function retryFailed(Request $request): Response
    {
        if (!$this->sessions->admin($request)) {
            return Response::json(['message' => 'Akses admin diperlukan.'], 401);
        }
        $retried = $this->outbox->retryFailed();
        return Response::json(['message' => "{$retried} event dikembalikan ke antrean.", 'retried' => $retried]);
    }

    public function backup(Request $request): Response
    {
        if (!$this->sessions->admin($request)) {
            return Response::json(['message' => 'Akses admin diperlukan.'], 401);
        }

        try {
            return Response::json([
                'message' => 'Backup SQLite berhasil dibuat.',
                'result' => $this->backup->run(true),
                'backups' => $this->backupList(),
            ], 201);
        } catch (\Throwable $exception) {
            return Response::json(['message' => $exception->getMessage()], 503);
        }
    }

    public function backups(Request $request): Response
    {
        if (!$this->sessions->admin($request)) {
            return Response::json(['message' => 'Akses admin diperlukan.'], 401);
        }

        return Response::json([
            'backups' => $this->backupList(),
        ]);
    }

    private function mysqlReachable(): bool
    {
        try {
            return (int) $this->connections->mysql()->query('SELECT 1')->fetchColumn() === 1;
        } catch (\Throwable) {
            return false;
        }
    }

    private function schedulerStatus(): array
    {
        $taskName = 'ArduFlow SQLite to MySQL Sync';

        if (PHP_OS_FAMILY !== 'Windows') {
            return [
                'supported' => false,
                'installed' => false,
                'running' => false,
                'task_name' => $taskName,
                'message' => 'Scheduler Windows tidak tersedia di sistem ini.',
            ];
        }

        $command = 'schtasks /Query /TN "' . $taskName . '" /FO LIST /V 2>NUL';
        $output = shell_exec($command);
        if (!is_string($output) || trim($output) === '') {
            return [
                'supported' => true,
                'installed' => false,
                'running' => false,
                'task_name' => $taskName,
                'message' => 'Task scheduler belum terpasang.',
            ];
        }

        $fields = [];
        foreach (preg_split('/\r\n|\r|\n/', $output) ?: [] as $line) {
            if (!str_contains($line, ':')) {
                continue;
            }
            [$key, $value] = array_map('trim', explode(':', $line, 2));
            if ($key !== '') {
                $fields[$key] = $value;
            }
        }

        $status = $fields['Status'] ?? '';
        return [
            'supported' => true,
            'installed' => true,
            'running' => strcasecmp($status, 'Running') === 0 || strcasecmp($status, 'Ready') === 0,
            'task_name' => $taskName,
            'status' => $status ?: null,
            'last_run_at' => $fields['Last Run Time'] ?? null,
            'next_run_at' => $fields['Next Run Time'] ?? null,
            'last_result' => $fields['Last Result'] ?? null,
            'schedule' => $fields['Schedule Type'] ?? null,
            'modifier' => $fields['Schedule Modifier'] ?? null,
        ];
    }

    private function backupList(): array
    {
        $directory = (string) $this->config->get('backup.directory', 'storage/backups/sqlite');
        if (!preg_match('/^[A-Za-z]:[\\\\\/]/', $directory) && !str_starts_with($directory, '/')) {
            $directory = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $directory);
        }

        $rows = [];
        foreach (glob(rtrim($directory, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'arduflow-*.sqlite') ?: [] as $file) {
            if (!is_file($file)) {
                continue;
            }

            $rows[] = [
                'name' => basename($file),
                'path' => $file,
                'size' => filesize($file) ?: 0,
                'created_at' => gmdate('c', filemtime($file) ?: time()),
            ];
        }

        usort($rows, static fn (array $left, array $right): int => strcmp($right['created_at'], $left['created_at']));
        return array_slice($rows, 0, 20);
    }
}
