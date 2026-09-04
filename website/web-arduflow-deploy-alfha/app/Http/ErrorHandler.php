<?php

declare(strict_types=1);

namespace Arduflow\Api\Http;

final class ErrorHandler
{
    public function __construct(private readonly string $logPath)
    {
    }

    public function register(): void
    {
        set_error_handler(static function (int $severity, string $message, string $file, int $line): never {
            throw new \ErrorException($message, 0, $severity, $file, $line);
        });
    }

    public function render(\Throwable $exception): Response
    {
        if ($exception instanceof HttpException) {
            return Response::json(['message' => $exception->getMessage()], $exception->status);
        }

        $directory = dirname($this->logPath);
        if (!is_dir($directory)) {
            mkdir($directory, 0775, true);
        }
        $entry = sprintf(
            "[%s] %s: %s in %s:%d%s",
            gmdate('c'),
            $exception::class,
            $exception->getMessage(),
            $exception->getFile(),
            $exception->getLine(),
            PHP_EOL,
        );
        error_log($entry, 3, $this->logPath);

        return Response::json(['message' => 'Terjadi kesalahan server.'], 500);
    }
}
