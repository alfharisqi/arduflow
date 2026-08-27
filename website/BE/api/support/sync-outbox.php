<?php

declare(strict_types=1);

function afwSyncNow(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d\TH:i:s\Z');
}

function afwSyncUuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);

    return sprintf(
        '%s-%s-%s-%s-%s',
        substr($hex, 0, 8),
        substr($hex, 8, 4),
        substr($hex, 12, 4),
        substr($hex, 16, 4),
        substr($hex, 20),
    );
}

function afwSyncTableColumns(PDO $pdo, string $table): array
{
    $statement = $pdo->query('PRAGMA table_info(' . $table . ')');
    if ($statement === false) {
        return [];
    }

    return array_map(
        static fn (array $column): string => (string) $column['name'],
        $statement->fetchAll(PDO::FETCH_ASSOC),
    );
}

function afwSyncAddColumnIfMissing(PDO $pdo, string $table, string $column, string $definition): void
{
    if (!in_array($column, afwSyncTableColumns($pdo, $table), true)) {
        $pdo->exec(sprintf('ALTER TABLE %s ADD COLUMN %s %s', $table, $column, $definition));
    }
}

function afwSyncAllowedColumns(): array
{
    return [
        'leads' => [
            'id', 'name', 'email', 'whatsapp', 'topic', 'message', 'source', 'status',
            'deleted_at', 'version', 'created_at', 'updated_at',
        ],
        'workshops' => [
            'id', 'title', 'description', 'category', 'method', 'location', 'meeting_url',
            'start_at', 'end_at', 'capacity', 'status', 'certificate_enabled',
            'cover_image_name', 'cover_image_type', 'cover_image_size', 'cover_image_path',
            'cover_image_url', 'created_by_admin_id', 'deleted_at', 'version',
            'created_at', 'updated_at',
        ],
        'project_submissions' => [
            'id', 'title', 'category', 'description', 'status', 'visibility',
            'cover_image_name', 'cover_image_type', 'cover_image_size', 'cover_image_path',
            'cover_image_url', 'project_file_name', 'project_file_type', 'project_file_size',
            'project_file_path', 'project_file_url', 'circuit_image_name', 'circuit_image_type',
            'circuit_image_size', 'circuit_image_path', 'circuit_image_url',
            'component_images_json', 'payload_json', 'deleted_at', 'version',
            'created_at', 'updated_at',
        ],
        'transactions' => [
            'id', 'user_id', 'user_name', 'email', 'item_type', 'item_id', 'item_title',
            'amount', 'currency', 'payment_method', 'payment_channel', 'payment_code',
            'recipient_name', 'qris_file_name', 'qris_file_type', 'qris_file_size',
            'qris_file_path', 'qris_file_url', 'invoice_number', 'reference_number',
            'status', 'paid_at', 'due_at', 'notes', 'proof_file_name', 'proof_file_type',
            'proof_file_size', 'proof_file_path', 'proof_file_url', 'proof_uploaded_at',
            'reviewed_at', 'reviewed_by', 'rejection_reason', 'payload_json',
            'deleted_at', 'version', 'created_at', 'updated_at',
        ],
        'payment_methods' => [
            'id', 'name', 'method_type', 'channel', 'recipient_name', 'payment_code',
            'qris_file_name', 'qris_file_type', 'qris_file_size', 'qris_file_path',
            'qris_file_url', 'is_active', 'deleted_at', 'version', 'created_at', 'updated_at',
        ],
        'user_entitlements' => [
            'id', 'transaction_id', 'user_id', 'email', 'product_type', 'product_id',
            'product_title', 'status', 'granted_at', 'deleted_at', 'version',
            'created_at', 'updated_at',
        ],
        'workshop_registrations' => [
            'id', 'workshop_id', 'transaction_id', 'user_id', 'name', 'email', 'whatsapp',
            'institution', 'occupation', 'status', 'notes', 'payload_json', 'deleted_at',
            'version', 'created_at', 'updated_at',
        ],
    ];
}

function afwSyncEnsureInfrastructure(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS sync_outbox (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL UNIQUE,
            table_name TEXT NOT NULL,
            row_id TEXT NOT NULL,
            operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
            payload TEXT NOT NULL,
            version INTEGER NOT NULL DEFAULT 1,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'synced', 'failed')),
            retry_count INTEGER NOT NULL DEFAULT 0,
            next_retry_at TEXT,
            last_error TEXT,
            worker_id TEXT,
            locked_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            synced_at TEXT
        )"
    );
    $pdo->exec('CREATE INDEX IF NOT EXISTS sync_outbox_ready_idx ON sync_outbox(status, next_retry_at, created_at)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS sync_outbox_worker_idx ON sync_outbox(worker_id, status)');
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS sync_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id TEXT NOT NULL,
            total_events INTEGER NOT NULL,
            success_events INTEGER NOT NULL DEFAULT 0,
            failed_events INTEGER NOT NULL DEFAULT 0,
            started_at TEXT NOT NULL,
            finished_at TEXT,
            duration_ms INTEGER,
            mysql_status TEXT,
            error_message TEXT
        )'
    );
}

function afwSyncEnsureTable(PDO $pdo, string $table): void
{
    if (!isset(afwSyncAllowedColumns()[$table]) || afwSyncTableColumns($pdo, $table) === []) {
        return;
    }

    afwSyncAddColumnIfMissing($pdo, $table, 'version', 'INTEGER NOT NULL DEFAULT 1');
    afwSyncAddColumnIfMissing($pdo, $table, 'deleted_at', 'TEXT NULL');
}

function afwSyncTouch(PDO $pdo, string $table, int|string $rowId, string $operation): void
{
    afwSyncEnsureTable($pdo, $table);

    if ($operation === 'insert') {
        return;
    }

    $now = afwSyncNow();
    if ($operation === 'delete') {
        $statement = $pdo->prepare(
            "UPDATE {$table} SET deleted_at = COALESCE(deleted_at, :now), version = COALESCE(version, 1) + 1, updated_at = :updated_at WHERE id = :id"
        );
        $statement->execute([':now' => $now, ':updated_at' => $now, ':id' => $rowId]);
        return;
    } else {
        $statement = $pdo->prepare(
            "UPDATE {$table} SET version = COALESCE(version, 1) + 1, updated_at = COALESCE(updated_at, :updated_at) WHERE id = :id"
        );
    }
    $statement->execute([':updated_at' => $now, ':id' => $rowId]);
}

function afwSyncEnqueue(PDO $pdo, string $table, int|string $rowId, string $operation, bool $touch = true): ?string
{
    $allowed = afwSyncAllowedColumns();
    if (!isset($allowed[$table]) || !in_array($operation, ['insert', 'update', 'delete'], true)) {
        return null;
    }

    afwSyncEnsureInfrastructure($pdo);
    afwSyncEnsureTable($pdo, $table);
    if ($touch) {
        afwSyncTouch($pdo, $table, $rowId, $operation);
    }

    $availableColumns = array_values(array_intersect($allowed[$table], afwSyncTableColumns($pdo, $table)));
    if ($availableColumns === []) {
        return null;
    }

    $quotedColumns = implode(', ', $availableColumns);
    $statement = $pdo->prepare("SELECT {$quotedColumns} FROM {$table} WHERE id = :id LIMIT 1");
    $statement->execute([':id' => $rowId]);
    $row = $statement->fetch(PDO::FETCH_ASSOC);
    if (!is_array($row)) {
        return null;
    }

    $now = afwSyncNow();
    $eventId = afwSyncUuid();
    $insert = $pdo->prepare(
        'INSERT INTO sync_outbox (
            id, event_id, table_name, row_id, operation, payload, version,
            status, retry_count, created_at, updated_at
        ) VALUES (
            :id, :event_id, :table_name, :row_id, :operation, :payload, :version,
            "pending", 0, :created_at, :updated_at
        )'
    );
    $insert->execute([
        ':id' => afwSyncUuid(),
        ':event_id' => $eventId,
        ':table_name' => $table,
        ':row_id' => (string) $rowId,
        ':operation' => $operation,
        ':payload' => json_encode($row, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ':version' => (int) ($row['version'] ?? 1),
        ':created_at' => $now,
        ':updated_at' => $now,
    ]);

    return $eventId;
}
