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
use Arduflow\Api\Support\Clock;
use Arduflow\Api\Validation\AuthValidator;

final class UserAuthController
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly AuthLogRepository $logs,
        private readonly PasswordHasher $passwords,
        private readonly TokenService $tokens,
        private readonly AuthSessionService $sessions,
        private readonly MailService $mail,
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
        if ($this->users->findByEmail($email)) {
            return Response::json(['message' => 'Email sudah terdaftar.'], 409);
        }
        if ($this->users->findByWhatsapp($whatsapp)) {
            return Response::json(['message' => 'Nomor WhatsApp sudah terdaftar.'], 409);
        }

        $rawVerificationToken = $this->tokens->random();
        $user = $this->users->create([
            'name' => $name,
            'email' => $email,
            'whatsapp' => $whatsapp,
            'occupation' => $occupation,
            'password_hash' => $this->passwords->hash($password),
            'verification_token' => $this->tokens->hash($rawVerificationToken),
        ]);
        $this->logs->record('register_success', true, (int) $user['id'], $email);

        $sent = false;
        try {
            $sent = $this->mail->sendVerification($user, $rawVerificationToken);
        } catch (\Throwable) {
            $sent = false;
        }

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
        if ($token === '') {
            return Response::json(['message' => 'Token verifikasi wajib diisi.'], 422);
        }
        $user = $this->users->verifyEmail($token, $this->tokens->hash($token));
        if (!$user) {
            return Response::json(['message' => 'Token verifikasi tidak valid.'], 404);
        }
        $this->logs->record('email_verified', true, (int) $user['id'], (string) $user['email']);
        return Response::json([
            'message' => 'Email berhasil diverifikasi.',
            'user' => AuthSessionService::publicUser($user),
        ]);
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
            return Response::json(['message' => 'Jika email terdaftar, tautan pemulihan akan dikirim ke inbox atau spam.']);
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
        return Response::json(['message' => 'Tautan pemulihan telah dikirim ke email Anda.']);
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
            $result['emailAvailable'] = $this->users->findByEmail($email) === null;
        }
        if ($whatsapp !== '') {
            if (!AuthValidator::whatsapp($whatsapp)) {
                return Response::json(['message' => 'Nomor WhatsApp harus memakai kode negara dan berisi 8-15 digit.'], 422);
            }
            $result['whatsappAvailable'] = $this->users->findByWhatsapp($whatsapp) === null;
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
        return Response::json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => AuthSessionService::publicUser($user),
        ]);
    }
}
