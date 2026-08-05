<?php

declare(strict_types=1);

namespace Arduflow\Api\Services;

use Arduflow\Api\Database\ConnectionFactory;
use Arduflow\Api\Http\HttpException;
use Arduflow\Api\Support\Config;
use Arduflow\Api\Validation\SyncEventValidator;
use PDO;
use PDOException;

final class MysqlSyncReceiverService
{
    private const DATE_COLUMNS = [
        'email_verified_at', 'verification_sent_at', 'password_reset_sent_at', 'password_reset_expires_at',
        'last_login_at', 'deleted_at', 'created_at', 'updated_at', 'start_at', 'end_at',
    ];

    public function __construct(
        private readonly ConnectionFactory $connections,
        private readonly Config $config,
        private readonly SyncEventValidator $validator,
    ) {
    }

    public function registerNonce(string $nonce): void
    {
        $pdo = $this->connections->mysql();
        $cutoff = gmdate(
            'Y-m-d H:i:s',
            time() - ((int) $this->config->get('sync.max_clock_skew_seconds', 300) * 2),
        );
        $pdo->prepare('DELETE FROM sync_nonces WHERE created_at < :cutoff')->execute(['cutoff' => $cutoff]);
        try {
            $pdo->prepare('INSERT INTO sync_nonces (nonce, created_at) VALUES (:nonce, UTC_TIMESTAMP())')
                ->execute(['nonce' => $nonce]);
        } catch (PDOException $exception) {
            if ($exception->getCode() === '23000') {
                throw new HttpException(409, 'Nonce sudah pernah digunakan.');
            }
            throw $exception;
        }
    }

    public function processBatch(array $events): array
    {
        $results = [];
        foreach ($events as $event) {
            try {
                if (!is_array($event)) {
                    throw new \InvalidArgumentException('Event harus berupa object.');
                }
                $results[] = $this->processEvent($event);
            } catch (\Throwable $exception) {
                $message = substr($exception->getMessage() ?: 'Event gagal diproses.', 0, 240);
                $invalid = $exception instanceof \InvalidArgumentException;
                $results[] = [
                    'eventId' => is_array($event) ? ($event['eventId'] ?? null) : null,
                    'status' => 'failed',
                    'retryable' => !$invalid,
                    'error' => $message,
                ];
            }
        }
        return $results;
    }

    public function processEvent(array $event): array
    {
        $this->validator->validate($event);
        $pdo = $this->connections->mysql();
        $pdo->beginTransaction();
        try {
            $processed = $pdo->prepare(
                'SELECT event_id FROM processed_sync_events WHERE event_id = :event_id FOR UPDATE'
            );
            $processed->execute(['event_id' => $event['eventId']]);
            if ($processed->fetch()) {
                $pdo->commit();
                return ['eventId' => $event['eventId'], 'status' => 'already_processed'];
            }

            $table = (string) $event['tableName'];
            $existing = $pdo->prepare("SELECT version FROM `{$table}` WHERE id = :id FOR UPDATE");
            $existing->execute(['id' => $event['rowId']]);
            $current = $existing->fetch();
            if ($current && (int) ($current['version'] ?? 1) > (int) $event['version']) {
                $this->rememberEvent($pdo, (string) $event['eventId']);
                $pdo->commit();
                return ['eventId' => $event['eventId'], 'status' => 'stale_ignored'];
            }

            $payload = $event['payload'];
            $columns = array_keys($payload);
            $identifiers = array_map(static fn (string $column): string => '`' . $column . '`', $columns);
            $placeholders = array_map(static fn (string $column): string => ':' . $column, $columns);
            $updates = array_map(
                static fn (string $column): string => "`{$column}` = VALUES(`{$column}`)",
                array_values(array_filter($columns, static fn (string $column): bool => $column !== 'id')),
            );
            $statement = $pdo->prepare(sprintf(
                'INSERT INTO `%s` (%s) VALUES (%s) ON DUPLICATE KEY UPDATE %s',
                $table,
                implode(', ', $identifiers),
                implode(', ', $placeholders),
                implode(', ', $updates),
            ));
            $values = [];
            foreach ($payload as $column => $value) {
                $values[$column] = in_array($column, self::DATE_COLUMNS, true)
                    ? $this->mysqlDate($value)
                    : $value;
            }
            $statement->execute($values);
            $this->rememberEvent($pdo, (string) $event['eventId']);
            $pdo->commit();
            return ['eventId' => $event['eventId'], 'status' => 'synced'];
        } catch (\Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            if ($exception instanceof PDOException && $exception->getCode() === '23000') {
                $check = $pdo->prepare('SELECT event_id FROM processed_sync_events WHERE event_id = :event_id');
                $check->execute(['event_id' => $event['eventId']]);
                if ($check->fetch()) {
                    return ['eventId' => $event['eventId'], 'status' => 'already_processed'];
                }
            }
            throw $exception;
        }
    }

    private function rememberEvent(PDO $pdo, string $eventId): void
    {
        $pdo->prepare(
            'INSERT INTO processed_sync_events (event_id, processed_at) VALUES (:event_id, UTC_TIMESTAMP())'
        )->execute(['event_id' => $eventId]);
    }

    private function mysqlDate(mixed $value): mixed
    {
        if ($value === null || $value === '') {
            return $value;
        }
        $timestamp = strtotime((string) $value);
        return $timestamp === false ? $value : gmdate('Y-m-d H:i:s', $timestamp);
    }
}
