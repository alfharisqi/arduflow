<?php

declare(strict_types=1);

namespace Arduflow\Api\Database;

use PDO;

final class Transaction
{
    public static function immediate(PDO $pdo, callable $callback): mixed
    {
        $pdo->exec('BEGIN IMMEDIATE');
        try {
            $result = $callback();
            $pdo->exec('COMMIT');
            return $result;
        } catch (\Throwable $exception) {
            try {
                $pdo->exec('ROLLBACK');
            } catch (\Throwable) {
                // Preserve the original exception when SQLite already ended the transaction.
            }
            throw $exception;
        }
    }
}
