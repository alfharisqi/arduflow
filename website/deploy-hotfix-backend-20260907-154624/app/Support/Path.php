<?php

declare(strict_types=1);

namespace Arduflow\Api\Support;

final class Path
{
    public static function resolve(string $root, string $path): string
    {
        if (preg_match('/^[A-Za-z]:[\\\\\/]/', $path) === 1 || str_starts_with($path, '/')) {
            return self::normalize($path);
        }

        return self::normalize(rtrim($root, '/\\') . DIRECTORY_SEPARATOR . $path);
    }

    public static function normalize(string $path): string
    {
        return str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
    }

    public static function ensurePrivate(string $root, string $path): void
    {
        $public = rtrim(self::normalize($root . '/public'), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
        $target = self::normalize($path);
        if (str_starts_with(strtolower($target), strtolower($public))) {
            throw new \RuntimeException('Database SQLite tidak boleh berada di folder public.');
        }
    }
}
