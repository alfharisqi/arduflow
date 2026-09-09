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

    $sql = 'SELECT id, status, item_title, invoice_number, due_at, updated_at, created_at, rejection_reason
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

try {
    $email = strtolower(trim((string) ($_GET['email'] ?? '')));
    $userIdRaw = trim((string) ($_GET['userId'] ?? $_GET['user_id'] ?? ''));
    $userId = ctype_digit($userIdRaw) ? (int) $userIdRaw : null;

    if ($email === '' && $userId === null) {
        notificationRespond(400, [
            'success' => false,
            'message' => 'Parameter email atau userId wajib diisi.',
        ]);
    }

    $pdo = notificationPdo();
    $notifications = array_merge(
        buildTransactionNotifications($pdo, $userId, $email),
        buildWorkshopNotifications($pdo, $userId, $email)
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

    notificationRespond(200, [
        'success' => true,
        'message' => 'Notifikasi user berhasil dimuat.',
        'data' => [
            'notifications' => $unique,
            'total' => count($unique),
            'emailEnabled' => false,
        ],
    ]);
} catch (Throwable $exception) {
    notificationRespond(500, [
        'success' => false,
        'message' => 'Notifikasi user gagal dimuat.',
        'error' => $exception->getMessage(),
    ]);
}
