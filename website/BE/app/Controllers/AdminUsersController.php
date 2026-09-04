<?php

declare(strict_types=1);

namespace Arduflow\Api\Controllers;

use Arduflow\Api\Http\Request;
use Arduflow\Api\Http\Response;
use Arduflow\Api\Repositories\UserRepository;
use Arduflow\Api\Security\TokenService;
use Arduflow\Api\Services\AuthSessionService;
use Arduflow\Api\Services\MailService;

final class AdminUsersController
{
    public function __construct(
        private readonly AuthSessionService $sessions,
        private readonly UserRepository $users,
        private readonly TokenService $tokens,
        private readonly MailService $mail,
    ) {
    }

    public function index(Request $request): Response
    {
        $admin = $this->sessions->admin($request);
        if (!$admin) {
            return Response::json([
                'success' => false,
                'message' => 'Sesi admin tidak valid atau sudah kedaluwarsa.',
            ], 401);
        }

        $filters = [
            'search' => (string) ($request->query['search'] ?? ''),
            'emailStatus' => (string) ($request->query['emailStatus'] ?? ''),
            'occupation' => (string) ($request->query['occupation'] ?? ''),
            'dateFrom' => (string) ($request->query['dateFrom'] ?? ''),
            'dateTo' => (string) ($request->query['dateTo'] ?? ''),
            'page' => (int) ($request->query['page'] ?? 1),
            'perPage' => (int) ($request->query['perPage'] ?? 10),
        ];
        $index = $this->users->adminIndex($filters);
        $data = [
            ...$index,
            'summary' => $this->users->adminSummary(),
            'problems' => $this->users->adminProblems(),
            'activities' => $this->users->adminActivities(),
        ];

        return Response::json([
            'success' => true,
            ...$data,
            'data' => $data,
        ]);
    }

    public function updateStatus(Request $request): Response
    {
        $admin = $this->sessions->admin($request);
        if (!$admin) {
            return Response::json([
                'success' => false,
                'message' => 'Sesi admin tidak valid atau sudah kedaluwarsa.',
            ], 401);
        }

        $id = (int) $request->route('id');
        $input = $request->json();
        if ($id <= 0 || !array_key_exists('isActive', $input)) {
            return Response::json([
                'success' => false,
                'message' => 'ID user dan status akun wajib diisi.',
            ], 422);
        }

        $user = $this->users->setActiveStatus($id, (bool) $input['isActive']);
        if (!$user) {
            return Response::json([
                'success' => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        return Response::json([
            'success' => true,
            'message' => (bool) $input['isActive'] ? 'Akun user berhasil diaktifkan.' : 'Akun user berhasil dinonaktifkan.',
            'user' => $user,
        ]);
    }

    public function delete(Request $request): Response
    {
        $admin = $this->sessions->admin($request);
        if (!$admin) {
            return Response::json([
                'success' => false,
                'message' => 'Sesi admin tidak valid atau sudah kedaluwarsa.',
            ], 401);
        }

        $id = (int) $request->route('id');
        if ($id <= 0) {
            return Response::json([
                'success' => false,
                'message' => 'ID user tidak valid.',
            ], 422);
        }

        if (!$this->users->softDelete($id)) {
            return Response::json([
                'success' => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        return Response::json([
            'success' => true,
            'message' => 'Akun user berhasil dihapus.',
        ]);
    }

    public function verifyEmail(Request $request): Response
    {
        if (!$this->sessions->admin($request)) {
            return Response::json([
                'success' => false,
                'message' => 'Sesi admin tidak valid atau sudah kedaluwarsa.',
            ], 401);
        }

        $id = (int) $request->route('id');
        if ($id <= 0) {
            return Response::json([
                'success' => false,
                'message' => 'ID user tidak valid.',
            ], 422);
        }

        $user = $this->users->adminVerifyEmail($id);
        if (!$user) {
            return Response::json([
                'success' => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        return Response::json([
            'success' => true,
            'message' => 'Email user berhasil diverifikasi manual.',
            'user' => $user,
        ]);
    }

    public function resendVerification(Request $request): Response
    {
        if (!$this->sessions->admin($request)) {
            return Response::json([
                'success' => false,
                'message' => 'Sesi admin tidak valid atau sudah kedaluwarsa.',
            ], 401);
        }

        $id = (int) $request->route('id');
        if ($id <= 0) {
            return Response::json([
                'success' => false,
                'message' => 'ID user tidak valid.',
            ], 422);
        }

        $rawToken = $this->tokens->random();
        $user = $this->users->adminSetVerificationToken($id, $this->tokens->hash($rawToken));
        if (!$user) {
            return Response::json([
                'success' => false,
                'message' => 'User tidak ditemukan.',
            ], 404);
        }
        $emailSent = false;
        try {
            $emailSent = $this->mail->sendVerification($user, $rawToken);
        } catch (\Throwable) {
            $emailSent = false;
        }

        return Response::json([
            'success' => true,
            'message' => $emailSent
                ? 'Email verifikasi berhasil dikirim ulang.'
                : 'Token verifikasi baru berhasil dibuat, tetapi email tidak terkirim. Salin link verifikasi secara manual.',
            'emailSent' => $emailSent,
            'token' => $rawToken,
            'verifyUrl' => '/verify-email?token=' . rawurlencode($rawToken),
            'user' => $user,
        ]);
    }

    public function clearVerificationTokens(Request $request): Response
    {
        if (!$this->sessions->admin($request)) {
            return Response::json([
                'success' => false,
                'message' => 'Sesi admin tidak valid atau sudah kedaluwarsa.',
            ], 401);
        }

        $count = $this->users->adminClearUnverifiedTokens();

        return Response::json([
            'success' => true,
            'message' => 'Token verifikasi belum terpakai berhasil dibersihkan.',
            'count' => $count,
        ]);
    }
}
