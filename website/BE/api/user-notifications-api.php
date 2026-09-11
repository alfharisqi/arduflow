<?php

declare(strict_types=1);

date_default_timezone_set('Asia/Jakarta');

header('Content-Type: application/json; charset=utf-8');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5175',
    'https://web.arduflow.com',
];

if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function notificationRespond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    notificationRespond(405, [
        'success' => false,
        'message' => 'Method tidak diizinkan.',
    ]);
}

function notificationPdo(): PDO
{
    $databasePath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'arduflow.sqlite';
    $databaseDirectory = dirname($databasePath);

    if (!is_dir($databaseDirectory) && !mkdir($databaseDirectory, 0775, true) && !is_dir($databaseDirectory)) {
        notificationRespond(500, [
            'success' => false,
            'message' => 'Folder database tidak dapat dibuat.',
        ]);
    }

    $pdo = new PDO('sqlite:' . $databasePath, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA busy_timeout = 5000');

    return $pdo;
}

function notificationTableExists(PDO $pdo, string $table): bool
{
    $statement = $pdo->prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = :table LIMIT 1");
    $statement->execute([':table' => $table]);

    return (bool) $statement->fetchColumn();
}

function notificationDate(string $value): string
{
    if ($value === '') {
        return (new DateTimeImmutable('now'))->format(DateTimeInterface::ATOM);
    }

    return $value;
}

function notificationDecodeJson(string $value): array
{
    $value = trim($value);
    if ($value === '') {
        return [];
    }

    try {
        $decoded = json_decode($value, true, 512, JSON_THROW_ON_ERROR);
        return is_array($decoded) ? $decoded : [];
    } catch (Throwable) {
        return [];
    }
}

function notificationPayloadValue(array $payload, array $keys): string
{
    foreach ($keys as $key) {
        if (isset($payload[$key]) && trim((string) $payload[$key]) !== '') {
            return trim((string) $payload[$key]);
        }
    }

    return '';
}

function notificationProjectOwnerMatches(array $payload, ?int $userId, string $email): bool
{
    $payloadUserId = notificationPayloadValue($payload, [
        'userId',
        'user_id',
        'ownerId',
        'owner_id',
        'authorId',
        'author_id',
        'creatorId',
        'creator_id',
        'createdBy',
        'created_by',
    ]);
    $payloadEmail = notificationPayloadValue($payload, [
        'email',
        'userEmail',
        'user_email',
        'ownerEmail',
        'owner_email',
        'authorEmail',
        'author_email',
    ]);

    return ($userId !== null && $payloadUserId !== '' && (int) $payloadUserId === $userId)
        || ($email !== '' && $payloadEmail !== '' && strtolower($payloadEmail) === strtolower($email));
}

function notificationOwnedProjects(PDO $pdo, ?int $userId, string $email): array
{
    if (!notificationTableExists($pdo, 'project_submissions')) {
        return [];
    }

    $statement = $pdo->query('SELECT id, title, payload_json, updated_at, created_at FROM project_submissions WHERE deleted_at IS NULL ORDER BY updated_at DESC, created_at DESC');
    $projects = [];

    while ($project = $statement->fetch()) {
        $payload = notificationDecodeJson((string) ($project['payload_json'] ?? '{}'));
        if (!notificationProjectOwnerMatches($payload, $userId, $email)) {
            continue;
        }

        $project['payload'] = $payload;
        $projects[] = $project;
    }

    return $projects;
}

function notificationMoney(float $amount, string $currency = 'IDR'): string
{
    if (strtoupper($currency) !== 'IDR') {
        return strtoupper($currency) . ' ' . number_format($amount, 2, ',', '.');
    }

    return 'Rp ' . number_format($amount, 0, ',', '.');
}

function notificationUserName(PDO $pdo, ?int $userId, string $email): string
{
    if (!notificationTableExists($pdo, 'users')) {
        return '';
    }

    if ($userId !== null) {
        $statement = $pdo->prepare('SELECT name, username, email FROM users WHERE id = :id LIMIT 1');
        $statement->execute([':id' => $userId]);
    } else {
        $statement = $pdo->prepare('SELECT name, username, email FROM users WHERE LOWER(email) = LOWER(:email) LIMIT 1');
        $statement->execute([':email' => $email]);
    }

    $user = $statement->fetch();
    if (!$user) {
        return '';
    }

    return trim((string) ($user['name'] ?: $user['username'] ?: $user['email'] ?: ''));
}

function buildTransactionNotifications(PDO $pdo, ?int $userId, string $email): array
{
    if (!notificationTableExists($pdo, 'transactions')) {
        return [];
    }

    $where = ['deleted_at IS NULL'];
    $params = [];

    if ($userId !== null && $email !== '') {
        $where[] = '(user_id = :user_id OR LOWER(email) = LOWER(:email))';
        $params[':user_id'] = $userId;
        $params[':email'] = $email;
    } elseif ($userId !== null) {
        $where[] = 'user_id = :user_id';
        $params[':user_id'] = $userId;
    } elseif ($email !== '') {
        $where[] = 'LOWER(email) = LOWER(:email)';
        $params[':email'] = $email;
    }

    $sql = 'SELECT id, status, item_type, item_title, invoice_number, due_at, updated_at, created_at, rejection_reason
            FROM transactions
            WHERE ' . implode(' AND ', $where) . '
            ORDER BY updated_at DESC, created_at DESC
            LIMIT 50';
    $statement = $pdo->prepare($sql);
    $statement->execute($params);

    $notifications = [];
    while ($transaction = $statement->fetch()) {
        $id = (string) ($transaction['id'] ?? '');
        $status = strtolower(trim((string) ($transaction['status'] ?? 'pending')));
        $itemType = strtolower(trim((string) ($transaction['item_type'] ?? '')));
        if ($itemType === 'project_payout') {
            continue;
        }
        $title = trim((string) ($transaction['item_title'] ?? 'Transaksi Arduflow'));
        $invoice = trim((string) ($transaction['invoice_number'] ?? ''));
        $createdAt = notificationDate((string) ($transaction['updated_at'] ?? $transaction['created_at'] ?? ''));

        if (in_array($status, ['pending', 'waiting', 'unpaid'], true)) {
            $notifications[] = [
                'id' => 'transaction_pending:' . $id,
                'key' => 'transaction_pending:' . $id,
                'type' => 'transaction',
                'title' => 'Transaksi menunggu pembayaran',
                'message' => $title . ($invoice !== '' ? ' menunggu pembayaran untuk invoice ' . $invoice . '.' : ' masih menunggu pembayaran.'),
                'href' => '/transaksi',
                'actionLabel' => 'Buka Transaksi',
                'priority' => 'high',
                'createdAt' => $createdAt,
                'emailSent' => false,
            ];
        } elseif ($status === 'proof_uploaded') {
            $notifications[] = [
                'id' => 'transaction_review:' . $id,
                'key' => 'transaction_review:' . $id,
                'type' => 'transaction',
                'title' => 'Bukti pembayaran sedang direview',
                'message' => $title . ' sedang menunggu verifikasi admin.',
                'href' => '/transaksi',
                'actionLabel' => 'Buka Transaksi',
                'priority' => 'normal',
                'createdAt' => $createdAt,
                'emailSent' => false,
            ];
        } elseif ($status === 'paid') {
            $notifications[] = [
                'id' => 'transaction_paid:' . $id,
                'key' => 'transaction_paid:' . $id,
                'type' => 'transaction',
                'title' => 'Transaksi berhasil',
                'message' => $title . ' sudah lunas dan aktif.',
                'href' => '/transaksi',
                'actionLabel' => 'Buka Transaksi',
                'priority' => 'normal',
                'createdAt' => $createdAt,
                'emailSent' => false,
            ];
        } elseif ($status === 'rejected') {
            $reason = trim((string) ($transaction['rejection_reason'] ?? 'Bukti pembayaran belum valid.'));
            $notifications[] = [
                'id' => 'transaction_rejected:' . $id,
                'key' => 'transaction_rejected:' . $id,
                'type' => 'transaction',
                'title' => 'Transaksi ditolak',
                'message' => $title . ' ditolak. ' . $reason,
                'href' => '/transaksi',
                'actionLabel' => 'Upload Ulang Bukti',
                'priority' => 'urgent',
                'createdAt' => $createdAt,
                'emailSent' => false,
            ];
        }
    }

    return $notifications;
}

function buildWorkshopNotifications(PDO $pdo, ?int $userId, string $email): array
{
    if (!notificationTableExists($pdo, 'transactions') || !notificationTableExists($pdo, 'workshops')) {
        return [];
    }

    $where = [
        't.deleted_at IS NULL',
        "LOWER(t.status) IN ('paid', 'approved', 'lunas')",
        "LOWER(t.item_type) IN ('workshop', 'program', 'course')",
    ];
    $params = [];

    if ($userId !== null && $email !== '') {
        $where[] = '(t.user_id = :user_id OR LOWER(t.email) = LOWER(:email))';
        $params[':user_id'] = $userId;
        $params[':email'] = $email;
    } elseif ($userId !== null) {
        $where[] = 't.user_id = :user_id';
        $params[':user_id'] = $userId;
    } elseif ($email !== '') {
        $where[] = 'LOWER(t.email) = LOWER(:email)';
        $params[':email'] = $email;
    }

    $sql = 'SELECT t.id AS transaction_id, t.updated_at AS transaction_updated_at, w.id AS workshop_id, w.title, w.payload_json
            FROM transactions t
            INNER JOIN workshops w ON CAST(w.id AS TEXT) = CAST(t.item_id AS TEXT)
            WHERE ' . implode(' AND ', $where) . '
            ORDER BY t.updated_at DESC, t.created_at DESC
            LIMIT 50';
    $statement = $pdo->prepare($sql);
    $statement->execute($params);

    $now = new DateTimeImmutable('now');
    $limit = $now->modify('+7 days');
    $notifications = [];

    while ($row = $statement->fetch()) {
        $payload = [];
        $rawPayload = trim((string) ($row['payload_json'] ?? ''));
        if ($rawPayload !== '') {
            try {
                $decodedPayload = json_decode($rawPayload, true, 512, JSON_THROW_ON_ERROR);
                $payload = is_array($decodedPayload) ? $decodedPayload : [];
            } catch (Throwable) {
                $payload = [];
            }
        }

        $schedule = isset($payload['schedule']) && is_array($payload['schedule'])
            ? $payload['schedule']
            : [];
        $rawStart = trim((string) (
            $payload['startsAt']
            ?? $payload['starts_at']
            ?? $payload['start_at']
            ?? $schedule['date']
            ?? ''
        ));
        if ($rawStart === '') {
            continue;
        }

        try {
            $startsAt = new DateTimeImmutable($rawStart);
        } catch (Throwable) {
            continue;
        }

        if ($startsAt < $now || $startsAt > $limit) {
            continue;
        }

        $id = (string) ($row['workshop_id'] ?? $row['transaction_id'] ?? '');
        $notifications[] = [
            'id' => 'workshop_reminder:' . $id,
            'key' => 'workshop_reminder:' . $id,
            'type' => 'workshop_reminder',
            'title' => 'Pengingat jadwal workshop',
            'message' => (string) ($row['title'] ?? 'Workshop Arduflow') . ' dimulai ' . $startsAt->format('d M Y H:i') . '.',
            'href' => '/workshop-program',
            'actionLabel' => 'Buka Jadwal',
            'priority' => 'high',
            'createdAt' => notificationDate((string) ($row['transaction_updated_at'] ?? '')),
            'emailSent' => false,
        ];
    }

    return $notifications;
}

function buildProjectSaleNotifications(PDO $pdo, ?int $userId, string $email): array
{
    if (!notificationTableExists($pdo, 'transactions')) {
        return [];
    }

    $projects = notificationOwnedProjects($pdo, $userId, $email);
    if ($projects === []) {
        return [];
    }

    $projectMap = [];
    foreach ($projects as $project) {
        $projectMap[(int) $project['id']] = $project;
    }

    $placeholders = implode(',', array_fill(0, count($projectMap), '?'));
    $statement = $pdo->prepare(
        'SELECT id, user_id, user_name, email, item_id, item_title, amount, currency, paid_at, updated_at, created_at
         FROM transactions
         WHERE deleted_at IS NULL
           AND LOWER(item_type) = \'project\'
           AND LOWER(status) IN (\'paid\', \'approved\', \'lunas\')
           AND item_id IN (' . $placeholders . ')
         ORDER BY COALESCE(paid_at, updated_at, created_at) DESC
         LIMIT 50'
    );
    $statement->execute(array_keys($projectMap));

    $notifications = [];
    while ($transaction = $statement->fetch()) {
        $buyerUserId = isset($transaction['user_id']) && $transaction['user_id'] !== null ? (int) $transaction['user_id'] : null;
        $buyerEmail = strtolower(trim((string) ($transaction['email'] ?? '')));
        if (($userId !== null && $buyerUserId === $userId) || ($email !== '' && $buyerEmail === $email)) {
            continue;
        }

        $projectId = (int) ($transaction['item_id'] ?? 0);
        $projectTitle = trim((string) ($projectMap[$projectId]['title'] ?? $transaction['item_title'] ?? 'Proyek ArduFlow'));
        $buyerName = trim((string) ($transaction['user_name'] ?? ''));
        if ($buyerName === '') {
            $buyerName = $buyerEmail !== '' ? $buyerEmail : 'Seorang user';
        }

        $notifications[] = [
            'id' => 'project_sale:' . (string) $transaction['id'],
            'key' => 'project_sale:' . (string) $transaction['id'],
            'type' => 'project_sale',
            'title' => 'Proyek kamu dibeli',
            'message' => $buyerName . ' membeli "' . $projectTitle . '" senilai ' . notificationMoney((float) ($transaction['amount'] ?? 0), (string) ($transaction['currency'] ?? 'IDR')) . '.',
            'href' => '/proyek-saya',
            'actionLabel' => 'Lihat Histori Penjualan',
            'priority' => 'high',
            'createdAt' => notificationDate((string) ($transaction['paid_at'] ?? $transaction['updated_at'] ?? $transaction['created_at'] ?? '')),
            'emailSent' => false,
        ];
    }

    return $notifications;
}

function buildProjectReviewNotifications(PDO $pdo, ?int $userId, string $email): array
{
    $notifications = [];
    foreach (notificationOwnedProjects($pdo, $userId, $email) as $project) {
        $projectId = (int) ($project['id'] ?? 0);
        $projectTitle = trim((string) ($project['title'] ?? 'Proyek ArduFlow'));
        $ratings = $project['payload']['ratingItems'] ?? $project['payload']['ratings'] ?? [];
        if (!is_array($ratings)) {
            continue;
        }

        foreach ($ratings as $index => $rating) {
            if (!is_array($rating)) {
                continue;
            }

            $authorEmail = strtolower(trim((string) ($rating['authorEmail'] ?? $rating['email'] ?? '')));
            $authorId = trim((string) ($rating['authorId'] ?? $rating['userId'] ?? $rating['user_id'] ?? ''));
            if (($email !== '' && $authorEmail === $email) || ($userId !== null && $authorId !== '' && (int) $authorId === $userId)) {
                continue;
            }

            $ratingValue = (int) ($rating['value'] ?? $rating['rating'] ?? 0);
            $message = trim((string) ($rating['message'] ?? $rating['comment'] ?? ''));
            $authorName = trim((string) ($rating['authorName'] ?? $rating['userName'] ?? $rating['name'] ?? 'User'));
            $createdAt = notificationDate((string) ($rating['updatedAt'] ?? $rating['updated_at'] ?? $rating['createdAt'] ?? $rating['created_at'] ?? $project['updated_at'] ?? ''));
            $identity = trim((string) ($rating['identity'] ?? $rating['id'] ?? ($projectId . '-' . $index)));

            $notifications[] = [
                'id' => 'project_review:' . $projectId . ':' . $identity,
                'key' => 'project_review:' . $projectId . ':' . $identity . ':' . md5($createdAt . $message . $ratingValue),
                'type' => 'project_review',
                'title' => 'Review baru untuk proyek kamu',
                'message' => $authorName . ' memberi review ' . $ratingValue . '/5 untuk "' . $projectTitle . '"' . ($message !== '' ? ': ' . substr($message, 0, 120) : '.'),
                'href' => '/project/detail?id=' . $projectId,
                'actionLabel' => 'Lihat Review',
                'priority' => 'normal',
                'createdAt' => $createdAt,
                'emailSent' => false,
            ];
        }
    }

    return $notifications;
}

function buildPayoutNotifications(PDO $pdo, ?int $userId, string $email): array
{
    $notifications = [];

    if (notificationTableExists($pdo, 'transactions')) {
        $where = ['deleted_at IS NULL', 'LOWER(item_type) = \'project_payout\''];
        $params = [];
        if ($userId !== null && $email !== '') {
            $where[] = '(user_id = :user_id OR LOWER(email) = LOWER(:email))';
            $params[':user_id'] = $userId;
            $params[':email'] = $email;
        } elseif ($userId !== null) {
            $where[] = 'user_id = :user_id';
            $params[':user_id'] = $userId;
        } elseif ($email !== '') {
            $where[] = 'LOWER(email) = LOWER(:email)';
            $params[':email'] = $email;
        }

        $statement = $pdo->prepare(
            'SELECT id, invoice_number, status, item_title, amount, currency, proof_file_url, reviewed_at, updated_at, created_at, rejection_reason
             FROM transactions
             WHERE ' . implode(' AND ', $where) . '
             ORDER BY updated_at DESC, created_at DESC
             LIMIT 50'
        );
        $statement->execute($params);

        $labels = [
            'payout_requested' => ['Pengajuan pencairan diterima', 'menunggu pemeriksaan admin', 'high'],
            'processing' => ['Pencairan sedang diproses', 'sedang diproses admin', 'high'],
            'proof_sent' => ['Bukti pencairan tersedia', 'sudah dikirim admin. Cek bukti dan konfirmasi selesai', 'urgent'],
            'done' => ['Pencairan selesai', 'sudah selesai', 'normal'],
            'rejected' => ['Pencairan ditolak', 'ditolak; saldo kembali tersedia', 'urgent'],
        ];

        while ($row = $statement->fetch()) {
            $status = strtolower(trim((string) ($row['status'] ?? '')));
            if (!isset($labels[$status])) {
                continue;
            }
            [$title, $description, $priority] = $labels[$status];
            $reason = $status === 'rejected' ? trim((string) ($row['rejection_reason'] ?? '')) : '';

            $notifications[] = [
                'id' => 'payout:' . (string) $row['id'],
                'key' => 'payout:' . (string) $row['id'] . ':' . $status,
                'type' => 'payout',
                'title' => $title,
                'message' => 'Pencairan ' . (string) ($row['invoice_number'] ?? '') . ' sebesar ' . notificationMoney((float) ($row['amount'] ?? 0), (string) ($row['currency'] ?? 'IDR')) . ' ' . $description . ($reason !== '' ? '. Alasan: ' . $reason : '.'),
                'href' => '/proyek-saya',
                'actionLabel' => $status === 'proof_sent' ? 'Konfirmasi Pencairan' : 'Buka Pencairan',
                'priority' => $priority,
                'createdAt' => notificationDate((string) ($row['reviewed_at'] ?? $row['updated_at'] ?? $row['created_at'] ?? '')),
                'emailSent' => false,
            ];
        }
    }

    if ($userId !== null && notificationTableExists($pdo, 'payout_notifications')) {
        $statement = $pdo->prepare('SELECT id, message, created_at FROM payout_notifications WHERE user_id = :user_id ORDER BY created_at DESC, id DESC LIMIT 20');
        $statement->execute([':user_id' => $userId]);
        while ($row = $statement->fetch()) {
            $createdAt = (new DateTimeImmutable('@' . (int) ($row['created_at'] ?? time())))->setTimezone(new DateTimeZone('Asia/Jakarta'))->format(DateTimeInterface::ATOM);
            $notifications[] = [
                'id' => 'payout_activity:' . (string) $row['id'],
                'key' => 'payout_activity:' . (string) $row['id'],
                'type' => 'payout_activity',
                'title' => 'Aktivitas pencairan',
                'message' => (string) ($row['message'] ?? ''),
                'href' => '/proyek-saya',
                'actionLabel' => 'Buka Pencairan',
                'priority' => 'normal',
                'createdAt' => $createdAt,
                'emailSent' => false,
            ];
        }
    }

    return $notifications;
}

function buildTestimonialNotifications(PDO $pdo, ?int $userId, string $email): array
{
    if (!notificationTableExists($pdo, 'testimonials') || $email === '') {
        return [];
    }

    $statement = $pdo->prepare(
        'SELECT id, status, source_type, source_id, admin_note, updated_at, created_at
         FROM testimonials
         WHERE LOWER(email) = LOWER(:email)
         ORDER BY updated_at DESC, created_at DESC
         LIMIT 20'
    );
    $statement->execute([':email' => $email]);

    $notifications = [];
    while ($row = $statement->fetch()) {
        $status = strtolower(trim((string) ($row['status'] ?? 'pending')));
        if (!in_array($status, ['approved', 'disetujui', 'rejected', 'ditolak', 'pending', 'menunggu'], true)) {
            continue;
        }
        $approved = in_array($status, ['approved', 'disetujui'], true);
        $rejected = in_array($status, ['rejected', 'ditolak'], true);
        $title = $approved ? 'Testimoni disetujui' : ($rejected ? 'Testimoni perlu diperbaiki' : 'Testimoni menunggu review');
        $sourceType = trim((string) ($row['source_type'] ?? 'general'));
        $sourceId = trim((string) ($row['source_id'] ?? ''));
        $sourceTitle = $sourceType !== '' && $sourceType !== 'general'
            ? ucfirst($sourceType) . ($sourceId !== '' ? ' #' . $sourceId : '')
            : 'ArduFlow';
        $adminNote = trim((string) ($row['admin_note'] ?? ''));

        $notifications[] = [
            'id' => 'testimonial:' . (string) $row['id'],
            'key' => 'testimonial:' . (string) $row['id'] . ':' . $status,
            'type' => 'testimonial',
            'title' => $title,
            'message' => 'Testimoni untuk ' . $sourceTitle . ' ' . ($approved ? 'sudah disetujui admin.' : ($rejected ? 'ditolak admin dan perlu diperbaiki.' : 'sedang menunggu review admin.')) . ($adminNote !== '' ? ' Catatan: ' . $adminNote : ''),
            'href' => '/workshop-program',
            'actionLabel' => 'Buka Testimoni',
            'priority' => $rejected ? 'urgent' : 'normal',
            'createdAt' => notificationDate((string) ($row['updated_at'] ?? $row['created_at'] ?? '')),
            'emailSent' => false,
        ];
    }

    return $notifications;
}

function buildCertificateNotifications(PDO $pdo, ?int $userId, string $email): array
{
    if (!notificationTableExists($pdo, 'certificates') || ($email === '' && $userId === null)) {
        return [];
    }

    $where = [];
    $params = [];
    if ($userId !== null && $email !== '') {
        $where[] = '(user_id = :user_id OR LOWER(email) = LOWER(:email))';
        $params[':user_id'] = $userId;
        $params[':email'] = $email;
    } elseif ($userId !== null) {
        $where[] = 'user_id = :user_id';
        $params[':user_id'] = $userId;
    } else {
        $where[] = 'LOWER(email) = LOWER(:email)';
        $params[':email'] = $email;
    }

    $statement = $pdo->prepare(
        'SELECT id, workshop_title, certificate_number, created_at, updated_at
         FROM certificates
         WHERE ' . implode(' AND ', $where) . '
         ORDER BY updated_at DESC, created_at DESC
         LIMIT 20'
    );
    $statement->execute($params);

    $notifications = [];
    while ($row = $statement->fetch()) {
        $title = trim((string) ($row['workshop_title'] ?? 'Workshop ArduFlow'));
        $notifications[] = [
            'id' => 'certificate:' . (string) $row['id'],
            'key' => 'certificate:' . (string) $row['id'],
            'type' => 'certificate',
            'title' => 'Sertifikat siap diunduh',
            'message' => 'Sertifikat untuk ' . $title . ' sudah tersedia' . (trim((string) ($row['certificate_number'] ?? '')) !== '' ? ' dengan nomor ' . (string) $row['certificate_number'] : '') . '.',
            'href' => '/sertifikat',
            'actionLabel' => 'Buka Sertifikat',
            'priority' => 'normal',
            'createdAt' => notificationDate((string) ($row['updated_at'] ?? $row['created_at'] ?? '')),
            'emailSent' => false,
        ];
    }

    return $notifications;
}

function notificationEnsureEmailLog(PDO $pdo): void
{
    $pdo->exec('CREATE TABLE IF NOT EXISTS user_notification_email_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        notification_key TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL DEFAULT "",
        status TEXT NOT NULL DEFAULT "sent",
        error_message TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(notification_key, email)
    )');
}

function notificationSentEmailKeys(PDO $pdo, string $email, array $keys): array
{
    notificationEnsureEmailLog($pdo);
    $keys = array_values(array_filter(array_unique(array_map('strval', $keys))));
    if ($keys === []) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($keys), '?'));
    $statement = $pdo->prepare(
        'SELECT notification_key
         FROM user_notification_email_logs
         WHERE LOWER(email) = LOWER(?)
           AND status = \'sent\'
           AND notification_key IN (' . $placeholders . ')'
    );
    $statement->execute(array_merge([$email], $keys));

    return array_fill_keys(array_map('strval', $statement->fetchAll(PDO::FETCH_COLUMN)), true);
}

function notificationWriteEmailLog(PDO $pdo, string $key, string $email, string $subject, string $status, string $error = ''): void
{
    notificationEnsureEmailLog($pdo);
    $statement = $pdo->prepare(
        'INSERT INTO user_notification_email_logs (notification_key, email, subject, status, error_message, created_at)
         VALUES (:notification_key, :email, :subject, :status, :error_message, :created_at)
         ON CONFLICT(notification_key, email) DO UPDATE SET
             subject = excluded.subject,
             status = excluded.status,
             error_message = excluded.error_message,
             created_at = excluded.created_at'
    );
    $statement->execute([
        ':notification_key' => $key,
        ':email' => $email,
        ':subject' => $subject,
        ':status' => $status,
        ':error_message' => $error,
        ':created_at' => (new DateTimeImmutable('now'))->format(DateTimeInterface::ATOM),
    ]);
}

function notificationDispatchEmails(PDO $pdo, array $notifications, string $email, string $name, bool $enabled, array $enabledTypes = []): array
{
    if (!$enabled || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return $notifications;
    }

    $sentKeys = notificationSentEmailKeys($pdo, $email, array_column($notifications, 'key'));
    $importantTypes = ['transaction', 'workshop_reminder', 'project_sale', 'project_review', 'payout', 'payout_activity', 'testimonial', 'certificate'];
    $enabledTypeMap = $enabledTypes === [] ? [] : array_fill_keys($enabledTypes, true);
    $mail = null;

    foreach ($notifications as &$notification) {
        $key = (string) ($notification['key'] ?? '');
        if ($key === '') {
            continue;
        }

        if (isset($sentKeys[$key])) {
            $notification['emailSent'] = true;
            continue;
        }

        $type = (string) ($notification['type'] ?? '');
        if (!in_array($type, $importantTypes, true)) {
            continue;
        }

        if ($enabledTypeMap !== [] && !isset($enabledTypeMap[$type])) {
            continue;
        }

        try {
            if ($mail === null) {
                $context = require dirname(__DIR__) . '/bootstrap/context.php';
                $mail = new \Arduflow\Api\Services\MailService($context['config']);
            }

            $subject = 'ArduFlow - ' . (string) ($notification['title'] ?? 'Notifikasi');
            $sent = $mail->sendUserNotification(
                $email,
                $name,
                $subject,
                (string) ($notification['title'] ?? 'Notifikasi ArduFlow'),
                (string) ($notification['message'] ?? ''),
                (string) ($notification['href'] ?? '/dashboard')
            );

            notificationWriteEmailLog($pdo, $key, $email, $subject, $sent ? 'sent' : 'failed', $sent ? '' : 'MailService gagal mengirim email.');
            $notification['emailSent'] = $sent;
        } catch (Throwable $error) {
            notificationWriteEmailLog($pdo, $key, $email, 'ArduFlow - Notifikasi', 'failed', $error->getMessage());
            $notification['emailSent'] = false;
        }
    }
    unset($notification);

    return $notifications;
}

try {
    $email = strtolower(trim((string) ($_GET['email'] ?? '')));
    $userIdRaw = trim((string) ($_GET['userId'] ?? $_GET['user_id'] ?? ''));
    $userId = ctype_digit($userIdRaw) ? (int) $userIdRaw : null;
    $sendEmail = filter_var($_GET['sendEmail'] ?? $_GET['send_email'] ?? false, FILTER_VALIDATE_BOOLEAN);
    $enabledTypesRaw = trim((string) ($_GET['enabledTypes'] ?? $_GET['enabled_types'] ?? ''));
    $enabledTypes = array_values(array_filter(array_unique(array_map(
        static fn (string $type): string => strtolower(trim($type)),
        explode(',', $enabledTypesRaw)
    ))));

    if ($email === '' && $userId === null) {
        notificationRespond(400, [
            'success' => false,
            'message' => 'Parameter email atau userId wajib diisi.',
        ]);
    }

    $pdo = notificationPdo();
    $userName = notificationUserName($pdo, $userId, $email);
    $notifications = array_merge(
        buildTransactionNotifications($pdo, $userId, $email),
        buildWorkshopNotifications($pdo, $userId, $email),
        buildProjectSaleNotifications($pdo, $userId, $email),
        buildProjectReviewNotifications($pdo, $userId, $email),
        buildPayoutNotifications($pdo, $userId, $email),
        buildTestimonialNotifications($pdo, $userId, $email),
        buildCertificateNotifications($pdo, $userId, $email)
    );

    $seen = [];
    $unique = [];
    foreach ($notifications as $notification) {
        $key = (string) ($notification['key'] ?? '');
        if ($key === '' || isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;
        $unique[] = $notification;
    }

    usort($unique, static function (array $left, array $right): int {
        $priorityOrder = ['urgent' => 0, 'high' => 1, 'normal' => 2, 'low' => 3];
        $leftPriority = $priorityOrder[(string) ($left['priority'] ?? 'normal')] ?? 2;
        $rightPriority = $priorityOrder[(string) ($right['priority'] ?? 'normal')] ?? 2;
        if ($leftPriority !== $rightPriority) {
            return $leftPriority <=> $rightPriority;
        }

        return strtotime((string) ($right['createdAt'] ?? 'now')) <=> strtotime((string) ($left['createdAt'] ?? 'now'));
    });

    $unique = notificationDispatchEmails($pdo, $unique, $email, $userName, $sendEmail, $enabledTypes);

    notificationRespond(200, [
        'success' => true,
        'message' => 'Notifikasi user berhasil dimuat.',
        'data' => [
            'notifications' => $unique,
            'total' => count($unique),
            'emailEnabled' => $sendEmail,
        ],
    ]);
} catch (Throwable $exception) {
    notificationRespond(500, [
        'success' => false,
        'message' => 'Notifikasi user gagal dimuat.',
        'error' => $exception->getMessage(),
    ]);
}
