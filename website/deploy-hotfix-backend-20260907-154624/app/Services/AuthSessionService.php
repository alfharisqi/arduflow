<?php

declare(strict_types=1);

namespace Arduflow\Api\Services;

use Arduflow\Api\Http\Request;
use Arduflow\Api\Repositories\AdminRepository;
use Arduflow\Api\Repositories\UserRepository;
use Arduflow\Api\Security\TokenService;

final class AuthSessionService
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly AdminRepository $admins,
        private readonly TokenService $tokens,
    ) {
    }

    public function user(Request $request): ?array
    {
        $token = $this->tokens->bearer($request);
        return $token === '' ? null : $this->users->findBySessionHash($this->tokens->hash($token));
    }

    public function admin(Request $request): ?array
    {
        $token = $this->tokens->bearer($request);
        return $token === '' ? null : $this->admins->findBySessionHash($this->tokens->hash($token));
    }

    public static function publicUser(array $user): array
    {
        return [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'username' => $user['username'] ?? null,
            'nickname' => $user['nickname'] ?? null,
            'email' => $user['email'],
            'whatsapp' => $user['whatsapp'] ?? null,
            'occupation' => $user['occupation'] ?? null,
            'institutionName' => $user['institution_name'] ?? null,
            'profileImage' => $user['profile_image'] ?? null,
            'emailVerified' => !empty($user['email_verified_at']),
        ];
    }

    public static function publicAdmin(array $admin): array
    {
        return [
            'id' => (int) $admin['id'],
            'username' => $admin['username'],
            'name' => $admin['name'],
            'email' => $admin['email'],
            'role' => $admin['role'],
        ];
    }
}
