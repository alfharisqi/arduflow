<?php

declare(strict_types=1);

namespace Arduflow\Api\Repositories;

use Arduflow\Api\Support\Clock;
use Arduflow\Api\Support\Uuid;
use PDO;

final class OutboxRepository
{
    private const COLUMNS = [
        'users' => [
            'id', 'name', 'username', 'nickname', 'email', 'whatsapp', 'occupation',
            'institution_name', 'profile_image', 'password_hash', 'email_verified_at',
            'verification_token', 'verification_sent_at', 'password_reset_token',
            'password_reset_sent_at', 'password_reset_expires_at', 'deleted_at',
            'version', 'created_at', 'updated_at',
        ],
        'admins' => [
            'id', 'username', 'name', 'email', 'password_hash', 'role', 'is_active',
            'last_login_at', 'deleted_at', 'version', 'created_at', 'updated_at',
        ],
    ];

    public function enqueue(PDO $pdo, string $table, int|string $rowId, string $operation): string
    {
        if (!isset(self::COLUMNS[$table]) || !in_array($operation, ['insert', 'update', 'delete'], true)) {
            throw new \InvalidArgumentException('Event outbox tidak diizinkan.');
        }

        $columns = self::COLUMNS[$table];
        $statement = $pdo->prepare(sprintf(
            'SELECT %s FROM %s WHERE id = :id',
            implode(', ', $columns),
            $table,
        ));
        $statement->execute(['id' => $rowId]);
        $row = $statement->fetch();
        if (!$row) {
            throw new \RuntimeException('Row untuk event outbox tidak ditemukan.');
        }

        $id = Uuid::v4();
        $eventId = Uuid::v4();
        $now = Clock::now();
        $insert = $pdo->prepare(
            'INSERT INTO sync_outbox (' .
            'id, event_id, table_name, row_id, operation, payload, version, status, retry_count, created_at, updated_at' .
            ") VALUES (:id, :event_id, :table_name, :row_id, :operation, :payload, :version, 'pending', 0, :created_at, :updated_at)"
        );
        $insert->execute([
            'id' => $id,
            'event_id' => $eventId,
            'table_name' => $table,
            'row_id' => (string) $rowId,
            'operation' => $operation,
            'payload' => json_encode($row, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
            'version' => (int) ($row['version'] ?? 1),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        return $eventId;
    }
}
