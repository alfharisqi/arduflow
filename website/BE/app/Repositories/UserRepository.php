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
            'AND user_sessions.expires_at > :now AND users.is_active = 1 AND users.deleted_at IS NULL',
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

    public function setActiveStatus(int $id, bool $isActive): ?array
    {
        return Transaction::immediate($this->pdo, function () use ($id, $isActive): ?array {
            $now = Clock::now();
            $statement = $this->pdo->prepare(
                'UPDATE users SET is_active = :is_active, version = version + 1, updated_at = :updated_at ' .
                'WHERE id = :id AND deleted_at IS NULL'
            );
            $statement->execute([
                'is_active' => $isActive ? 1 : 0,
                'updated_at' => $now,
                'id' => $id,
            ]);
            if ($statement->rowCount() === 0) {
                return null;
            }

            if (!$isActive) {
                $this->pdo->prepare('DELETE FROM user_sessions WHERE user_id = :user_id')
                    ->execute(['user_id' => $id]);
            }
            $this->outbox->enqueue($this->pdo, 'users', $id, 'update');
            return $this->findById($id);
        });
    }

    public function adminIndex(array $filters = []): array
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = max(1, min(50, (int) ($filters['perPage'] ?? 10)));
        $offset = ($page - 1) * $perPage;
        [$where, $params] = $this->adminWhere($filters);

        $total = $this->countAdminUsers($where, $params);
        $statement = $this->pdo->prepare(
            'SELECT users.id, users.name, users.username, users.email, users.whatsapp, users.occupation, ' .
            'users.institution_name, users.profile_image, users.avatar_path, users.is_active, users.email_verified_at, users.verification_token, users.verification_sent_at, ' .
            'users.created_at, latest_session.last_login_at, active_session.user_id AS active_user_id ' .
            'FROM users ' .
            'LEFT JOIN (SELECT user_id, MAX(COALESCE(last_used_at, created_at)) AS last_login_at FROM user_sessions GROUP BY user_id) latest_session ' .
            'ON latest_session.user_id = users.id ' .
            'LEFT JOIN (SELECT DISTINCT user_id FROM user_sessions WHERE expires_at > :now) active_session ' .
            'ON active_session.user_id = users.id ' .
            "WHERE {$where} ORDER BY users.created_at DESC LIMIT :limit OFFSET :offset"
        );

        foreach ($params as $name => $value) {
            $statement->bindValue(':' . $name, $value);
        }
        $statement->bindValue(':now', Clock::now());
        $statement->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $statement->bindValue(':offset', $offset, PDO::PARAM_INT);
        $statement->execute();

        return [
            'users' => array_map([$this, 'adminUserRow'], $statement->fetchAll()),
            'pagination' => [
                'page' => $page,
                'perPage' => $perPage,
                'total' => $total,
                'from' => $total === 0 ? 0 : $offset + 1,
                'to' => min($offset + $perPage, $total),
                'lastPage' => max(1, (int) ceil($total / $perPage)),
            ],
        ];
    }

    public function adminSummary(): array
    {
        $now = Clock::now();
        $weekAgo = gmdate('c', time() - 604800);
        $total = $this->count('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL');
        $active = $this->count(
            'SELECT COUNT(DISTINCT users.id) FROM users INNER JOIN user_sessions ON user_sessions.user_id = users.id ' .
            'WHERE users.deleted_at IS NULL AND user_sessions.expires_at > :now',
            ['now' => $now],
        );
        $unverified = $this->count('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND email_verified_at IS NULL');
        $newUsers = $this->count(
            'SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND created_at >= :since',
            ['since' => $weekAgo],
        );

        return [
            ['id' => 'total', 'label' => 'Total User', 'value' => $total, 'note' => 'Semua akun terdaftar'],
            ['id' => 'active', 'label' => 'User Aktif', 'value' => $active, 'note' => $total > 0 ? round(($active / $total) * 100, 1) . '% dari total user' : 'Belum ada sesi aktif'],
            ['id' => 'unverified', 'label' => 'Belum Verifikasi Email', 'value' => $unverified, 'note' => $total > 0 ? round(($unverified / $total) * 100, 1) . '% dari total user' : 'Belum ada user'],
            ['id' => 'newUsers', 'label' => 'User Baru (7 Hari)', 'value' => $newUsers, 'note' => 'Bergabung dalam 7 hari'],
            ['id' => 'inactive', 'label' => 'User Tidak Aktif', 'value' => max(0, $total - $active), 'note' => 'Tidak memiliki sesi aktif saat ini'],
        ];
    }

    public function adminProblems(): array
    {
        $threeDaysAgo = gmdate('c', time() - 259200);

        return [
            ['label' => 'Email belum verifikasi > 3 hari', 'count' => $this->count(
                'SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND email_verified_at IS NULL AND created_at < :since',
                ['since' => $threeDaysAgo],
            )],
            ['label' => 'Email verifikasi belum terkirim', 'count' => $this->count(
                'SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND email_verified_at IS NULL AND verification_sent_at IS NULL'
            )],
            ['label' => 'Banyak percobaan login gagal', 'count' => $this->count(
                "SELECT COUNT(*) FROM auth_logs WHERE success = 0 AND event_type = 'login_failed' AND created_at >= :since",
                ['since' => gmdate('c', time() - 604800)],
            )],
            ['label' => 'WhatsApp kosong', 'count' => $this->count(
                "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND (whatsapp IS NULL OR whatsapp = '')"
            )],
        ];
    }

    public function adminActivities(): array
    {
        $rows = $this->pdo->query(
            'SELECT auth_logs.event_type, auth_logs.created_at, users.name, users.email FROM auth_logs ' .
            'LEFT JOIN users ON users.id = auth_logs.actor_id ' .
            "WHERE auth_logs.actor_type = 'user' OR users.id IS NOT NULL " .
            'ORDER BY auth_logs.created_at DESC LIMIT 5'
        )->fetchAll();
        $labels = [
            'register_success' => 'Registrasi',
            'login_success' => 'Login',
            'login_failed' => 'Login gagal',
            'email_verified' => 'Verifikasi email',
            'profile_updated' => 'Update profil',
        ];

        return array_map(fn (array $row): array => [
            'name' => $row['name'] ?: ($row['email'] ?: 'User'),
            'action' => $labels[$row['event_type']] ?? $row['event_type'],
            'time' => $row['created_at'],
        ], $rows);
    }

    public function adminVerifyEmail(int $id): ?array
    {
        return Transaction::immediate($this->pdo, function () use ($id): ?array {
            $user = $this->findById($id);
            if (!$user) {
                return null;
            }

            $now = Clock::now();
            $statement = $this->pdo->prepare(
                'UPDATE users SET email_verified_at = :verified_at, verification_token = NULL, ' .
                'version = version + 1, updated_at = :updated_at WHERE id = :id AND deleted_at IS NULL'
            );
            $statement->execute([
                'verified_at' => $now,
                'updated_at' => $now,
                'id' => $id,
            ]);
            $this->outbox->enqueue($this->pdo, 'users', $id, 'update');

            return $this->findById($id);
        });
    }

    public function adminSetVerificationToken(int $id, string $hashedToken): ?array
    {
        return Transaction::immediate($this->pdo, function () use ($id, $hashedToken): ?array {
            $user = $this->findById($id);
            if (!$user) {
                return null;
            }

            $now = Clock::now();
            $statement = $this->pdo->prepare(
                'UPDATE users SET verification_token = :token, verification_sent_at = :sent_at, ' .
                'email_verified_at = NULL, version = version + 1, updated_at = :updated_at ' .
                'WHERE id = :id AND deleted_at IS NULL'
            );
            $statement->execute([
                'token' => $hashedToken,
                'sent_at' => $now,
                'updated_at' => $now,
                'id' => $id,
            ]);
            $this->outbox->enqueue($this->pdo, 'users', $id, 'update');

            return $this->findById($id);
        });
    }

    public function adminClearUnverifiedTokens(): int
    {
        return Transaction::immediate($this->pdo, function (): int {
            $statement = $this->pdo->prepare(
                'UPDATE users SET verification_token = NULL, version = version + 1, updated_at = :updated_at ' .
                'WHERE deleted_at IS NULL AND email_verified_at IS NULL AND verification_token IS NOT NULL'
            );
            $statement->execute(['updated_at' => Clock::now()]);

            return $statement->rowCount();
        });
    }

    private function one(string $sql, array $params): ?array
    {
        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);
        $row = $statement->fetch();
        return $row ?: null;
    }

    private function adminWhere(array $filters): array
    {
        $where = ['users.deleted_at IS NULL'];
        $params = [];
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $where[] = '(' .
                'LOWER(COALESCE(users.name, \'\')) LIKE :search OR ' .
                'LOWER(COALESCE(users.username, \'\')) LIKE :search OR ' .
                'LOWER(COALESCE(users.email, \'\')) LIKE :search OR ' .
                'LOWER(COALESCE(users.whatsapp, \'\')) LIKE :search' .
            ')';
            $params['search'] = '%' . strtolower($search) . '%';
        }

        if (($filters['emailStatus'] ?? '') === 'verified') {
            $where[] = 'users.email_verified_at IS NOT NULL';
        } elseif (($filters['emailStatus'] ?? '') === 'unverified') {
            $where[] = 'users.email_verified_at IS NULL';
        }

        if (trim((string) ($filters['occupation'] ?? '')) !== '') {
            $where[] = 'LOWER(COALESCE(users.occupation, \'\') || \' / \' || COALESCE(users.institution_name, \'\')) LIKE :occupation';
            $params['occupation'] = '%' . strtolower(trim((string) $filters['occupation'])) . '%';
        }

        if (trim((string) ($filters['dateFrom'] ?? '')) !== '') {
            $where[] = 'users.created_at >= :date_from';
            $params['date_from'] = trim((string) $filters['dateFrom']);
        }

        if (trim((string) ($filters['dateTo'] ?? '')) !== '') {
            $where[] = 'users.created_at <= :date_to';
            $params['date_to'] = trim((string) $filters['dateTo']);
        }

        return [implode(' AND ', $where), $params];
    }

    private function countAdminUsers(string $where, array $params): int
    {
        return $this->count("SELECT COUNT(*) FROM users WHERE {$where}", $params);
    }

    private function count(string $sql, array $params = []): int
    {
        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);
        return (int) $statement->fetchColumn();
    }

    private function adminUserRow(array $row): array
    {
        $work = trim((string) ($row['occupation'] ?? ''));
        $institution = trim((string) ($row['institution_name'] ?? ''));

        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'username' => $row['username'] ?: '-',
            'email' => $row['email'],
            'whatsapp' => $row['whatsapp'] ?: '-',
            'workplace' => trim($work . ($work !== '' && $institution !== '' ? ' / ' : '') . $institution) ?: '-',
            'emailStatus' => $row['email_verified_at'] ? 'Terverifikasi' : 'Belum Verifikasi',
            'emailVerifiedAt' => $row['email_verified_at'] ?: null,
            'verificationSentAt' => $row['verification_sent_at'] ?: null,
            'hasVerificationToken' => !empty($row['verification_token']),
            'accountStatus' => ((int) ($row['is_active'] ?? 1)) === 1 ? 'Aktif' : 'Nonaktif',
            'sessionStatus' => $row['active_user_id'] ? 'Online' : 'Offline',
            'isActive' => ((int) ($row['is_active'] ?? 1)) === 1,
            'registeredAt' => $row['created_at'],
            'lastLoginAt' => $row['last_login_at'] ?: null,
            'profileImage' => $row['profile_image'] ?? null,
            'avatarPath' => $row['avatar_path'] ?? null,
        ];
    }
}
