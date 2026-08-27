<?php

declare(strict_types=1);

namespace Arduflow\Api\Repositories;

use Arduflow\Api\Database\Transaction;
use Arduflow\Api\Support\Clock;
use PDO;

final class WorkshopRepository
{
    public function __construct(
        private readonly PDO $pdo,
        private readonly OutboxRepository $outbox,
    ) {
    }

    public function all(): array
    {
        return $this->pdo->query(
            'SELECT * FROM workshops WHERE deleted_at IS NULL ORDER BY start_at IS NULL, start_at ASC, id DESC'
        )->fetchAll();
    }

    public function find(int $id): ?array
    {
        $statement = $this->pdo->prepare('SELECT * FROM workshops WHERE id = :id AND deleted_at IS NULL');
        $statement->execute(['id' => $id]);
        return $statement->fetch() ?: null;
    }

    public function create(array $data, int $adminId): array
    {
        return Transaction::immediate($this->pdo, function () use ($data, $adminId): array {
            $now = Clock::now();
            $statement = $this->pdo->prepare(
                'INSERT INTO workshops (title, description, category, method, location, meeting_url, start_at, end_at, ' .
                'capacity, status, certificate_enabled, created_by_admin_id, version, created_at, updated_at) ' .
                'VALUES (:title, :description, :category, :method, :location, :meeting_url, :start_at, :end_at, ' .
                ':capacity, :status, :certificate_enabled, :admin_id, 1, :created_at, :updated_at)'
            );
            $statement->execute([
                'title' => $data['title'],
                'description' => $data['description'],
                'category' => $data['category'],
                'method' => $data['method'],
                'location' => $data['location'],
                'meeting_url' => $data['meeting_url'],
                'start_at' => $data['start_at'],
                'end_at' => $data['end_at'],
                'capacity' => $data['capacity'],
                'status' => $data['status'],
                'certificate_enabled' => $data['certificate_enabled'],
                'admin_id' => $adminId,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $id = (int) $this->pdo->lastInsertId();
            $this->outbox->enqueue($this->pdo, 'workshops', $id, 'insert');
            return $this->find($id) ?? throw new \RuntimeException('Workshop baru tidak ditemukan.');
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
                'UPDATE workshops SET title = :title, description = :description, category = :category, method = :method, ' .
                'location = :location, meeting_url = :meeting_url, start_at = :start_at, end_at = :end_at, ' .
                'capacity = :capacity, status = :status, certificate_enabled = :certificate_enabled, ' .
                'version = version + 1, updated_at = :updated_at WHERE id = :id AND deleted_at IS NULL'
            );
            $statement->execute([
                'title' => $data['title'], 'description' => $data['description'], 'category' => $data['category'],
                'method' => $data['method'], 'location' => $data['location'], 'meeting_url' => $data['meeting_url'],
                'start_at' => $data['start_at'], 'end_at' => $data['end_at'], 'capacity' => $data['capacity'],
                'status' => $data['status'], 'certificate_enabled' => $data['certificate_enabled'],
                'updated_at' => Clock::now(), 'id' => $id,
            ]);
            $this->outbox->enqueue($this->pdo, 'workshops', $id, 'update');
            return $this->find($id);
        });
    }

    public function softDelete(int $id): bool
    {
        return Transaction::immediate($this->pdo, function () use ($id): bool {
            $now = Clock::now();
            $statement = $this->pdo->prepare(
                'UPDATE workshops SET deleted_at = :deleted_at, version = version + 1, updated_at = :updated_at ' .
                'WHERE id = :id AND deleted_at IS NULL'
            );
            $statement->execute(['deleted_at' => $now, 'updated_at' => $now, 'id' => $id]);
            if ($statement->rowCount() === 0) {
                return false;
            }
            $this->outbox->enqueue($this->pdo, 'workshops', $id, 'delete');
            return true;
        });
    }
}
