<?php

declare(strict_types=1);

namespace Arduflow\Api\Repositories;

use Arduflow\Api\Database\Transaction;
use Arduflow\Api\Support\Clock;
use PDO;

final class ProgramRepository
{
    public function __construct(private readonly PDO $pdo, private readonly OutboxRepository $outbox)
    {
    }

    public function all(): array
    {
        return $this->pdo->query('SELECT * FROM programs WHERE deleted_at IS NULL ORDER BY id DESC')->fetchAll();
    }

    public function find(int $id): ?array
    {
        $statement = $this->pdo->prepare('SELECT * FROM programs WHERE id = :id AND deleted_at IS NULL');
        $statement->execute(['id' => $id]);
        return $statement->fetch() ?: null;
    }

    public function create(array $data): array
    {
        return Transaction::immediate($this->pdo, function () use ($data): array {
            $now = Clock::now();
            $statement = $this->pdo->prepare(
                'INSERT INTO programs (name, description, status, version, created_at, updated_at) ' .
                'VALUES (:name, :description, :status, 1, :created_at, :updated_at)'
            );
            $statement->execute([
                'name' => $data['name'], 'description' => $data['description'], 'status' => $data['status'],
                'created_at' => $now, 'updated_at' => $now,
            ]);
            $id = (int) $this->pdo->lastInsertId();
            $this->outbox->enqueue($this->pdo, 'programs', $id, 'insert');
            return $this->find($id) ?? throw new \RuntimeException('Program baru tidak ditemukan.');
        });
    }

    public function update(int $id, array $changes): ?array
    {
        return Transaction::immediate($this->pdo, function () use ($id, $changes): ?array {
            $current = $this->find($id);
            if (!$current) {
                return null;
            }
            $data = [...$current, ...$changes];
            $statement = $this->pdo->prepare(
                'UPDATE programs SET name = :name, description = :description, status = :status, ' .
                'version = version + 1, updated_at = :updated_at WHERE id = :id AND deleted_at IS NULL'
            );
            $statement->execute([
                'name' => $data['name'], 'description' => $data['description'], 'status' => $data['status'],
                'updated_at' => Clock::now(), 'id' => $id,
            ]);
            $this->outbox->enqueue($this->pdo, 'programs', $id, 'update');
            return $this->find($id);
        });
    }

    public function softDelete(int $id): bool
    {
        return Transaction::immediate($this->pdo, function () use ($id): bool {
            $now = Clock::now();
            $statement = $this->pdo->prepare(
                'UPDATE programs SET deleted_at = :deleted_at, version = version + 1, updated_at = :updated_at ' .
                'WHERE id = :id AND deleted_at IS NULL'
            );
            $statement->execute(['deleted_at' => $now, 'updated_at' => $now, 'id' => $id]);
            if ($statement->rowCount() === 0) {
                return false;
            }
            $this->outbox->enqueue($this->pdo, 'programs', $id, 'delete');
            return true;
        });
    }
}
