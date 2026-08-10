<?php

declare(strict_types=1);

namespace Arduflow\Api\Controllers;

use Arduflow\Api\Http\Request;
use Arduflow\Api\Http\Response;
use Arduflow\Api\Repositories\UserRepository;
use Arduflow\Api\Services\AuthSessionService;

final class AdminUsersController
{
    public function __construct(
        private readonly AuthSessionService $sessions,
        private readonly UserRepository $users,
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
}
