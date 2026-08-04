<?php

declare(strict_types=1);

namespace Arduflow\Api\Http;

final class Router
{
    private array $routes = [];

    public function get(string $path, callable $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    public function add(string $method, string $path, callable $handler): void
    {
        [$pattern, $params] = $this->compile($path);
        $this->routes[] = compact('method', 'pattern', 'params', 'handler');
    }

    public function dispatch(Request $request): Response
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $request->method || preg_match($route['pattern'], $request->path, $matches) !== 1) {
                continue;
            }

            $params = [];
            foreach ($route['params'] as $name) {
                $params[$name] = urldecode((string) ($matches[$name] ?? ''));
            }
            $request->setRouteParams($params);

            $response = ($route['handler'])($request);
            if (!$response instanceof Response) {
                throw new \LogicException('Route handler harus mengembalikan Response.');
            }
            return $response;
        }

        return Response::json(['message' => 'Endpoint tidak ditemukan.'], 404);
    }

    private function compile(string $path): array
    {
        $params = [];
        $segments = explode('/', trim($path, '/'));
        $compiled = array_map(static function (string $segment) use (&$params): string {
            if (preg_match('/^\{([A-Za-z_][A-Za-z0-9_]*)\}$/', $segment, $match) === 1) {
                $params[] = $match[1];
                return '(?P<' . $match[1] . '>[^/]+)';
            }
            return preg_quote($segment, '#');
        }, $segments);

        $body = $path === '/' ? '' : implode('/', $compiled);
        return ['#^/' . $body . '$#', $params];
    }
}
