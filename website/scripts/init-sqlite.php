<?php

require dirname(__DIR__) . '/app/Support/helpers.php';

$envFile = base_path('.env');
if (!is_file($envFile)) {
    copy(base_path('.env.example'), $envFile);
}

$database = base_path(env('DB_SQLITE_PATH', 'storage/sqlite/arduflow.sqlite'));
$directory = dirname($database);

if (!is_dir($directory)) {
    mkdir($directory, 0775, true);
}

$pdo = new PDO('sqlite:' . $database);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec(file_get_contents(base_path('database/sqlite/schema.sql')));

echo "SQLite database initialized: {$database}" . PHP_EOL;
