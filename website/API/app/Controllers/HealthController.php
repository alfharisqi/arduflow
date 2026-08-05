<?php

declare(strict_types=1);

namespace Arduflow\Api\Controllers;

use Arduflow\Api\Http\Request;
use Arduflow\Api\Http\Response;
use Arduflow\Api\Repositories\SyncStatusRepository;
use Arduflow\Api\Services\DatabaseHealthService;

final class HealthController
{
    public function __construct(
        private readonly SyncStatusRepository $syncStatus,
        private readonly DatabaseHealthService $databaseHealth,
    ) {
    }

    public function basic(Request $request): Response
    {
        $sync = $this->syncStatus->summary();
        return Response::json([
            'status' => 'ok',
            'primary_database' => 'sqlite',
            'pending_sync_events' => $sync['pending'],
        ]);
    }

    public function database(Request $request): Response
    {
        return Response::json($this->databaseHealth->inspect());
    }
}
