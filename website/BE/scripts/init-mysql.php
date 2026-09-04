<?php

declare(strict_types=1);

use Arduflow\Api\Database\MysqlMigrator;

$context = require dirname(__DIR__) . '/bootstrap/context.php';
$migrator = new MysqlMigrator(
    $context['connections'],
    $context['config'],
    $context['root'] . '/migrations/mysql',
);

$applied = $migrator->migrate();
echo json_encode([
    'status' => 'ok',
    'database' => (string) $context['config']->get('database.mysql.database'),
    'migrations_applied' => $applied,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
