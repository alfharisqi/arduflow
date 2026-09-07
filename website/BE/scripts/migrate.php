<?php

declare(strict_types=1);

use Arduflow\Api\Database\ApiQueryIndexes;
use Arduflow\Api\Database\LegacyApiMigrator;
use Arduflow\Api\Database\SqliteMigrator;

$context = require dirname(__DIR__) . '/bootstrap/context.php';
$root = (string) $context['root'];
$pdo = $context['connections']->sqlite();

$sqlMigrations = (new SqliteMigrator($root . '/migrations/sqlite'))->migrate($pdo);
$legacyMigrator = new LegacyApiMigrator();
$legacyMigrations = $legacyMigrator->migrate($pdo);

$apiIndexes = ApiQueryIndexes::install($pdo);

$certificateDatabase = $root . '/database/arduflow.sqlite';
$certificateMigrated = false;

if (is_file($certificateDatabase)) {
    $certificatePdo = new PDO(
        'sqlite:' . $certificateDatabase,
        null,
        null,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    $certificatePdo->exec('PRAGMA foreign_keys = ON');
    $certificatePdo->exec('PRAGMA busy_timeout = 15000');
    $legacyMigrator->migrateCertificates($certificatePdo);
    $certificateMigrated = true;
}

$pdo->exec('PRAGMA optimize');

echo json_encode([
    'status' => 'ok',
    'sqlite_migrations_applied' => $sqlMigrations,
    'legacy_api_migrations_applied' => $legacyMigrations,
    'api_indexes_created' => count($apiIndexes['created'] ?? []),
    'api_indexes_skipped' => count($apiIndexes['skipped'] ?? []),
    'certificate_database_migrated' => $certificateMigrated,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
