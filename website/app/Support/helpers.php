<?php

function base_path(string $path = ''): string
{
    $base = dirname(__DIR__, 2);
    return $path === '' ? $base : $base . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
}

function public_path(string $path = ''): string
{
    $base = base_path('public');
    return $path === '' ? $base : $base . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
}

function env(string $key, mixed $default = null): mixed
{
    static $loaded = false;

    if (!$loaded) {
        $file = base_path('.env');
        if (is_file($file)) {
            foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                    continue;
                }
                [$name, $value] = explode('=', $line, 2);
                $_ENV[trim($name)] = trim($value, " \t\n\r\0\x0B\"'");
            }
        }
        $loaded = true;
    }

    return $_ENV[$key] ?? getenv($key) ?: $default;
}

function e(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function url(string $path): string
{
    return '/' . ltrim($path, '/');
}

function active(string $path): string
{
    $current = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    return rtrim($current, '/') === rtrim('/' . trim($path, '/'), '/') ? 'active' : '';
}
