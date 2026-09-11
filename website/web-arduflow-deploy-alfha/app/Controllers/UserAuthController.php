<?php

declare(strict_types=1);

namespace Arduflow\Api\Controllers;

use Arduflow\Api\Http\Request;
use Arduflow\Api\Http\Response;
use Arduflow\Api\Repositories\AuthLogRepository;
use Arduflow\Api\Repositories\UserRepository;
use Arduflow\Api\Security\PasswordHasher;
use Arduflow\Api\Security\TokenService;
use Arduflow\Api\Services\AuthSessionService;
use Arduflow\Api\Services\MailService;
use Arduflow\Api\Services\MqttService;
use Arduflow\Api\Support\Clock;
use Arduflow\Api\Validation\AuthValidator;
use PDOException;

final class UserAuthController
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly AuthLogRepository $logs,
        private readonly PasswordHasher $passwords,
        private readonly TokenService $tokens,
        private readonly AuthSessionService $sessions,
        private readonly MailService $mail,
        private readonly MqttService $mqtt,
        private readonly int $sessionHours,
    ) {
    }

    public function register(Request $request): Response
    {
        $input = $request->json();
        $name = trim((string) ($input['name'] ?? ''));
        $email = strtolower(trim((string) ($input['email'] ?? '')));
        $whatsapp = AuthValidator::normalizeWhatsapp((string) ($input['whatsapp'] ?? ''));
        $occupation = trim((string) ($input['occupation'] ?? ''));
        $password = (string) ($input['password'] ?? '');

        if ($name === '' || $email === '' || $whatsapp === '' || $password === '') {
            return Response::json(['message' => 'Nama, email, nomor WhatsApp, dan kata sandi wajib diisi.'], 422);
        }
        if (!AuthValidator::email($email)) {
            return Response::json(['message' => 'Format email tidak valid.'], 422);
        }
        if (!AuthValidator::whatsapp($whatsapp)) {
            return Response::json(['message' => 'Nomor WhatsApp harus memakai kode negara dan berisi 8-15 digit.'], 422);
        }
        if (!AuthValidator::password($password)) {
            return Response::json(['message' => 'Kata sandi minimal 8 karakter dengan kombinasi huruf, angka, dan simbol.'], 422);
        }
        if ($this->users->findAnyByEmail($email)) {
            return Response::json(['message' => 'Email sudah terdaftar.'], 409);
        }
        if ($this->users->findAnyByWhatsapp($whatsapp)) {
            return Response::json(['message' => 'Nomor WhatsApp sudah terdaftar.'], 409);
        }

        $rawVerificationToken = $this->tokens->random();
        try {
            $user = $this->users->create([
                'name' => $name,
                'email' => $email,
                'whatsapp' => $whatsapp,
                'occupation' => $occupation,
                'password_hash' => $this->passwords->hash($password),
                'verification_token' => $this->tokens->hash($rawVerificationToken),
            ]);
        } catch (PDOException $exception) {
            $databaseMessage = $exception->getMessage();
            if (str_contains($databaseMessage, 'users.email')) {
                return Response::json(['message' => 'Email sudah terdaftar.'], 409);
            }
            if (str_contains($databaseMessage, 'users.whatsapp')) {
                return Response::json(['message' => 'Nomor WhatsApp sudah terdaftar.'], 409);
            }
            throw $exception;
        }
        $this->logs->record('register_success', true, (int) $user['id'], $email);

        $sent = false;
        try {
            $sent = $this->mail->sendVerification($user, $rawVerificationToken);
        } catch (\Throwable $exception) {
            error_log(sprintf(
                '[%s] Mail verification failed for user_id=%d email=%s: %s: %s%s',
                gmdate('c'),
                (int) $user['id'],
                (string) $user['email'],
                $exception::class,
                $exception->getMessage(),
                PHP_EOL
            ), 3, dirname(__DIR__, 2) . '/storage/logs/app.log');
            $sent = false;
        }
        if (!$sent) {
            error_log(sprintf(
                '[%s] Mail verification not sent for user_id=%d email=%s. Check SMTP credentials, sender, TLS and mailbox spam/quarantine.%s',
                gmdate('c'),
                (int) $user['id'],
                (string) $user['email'],
                PHP_EOL
            ), 3, dirname(__DIR__, 2) . '/storage/logs/app.log');
        }
        $this->mqtt->publish('admin/notifications', [
            'type' => 'user.registered', 'userId' => (int) $user['id'], 'createdAt' => Clock::now(),
        ]);

        return Response::json([
            'message' => $sent
                ? 'Registrasi berhasil. Cek email untuk verifikasi akun.'
                : 'Registrasi berhasil, tetapi email verifikasi gagal dikirim. Pastikan SMTP berjalan.',
            'user' => AuthSessionService::publicUser($user),
        ], 201);
    }

    public function login(Request $request): Response
    {
        $input = $request->json();
        $identifier = trim((string) ($input['identifier'] ?? $input['email'] ?? ''));
        $password = (string) ($input['password'] ?? '');
        if ($identifier === '' || $password === '') {
            return Response::json(['message' => 'Email/nama dan kata sandi wajib diisi.'], 422);
        }

        $user = $this->users->findByIdentifier(strtolower($identifier));
        $check = $user ? $this->passwords->verify($password, (string) $user['password_hash']) : null;
        if ($check?->legacyDisabled) {
            return Response::json([
                'message' => 'Akun lama perlu mengatur ulang password sebelum login ke backend PHP.',
                'code' => 'LEGACY_PASSWORD_RESET_REQUIRED',
            ], 409);
        }
        if (!$user || !$check?->valid) {
            $this->logs->record('login_failed', false, null, $identifier);
            return Response::json(['message' => 'Email/nama atau kata sandi salah.'], 401);
        }
        if (!(bool) ($user['is_active'] ?? true)) {
            $this->logs->record('login_failed', false, (int) $user['id'], (string) $user['email']);
            return Response::json(['message' => 'Akun user sedang dinonaktifkan. Hubungi admin untuk bantuan.'], 403);
        }

        if ($check->needsRehash) {
            $user = $this->users->updatePasswordHash((int) $user['id'], $this->passwords->hash($password));
        }
        $token = $this->tokens->random();
        $expiresAt = Clock::afterHours($this->sessionHours);
        $this->users->createSession((int) $user['id'], $this->tokens->hash($token), $expiresAt);
        $this->logs->record('login_success', true, (int) $user['id'], (string) $user['email']);

        return Response::json([
            'message' => 'Login berhasil.',
            'user' => AuthSessionService::publicUser($user),
            'token' => $token,
            'expiresAt' => $expiresAt,
        ]);
    }

    public function session(Request $request): Response
    {
        $user = $this->sessions->user($request);
        return $user
            ? Response::json(['user' => AuthSessionService::publicUser($user)])
            : Response::json(['message' => 'Sesi user tidak valid atau sudah kedaluwarsa.'], 401);
    }

    public function logout(Request $request): Response
    {
        $token = $this->tokens->bearer($request);
        if ($token !== '') {
            $this->users->deleteSession($this->tokens->hash($token));
        }
        return Response::json(['message' => 'Logout berhasil.']);
    }

    public function verifyEmail(Request $request): Response
    {
        $input = $request->method === 'POST' ? $request->json() : [];
        $token = trim((string) ($request->query['token'] ?? $input['token'] ?? ''));
        $redirectAfterVerify = $this->shouldRedirectAfterEmailVerification($request);
        if ($token === '') {
            return $redirectAfterVerify
                ? $this->redirectToSignIn(false, 'Token verifikasi wajib diisi.')
                : Response::json(['message' => 'Token verifikasi wajib diisi.'], 422);
        }
        $user = $this->users->verifyEmail($token, $this->tokens->hash($token));
        if (!$user) {
            return $redirectAfterVerify
                ? $this->redirectToSignIn(false, 'Token verifikasi tidak valid atau sudah digunakan.')
                : Response::json(['message' => 'Token verifikasi tidak valid.'], 404);
        }
        $this->logs->record('email_verified', true, (int) $user['id'], (string) $user['email']);
        $this->mqtt->publish('admin/notifications', ['type' => 'user.email_verified', 'userId' => (int) $user['id']]);
        if ($redirectAfterVerify) {
            return $this->redirectToSignIn(true, 'Email berhasil diverifikasi. Silakan masuk untuk melanjutkan.');
        }
        return Response::json([
            'message' => 'Email berhasil diverifikasi.',
            'user' => AuthSessionService::publicUser($user),
        ]);
    }

    private function shouldRedirectAfterEmailVerification(Request $request): bool
    {
        if ((string) ($request->query['redirect'] ?? '') === '1') {
            return true;
        }
        if ($request->method !== 'GET') {
            return false;
        }
        $accept = strtolower((string) $request->header('Accept', ''));
        $requestedWith = strtolower((string) $request->header('X-Requested-With', ''));
        if (str_contains($accept, 'application/json') || $requestedWith === 'xmlhttprequest') {
            return false;
        }
        return str_contains($accept, 'text/html');
    }

    private function redirectToSignIn(bool $success, string $message): Response
    {
        $frontendUrl = trim((string) (getenv('FRONTEND_URL') ?: ($_ENV['FRONTEND_URL'] ?? 'http://127.0.0.1:5173')));
        $baseUrl = rtrim($frontendUrl !== '' ? $frontendUrl : 'http://127.0.0.1:5173', '/');
        $host = strtolower((string) (parse_url($baseUrl, PHP_URL_HOST) ?: ''));
        $path = trim((string) (parse_url($baseUrl, PHP_URL_PATH) ?: ''), '/');
        if ($host === 'arduflow.indobilliard.com' && $path === '') {
            $baseUrl = 'http://127.0.0.1:5173';
        }
        return new Response('', 302, ['Location' => $baseUrl . '/signin']);
    }

    public function openPasswordReset(Request $request): Response
    {
        $token = trim((string) ($request->query['token'] ?? ''));
        if ($token === '') {
            return new Response('', 302, ['Location' => $this->frontendUrl('/reset-password')]);
        }
        return new Response('', 302, [
            'Location' => $this->frontendUrl('/reset-password/form') . '?token=' . rawurlencode($token),
        ]);
    }

    private function frontendUrl(string $path): string
    {
        $frontendUrl = trim((string) (getenv('FRONTEND_URL') ?: ($_ENV['FRONTEND_URL'] ?? 'http://127.0.0.1:5173')));
        $baseUrl = rtrim($frontendUrl !== '' ? $frontendUrl : 'http://127.0.0.1:5173', '/');
        $host = strtolower((string) (parse_url($baseUrl, PHP_URL_HOST) ?: ''));
        $basePath = trim((string) (parse_url($baseUrl, PHP_URL_PATH) ?: ''), '/');
        if ($host === 'arduflow.indobilliard.com' && $basePath === '') {
            $baseUrl = 'http://127.0.0.1:5173';
        }
        return $baseUrl . '/' . ltrim($path, '/');
    }

    public function requestPasswordReset(Request $request): Response
    {
        $email = strtolower(trim((string) ($request->json()['email'] ?? '')));
        if ($email === '') {
            return Response::json(['message' => 'Email wajib diisi.'], 422);
        }
        if (!AuthValidator::email($email)) {
            return Response::json(['message' => 'Format email tidak valid.'], 422);
        }
        $user = $this->users->findByEmail($email);
        if (!$user) {
            return Response::json(['message' => 'Jika email terdaftar, tautan pemulihan akan dikirim ke inbox atau spam.', 'retryAfter' => 60]);
        }
        $retryAfter = $this->retryAfterSeconds($user['password_reset_sent_at'] ?? null, 60);
        if ($retryAfter > 0) {
            return Response::json([
                'message' => 'Tunggu ' . $retryAfter . ' detik sebelum mengirim ulang email reset password.',
                'retryAfter' => $retryAfter,
            ], 429);
        }

        $rawToken = $this->tokens->random();
        $user = $this->users->setPasswordResetToken(
            (int) $user['id'],
            $this->tokens->hash($rawToken),
            Clock::afterMinutes(60),
        ) ?? $user;
        try {
            if (!$this->mail->sendPasswordReset($user, $rawToken)) {
                throw new \RuntimeException('SMTP disabled');
            }
        } catch (\Throwable) {
            return Response::json(['message' => 'Email reset password gagal dikirim. Pastikan Mailpit atau SMTP berjalan.'], 503);
        }
        $this->logs->record('password_reset_requested', true, (int) $user['id'], $email);
        return Response::json(['message' => 'Tautan pemulihan telah dikirim ke email Anda.', 'retryAfter' => 60]);
    }

    public function resendVerificationEmail(Request $request): Response
    {
        $email = strtolower(trim((string) ($request->json()['email'] ?? '')));
        if ($email === '') {
            return Response::json(['message' => 'Email wajib diisi.'], 422);
        }
        if (!AuthValidator::email($email)) {
            return Response::json(['message' => 'Format email tidak valid.'], 422);
        }

        $user = $this->users->findByEmail($email);
        if (!$user || !empty($user['email_verified_at'])) {
            return Response::json(['message' => 'Jika email terdaftar dan belum terverifikasi, email verifikasi akan dikirim ulang.', 'retryAfter' => 60]);
        }
        $retryAfter = $this->retryAfterSeconds($user['verification_sent_at'] ?? null, 60);
        if ($retryAfter > 0) {
            return Response::json([
                'message' => 'Tunggu ' . $retryAfter . ' detik sebelum mengirim ulang email verifikasi.',
                'retryAfter' => $retryAfter,
            ], 429);
        }

        $rawToken = $this->tokens->random();
        $user = $this->users->adminSetVerificationToken((int) $user['id'], $this->tokens->hash($rawToken)) ?? $user;
        try {
            if (!$this->mail->sendVerification($user, $rawToken)) {
                throw new \RuntimeException('SMTP disabled');
            }
        } catch (\Throwable) {
            return Response::json(['message' => 'Email verifikasi gagal dikirim. Pastikan konfigurasi SMTP benar.'], 503);
        }
        $this->logs->record('verification_resent', true, (int) $user['id'], $email);
        return Response::json(['message' => 'Email verifikasi telah dikirim ulang. Cek inbox, spam, atau quarantine.', 'retryAfter' => 60]);
    }

    private function retryAfterSeconds(?string $sentAt, int $cooldownSeconds): int
    {
        if (!$sentAt) {
            return 0;
        }
        $sentTimestamp = strtotime($sentAt);
        if ($sentTimestamp === false) {
            return 0;
        }
        $remaining = $cooldownSeconds - (time() - $sentTimestamp);
        return $remaining > 0 ? $remaining : 0;
    }

    public function confirmPasswordReset(Request $request): Response
    {
        $input = $request->json();
        $token = trim((string) ($input['token'] ?? ''));
        $password = (string) ($input['password'] ?? '');
        if ($token === '' || $password === '') {
            return Response::json(['message' => 'Token dan kata sandi baru wajib diisi.'], 422);
        }
        if (!AuthValidator::password($password)) {
            return Response::json(['message' => 'Kata sandi minimal 8 karakter dengan kombinasi huruf, angka, dan simbol.'], 422);
        }
        $user = $this->users->resetPassword($token, $this->tokens->hash($token), $this->passwords->hash($password));
        if (!$user) {
            return Response::json(['message' => 'Token reset password tidak valid atau sudah kedaluwarsa.'], 404);
        }
        $this->logs->record('password_reset_success', true, (int) $user['id'], (string) $user['email']);
        return Response::json(['message' => 'Password berhasil direset. Silakan login dengan password baru.']);
    }

    public function availability(Request $request): Response
    {
        $input = $request->method === 'POST' ? $request->json() : [];
        $email = strtolower(trim((string) ($request->query['email'] ?? $input['email'] ?? '')));
        $whatsapp = AuthValidator::normalizeWhatsapp((string) ($request->query['whatsapp'] ?? $input['whatsapp'] ?? ''));
        $result = [];
        if ($email !== '') {
            if (!AuthValidator::email($email)) {
                return Response::json(['message' => 'Format email tidak valid.'], 422);
            }
            $result['emailAvailable'] = $this->users->findAnyByEmail($email) === null;
        }
        if ($whatsapp !== '') {
            if (!AuthValidator::whatsapp($whatsapp)) {
                return Response::json(['message' => 'Nomor WhatsApp harus memakai kode negara dan berisi 8-15 digit.'], 422);
            }
            $result['whatsappAvailable'] = $this->users->findAnyByWhatsapp($whatsapp) === null;
        }
        return Response::json($result);
    }

    public function updateProfile(Request $request): Response
    {
        $sessionUser = $this->sessions->user($request);
        if (!$sessionUser) {
            return Response::json(['message' => 'Sesi user tidak valid. Silakan login ulang.'], 401);
        }
        $input = $request->json();
        $name = trim((string) ($input['name'] ?? $input['fullName'] ?? $input['full_name'] ?? ''));
        if ($name === '') {
            return Response::json(['message' => 'Nama lengkap wajib diisi.'], 422);
        }
        $userId = (int) $sessionUser['id'];
        $username = trim((string) ($input['username'] ?? ''));
        $whatsapp = AuthValidator::normalizeWhatsapp((string) ($input['whatsapp'] ?? ''));
        if ($whatsapp !== '' && !AuthValidator::whatsapp($whatsapp)) {
            return Response::json(['message' => 'Nomor WhatsApp harus memakai kode negara dan berisi 8-15 digit.'], 422);
        }
        $otherWhatsapp = $whatsapp !== '' ? $this->users->findByWhatsapp($whatsapp) : null;
        if ($otherWhatsapp && (int) $otherWhatsapp['id'] !== $userId) {
            return Response::json(['message' => 'Nomor WhatsApp sudah terdaftar.'], 409);
        }
        $otherUsername = $username !== '' ? $this->users->findByUsername($username) : null;
        if ($otherUsername && (int) $otherUsername['id'] !== $userId) {
            return Response::json(['message' => 'Username sudah digunakan.'], 409);
        }
        $user = $this->users->updateProfile($userId, [
            'name' => $name,
            'username' => $username,
            'nickname' => trim((string) ($input['nickname'] ?? '')),
            'whatsapp' => $whatsapp,
            'occupation' => trim((string) ($input['occupation'] ?? '')),
            'institution_name' => trim((string) ($input['institutionName'] ?? $input['institution_name'] ?? '')),
            'profile_image' => trim((string) ($input['profileImage'] ?? $input['profile_image'] ?? '')),
        ]);
        if (!$user) {
            return Response::json(['message' => 'User tidak ditemukan.'], 404);
        }
        $this->logs->record('profile_updated', true, (int) $user['id'], (string) $user['email']);
        $this->mqtt->publish('users/' . (int) $user['id'] . '/notifications', [
            'type' => 'profile.updated', 'userId' => (int) $user['id'], 'updatedAt' => Clock::now(),
        ]);
        return Response::json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => AuthSessionService::publicUser($user),
        ]);
    }
}
