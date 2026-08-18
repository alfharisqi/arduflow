<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

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
| website/API/api/formhandle.php
|
| Project root:
| website/API
|
*/

$projectRoot = dirname(__DIR__);

$autoloadPath = $projectRoot . '/vendor/autoload.php';
$configPath = $projectRoot . '/config/database.php';

if (!file_exists($autoloadPath)) {
    sendJson(
        500,
        false,
        'Composer autoload tidak ditemukan.',
        [
            'path' => $autoloadPath,
            'solution' =>
                'Jalankan composer install dari folder website/API.',
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
        'in_progress', 'processing', 'processed', 'diproses' => 'Diproses',
        'waiting', 'pending', 'menunggu' => 'Menunggu Balasan',
        'done', 'completed', 'selesai' => 'Selesai',
        'rejected', 'spam', 'ditolak' => 'Ditolak',
        default => 'Baru',
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
    $items = fetchAdminLeads($pdo);
    $statusCounts = [];
    $topicCounts = [];

    foreach ($items as $item) {
        $statusCounts[$item['status']] = ($statusCounts[$item['status']] ?? 0) + 1;
        $topicCounts[$item['topic']] = ($topicCounts[$item['topic']] ?? 0) + 1;
    }

    sendJson(
        200,
        true,
        'Data lead berhasil diambil.',
        [
            'leads' => $items,
            'total' => count($items),
            'status_counts' => $statusCounts,
            'topic_counts' => $topicCounts,
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

if (
    $contentType !== ''
    && stripos($contentType, 'application/json') === false
) {
    sendJson(
        415,
        false,
        'Content-Type harus application/json.'
    );
}

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

if (!is_array($payload)) {
    sendJson(
        400,
        false,
        'Data harus berupa object JSON.'
    );
}

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

    $participantEstimateValue =
        $participantEstimate !== ''
            ? $participantEstimate
            : null;

    $demoScheduleValue =
        $demoSchedule !== ''
            ? $demoSchedule
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
            ':source' => 'website',
            ':status' => 'new',
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $id = (int) $pdo->lastInsertId();

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
            ':status' => 'new',
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $id = (int) $pdo->lastInsertId();

        $pdo->commit();

        sendJson(
            201,
            true,
            'Pendaftaran workshop berhasil dikirim.',
            [
                'form_type' => 'workshop',
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
