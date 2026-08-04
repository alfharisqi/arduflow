<?php

declare(strict_types=1);

use Arduflow\Api\Database\SqliteMigrator;
use Arduflow\Api\Repositories\SyncOutboxRepository;
use Arduflow\Api\Security\SyncSecurity;
use Arduflow\Api\Services\SqliteToMysqlSyncService;

$context = require dirname(__DIR__) . '/bootstrap/context.php';
$sqlite = $context['connections']->sqlite();
(new SqliteMigrator($context['root'] . '/migrations/sqlite'))->migrate($sqlite);

$outbox = new SyncOutboxRepository($sqlite);
$worker = new SqliteToMysqlSyncService(
    $context['config'],
    $outbox,
    new SyncSecurity($context['config'], $sqlite),
);

try {
    $result = $worker->run();
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    exit(((int) ($result['failed'] ?? 0)) > 0 ? 1 : 0);
} catch (Throwable $exception) {
    fwrite(STDERR, json_encode([
        'status' => 'failed',
        'message' => substr($exception->getMessage() ?: 'Sinkronisasi gagal.', 0, 500),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL);
    exit(1);
}
