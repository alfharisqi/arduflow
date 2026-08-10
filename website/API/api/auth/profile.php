<?php

declare(strict_types=1);

require_once __DIR__ . '/../support/bootstrap.php';

afwApplyCors(['PUT']);
afwRequireMethod('PUT');

$pdo = afwPdo();
$session = afwCurrentUserSession($pdo, afwBearerToken());
$payload = afwReadJsonBody();

$userId = (int) $session['user_id'];
$name = trim((string) ($payload['name'] ?? ''));
$username = trim((string) ($payload['username'] ?? ''));
$nickname = trim((string) ($payload['nickname'] ?? ''));
$whatsapp = trim((string) ($payload['whatsapp'] ?? ''));
$occupation = trim((string) ($payload['occupation'] ?? ''));
$institutionName = trim((string) (
    $payload['institution_name']
    ?? $payload['institutionName']
    ?? ''
));
$profileImage = trim((string) (
    $payload['profile_image']
    ?? $payload['profileImage']
    ?? ''
));

$errors = [];

if ($name === '') {
    $errors['name'] = 'Nama lengkap wajib diisi.';
}

if ($username === '') {
    $errors['username'] = 'Username wajib diisi.';
}

if ($errors !== []) {
    afwSendJson(422, false, 'Data profil belum valid.', [], $errors);
}

try {
    $checkUsername = $pdo->prepare(
        'SELECT id
         FROM users
         WHERE LOWER(username) = LOWER(:username)
         AND id != :user_id
         AND deleted_at IS NULL
         LIMIT 1'
    );

    $checkUsername->execute([
        ':username' => $username,
        ':user_id' => $userId,
    ]);

    if ($checkUsername->fetch()) {
        afwSendJson(409, false, 'Username sudah digunakan pengguna lain.', [], [
            'username' => 'Username sudah digunakan.',
        ]);
    }

    $update = $pdo->prepare(
        'UPDATE users
         SET
            name = :name,
            username = :username,
            nickname = :nickname,
            whatsapp = :whatsapp,
            occupation = :occupation,
            institution_name = :institution_name,
            profile_image = :profile_image,
            updated_at = :updated_at
         WHERE id = :id
         AND deleted_at IS NULL'
    );

    $update->execute([
        ':name' => $name,
        ':username' => $username,
        ':nickname' => $nickname !== '' ? $nickname : null,
        ':whatsapp' => $whatsapp !== '' ? $whatsapp : null,
        ':occupation' => $occupation !== '' ? $occupation : null,
        ':institution_name' => $institutionName !== '' ? $institutionName : null,
        ':profile_image' => $profileImage !== '' ? $profileImage : null,
        ':updated_at' => gmdate('Y-m-d\TH:i:s\Z'),
        ':id' => $userId,
    ]);

    $statement = $pdo->prepare(
        'SELECT
            id,
            name,
            username,
            email,
            nickname,
            whatsapp,
            institution_name,
            occupation,
            profile_image,
            avatar_path,
            email_verified_at,
            updated_at
         FROM users
         WHERE id = :id
         AND deleted_at IS NULL
         LIMIT 1'
    );

    $statement->execute([':id' => $userId]);
    $user = $statement->fetch();
} catch (Throwable $exception) {
    afwSendJson(500, false, 'Profil gagal diperbarui.', [
        'detail' => $exception->getMessage(),
    ]);
}

if (!$user) {
    afwSendJson(404, false, 'Data pengguna tidak ditemukan.');
}

afwSendJson(200, true, 'Profil berhasil diperbarui.', [
    'user' => afwUserResponse($user),
]);
