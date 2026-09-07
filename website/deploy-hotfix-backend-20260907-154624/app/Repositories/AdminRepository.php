<?php

declare(strict_types=1);

namespace Arduflow\Api\Repositories;

use Arduflow\Api\Database\Transaction;
use Arduflow\Api\Support\Clock;
use Arduflow\Api\Support\Uuid;
use PDO;

final class AdminRepository
{
    public function __construct(
        private readonly PDO $pdo,
        private readonly OutboxRepository $outbox,
    ) {
    }

    public function findByUsername(string $username): ?array
    {
        return $this->one(
            'SELECT * FROM admins WHERE LOWER(username) = LOWER(:username) AND deleted_at IS NULL',
            ['username' => $username],
        );
    }

    public function findBySessionHash(string $tokenHash): ?array
    {
        $admin = $this->one(
            'SELECT admins.* FROM admin_sessions ' .
            'INNER JOIN admins ON admins.id = admin_sessions.admin_id ' .
            'WHERE admin_sessions.token_hash = :token_hash AND admin_sessions.expires_at > :now ' .
            'AND admins.is_active = 1 AND admins.deleted_at IS NULL',
            ['token_hash' => $tokenHash, 'now' => Clock::now()],
        );
        if ($admin) {
            $this->pdo->prepare(
                'UPDATE admin_sessions SET last_used_at = :last_used_at WHERE token_hash = :token_hash'
            )->execute(['last_used_at' => Clock::now(), 'token_hash' => $tokenHash]);
        }
        return $admin;
    }

    public function recordLogin(int $id, ?string $replacementHash = null): array
    {
        return Transaction::immediate($this->pdo, function () use ($id, $replacementHash): array {
            $now = Clock::now();
            if ($replacementHash !== null) {
                $statement = $this->pdo->prepare(
                    'UPDATE admins SET password_hash = :password_hash, last_login_at = :last_login_at, ' .
                    'version = version + 1, updated_at = :updated_at WHERE id = :id AND deleted_at IS NULL'
                );
                $statement->execute([
                    'password_hash' => $replacementHash,
                    'last_login_at' => $now,
                    'updated_at' => $now,
                    'id' => $id,
                ]);
            } else {
                $statement = $this->pdo->prepare(
                    'UPDATE admins SET last_login_at = :last_login_at, version = version + 1, ' .
                    'updated_at = :updated_at WHERE id = :id AND deleted_at IS NULL'
                );
                $statement->execute(['last_login_at' => $now, 'updated_at' => $now, 'id' => $id]);
            }
            $this->outbox->enqueue($this->pdo, 'admins', $id, 'update');
            return $this->findById($id) ?? throw new \RuntimeException('Admin tidak ditemukan.');
        });
    }

    public function createSession(int $adminId, string $tokenHash, string $expiresAt): void
    {
        Transaction::immediate($this->pdo, function () use ($adminId, $tokenHash, $expiresAt): void {
            $this->pdo->prepare('DELETE FROM admin_sessions WHERE expires_at <= :now')
                ->execute(['now' => Clock::now()]);
            $this->pdo->prepare(
                'INSERT INTO admin_sessions (id, admin_id, token_hash, expires_at, created_at) ' .
                'VALUES (:id, :admin_id, :token_hash, :expires_at, :created_at)'
            )->execute([
                'id' => Uuid::v4(),
                'admin_id' => $adminId,
                'token_hash' => $tokenHash,
                'expires_at' => $expiresAt,
                'created_at' => Clock::now(),
            ]);
        });
    }

    public function deleteSession(string $tokenHash): void
    {
        $this->pdo->prepare('DELETE FROM admin_sessions WHERE token_hash = :token_hash')
            ->execute(['token_hash' => $tokenHash]);
    }

    public function upsert(array $admin): array
    {
        return Transaction::immediate($this->pdo, function () use ($admin): array {
            $existing = $this->findByUsername($admin['username']);
            $now = Clock::now();
            $statement = $this->pdo->prepare(
                'INSERT INTO admins (username, name, email, password_hash, role, is_active, version, created_at, updated_at) ' .
                'VALUES (:username, :name, :email, :password_hash, :role, 1, 1, :created_at, :updated_at) ' .
                'ON CONFLICT(username) DO UPDATE SET name = excluded.name, email = excluded.email, ' .
                'password_hash = excluded.password_hash, role = excluded.role, is_active = 1, deleted_at = NULL, ' .
                'version = admins.version + 1, updated_at = excluded.updated_at'
            );
            $statement->execute([
                'username' => $admin['username'],
                'name' => $admin['name'],
                'email' => $admin['email'],
                'password_hash' => $admin['password_hash'],
                'role' => $admin['role'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $row = $this->findByUsername($admin['username']) ?? throw new \RuntimeException('Admin gagal disimpan.');
            $this->outbox->enqueue($this->pdo, 'admins', $row['id'], $existing ? 'update' : 'insert');
            return $row;
        });
    }

    private function findById(int $id): ?array
    {
        return $this->one('SELECT * FROM admins WHERE id = :id AND deleted_at IS NULL', ['id' => $id]);
    }

    private function one(string $sql, array $params): ?array
    {
        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);
        $row = $statement->fetch();
        return $row ?: null;
    }
}
