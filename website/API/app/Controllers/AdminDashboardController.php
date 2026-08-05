<?php

declare(strict_types=1);

namespace Arduflow\Api\Controllers;

use Arduflow\Api\Http\Request;
use Arduflow\Api\Http\Response;
use Arduflow\Api\Repositories\AdminDashboardRepository;
use Arduflow\Api\Services\AuthSessionService;

final class AdminDashboardController
{
    public function __construct(
        private readonly AuthSessionService $sessions,
        private readonly AdminDashboardRepository $dashboard,
    ) {
    }

    public function show(Request $request): Response
    {
        $admin = $this->sessions->admin($request);
        return $admin
            ? Response::json($this->dashboard->data($admin))
            : Response::json(['message' => 'Sesi admin tidak valid atau sudah kedaluwarsa.'], 401);
    }
}
