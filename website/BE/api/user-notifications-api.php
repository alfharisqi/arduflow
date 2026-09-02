<?php

declare(strict_types=1);

use Arduflow\Api\Support\Env;
use PHPMailer\PHPMailer\PHPMailer;

$autoload = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';

if (is_file($autoload)) {
    require_once $autoload;
    if (class_exists(Env::class)) {
        Env::load(dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env');
    }
}

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
];

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Vary: Origin');
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    notificationRespond(405, [
        'success' => false,
        'message' => 'Method tidak diizinkan.',
    ]);
}

function notificationRespond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function notificationEnv(string $key, ?string $default = null): ?string
{
    if (class_exists(Env::class)) {
        return Env::get($key, $default);
    }

    $value = getenv($key);
    return $value === false ? $default : $value;
}

function notificationEnvBool(string $key, bool $default = false): bool
{
    if (class_exists(Env::class)) {
        return Env::bool($key, $default);
    }

    $value = getenv($key);
    return $value === false
        ? $default
        : (filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? $default);
}

function notificationEnvInt(string $key, int $default): int
{
    if (class_exists(Env::class)) {
        return Env::int($key, $default);
    }

    $value = getenv($key);
    return $value !== false && is_numeric($value) ? (int) $value : $default;
}

function notificationSqlitePath(): string
{
    $configuredPath = trim((string) notificationEnv('SQLITE_DATABASE_PATH', ''));
    if ($configuredPath !== '') {
        if (preg_match('/^(?:[A-Za-z]:[\\\\\\/]|[\\\\\\/])/', $configuredPath) === 1) {
            return $configuredPath;
        }

        return dirname(__DIR__) . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $configuredPath);
    }

    return dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'database' . DIRECTORY_SEPARATOR . 'arduflow.sqlite';
}

function notificationPdo(): PDO
{
    $path = notificationSqlitePath();
    $directory = dirname($path);

    if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
        throw new RuntimeException('Folder database tidak dapat dibuat.');
    }

    $pdo = new PDO('sqlite:' . $path, null, null, [
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

function ensureNotificationEmailLog(PDO $pdo): void
{
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS user_notification_email_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            notification_key TEXT NOT NULL,
            email TEXT NOT NULL,
            sent_at TEXT NOT NULL,
            UNIQUE(notification_key, email)
        )'
    );
}

function normalizeNotificationStatus(string $status): string
{
    return strtolower(trim($status));
}

function parseNotificationDate(mixed $value): ?DateTimeImmutable
{
    $raw = trim((string) $value);
    if ($raw === '') {
        return null;
    }

    try {
        return new DateTimeImmutable($raw);
    } catch (Throwable) {
        return null;
    }
}

function formatNotificationDate(?DateTimeImmutable $date): string
{
    return $date ? $date->format('d M Y H:i') : 'jadwal belum ditentukan';
}

function workshopStartDateFromPayload(array $payload): ?DateTimeImmutable
{
    $schedule = $payload['schedule'] ?? [];
    $rawDate = (string) ($payload['startsAt'] ?? $payload['starts_at'] ?? $payload['start_at'] ?? ($schedule['date'] ?? ''));
    $rawTime = (string) ($payload['timeText'] ?? ($schedule['time'] ?? ''));

    if ($rawDate === '') {
        return null;
    }

    if ($rawTime !== '' && preg_match('/(\d{1,2})[.:](\d{2})/', $rawTime, $match) === 1) {
        $rawDate .= ' ' . str_pad($match[1], 2, '0', STR_PAD_LEFT) . ':' . $match[2] . ':00';
    }

    return parseNotificationDate($rawDate);
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

    $sql = 'SELECT * FROM transactions WHERE ' . implode(' AND ', $where) . ' ORDER BY updated_at DESC, created_at DESC LIMIT 50';
    $statement = $pdo->prepare($sql);
    $statement->execute($params);

    $now = new DateTimeImmutable('now');
    $notifications = [];

    foreach ($statement->fetchAll() as $transaction) {
        $id = (string) ($transaction['id'] ?? '');
        $status = normalizeNotificationStatus((string) ($transaction['status'] ?? 'pending'));
        $title = (string) ($transaction['item_title'] ?? 'Transaksi Arduflow');
        $invoice = (string) ($transaction['invoice_number'] ?? '');
        $dueAt = parseNotificationDate($transaction['due_at'] ?? null);
        $updatedAt = (string) ($transaction['updated_at'] ?? $transaction['created_at'] ?? $now->format(DateTimeInterface::ATOM));

        if (in_array($status, ['pending', 'waiting', 'unpaid'], true)) {
            $daysLeft = $dueAt ? (int) floor(($dueAt->getTimestamp() - $now->getTimestamp()) / 86400) : null;
            $isUrgent = $dueAt && $dueAt->getTimestamp() <= $now->modify('+2 days')->getTimestamp();
            $notifications[] = [
                'key' => $isUrgent ? "transaction_due:{$id}" : "transaction_pending:{$id}",
                'type' => 'transaction',
                'title' => $isUrgent ? 'Pengingat pembayaran transaksi' : 'Transaksi menunggu pembayaran',
                'message' => $isUrgent
                    ? "{$title} jatuh tempo " . formatNotificationDate($dueAt) . ($daysLeft !== null && $daysLeft < 0 ? '. Segera hubungi admin.' : '.')
                    : "{$title} masih menunggu pembayaran" . ($invoice !== '' ? " untuk invoice {$invoice}." : '.'),
                'href' => '/transaksi',
                'actionLabel' => 'Buka Transaksi',
                'priority' => $isUrgent ? 'urgent' : 'high',
                'createdAt' => $updatedAt,
            ];
        } elseif ($status === 'proof_uploaded') {
            $notifications[] = [
                'key' => "transaction_review:{$id}",
                'type' => 'transaction',
                'title' => 'Bukti pembayaran sedang direview',
                'message' => "{$title} sudah menerima bukti pembayaran dan menunggu review admin.",
                'href' => '/transaksi',
                'actionLabel' => 'Lihat Status',
                'priority' => 'normal',
                'createdAt' => $updatedAt,
            ];
        } elseif (in_array($status, ['paid', 'approved', 'lunas'], true)) {
            $notifications[] = [
                'key' => "transaction_paid:{$id}",
                'type' => 'transaction',
                'title' => 'Pembayaran disetujui',
                'message' => "Akses {$title} sudah aktif.",
                'href' => '/workshop-program',
                'actionLabel' => 'Buka Akses',
                'priority' => 'normal',
                'createdAt' => $updatedAt,
            ];
        } elseif ($status === 'rejected') {
            $reason = trim((string) ($transaction['rejection_reason'] ?? ''));
            $notifications[] = [
                'key' => "transaction_rejected:{$id}",
                'type' => 'transaction',
                'title' => 'Bukti pembayaran ditolak',
                'message' => "{$title} perlu upload bukti baru." . ($reason !== '' ? " Alasan: {$reason}" : ''),
                'href' => '/transaksi',
                'actionLabel' => 'Upload Ulang',
                'priority' => 'urgent',
                'createdAt' => $updatedAt,
            ];
        } elseif ($status === 'expired') {
            $notifications[] = [
                'key' => "transaction_expired:{$id}",
                'type' => 'transaction',
                'title' => 'Transaksi kedaluwarsa',
                'message' => "{$title} sudah melewati batas pembayaran.",
                'href' => '/transaksi',
                'actionLabel' => 'Cek Transaksi',
                'priority' => 'high',
                'createdAt' => $updatedAt,
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

    $where = ["t.deleted_at IS NULL", "LOWER(t.status) IN ('paid', 'approved', 'lunas')", "LOWER(t.item_type) IN ('workshop', 'program', 'course')"];
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

    $sql = 'SELECT
                t.id AS transaction_id,
                t.updated_at AS transaction_updated_at,
                w.id AS workshop_id,
                w.title,
                w.payload_json
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

    foreach ($statement->fetchAll() as $row) {
        $payload = [];
        if (!empty($row['payload_json'])) {
            try {
                $decoded = json_decode((string) $row['payload_json'], true, 512, JSON_THROW_ON_ERROR);
                $payload = is_array($decoded) ? $decoded : [];
            } catch (Throwable) {
                $payload = [];
            }
        }

        $startsAt = workshopStartDateFromPayload($payload);
        if (!$startsAt || $startsAt->getTimestamp() < $now->getTimestamp() || $startsAt->getTimestamp() > $limit->getTimestamp()) {
            continue;
        }

        $daysLeft = (int) ceil(($startsAt->getTimestamp() - $now->getTimestamp()) / 86400);
        $isUrgent = $daysLeft <= 1;
        $location = trim((string) (($payload['location'] ?? '') ?: ($payload['platform'] ?? '')));

        $notifications[] = [
            'key' => 'workshop_reminder:' . (string) ($row['workshop_id'] ?? $row['transaction_id']),
            'type' => 'workshop_reminder',
            'title' => $isUrgent ? 'Workshop dimulai segera' : 'Pengingat jadwal workshop',
            'message' => (string) ($row['title'] ?? 'Workshop Arduflow') . ' dimulai ' . formatNotificationDate($startsAt) . ($location !== '' ? " di {$location}." : '.'),
            'href' => '/workshop-program',
            'actionLabel' => 'Buka Jadwal',
            'priority' => $isUrgent ? 'urgent' : 'high',
            'createdAt' => (string) ($row['transaction_updated_at'] ?? $now->format(DateTimeInterface::ATOM)),
        ];
    }

    return $notifications;
}

function notificationEmailWasSent(PDO $pdo, string $key, string $email): bool
{
    $statement = $pdo->prepare('SELECT id FROM user_notification_email_logs WHERE notification_key = :key AND LOWER(email) = LOWER(:email) LIMIT 1');
    $statement->execute([':key' => $key, ':email' => $email]);
    return (bool) $statement->fetchColumn();
}

function markNotificationEmailSent(PDO $pdo, string $key, string $email): void
{
    $statement = $pdo->prepare(
        'INSERT OR IGNORE INTO user_notification_email_logs (notification_key, email, sent_at)
         VALUES (:key, :email, :sent_at)'
    );
    $statement->execute([
        ':key' => $key,
        ':email' => $email,
        ':sent_at' => (new DateTimeImmutable('now'))->format(DateTimeInterface::ATOM),
    ]);
}

function sendNotificationEmail(array $notification, string $email, string $name): bool
{
    if (!class_exists(PHPMailer::class) || !notificationEnvBool('MAIL_ENABLED', true) || $email === '') {
        return false;
    }

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = (string) notificationEnv('MAIL_HOST', '127.0.0.1');
    $mail->Port = notificationEnvInt('MAIL_PORT', 1025);

    $username = (string) notificationEnv('MAIL_USERNAME', '');
    if ($username !== '') {
        $mail->SMTPAuth = true;
        $mail->Username = $username;
        $mail->Password = (string) notificationEnv('MAIL_PASSWORD', '');
    }

    if (notificationEnvBool('MAIL_SECURE', false)) {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    }

    $from = (string) notificationEnv('MAIL_FROM', 'Arduflow <no-reply@arduflow.local>');
    if (preg_match('/^\s*(.*?)\s*<([^>]+)>\s*$/', $from, $match) === 1) {
        $fromName = trim($match[1]);
        $fromAddress = trim($match[2]);
    } else {
        $fromName = 'Arduflow';
        $fromAddress = trim($from);
    }

    $frontendUrl = rtrim((string) notificationEnv('FRONTEND_URL', 'http://127.0.0.1:5173'), '/');
    $href = (string) ($notification['href'] ?? '/dashboard');
    $url = str_starts_with($href, 'http') ? $href : $frontendUrl . '/' . ltrim($href, '/');
    $safeTitle = htmlspecialchars((string) ($notification['title'] ?? 'Notifikasi Arduflow'), ENT_QUOTES, 'UTF-8');
    $safeMessage = htmlspecialchars((string) ($notification['message'] ?? ''), ENT_QUOTES, 'UTF-8');
    $safeName = htmlspecialchars($name !== '' ? $name : 'Pengguna Arduflow', ENT_QUOTES, 'UTF-8');
    $safeUrl = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
    $safeAction = htmlspecialchars((string) ($notification['actionLabel'] ?? 'Buka Dashboard'), ENT_QUOTES, 'UTF-8');

    $mail->Timeout = 10;
    $mail->CharSet = 'UTF-8';
    $mail->setFrom($fromAddress, $fromName);
    $mail->addAddress($email, $name ?: $email);
    $mail->isHTML(true);
    $mail->Subject = '[Arduflow] ' . (string) ($notification['title'] ?? 'Notifikasi');
    $mail->Body =
        '<div style="font-family:Arial,sans-serif;background:#030B1E;color:#fff;padding:32px">' .
        '<h2 style="margin-top:0;color:#00A2FF">ArduFlow</h2>' .
        '<p>Halo ' . $safeName . ',</p>' .
        '<h3 style="color:#fff;margin-bottom:8px">' . $safeTitle . '</h3>' .
        '<p style="color:#dbe4f0;line-height:1.6">' . $safeMessage . '</p>' .
        '<p style="margin:28px 0"><a href="' . $safeUrl . '" style="background:#FF6A00;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold">' . $safeAction . '</a></p>' .
        '<p style="color:#b8c2d8;font-size:13px">Email ini dikirim otomatis karena ada notifikasi aktif di dashboard Arduflow Anda.</p>' .
        '</div>';
    $mail->AltBody = strip_tags(str_replace(['</p>', '</h3>', '</a>'], [PHP_EOL, PHP_EOL, PHP_EOL], $mail->Body));
    $mail->send();

    return true;
}

try {
    $email = strtolower(trim((string) ($_GET['email'] ?? '')));
    $userIdRaw = trim((string) ($_GET['userId'] ?? $_GET['user_id'] ?? ''));
    $userId = ctype_digit($userIdRaw) ? (int) $userIdRaw : null;
    $name = trim((string) ($_GET['name'] ?? ''));
    $sendEmail = filter_var((string) ($_GET['sendEmail'] ?? '1'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
    $sendEmail = $sendEmail ?? true;

    if ($email === '' && $userId === null) {
        notificationRespond(400, [
            'success' => false,
            'message' => 'Parameter email atau userId wajib diisi.',
        ]);
    }

    $pdo = notificationPdo();
    ensureNotificationEmailLog($pdo);

    $notifications = [
        ...buildTransactionNotifications($pdo, $userId, $email),
        ...buildWorkshopNotifications($pdo, $userId, $email),
    ];

    $seen = [];
    $notifications = array_values(array_filter($notifications, static function (array $notification) use (&$seen): bool {
        $key = (string) ($notification['key'] ?? '');
        if ($key === '' || isset($seen[$key])) {
            return false;
        }
        $seen[$key] = true;
        return true;
    }));

    usort($notifications, static function (array $left, array $right): int {
        $priorityOrder = ['urgent' => 0, 'high' => 1, 'normal' => 2, 'low' => 3];
        $leftPriority = $priorityOrder[(string) ($left['priority'] ?? 'normal')] ?? 2;
        $rightPriority = $priorityOrder[(string) ($right['priority'] ?? 'normal')] ?? 2;
        if ($leftPriority !== $rightPriority) {
            return $leftPriority <=> $rightPriority;
        }

        return strtotime((string) ($right['createdAt'] ?? 'now')) <=> strtotime((string) ($left['createdAt'] ?? 'now'));
    });

    foreach ($notifications as &$notification) {
        $key = (string) $notification['key'];
        $notification['id'] = $key;
        $notification['emailSent'] = $email !== '' && notificationEmailWasSent($pdo, $key, $email);

        if ($sendEmail && $email !== '' && !$notification['emailSent']) {
            try {
                if (sendNotificationEmail($notification, $email, $name)) {
                    markNotificationEmailSent($pdo, $key, $email);
                    $notification['emailSent'] = true;
                }
            } catch (Throwable $mailError) {
                $notification['emailError'] = $mailError->getMessage();
            }
        }
    }
    unset($notification);

    notificationRespond(200, [
        'success' => true,
        'message' => 'Notifikasi user berhasil dimuat.',
        'data' => [
            'notifications' => $notifications,
            'total' => count($notifications),
            'emailEnabled' => notificationEnvBool('MAIL_ENABLED', true),
        ],
    ]);
} catch (Throwable $exception) {
    notificationRespond(500, [
        'success' => false,
        'message' => 'Notifikasi user gagal dimuat.',
        'error' => $exception->getMessage(),
    ]);
}
