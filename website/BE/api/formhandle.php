<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$syncOutboxPath = __DIR__ . '/support/sync-outbox.php';

if (is_file($syncOutboxPath)) {
    require_once $syncOutboxPath;
}

/*
|--------------------------------------------------------------------------
| Fungsi umum
|--------------------------------------------------------------------------
*/

function sendJson(
    int $status,
    bool $success,
    string $message,
    array $data = [],
    array $errors = []
): void {
    http_response_code($status);

    $response = [
        'success' => $success,
        'message' => $message,
    ];

    if ($data !== []) {
        $response['data'] = $data;
    }

    if ($errors !== []) {
        $response['errors'] = $errors;
    }

    echo json_encode(
        $response,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

function textLength(string $value): int
{
    return function_exists('mb_strlen')
        ? mb_strlen($value)
        : strlen($value);
}

function cleanWhatsapp(mixed $value): string
{
    return preg_replace(
        '/[^0-9]/',
        '',
        (string) $value
    ) ?? '';
}

function validateName(
    string $value,
    string $field,
    array &$errors
): void {
    if ($value === '') {
        $errors[$field] = 'Nama lengkap wajib diisi.';
    } elseif (textLength($value) < 3) {
        $errors[$field] = 'Nama lengkap minimal 3 karakter.';
    } elseif (textLength($value) > 150) {
        $errors[$field] = 'Nama lengkap maksimal 150 karakter.';
    }
}

function validateEmail(
    string $value,
    string $field,
    array &$errors
): void {
    if ($value === '') {
        $errors[$field] = 'Email wajib diisi.';
    } elseif (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
        $errors[$field] = 'Format email tidak valid.';
    } elseif (textLength($value) > 191) {
        $errors[$field] = 'Email maksimal 191 karakter.';
    }
}

function validateWhatsapp(
    string $value,
    string $field,
    array &$errors
): void {
    if ($value === '') {
        $errors[$field] = 'Nomor WhatsApp wajib diisi.';
    } elseif (!preg_match('/^(08|628)[0-9]{8,13}$/', $value)) {
        $errors[$field] = 'Format nomor WhatsApp tidak valid.';
    }
}

function validateConsent(
    bool $value,
    string $field,
    array &$errors
): void {
    if (!$value) {
        $errors[$field] =
            'Persetujuan untuk dihubungi wajib diberikan.';
    }
}

function tableExists(PDO $pdo, string $table): bool
{
    $statement = $pdo->prepare(
        "SELECT name
         FROM sqlite_master
         WHERE type = 'table'
         AND name = :table
         LIMIT 1"
    );

    $statement->execute([
        ':table' => $table,
    ]);

    return $statement->fetchColumn() !== false;
}

function columnExists(PDO $pdo, string $table, string $column): bool
{
    $statement = $pdo->query(
        'PRAGMA table_info(' . $table . ')'
    );

    $columns = array_map(
        static fn (array $row): string =>
            (string) ($row['name'] ?? ''),
        $statement->fetchAll()
    );

    return in_array($column, $columns, true);
}

function addColumnIfMissing(
    PDO $pdo,
    string $table,
    string $column,
    string $definition
): void {
    if (!columnExists($pdo, $table, $column)) {
        $pdo->exec(
            'ALTER TABLE '
            . $table
            . ' ADD COLUMN '
            . $column
            . ' '
            . $definition
        );
    }
}

function ensureWorkshopRegistrationColumns(PDO $pdo): void
{
    if (!tableExists($pdo, 'workshop_registrations')) {
        return;
    }

    addColumnIfMissing(
        $pdo,
        'workshop_registrations',
        'workshop_id',
        'INTEGER NULL'
    );

    addColumnIfMissing(
        $pdo,
        'workshop_registrations',
        'member_names',
        'TEXT NULL'
    );

    addColumnIfMissing(
        $pdo,
        'workshop_registrations',
        'transaction_id',
        'INTEGER NULL'
    );
}

function ensureCollaborationColumns(PDO $pdo): void
{
    if (!tableExists($pdo, 'collaborations')) {
        return;
    }

    addColumnIfMissing($pdo, 'collaborations', 'description', 'TEXT NULL');
    addColumnIfMissing($pdo, 'collaborations', 'proposal_file_name', 'TEXT NULL');
    addColumnIfMissing($pdo, 'collaborations', 'proposal_file_type', 'TEXT NULL');
    addColumnIfMissing($pdo, 'collaborations', 'proposal_file_size', 'INTEGER NULL');
    addColumnIfMissing($pdo, 'collaborations', 'proposal_file_path', 'TEXT NULL');
    addColumnIfMissing($pdo, 'collaborations', 'proposal_file_url', 'TEXT NULL');
}

function saveUploadedProposal(array $uploadedFile, string $projectRoot): ?array
{
    $uploadError = (int) ($uploadedFile['error'] ?? UPLOAD_ERR_NO_FILE);

    if ($uploadError === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($uploadError !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Upload proposal gagal. Kode: ' . $uploadError);
    }

    $temporaryPath = (string) ($uploadedFile['tmp_name'] ?? '');

    if ($temporaryPath === '' || !is_uploaded_file($temporaryPath)) {
        throw new RuntimeException('Temporary file proposal tidak valid.');
    }

    $size = (int) ($uploadedFile['size'] ?? 0);

    if ($size <= 0) {
        throw new RuntimeException('Ukuran file proposal tidak valid.');
    }

    if ($size > 10 * 1024 * 1024) {
        throw new RuntimeException('Ukuran proposal maksimal 10 MB.');
    }

    if (!class_exists('finfo')) {
        throw new RuntimeException('Ekstensi PHP fileinfo belum aktif.');
    }

    $originalName = basename((string) ($uploadedFile['name'] ?? 'proposal.pdf'));
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $detectedMime = (string) (new finfo(FILEINFO_MIME_TYPE))->file($temporaryPath);

    if ($extension !== 'pdf' || $detectedMime !== 'application/pdf') {
        throw new RuntimeException('Proposal harus berupa file PDF.');
    }

    $directory = $projectRoot
        . DIRECTORY_SEPARATOR
        . 'storage'
        . DIRECTORY_SEPARATOR
        . 'uploads'
        . DIRECTORY_SEPARATOR
        . 'proposals';

    if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
        throw new RuntimeException('Folder upload proposal gagal dibuat.');
    }

    if (!is_writable($directory)) {
        throw new RuntimeException('Folder upload proposal tidak dapat ditulis.');
    }

    $fileName = 'proposal_' . date('Ymd_His') . '_' . bin2hex(random_bytes(8)) . '.pdf';
    $destination = $directory . DIRECTORY_SEPARATOR . $fileName;

    if (!move_uploaded_file($temporaryPath, $destination)) {
        throw new RuntimeException('Proposal gagal disimpan.');
    }

    return [
        'file_name' => $fileName,
        'original_name' => $originalName,
        'file_type' => $detectedMime,
        'file_size' => $size,
        'file_path' => 'storage/uploads/proposals/' . $fileName,
        'file_url' => '/uploads/proposals/' . $fileName,
    ];
}

function ensureTransactionTablesForWorkshop(PDO $pdo): void
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
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );

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
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );

    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_transactions_email ON transactions(email)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)');
}

function ensurePartnersTableForCollaboration(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS partners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT "Institusi",
            pic_name TEXT NOT NULL DEFAULT "",
            pic_role TEXT NOT NULL DEFAULT "",
            email TEXT NOT NULL DEFAULT "",
            whatsapp TEXT NOT NULL DEFAULT "",
            city TEXT NOT NULL DEFAULT "",
            province TEXT NOT NULL DEFAULT "",
            website TEXT NOT NULL DEFAULT "",
            social_media TEXT NOT NULL DEFAULT "",
            description TEXT NOT NULL DEFAULT "",
            programs_json TEXT NOT NULL DEFAULT "[]",
            status TEXT NOT NULL DEFAULT "Draft",
            show_homepage INTEGER NOT NULL DEFAULT 0,
            featured INTEGER NOT NULL DEFAULT 0,
            follow_up_note TEXT NOT NULL DEFAULT "",
            start_date TEXT,
            last_contact_at TEXT,
            deleted_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );
}

function syncCollaborationToPartner(
    PDO $pdo,
    string $institutionName,
    string $institutionType,
    string $picName,
    string $picEmail,
    string $picWhatsapp,
    string $goal,
    ?string $participantEstimate,
    ?string $demoSchedule,
    ?string $description,
    ?array $proposalFile,
    string $now
): ?int {
    ensurePartnersTableForCollaboration($pdo);

    $existingStatement = $pdo->prepare(
        'SELECT id
         FROM partners
         WHERE deleted_at IS NULL
         AND (
            (email <> "" AND LOWER(email) = LOWER(:email))
            OR LOWER(name) = LOWER(:name)
         )
         LIMIT 1'
    );
    $existingStatement->execute([
        ':email' => $picEmail,
        ':name' => $institutionName,
    ]);
    $existingId = $existingStatement->fetchColumn();

    $programs = array_values(array_filter([$goal]));
    $notes = array_values(array_filter([
        $participantEstimate ? 'Peserta/User: ' . $participantEstimate : '',
        $demoSchedule ? 'Jadwal demo: ' . $demoSchedule : '',
        $proposalFile ? 'Proposal: ' . ($proposalFile['file_url'] ?? '') : '',
    ]));
    $followUpNote = implode(' | ', $notes);
    $partnerDescription = trim((string) $description);

    if ($partnerDescription === '') {
        $partnerDescription = 'Lead kolaborasi dari form kontak ArduFlow.';
    }

    if ($existingId !== false) {
        $statement = $pdo->prepare(
            'UPDATE partners
             SET type = :type,
                 pic_name = :pic_name,
                 email = :email,
                 whatsapp = :whatsapp,
                 description = :description,
                 programs_json = :programs_json,
                 status = CASE WHEN status = "Draft" THEN "Menunggu" ELSE status END,
                 follow_up_note = :follow_up_note,
                 last_contact_at = :last_contact_at,
                 updated_at = :updated_at
             WHERE id = :id'
        );
        $statement->execute([
            ':type' => $institutionType !== '' ? $institutionType : 'Institusi',
            ':pic_name' => $picName,
            ':email' => $picEmail,
            ':whatsapp' => $picWhatsapp,
            ':description' => $partnerDescription,
            ':programs_json' => json_encode($programs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':follow_up_note' => $followUpNote,
            ':last_contact_at' => $demoSchedule,
            ':updated_at' => $now,
            ':id' => (int) $existingId,
        ]);

        return (int) $existingId;
    }

    $statement = $pdo->prepare(
        'INSERT INTO partners (
            name, type, pic_name, pic_role, email, whatsapp, city, province, website, social_media,
            description, programs_json, status, show_homepage, featured, follow_up_note,
            start_date, last_contact_at, created_at, updated_at
        ) VALUES (
            :name, :type, :pic_name, "", :email, :whatsapp, "", "", "", "",
            :description, :programs_json, "Menunggu", 0, 0, :follow_up_note,
            NULL, :last_contact_at, :created_at, :updated_at
        )'
    );
    $statement->execute([
        ':name' => $institutionName,
        ':type' => $institutionType !== '' ? $institutionType : 'Institusi',
        ':pic_name' => $picName,
        ':email' => $picEmail,
        ':whatsapp' => $picWhatsapp,
        ':description' => $partnerDescription,
        ':programs_json' => json_encode($programs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ':follow_up_note' => $followUpNote,
        ':last_contact_at' => $demoSchedule,
        ':created_at' => $now,
        ':updated_at' => $now,
    ]);

    return (int) $pdo->lastInsertId();
}

function generateWorkshopInvoiceNumber(): string
{
    try {
        $suffix = strtoupper(bin2hex(random_bytes(3)));
    } catch (Throwable) {
        $suffix = strtoupper(substr(str_replace('.', '', uniqid('', true)), -6));
    }

    return 'AFW-INV-' . gmdate('Ymd') . '-' . $suffix;
}

function parseMoneyValue(mixed $value): float
{
    $digits = preg_replace('/\D+/', '', (string) $value) ?? '';
    return $digits === '' ? 0.0 : (float) $digits;
}

function firstActivePaymentMethod(PDO $pdo): array
{
    if (!tableExists($pdo, 'payment_methods')) {
        return [];
    }

    $statement = $pdo->query(
        'SELECT *
         FROM payment_methods
         WHERE is_active = 1
         ORDER BY id DESC
         LIMIT 1'
    );

    $row = $statement->fetch();
    return is_array($row) ? $row : [];
}

function workshopPrice(PDO $pdo, ?int $workshopId): float
{
    if ($workshopId === null || !tableExists($pdo, 'workshops')) {
        return 0.0;
    }

    $statement = $pdo->prepare(
        'SELECT payload_json
         FROM workshops
         WHERE id = :id
         LIMIT 1'
    );
    $statement->execute([':id' => $workshopId]);
    $payload = json_decode((string) ($statement->fetchColumn() ?: '{}'), true);

    if (!is_array($payload)) {
        return 0.0;
    }

    return parseMoneyValue(
        $payload['registrationFee']
            ?? $payload['registration_fee']
            ?? $payload['price']
            ?? 0
    );
}

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$isLocalOrigin = preg_match(
    '#^http://(localhost|127\.0\.0\.1):[0-9]+$#',
    $origin
) === 1;

$isPrivateNetworkOrigin = preg_match(
    '#^http://((10|127)\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|192\.168\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[0-1])\.[0-9]{1,3}\.[0-9]{1,3}):[0-9]+$#',
    $origin
) === 1;

$allowedOrigins = [
    'https://arduflow.indobilliard.com',
    'https://www.arduflow.indobilliard.com',
];

if (
    $isLocalOrigin
    || $isPrivateNetworkOrigin
    || in_array($origin, $allowedOrigins, true)
) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header(
    'Access-Control-Allow-Headers: '
    . 'Content-Type, Accept, Authorization'
);
header('Access-Control-Max-Age: 86400');

/*
|--------------------------------------------------------------------------
| Validasi method
|--------------------------------------------------------------------------
*/

$method = $_SERVER['REQUEST_METHOD'] ?? '';

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST, OPTIONS');

    sendJson(
        405,
        false,
        'Method tidak diizinkan. Gunakan method GET atau POST.'
    );
}

/*
|--------------------------------------------------------------------------
| Path project
|--------------------------------------------------------------------------
|
| File endpoint:
| website/BE/api/formhandle.php
|
| Project root:
| website/BE
|
*/

$projectRoot = dirname(__DIR__);

$autoloadPath = $projectRoot . '/vendor/autoload.php';
// $configPath = $projectRoot . '/config/database.php';
$configPath = $projectRoot . '/config/database.php';

if (!file_exists($autoloadPath)) {
    sendJson(
        500,
        false,
        'Composer autoload tidak ditemukan.',
        [
            'path' => $autoloadPath,
            'solution' =>
                'Jalankan composer install dari folder website/BE.',
        ]
    );
}

if (!file_exists($configPath)) {
    sendJson(
        500,
        false,
        'Konfigurasi database tidak ditemukan.',
        [
            'path' => $configPath,
        ]
    );
}

require_once $autoloadPath;

/*
|--------------------------------------------------------------------------
| Penanganan error
|--------------------------------------------------------------------------
*/

set_exception_handler(function (Throwable $exception): void {
    error_log($exception->__toString());

    sendJson(
        500,
        false,
        'Terjadi kesalahan pada server API.',
        [
            'detail' => $exception->getMessage(),
        ]
    );
});

function openSqliteConnection(array $sqliteConfig, string $projectRoot): PDO
{
    $databasePath = trim(
        (string) ($sqliteConfig['path'] ?? '')
    );

    $busyTimeout = (int) (
        $sqliteConfig['busy_timeout_ms'] ?? 15000
    );

    if ($databasePath === '') {
        sendJson(
            500,
            false,
            'Path database SQLite belum dikonfigurasi.'
        );
    }

    $isWindowsAbsolutePath = preg_match(
        '/^[A-Za-z]:[\\\\\/]/',
        $databasePath
    ) === 1;

    $isUnixAbsolutePath = str_starts_with(
        $databasePath,
        '/'
    );

    if (
        !$isWindowsAbsolutePath
        && !$isUnixAbsolutePath
    ) {
        $databasePath =
            $projectRoot
            . DIRECTORY_SEPARATOR
            . str_replace(
                ['/', '\\'],
                DIRECTORY_SEPARATOR,
                $databasePath
            );
    }

    $databaseDirectory = dirname($databasePath);

    if (
        !is_dir($databaseDirectory)
        && !mkdir($databaseDirectory, 0775, true)
        && !is_dir($databaseDirectory)
    ) {
        sendJson(
            500,
            false,
            'Folder database tidak dapat dibuat.',
            [
                'database_directory' => $databaseDirectory,
            ]
        );
    }

    $pdo = new PDO(
        'sqlite:' . $databasePath,
        null,
        null,
        [
            PDO::ATTR_ERRMODE =>
                PDO::ERRMODE_EXCEPTION,

            PDO::ATTR_DEFAULT_FETCH_MODE =>
                PDO::FETCH_ASSOC,

            PDO::ATTR_EMULATE_PREPARES =>
                false,
        ]
    );

    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA synchronous = NORMAL');
    $pdo->exec(
        'PRAGMA busy_timeout = '
        . max(15000, $busyTimeout)
    );

    return $pdo;
}

function normalizeAdminStatus(?string $status): string
{
    return match (strtolower(trim((string) $status))) {
        'new', 'baru' => 'Baru',
        'pending_payment' => 'Menunggu Pembayaran',
        'registered', 'active', 'paid' => 'Terdaftar',
        'in_progress', 'processing', 'processed', 'diproses' => 'Diproses',
        'waiting', 'pending', 'menunggu' => 'Menunggu Balasan',
        'done', 'completed', 'selesai' => 'Selesai',
        'rejected', 'spam', 'ditolak' => 'Ditolak',
        default => 'Baru',
    };
}

function databaseStatusValue(string $status): string
{
    return match (normalizeAdminStatus($status)) {
        'Selesai' => 'done',
        'Diproses' => 'in_progress',
        'Menunggu Balasan' => 'waiting',
        'Ditolak' => 'rejected',
        default => 'new',
    };
}

function tableForFormType(string $formType): ?string
{
    return match ($formType) {
        'lead' => 'leads',
        'collaboration' => 'collaborations',
        'workshop' => 'workshop_registrations',
        default => null,
    };
}

function formatAdminDate(?string $value): string
{
    if (!$value) {
        return '-';
    }

    try {
        $date = new DateTimeImmutable($value);
    } catch (Throwable) {
        return $value;
    }

    return $date
        ->setTimezone(new DateTimeZone('Asia/Jakarta'))
        ->format('d M Y H:i');
}

function leadPriority(string $topic, string $message, string $status): string
{
    $text = strtolower($topic . ' ' . $message);

    if (
        str_contains($text, 'partner')
        || str_contains($text, 'kolaborasi')
        || str_contains($text, 'workshop')
        || normalizeAdminStatus($status) === 'Baru'
    ) {
        return 'Tinggi';
    }

    if (trim($message) === '') {
        return 'Rendah';
    }

    return 'Normal';
}

function truncateText(string $value, int $limit = 56): string
{
    $cleanValue = trim(preg_replace('/\s+/', ' ', $value) ?? $value);

    if (textLength($cleanValue) <= $limit) {
        return $cleanValue !== '' ? $cleanValue : '-';
    }

    return function_exists('mb_substr')
        ? mb_substr($cleanValue, 0, $limit - 3) . '...'
        : substr($cleanValue, 0, $limit - 3) . '...';
}

function fetchAdminLeads(PDO $pdo): array
{
    $items = [];

    if (tableExists($pdo, 'leads')) {
        $statement = $pdo->query(
            "SELECT
                id,
                name,
                email,
                whatsapp,
                topic,
                message,
                source,
                status,
                created_at,
                updated_at
             FROM leads
             WHERE deleted_at IS NULL"
        );

        foreach ($statement->fetchAll() as $row) {
            $status = normalizeAdminStatus($row['status'] ?? 'new');
            $topic = (string) ($row['topic'] ?? 'Lead');
            $message = (string) ($row['message'] ?? '');

            $items[] = [
                'id' => 'lead-' . (int) $row['id'],
                'numeric_id' => (int) $row['id'],
                'form_type' => 'lead',
                'name' => (string) $row['name'],
                'email' => (string) $row['email'],
                'whatsapp' => (string) $row['whatsapp'],
                'topic' => $topic,
                'message' => $message,
                'message_short' => truncateText($message),
                'priority' => leadPriority($topic, $message, $status),
                'status' => $status,
                'pic' => '-',
                'source' => (string) ($row['source'] ?? 'website'),
                'created_at' => (string) $row['created_at'],
                'updated_at' => (string) $row['updated_at'],
                'created_at_label' => formatAdminDate($row['created_at'] ?? null),
                'updated_at_label' => formatAdminDate($row['updated_at'] ?? null),
            ];
        }
    }

    if (tableExists($pdo, 'collaborations')) {
        ensureCollaborationColumns($pdo);

        $statement = $pdo->query(
            "SELECT
                id,
                pic_name,
                pic_email,
                pic_whatsapp,
                institution_name,
                institution_type,
                goal,
                participant_estimate,
                demo_schedule,
                description,
                proposal_file_name,
                proposal_file_type,
                proposal_file_size,
                proposal_file_url,
                source,
                status,
                created_at,
                updated_at
             FROM collaborations
             WHERE deleted_at IS NULL"
        );

        foreach ($statement->fetchAll() as $row) {
            $status = normalizeAdminStatus($row['status'] ?? 'new');
            $topic = 'Partner';
            $message = trim(
                (string) ($row['institution_name'] ?? '')
                . ' - '
                . (string) ($row['goal'] ?? '')
            );

            $items[] = [
                'id' => 'collaboration-' . (int) $row['id'],
                'numeric_id' => (int) $row['id'],
                'form_type' => 'collaboration',
                'name' => (string) $row['pic_name'],
                'email' => (string) $row['pic_email'],
                'whatsapp' => (string) $row['pic_whatsapp'],
                'topic' => $topic,
                'message' => $message,
                'message_short' => truncateText($message),
                'priority' => leadPriority($topic, $message, $status),
                'status' => $status,
                'pic' => '-',
                'source' => (string) ($row['source'] ?? 'website'),
                'created_at' => (string) $row['created_at'],
                'updated_at' => (string) $row['updated_at'],
                'created_at_label' => formatAdminDate($row['created_at'] ?? null),
                'updated_at_label' => formatAdminDate($row['updated_at'] ?? null),
                'meta' => [
                    'institution_type' => $row['institution_type'] ?? null,
                    'participant_estimate' => $row['participant_estimate'] ?? null,
                    'demo_schedule' => $row['demo_schedule'] ?? null,
                    'description' => $row['description'] ?? null,
                    'proposal_file_name' => $row['proposal_file_name'] ?? null,
                    'proposal_file_type' => $row['proposal_file_type'] ?? null,
                    'proposal_file_size' => isset($row['proposal_file_size'])
                        ? (string) $row['proposal_file_size']
                        : null,
                    'proposal_file_url' => $row['proposal_file_url'] ?? null,
                ],
            ];
        }
    }

    if (tableExists($pdo, 'workshop_registrations')) {
        ensureWorkshopRegistrationColumns($pdo);

        $statement = $pdo->query(
            "SELECT
                id,
                participant_name,
                participant_email,
                participant_whatsapp,
                institution_name,
                workshop_id,
                transaction_id,
                workshop_choice,
                participant_estimate,
                member_names,
                notes,
                source,
                status,
                created_at,
                updated_at
             FROM workshop_registrations
             WHERE deleted_at IS NULL"
        );

        foreach ($statement->fetchAll() as $row) {
            $status = normalizeAdminStatus($row['status'] ?? 'new');
            $topic = 'Workshop';
            $message = trim(
                (string) ($row['workshop_choice'] ?? '')
                . ' - '
                . (string) ($row['notes'] ?? '')
            );

            $items[] = [
                'id' => 'workshop-' . (int) $row['id'],
                'numeric_id' => (int) $row['id'],
                'form_type' => 'workshop',
                'name' => (string) $row['participant_name'],
                'email' => (string) $row['participant_email'],
                'whatsapp' => (string) $row['participant_whatsapp'],
                'topic' => $topic,
                'message' => $message,
                'message_short' => truncateText($message),
                'priority' => leadPriority($topic, $message, $status),
                'status' => $status,
                'pic' => '-',
                'source' => (string) ($row['source'] ?? 'website'),
                'created_at' => (string) $row['created_at'],
                'updated_at' => (string) $row['updated_at'],
                'created_at_label' => formatAdminDate($row['created_at'] ?? null),
                'updated_at_label' => formatAdminDate($row['updated_at'] ?? null),
                'meta' => [
                    'institution_name' => $row['institution_name'] ?? null,
                    'workshop_id' => $row['workshop_id'] ?? null,
                    'transaction_id' => $row['transaction_id'] ?? null,
                    'workshop_choice' => $row['workshop_choice'] ?? null,
                    'participant_estimate' => $row['participant_estimate'] ?? null,
                    'member_names' => $row['member_names'] ?? null,
                ],
            ];
        }
    }

    usort(
        $items,
        static fn (array $a, array $b): int =>
            strcmp((string) $b['created_at'], (string) $a['created_at'])
    );

    return $items;
}

function summarizeLeadItems(array $items): array
{
    $statusCounts = [];
    $topicCounts = [];
    $formTypeCounts = [
        'lead' => 0,
        'collaboration' => 0,
        'workshop' => 0,
    ];

    foreach ($items as $item) {
        $status = (string) ($item['status'] ?? 'Baru');
        $topic = (string) ($item['topic'] ?? '-');
        $formType = (string) ($item['form_type'] ?? '');

        $statusCounts[$status] = ($statusCounts[$status] ?? 0) + 1;
        $topicCounts[$topic] = ($topicCounts[$topic] ?? 0) + 1;

        if (array_key_exists($formType, $formTypeCounts)) {
            $formTypeCounts[$formType] += 1;
        }
    }

    return [
        'status_counts' => $statusCounts,
        'topic_counts' => $topicCounts,
        'form_type_counts' => $formTypeCounts,
    ];
}

function fetchUserLeadHistory(PDO $pdo, string $email): array
{
    $normalizedEmail = strtolower(trim($email));

    if ($normalizedEmail === '') {
        return [];
    }

    return array_values(
        array_filter(
            fetchAdminLeads($pdo),
            static fn (array $item): bool =>
                strtolower(trim((string) ($item['email'] ?? ''))) === $normalizedEmail
        )
    );
}

if ($method === 'GET') {
    $databaseConfig = require $configPath;
    $sqliteConfig = $databaseConfig['sqlite'] ?? null;

    if (!is_array($sqliteConfig)) {
        sendJson(
            500,
            false,
            'Konfigurasi SQLite tidak ditemukan.'
        );
    }

    $pdo = openSqliteConnection($sqliteConfig, $projectRoot);
    $scope = strtolower(trim((string) ($_GET['scope'] ?? 'admin')));

    if ($scope === 'user') {
        $email = (string) ($_GET['email'] ?? '');
        $items = fetchUserLeadHistory($pdo, $email);
        $summary = summarizeLeadItems($items);

        sendJson(
            200,
            true,
            'History lead user berhasil diambil.',
            [
                'leads' => $items,
                'total' => count($items),
                ...$summary,
                'generated_at' => gmdate('Y-m-d\TH:i:s\Z'),
            ]
        );
    }

    $items = fetchAdminLeads($pdo);
    $summary = summarizeLeadItems($items);

    sendJson(
        200,
        true,
        'Data lead berhasil diambil.',
        [
            'leads' => $items,
            'total' => count($items),
            ...$summary,
            'generated_at' => gmdate('Y-m-d\TH:i:s\Z'),
        ]
    );
}

/*
|--------------------------------------------------------------------------
| Membaca JSON
|--------------------------------------------------------------------------
*/

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$isMultipart = stripos($contentType, 'multipart/form-data') !== false;

if (
    $contentType !== ''
    && stripos($contentType, 'application/json') === false
    && !$isMultipart
) {
    sendJson(
        415,
        false,
        'Content-Type harus application/json atau multipart/form-data.'
    );
}

if ($isMultipart) {
    $payload = $_POST;
} else {
    $rawBody = file_get_contents('php://input');

    if ($rawBody === false || trim($rawBody) === '') {
        sendJson(
            400,
            false,
            'Request body tidak boleh kosong.'
        );
    }

    try {
        $payload = json_decode(
            $rawBody,
            true,
            512,
            JSON_THROW_ON_ERROR
        );
    } catch (JsonException) {
        sendJson(
            400,
            false,
            'Format JSON tidak valid.'
        );
    }
}

if (!is_array($payload)) {
    sendJson(
        400,
        false,
        'Data harus berupa object.'
    );
}

$action = strtolower(
    trim((string) ($payload['action'] ?? ''))
);

/*
|--------------------------------------------------------------------------
| Menentukan jenis form
|--------------------------------------------------------------------------
*/

$formType = strtolower(
    trim((string) ($payload['form_type'] ?? ''))
);

$allowedFormTypes = [
    'lead',
    'collaboration',
    'workshop',
];

if ($formType === '') {
    sendJson(
        422,
        false,
        'Jenis form belum dikirim.',
        [],
        [
            'form_type' =>
                'form_type wajib diisi dengan lead, collaboration, atau workshop.',
        ]
    );
}

if (!in_array($formType, $allowedFormTypes, true)) {
    sendJson(
        422,
        false,
        'Jenis form tidak dikenali.',
        [],
        [
            'form_type' =>
                'Gunakan lead, collaboration, atau workshop.',
        ]
    );
}

/*
|--------------------------------------------------------------------------
| Konfigurasi database
|--------------------------------------------------------------------------
*/

$databaseConfig = require $configPath;
$sqliteConfig = $databaseConfig['sqlite'] ?? null;

if (!is_array($sqliteConfig)) {
    sendJson(
        500,
        false,
        'Konfigurasi SQLite tidak ditemukan.'
    );
}

$databasePath = trim(
    (string) ($sqliteConfig['path'] ?? '')
);

$busyTimeout = (int) (
    $sqliteConfig['busy_timeout_ms'] ?? 15000
);

if ($databasePath === '') {
    sendJson(
        500,
        false,
        'Path database SQLite belum dikonfigurasi.'
    );
}

$isWindowsAbsolutePath = preg_match(
    '/^[A-Za-z]:[\\\\\/]/',
    $databasePath
) === 1;

$isUnixAbsolutePath = str_starts_with(
    $databasePath,
    '/'
);

if (
    !$isWindowsAbsolutePath
    && !$isUnixAbsolutePath
) {
    $databasePath =
        $projectRoot
        . DIRECTORY_SEPARATOR
        . str_replace(
            ['/', '\\'],
            DIRECTORY_SEPARATOR,
            $databasePath
        );
}

$databaseDirectory = dirname($databasePath);

if (
    !is_dir($databaseDirectory)
    && !mkdir($databaseDirectory, 0775, true)
    && !is_dir($databaseDirectory)
) {
    sendJson(
        500,
        false,
        'Folder database tidak dapat dibuat.',
        [
            'database_directory' => $databaseDirectory,
        ]
    );
}

/*
|--------------------------------------------------------------------------
| Koneksi SQLite
|--------------------------------------------------------------------------
*/

try {
    $pdo = new PDO(
        'sqlite:' . $databasePath,
        null,
        null,
        [
            PDO::ATTR_ERRMODE =>
                PDO::ERRMODE_EXCEPTION,

            PDO::ATTR_DEFAULT_FETCH_MODE =>
                PDO::FETCH_ASSOC,

            PDO::ATTR_EMULATE_PREPARES =>
                false,
        ]
    );

    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA journal_mode = WAL');
    $pdo->exec('PRAGMA synchronous = NORMAL');
    $pdo->exec(
        'PRAGMA busy_timeout = '
        . max(15000, $busyTimeout)
    );
} catch (Throwable $exception) {
    error_log(
        'Koneksi SQLite gagal: '
        . $exception->getMessage()
    );

    sendJson(
        500,
        false,
        'Koneksi database SQLite gagal.'
    );
}

$now = gmdate('Y-m-d\TH:i:s\Z');

if ($action === 'update-status') {
    $numericId = (int) ($payload['id'] ?? 0);
    $table = tableForFormType($formType);
    $status = trim((string) ($payload['status'] ?? ''));

    $errors = [];

    if ($numericId <= 0) {
        $errors['id'] = 'ID lead tidak valid.';
    }

    if ($table === null) {
        $errors['form_type'] = 'Jenis form tidak valid.';
    }

    if ($status === '') {
        $errors['status'] = 'Status wajib diisi.';
    }

    if ($errors !== []) {
        sendJson(422, false, 'Data update status belum valid.', [], $errors);
    }

    if (!tableExists($pdo, (string) $table)) {
        sendJson(500, false, 'Tabel lead belum tersedia.');
    }

    $databaseStatus = databaseStatusValue($status);

    try {
        $statement = $pdo->prepare(
            'UPDATE ' . $table . '
             SET status = :status,
                 updated_at = :updated_at,
                 version = version + 1
             WHERE id = :id
             AND deleted_at IS NULL'
        );

        $statement->execute([
            ':status' => $databaseStatus,
            ':updated_at' => $now,
            ':id' => $numericId,
        ]);

        if ($statement->rowCount() < 1) {
            sendJson(404, false, 'Lead tidak ditemukan.');
        }

        if (function_exists('afwSyncEnqueue')) {
            afwSyncEnqueue($pdo, (string) $table, $numericId, 'update', false);
        }

        sendJson(
            200,
            true,
            'Status lead berhasil diperbarui.',
            [
                'id' => $numericId,
                'form_type' => $formType,
                'status' => normalizeAdminStatus($databaseStatus),
                'updated_at' => $now,
                'updated_at_label' => formatAdminDate($now),
            ]
        );
    } catch (Throwable $exception) {
        error_log('Gagal update status lead: ' . $exception->getMessage());
        sendJson(500, false, 'Status lead gagal diperbarui.');
    }
}

/*
|--------------------------------------------------------------------------
| Form 1: Leads
|--------------------------------------------------------------------------
*/

if ($formType === 'lead') {
    $name = trim(
        (string) ($payload['nama'] ?? '')
    );

    $email = strtolower(
        trim((string) ($payload['email'] ?? ''))
    );

    $whatsapp = cleanWhatsapp(
        $payload['whatsapp'] ?? ''
    );

    $topic = trim(
        (string) ($payload['kebutuhan'] ?? '')
    );

    $message = trim(
        (string) ($payload['pesan'] ?? '')
    );

    $consent = filter_var(
        $payload['persetujuan'] ?? false,
        FILTER_VALIDATE_BOOLEAN
    );

    $errors = [];

    validateName($name, 'nama', $errors);
    validateEmail($email, 'email', $errors);
    validateWhatsapp(
        $whatsapp,
        'whatsapp',
        $errors
    );
    validateConsent(
        $consent,
        'persetujuan',
        $errors
    );

    if ($topic === '') {
        $errors['kebutuhan'] =
            'Kebutuhan wajib dipilih.';
    } elseif (textLength($topic) > 150) {
        $errors['kebutuhan'] =
            'Kebutuhan maksimal 150 karakter.';
    }

    if (textLength($message) > 2000) {
        $errors['pesan'] =
            'Pesan maksimal 2000 karakter.';
    }

    if ($errors !== []) {
        sendJson(
            422,
            false,
            'Data form leads belum valid.',
            [],
            $errors
        );
    }

    if (!tableExists($pdo, 'leads')) {
        sendJson(
            500,
            false,
            'Tabel leads belum tersedia.',
            [
                'solution' =>
                    'Jalankan migration SQLite terlebih dahulu.',
            ]
        );
    }

    try {
        $pdo->beginTransaction();

        $statement = $pdo->prepare(
            'INSERT INTO leads (
                name,
                email,
                whatsapp,
                topic,
                message,
                source,
                status,
                deleted_at,
                version,
                created_at,
                updated_at
            ) VALUES (
                :name,
                :email,
                :whatsapp,
                :topic,
                :message,
                :source,
                :status,
                NULL,
                1,
                :created_at,
                :updated_at
            )'
        );

        $statement->execute([
            ':name' => $name,
            ':email' => $email,
            ':whatsapp' => $whatsapp,
            ':topic' => $topic,
            ':message' => $message,
            ':source' => 'website',
            ':status' => 'new',
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $id = (int) $pdo->lastInsertId();
        if (function_exists('afwSyncEnqueue')) {
            afwSyncEnqueue($pdo, 'leads', $id, 'insert', false);
        }

        $pdo->commit();

        sendJson(
            201,
            true,
            'Form leads berhasil dikirim.',
            [
                'form_type' => 'lead',
                'lead' => [
                    'id' => $id,
                    'name' => $name,
                    'email' => $email,
                    'whatsapp' => $whatsapp,
                    'topic' => $topic,
                    'message' => $message,
                    'source' => 'website',
                    'status' => 'new',
                    'version' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ]
        );
    } catch (Throwable $exception) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        error_log(
            'Gagal menyimpan lead: '
            . $exception->getMessage()
        );

        sendJson(
            500,
            false,
            'Form leads gagal disimpan.'
        );
    }
}

/*
|--------------------------------------------------------------------------
| Form 2: Kolaborasi
|--------------------------------------------------------------------------
*/

if ($formType === 'collaboration') {
    $picName = trim(
        (string) ($payload['nama_pic'] ?? '')
    );

    $picEmail = strtolower(
        trim((string) ($payload['email_pic'] ?? ''))
    );

    $picWhatsapp = cleanWhatsapp(
        $payload['whatsapp_pic'] ?? ''
    );

    $institutionName = trim(
        (string) ($payload['institusi'] ?? '')
    );

    $institutionType = trim(
        (string) ($payload['jenis_institusi'] ?? '')
    );

    $goal = trim(
        (string) ($payload['tujuan'] ?? '')
    );

    $participantEstimate = trim(
        (string) ($payload['jumlah_peserta'] ?? '')
    );

    $demoSchedule = trim(
        (string) ($payload['jadwal_demo'] ?? '')
    );

    $description = trim(
        (string) ($payload['deskripsi_kolaborasi'] ?? '')
    );

    $consent = filter_var(
        $payload['persetujuan_kolaborasi'] ?? false,
        FILTER_VALIDATE_BOOLEAN
    );

    $errors = [];

    validateName(
        $picName,
        'nama_pic',
        $errors
    );

    validateEmail(
        $picEmail,
        'email_pic',
        $errors
    );

    validateWhatsapp(
        $picWhatsapp,
        'whatsapp_pic',
        $errors
    );

    validateConsent(
        $consent,
        'persetujuan_kolaborasi',
        $errors
    );

    if ($institutionName === '') {
        $errors['institusi'] =
            'Nama institusi wajib diisi.';
    } elseif (textLength($institutionName) > 200) {
        $errors['institusi'] =
            'Nama institusi maksimal 200 karakter.';
    }

    if ($institutionType === '') {
        $errors['jenis_institusi'] =
            'Jenis institusi wajib dipilih.';
    } elseif (textLength($institutionType) > 100) {
        $errors['jenis_institusi'] =
            'Jenis institusi maksimal 100 karakter.';
    }

    if ($goal === '') {
        $errors['tujuan'] =
            'Tujuan kolaborasi wajib dipilih.';
    } elseif (textLength($goal) > 200) {
        $errors['tujuan'] =
            'Tujuan kolaborasi maksimal 200 karakter.';
    }

    if (textLength($participantEstimate) > 150) {
        $errors['jumlah_peserta'] =
            'Jumlah peserta maksimal 150 karakter.';
    }

    if (textLength($demoSchedule) > 100) {
        $errors['jadwal_demo'] =
            'Jadwal demo maksimal 100 karakter.';
    }

    if (textLength($description) > 2000) {
        $errors['deskripsi_kolaborasi'] =
            'Deskripsi kebutuhan maksimal 2000 karakter.';
    }

    $proposalFile = null;

    if (
        isset($_FILES['proposal_file'])
        && is_array($_FILES['proposal_file'])
        && (int) ($_FILES['proposal_file']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE
    ) {
        try {
            $proposalFile = saveUploadedProposal($_FILES['proposal_file'], $projectRoot);
        } catch (Throwable $exception) {
            $errors['proposal_file'] = $exception->getMessage();
        }
    }

    if ($errors !== []) {
        sendJson(
            422,
            false,
            'Data formulir kolaborasi belum valid.',
            [],
            $errors
        );
    }

    if (!tableExists($pdo, 'collaborations')) {
        sendJson(
            500,
            false,
            'Tabel collaborations belum tersedia.',
            [
                'solution' =>
                    'Jalankan migration SQLite terlebih dahulu.',
            ]
        );
    }

    ensureCollaborationColumns($pdo);

    $participantEstimateValue =
        $participantEstimate !== ''
            ? $participantEstimate
            : null;

    $demoScheduleValue =
        $demoSchedule !== ''
            ? $demoSchedule
            : null;

    $descriptionValue =
        $description !== ''
            ? $description
            : null;

    try {
        $pdo->beginTransaction();

        $statement = $pdo->prepare(
            'INSERT INTO collaborations (
                pic_name,
                pic_email,
                pic_whatsapp,
                institution_name,
                institution_type,
                goal,
                participant_estimate,
                demo_schedule,
                description,
                proposal_file_name,
                proposal_file_type,
                proposal_file_size,
                proposal_file_path,
                proposal_file_url,
                source,
                status,
                deleted_at,
                version,
                created_at,
                updated_at
            ) VALUES (
                :pic_name,
                :pic_email,
                :pic_whatsapp,
                :institution_name,
                :institution_type,
                :goal,
                :participant_estimate,
                :demo_schedule,
                :description,
                :proposal_file_name,
                :proposal_file_type,
                :proposal_file_size,
                :proposal_file_path,
                :proposal_file_url,
                :source,
                :status,
                NULL,
                1,
                :created_at,
                :updated_at
            )'
        );

        $statement->execute([
            ':pic_name' => $picName,
            ':pic_email' => $picEmail,
            ':pic_whatsapp' => $picWhatsapp,
            ':institution_name' => $institutionName,
            ':institution_type' => $institutionType,
            ':goal' => $goal,
            ':participant_estimate' =>
                $participantEstimateValue,
            ':demo_schedule' => $demoScheduleValue,
            ':description' => $descriptionValue,
            ':proposal_file_name' => $proposalFile['file_name'] ?? null,
            ':proposal_file_type' => $proposalFile['file_type'] ?? null,
            ':proposal_file_size' => $proposalFile['file_size'] ?? null,
            ':proposal_file_path' => $proposalFile['file_path'] ?? null,
            ':proposal_file_url' => $proposalFile['file_url'] ?? null,
            ':source' => 'website',
            ':status' => 'new',
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $id = (int) $pdo->lastInsertId();
        $partnerId = syncCollaborationToPartner(
            $pdo,
            $institutionName,
            $institutionType,
            $picName,
            $picEmail,
            $picWhatsapp,
            $goal,
            $participantEstimateValue,
            $demoScheduleValue,
            $descriptionValue,
            $proposalFile,
            $now
        );

        if (function_exists('afwSyncEnqueue')) {
            afwSyncEnqueue($pdo, 'collaborations', $id, 'insert', false);

            if ($partnerId !== null) {
                afwSyncEnqueue($pdo, 'partners', $partnerId, 'update', false);
            }
        }

        $pdo->commit();

        sendJson(
            201,
            true,
            'Permintaan kolaborasi berhasil dikirim.',
            [
                'form_type' => 'collaboration',
                'collaboration' => [
                    'id' => $id,
                    'pic_name' => $picName,
                    'pic_email' => $picEmail,
                    'pic_whatsapp' => $picWhatsapp,
                    'institution_name' => $institutionName,
                    'institution_type' => $institutionType,
                    'goal' => $goal,
                    'participant_estimate' =>
                        $participantEstimateValue,
                    'demo_schedule' =>
                        $demoScheduleValue,
                    'description' =>
                        $descriptionValue,
                    'proposal_file' => $proposalFile,
                    'partner_id' => $partnerId,
                    'source' => 'website',
                    'status' => 'new',
                    'version' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ]
        );
    } catch (Throwable $exception) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        if (
            is_array($proposalFile)
            && isset($proposalFile['file_path'])
        ) {
            $proposalPath = $projectRoot
                . DIRECTORY_SEPARATOR
                . str_replace(
                    ['/', '\\'],
                    DIRECTORY_SEPARATOR,
                    (string) $proposalFile['file_path']
                );

            if (is_file($proposalPath)) {
                unlink($proposalPath);
            }
        }

        error_log(
            'Gagal menyimpan kolaborasi: '
            . $exception->getMessage()
        );

        sendJson(
            500,
            false,
            'Permintaan kolaborasi gagal disimpan.'
        );
    }
}

/*
|--------------------------------------------------------------------------
| Form 3: Workshop
|--------------------------------------------------------------------------
*/

if ($formType === 'workshop') {
    $participantName = trim(
        (string) ($payload['nama_workshop'] ?? '')
    );

    $participantEmail = strtolower(
        trim(
            (string) ($payload['email_workshop'] ?? '')
        )
    );

    $participantWhatsapp = cleanWhatsapp(
        $payload['whatsapp_workshop'] ?? ''
    );

    $institutionName = trim(
        (string) ($payload['asal_workshop'] ?? '')
    );

    $workshopChoice = trim(
        (string) ($payload['pilihan_workshop'] ?? '')
    );

    $workshopIdRaw = trim(
        (string) ($payload['pilihan_workshop_id'] ?? '')
    );

    $workshopId =
        ctype_digit($workshopIdRaw) && (int) $workshopIdRaw > 0
            ? (int) $workshopIdRaw
            : null;

    if (
        $workshopChoice === ''
        && $workshopId !== null
        && tableExists($pdo, 'workshops')
    ) {
        $workshopStatement = $pdo->prepare(
            'SELECT title
             FROM workshops
             WHERE id = :id
             AND deleted_at IS NULL
             LIMIT 1'
        );

        $workshopStatement->execute([
            ':id' => $workshopId,
        ]);

        $workshopChoice = trim(
            (string) ($workshopStatement->fetchColumn() ?: '')
        );
    }

    $participantEstimate = trim(
        (string) (
            $payload['jumlah_peserta_workshop'] ?? ''
        )
    );

    $memberNames = trim(
        (string) (
            $payload['nama_anggota_workshop'] ?? ''
        )
    );

    $notes = trim(
        (string) ($payload['catatan_workshop'] ?? '')
    );

    $consent = filter_var(
        $payload['persetujuan_workshop'] ?? false,
        FILTER_VALIDATE_BOOLEAN
    );

    $errors = [];

    validateName(
        $participantName,
        'nama_workshop',
        $errors
    );

    validateEmail(
        $participantEmail,
        'email_workshop',
        $errors
    );

    validateWhatsapp(
        $participantWhatsapp,
        'whatsapp_workshop',
        $errors
    );

    validateConsent(
        $consent,
        'persetujuan_workshop',
        $errors
    );

    if (textLength($institutionName) > 200) {
        $errors['asal_workshop'] =
            'Nama institusi maksimal 200 karakter.';
    }

    if ($workshopChoice === '') {
        $errors['pilihan_workshop'] =
            'Pilihan workshop wajib dipilih.';
    } elseif (textLength($workshopChoice) > 200) {
        $errors['pilihan_workshop'] =
            'Pilihan workshop maksimal 200 karakter.';
    }

    if ($workshopIdRaw !== '' && $workshopId === null) {
        $errors['pilihan_workshop'] =
            'Pilihan workshop tidak valid.';
    }

    if (textLength($participantEstimate) > 150) {
        $errors['jumlah_peserta_workshop'] =
            'Jumlah peserta maksimal 150 karakter.';
    }

    if (textLength($memberNames) > 20000) {
        $errors['nama_anggota_workshop'] =
            'Nama anggota maksimal 20000 karakter.';
    }

    if (textLength($notes) > 2000) {
        $errors['catatan_workshop'] =
            'Catatan maksimal 2000 karakter.';
    }

    if ($errors !== []) {
        sendJson(
            422,
            false,
            'Data pendaftaran workshop belum valid.',
            [],
            $errors
        );
    }

    if (!tableExists($pdo, 'workshop_registrations')) {
        sendJson(
            500,
            false,
            'Tabel workshop_registrations belum tersedia.',
            [
                'solution' =>
                    'Jalankan migration SQLite terlebih dahulu.',
            ]
        );
    }

    ensureWorkshopRegistrationColumns($pdo);

    $institutionNameValue =
        $institutionName !== ''
            ? $institutionName
            : null;

    $participantEstimateValue =
        $participantEstimate !== ''
            ? $participantEstimate
            : null;

    $memberNamesValue =
        $memberNames !== ''
            ? $memberNames
            : null;

    $notesValue =
        $notes !== ''
            ? $notes
            : null;

    try {
        ensureTransactionTablesForWorkshop($pdo);

        $participantCount = (int) (preg_replace('/\D+/', '', $participantEstimate) ?: 1);
        $participantCount = max(1, $participantCount);
        $unitPrice = workshopPrice($pdo, $workshopId);
        $totalAmount = $unitPrice * $participantCount;
        $paymentMethod = firstActivePaymentMethod($pdo);
        $invoiceNumber = generateWorkshopInvoiceNumber();
        $transactionPayload = [
            'workshopRegistration' => [
                'participantName' => $participantName,
                'participantEmail' => $participantEmail,
                'participantWhatsapp' => $participantWhatsapp,
                'institutionName' => $institutionNameValue,
                'participantEstimate' => $participantEstimateValue,
                'memberNames' => $memberNamesValue,
                'notes' => $notesValue,
            ],
        ];

        $pdo->beginTransaction();

        $statement = $pdo->prepare(
            'INSERT INTO workshop_registrations (
                participant_name,
                participant_email,
                participant_whatsapp,
                institution_name,
                workshop_id,
                workshop_choice,
                participant_estimate,
                member_names,
                notes,
                source,
                status,
                deleted_at,
                version,
                created_at,
                updated_at
            ) VALUES (
                :participant_name,
                :participant_email,
                :participant_whatsapp,
                :institution_name,
                :workshop_id,
                :workshop_choice,
                :participant_estimate,
                :member_names,
                :notes,
                :source,
                :status,
                NULL,
                1,
                :created_at,
                :updated_at
            )'
        );

        $statement->execute([
            ':participant_name' => $participantName,
            ':participant_email' => $participantEmail,
            ':participant_whatsapp' =>
                $participantWhatsapp,
            ':institution_name' =>
                $institutionNameValue,
            ':workshop_id' => $workshopId,
            ':workshop_choice' => $workshopChoice,
            ':participant_estimate' =>
                $participantEstimateValue,
            ':member_names' => $memberNamesValue,
            ':notes' => $notesValue,
            ':source' => 'website',
            ':status' => 'pending_payment',
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $id = (int) $pdo->lastInsertId();

        $transactionPayload['workshopRegistration']['id'] = $id;

        $transactionStatement = $pdo->prepare(
            'INSERT INTO transactions (
                user_id,
                user_name,
                email,
                item_type,
                item_id,
                item_title,
                amount,
                currency,
                payment_method,
                payment_channel,
                payment_code,
                recipient_name,
                qris_file_name,
                qris_file_type,
                qris_file_size,
                qris_file_path,
                qris_file_url,
                invoice_number,
                reference_number,
                status,
                paid_at,
                due_at,
                notes,
                payload_json,
                created_at,
                updated_at
            ) VALUES (
                NULL,
                :user_name,
                :email,
                "workshop",
                :item_id,
                :item_title,
                :amount,
                "IDR",
                :payment_method,
                :payment_channel,
                :payment_code,
                :recipient_name,
                :qris_file_name,
                :qris_file_type,
                :qris_file_size,
                :qris_file_path,
                :qris_file_url,
                :invoice_number,
                "",
                "pending",
                NULL,
                NULL,
                :notes,
                :payload_json,
                :created_at,
                :updated_at
            )'
        );

        $transactionStatement->execute([
            ':user_name' => $participantName,
            ':email' => $participantEmail,
            ':item_id' => $workshopId,
            ':item_title' => $workshopChoice,
            ':amount' => $totalAmount,
            ':payment_method' => (string) ($paymentMethod['name'] ?? ''),
            ':payment_channel' => (string) ($paymentMethod['channel'] ?? $paymentMethod['method_type'] ?? ''),
            ':payment_code' => (string) ($paymentMethod['payment_code'] ?? ''),
            ':recipient_name' => (string) ($paymentMethod['recipient_name'] ?? ''),
            ':qris_file_name' => $paymentMethod['qris_file_name'] ?? null,
            ':qris_file_type' => $paymentMethod['qris_file_type'] ?? null,
            ':qris_file_size' => $paymentMethod['qris_file_size'] ?? null,
            ':qris_file_path' => $paymentMethod['qris_file_path'] ?? null,
            ':qris_file_url' => $paymentMethod['qris_file_url'] ?? null,
            ':invoice_number' => $invoiceNumber,
            ':notes' => 'Pendaftaran workshop #' . $id,
            ':payload_json' => json_encode($transactionPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $transactionId = (int) $pdo->lastInsertId();

        $linkStatement = $pdo->prepare(
            'UPDATE workshop_registrations
             SET transaction_id = :transaction_id,
                 updated_at = :updated_at
             WHERE id = :id'
        );
        $linkStatement->execute([
            ':transaction_id' => $transactionId,
            ':updated_at' => $now,
            ':id' => $id,
        ]);

        $pdo->commit();

        sendJson(
            201,
            true,
            'Pendaftaran workshop berhasil dikirim. Silakan lanjutkan pembayaran di halaman Transaksi.',
            [
                'form_type' => 'workshop',
                'transaction' => [
                    'id' => $transactionId,
                    'invoice_number' => $invoiceNumber,
                    'amount' => $totalAmount,
                    'status' => 'pending',
                ],
                'registration' => [
                    'id' => $id,
                    'participant_name' =>
                        $participantName,
                    'participant_email' =>
                        $participantEmail,
                    'participant_whatsapp' =>
                        $participantWhatsapp,
                    'institution_name' =>
                        $institutionNameValue,
                    'workshop_id' => $workshopId,
                    'workshop_choice' =>
                        $workshopChoice,
                    'participant_estimate' =>
                        $participantEstimateValue,
                    'member_names' =>
                        $memberNamesValue,
                    'notes' => $notesValue,
                    'source' => 'website',
                    'status' => 'pending_payment',
                    'transaction_id' => $transactionId,
                    'version' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            ]
        );
    } catch (Throwable $exception) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        error_log(
            'Gagal menyimpan workshop: '
            . $exception->getMessage()
        );

        sendJson(
            500,
            false,
            'Pendaftaran workshop gagal disimpan.'
        );
    }
}

sendJson(
    500,
    false,
    'Form tidak dapat diproses.'
);
