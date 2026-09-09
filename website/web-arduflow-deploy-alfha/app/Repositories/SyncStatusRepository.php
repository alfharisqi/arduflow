<?php

declare(strict_types=1);

namespace Arduflow\Api\Repositories;

use PDO;

final class SyncStatusRepository
{
    public function __construct(private readonly PDO $sqlite)
    {
    }

    public function summary(): array
    {
        $counts = ['pending' => 0, 'processing' => 0, 'failed' => 0];
        $statement = $this->sqlite->query(
            "SELECT status, COUNT(*) AS total FROM sync_outbox " .
            "WHERE status IN ('pending', 'processing', 'failed') GROUP BY status"
        );
        foreach ($statement->fetchAll() as $row) {
            $counts[(string) $row['status']] = (int) $row['total'];
        }

        $syncedToday = (int) $this->sqlite->query(
            "SELECT COUNT(*) FROM sync_outbox WHERE status = 'synced' AND date(synced_at) = date('now')"
        )->fetchColumn();

        $last = $this->sqlite->query(
            'SELECT started_at, finished_at, success_events FROM sync_logs ORDER BY id DESC LIMIT 1'
        )->fetch() ?: null;
        $lastSuccess = $this->sqlite->query(
            'SELECT finished_at FROM sync_logs WHERE success_events > 0 AND finished_at IS NOT NULL ORDER BY id DESC LIMIT 1'
        )->fetchColumn();

        return [
            ...$counts,
            'synced_today' => $syncedToday,
            'last_sync_at' => $last['started_at'] ?? null,
            'last_success_at' => $lastSuccess ?: null,
        ];
    }

    public function logs(int $limit = 10): array
    {
        $limit = max(1, min(50, $limit));
        $statement = $this->sqlite->query(
            'SELECT id, batch_id, total_events, success_events, failed_events, started_at, finished_at, ' .
            'duration_ms, mysql_status FROM sync_logs ORDER BY id DESC LIMIT ' . $limit
        );

        return array_map(static fn (array $row): array => [
            'id' => (int) $row['id'],
            'batch_id' => (string) ($row['batch_id'] ?? ''),
            'total_events' => (int) ($row['total_events'] ?? 0),
            'success_events' => (int) ($row['success_events'] ?? 0),
            'failed_events' => (int) ($row['failed_events'] ?? 0),
            'started_at' => $row['started_at'] ?? null,
            'finished_at' => $row['finished_at'] ?? null,
            'duration_ms' => $row['duration_ms'] === null ? null : (int) $row['duration_ms'],
            'mysql_status' => $row['mysql_status'] ?? null,
        ], $statement->fetchAll());
    }

    public function deleteLog(int $id): bool
    {
        $statement = $this->sqlite->prepare('DELETE FROM sync_logs WHERE id = :id');
        $statement->execute([':id' => $id]);

        return $statement->rowCount() > 0;
    }

    public function clearLogs(): int
    {
        $statement = $this->sqlite->prepare('DELETE FROM sync_logs');
        $statement->execute();

        return $statement->rowCount();
    }
}
