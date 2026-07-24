<?php

namespace App\Support;

class Router
{
    private array $routes = [];

    public function get(string $path, callable $handler): void
    {
        $this->routes['GET'][$this->normalize($path)] = $handler;
    }

    public function post(string $path, callable $handler): void
    {
        $this->routes['POST'][$this->normalize($path)] = $handler;
    }

    public function dispatch(): void
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $path = $this->normalize(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
        $handler = $this->routes[$method][$path] ?? null;

        if (!$handler) {
            http_response_code(404);
            View::render('NotFound', ['title' => 'Halaman Tidak Ditemukan']);
            return;
        }

        $handler();
    }

    private function normalize(string $path): string
    {
        $path = '/' . trim($path, '/');
        return $path === '/' ? '/' : rtrim($path, '/');
    }
}
