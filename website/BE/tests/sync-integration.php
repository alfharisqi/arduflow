<?php

declare(strict_types=1);

use Arduflow\Api\Application;
use Arduflow\Api\Database\ConnectionFactory;
use Arduflow\Api\Database\SqliteMigrator;
use Arduflow\Api\Http\Request;
use Arduflow\Api\Repositories\AdminRepository;
use Arduflow\Api\Repositories\OutboxRepository;
use Arduflow\Api\Repositories\SyncOutboxRepository;
use Arduflow\Api\Security\PasswordHasher;
use Arduflow\Api\Security\SyncSecurity;
use Arduflow\Api\Services\SqliteToMysqlSyncService;
use Arduflow\Api\Support\Clock;
use Arduflow\Api\Support\Config;
use Arduflow\Api\Support\Uuid;
use Arduflow\Api\Validation\SyncEventValidator;

$root = dirname(__DIR__);
require $root . '/vendor/autoload.php';

$config = new Config([
    'app' => [
        'cors_origins' => ['http://127.0.0.1:5173'],
        'frontend_url' => 'http://127.0.0.1:5173',
        'timezone' => 'Asia/Jakarta',
    ],
    'auth' => ['session_hours' => 8, 'legacy_scrypt_enabled' => false],
    'database' => [
        'sqlite' => ['path' => ':memory:', 'busy_timeout_ms' => 5000],
        'mysql' => [
            'host' => '127.0.0.1', 'port' => 9, 'database' => 'unreachable',
            'username' => 'none', 'password' => '', 'connect_timeout_seconds' => 1,
        ],
    ],
    'mail' => ['enabled' => false],
    'sync' => [
        'enabled' => true,
        'api_url' => 'http://sync.test/api/internal/sync/sqlite-to-mysql',
        'api_token' => 'sync-test-token-32-characters-long',
        'hmac_secret' => 'sync-test-hmac-secret-32-characters',
        'max_clock_skew_seconds' => 300,
        'batch_size' => 250,
        'http_timeout_seconds' => 2,
        'processing_timeout_minutes' => 15,
        'ip_allowlist' => [],
    ],
]);

$connections = new ConnectionFactory($config, $root);
$sqlite = $connections->sqlite();
(new SqliteMigrator($root . '/migrations/sqlite'))->migrate($sqlite);
$outboxWriter = new OutboxRepository();
$outbox = new SyncOutboxRepository($sqlite);
$security = new SyncSecurity($config, $sqlite);
$assertions = 0;
$assert = static function (bool $condition, string $message) use (&$assertions): void {
    $assertions++;
    if (!$condition) {
        throw new RuntimeException('Assertion gagal: ' . $message);
    }
};

$insertUser = static function (PDO $pdo, string $email) use ($outboxWriter): string {
    $now = Clock::now();
    $statement = $pdo->prepare(
        'INSERT INTO users (name, email, password_hash, version, created_at, updated_at) ' .
        'VALUES (:name, :email, :password_hash, 1, :created_at, :updated_at)'
    );
    $statement->execute([
        'name' => 'Sync Test',
        'email' => $email,
        'password_hash' => password_hash('Password1!', PASSWORD_DEFAULT),
        'created_at' => $now,
        'updated_at' => $now,
    ]);
    $id = (string) $pdo->lastInsertId();
    return $outboxWriter->enqueue($pdo, 'users', $id, 'insert');
};

$eventA = $insertUser($sqlite, 'sync-a@example.com');
$eventB = $insertUser($sqlite, 'sync-b@example.com');
$transportCalls = 0;
$transport = static function (string $url, string $rawBody, array $headers) use (
    &$transportCalls,
    $security,
): array {
    $transportCalls++;
    $request = new Request('POST', '/api/internal/sync/sqlite-to-mysql', [], array_change_key_case($headers, CASE_LOWER), $rawBody, '127.0.0.1');
    $verified = $security->verify($request);
    if (!$verified['ok']) {
        throw new RuntimeException('Request worker tidak lolos validasi HMAC test.');
    }
    $body = json_decode($rawBody, true, 512, JSON_THROW_ON_ERROR);
    return [
        'statusCode' => 207,
        'body' => ['results' => array_map(
            static fn (array $event): array => ['eventId' => $event['eventId'], 'status' => 'synced'],
            $body['events'],
        )],
    ];
};
$worker = new SqliteToMysqlSyncService($config, $outbox, $security, $transport);
$result = $worker->run();
$assert($result['total'] === 2 && $result['success'] === 2 && $result['failed'] === 0, 'worker menyinkronkan seluruh batch');
$assert($transportCalls === 1, 'batch dikirim dalam satu request');
$assert((int) $sqlite->query("SELECT COUNT(*) FROM sync_outbox WHERE status = 'synced'")->fetchColumn() === 2, 'event ditandai synced setelah respons sukses');
$assert((int) $sqlite->query("SELECT COUNT(*) FROM sync_logs WHERE mysql_status = 'reachable' AND success_events = 2")->fetchColumn() === 1, 'hasil worker dicatat ke sync_logs');

$lockedEvent = $insertUser($sqlite, 'sync-lock@example.com');
$claimedA = $outbox->claim('worker-a', 10, 15);
$claimedB = $outbox->claim('worker-b', 10, 15);
$assert(count($claimedA) === 1 && $claimedA[0]['event_id'] === $lockedEvent, 'worker pertama mengunci event');
$assert($claimedB === [], 'worker kedua tidak mengambil event yang sama');
$assert($outbox->markFailed($claimedA[0], 'MySQL mati', true), 'event processing dapat dijadwalkan ulang');
$retryRow = $sqlite->query("SELECT status, retry_count, next_retry_at FROM sync_outbox WHERE event_id = '{$lockedEvent}'")->fetch();
$assert($retryRow['status'] === 'pending' && (int) $retryRow['retry_count'] === 1 && $retryRow['next_retry_at'] !== null, 'retry pertama memakai status pending dan backoff');

$sqlite->prepare('UPDATE sync_outbox SET next_retry_at = NULL WHERE event_id = :event_id')->execute(['event_id' => $lockedEvent]);
$failingWorker = new SqliteToMysqlSyncService(
    $config,
    $outbox,
    $security,
    static function (): never {
        throw new RuntimeException('connection refused with secret omitted');
    },
);
$failure = $failingWorker->run();
$assert($failure['failed'] === 1, 'kegagalan transport tidak menghilangkan event');
$failedRow = $sqlite->query("SELECT status, retry_count FROM sync_outbox WHERE event_id = '{$lockedEvent}'")->fetch();
$assert($failedRow['status'] === 'pending' && (int) $failedRow['retry_count'] === 2, 'event gagal tetap pending dan retry bertambah');

$badId = Uuid::v4();
$now = Clock::now();
$sqlite->prepare(
    "INSERT INTO sync_outbox (id, event_id, table_name, row_id, operation, payload, version, status, retry_count, created_at, updated_at) " .
    "VALUES (:id, :event_id, 'users', '999', 'insert', '{bad-json', 1, 'pending', 0, :created, :updated)"
)->execute(['id' => Uuid::v4(), 'event_id' => $badId, 'created' => $now, 'updated' => $now]);
$invalidResult = $worker->run();
$assert($invalidResult['failed'] === 1 && $transportCalls === 1, 'payload invalid gagal permanen tanpa request HTTP');
$assert($sqlite->query("SELECT status FROM sync_outbox WHERE event_id = '{$badId}'")->fetchColumn() === 'failed', 'payload invalid ditandai failed');
$assert($outbox->retryFailed() === 1, 'endpoint repository dapat mengembalikan failed ke antrean');

$body = '{"batchId":"test","events":[]}';
$timestamp = (string) time();
$nonce = 'valid_nonce_1234567890';
$validHeaders = [
    'authorization' => 'Bearer sync-test-token-32-characters-long',
    'x-sync-timestamp' => $timestamp,
    'x-sync-nonce' => $nonce,
    'x-sync-signature' => $security->signature($timestamp, $nonce, $body),
];
$assert($security->verify(new Request('POST', '/', [], $validHeaders, $body, '127.0.0.1'))['ok'] === true, 'token dan HMAC valid diterima');
$wrongToken = [...$validHeaders, 'authorization' => 'Bearer wrong'];
$assert($security->verify(new Request('POST', '/', [], $wrongToken, $body, '127.0.0.1'))['status'] === 401, 'token salah ditolak');
$wrongSignature = [...$validHeaders, 'x-sync-signature' => str_repeat('0', 64)];
$assert($security->verify(new Request('POST', '/', [], $wrongSignature, $body, '127.0.0.1'))['status'] === 401, 'HMAC salah ditolak');
$expiredHeaders = [...$validHeaders, 'x-sync-timestamp' => (string) (time() - 301)];
$assert($security->verify(new Request('POST', '/', [], $expiredHeaders, $body, '127.0.0.1'))['status'] === 401, 'timestamp kedaluwarsa ditolak');

$validator = new SyncEventValidator();
$validationFailed = false;
try {
    $validator->validate([
        'eventId' => Uuid::v4(), 'tableName' => 'secrets', 'rowId' => '1', 'operation' => 'insert',
        'version' => 1, 'payload' => ['id' => 1, 'version' => 1, 'updated_at' => Clock::now()],
    ]);
} catch (InvalidArgumentException) {
    $validationFailed = true;
}
$assert($validationFailed, 'tabel di luar allowlist ditolak');
$validationFailed = false;
try {
    $validator->validate([
        'eventId' => Uuid::v4(), 'tableName' => 'users', 'rowId' => '1', 'operation' => 'insert',
        'version' => 1, 'payload' => ['id' => 1, 'version' => 1, 'updated_at' => Clock::now(), 'secret' => 'x'],
    ]);
} catch (InvalidArgumentException) {
    $validationFailed = true;
}
$assert($validationFailed, 'kolom di luar allowlist ditolak');

$application = new Application($config, $connections, $root);
$call = static function (Application $app, string $method, string $path, array $body = [], array $headers = []): array {
    $response = $app->handle(new Request(
        $method,
        $path,
        [],
        array_change_key_case($headers, CASE_LOWER),
        $body === [] ? '' : (string) json_encode($body, JSON_THROW_ON_ERROR),
        '127.0.0.1',
    ));
    return [
        'status' => $response->statusCode(),
        'body' => $response->body() === '' ? [] : json_decode($response->body(), true, 512, JSON_THROW_ON_ERROR),
    ];
};
$assert($call($application, 'GET', '/api/admin/database-sync/status')['status'] === 401, 'status sync dilindungi admin auth');
$admins = new AdminRepository($sqlite, $outboxWriter);
$admins->upsert([
    'username' => 'sync-admin', 'email' => 'sync-admin@example.com', 'name' => 'Sync Admin',
    'password_hash' => (new PasswordHasher(false))->hash('AdminPassword3#'), 'role' => 'super_admin',
]);
$login = $call($application, 'POST', '/api/admin/login', ['username' => 'sync-admin', 'password' => 'AdminPassword3#']);
$adminToken = (string) ($login['body']['token'] ?? '');
$status = $call($application, 'GET', '/api/admin/database-sync/status', [], ['Authorization' => 'Bearer ' . $adminToken]);
$assert($login['status'] === 200 && $adminToken !== '', 'admin test dapat login');
$assert($status['status'] === 200 && $status['body']['mysql_reachable'] === false, 'admin melihat status meski MySQL mati');
$internalUnauthorized = $call($application, 'POST', '/api/internal/sync/sqlite-to-mysql', ['events' => []]);
$assert($internalUnauthorized['status'] === 401, 'endpoint internal menolak request tanpa token');

echo json_encode([
    'status' => 'passed',
    'assertions' => $assertions,
    'syncedEvents' => 2,
    'mysqlReceiverIntegration' => 'skipped: MySQL test server unavailable',
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
