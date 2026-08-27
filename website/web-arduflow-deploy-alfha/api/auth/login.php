<?php

declare(strict_types=1);

require_once __DIR__ . '/../support/bootstrap.php';

afwApplyCors(['POST']);
afwRequireMethod('POST');

$payload = afwReadJsonBody();
$identifier = trim((string) ($payload['identifier'] ?? ''));
$password = (string) ($payload['password'] ?? '');
$errors = [];

if ($identifier === '') {
    $errors['identifier'] = 'Nama, username, atau email wajib diisi.';
}

if ($password === '') {
    $errors['password'] = 'Kata sandi wajib diisi.';
}

if ($errors !== []) {
    afwSendJson(422, false, 'Data login belum valid.', [], $errors);
}

$pdo = afwPdo();

try {
    $statement = $pdo->prepare(
        'SELECT
            id,
            name,
            username,
            email,
            password_hash,
            nickname,
            whatsapp,
            institution_name,
            occupation,
            email_verified_at,
            deleted_at
         FROM users
         WHERE (
            LOWER(email) = LOWER(:identifier)
            OR LOWER(username) = LOWER(:identifier)
            OR LOWER(name) = LOWER(:identifier)
         )
         AND deleted_at IS NULL
         LIMIT 1'
    );

    $statement->execute([':identifier' => $identifier]);
    $user = $statement->fetch();
} catch (Throwable $exception) {
    error_log('Query login user gagal: ' . $exception->getMessage());

    afwSendJson(500, false, 'Data pengguna gagal dibaca.', [
        'detail' => $exception->getMessage(),
    ]);
}

if (!$user) {
    afwSendJson(401, false, 'Nama, username, email, atau kata sandi salah.');
}

$passwordHash = trim((string) ($user['password_hash'] ?? ''));

if ($passwordHash === '') {
    afwSendJson(401, false, 'Password pengguna tidak tersedia.');
}

$isModernHash =
    str_starts_with($passwordHash, '$argon2')
    || str_starts_with($passwordHash, '$2y$')
    || str_starts_with($passwordHash, '$2b$');

if (!$isModernHash && str_starts_with($passwordHash, 'scrypt$')) {
    afwSendJson(
        401,
        false,
        'Password akun masih menggunakan hash scrypt dari backend Node.js lama. Silakan reset password terlebih dahulu.'
    );
}

if (!$isModernHash || !password_verify($password, $passwordHash)) {
    afwSendJson(401, false, 'Nama, username, email, atau kata sandi salah.');
}

try {
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS auth_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )'
    );

    $plainToken = bin2hex(random_bytes(32));
    $now = gmdate('Y-m-d\TH:i:s\Z');
    $expiresAt = gmdate('Y-m-d\TH:i:s\Z', time() + 86400);

    $pdo->beginTransaction();

    $deleteExpired = $pdo->prepare(
        'DELETE FROM auth_tokens WHERE expires_at <= :now'
    );
    $deleteExpired->execute([':now' => $now]);

    $insertToken = $pdo->prepare(
        'INSERT INTO auth_tokens (
            user_id,
            token_hash,
            expires_at,
            created_at
        ) VALUES (
            :user_id,
            :token_hash,
            :expires_at,
            :created_at
        )'
    );

    $insertToken->execute([
        ':user_id' => (int) $user['id'],
        ':token_hash' => hash('sha256', $plainToken),
        ':expires_at' => $expiresAt,
        ':created_at' => $now,
    ]);

    $pdo->commit();
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log('Pembuatan auth token gagal: ' . $exception->getMessage());

    afwSendJson(500, false, 'Token login gagal dibuat.', [
        'detail' => $exception->getMessage(),
    ]);
}

afwSendJson(200, true, 'Login berhasil.', [
    'token' => $plainToken,
    'token_type' => 'Bearer',
    'expires_at' => $expiresAt,
    'user' => afwUserResponse($user),
]);
