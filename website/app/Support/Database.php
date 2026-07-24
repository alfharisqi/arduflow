<?php

namespace App\Support;

use PDO;
use PDOException;

class Database
{
    public static function connection(): PDO
    {
        $config = require base_path('config/database.php');
        $name = $config['default'];
        $connection = $config['connections'][$name] ?? $config['connections']['sqlite'];

        try {
            if ($connection['driver'] === 'mysql') {
                $dsn = sprintf(
                    'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                    $connection['host'],
                    $connection['port'],
                    $connection['database'],
                    $connection['charset']
                );

                return new PDO($dsn, $connection['username'], $connection['password'], self::options());
            }

            $directory = dirname($connection['database']);
            if (!is_dir($directory)) {
                mkdir($directory, 0775, true);
            }

            return new PDO('sqlite:' . $connection['database'], null, null, self::options());
        } catch (PDOException $exception) {
            throw new PDOException('Database connection failed: ' . $exception->getMessage(), (int) $exception->getCode());
        }
    }

    private static function options(): array
    {
        return [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
    }
}
