<?php

declare(strict_types=1);

$databaseDirectory = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'database';
$managerScript = $databaseDirectory . DIRECTORY_SEPARATOR . 'sqlite_odbc.php';

if (!is_file($managerScript)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'SQLite Web Manager endpoint belum tersedia di storage/database.',
    ]);
    exit;
}

$previousWorkingDirectory = getcwd();

try {
    chdir($databaseDirectory);
    require $managerScript;
} finally {
    if (is_string($previousWorkingDirectory) && $previousWorkingDirectory !== '') {
        chdir($previousWorkingDirectory);
    }
}
