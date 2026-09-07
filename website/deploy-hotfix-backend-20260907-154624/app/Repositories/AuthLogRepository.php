<?php

declare(strict_types=1);

namespace Arduflow\Api\Repositories;

use Arduflow\Api\Support\Clock;
use PDO;

final class AuthLogRepository
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function record(string $event, bool $success, ?int $userId = null, string $identifier = '', array $meta = []): void
    {
        try {
            $statement = $this->pdo->prepare(
                'INSERT INTO auth_logs (' .
                'event_type, actor_type, actor_id, success, identifier_hash, ip_address, user_agent, details, created_at' .
                ') VALUES (:event_type, :actor_type, :actor_id, :success, :identifier_hash, :ip_address, ' .
                ':user_agent, :details, :created_at)'
            );
            $statement->execute([
                'event_type' => $event,
                'actor_type' => 'user',
                'actor_id' => $userId,
                'success' => $success ? 1 : 0,
                'identifier_hash' => $identifier !== '' ? hash('sha256', strtolower($identifier)) : null,
                'ip_address' => $meta['ip'] ?? null,
                'user_agent' => $meta['user_agent'] ?? null,
                'details' => null,
                'created_at' => Clock::now(),
            ]);
        } catch (\Throwable) {
            // Audit logging must not break an otherwise valid authentication request.
        }
    }
}
