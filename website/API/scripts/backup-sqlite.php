<?php

declare(strict_types=1);

use Arduflow\Api\Services\SqliteBackupService;

$context = require dirname(__DIR__) . '/bootstrap/context.php';
$result = (new SqliteBackupService(
    $context['connections']->sqlite(),
    $context['config'],
    $context['root'],
    $context['connections']->sqlitePath(),
))->run();

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
