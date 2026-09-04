<?php

declare(strict_types=1);

use Arduflow\Api\Database\SqliteMigrator;

$context = require dirname(__DIR__) . '/bootstrap/context.php';
$pdo = $context['connections']->sqlite();
$applied = (new SqliteMigrator($context['root'] . '/migrations/sqlite'))->migrate($pdo);
$tables = $pdo->query(
    "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
)->fetchColumn();

echo json_encode([
    'status' => 'ok',
    'database' => 'sqlite',
    'migrations_applied' => $applied,
    'tables' => (int) $tables,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
