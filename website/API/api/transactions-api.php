<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
];

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin');
}

header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$syncOutboxPath = __DIR__ . '/support/sync-outbox.php';
$mqttEventsPath = __DIR__ . '/support/mqtt-events.php';

if (is_file($syncOutboxPath)) {
    require_once $syncOutboxPath;
}
if (is_file($mqttEventsPath)) {
    require_once $mqttEventsPath;
}

if ($method === 'POST' && (isset($_POST['_method']) || isset($_GET['_method']))) {
    $methodOverride = strtoupper((string) ($_POST['_method'] ?? $_GET['_method']));
    if (in_array($methodOverride, ['PUT', 'PATCH', 'DELETE'], true)) {
        $method = $methodOverride;
    }
}

if (!in_array($method, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    header('Allow: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    respond(405, [
        'success' => false,
        'message' => 'Method tidak diizinkan.',
    ]);
}

function respond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function readJsonBody(): array
{
    $rawJson = file_get_contents('php://input');
    if ($rawJson === false || trim($rawJson) === '') {
        throw new InvalidArgumentException('Body JSON tidak boleh kosong.');
    }

    $data = json_decode($rawJson, true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($data)) {
        throw new InvalidArgumentException('Struktur JSON harus berupa object.');
    }

    return isset($data['data']) && is_array($data['data']) ? $data['data'] : $data;
}

function resolveDatabasePath(string $projectRoot, array $databaseConfig): array
{
    $sqliteConfig = $databaseConfig['sqlite'] ?? null;
    if (!is_array($sqliteConfig)) {
        throw new RuntimeException('Konfigurasi SQLite tidak ditemukan.');
    }

    $databasePath = trim((string) ($sqliteConfig['path'] ?? ''));
    $busyTimeout = (int) ($sqliteConfig['busy_timeout_ms'] ?? 15000);
    if ($databasePath === '') {
        throw new RuntimeException('Path database SQLite belum dikonfigurasi.');
    }

    $isWindowsAbsolutePath = preg_match('/^[A-Za-z]:[\\\\\/]/', $databasePath) === 1;
    $isUnixAbsolutePath = str_starts_with($databasePath, '/');
    if (!$isWindowsAbsolutePath && !$isUnixAbsolutePath) {
        $databasePath = $projectRoot . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $databasePath);
    }

    return [$databasePath, $busyTimeout];
}

function jakartaNow(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))->format(DateTimeInterface::ATOM);
}

function ensureTransactionTables(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NULL,
            user_name TEXT,
            email TEXT,
            item_type TEXT NOT NULL DEFAULT "workshop",
            item_id INTEGER NULL,
            item_title TEXT NOT NULL,
            amount REAL NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT "IDR",
            payment_method TEXT,
            payment_channel TEXT,
            payment_code TEXT,
            recipient_name TEXT,
            qris_file_name TEXT,
            qris_file_type TEXT,
            qris_file_size INTEGER,
            qris_file_path TEXT,
            qris_file_url TEXT,
            invoice_number TEXT NOT NULL UNIQUE,
            reference_number TEXT,
            status TEXT NOT NULL DEFAULT "pending",
            paid_at TEXT,
            due_at TEXT,
            notes TEXT,
            proof_file_name TEXT,
            proof_file_type TEXT,
            proof_file_size INTEGER,
            proof_file_path TEXT,
            proof_file_url TEXT,
            proof_uploaded_at TEXT,
            reviewed_at TEXT,
            reviewed_by TEXT,
            rejection_reason TEXT,
            payload_json TEXT NOT NULL DEFAULT "{}",
            deleted_at TEXT,
            version INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );
    addColumnIfMissing($pdo, 'transactions', 'proof_file_name', 'TEXT');
    addColumnIfMissing($pdo, 'transactions', 'payment_code', 'TEXT');
    addColumnIfMissing($pdo, 'transactions', 'recipient_name', 'TEXT');
    addColumnIfMissing($pdo, 'transactions', 'qris_file_name', 'TEXT');
    addColumnIfMissing($pdo, 'transactions', 'qris_file_type', 'TEXT');
    addColumnIfMissing($pdo, 'transactions', 'qris_file_size', 'INTEGER');
    addColumnIfMissing($pdo, 'transactions', 'qris_file_path', 'TEXT');
    addColumnIfMissing($pdo, 'transactions', 'qris_file_url', 'TEXT');
    addColumnIfMissing($pdo, 'transactions', 'proof_file_type', 'TEXT');
    addColumnIfMissing($pdo, 'transactions', 'proof_file_size', 'INTEGER');
    addColumnIfMissing($pdo, 'transactions', 'proof_file_path', 'TEXT');
    addColumnIfMissing($pdo, 'transactions', 'proof_file_url', 'TEXT');
    addColumnIfMissing($pdo, 'transactions', 'proof_uploaded_at', 'TEXT');
    addColumnIfMissing($pdo, 'transactions', 'reviewed_at', 'TEXT');
    addColumnIfMissing($pdo, 'transactions', 'reviewed_by', 'TEXT');
    addColumnIfMissing($pdo, 'transactions', 'rejection_reason', 'TEXT');
    addColumnIfMissing($pdo, 'transactions', 'deleted_at', 'TEXT');
    addColumnIfMissing($pdo, 'transactions', 'version', 'INTEGER NOT NULL DEFAULT 1');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_transactions_email ON transactions(email)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at)');

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
    $pdo->exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_user_entitlements_transaction ON user_entitlements(transaction_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_id ON user_entitlements(user_id)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_user_entitlements_email ON user_entitlements(email)');
    addColumnIfMissing($pdo, 'user_entitlements', 'deleted_at', 'TEXT');
    addColumnIfMissing($pdo, 'user_entitlements', 'version', 'INTEGER NOT NULL DEFAULT 1');

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS payment_methods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            method_type TEXT NOT NULL DEFAULT "Transfer Bank",
            channel TEXT,
            recipient_name TEXT,
            payment_code TEXT,
            qris_file_name TEXT,
            qris_file_type TEXT,
            qris_file_size INTEGER,
            qris_file_path TEXT,
            qris_file_url TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            deleted_at TEXT,
            version INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );
    addColumnIfMissing($pdo, 'payment_methods', 'method_type', 'TEXT NOT NULL DEFAULT "Transfer Bank"');
    addColumnIfMissing($pdo, 'payment_methods', 'channel', 'TEXT');
    addColumnIfMissing($pdo, 'payment_methods', 'recipient_name', 'TEXT');
    addColumnIfMissing($pdo, 'payment_methods', 'payment_code', 'TEXT');
    addColumnIfMissing($pdo, 'payment_methods', 'qris_file_name', 'TEXT');
    addColumnIfMissing($pdo, 'payment_methods', 'qris_file_type', 'TEXT');
    addColumnIfMissing($pdo, 'payment_methods', 'qris_file_size', 'INTEGER');
    addColumnIfMissing($pdo, 'payment_methods', 'qris_file_path', 'TEXT');
    addColumnIfMissing($pdo, 'payment_methods', 'qris_file_url', 'TEXT');
    addColumnIfMissing($pdo, 'payment_methods', 'is_active', 'INTEGER NOT NULL DEFAULT 1');
    addColumnIfMissing($pdo, 'payment_methods', 'deleted_at', 'TEXT');
    addColumnIfMissing($pdo, 'payment_methods', 'version', 'INTEGER NOT NULL DEFAULT 1');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active)');

    $workshopRegistrationTable = $pdo->query(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'workshop_registrations' LIMIT 1"
    )->fetchColumn();
    if ($workshopRegistrationTable !== false) {
        addColumnIfMissing($pdo, 'workshop_registrations', 'transaction_id', 'INTEGER NULL');
    }
}

function addColumnIfMissing(PDO $pdo, string $table, string $column, string $definition): void
{
    $columns = $pdo->query('PRAGMA table_info(' . $table . ')')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $existingColumn) {
        if (($existingColumn['name'] ?? '') === $column) {
            return;
        }
    }
    $pdo->exec('ALTER TABLE ' . $table . ' ADD COLUMN ' . $column . ' ' . $definition);
}

function getTransactionId(): ?int
{
    if (!isset($_GET['id']) || $_GET['id'] === '') {
        return null;
    }

    $id = filter_var($_GET['id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if ($id === false) {
        throw new InvalidArgumentException('ID transaksi tidak valid.');
    }

    return (int) $id;
}

function generateInvoiceNumber(): string
{
    try {
        $suffix = strtoupper(bin2hex(random_bytes(3)));
    } catch (Throwable $exception) {
        $suffix = strtoupper(substr(str_replace('.', '', uniqid('', true)), -6));
    }

    return 'AFW-INV-' . date('Ymd') . '-' . $suffix;
}

function normalizeStatus(string $status): string
{
    $value = strtolower(trim($status));
    $allowed = ['pending', 'proof_uploaded', 'paid', 'rejected', 'failed', 'cancelled', 'refunded', 'expired'];
    return in_array($value, $allowed, true) ? $value : 'pending';
}

function rowToTransaction(array $row): array
{
    $payload = json_decode((string) ($row['payload_json'] ?? '{}'), true);
    if (!is_array($payload)) {
        $payload = [];
    }

    return [
        'id' => (int) $row['id'],
        'userId' => isset($row['user_id']) && $row['user_id'] !== null ? (int) $row['user_id'] : null,
        'userName' => $row['user_name'] ?? '',
        'email' => $row['email'] ?? '',
        'itemType' => $row['item_type'] ?? 'workshop',
        'itemId' => isset($row['item_id']) && $row['item_id'] !== null ? (int) $row['item_id'] : null,
        'itemTitle' => $row['item_title'] ?? '',
        'amount' => (float) ($row['amount'] ?? 0),
        'currency' => $row['currency'] ?? 'IDR',
        'paymentMethod' => $row['payment_method'] ?? '',
        'paymentChannel' => $row['payment_channel'] ?? '',
        'paymentCode' => $row['payment_code'] ?? '',
        'recipientName' => $row['recipient_name'] ?? '',
        'qrisFile' => [
            'name' => $row['qris_file_name'] ?? null,
            'type' => $row['qris_file_type'] ?? null,
            'size' => isset($row['qris_file_size']) ? (int) $row['qris_file_size'] : null,
            'path' => $row['qris_file_path'] ?? null,
            'url' => $row['qris_file_url'] ?? null,
        ],
        'invoiceNumber' => $row['invoice_number'] ?? '',
        'referenceNumber' => $row['reference_number'] ?? '',
        'status' => $row['status'] ?? 'pending',
        'paidAt' => $row['paid_at'] ?? null,
        'dueAt' => $row['due_at'] ?? null,
        'notes' => $row['notes'] ?? '',
        'proofFile' => [
            'name' => $row['proof_file_name'] ?? null,
            'type' => $row['proof_file_type'] ?? null,
            'size' => isset($row['proof_file_size']) ? (int) $row['proof_file_size'] : null,
            'path' => $row['proof_file_path'] ?? null,
            'url' => $row['proof_file_url'] ?? null,
        ],
        'proofUploadedAt' => $row['proof_uploaded_at'] ?? null,
        'reviewedAt' => $row['reviewed_at'] ?? null,
        'reviewedBy' => $row['reviewed_by'] ?? '',
        'rejectionReason' => $row['rejection_reason'] ?? '',
        'payload' => $payload,
        'createdAt' => $row['created_at'] ?? '',
        'updatedAt' => $row['updated_at'] ?? '',
    ];
}

function publishTransactionEvent(string $projectRoot, string $action, array $transaction): void
{
    if (!function_exists('afwPublishAdminEvent')) {
        return;
    }

    afwPublishAdminEvent($projectRoot, 'admin/transactions', [
        'type' => 'transaction.' . $action,
        'action' => $action,
        'id' => (int) ($transaction['id'] ?? 0),
        'invoiceNumber' => (string) ($transaction['invoice_number'] ?? ''),
        'status' => (string) ($transaction['status'] ?? ''),
        'amount' => (float) ($transaction['amount'] ?? 0),
        'itemType' => (string) ($transaction['item_type'] ?? ''),
        'itemId' => (string) ($transaction['item_id'] ?? ''),
    ]);
}

function publishPaymentMethodEvent(string $projectRoot, string $action, array $paymentMethod): void
{
    if (!function_exists('afwPublishAdminEvent')) {
        return;
    }

    afwPublishAdminEvent($projectRoot, 'admin/transactions', [
        'type' => 'payment_method.' . $action,
        'action' => $action,
        'id' => (int) ($paymentMethod['id'] ?? 0),
        'name' => (string) ($paymentMethod['name'] ?? ''),
        'isActive' => (bool) ($paymentMethod['is_active'] ?? false),
    ]);
}

function readTransactionBody(): array
{
    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
    if (str_contains($contentType, 'multipart/form-data')) {
        $payload = trim((string) ($_POST['payload'] ?? $_POST['data'] ?? ''));
        if ($payload === '') {
            return $_POST;
        }
        $data = json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($data)) {
            throw new InvalidArgumentException('Struktur payload transaksi harus berupa object.');
        }
        return isset($data['data']) && is_array($data['data']) ? $data['data'] : $data;
    }

    return readJsonBody();
}

function storeQrisFile(int $transactionId, string $projectRoot): ?array
{
    $file = $_FILES['qris'] ?? $_FILES['qrisFile'] ?? null;
    if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new InvalidArgumentException('Upload foto QRIS gagal.');
    }

    $size = (int) ($file['size'] ?? 0);
    if ($size <= 0 || $size > 5 * 1024 * 1024) {
        throw new InvalidArgumentException('Ukuran foto QRIS maksimal 5 MB.');
    }

    $tmpName = (string) ($file['tmp_name'] ?? '');
    $mimeType = function_exists('mime_content_type') ? (string) mime_content_type($tmpName) : (string) ($file['type'] ?? '');
    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];
    if (!isset($extensions[$mimeType])) {
        throw new InvalidArgumentException('Foto QRIS harus berupa JPG, PNG, atau WEBP.');
    }

    $storedName = 'qris-' . $transactionId . '-' . bin2hex(random_bytes(6)) . '.' . $extensions[$mimeType];
    $uploadDirectory = $projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'payment-methods';
    if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0775, true) && !is_dir($uploadDirectory)) {
        throw new RuntimeException('Folder upload QRIS gagal dibuat.');
    }

    $destination = $uploadDirectory . DIRECTORY_SEPARATOR . $storedName;
    if (!move_uploaded_file($tmpName, $destination)) {
        throw new RuntimeException('Foto QRIS gagal disimpan.');
    }

    return [
        'name' => basename((string) ($file['name'] ?? $storedName)),
        'type' => $mimeType,
        'size' => $size,
        'path' => 'uploads/payment-methods/' . $storedName,
        'url' => '/uploads/payment-methods/' . rawurlencode($storedName),
    ];
}

function storePaymentMethodFile(int $paymentMethodId, string $projectRoot): ?array
{
    $file = $_FILES['image'] ?? $_FILES['qris'] ?? $_FILES['qrisFile'] ?? null;
    if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new InvalidArgumentException('Upload gambar metode pembayaran gagal.');
    }

    $size = (int) ($file['size'] ?? 0);
    if ($size <= 0 || $size > 5 * 1024 * 1024) {
        throw new InvalidArgumentException('Ukuran gambar metode pembayaran maksimal 5 MB.');
    }

    $tmpName = (string) ($file['tmp_name'] ?? '');
    $mimeType = function_exists('mime_content_type') ? (string) mime_content_type($tmpName) : (string) ($file['type'] ?? '');
    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];
    if (!isset($extensions[$mimeType])) {
        throw new InvalidArgumentException('Gambar metode pembayaran harus berupa JPG, PNG, atau WEBP.');
    }

    $storedName = 'method-' . $paymentMethodId . '-' . bin2hex(random_bytes(6)) . '.' . $extensions[$mimeType];
    $uploadDirectory = $projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'payment-methods';
    if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0775, true) && !is_dir($uploadDirectory)) {
        throw new RuntimeException('Folder upload metode pembayaran gagal dibuat.');
    }

    $destination = $uploadDirectory . DIRECTORY_SEPARATOR . $storedName;
    if (!move_uploaded_file($tmpName, $destination)) {
        throw new RuntimeException('Gambar metode pembayaran gagal disimpan.');
    }

    return [
        'name' => basename((string) ($file['name'] ?? $storedName)),
        'type' => $mimeType,
        'size' => $size,
        'path' => 'uploads/payment-methods/' . $storedName,
        'url' => '/uploads/payment-methods/' . rawurlencode($storedName),
    ];
}

function storePaymentProof(int $transactionId, string $projectRoot): array
{
    $file = $_FILES['proof'] ?? $_FILES['paymentProof'] ?? null;
    if (!is_array($file)) {
        throw new InvalidArgumentException('File bukti pembayaran wajib diupload.');
    }
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        throw new InvalidArgumentException('Upload bukti pembayaran gagal.');
    }

    $size = (int) ($file['size'] ?? 0);
    if ($size <= 0 || $size > 5 * 1024 * 1024) {
        throw new InvalidArgumentException('Ukuran bukti pembayaran maksimal 5 MB.');
    }

    $tmpName = (string) ($file['tmp_name'] ?? '');
    $mimeType = function_exists('mime_content_type') ? (string) mime_content_type($tmpName) : (string) ($file['type'] ?? '');
    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!in_array($mimeType, $allowedTypes, true)) {
        throw new InvalidArgumentException('Bukti pembayaran harus berupa JPG, PNG, WEBP, atau PDF.');
    }

    $extension = match ($mimeType) {
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'application/pdf' => 'pdf',
        default => 'bin',
    };
    $storedName = 'trx-' . $transactionId . '-' . bin2hex(random_bytes(6)) . '.' . $extension;
    $uploadDirectory = $projectRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'payment-proofs';
    if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0775, true) && !is_dir($uploadDirectory)) {
        throw new RuntimeException('Folder upload bukti pembayaran gagal dibuat.');
    }

    $destination = $uploadDirectory . DIRECTORY_SEPARATOR . $storedName;
    if (!move_uploaded_file($tmpName, $destination)) {
        throw new RuntimeException('Bukti pembayaran gagal disimpan.');
    }

    $relativeUrl = '/uploads/payment-proofs/' . rawurlencode($storedName);
    return [
        'name' => basename((string) ($file['name'] ?? $storedName)),
        'type' => $mimeType,
        'size' => $size,
        'path' => 'uploads/payment-proofs/' . $storedName,
        'url' => $relativeUrl,
    ];
}

function grantProductAccess(PDO $pdo, array $transaction, string $now): void
{
    $statement = $pdo->prepare(
        'INSERT INTO user_entitlements (
            transaction_id, user_id, email, product_type, product_id, product_title,
            status, granted_at, created_at, updated_at
        ) VALUES (
            :transaction_id, :user_id, :email, :product_type, :product_id, :product_title,
            "active", :granted_at, :created_at, :updated_at
        )
        ON CONFLICT(transaction_id) DO UPDATE SET
            status = "active",
            granted_at = excluded.granted_at,
            updated_at = excluded.updated_at'
    );
    $statement->execute([
        ':transaction_id' => (int) $transaction['id'],
        ':user_id' => $transaction['user_id'] ?? null,
        ':email' => $transaction['email'] ?? '',
        ':product_type' => $transaction['item_type'] ?? 'workshop',
        ':product_id' => $transaction['item_id'] ?? null,
        ':product_title' => $transaction['item_title'] ?? '',
        ':granted_at' => $now,
        ':created_at' => $now,
        ':updated_at' => $now,
    ]);
    $lookup = $pdo->prepare('SELECT id FROM user_entitlements WHERE transaction_id = :transaction_id LIMIT 1');
    $lookup->execute([':transaction_id' => (int) $transaction['id']]);
    $entitlementId = (int) ($lookup->fetchColumn() ?: 0);
    if ($entitlementId > 0 && function_exists('afwSyncEnqueue')) {
        afwSyncEnqueue($pdo, 'user_entitlements', $entitlementId, 'update');
    }

    if (($transaction['item_type'] ?? '') !== 'workshop') {
        return;
    }

    $workshopRegistrationTable = $pdo->query(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'workshop_registrations' LIMIT 1"
    )->fetchColumn();
    if ($workshopRegistrationTable === false) {
        return;
    }

    $payload = json_decode((string) ($transaction['payload_json'] ?? '{}'), true);
    $registrationId = null;
    if (is_array($payload)) {
        $registrationId = $payload['workshopRegistration']['id']
            ?? $payload['workshop_registration']['id']
            ?? $payload['registrationId']
            ?? $payload['registration_id']
            ?? null;
    }

    if ($registrationId !== null && (int) $registrationId > 0) {
        $statement = $pdo->prepare(
            'UPDATE workshop_registrations
             SET status = "registered",
                 updated_at = :updated_at
             WHERE id = :id'
        );
        $statement->execute([
            ':updated_at' => $now,
            ':id' => (int) $registrationId,
        ]);

        return;
    }

    $statement = $pdo->prepare(
        'UPDATE workshop_registrations
         SET status = "registered",
             updated_at = :updated_at
         WHERE transaction_id = :transaction_id'
    );
    $statement->execute([
        ':updated_at' => $now,
        ':transaction_id' => (int) $transaction['id'],
    ]);
}

function findTransaction(PDO $pdo, int $id): ?array
{
    $statement = $pdo->prepare('SELECT * FROM transactions WHERE id = :id AND deleted_at IS NULL LIMIT 1');
    $statement->execute([':id' => $id]);
    $row = $statement->fetch(PDO::FETCH_ASSOC);
    return is_array($row) ? $row : null;
}

function findPaymentMethod(PDO $pdo, int $id): ?array
{
    $statement = $pdo->prepare('SELECT * FROM payment_methods WHERE id = :id AND deleted_at IS NULL LIMIT 1');
    $statement->execute([':id' => $id]);
    $row = $statement->fetch(PDO::FETCH_ASSOC);
    return is_array($row) ? $row : null;
}

function rowToPaymentMethod(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'name' => $row['name'] ?? '',
        'methodType' => $row['method_type'] ?? 'Transfer Bank',
        'channel' => $row['channel'] ?? '',
        'recipientName' => $row['recipient_name'] ?? '',
        'paymentCode' => $row['payment_code'] ?? '',
        'image' => [
            'name' => $row['qris_file_name'] ?? null,
            'type' => $row['qris_file_type'] ?? null,
            'size' => isset($row['qris_file_size']) ? (int) $row['qris_file_size'] : null,
            'path' => $row['qris_file_path'] ?? null,
            'url' => $row['qris_file_url'] ?? null,
        ],
        'isActive' => (int) ($row['is_active'] ?? 1) === 1,
        'createdAt' => $row['created_at'] ?? '',
        'updatedAt' => $row['updated_at'] ?? '',
    ];
}

function readPaymentMethodBody(): array
{
    $contentType = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? ''));
    if (str_contains($contentType, 'multipart/form-data')) {
        $payload = trim((string) ($_POST['payload'] ?? $_POST['data'] ?? ''));
        if ($payload === '') {
            return $_POST;
        }

        $data = json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($data)) {
            throw new InvalidArgumentException('Struktur payload metode pembayaran harus berupa object.');
        }

        return isset($data['data']) && is_array($data['data']) ? $data['data'] : $data;
    }

    return readJsonBody();
}

function paymentMethodFromBody(array $data, ?array $existing = null): array
{
    $activeValue = $data['isActive'] ?? $data['is_active'] ?? $existing['is_active'] ?? 1;

    return [
        'name' => trim((string) ($data['name'] ?? $existing['name'] ?? '')),
        'method_type' => trim((string) ($data['methodType'] ?? $data['method_type'] ?? $existing['method_type'] ?? 'Transfer Bank')) ?: 'Transfer Bank',
        'channel' => trim((string) ($data['channel'] ?? $existing['channel'] ?? '')),
        'recipient_name' => trim((string) ($data['recipientName'] ?? $data['recipient_name'] ?? $existing['recipient_name'] ?? '')),
        'payment_code' => trim((string) ($data['paymentCode'] ?? $data['payment_code'] ?? $existing['payment_code'] ?? '')),
        'is_active' => filter_var($activeValue, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) === false ? 0 : 1,
    ];
}

function validatePaymentMethod(array $paymentMethod): array
{
    $errors = [];
    if ($paymentMethod['name'] === '') {
        $errors['name'] = 'Nama metode pembayaran wajib diisi.';
    }
    if ($paymentMethod['payment_code'] === '') {
        $errors['paymentCode'] = 'Nomor pembayaran / detail wajib diisi.';
    }
    return $errors;
}

function transactionFromBody(array $data, ?array $existing = null): array
{
    $userId = $data['userId'] ?? $data['user_id'] ?? $existing['user_id'] ?? null;
    $itemId = $data['itemId'] ?? $data['item_id'] ?? $existing['item_id'] ?? null;
    $amount = $data['amount'] ?? $existing['amount'] ?? 0;
    $payload = $data['payload'] ?? [];

    if (!is_array($payload)) {
        $payload = [];
    }

    return [
        'user_id' => $userId === null || $userId === '' ? null : (int) $userId,
        'user_name' => trim((string) ($data['userName'] ?? $data['user_name'] ?? $existing['user_name'] ?? '')),
        'email' => trim((string) ($data['email'] ?? $existing['email'] ?? '')),
        'item_type' => trim((string) ($data['itemType'] ?? $data['item_type'] ?? $existing['item_type'] ?? 'workshop')) ?: 'workshop',
        'item_id' => $itemId === null || $itemId === '' ? null : (int) $itemId,
        'item_title' => trim((string) ($data['itemTitle'] ?? $data['item_title'] ?? $existing['item_title'] ?? '')),
        'amount' => is_numeric($amount) ? (float) $amount : 0.0,
        'currency' => strtoupper(trim((string) ($data['currency'] ?? $existing['currency'] ?? 'IDR'))) ?: 'IDR',
        'payment_method' => trim((string) ($data['paymentMethod'] ?? $data['payment_method'] ?? $existing['payment_method'] ?? '')),
        'payment_channel' => trim((string) ($data['paymentChannel'] ?? $data['payment_channel'] ?? $existing['payment_channel'] ?? '')),
        'payment_code' => trim((string) ($data['paymentCode'] ?? $data['payment_code'] ?? $existing['payment_code'] ?? '')),
        'recipient_name' => trim((string) ($data['recipientName'] ?? $data['recipient_name'] ?? $existing['recipient_name'] ?? '')),
        'invoice_number' => trim((string) ($data['invoiceNumber'] ?? $data['invoice_number'] ?? $existing['invoice_number'] ?? generateInvoiceNumber())),
        'reference_number' => trim((string) ($data['referenceNumber'] ?? $data['reference_number'] ?? $existing['reference_number'] ?? '')),
        'status' => normalizeStatus((string) ($data['status'] ?? $existing['status'] ?? 'pending')),
        'paid_at' => trim((string) ($data['paidAt'] ?? $data['paid_at'] ?? $existing['paid_at'] ?? '')) ?: null,
        'due_at' => trim((string) ($data['dueAt'] ?? $data['due_at'] ?? $existing['due_at'] ?? '')) ?: null,
        'notes' => trim((string) ($data['notes'] ?? $existing['notes'] ?? '')),
        'payload' => $payload,
    ];
}

function validateTransaction(array $transaction): array
{
    $errors = [];
    if ($transaction['item_title'] === '') {
        $errors['itemTitle'] = 'Nama item transaksi wajib diisi.';
    }
    if ($transaction['amount'] < 0) {
        $errors['amount'] = 'Nominal transaksi tidak boleh negatif.';
    }
    if ($transaction['invoice_number'] === '') {
        $errors['invoiceNumber'] = 'Nomor invoice wajib diisi.';
    }
    return $errors;
}

try {
    $projectRoot = dirname(__DIR__);
    $autoloadPath = $projectRoot . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
    $configPath = $projectRoot . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'database.php';

    if (is_file($autoloadPath)) {
        require_once $autoloadPath;
    }

    if (class_exists(\Arduflow\Api\Support\Env::class)) {
        \Arduflow\Api\Support\Env::load($projectRoot . DIRECTORY_SEPARATOR . '.env');
    }

    if (!is_file($configPath)) {
        throw new RuntimeException('File konfigurasi database tidak ditemukan.');
    }

    $databaseConfig = require $configPath;
    [$databasePath, $busyTimeout] = resolveDatabasePath($projectRoot, $databaseConfig);
    $databaseDirectory = dirname($databasePath);
    if (!is_dir($databaseDirectory) && !mkdir($databaseDirectory, 0775, true) && !is_dir($databaseDirectory)) {
        throw new RuntimeException('Folder database gagal dibuat.');
    }

    $pdo = new PDO('sqlite:' . $databasePath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA busy_timeout = ' . max(1000, $busyTimeout));
    $pdo->exec('PRAGMA foreign_keys = ON');
    ensureTransactionTables($pdo);
    if (function_exists('afwSyncEnsureInfrastructure')) {
        afwSyncEnsureInfrastructure($pdo);
        foreach (['transactions', 'payment_methods', 'user_entitlements'] as $syncTable) {
            afwSyncEnsureTable($pdo, $syncTable);
        }
    }

    $transactionId = getTransactionId();
    $action = strtolower(trim((string) ($_GET['action'] ?? '')));

    if ($action === 'payment-methods') {
        if ($method === 'GET') {
            if ($transactionId !== null) {
                $row = findPaymentMethod($pdo, $transactionId);
                if ($row === null) {
                    respond(404, [
                        'success' => false,
                        'message' => 'Metode pembayaran tidak ditemukan.',
                    ]);
                }

                respond(200, [
                    'success' => true,
                    'data' => [
                        'paymentMethod' => rowToPaymentMethod($row),
                    ],
                ]);
            }

            $onlyActive = isset($_GET['active']) && $_GET['active'] !== '';
            $sql = 'SELECT * FROM payment_methods WHERE deleted_at IS NULL';
            if ($onlyActive) {
                $sql .= ' AND is_active = :is_active';
            }
            $sql .= ' ORDER BY id DESC';

            $statement = $pdo->prepare($sql);
            if ($onlyActive) {
                $statement->bindValue(':is_active', filter_var($_GET['active'], FILTER_VALIDATE_BOOL) ? 1 : 0, PDO::PARAM_INT);
            }
            $statement->execute();

            respond(200, [
                'success' => true,
                'message' => 'Data metode pembayaran berhasil diambil.',
                'data' => [
                    'paymentMethods' => array_map('rowToPaymentMethod', $statement->fetchAll()),
                ],
            ]);
        }

        if ($method === 'POST') {
            $incoming = readPaymentMethodBody();
            $paymentMethod = paymentMethodFromBody($incoming);
            $errors = validatePaymentMethod($paymentMethod);
            if ($errors !== []) {
                respond(422, [
                    'success' => false,
                    'message' => 'Validasi metode pembayaran gagal.',
                    'errors' => $errors,
                ]);
            }

            $now = jakartaNow();
            $statement = $pdo->prepare(
                'INSERT INTO payment_methods (
                    name, method_type, channel, recipient_name, payment_code, is_active, created_at, updated_at
                ) VALUES (
                    :name, :method_type, :channel, :recipient_name, :payment_code, :is_active, :created_at, :updated_at
                )'
            );
            $statement->execute([
                ':name' => $paymentMethod['name'],
                ':method_type' => $paymentMethod['method_type'],
                ':channel' => $paymentMethod['channel'],
                ':recipient_name' => $paymentMethod['recipient_name'],
                ':payment_code' => $paymentMethod['payment_code'],
                ':is_active' => $paymentMethod['is_active'],
                ':created_at' => $now,
                ':updated_at' => $now,
            ]);

            $createdId = (int) $pdo->lastInsertId();
            $image = storePaymentMethodFile($createdId, $projectRoot);
            if ($image !== null) {
                $statement = $pdo->prepare(
                    'UPDATE payment_methods SET
                        qris_file_name = :qris_file_name,
                        qris_file_type = :qris_file_type,
                        qris_file_size = :qris_file_size,
                        qris_file_path = :qris_file_path,
                        qris_file_url = :qris_file_url,
                        updated_at = :updated_at
                     WHERE id = :id'
                );
                $statement->execute([
                    ':qris_file_name' => $image['name'],
                    ':qris_file_type' => $image['type'],
                    ':qris_file_size' => $image['size'],
                    ':qris_file_path' => $image['path'],
                    ':qris_file_url' => $image['url'],
                    ':updated_at' => jakartaNow(),
                    ':id' => $createdId,
                ]);
            }
            if (function_exists('afwSyncEnqueue')) {
                afwSyncEnqueue($pdo, 'payment_methods', $createdId, 'insert', false);
            }
            $createdPaymentMethod = findPaymentMethod($pdo, $createdId) ?? [];
            publishPaymentMethodEvent($projectRoot, 'created', $createdPaymentMethod);

            respond(201, [
                'success' => true,
                'message' => 'Metode pembayaran berhasil dibuat.',
                'data' => [
                    'paymentMethod' => rowToPaymentMethod($createdPaymentMethod),
                ],
            ]);
        }

        if ($method === 'PUT' || $method === 'PATCH') {
            if ($transactionId === null) {
                throw new InvalidArgumentException('Parameter id wajib diisi untuk memperbarui metode pembayaran.');
            }

            $existingRow = findPaymentMethod($pdo, $transactionId);
            if ($existingRow === null) {
                respond(404, [
                    'success' => false,
                    'message' => 'Metode pembayaran yang akan diperbarui tidak ditemukan.',
                ]);
            }

            $incoming = readPaymentMethodBody();
            $paymentMethod = paymentMethodFromBody($incoming, $existingRow);
            $errors = validatePaymentMethod($paymentMethod);
            if ($errors !== []) {
                respond(422, [
                    'success' => false,
                    'message' => 'Validasi metode pembayaran gagal.',
                    'errors' => $errors,
                ]);
            }

            $statement = $pdo->prepare(
                'UPDATE payment_methods SET
                    name = :name,
                    method_type = :method_type,
                    channel = :channel,
                    recipient_name = :recipient_name,
                    payment_code = :payment_code,
                    is_active = :is_active,
                    updated_at = :updated_at
                 WHERE id = :id'
            );
            $statement->execute([
                ':name' => $paymentMethod['name'],
                ':method_type' => $paymentMethod['method_type'],
                ':channel' => $paymentMethod['channel'],
                ':recipient_name' => $paymentMethod['recipient_name'],
                ':payment_code' => $paymentMethod['payment_code'],
                ':is_active' => $paymentMethod['is_active'],
                ':updated_at' => jakartaNow(),
                ':id' => $transactionId,
            ]);

            $image = storePaymentMethodFile($transactionId, $projectRoot);
            if ($image !== null) {
                $statement = $pdo->prepare(
                    'UPDATE payment_methods SET
                        qris_file_name = :qris_file_name,
                        qris_file_type = :qris_file_type,
                        qris_file_size = :qris_file_size,
                        qris_file_path = :qris_file_path,
                        qris_file_url = :qris_file_url,
                        updated_at = :updated_at
                     WHERE id = :id'
                );
                $statement->execute([
                    ':qris_file_name' => $image['name'],
                    ':qris_file_type' => $image['type'],
                    ':qris_file_size' => $image['size'],
                    ':qris_file_path' => $image['path'],
                    ':qris_file_url' => $image['url'],
                    ':updated_at' => jakartaNow(),
                    ':id' => $transactionId,
                ]);
            }
            if (function_exists('afwSyncEnqueue')) {
                afwSyncEnqueue($pdo, 'payment_methods', $transactionId, 'update');
            }
            $updatedPaymentMethod = findPaymentMethod($pdo, $transactionId) ?? [];
            publishPaymentMethodEvent($projectRoot, 'updated', $updatedPaymentMethod);

            respond(200, [
                'success' => true,
                'message' => 'Metode pembayaran berhasil diperbarui.',
                'data' => [
                    'paymentMethod' => rowToPaymentMethod($updatedPaymentMethod),
                ],
            ]);
        }

        if ($method === 'DELETE') {
            if ($transactionId === null) {
                throw new InvalidArgumentException('Parameter id wajib diisi untuk menghapus metode pembayaran.');
            }

            $existingRow = findPaymentMethod($pdo, $transactionId);
            if ($existingRow === null) {
                respond(404, [
                    'success' => false,
                    'message' => 'Metode pembayaran yang akan dihapus tidak ditemukan.',
                ]);
            }

            if (function_exists('afwSyncEnqueue')) {
                afwSyncEnqueue($pdo, 'payment_methods', $transactionId, 'delete');
            } else {
                $statement = $pdo->prepare('UPDATE payment_methods SET deleted_at = :deleted_at, updated_at = :updated_at WHERE id = :id');
                $now = jakartaNow();
                $statement->execute([':deleted_at' => $now, ':updated_at' => $now, ':id' => $transactionId]);
            }
            publishPaymentMethodEvent($projectRoot, 'deleted', $existingRow);

            respond(200, [
                'success' => true,
                'message' => 'Metode pembayaran berhasil dihapus.',
                'data' => [
                    'id' => $transactionId,
                ],
            ]);
        }
    }

    if ($method === 'POST' && $action === 'upload-proof') {
        if ($transactionId === null) {
            throw new InvalidArgumentException('Parameter id wajib diisi untuk upload bukti pembayaran.');
        }

        $existingRow = findTransaction($pdo, $transactionId);
        if ($existingRow === null) {
            respond(404, [
                'success' => false,
                'message' => 'Transaksi tidak ditemukan.',
            ]);
        }

        $referenceNumber = trim((string) ($_POST['referenceNumber'] ?? $_POST['reference_number'] ?? $existingRow['reference_number'] ?? ''));
        $proof = storePaymentProof($transactionId, $projectRoot);
        $now = jakartaNow();

        $statement = $pdo->prepare(
            'UPDATE transactions SET
                reference_number = :reference_number,
                proof_file_name = :proof_file_name,
                proof_file_type = :proof_file_type,
                proof_file_size = :proof_file_size,
                proof_file_path = :proof_file_path,
                proof_file_url = :proof_file_url,
                proof_uploaded_at = :proof_uploaded_at,
                status = "proof_uploaded",
                reviewed_at = NULL,
                reviewed_by = NULL,
                rejection_reason = NULL,
                updated_at = :updated_at
             WHERE id = :id'
        );
        $statement->execute([
            ':reference_number' => $referenceNumber,
            ':proof_file_name' => $proof['name'],
            ':proof_file_type' => $proof['type'],
            ':proof_file_size' => $proof['size'],
            ':proof_file_path' => $proof['path'],
            ':proof_file_url' => $proof['url'],
            ':proof_uploaded_at' => $now,
            ':updated_at' => $now,
            ':id' => $transactionId,
        ]);
        if (function_exists('afwSyncEnqueue')) {
            afwSyncEnqueue($pdo, 'transactions', $transactionId, 'update');
        }
        $updatedTransaction = findTransaction($pdo, $transactionId) ?? [];
        publishTransactionEvent($projectRoot, 'proof_uploaded', $updatedTransaction);

        respond(200, [
            'success' => true,
            'message' => 'Bukti pembayaran berhasil diupload. Menunggu review admin.',
            'data' => [
                'transaction' => rowToTransaction($updatedTransaction),
            ],
        ]);
    }

    if ($method === 'POST' && ($action === 'approve' || $action === 'reject')) {
        if ($transactionId === null) {
            throw new InvalidArgumentException('Parameter id wajib diisi untuk review transaksi.');
        }

        $existingRow = findTransaction($pdo, $transactionId);
        if ($existingRow === null) {
            respond(404, [
                'success' => false,
                'message' => 'Transaksi tidak ditemukan.',
            ]);
        }

        $incoming = [];
        $rawInput = file_get_contents('php://input');
        if ($rawInput !== false && trim($rawInput) !== '') {
            $decoded = json_decode($rawInput, true);
            $incoming = is_array($decoded) ? ($decoded['data'] ?? $decoded) : [];
        }

        $now = jakartaNow();
        if ($action === 'approve') {
            $statement = $pdo->prepare(
                'UPDATE transactions SET
                    status = "paid",
                    paid_at = COALESCE(paid_at, :paid_at),
                    reviewed_at = :reviewed_at,
                    reviewed_by = :reviewed_by,
                    rejection_reason = NULL,
                    updated_at = :updated_at
                 WHERE id = :id'
            );
            $statement->execute([
                ':paid_at' => $now,
                ':reviewed_at' => $now,
                ':reviewed_by' => trim((string) ($incoming['reviewedBy'] ?? 'Admin')),
                ':updated_at' => $now,
                ':id' => $transactionId,
            ]);
            grantProductAccess($pdo, findTransaction($pdo, $transactionId) ?? $existingRow, $now);
            if (function_exists('afwSyncEnqueue')) {
                afwSyncEnqueue($pdo, 'transactions', $transactionId, 'update');
            }
            $approvedTransaction = findTransaction($pdo, $transactionId) ?? [];
            publishTransactionEvent($projectRoot, 'approved', $approvedTransaction);

            respond(200, [
                'success' => true,
                'message' => 'Transaksi disetujui dan produk sudah diberikan ke user.',
                'data' => [
                    'transaction' => rowToTransaction($approvedTransaction),
                ],
            ]);
        }

        $reason = trim((string) ($incoming['reason'] ?? $incoming['rejectionReason'] ?? 'Bukti pembayaran belum valid.'));
        $statement = $pdo->prepare(
            'UPDATE transactions SET
                status = "rejected",
                reviewed_at = :reviewed_at,
                reviewed_by = :reviewed_by,
                rejection_reason = :rejection_reason,
                updated_at = :updated_at
             WHERE id = :id'
        );
        $statement->execute([
            ':reviewed_at' => $now,
            ':reviewed_by' => trim((string) ($incoming['reviewedBy'] ?? 'Admin')),
            ':rejection_reason' => $reason,
            ':updated_at' => $now,
            ':id' => $transactionId,
        ]);
        if (function_exists('afwSyncEnqueue')) {
            afwSyncEnqueue($pdo, 'transactions', $transactionId, 'update');
        }
        $rejectedTransaction = findTransaction($pdo, $transactionId) ?? [];
        publishTransactionEvent($projectRoot, 'rejected', $rejectedTransaction);

        respond(200, [
            'success' => true,
            'message' => 'Transaksi ditolak. User dapat upload ulang bukti pembayaran.',
            'data' => [
                'transaction' => rowToTransaction($rejectedTransaction),
            ],
        ]);
    }

    if ($method === 'GET') {
        if ($transactionId !== null) {
            $row = findTransaction($pdo, $transactionId);
            if ($row === null) {
                respond(404, [
                    'success' => false,
                    'message' => 'Transaksi tidak ditemukan.',
                ]);
            }

            respond(200, [
                'success' => true,
                'data' => [
                    'transaction' => rowToTransaction($row),
                ],
            ]);
        }

        $where = [];
        $params = [];
        $hasUserId = isset($_GET['userId']) && $_GET['userId'] !== '';
        $hasEmail = isset($_GET['email']) && trim((string) $_GET['email']) !== '';

        if ($hasUserId && $hasEmail) {
            $where[] = '(user_id = :user_id OR LOWER(email) = LOWER(:email))';
            $params[':user_id'] = (int) $_GET['userId'];
            $params[':email'] = trim((string) $_GET['email']);
        } elseif ($hasUserId) {
            $where[] = 'user_id = :user_id';
            $params[':user_id'] = (int) $_GET['userId'];
        } elseif ($hasEmail) {
            $where[] = 'LOWER(email) = LOWER(:email)';
            $params[':email'] = trim((string) $_GET['email']);
        }
        if (isset($_GET['status']) && trim((string) $_GET['status']) !== '') {
            $where[] = 'status = :status';
            $params[':status'] = normalizeStatus((string) $_GET['status']);
        }

        $sql = 'SELECT * FROM transactions WHERE deleted_at IS NULL';
        if ($where !== []) {
            $sql .= ' AND ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY created_at DESC, id DESC';

        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        $transactions = array_map('rowToTransaction', $statement->fetchAll());

        respond(200, [
            'success' => true,
            'message' => 'Data transaksi berhasil diambil.',
            'data' => [
                'transactions' => $transactions,
                'total' => count($transactions),
            ],
        ]);
    }

    if ($method === 'POST') {
        $incoming = readTransactionBody();
        $transaction = transactionFromBody($incoming);
        $errors = validateTransaction($transaction);
        if ($errors !== []) {
            respond(422, [
                'success' => false,
                'message' => 'Validasi transaksi gagal.',
                'errors' => $errors,
            ]);
        }

        $now = jakartaNow();
        $statement = $pdo->prepare(
            'INSERT INTO transactions (
                user_id, user_name, email, item_type, item_id, item_title, amount, currency,
                payment_method, payment_channel, payment_code, recipient_name, invoice_number, reference_number, status,
                paid_at, due_at, notes, payload_json, created_at, updated_at
            ) VALUES (
                :user_id, :user_name, :email, :item_type, :item_id, :item_title, :amount, :currency,
                :payment_method, :payment_channel, :payment_code, :recipient_name, :invoice_number, :reference_number, :status,
                :paid_at, :due_at, :notes, :payload_json, :created_at, :updated_at
            )'
        );

        $statement->execute([
            ':user_id' => $transaction['user_id'],
            ':user_name' => $transaction['user_name'],
            ':email' => $transaction['email'],
            ':item_type' => $transaction['item_type'],
            ':item_id' => $transaction['item_id'],
            ':item_title' => $transaction['item_title'],
            ':amount' => $transaction['amount'],
            ':currency' => $transaction['currency'],
            ':payment_method' => $transaction['payment_method'],
            ':payment_channel' => $transaction['payment_channel'],
            ':payment_code' => $transaction['payment_code'],
            ':recipient_name' => $transaction['recipient_name'],
            ':invoice_number' => $transaction['invoice_number'],
            ':reference_number' => $transaction['reference_number'],
            ':status' => $transaction['status'],
            ':paid_at' => $transaction['paid_at'],
            ':due_at' => $transaction['due_at'],
            ':notes' => $transaction['notes'],
            ':payload_json' => json_encode($transaction['payload'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $createdId = (int) $pdo->lastInsertId();
        $qrisFile = storeQrisFile($createdId, $projectRoot);
        if ($qrisFile !== null) {
            $statement = $pdo->prepare(
                'UPDATE transactions SET
                    qris_file_name = :qris_file_name,
                    qris_file_type = :qris_file_type,
                    qris_file_size = :qris_file_size,
                    qris_file_path = :qris_file_path,
                    qris_file_url = :qris_file_url,
                    updated_at = :updated_at
                 WHERE id = :id'
            );
            $statement->execute([
                ':qris_file_name' => $qrisFile['name'],
                ':qris_file_type' => $qrisFile['type'],
                ':qris_file_size' => $qrisFile['size'],
                ':qris_file_path' => $qrisFile['path'],
                ':qris_file_url' => $qrisFile['url'],
                ':updated_at' => jakartaNow(),
                ':id' => $createdId,
            ]);
        }
        if (function_exists('afwSyncEnqueue')) {
            afwSyncEnqueue($pdo, 'transactions', $createdId, 'insert', false);
        }
        $createdTransaction = findTransaction($pdo, $createdId) ?? [];
        publishTransactionEvent($projectRoot, 'created', $createdTransaction);

        respond(201, [
            'success' => true,
            'message' => 'Transaksi berhasil dibuat.',
            'data' => [
                'transaction' => rowToTransaction($createdTransaction),
            ],
        ]);
    }

    if ($method === 'PUT' || $method === 'PATCH') {
        if ($transactionId === null) {
            throw new InvalidArgumentException('Parameter id wajib diisi untuk memperbarui transaksi.');
        }

        $existingRow = findTransaction($pdo, $transactionId);
        if ($existingRow === null) {
            respond(404, [
                'success' => false,
                'message' => 'Transaksi yang akan diperbarui tidak ditemukan.',
            ]);
        }

        $incoming = readTransactionBody();
        $transaction = transactionFromBody($incoming, $existingRow);
        $errors = validateTransaction($transaction);
        if ($errors !== []) {
            respond(422, [
                'success' => false,
                'message' => 'Validasi transaksi gagal.',
                'errors' => $errors,
            ]);
        }

        $statement = $pdo->prepare(
            'UPDATE transactions SET
                user_id = :user_id,
                user_name = :user_name,
                email = :email,
                item_type = :item_type,
                item_id = :item_id,
                item_title = :item_title,
                amount = :amount,
                currency = :currency,
                payment_method = :payment_method,
                payment_channel = :payment_channel,
                payment_code = :payment_code,
                recipient_name = :recipient_name,
                invoice_number = :invoice_number,
                reference_number = :reference_number,
                status = :status,
                paid_at = :paid_at,
                due_at = :due_at,
                notes = :notes,
                payload_json = :payload_json,
                updated_at = :updated_at
             WHERE id = :id'
        );

        $statement->execute([
            ':user_id' => $transaction['user_id'],
            ':user_name' => $transaction['user_name'],
            ':email' => $transaction['email'],
            ':item_type' => $transaction['item_type'],
            ':item_id' => $transaction['item_id'],
            ':item_title' => $transaction['item_title'],
            ':amount' => $transaction['amount'],
            ':currency' => $transaction['currency'],
            ':payment_method' => $transaction['payment_method'],
            ':payment_channel' => $transaction['payment_channel'],
            ':payment_code' => $transaction['payment_code'],
            ':recipient_name' => $transaction['recipient_name'],
            ':invoice_number' => $transaction['invoice_number'],
            ':reference_number' => $transaction['reference_number'],
            ':status' => $transaction['status'],
            ':paid_at' => $transaction['paid_at'],
            ':due_at' => $transaction['due_at'],
            ':notes' => $transaction['notes'],
            ':payload_json' => json_encode($transaction['payload'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
            ':updated_at' => jakartaNow(),
            ':id' => $transactionId,
        ]);

        $qrisFile = storeQrisFile($transactionId, $projectRoot);
        if ($qrisFile !== null) {
            $statement = $pdo->prepare(
                'UPDATE transactions SET
                    qris_file_name = :qris_file_name,
                    qris_file_type = :qris_file_type,
                    qris_file_size = :qris_file_size,
                    qris_file_path = :qris_file_path,
                    qris_file_url = :qris_file_url,
                    updated_at = :updated_at
                 WHERE id = :id'
            );
            $statement->execute([
                ':qris_file_name' => $qrisFile['name'],
                ':qris_file_type' => $qrisFile['type'],
                ':qris_file_size' => $qrisFile['size'],
                ':qris_file_path' => $qrisFile['path'],
                ':qris_file_url' => $qrisFile['url'],
                ':updated_at' => jakartaNow(),
                ':id' => $transactionId,
            ]);
        }
        if (function_exists('afwSyncEnqueue')) {
            afwSyncEnqueue($pdo, 'transactions', $transactionId, 'update');
        }
        $updatedTransaction = findTransaction($pdo, $transactionId) ?? [];
        publishTransactionEvent($projectRoot, 'updated', $updatedTransaction);

        respond(200, [
            'success' => true,
            'message' => 'Transaksi berhasil diperbarui.',
            'data' => [
                'transaction' => rowToTransaction($updatedTransaction),
            ],
        ]);
    }

    if ($method === 'DELETE') {
        if ($transactionId === null) {
            throw new InvalidArgumentException('Parameter id wajib diisi untuk menghapus transaksi.');
        }

        $existingRow = findTransaction($pdo, $transactionId);
        if ($existingRow === null) {
            respond(404, [
                'success' => false,
                'message' => 'Transaksi yang akan dihapus tidak ditemukan.',
            ]);
        }

        if (function_exists('afwSyncEnqueue')) {
            afwSyncEnqueue($pdo, 'transactions', $transactionId, 'delete');
        } else {
            $statement = $pdo->prepare('UPDATE transactions SET deleted_at = :deleted_at, updated_at = :updated_at WHERE id = :id');
            $now = jakartaNow();
            $statement->execute([':deleted_at' => $now, ':updated_at' => $now, ':id' => $transactionId]);
        }
        publishTransactionEvent($projectRoot, 'deleted', $existingRow);

        respond(200, [
            'success' => true,
            'message' => 'Transaksi berhasil dihapus.',
            'data' => [
                'id' => $transactionId,
                'invoiceNumber' => $existingRow['invoice_number'] ?? '',
            ],
        ]);
    }
} catch (JsonException $error) {
    respond(400, [
        'success' => false,
        'message' => 'JSON tidak valid.',
        'error' => $error->getMessage(),
    ]);
} catch (InvalidArgumentException $error) {
    respond(400, [
        'success' => false,
        'message' => $error->getMessage(),
    ]);
} catch (PDOException $error) {
    respond(500, [
        'success' => false,
        'message' => 'Gagal mengakses SQLite.',
        'error' => $error->getMessage(),
    ]);
} catch (Throwable $error) {
    respond(500, [
        'success' => false,
        'message' => 'Terjadi kesalahan pada server.',
        'error' => $error->getMessage(),
    ]);
}
