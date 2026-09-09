<?php

declare(strict_types=1);

use Arduflow\Api\Application;
use Arduflow\Api\Database\ConnectionFactory;
use Arduflow\Api\Database\SqliteMigrator;
use Arduflow\Api\Http\Request;
use Arduflow\Api\Repositories\AdminRepository;
use Arduflow\Api\Repositories\OutboxRepository;
use Arduflow\Api\Security\PasswordHasher;
use Arduflow\Api\Services\MqttService;
use Arduflow\Api\Support\Config;

$root = dirname(__DIR__);
require $root . '/vendor/autoload.php';

$config = new Config([
    'app' => ['cors_origins' => ['http://127.0.0.1:5173'], 'timezone' => 'Asia/Jakarta'],
    'auth' => ['session_hours' => 8, 'legacy_scrypt_enabled' => false],
    'database' => [
        'sqlite' => ['path' => ':memory:', 'busy_timeout_ms' => 5000],
        'mysql' => ['host' => '127.0.0.1', 'port' => 9, 'database' => 'unreachable', 'username' => 'none', 'password' => '', 'connect_timeout_seconds' => 1],
    ],
    'mail' => ['enabled' => false, 'host' => '127.0.0.1', 'port' => 1025],
    'mqtt' => ['enabled' => false, 'topic_prefix' => 'arduflow', 'timeout_seconds' => 1],
    'sync' => [
        'enabled' => false, 'api_url' => 'http://127.0.0.1/', 'api_token' => 'test-token',
        'hmac_secret' => 'test-secret', 'max_clock_skew_seconds' => 300, 'batch_size' => 250,
        'http_timeout_seconds' => 1, 'processing_timeout_minutes' => 15, 'ip_allowlist' => [],
    ],
]);
$connections = new ConnectionFactory($config, $root);
$pdo = $connections->sqlite();
(new SqliteMigrator($root . '/migrations/sqlite'))->migrate($pdo);
$admins = new AdminRepository($pdo, new OutboxRepository());
$admins->upsert([
    'username' => 'content-admin', 'name' => 'Content Admin', 'email' => 'content-admin@example.com',
    'password_hash' => (new PasswordHasher(false))->hash('AdminPassword3#'), 'role' => 'super_admin',
]);
$app = new Application($config, $connections, $root);
$assertions = 0;
$assert = static function (bool $condition, string $message) use (&$assertions): void {
    $assertions++;
    if (!$condition) {
        throw new RuntimeException('Assertion gagal: ' . $message);
    }
};
$call = static function (string $method, string $path, array $body = [], array $headers = []) use ($app): array {
    $response = $app->handle(new Request(
        $method, $path, [], array_change_key_case($headers, CASE_LOWER),
        $body === [] ? '' : (string) json_encode($body, JSON_THROW_ON_ERROR), '127.0.0.1',
    ));
    return ['status' => $response->statusCode(), 'body' => $response->body() === '' ? [] : json_decode($response->body(), true, 512, JSON_THROW_ON_ERROR)];
};

$assert($call('GET', '/api/admin/dashboard')['status'] === 401, 'dashboard admin terlindungi');
$assert($call('POST', '/api/workshops', ['title' => 'Tidak Sah'])['status'] === 401, 'create workshop memerlukan admin');
$login = $call('POST', '/api/admin/login', ['username' => 'content-admin', 'password' => 'AdminPassword3#']);
$token = (string) ($login['body']['token'] ?? '');
$assert($login['status'] === 200 && $token !== '', 'admin dapat login');
$auth = ['Authorization' => 'Bearer ' . $token];

$createdWorkshop = $call('POST', '/api/workshops', [
    'title' => 'Workshop PHP', 'description' => 'Uji workshop', 'method' => 'Online',
    'startsAt' => '2026-08-10T09:00:00+07:00', 'ends_at' => '2026-08-10T12:00:00+07:00',
    'capacity' => 30, 'status' => 'published', 'certificateEnabled' => true,
], $auth);
$assert($createdWorkshop['status'] === 201, 'workshop berhasil dibuat');
$workshopId = (int) $createdWorkshop['body']['workshop']['id'];
$assert(($createdWorkshop['body']['workshop']['startsAt'] ?? null) === '2026-08-10T09:00:00+07:00', 'alias tanggal response kompatibel');
$assert((int) $pdo->query("SELECT COUNT(*) FROM sync_outbox WHERE table_name = 'workshops' AND operation = 'insert'")->fetchColumn() === 1, 'insert workshop membuat outbox');
$assert($call('GET', '/api/workshops')['status'] === 200, 'daftar workshop bersifat publik');
$updatedWorkshop = $call('PUT', "/api/workshops/{$workshopId}", ['title' => 'Workshop PHP Updated', 'capacity' => 40], $auth);
$assert($updatedWorkshop['status'] === 200 && $updatedWorkshop['body']['workshop']['capacity'] === 40, 'workshop dapat diperbarui sebagian');
$assert($call('DELETE', "/api/workshops/{$workshopId}", [], $auth)['status'] === 200, 'workshop memakai soft delete');
$assert($call('GET', "/api/workshops/{$workshopId}")['status'] === 404, 'workshop terhapus tidak tampil publik');
$assert((int) $pdo->query("SELECT COUNT(*) FROM sync_outbox WHERE table_name = 'workshops' AND operation = 'delete'")->fetchColumn() === 1, 'soft delete workshop membuat outbox delete');

$createdProgram = $call('POST', '/api/programs', ['title' => 'Program IoT', 'description' => 'Program test', 'status' => 'published'], $auth);
$assert($createdProgram['status'] === 201 && $createdProgram['body']['program']['name'] === 'Program IoT', 'program menerima alias title');
$programId = (int) $createdProgram['body']['program']['id'];
$assert($call('PUT', "/api/programs/{$programId}", ['name' => 'Program IoT Lanjutan'], $auth)['status'] === 200, 'program dapat diperbarui');
$assert($call('GET', '/api/programs')['status'] === 200, 'daftar program bersifat publik');

$dashboard = $call('GET', '/api/admin/dashboard', [], $auth);
$assert($dashboard['status'] === 200, 'dashboard admin membaca SQLite');
$assert(isset($dashboard['body']['metrics'], $dashboard['body']['sync'], $dashboard['body']['system']), 'response dashboard kompatibel dengan frontend');
$programMetric = array_values(array_filter($dashboard['body']['metrics'], static fn (array $metric): bool => $metric['id'] === 'workshopsPrograms'))[0] ?? null;
$assert(($programMetric['value'] ?? 0) === 1, 'dashboard menghitung program aktif dari SQLite');
$adminUsers = $call('GET', '/api/admin/users', [], $auth);
$assert($adminUsers['status'] === 200, 'admin dapat membaca daftar user');
$assert(isset($adminUsers['body']['users'], $adminUsers['body']['summary'], $adminUsers['body']['pagination']), 'response admin users kompatibel dengan frontend');
$assert($call('DELETE', "/api/programs/{$programId}", [], $auth)['status'] === 200, 'program memakai soft delete');
$assert((int) $pdo->query("SELECT COUNT(*) FROM sync_outbox WHERE table_name = 'programs'")->fetchColumn() === 3, 'semua perubahan program memiliki outbox');
$assert((new MqttService($config))->publish('test/event', ['ok' => true]) === false, 'MQTT nonaktif tidak mengganggu aplikasi');

echo json_encode([
    'status' => 'passed', 'assertions' => $assertions,
    'workshopOutbox' => (int) $pdo->query("SELECT COUNT(*) FROM sync_outbox WHERE table_name = 'workshops'")->fetchColumn(),
    'programOutbox' => (int) $pdo->query("SELECT COUNT(*) FROM sync_outbox WHERE table_name = 'programs'")->fetchColumn(),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
