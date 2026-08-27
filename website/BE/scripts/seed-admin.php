<?php

declare(strict_types=1);

use Arduflow\Api\Database\SqliteMigrator;
use Arduflow\Api\Repositories\AdminRepository;
use Arduflow\Api\Repositories\OutboxRepository;
use Arduflow\Api\Security\PasswordHasher;

$context = require dirname(__DIR__) . '/bootstrap/context.php';
$password = (string) $context['config']->get('admin.seed.password', '');
if ($password === '') {
    fwrite(STDERR, "ADMIN_SEED_PASSWORD wajib diisi pada .env.\n");
    exit(1);
}

$pdo = $context['connections']->sqlite();
(new SqliteMigrator($context['root'] . '/migrations/sqlite'))->migrate($pdo);
$repository = new AdminRepository($pdo, new OutboxRepository());
$hasher = new PasswordHasher(false);
$admin = $repository->upsert([
    'username' => (string) $context['config']->get('admin.seed.username'),
    'password_hash' => $hasher->hash($password),
    'name' => (string) $context['config']->get('admin.seed.name'),
    'email' => (string) $context['config']->get('admin.seed.email'),
    'role' => (string) $context['config']->get('admin.seed.role'),
]);

echo json_encode([
    'status' => 'ok',
    'admin_id' => (int) $admin['id'],
    'username' => $admin['username'],
    'role' => $admin['role'],
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
