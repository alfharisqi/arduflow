<?php

declare(strict_types=1);

namespace Arduflow\Api\Controllers;

use Arduflow\Api\Http\Request;
use Arduflow\Api\Http\Response;
use Arduflow\Api\Repositories\AdminRepository;
use Arduflow\Api\Security\PasswordHasher;
use Arduflow\Api\Security\TokenService;
use Arduflow\Api\Services\AuthSessionService;
use Arduflow\Api\Support\Clock;

final class AdminAuthController
{
    public function __construct(
        private readonly AdminRepository $admins,
        private readonly PasswordHasher $passwords,
        private readonly TokenService $tokens,
        private readonly AuthSessionService $sessions,
        private readonly int $sessionHours,
    ) {
    }

    public function login(Request $request): Response
    {
        $input = $request->json();
        $username = trim((string) ($input['username'] ?? $input['email'] ?? ''));
        $password = (string) ($input['password'] ?? '');
        if ($username === '' || $password === '') {
            return Response::json(['message' => 'Username dan password wajib diisi.'], 422);
        }
        $admin = $this->admins->findByUsername($username);
        $check = $admin ? $this->passwords->verify($password, (string) $admin['password_hash']) : null;
        if ($check?->legacyDisabled) {
            return Response::json([
                'message' => 'Password admin lama harus di-seed ulang untuk backend PHP.',
                'code' => 'LEGACY_PASSWORD_RESET_REQUIRED',
            ], 409);
        }
        if (!$admin || !(bool) $admin['is_active'] || !$check?->valid) {
            return Response::json(['message' => 'Username atau password admin salah.'], 401);
        }
        $admin = $this->admins->recordLogin(
            (int) $admin['id'],
            $check->needsRehash ? $this->passwords->hash($password) : null,
        );
        $token = $this->tokens->random();
        $expiresAt = Clock::afterHours($this->sessionHours);
        $this->admins->createSession((int) $admin['id'], $this->tokens->hash($token), $expiresAt);

        return Response::json([
            'message' => 'Login admin berhasil.',
            'admin' => AuthSessionService::publicAdmin($admin),
            'token' => $token,
            'expiresAt' => $expiresAt,
            'redirectTo' => '/admin/dashboard',
        ]);
    }

    public function session(Request $request): Response
    {
        $admin = $this->sessions->admin($request);
        return $admin
            ? Response::json(['admin' => AuthSessionService::publicAdmin($admin)])
            : Response::json(['message' => 'Sesi admin tidak valid atau sudah kedaluwarsa.'], 401);
    }

    public function logout(Request $request): Response
    {
        $token = $this->tokens->bearer($request);
        if ($token !== '') {
            $this->admins->deleteSession($this->tokens->hash($token));
        }
        return Response::json(['message' => 'Logout admin berhasil.']);
    }
}
