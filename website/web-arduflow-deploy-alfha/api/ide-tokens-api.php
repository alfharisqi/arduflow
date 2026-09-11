<?php

declare(strict_types=1);

require_once __DIR__ . '/support/bootstrap.php';

afwApplyCors(['GET', 'POST', 'PATCH']);

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$action = trim((string) ($_GET['action'] ?? ''));

function ideTokensNow(): string
{
    return gmdate('Y-m-d\TH:i:s\Z');
}

function ideTokenTableExists(PDO $pdo, string $table): bool
{
    $statement = $pdo->prepare(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = :table LIMIT 1"
    );
    $statement->execute([':table' => $table]);

    return $statement->fetchColumn() !== false;
}

function ideTokenColumnExists(PDO $pdo, string $table, string $column): bool
{
    $statement = $pdo->query('PRAGMA table_info(' . $table . ')');

    foreach ($statement->fetchAll() as $row) {
        if (isset($row['name']) && strcasecmp((string) $row['name'], $column) === 0) {
            return true;
        }
    }

    return false;
}

function ideTokensEnsureSchema(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS user_entitlements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id INTEGER NOT NULL,
            user_id INTEGER NULL,
            email TEXT,
            product_type TEXT NOT NULL,
            product_id INTEGER NULL,
            product_title TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT "active",
            granted_at TEXT NOT NULL,
            deleted_at TEXT,
            version INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );

    $columns = [
        'disabled_reason' => 'TEXT',
        'disabled_at' => 'TEXT',
        'disabled_by' => 'TEXT',
        'version' => 'INTEGER NOT NULL DEFAULT 1',
        'deleted_at' => 'TEXT',
    ];

    foreach ($columns as $column => $definition) {
        if (!ideTokenColumnExists($pdo, 'user_entitlements', $column)) {
            $pdo->exec('ALTER TABLE user_entitlements ADD COLUMN ' . $column . ' ' . $definition);
        }
    }

    $pdo->exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_user_entitlements_transaction ON user_entitlements(transaction_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_id ON user_entitlements(user_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_user_entitlements_email ON user_entitlements(email)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_user_entitlements_product ON user_entitlements(product_type, product_id)');
}

function ideTokensSyncPaidTransactions(PDO $pdo): void
{
    if (!ideTokenTableExists($pdo, 'transactions')) {
        return;
    }

    $now = ideTokensNow();

    $statement = $pdo->prepare(
        'INSERT INTO user_entitlements (
            transaction_id,
            user_id,
            email,
            product_type,
            product_id,
            product_title,
            status,
            granted_at,
            created_at,
            updated_at
        )
        SELECT
            t.id,
            t.user_id,
            t.email,
            "ide",
            t.item_id,
            t.item_title,
            "active",
            COALESCE(NULLIF(t.paid_at, ""), t.updated_at, :now),
            :now,
            :now
        FROM transactions t
        WHERE LOWER(t.item_type) = "ide"
        AND LOWER(t.status) = "paid"
        AND NOT EXISTS (
            SELECT 1
            FROM user_entitlements e
            WHERE e.transaction_id = t.id
            LIMIT 1
        )'
    );

    $statement->execute([
        ':now' => $now,
    ]);
}

function makeIdeAccessToken(array $row): string
{
    $source = (string) (
        $row['invoice_number']
        ?? $row['transaction_id']
        ?? $row['id']
        ?? $row['email']
        ?? 'USER'
    );

    return 'ARDUFLOW-IDE-' . strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', $source));
}

function ideTokenFromRow(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'transactionId' => (int) ($row['transaction_id'] ?? 0),
        'token' => makeIdeAccessToken($row),
        'userId' => isset($row['user_id']) ? (int) $row['user_id'] : null,
        'userName' => (string) ($row['user_name'] ?? $row['transaction_user_name'] ?? ''),
        'email' => (string) ($row['email'] ?? ''),
        'productTitle' => (string) ($row['product_title'] ?? 'Akses ArduFlow IDE'),
        'status' => (string) ($row['status'] ?? 'active'),
        'isActive' => strtolower((string) ($row['status'] ?? 'active')) === 'active',
        'grantedAt' => (string) ($row['granted_at'] ?? ''),
        'disabledReason' => (string) ($row['disabled_reason'] ?? ''),
        'disabledAt' => (string) ($row['disabled_at'] ?? ''),
        'disabledBy' => (string) ($row['disabled_by'] ?? ''),
        'createdAt' => (string) ($row['created_at'] ?? ''),
        'updatedAt' => (string) ($row['updated_at'] ?? ''),
    ];
}

function ideTokenSelectSql(): string
{
    return 'SELECT
        e.id,
        e.transaction_id,
        e.user_id,
        e.email,
        e.product_title,
        e.status,
        e.granted_at,
        e.disabled_reason,
        e.disabled_at,
        e.disabled_by,
        e.created_at,
        e.updated_at,
        t.invoice_number,
        t.user_name AS transaction_user_name,
        u.name AS user_name
     FROM user_entitlements e
     LEFT JOIN transactions t ON t.id = e.transaction_id
     LEFT JOIN users u ON u.id = e.user_id
     WHERE e.deleted_at IS NULL
     AND LOWER(e.product_type) = "ide"';
}

function listIdeTokens(PDO $pdo, array $filters = []): array
{
    $where = [];
    $params = [];

    $userId = trim((string) ($filters['userId'] ?? $filters['user_id'] ?? ''));
    $id = trim((string) ($filters['id'] ?? ''));
    $email = trim((string) ($filters['email'] ?? ''));
    $status = trim((string) ($filters['status'] ?? ''));
    $search = trim((string) ($filters['search'] ?? ''));

    if ($id !== '') {
        $where[] = 'e.id = :id';
        $params[':id'] = (int) $id;
    }

    if ($userId !== '') {
        $where[] = 'e.user_id = :user_id';
        $params[':user_id'] = (int) $userId;
    }

    if ($email !== '') {
        $where[] = 'LOWER(e.email) = LOWER(:email)';
        $params[':email'] = $email;
    }

    if ($status !== '') {
        $where[] = 'LOWER(e.status) = LOWER(:status)';
        $params[':status'] = $status;
    }

    if ($search !== '') {
        $where[] = '(e.email LIKE :search COLLATE NOCASE OR u.name LIKE :search COLLATE NOCASE OR t.user_name LIKE :search COLLATE NOCASE OR t.invoice_number LIKE :search COLLATE NOCASE)';
        $params[':search'] = '%' . $search . '%';
    }

    $sql = ideTokenSelectSql();

    if ($where !== []) {
        $sql .= ' AND ' . implode(' AND ', $where);
    }

    $sql .= ' ORDER BY e.updated_at DESC, e.id DESC';

    $statement = $pdo->prepare($sql);
    $statement->execute($params);

    return array_map('ideTokenFromRow', $statement->fetchAll());
}

try {
    $pdo = afwPdo();
    ideTokensEnsureSchema($pdo);
    ideTokensSyncPaidTransactions($pdo);

    if ($method === 'GET') {
        $tokens = listIdeTokens($pdo, $_GET);
        $active = array_values(array_filter($tokens, static fn ($token) => $token['isActive']));
        $disabled = array_values(array_filter($tokens, static fn ($token) => !$token['isActive']));

        afwSendJson(200, true, 'Token IDE berhasil diambil.', [
            'tokens' => $tokens,
            'activeToken' => $active[0] ?? null,
            'disabledToken' => $disabled[0] ?? null,
            'summary' => [
                'total' => count($tokens),
                'active' => count($active),
                'disabled' => count($disabled),
            ],
        ]);
    }

    if ($action === 'deactivate' && in_array($method, ['POST', 'PATCH'], true)) {
        $id = (int) ($_GET['id'] ?? 0);
        $payload = afwReadJsonBody('Alasan nonaktif wajib diisi.');
        $reason = trim((string) ($payload['reason'] ?? $payload['disabledReason'] ?? ''));

        if ($id <= 0) {
            afwSendJson(400, false, 'ID token wajib diisi.');
        }

        if ($reason === '') {
            afwSendJson(422, false, 'Alasan nonaktif wajib diisi.', [], [
                'reason' => 'Alasan nonaktif wajib diisi.',
            ]);
        }

        $now = ideTokensNow();
        $statement = $pdo->prepare(
            'UPDATE user_entitlements
             SET status = "disabled",
                 disabled_reason = :reason,
                 disabled_at = :disabled_at,
                 disabled_by = :disabled_by,
                 updated_at = :updated_at,
                 version = version + 1
             WHERE id = :id
             AND LOWER(product_type) = "ide"
             AND deleted_at IS NULL'
        );
        $statement->execute([
            ':reason' => $reason,
            ':disabled_at' => $now,
            ':disabled_by' => 'admin',
            ':updated_at' => $now,
            ':id' => $id,
        ]);

        if ($statement->rowCount() < 1) {
            afwSendJson(404, false, 'Token IDE tidak ditemukan.');
        }

        $tokens = listIdeTokens($pdo, ['id' => $id]);
        $token = $tokens[0] ?? null;

        afwSendJson(200, true, 'Token IDE berhasil dinonaktifkan.', [
            'token' => $token,
        ]);
    }

    header('Allow: GET, POST, PATCH, OPTIONS');
    afwSendJson(405, false, 'Method atau action tidak diizinkan.');
} catch (Throwable $error) {
    afwSendJson(500, false, 'Gagal memproses token IDE.', [
        'detail' => $error->getMessage(),
    ]);
}
