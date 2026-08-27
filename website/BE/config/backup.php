<?php

declare(strict_types=1);

use Arduflow\Api\Support\Env;

return [
    'enabled' => Env::bool('SQLITE_BACKUP_ENABLED', true),
    'directory' => Env::get('SQLITE_BACKUP_DIRECTORY', 'storage/backups/sqlite'),
    'retention_days' => Env::int('SQLITE_BACKUP_RETENTION_DAYS', 14),
];
