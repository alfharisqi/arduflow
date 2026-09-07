<?php

declare(strict_types=1);

namespace Arduflow\Api\Repositories;

use Arduflow\Api\Database\Transaction;
use Arduflow\Api\Support\Clock;
use PDO;

final class SyncOutboxRepository
{
    private const RETRY_MINUTES = [1, 5, 15, 30, 60];

    public function __construct(private readonly PDO $sqlite)
    {
    }

    public function claim(string $workerId, int $batchSize, int $processingTimeoutMinutes): array
    {
        return Transaction::immediate($this->sqlite, function () use ($workerId, $batchSize, $processingTimeoutMinutes): array {
            $now = Clock::now();
            $staleBefore = gmdate('Y-m-d\TH:i:s\Z', time() - ($processingTimeoutMinutes * 60));
            $this->sqlite->prepare(
                "UPDATE sync_outbox SET status = 'pending', worker_id = NULL, locked_at = NULL, updated_at = :updated " .
                "WHERE status = 'processing' AND locked_at IS NOT NULL AND locked_at < :stale_before"
            )->execute(['updated' => $now, 'stale_before' => $staleBefore]);

            $select = $this->sqlite->prepare(
                "SELECT * FROM sync_outbox WHERE status = 'pending' " .
                'AND (next_retry_at IS NULL OR next_retry_at <= :now) ORDER BY created_at ASC LIMIT :batch_size'
            );
            $select->bindValue(':now', $now);
            $select->bindValue(':batch_size', max(1, min(500, $batchSize)), PDO::PARAM_INT);
            $select->execute();
            $events = $select->fetchAll();

            $claim = $this->sqlite->prepare(
                "UPDATE sync_outbox SET status = 'processing', worker_id = :worker_id, locked_at = :locked_at, " .
                "updated_at = :updated_at WHERE id = :id AND status = 'pending'"
            );
            $claimed = [];
            foreach ($events as $event) {
                $claim->execute([
                    'worker_id' => $workerId,
                    'locked_at' => $now,
                    'updated_at' => $now,
                    'id' => $event['id'],
                ]);
                if ($claim->rowCount() === 1) {
                    $event['worker_id'] = $workerId;
                    $event['locked_at'] = $now;
                    $claimed[] = $event;
                }
            }
            return $claimed;
        });
    }

    public function markSynced(array $event): bool
    {
        $now = Clock::now();
        $statement = $this->sqlite->prepare(
            "UPDATE sync_outbox SET status = 'synced', synced_at = :synced_at, updated_at = :updated_at, " .
            'worker_id = NULL, locked_at = NULL, next_retry_at = NULL, last_error = NULL ' .
            "WHERE id = :id AND worker_id = :worker_id AND status = 'processing'"
        );
        $statement->execute([
            'synced_at' => $now,
            'updated_at' => $now,
            'id' => $event['id'],
            'worker_id' => $event['worker_id'],
        ]);
        return $statement->rowCount() === 1;
    }

    public function markFailed(array $event, string $error, bool $retryable = true): bool
    {
        $retryCount = (int) ($event['retry_count'] ?? 0) + 1;
        $retryIndex = min(max($retryCount - 1, 0), count(self::RETRY_MINUTES) - 1);
        $statement = $this->sqlite->prepare(
            'UPDATE sync_outbox SET status = :status, retry_count = :retry_count, next_retry_at = :next_retry_at, ' .
            'last_error = :last_error, worker_id = NULL, locked_at = NULL, updated_at = :updated_at ' .
            "WHERE id = :id AND worker_id = :worker_id AND status = 'processing'"
        );
        $statement->execute([
            'status' => $retryable ? 'pending' : 'failed',
            'retry_count' => $retryCount,
            'next_retry_at' => $retryable ? Clock::afterMinutes(self::RETRY_MINUTES[$retryIndex]) : null,
            'last_error' => substr($error !== '' ? $error : 'Sinkronisasi gagal.', 0, 500),
            'updated_at' => Clock::now(),
            'id' => $event['id'],
            'worker_id' => $event['worker_id'],
        ]);
        return $statement->rowCount() === 1;
    }

    public function createLog(string $batchId, int $total): void
    {
        $this->sqlite->prepare(
            'INSERT INTO sync_logs (batch_id, total_events, success_events, failed_events, started_at) ' .
            'VALUES (:batch_id, :total, 0, 0, :started_at)'
        )->execute(['batch_id' => $batchId, 'total' => $total, 'started_at' => Clock::now()]);
    }

    public function finishLog(
        string $batchId,
        int $success,
        int $failed,
        int $durationMs,
        string $mysqlStatus,
        ?string $error = null,
    ): void {
        $this->sqlite->prepare(
            'UPDATE sync_logs SET success_events = :success, failed_events = :failed, finished_at = :finished_at, ' .
            'duration_ms = :duration_ms, mysql_status = :mysql_status, error_message = :error WHERE batch_id = :batch_id'
        )->execute([
            'success' => $success,
            'failed' => $failed,
            'finished_at' => Clock::now(),
            'duration_ms' => max(0, $durationMs),
            'mysql_status' => $mysqlStatus,
            'error' => $error === null ? null : substr($error, 0, 500),
            'batch_id' => $batchId,
        ]);
    }

    public function retryFailed(): int
    {
        $statement = $this->sqlite->prepare(
            "UPDATE sync_outbox SET status = 'pending', next_retry_at = NULL, worker_id = NULL, locked_at = NULL, " .
            "updated_at = :updated_at WHERE status = 'failed'"
        );
        $statement->execute(['updated_at' => Clock::now()]);
        return $statement->rowCount();
    }
}
