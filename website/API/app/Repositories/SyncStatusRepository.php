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
}
