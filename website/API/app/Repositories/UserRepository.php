<?php

declare(strict_types=1);

namespace Arduflow\Api\Repositories;

use Arduflow\Api\Database\Transaction;
use Arduflow\Api\Support\Clock;
use Arduflow\Api\Support\Uuid;
use PDO;

final class UserRepository
{
    public function __construct(
        private readonly PDO $pdo,
        private readonly OutboxRepository $outbox,
    ) {
    }

    public function findById(int $id): ?array
    {
        return $this->one('SELECT * FROM users WHERE id = :id AND deleted_at IS NULL', ['id' => $id]);
    }

    public function findByEmail(string $email): ?array
    {
        return $this->one(
            'SELECT * FROM users WHERE LOWER(email) = LOWER(:email) AND deleted_at IS NULL',
            ['email' => $email],
        );
    }

    public function findByWhatsapp(string $whatsapp): ?array
    {
        return $this->one(
            'SELECT * FROM users WHERE whatsapp = :whatsapp AND deleted_at IS NULL',
            ['whatsapp' => $whatsapp],
        );
    }

    public function findByUsername(string $username): ?array
    {
        return $this->one(
            'SELECT * FROM users WHERE LOWER(username) = LOWER(:username) AND deleted_at IS NULL',
            ['username' => $username],
        );
    }

    public function findByIdentifier(string $identifier): ?array
    {
        return $this->one(
            'SELECT * FROM users WHERE deleted_at IS NULL AND (' .
            'LOWER(email) = LOWER(:email) OR LOWER(name) = LOWER(:name) OR LOWER(username) = LOWER(:username)' .
            ') LIMIT 1',
            ['email' => $identifier, 'name' => $identifier, 'username' => $identifier],
        );
    }

    public function findBySessionHash(string $tokenHash): ?array
    {
        $user = $this->one(
            'SELECT users.* FROM user_sessions ' .
            'INNER JOIN users ON users.id = user_sessions.user_id ' .
            'WHERE user_sessions.token_hash = :token_hash ' .
            'AND user_sessions.expires_at > :now AND users.deleted_at IS NULL',
            ['token_hash' => $tokenHash, 'now' => Clock::now()],
        );

        if ($user) {
            $statement = $this->pdo->prepare(
                'UPDATE user_sessions SET last_used_at = :last_used_at WHERE token_hash = :token_hash'
            );
            $statement->execute(['last_used_at' => Clock::now(), 'token_hash' => $tokenHash]);
        }
        return $user;
    }

    public function create(array $data): array
    {
        return Transaction::immediate($this->pdo, function () use ($data): array {
            $now = Clock::now();
            $statement = $this->pdo->prepare(
                'INSERT INTO users (' .
                'name, email, whatsapp, occupation, password_hash, verification_token, verification_sent_at, ' .
                'version, created_at, updated_at' .
                ') VALUES (:name, :email, :whatsapp, :occupation, :password_hash, :verification_token, ' .
                ':verification_sent_at, 1, :created_at, :updated_at)'
            );
            $statement->execute([
                'name' => $data['name'],
                'email' => $data['email'],
                'whatsapp' => $data['whatsapp'] ?: null,
                'occupation' => $data['occupation'] ?: null,
                'password_hash' => $data['password_hash'],
                'verification_token' => $data['verification_token'],
                'verification_sent_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $id = (int) $this->pdo->lastInsertId();
            $this->outbox->enqueue($this->pdo, 'users', $id, 'insert');
            return $this->findById($id) ?? throw new \RuntimeException('User baru tidak ditemukan.');
        });
    }

    public function createSession(int $userId, string $tokenHash, string $expiresAt): void
    {
        Transaction::immediate($this->pdo, function () use ($userId, $tokenHash, $expiresAt): void {
            $this->pdo->prepare('DELETE FROM user_sessions WHERE expires_at <= :now')
                ->execute(['now' => Clock::now()]);
            $this->pdo->prepare(
                'INSERT INTO user_sessions (id, user_id, token_hash, expires_at, created_at) ' .
                'VALUES (:id, :user_id, :token_hash, :expires_at, :created_at)'
            )->execute([
                'id' => Uuid::v4(),
                'user_id' => $userId,
                'token_hash' => $tokenHash,
                'expires_at' => $expiresAt,
                'created_at' => Clock::now(),
            ]);
        });
    }

    public function deleteSession(string $tokenHash): void
    {
        $this->pdo->prepare('DELETE FROM user_sessions WHERE token_hash = :token_hash')
            ->execute(['token_hash' => $tokenHash]);
    }

    public function updatePasswordHash(int $id, string $passwordHash): array
    {
        return Transaction::immediate($this->pdo, function () use ($id, $passwordHash): array {
            $this->pdo->prepare(
                'UPDATE users SET password_hash = :password_hash, version = version + 1, updated_at = :updated_at ' .
                'WHERE id = :id AND deleted_at IS NULL'
            )->execute(['password_hash' => $passwordHash, 'updated_at' => Clock::now(), 'id' => $id]);
            $this->outbox->enqueue($this->pdo, 'users', $id, 'update');
            return $this->findById($id) ?? throw new \RuntimeException('User tidak ditemukan setelah rehash.');
        });
    }

    public function updateProfile(int $id, array $profile): ?array
    {
        return Transaction::immediate($this->pdo, function () use ($id, $profile): ?array {
            $statement = $this->pdo->prepare(
                'UPDATE users SET name = :name, username = :username, nickname = :nickname, ' .
                'whatsapp = :whatsapp, occupation = :occupation, institution_name = :institution_name, ' .
                'profile_image = :profile_image, version = version + 1, updated_at = :updated_at ' .
                'WHERE id = :id AND deleted_at IS NULL'
            );
            $statement->execute([
                'name' => $profile['name'],
                'username' => $profile['username'] ?: null,
                'nickname' => $profile['nickname'] ?: null,
                'whatsapp' => $profile['whatsapp'] ?: null,
                'occupation' => $profile['occupation'] ?: null,
                'institution_name' => $profile['institution_name'] ?: null,
                'profile_image' => $profile['profile_image'] ?: null,
                'updated_at' => Clock::now(),
                'id' => $id,
            ]);
            if ($statement->rowCount() === 0) {
                return null;
            }
            $this->outbox->enqueue($this->pdo, 'users', $id, 'update');
            return $this->findById($id);
        });
    }

    public function verifyEmail(string $rawToken, string $hashedToken): ?array
    {
        return Transaction::immediate($this->pdo, function () use ($rawToken, $hashedToken): ?array {
            $user = $this->one(
                'SELECT * FROM users WHERE deleted_at IS NULL ' .
                'AND (verification_token = :hashed OR verification_token = :raw) LIMIT 1',
                ['hashed' => $hashedToken, 'raw' => $rawToken],
            );
            if (!$user) {
                return null;
            }
            $now = Clock::now();
            $this->pdo->prepare(
                'UPDATE users SET email_verified_at = :verified_at, verification_token = NULL, ' .
                'version = version + 1, updated_at = :updated_at WHERE id = :id'
            )->execute(['verified_at' => $now, 'updated_at' => $now, 'id' => $user['id']]);
            $this->outbox->enqueue($this->pdo, 'users', $user['id'], 'update');
            return $this->findById((int) $user['id']);
        });
    }

    public function setPasswordResetToken(int $id, string $hashedToken, string $expiresAt): ?array
    {
        return Transaction::immediate($this->pdo, function () use ($id, $hashedToken, $expiresAt): ?array {
            $now = Clock::now();
            $statement = $this->pdo->prepare(
                'UPDATE users SET password_reset_token = :token, password_reset_sent_at = :sent_at, ' .
                'password_reset_expires_at = :expires_at, version = version + 1, updated_at = :updated_at ' .
                'WHERE id = :id AND deleted_at IS NULL'
            );
            $statement->execute([
                'token' => $hashedToken,
                'sent_at' => $now,
                'expires_at' => $expiresAt,
                'updated_at' => $now,
                'id' => $id,
            ]);
            if ($statement->rowCount() === 0) {
                return null;
            }
            $this->outbox->enqueue($this->pdo, 'users', $id, 'update');
            return $this->findById($id);
        });
    }

    public function resetPassword(string $rawToken, string $hashedToken, string $passwordHash): ?array
    {
        return Transaction::immediate($this->pdo, function () use ($rawToken, $hashedToken, $passwordHash): ?array {
            $user = $this->one(
                'SELECT * FROM users WHERE deleted_at IS NULL AND password_reset_expires_at > :now ' .
                'AND (password_reset_token = :hashed OR password_reset_token = :raw) LIMIT 1',
                ['now' => Clock::now(), 'hashed' => $hashedToken, 'raw' => $rawToken],
            );
            if (!$user) {
                return null;
            }
            $this->pdo->prepare(
                'UPDATE users SET password_hash = :password_hash, password_reset_token = NULL, ' .
                'password_reset_sent_at = NULL, password_reset_expires_at = NULL, version = version + 1, ' .
                'updated_at = :updated_at WHERE id = :id'
            )->execute([
                'password_hash' => $passwordHash,
                'updated_at' => Clock::now(),
                'id' => $user['id'],
            ]);
            $this->pdo->prepare('DELETE FROM user_sessions WHERE user_id = :user_id')
                ->execute(['user_id' => $user['id']]);
            $this->outbox->enqueue($this->pdo, 'users', $user['id'], 'update');
            return $this->findById((int) $user['id']);
        });
    }

    public function softDelete(int $id): bool
    {
        return Transaction::immediate($this->pdo, function () use ($id): bool {
            $now = Clock::now();
            $statement = $this->pdo->prepare(
                'UPDATE users SET deleted_at = :deleted_at, version = version + 1, updated_at = :updated_at ' .
                'WHERE id = :id AND deleted_at IS NULL'
            );
            $statement->execute(['deleted_at' => $now, 'updated_at' => $now, 'id' => $id]);
            if ($statement->rowCount() === 0) {
                return false;
            }
            $this->outbox->enqueue($this->pdo, 'users', $id, 'delete');
            $this->pdo->prepare('DELETE FROM user_sessions WHERE user_id = :user_id')
                ->execute(['user_id' => $id]);
            return true;
        });
    }

    private function one(string $sql, array $params): ?array
    {
        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);
        $row = $statement->fetch();
        return $row ?: null;
    }
}
