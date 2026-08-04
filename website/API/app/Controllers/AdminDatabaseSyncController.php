<?php

declare(strict_types=1);

namespace Arduflow\Api\Controllers;

use Arduflow\Api\Database\ConnectionFactory;
use Arduflow\Api\Http\Request;
use Arduflow\Api\Http\Response;
use Arduflow\Api\Repositories\SyncOutboxRepository;
use Arduflow\Api\Repositories\SyncStatusRepository;
use Arduflow\Api\Services\AuthSessionService;
use Arduflow\Api\Services\SqliteToMysqlSyncService;
use Arduflow\Api\Support\Config;

final class AdminDatabaseSyncController
{
    public function __construct(
        private readonly Config $config,
        private readonly ConnectionFactory $connections,
        private readonly AuthSessionService $sessions,
        private readonly SyncStatusRepository $statusRepository,
        private readonly SyncOutboxRepository $outbox,
        private readonly SqliteToMysqlSyncService $worker,
    ) {
    }

    public function status(Request $request): Response
    {
        if (!$this->sessions->admin($request)) {
            return Response::json(['message' => 'Akses admin diperlukan.'], 401);
        }
        $summary = $this->statusRepository->summary();
        return Response::json([
            'enabled' => (bool) $this->config->get('sync.enabled', true),
            'pending' => $summary['pending'],
            'processing' => $summary['processing'],
            'failed' => $summary['failed'],
            'synced_today' => $summary['synced_today'],
            'last_sync_at' => $summary['last_sync_at'],
            'last_success_at' => $summary['last_success_at'],
            'mysql_reachable' => $this->mysqlReachable(),
        ]);
    }

    public function run(Request $request): Response
    {
        if (!$this->sessions->admin($request)) {
            return Response::json(['message' => 'Akses admin diperlukan.'], 401);
        }
        try {
            $result = $this->worker->run();
            return Response::json(['message' => 'Worker sinkronisasi selesai dijalankan.', 'result' => $result]);
        } catch (\Throwable $exception) {
            return Response::json(['message' => $exception->getMessage()], 503);
        }
    }

    public function retryFailed(Request $request): Response
    {
        if (!$this->sessions->admin($request)) {
            return Response::json(['message' => 'Akses admin diperlukan.'], 401);
        }
        $retried = $this->outbox->retryFailed();
        return Response::json(['message' => "{$retried} event dikembalikan ke antrean.", 'retried' => $retried]);
    }

    private function mysqlReachable(): bool
    {
        try {
            return (int) $this->connections->mysql()->query('SELECT 1')->fetchColumn() === 1;
        } catch (\Throwable) {
            return false;
        }
    }
}
