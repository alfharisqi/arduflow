<?php

declare(strict_types=1);

namespace Arduflow\Api\Services;

use Arduflow\Api\Database\ConnectionFactory;
use Arduflow\Api\Database\Transaction;
use Arduflow\Api\Repositories\SyncStatusRepository;

final class DatabaseHealthService
{
    public function __construct(
        private readonly ConnectionFactory $connections,
        private readonly SyncStatusRepository $syncStatus,
    ) {
    }

    public function inspect(): array
    {
        $sqlite = $this->connections->sqlite();
        $integrity = (string) $sqlite->query('PRAGMA quick_check')->fetchColumn();
        $writable = false;
        try {
            Transaction::immediate($sqlite, static fn (): bool => true);
            $writable = true;
        } catch (\Throwable) {
            $writable = false;
        }

        $mysqlReachable = false;
        try {
            $mysqlReachable = (int) $this->connections->mysql()->query('SELECT 1')->fetchColumn() === 1;
        } catch (\Throwable) {
            $mysqlReachable = false;
        }

        $sync = $this->syncStatus->summary();
        return [
            'sqlite' => [
                'status' => $integrity === 'ok' ? 'healthy' : 'unhealthy',
                'writable' => $writable,
            ],
            'mysql' => [
                'status' => $mysqlReachable ? 'healthy' : 'unreachable',
                'required_for_user_request' => false,
            ],
            'sync' => [
                'pending' => $sync['pending'],
                'last_success_at' => $sync['last_success_at'],
            ],
        ];
    }
}
