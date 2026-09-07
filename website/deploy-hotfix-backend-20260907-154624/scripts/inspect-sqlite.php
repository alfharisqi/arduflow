<?php

declare(strict_types=1);

$context = require dirname(__DIR__) . '/bootstrap/context.php';
$pdo = $context['connections']->sqlite();

$pragmas = [
    'journal_mode' => (string) $pdo->query('PRAGMA journal_mode')->fetchColumn(),
    'foreign_keys' => (int) $pdo->query('PRAGMA foreign_keys')->fetchColumn(),
    'busy_timeout' => (int) $pdo->query('PRAGMA busy_timeout')->fetchColumn(),
    'synchronous' => (int) $pdo->query('PRAGMA synchronous')->fetchColumn(),
    'quick_check' => (string) $pdo->query('PRAGMA quick_check')->fetchColumn(),
];
$tables = $pdo->query(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
)->fetchAll(PDO::FETCH_COLUMN);

echo json_encode([
    'pragmas' => $pragmas,
    'tables' => $tables,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
