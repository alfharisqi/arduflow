<?php

declare(strict_types=1);

use Arduflow\Api\Support\Env;
use PHPMailer\PHPMailer\PHPMailer;

/**
 * Arduflow Certificate API - SQLite CRUD
 * Sertifikat terhubung langsung dengan pendaftaran workshop.
 *
 * GET    /api/certificate-api.php
 * GET    /api/certificate-api.php?id=1
 * POST   /api/certificate-api.php
 * PUT    /api/certificate-api.php?id=1
 * DELETE /api/certificate-api.php?id=1
 * POST   /api/certificate-api.php?action=upload-certificate&id=1
 * POST   /api/certificate-api.php?action=send-certificate&id=1
 */

$autoload = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';

if (is_file($autoload)) {
    require_once $autoload;
    if (class_exists(Env::class)) {
        Env::load(dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env');
    }
}

date_default_timezone_set('Asia/Jakarta');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function respond(int $statusCode, array $body): never
{
    http_response_code($statusCode);
    echo json_encode(
        $body,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT
    );
    exit;
}

function readJsonBody(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'application/json') === false) {
        respond(415, [
            'success' => false,
            'message' => 'Content-Type harus application/json.',
        ]);
    }

    $rawBody = file_get_contents('php://input');

    if ($rawBody === false || trim($rawBody) === '') {
        respond(400, [
            'success' => false,
            'message' => 'Request body JSON kosong.',
        ]);
    }

    $data = json_decode($rawBody, true);

    if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) {
        respond(400, [
            'success' => false,
            'message' => 'JSON tidak valid.',
            'error' => json_last_error_msg(),
        ]);
    }

    return $data;
}

function getRequestId(): int
{
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if ($id <= 0) {
        respond(400, [
            'success' => false,
            'message' => 'Parameter id sertifikat wajib dan harus berupa angka lebih dari 0.',
        ]);
    }

    return $id;
}

function tableExists(PDO $pdo, string $table): bool
{
    $statement = $pdo->prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = :table LIMIT 1"
    );
    $statement->execute([':table' => $table]);

    return (bool) $statement->fetchColumn();
}

function getColumnNames(PDO $pdo, string $table): array
{
    if (!tableExists($pdo, $table)) {
        return [];
    }

    $columns = [];
    $statement = $pdo->query('PRAGMA table_info(' . $table . ')');

    foreach ($statement->fetchAll() as $column) {
        $columns[] = (string) $column['name'];
    }

    return $columns;
}

function firstFilled(array $data, array $keys, string $fallback = ''): string
{
    foreach ($keys as $key) {
        if (
            array_key_exists($key, $data) &&
            $data[$key] !== null &&
            trim((string) $data[$key]) !== ''
        ) {
            return trim((string) $data[$key]);
        }
    }

    return $fallback;
}

function firstValue(array $data, array $keys, mixed $fallback = null): mixed
{
    foreach ($keys as $key) {
        if (array_key_exists($key, $data) && $data[$key] !== null) {
            return $data[$key];
        }
    }

    return $fallback;
}

function positiveIntOrNull(mixed $value): ?int
{
    if ($value === null || $value === '') {
        return null;
    }

    $number = (int) $value;

    return $number > 0 ? $number : null;
}

function validDateOrNull(mixed $value): ?string
{
    if ($value === null || trim((string) $value) === '') {
        return null;
    }

    $date = trim((string) $value);
    $parsed = DateTime::createFromFormat('Y-m-d', $date);

    if ($parsed === false || $parsed->format('Y-m-d') !== $date) {
        respond(422, [
            'success' => false,
            'message' => 'Format tanggal harus YYYY-MM-DD.',
        ]);
    }

    return $date;
}

function generateCertificateNumber(): string
{
    try {
        $suffix = strtoupper(bin2hex(random_bytes(3)));
    } catch (Throwable $exception) {
        $suffix = strtoupper(substr(str_replace('.', '', uniqid('', true)), -6));
    }

    return 'AFW-CERT-' . date('Y') . '-' . $suffix;
}

function decodeJsonArray(mixed $value): array
{
    if (is_array($value)) {
        return $value;
    }

    if (!is_string($value) || trim($value) === '') {
        return [];
    }

    $decoded = json_decode($value, true);

    return is_array($decoded) ? $decoded : [];
}

function decodeCertificateRow(array $row): array
{
    $payload = decodeJsonArray($row['payload_json'] ?? '');
    $file = decodeJsonArray($row['file_json'] ?? '');

    if ($file === []) {
        $file = null;
    }

    return [
        'id' => (int) $row['id'],
        'registrationId' => isset($row['registration_id']) && $row['registration_id'] !== null
            ? (int) $row['registration_id']
            : null,
        'memberKey' => $row['member_key'] ?? ($payload['memberKey'] ?? null),
        'memberName' => $payload['memberName'] ?? $payload['member_name'] ?? null,
        'userId' => isset($row['user_id']) && $row['user_id'] !== null
            ? (int) $row['user_id']
            : null,
        'userName' => $row['user_name'],
        'email' => $row['email'],
        'workshopId' => $row['workshop_id'] !== null
            ? (int) $row['workshop_id']
            : null,
        'workshopTitle' => $row['workshop_title'],
        'certificateTitle' => $row['certificate_title'],
        'type' => $row['certificate_type'],
        'completedAt' => $row['completed_at'],
        'issuedAt' => $row['issued_at'],
        'certificateNumber' => $row['certificate_number'],
        'status' => $row['status'],
        'downloads' => (int) $row['downloads'],
        'file' => $file,
        'payload' => $payload,
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}

function decodeWorkshopOption(array $row): array
{
    $payload = decodeJsonArray($row['payload_json'] ?? '');

    return [
        'id' => (int) $row['id'],
        'title' => $row['title'] ?: ($payload['title'] ?? 'Workshop tanpa judul'),
        'category' => $row['category'] ?: ($payload['category'] ?? 'Workshop'),
        'status' => $row['status'] ?: ($payload['publication']['status'] ?? null),
        'date' => $payload['schedule']['date'] ?? null,
    ];
}

function getWorkshopTitleById(PDO $pdo, ?int $workshopId): ?string
{
    if (!$workshopId || !tableExists($pdo, 'workshops')) {
        return null;
    }

    $statement = $pdo->prepare(
        'SELECT title, payload_json FROM workshops WHERE id = :id LIMIT 1'
    );
    $statement->execute([':id' => $workshopId]);
    $row = $statement->fetch();

    if (!$row) {
        return null;
    }

    $payload = decodeJsonArray($row['payload_json'] ?? '');

    return (string) ($row['title'] ?: ($payload['title'] ?? ''));
}

function getWorkshopIdByTitle(PDO $pdo, string $title): ?int
{
    $title = trim($title);

    if ($title === '' || !tableExists($pdo, 'workshops')) {
        return null;
    }

    $statement = $pdo->prepare(
        'SELECT id, title, payload_json FROM workshops ORDER BY id DESC'
    );
    $statement->execute();

    foreach ($statement->fetchAll() as $row) {
        $payload = decodeJsonArray($row['payload_json'] ?? '');
        $workshopTitle = trim((string) ($row['title'] ?: ($payload['title'] ?? '')));

        if ($workshopTitle !== '' && strcasecmp($workshopTitle, $title) === 0) {
            return (int) $row['id'];
        }
    }

    return null;
}

function resolveUserIdByEmail(PDO $pdo, string $email): ?int
{
    $email = trim($email);

    if ($email === '' || !tableExists($pdo, 'users')) {
        return null;
    }

    $columns = getColumnNames($pdo, 'users');

    if (!in_array('id', $columns, true) || !in_array('email', $columns, true)) {
        return null;
    }

    $statement = $pdo->prepare(
        'SELECT id FROM users WHERE LOWER(email) = LOWER(:email) LIMIT 1'
    );
    $statement->execute([':email' => $email]);
    $id = $statement->fetchColumn();

    return $id !== false ? positiveIntOrNull($id) : null;
}

function extractRegistrationMeta(array $row): array
{
    $meta = [];

    foreach (['meta_json', 'meta', 'metadata_json', 'payload_json', 'payload'] as $key) {
        if (!array_key_exists($key, $row)) {
            continue;
        }

        $decoded = decodeJsonArray($row[$key]);

        if (isset($decoded['meta']) && is_array($decoded['meta'])) {
            $decoded = array_merge($decoded, $decoded['meta']);
        }

        $meta = array_merge($meta, $decoded);
    }

    $directMappings = [
        'workshop_id' => ['workshop_id', 'workshopId'],
        'workshop_choice' => [
            'workshop_choice',
            'workshopChoice',
            'pilihan_workshop',
            'pilihanWorkshop',
        ],
        'participant_estimate' => [
            'participant_estimate',
            'participantEstimate',
            'jumlah_peserta_workshop',
            'jumlahPesertaWorkshop',
        ],
        'member_names' => [
            'member_names',
            'memberNames',
            'nama_anggota',
            'namaAnggota',
        ],
    ];

    foreach ($directMappings as $target => $sourceKeys) {
        if (isset($meta[$target]) && $meta[$target] !== '') {
            continue;
        }

        $value = firstValue($row, $sourceKeys, null);

        if ($value !== null && $value !== '') {
            $meta[$target] = $value;
        }
    }

    return $meta;
}

function normalizeWorkshopParticipantRow(PDO $registrationPdo, PDO $workshopPdo, array $row): ?array
{
    $registrationId = positiveIntOrNull(
        firstValue($row, ['id', 'numeric_id', 'registration_id'], null)
    );

    if (!$registrationId) {
        return null;
    }

    $formType = strtolower(trim((string) firstValue(
        $row,
        ['form_type', 'formType'],
        ''
    )));

    if ($formType !== '' && $formType !== 'workshop') {
        return null;
    }

    $meta = extractRegistrationMeta($row);

    $workshopId = positiveIntOrNull(
        firstValue(
            $meta,
            ['workshop_id', 'workshopId'],
            firstValue($row, ['workshop_id', 'workshopId'], null)
        )
    );

    $workshopChoice = firstFilled(
        $meta,
        ['workshop_choice', 'workshopChoice', 'pilihan_workshop'],
        firstFilled(
            $row,
            ['workshop_choice', 'workshopChoice', 'pilihan_workshop'],
            ''
        )
    );

    if ($workshopChoice === '' && $formType === 'workshop') {
        $workshopChoice = firstFilled($row, ['message'], '');
    }

    if (!$workshopId && $workshopChoice !== '') {
        $workshopId = getWorkshopIdByTitle($workshopPdo, $workshopChoice);
    }

    // Jika tidak ada indikator workshop sama sekali, jangan masukkan sebagai peserta workshop.
    if ($formType === '' && !$workshopId && $workshopChoice === '') {
        return null;
    }

    $participantName = firstFilled(
        $row,
        ['name', 'nama', 'participant_name', 'participantName', 'nama_workshop'],
        ''
    );
    $participantEmail = firstFilled(
        $row,
        ['email', 'participant_email', 'participantEmail', 'email_workshop'],
        ''
    );
    $status = firstFilled($row, ['status'], 'Baru');
    $createdAt = firstFilled($row, ['created_at', 'createdAt'], '');
    $createdAtLabel = firstFilled(
        $row,
        ['created_at_label', 'createdAtLabel'],
        $createdAt
    );
    $participantEstimate = firstFilled(
        $meta,
        ['participant_estimate', 'participantEstimate'],
        ''
    );
    $memberNames = firstFilled(
        $meta,
        ['member_names', 'memberNames'],
        ''
    );

    $userId = positiveIntOrNull(
        firstValue($row, ['user_id', 'userId'], null)
    );

    if (!$userId && $participantEmail !== '') {
        $userId = resolveUserIdByEmail($registrationPdo, $participantEmail);
    }

    return [
        'id' => $registrationId,
        'registrationId' => $registrationId,
        'userId' => $userId,
        'workshopId' => $workshopId,
        'workshopChoice' => $workshopChoice,
        'participantName' => $participantName,
        'participantEmail' => $participantEmail,
        'participantEstimate' => $participantEstimate,
        'memberNames' => $memberNames,
        'status' => $status,
        'createdAt' => $createdAt,
        'createdAtLabel' => $createdAtLabel,
        'formType' => 'workshop',
    ];
}

function getWorkshopParticipants(PDO $registrationPdo, PDO $workshopPdo): array
{
    $sourceTable = null;

    foreach (['workshop_registrations', 'workshop_participants', 'leads'] as $table) {
        if (tableExists($registrationPdo, $table)) {
            $sourceTable = $table;
            break;
        }
    }

    if ($sourceTable === null) {
        return [];
    }

    $rows = $registrationPdo
        ->query('SELECT * FROM ' . $sourceTable . ' ORDER BY id DESC')
        ->fetchAll();

    $participants = [];

    foreach ($rows as $row) {
        $participant = normalizeWorkshopParticipantRow($registrationPdo, $workshopPdo, $row);

        if ($participant !== null) {
            $participants[] = $participant;
        }
    }

    return $participants;
}

function getWorkshopParticipantById(
    PDO $registrationPdo,
    PDO $workshopPdo,
    int $registrationId
): ?array {
    if ($registrationId <= 0) {
        return null;
    }

    foreach (getWorkshopParticipants($registrationPdo, $workshopPdo) as $participant) {
        if ((int) $participant['registrationId'] === $registrationId) {
            return $participant;
        }
    }

    return null;
}

function validateCertificatePayload(
    array $data,
    PDO $pdo,
    PDO $registrationPdo,
    bool $requireRegistration = true
): array {
    $errors = [];

    $registrationId = positiveIntOrNull(
        firstValue($data, ['registrationId', 'registration_id'], null)
    );
    $providedWorkshopId = positiveIntOrNull(
        firstValue($data, ['workshopId', 'workshop_id'], null)
    );

    $participant = null;

    if ($registrationId) {
        $participant = getWorkshopParticipantById(
            $registrationPdo,
            $pdo,
            $registrationId
        );

        if ($participant === null) {
            $errors['registrationId'] = 'Data pendaftaran workshop tidak ditemukan.';
        }
    } elseif ($requireRegistration) {
        $errors['registrationId'] = 'Peserta wajib dipilih dari data pendaftaran workshop.';
    }

    $userName = firstFilled($data, ['userName', 'user_name']);
    $memberName = firstFilled($data, ['memberName', 'member_name'], '');
    $memberKey = firstFilled($data, ['memberKey', 'member_key'], '');
    $userId = positiveIntOrNull(firstValue($data, ['userId', 'user_id'], null));
    $email = firstFilled($data, ['email']);
    $workshopId = $providedWorkshopId;
    $workshopTitle = firstFilled(
        $data,
        ['workshopTitle', 'workshop_title', 'programTitle'],
        ''
    );

    if ($participant !== null) {
        $participantWorkshopId = positiveIntOrNull($participant['workshopId'] ?? null);

        if (
            $providedWorkshopId &&
            $participantWorkshopId &&
            $providedWorkshopId !== $participantWorkshopId
        ) {
            $errors['workshopId'] = 'Peserta tersebut tidak terdaftar pada workshop yang dipilih.';
        }

        $userName = trim((string) ($participant['participantName'] ?? ''));
        $email = trim((string) ($participant['participantEmail'] ?? ''));
        $userId = positiveIntOrNull($participant['userId'] ?? null);
        $workshopId = $participantWorkshopId ?: $providedWorkshopId;

        if ($workshopTitle === '') {
            $workshopTitle = trim((string) ($participant['workshopChoice'] ?? ''));
        }
    }

    if ($memberName !== '') {
        $userName = $memberName;
    }

    $databaseWorkshopTitle = getWorkshopTitleById($pdo, $workshopId);

    if ($databaseWorkshopTitle !== null && trim($databaseWorkshopTitle) !== '') {
        $workshopTitle = trim($databaseWorkshopTitle);
    }

    $certificateTitle = firstFilled(
        $data,
        ['certificateTitle', 'certificate_title'],
        ''
    );

    if ($certificateTitle === '' && $workshopTitle !== '') {
        $certificateTitle = 'Sertifikat ' . $workshopTitle;
    }

    $type = firstFilled($data, ['type', 'certificate_type'], 'Workshop');
    $status = firstFilled($data, ['status'], 'Menunggu');
    $certificateNumber = firstFilled(
        $data,
        ['certificateNumber', 'certificate_number'],
        generateCertificateNumber()
    );
    $completedAt = validDateOrNull(
        $data['completedAt'] ?? $data['completed_at'] ?? null
    );
    $issuedAt = validDateOrNull(
        $data['issuedAt'] ?? $data['issued_at'] ?? null
    );

    if ($userName === '') {
        $errors['userName'] = 'Nama peserta pada data pendaftaran kosong.';
    }

    if ($email === '') {
        $errors['email'] = 'Email peserta pada data pendaftaran kosong.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Email peserta pada data pendaftaran tidak valid.';
    }

    if (!$workshopId) {
        $errors['workshopId'] = 'Workshop peserta tidak ditemukan.';
    }

    if ($workshopTitle === '') {
        $errors['workshopTitle'] = 'Workshop / program wajib tersedia.';
    }

    if ($certificateTitle === '') {
        $errors['certificateTitle'] = 'Nama sertifikat wajib diisi.';
    }

    $allowedTypes = ['Workshop', 'Program', 'Course'];
    if (!in_array($type, $allowedTypes, true)) {
        $errors['type'] = 'Jenis sertifikat tidak valid.';
    }

    $allowedStatuses = [
        'Menunggu',
        'Tersedia',
        'Tidak Lulus',
        'Error',
        'Expired',
    ];
    if (!in_array($status, $allowedStatuses, true)) {
        $errors['status'] = 'Status sertifikat tidak valid.';
    }

    if ($errors !== []) {
        respond(422, [
            'success' => false,
            'message' => 'Validasi sertifikat gagal.',
            'errors' => $errors,
        ]);
    }

    // Simpan payload yang sudah dipaksa sesuai data pendaftaran,
    // bukan nama/email yang mungkin dimanipulasi dari frontend.
    $normalizedPayload = $data;
    $normalizedPayload['registrationId'] = $registrationId;
    $normalizedPayload['memberKey'] = $memberKey;
    $normalizedPayload['memberName'] = $memberName !== '' ? $memberName : $userName;
    $normalizedPayload['userId'] = $userId;
    $normalizedPayload['userName'] = $userName;
    $normalizedPayload['email'] = $email;
    $normalizedPayload['workshopId'] = $workshopId;
    $normalizedPayload['workshopTitle'] = $workshopTitle;
    $normalizedPayload['certificateTitle'] = $certificateTitle;
    $normalizedPayload['type'] = $type;
    $normalizedPayload['completedAt'] = $completedAt;
    $normalizedPayload['issuedAt'] = $issuedAt;
    $normalizedPayload['certificateNumber'] = $certificateNumber;
    $normalizedPayload['status'] = $status;

    return [
        'registration_id' => $registrationId,
        'member_key' => $memberKey !== '' ? $memberKey : null,
        'user_name' => $userName,
        'user_id' => $userId,
        'email' => $email,
        'workshop_id' => $workshopId,
        'workshop_title' => $workshopTitle,
        'certificate_title' => $certificateTitle,
        'certificate_type' => $type,
        'completed_at' => $completedAt,
        'issued_at' => $issuedAt,
        'certificate_number' => $certificateNumber,
        'status' => $status,
        'payload_json' => json_encode(
            $normalizedPayload,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        ),
    ];
}

function findCertificateByRegistration(
    PDO $pdo,
    ?int $registrationId,
    ?int $workshopId,
    ?string $memberKey = null,
    ?int $excludeCertificateId = null
): ?array {
    if (!$registrationId) {
        return null;
    }

    $sql = 'SELECT * FROM certificates WHERE registration_id = :registration_id';
    $params = [':registration_id' => $registrationId];

    if ($workshopId) {
        $sql .= ' AND workshop_id = :workshop_id';
        $params[':workshop_id'] = $workshopId;
    }

    $cleanMemberKey = trim((string) $memberKey);

    if ($cleanMemberKey !== '') {
        $sql .= ' AND member_key = :member_key';
        $params[':member_key'] = $cleanMemberKey;
    } else {
        $sql .= ' AND (member_key IS NULL OR member_key = "")';
    }

    if ($excludeCertificateId) {
        $sql .= ' AND id <> :exclude_id';
        $params[':exclude_id'] = $excludeCertificateId;
    }

    $sql .= ' ORDER BY id DESC LIMIT 1';

    $statement = $pdo->prepare($sql);
    $statement->execute($params);
    $row = $statement->fetch();

    return $row ?: null;
}

function envString(string $key, string $fallback = ''): string
{
    if (class_exists(Env::class)) {
        return (string) Env::get($key, $fallback);
    }

    $value = getenv($key);

    return $value === false ? $fallback : (string) $value;
}

function envBool(string $key, bool $fallback = false): bool
{
    if (class_exists(Env::class)) {
        return Env::bool($key, $fallback);
    }

    $value = getenv($key);

    return $value === false
        ? $fallback
        : (filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? $fallback);
}

function envInt(string $key, int $fallback): int
{
    if (class_exists(Env::class)) {
        return Env::int($key, $fallback);
    }

    $value = getenv($key);

    return $value !== false && is_numeric($value) ? (int) $value : $fallback;
}

function parseMailFrom(string $from): array
{
    if (preg_match('/^\s*(.*?)\s*<([^>]+)>\s*$/', $from, $match) === 1) {
        return [trim($match[1]) ?: 'Arduflow', trim($match[2])];
    }

    return ['Arduflow', trim($from)];
}

function certificateFilePath(array $file): string
{
    $apiRoot = dirname(__DIR__);
    $candidate = '';

    if (isset($file['relativeUrl']) && is_string($file['relativeUrl'])) {
        $candidate = $file['relativeUrl'];
    } elseif (isset($file['relative_url']) && is_string($file['relative_url'])) {
        $candidate = $file['relative_url'];
    } elseif (isset($file['name']) && is_string($file['name'])) {
        $candidate = '/uploads/certificates/' . basename($file['name']);
    } elseif (isset($file['url']) && is_string($file['url'])) {
        $path = parse_url($file['url'], PHP_URL_PATH);
        $candidate = is_string($path) ? $path : '';
    }

    if ($candidate === '') {
        return '';
    }

    $candidate = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $candidate);
    $candidate = ltrim($candidate, DIRECTORY_SEPARATOR);
    $realRoot = realpath($apiRoot);
    $paths = [
        $apiRoot . DIRECTORY_SEPARATOR . $candidate,
        $apiRoot . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . $candidate,
    ];

    foreach (array_unique($paths) as $path) {
        $realPath = realpath($path);

        if (
            $realPath !== false &&
            $realRoot !== false &&
            str_starts_with($realPath, $realRoot . DIRECTORY_SEPARATOR) &&
            is_file($realPath)
        ) {
            return $realPath;
        }
    }

    return '';
}

function certificateEmailHtml(array $certificate, string $fileUrl): string
{
    $name = htmlspecialchars((string) $certificate['userName'], ENT_QUOTES, 'UTF-8');
    $title = htmlspecialchars((string) $certificate['certificateTitle'], ENT_QUOTES, 'UTF-8');
    $workshop = htmlspecialchars((string) $certificate['workshopTitle'], ENT_QUOTES, 'UTF-8');
    $number = htmlspecialchars((string) $certificate['certificateNumber'], ENT_QUOTES, 'UTF-8');
    $safeUrl = htmlspecialchars($fileUrl, ENT_QUOTES, 'UTF-8');

    return '<div style="font-family:Arial,sans-serif;background:#f6f8fb;color:#172b45;padding:28px">' .
        '<div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:28px">' .
        '<h2 style="margin:0 0 16px;color:#0b1b30">ArduFlow</h2>' .
        '<p>Halo ' . $name . ',</p>' .
        '<p>Sertifikat Anda untuk <b>' . $workshop . '</b> sudah tersedia.</p>' .
        '<p><b>' . $title . '</b><br>No. Sertifikat: ' . $number . '</p>' .
        '<p style="margin:24px 0"><a href="' . $safeUrl . '" style="background:#ff6a00;color:#ffffff;padding:12px 18px;text-decoration:none;border-radius:6px;font-weight:bold">Buka Sertifikat</a></p>' .
        '<p style="color:#64748b;font-size:13px">File sertifikat juga terlampir pada email ini.</p>' .
        '</div></div>';
}

function sendCertificateEmail(array $certificate): void
{
    if (!class_exists(PHPMailer::class)) {
        respond(500, [
            'success' => false,
            'message' => 'PHPMailer belum tersedia. Jalankan composer install pada folder website/BE.',
        ]);
    }

    if (!envBool('MAIL_ENABLED', true)) {
        respond(503, [
            'success' => false,
            'message' => 'SMTP sedang nonaktif. Aktifkan MAIL_ENABLED pada konfigurasi.',
        ]);
    }

    $email = trim((string) ($certificate['email'] ?? ''));

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(422, [
            'success' => false,
            'message' => 'Email member tidak valid.',
        ]);
    }

    $file = is_array($certificate['file'] ?? null) ? $certificate['file'] : [];
    $filePath = certificateFilePath($file);
    $fileUrl = getCertificateFileUrlForEmail($file);

    if ($filePath === '' || !is_file($filePath)) {
        respond(422, [
            'success' => false,
            'message' => 'File sertifikat belum tersedia. Generate atau upload sertifikat terlebih dahulu.',
        ]);
    }

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = envString('MAIL_HOST', '127.0.0.1');
    $mail->Port = envInt('MAIL_PORT', 1025);
    $username = envString('MAIL_USERNAME', '');

    if ($username !== '') {
        $mail->SMTPAuth = true;
        $mail->Username = $username;
        $mail->Password = envString('MAIL_PASSWORD', '');
    }

    if (envBool('MAIL_SECURE', false)) {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    }

    $mail->Timeout = 10;
    $mail->CharSet = 'UTF-8';

    [$fromName, $fromAddress] = parseMailFrom(envString('MAIL_FROM', 'Arduflow <no-reply@arduflow.local>'));
    $mail->setFrom($fromAddress, $fromName);
    $mail->addAddress($email, (string) ($certificate['userName'] ?? 'Member'));
    $mail->isHTML(true);
    $mail->Subject = 'Sertifikat ArduFlow - ' . (string) ($certificate['workshopTitle'] ?? 'Workshop');
    $mail->Body = certificateEmailHtml($certificate, $fileUrl);
    $mail->AltBody = sprintf(
        "Halo %s,\n\nSertifikat Anda untuk %s sudah tersedia.\nNo. Sertifikat: %s\n\nFile sertifikat terlampir.",
        (string) ($certificate['userName'] ?? 'Member'),
        (string) ($certificate['workshopTitle'] ?? 'Workshop'),
        (string) ($certificate['certificateNumber'] ?? '-')
    );
    $mail->addAttachment(
        $filePath,
        basename((string) ($file['originalName'] ?? $file['name'] ?? 'sertifikat.pdf'))
    );
    $mail->send();
}

function getCertificateFileUrlForEmail(array $file): string
{
    if (isset($file['url']) && is_string($file['url']) && trim($file['url']) !== '') {
        return trim($file['url']);
    }

    if (isset($file['relativeUrl']) && is_string($file['relativeUrl'])) {
        $scheme = (
            !empty($_SERVER['HTTPS']) &&
            strtolower((string) $_SERVER['HTTPS']) !== 'off'
        ) ? 'https' : 'http';
        $host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');

        return $scheme . '://' . $host . $file['relativeUrl'];
    }

    return '';
}

function handleCertificateEmail(PDO $pdo): void
{
    $id = getRequestId();

    $statement = $pdo->prepare(
        'SELECT * FROM certificates WHERE id = :id LIMIT 1'
    );
    $statement->execute([':id' => $id]);
    $row = $statement->fetch();

    if (!$row) {
        respond(404, [
            'success' => false,
            'message' => 'Sertifikat tidak ditemukan.',
        ]);
    }

    $certificate = decodeCertificateRow($row);

    try {
        sendCertificateEmail($certificate);

        $payload = is_array($certificate['payload'] ?? null) ? $certificate['payload'] : [];
        $payload['emailSentAt'] = date('Y-m-d H:i:s');

        $update = $pdo->prepare(
            'UPDATE certificates
             SET payload_json = :payload_json,
                 updated_at = :updated_at
             WHERE id = :id'
        );
        $update->execute([
            ':payload_json' => json_encode(
                $payload,
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            ),
            ':updated_at' => date('Y-m-d H:i:s'),
            ':id' => $id,
        ]);

        respond(200, [
            'success' => true,
            'message' => 'Sertifikat berhasil dikirim melalui email.',
            'data' => [
                'certificateId' => $id,
                'email' => $certificate['email'],
                'sentAt' => $payload['emailSentAt'],
            ],
        ]);
    } catch (Throwable $exception) {
        respond(503, [
            'success' => false,
            'message' => 'Sertifikat gagal dikirim melalui email. Pastikan SMTP berjalan dan konfigurasi benar.',
            'debug' => [
                'error' => $exception->getMessage(),
            ],
        ]);
    }
}

function handleCertificateUpload(PDO $pdo): void
{
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    $file = $_FILES['certificate'] ?? $_FILES['certificateFile'] ?? null;

    if (!is_array($file)) {
        respond(400, [
            'success' => false,
            'message' => 'File sertifikat wajib dikirim dengan field certificate.',
        ]);
    }

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        respond(400, [
            'success' => false,
            'message' => 'Upload sertifikat gagal.',
            'uploadError' => $file['error'] ?? null,
        ]);
    }

    $tmpName = (string) $file['tmp_name'];
    $originalName = basename((string) ($file['name'] ?? 'sertifikat'));
    $fileSize = (int) ($file['size'] ?? 0);

    if ($fileSize <= 0 || $fileSize > 10 * 1024 * 1024) {
        respond(413, [
            'success' => false,
            'message' => 'Ukuran file sertifikat maksimal 10 MB.',
        ]);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = (string) $finfo->file($tmpName);
    $allowedTypes = [
        'application/pdf' => 'pdf',
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    if (!isset($allowedTypes[$mimeType])) {
        respond(422, [
            'success' => false,
            'message' => 'Format sertifikat harus PDF, JPG, PNG, atau WEBP.',
            'detectedType' => $mimeType,
        ]);
    }

    $uploadDirectory = dirname(__DIR__)
        . DIRECTORY_SEPARATOR . 'storage'
        . DIRECTORY_SEPARATOR . 'uploads'
        . DIRECTORY_SEPARATOR . 'certificates';

    if (!is_dir($uploadDirectory)) {
        if (!mkdir($uploadDirectory, 0775, true) && !is_dir($uploadDirectory)) {
            respond(500, [
                'success' => false,
                'message' => 'Folder uploads/certificates gagal dibuat.',
                'directory' => $uploadDirectory,
            ]);
        }
    }

    try {
        $randomPart = bin2hex(random_bytes(6));
    } catch (Throwable $exception) {
        $randomPart = str_replace('.', '', uniqid('', true));
    }

    $storedName = sprintf(
        'certificate-%s-%s.%s',
        date('YmdHis'),
        $randomPart,
        $allowedTypes[$mimeType]
    );
    $destination = $uploadDirectory . DIRECTORY_SEPARATOR . $storedName;

    if (!move_uploaded_file($tmpName, $destination)) {
        respond(500, [
            'success' => false,
            'message' => 'File sertifikat gagal disimpan ke folder uploads/certificates.',
            'destination' => $destination,
        ]);
    }

    $scheme = (
        !empty($_SERVER['HTTPS']) &&
        strtolower((string) $_SERVER['HTTPS']) !== 'off'
    ) ? 'https' : 'http';
    $host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');
    $scriptName = (string) ($_SERVER['SCRIPT_NAME'] ?? '');
    $basePath = preg_replace('#/api/[^/]+$#', '', $scriptName) ?: '';
    $relativeUrl = $basePath
        . '/uploads/certificates/'
        . rawurlencode($storedName);
    $fileUrl = sprintf('%s://%s%s', $scheme, $host, $relativeUrl);

    $metadata = [
        'name' => $storedName,
        'originalName' => $originalName,
        'type' => $mimeType,
        'size' => $fileSize,
        'sizeKB' => round($fileSize / 1024, 2),
        'url' => $fileUrl,
        'relativeUrl' => $relativeUrl,
        'uploadedAt' => date('Y-m-d H:i:s'),
    ];

    if ($id > 0) {
        $statement = $pdo->prepare(
            'UPDATE certificates
             SET file_json = :file_json,
                 status = CASE
                     WHEN status IN ("Menunggu", "Error") THEN "Tersedia"
                     ELSE status
                 END,
                 issued_at = COALESCE(issued_at, :issued_at),
                 updated_at = :updated_at
             WHERE id = :id'
        );
        $statement->execute([
            ':file_json' => json_encode(
                $metadata,
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            ),
            ':issued_at' => date('Y-m-d'),
            ':updated_at' => date('Y-m-d H:i:s'),
            ':id' => $id,
        ]);
    }

    respond(201, [
        'success' => true,
        'message' => 'File sertifikat berhasil diupload.',
        'data' => [
            'file' => $metadata,
            'certificateId' => $id > 0 ? $id : null,
        ],
    ]);
}

function sqliteHasTable(string $databaseFile, string $table): bool
{
    if (!is_file($databaseFile)) {
        return false;
    }

    try {
        $checkPdo = new PDO('sqlite:' . $databaseFile, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $statement = $checkPdo->prepare(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = :table LIMIT 1"
        );
        $statement->execute([':table' => $table]);

        return (bool) $statement->fetchColumn();
    } catch (Throwable $exception) {
        return false;
    }
}

function resolveRegistrationDatabaseFile(string $certificateDatabaseFile): string
{
    $apiRoot = dirname(__DIR__);
    $candidates = [
        $apiRoot . DIRECTORY_SEPARATOR . 'storage'
            . DIRECTORY_SEPARATOR . 'database'
            . DIRECTORY_SEPARATOR . 'arduflow.sqlite',
        $apiRoot . DIRECTORY_SEPARATOR . 'storage'
            . DIRECTORY_SEPARATOR . 'arduflow.sqlite',
        $certificateDatabaseFile,
    ];

    foreach (array_unique($candidates) as $candidate) {
        if (
            sqliteHasTable($candidate, 'workshop_registrations') ||
            sqliteHasTable($candidate, 'workshop_participants') ||
            sqliteHasTable($candidate, 'leads')
        ) {
            return $candidate;
        }
    }

    return $certificateDatabaseFile;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? trim((string) $_GET['action']) : '';
$databaseFile = dirname(__DIR__)
    . DIRECTORY_SEPARATOR . 'database'
    . DIRECTORY_SEPARATOR . 'arduflow.sqlite';

try {
    $pdo = new PDO('sqlite:' . $databaseFile, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA busy_timeout = 15000');

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            registration_id INTEGER NULL,
            member_key TEXT NULL,
            user_id INTEGER NULL,
            user_name TEXT NOT NULL,
            email TEXT NOT NULL,
            workshop_id INTEGER NULL,
            workshop_title TEXT NOT NULL,
            certificate_title TEXT NOT NULL,
            certificate_type TEXT NOT NULL,
            completed_at TEXT NULL,
            issued_at TEXT NULL,
            certificate_number TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL,
            downloads INTEGER NOT NULL DEFAULT 0,
            file_json TEXT NULL,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )'
    );

    $certificateColumns = getColumnNames($pdo, 'certificates');

    if (!in_array('registration_id', $certificateColumns, true)) {
        $pdo->exec(
            'ALTER TABLE certificates ADD COLUMN registration_id INTEGER NULL'
        );
    }

    if (!in_array('member_key', $certificateColumns, true)) {
        $pdo->exec('ALTER TABLE certificates ADD COLUMN member_key TEXT NULL');
    }

    if (!in_array('user_id', $certificateColumns, true)) {
        $pdo->exec('ALTER TABLE certificates ADD COLUMN user_id INTEGER NULL');
    }

    $pdo->exec(
        'CREATE INDEX IF NOT EXISTS idx_certificates_registration ON certificates(registration_id)'
    );
    $pdo->exec(
        'CREATE INDEX IF NOT EXISTS idx_certificates_registration_member ON certificates(registration_id, workshop_id, member_key)'
    );
    $pdo->exec(
        'CREATE INDEX IF NOT EXISTS idx_certificates_email ON certificates(email)'
    );
    $pdo->exec(
        'CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id)'
    );
    $pdo->exec(
        'CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status)'
    );
    $pdo->exec(
        'CREATE INDEX IF NOT EXISTS idx_certificates_workshop ON certificates(workshop_id)'
    );
} catch (Throwable $exception) {
    respond(500, [
        'success' => false,
        'message' => 'Gagal terhubung ke database SQLite.',
        'debug' => [
            'error' => $exception->getMessage(),
            'databaseFile' => $databaseFile,
        ],
    ]);
}

$registrationDatabaseFile = resolveRegistrationDatabaseFile($databaseFile);

try {
    if ($registrationDatabaseFile === $databaseFile) {
        $registrationPdo = $pdo;
    } else {
        $registrationPdo = new PDO('sqlite:' . $registrationDatabaseFile, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $registrationPdo->exec('PRAGMA busy_timeout = 15000');
    }
} catch (Throwable $exception) {
    respond(500, [
        'success' => false,
        'message' => 'Gagal terhubung ke database pendaftaran workshop.',
        'debug' => [
            'error' => $exception->getMessage(),
            'registrationDatabaseFile' => $registrationDatabaseFile,
        ],
    ]);
}

$contentPdo = tableExists($registrationPdo, 'workshops')
    ? $registrationPdo
    : $pdo;

if ($action === 'upload-certificate') {
    if ($method !== 'POST') {
        header('Allow: POST, OPTIONS');
        respond(405, [
            'success' => false,
            'message' => 'Upload sertifikat hanya menerima method POST.',
        ]);
    }

    handleCertificateUpload($pdo);
}

if ($action === 'send-certificate') {
    if ($method !== 'POST') {
        header('Allow: POST, OPTIONS');
        respond(405, [
            'success' => false,
            'message' => 'Kirim sertifikat hanya menerima method POST.',
        ]);
    }

    handleCertificateEmail($pdo);
}

if ($method === 'GET') {
    try {
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

        if ($id > 0) {
            $statement = $pdo->prepare(
                'SELECT * FROM certificates WHERE id = :id LIMIT 1'
            );
            $statement->execute([':id' => $id]);
            $row = $statement->fetch();

            if (!$row) {
                respond(404, [
                    'success' => false,
                    'message' => 'Sertifikat tidak ditemukan.',
                ]);
            }

            respond(200, [
                'success' => true,
                'message' => 'Detail sertifikat berhasil diambil.',
                'data' => [
                    'certificate' => decodeCertificateRow($row),
                ],
            ]);
        }

        $certificateRows = $pdo
            ->query('SELECT * FROM certificates ORDER BY id DESC')
            ->fetchAll();
        $certificates = array_map('decodeCertificateRow', $certificateRows);

        $workshops = [];
        if (tableExists($contentPdo, 'workshops')) {
            $workshopRows = $contentPdo
                ->query(
                    'SELECT id, title, status, category, payload_json
                     FROM workshops
                     ORDER BY id DESC'
                )
                ->fetchAll();
            $workshops = array_map('decodeWorkshopOption', $workshopRows);
        }

        $participants = getWorkshopParticipants($registrationPdo, $contentPdo);

        respond(200, [
            'success' => true,
            'message' => 'Data sertifikat dan peserta workshop berhasil diambil dari SQLite.',
            'data' => [
                'certificates' => $certificates,
                'workshops' => $workshops,
                'participants' => $participants,
                'options' => [
                    'workshops' => $workshops,
                    'participants' => $participants,
                ],
                'total' => count($certificates),
                'totalParticipants' => count($participants),
                'registrationDatabase' => basename(dirname($registrationDatabaseFile)) . '/' . basename($registrationDatabaseFile),
                'contentDatabase' => $contentPdo === $registrationPdo
                    ? basename(dirname($registrationDatabaseFile)) . '/' . basename($registrationDatabaseFile)
                    : basename(dirname($databaseFile)) . '/' . basename($databaseFile),
            ],
        ]);
    } catch (Throwable $exception) {
        respond(500, [
            'success' => false,
            'message' => 'Gagal mengambil data sertifikat.',
            'debug' => [
                'error' => $exception->getMessage(),
            ],
        ]);
    }
}

if ($method === 'POST') {
    $data = readJsonBody();
    $payload = validateCertificatePayload($data, $contentPdo, $registrationPdo, true);
    $now = date('Y-m-d H:i:s');

    $existing = findCertificateByRegistration(
        $pdo,
        $payload['registration_id'],
        $payload['workshop_id'],
        $payload['member_key']
    );

    if ($existing !== null) {
        respond(409, [
            'success' => false,
            'message' => 'Peserta ini sudah memiliki sertifikat untuk workshop tersebut.',
            'data' => [
                'certificate' => decodeCertificateRow($existing),
            ],
        ]);
    }

    try {
        $statement = $pdo->prepare(
            'INSERT INTO certificates (
                registration_id,
                member_key,
                user_id,
                user_name,
                email,
                workshop_id,
                workshop_title,
                certificate_title,
                certificate_type,
                completed_at,
                issued_at,
                certificate_number,
                status,
                file_json,
                payload_json,
                created_at,
                updated_at
            ) VALUES (
                :registration_id,
                :member_key,
                :user_id,
                :user_name,
                :email,
                :workshop_id,
                :workshop_title,
                :certificate_title,
                :certificate_type,
                :completed_at,
                :issued_at,
                :certificate_number,
                :status,
                NULL,
                :payload_json,
                :created_at,
                :updated_at
            )'
        );

        $statement->execute([
            ':registration_id' => $payload['registration_id'],
            ':member_key' => $payload['member_key'],
            ':user_id' => $payload['user_id'],
            ':user_name' => $payload['user_name'],
            ':email' => $payload['email'],
            ':workshop_id' => $payload['workshop_id'],
            ':workshop_title' => $payload['workshop_title'],
            ':certificate_title' => $payload['certificate_title'],
            ':certificate_type' => $payload['certificate_type'],
            ':completed_at' => $payload['completed_at'],
            ':issued_at' => $payload['issued_at'],
            ':certificate_number' => $payload['certificate_number'],
            ':status' => $payload['status'],
            ':payload_json' => $payload['payload_json'],
            ':created_at' => $now,
            ':updated_at' => $now,
        ]);

        $id = (int) $pdo->lastInsertId();
        $rowStatement = $pdo->prepare(
            'SELECT * FROM certificates WHERE id = :id LIMIT 1'
        );
        $rowStatement->execute([':id' => $id]);
        $row = $rowStatement->fetch();

        respond(201, [
            'success' => true,
            'message' => 'Sertifikat peserta workshop berhasil dibuat.',
            'data' => [
                'certificate' => decodeCertificateRow($row),
            ],
        ]);
    } catch (Throwable $exception) {
        respond(500, [
            'success' => false,
            'message' => 'Sertifikat gagal dibuat.',
            'debug' => [
                'error' => $exception->getMessage(),
            ],
        ]);
    }
}

if ($method === 'PUT') {
    $id = getRequestId();
    $data = readJsonBody();

    $existingStatement = $pdo->prepare(
        'SELECT * FROM certificates WHERE id = :id LIMIT 1'
    );
    $existingStatement->execute([':id' => $id]);
    $existingRow = $existingStatement->fetch();

    if (!$existingRow) {
        respond(404, [
            'success' => false,
            'message' => 'Sertifikat tidak ditemukan.',
        ]);
    }

    $existingPayload = decodeJsonArray($existingRow['payload_json'] ?? '');
    $mergedData = array_merge($existingPayload, $data);

    if (!isset($mergedData['registrationId']) && $existingRow['registration_id'] !== null) {
        $mergedData['registrationId'] = (int) $existingRow['registration_id'];
    }
    if (!isset($mergedData['workshopId']) && $existingRow['workshop_id'] !== null) {
        $mergedData['workshopId'] = (int) $existingRow['workshop_id'];
    }
    if (!isset($mergedData['certificateNumber'])) {
        $mergedData['certificateNumber'] = $existingRow['certificate_number'];
    }

    $payload = validateCertificatePayload($mergedData, $contentPdo, $registrationPdo, true);
    $now = date('Y-m-d H:i:s');

    $duplicate = findCertificateByRegistration(
        $pdo,
        $payload['registration_id'],
        $payload['workshop_id'],
        $payload['member_key'],
        $id
    );

    if ($duplicate !== null) {
        respond(409, [
            'success' => false,
            'message' => 'Peserta ini sudah memiliki sertifikat lain untuk workshop tersebut.',
            'data' => [
                'certificate' => decodeCertificateRow($duplicate),
            ],
        ]);
    }

    try {
        $statement = $pdo->prepare(
            'UPDATE certificates
             SET registration_id = :registration_id,
                 member_key = :member_key,
                 user_id = :user_id,
                 user_name = :user_name,
                 email = :email,
                 workshop_id = :workshop_id,
                 workshop_title = :workshop_title,
                 certificate_title = :certificate_title,
                 certificate_type = :certificate_type,
                 completed_at = :completed_at,
                 issued_at = :issued_at,
                 certificate_number = :certificate_number,
                 status = :status,
                 payload_json = :payload_json,
                 updated_at = :updated_at
             WHERE id = :id'
        );

        $statement->execute([
            ':registration_id' => $payload['registration_id'],
            ':member_key' => $payload['member_key'],
            ':user_id' => $payload['user_id'],
            ':user_name' => $payload['user_name'],
            ':email' => $payload['email'],
            ':workshop_id' => $payload['workshop_id'],
            ':workshop_title' => $payload['workshop_title'],
            ':certificate_title' => $payload['certificate_title'],
            ':certificate_type' => $payload['certificate_type'],
            ':completed_at' => $payload['completed_at'],
            ':issued_at' => $payload['issued_at'],
            ':certificate_number' => $payload['certificate_number'],
            ':status' => $payload['status'],
            ':payload_json' => $payload['payload_json'],
            ':updated_at' => $now,
            ':id' => $id,
        ]);

        $rowStatement = $pdo->prepare(
            'SELECT * FROM certificates WHERE id = :id LIMIT 1'
        );
        $rowStatement->execute([':id' => $id]);

        respond(200, [
            'success' => true,
            'message' => 'Sertifikat berhasil diperbarui.',
            'data' => [
                'certificate' => decodeCertificateRow($rowStatement->fetch()),
            ],
        ]);
    } catch (Throwable $exception) {
        respond(500, [
            'success' => false,
            'message' => 'Sertifikat gagal diperbarui.',
            'debug' => [
                'error' => $exception->getMessage(),
            ],
        ]);
    }
}

if ($method === 'DELETE') {
    $id = getRequestId();

    try {
        $statement = $pdo->prepare(
            'DELETE FROM certificates WHERE id = :id'
        );
        $statement->execute([':id' => $id]);

        if ($statement->rowCount() === 0) {
            respond(404, [
                'success' => false,
                'message' => 'Sertifikat tidak ditemukan.',
            ]);
        }

        respond(200, [
            'success' => true,
            'message' => 'Sertifikat berhasil dihapus.',
        ]);
    } catch (Throwable $exception) {
        respond(500, [
            'success' => false,
            'message' => 'Sertifikat gagal dihapus.',
            'debug' => [
                'error' => $exception->getMessage(),
            ],
        ]);
    }
}

header('Allow: GET, POST, PUT, DELETE, OPTIONS');
respond(405, [
    'success' => false,
    'message' => 'Method tidak didukung.',
]);
