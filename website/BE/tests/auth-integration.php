<?php

declare(strict_types=1);

use Arduflow\Api\Application;
use Arduflow\Api\Http\Request;
use Arduflow\Api\Repositories\AdminRepository;
use Arduflow\Api\Repositories\OutboxRepository;
use Arduflow\Api\Repositories\UserRepository;
use Arduflow\Api\Security\PasswordHasher;
use Arduflow\Api\Support\Clock;

$root = dirname(__DIR__);
require $root . '/vendor/autoload.php';

$databasePath = ':memory:';
putenv('SQLITE_DATABASE_PATH=' . $databasePath);
putenv('MAIL_ENABLED=false');
putenv('AUTH_LEGACY_SCRYPT_ENABLED=false');
$_ENV['SQLITE_DATABASE_PATH'] = $databasePath;
$_ENV['MAIL_ENABLED'] = 'false';
$_ENV['AUTH_LEGACY_SCRYPT_ENABLED'] = 'false';

$assertions = 0;
$assert = static function (bool $condition, string $message) use (&$assertions): void {
    $assertions++;
    if (!$condition) {
        throw new RuntimeException('Assertion gagal: ' . $message);
    }
};

$call = static function (
    Application $app,
    string $method,
    string $path,
    array $body = [],
    array $headers = [],
    array $query = [],
): array {
    $request = new Request(
        strtoupper($method),
        $path,
        $query,
        array_change_key_case($headers, CASE_LOWER),
        $body === [] ? '' : (string) json_encode($body, JSON_THROW_ON_ERROR),
    );
    $response = $app->handle($request);
    $decoded = $response->body() === '' ? [] : json_decode($response->body(), true, 512, JSON_THROW_ON_ERROR);
    return ['status' => $response->statusCode(), 'body' => $decoded];
};

try {
    $context = require $root . '/bootstrap/context.php';
    $app = new Application($context['config'], $context['connections'], $root);
    $pdo = $context['connections']->sqlite();
    $passwords = new PasswordHasher(false);
    $outbox = new OutboxRepository();
    $users = new UserRepository($pdo, $outbox);
    $admins = new AdminRepository($pdo, $outbox);

    $register = $call($app, 'POST', '/api/auth/register', [
        'name' => 'User PHP Test',
        'email' => 'php-test@example.com',
        'whatsapp' => '+62 812-3456-7890',
        'occupation' => 'Developer',
        'password' => 'Password1!',
    ]);
    $assert($register['status'] === 201, 'registrasi harus berhasil');
    $assert(($register['body']['user']['email'] ?? null) === 'php-test@example.com', 'response register kompatibel');
    $userId = (int) $register['body']['user']['id'];
    $assert((int) $pdo->query("SELECT COUNT(*) FROM sync_outbox WHERE table_name = 'users' AND operation = 'insert'")->fetchColumn() === 1, 'insert user membuat outbox');

    $pdo->prepare('UPDATE users SET verification_token = :token WHERE id = :id')
        ->execute(['token' => 'known-verification-token', 'id' => $userId]);
    $verify = $call($app, 'GET', '/api/auth/verify-email', [], [], ['token' => 'known-verification-token']);
    $assert($verify['status'] === 200, 'verifikasi email menerima token legacy saat cutover');
    $assert(($verify['body']['user']['emailVerified'] ?? false) === true, 'email ditandai terverifikasi');

    $login = $call($app, 'POST', '/api/auth/login', [
        'identifier' => 'php-test@example.com',
        'password' => 'Password1!',
    ]);
    $assert($login['status'] === 200, 'login user PHP berhasil');
    $token = (string) ($login['body']['token'] ?? '');
    $assert($token !== '', 'login menghasilkan bearer token');
    $auth = ['Authorization' => 'Bearer ' . $token];

    $session = $call($app, 'GET', '/api/auth/session', [], $auth);
    $assert($session['status'] === 200, 'session user dibaca dari SQLite');

    $profile = $call($app, 'PUT', '/api/auth/profile', [
        'name' => 'User PHP Updated',
        'username' => 'phpuser',
        'nickname' => 'PHP',
        'whatsapp' => '+6281234567890',
        'occupation' => 'Engineer',
        'institutionName' => 'ArduFlow Lab',
        'profileImage' => '/uploads/php-user.png',
    ], $auth);
    $assert($profile['status'] === 200, 'profil dapat diperbarui');
    $assert(($profile['body']['user']['nickname'] ?? null) === 'PHP', 'field profil dikembalikan');
    $assert((int) $pdo->query("SELECT COUNT(*) FROM sync_outbox WHERE table_name = 'users' AND operation = 'update'")->fetchColumn() >= 2, 'update membuat outbox');

    $pdo->prepare(
        'UPDATE users SET password_reset_token = :token, password_reset_expires_at = :expires WHERE id = :id'
    )->execute(['token' => 'known-reset-token', 'expires' => Clock::afterMinutes(60), 'id' => $userId]);
    $reset = $call($app, 'POST', '/api/auth/password-reset/confirm', [
        'token' => 'known-reset-token',
        'password' => 'NewPassword2@',
    ]);
    $assert($reset['status'] === 200, 'reset password berhasil');
    $assert($call($app, 'GET', '/api/auth/session', [], $auth)['status'] === 401, 'reset password mencabut sesi lama');
    $relogin = $call($app, 'POST', '/api/auth/login', [
        'identifier' => 'phpuser',
        'password' => 'NewPassword2@',
    ]);
    $assert($relogin['status'] === 200, 'password baru dapat digunakan');

    $pdo->exec(
        "CREATE TRIGGER force_outbox_failure BEFORE INSERT ON sync_outbox " .
        "BEGIN SELECT RAISE(ABORT, 'forced outbox failure'); END"
    );
    $rolledBack = false;
    try {
        $users->create([
            'name' => 'Rollback User',
            'email' => 'rollback@example.com',
            'whatsapp' => '+6282222222222',
            'occupation' => 'Tester',
            'password_hash' => $passwords->hash('Rollback1!'),
            'verification_token' => hash('sha256', 'rollback-token'),
        ]);
    } catch (Throwable) {
        $rolledBack = true;
    }
    $pdo->exec('DROP TRIGGER force_outbox_failure');
    $assert($rolledBack, 'kegagalan outbox diteruskan sebagai error');
    $assert($users->findByEmail('rollback@example.com') === null, 'insert utama rollback saat outbox gagal');

    $legacyHash = 'scrypt$00112233445566778899aabbccddeeff$' . str_repeat('a', 128);
    $now = Clock::now();
    $pdo->prepare(
        'INSERT INTO users (name, email, password_hash, version, created_at, updated_at) ' .
        'VALUES (:name, :email, :hash, 1, :created, :updated)'
    )->execute([
        'name' => 'Legacy User',
        'email' => 'legacy@example.com',
        'hash' => $legacyHash,
        'created' => $now,
        'updated' => $now,
    ]);
    $legacyLogin = $call($app, 'POST', '/api/auth/login', [
        'identifier' => 'legacy@example.com',
        'password' => 'anything',
    ]);
    $assert($legacyLogin['status'] === 409, 'hash scrypt lama tidak membebani request secara default');
    $assert(($legacyLogin['body']['code'] ?? null) === 'LEGACY_PASSWORD_RESET_REQUIRED', 'akun lama diarahkan reset password');

    $admin = $admins->upsert([
        'username' => 'admin-test',
        'name' => 'Admin Test',
        'email' => 'admin-test@example.com',
        'password_hash' => $passwords->hash('AdminPassword3#'),
        'role' => 'super_admin',
    ]);
    $adminLogin = $call($app, 'POST', '/api/admin/login', [
        'username' => 'admin-test',
        'password' => 'AdminPassword3#',
    ]);
    $assert($adminLogin['status'] === 200, 'login admin PHP berhasil');
    $adminToken = (string) ($adminLogin['body']['token'] ?? '');
    $assert($adminToken !== '', 'admin mendapat token');
    $adminSession = $call($app, 'GET', '/api/admin/session', [], ['Authorization' => 'Bearer ' . $adminToken]);
    $assert($adminSession['status'] === 200, 'route admin terlindungi token SQLite');

    $assert($users->softDelete($userId), 'soft delete user berhasil');
    $deletedEvent = $pdo->query(
        "SELECT payload FROM sync_outbox WHERE table_name = 'users' AND row_id = '{$userId}' " .
        "AND operation = 'delete' ORDER BY created_at DESC LIMIT 1"
    )->fetchColumn();
    $assert(is_string($deletedEvent), 'soft delete membuat event delete');
    $assert(json_decode($deletedEvent, true, 512, JSON_THROW_ON_ERROR)['deleted_at'] !== null, 'payload delete membawa deleted_at');

    echo json_encode([
        'status' => 'passed',
        'assertions' => $assertions,
        'database' => $databasePath,
        'userId' => $userId,
        'adminId' => (int) $admin['id'],
        'outboxEvents' => (int) $pdo->query('SELECT COUNT(*) FROM sync_outbox')->fetchColumn(),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
} finally {
    unset($app, $context, $pdo, $users, $admins, $outbox);
}
