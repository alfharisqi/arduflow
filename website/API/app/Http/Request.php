<?php

declare(strict_types=1);

namespace Arduflow\Api\Http;

final class Request
{
    private array $routeParams = [];

    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query,
        public readonly array $headers,
        public readonly string $rawBody,
    ) {
    }

    public static function fromGlobals(): self
    {
        $headers = function_exists('getallheaders') ? (getallheaders() ?: []) : self::headersFromServer($_SERVER);
        $normalizedHeaders = [];
        foreach ($headers as $name => $value) {
            $normalizedHeaders[strtolower((string) $name)] = (string) $value;
        }

        $uri = (string) ($_SERVER['REQUEST_URI'] ?? '/');
        return new self(
            strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')),
            rtrim((string) (parse_url($uri, PHP_URL_PATH) ?: '/'), '/') ?: '/',
            $_GET,
            $normalizedHeaders,
            (string) (file_get_contents('php://input') ?: ''),
        );
    }

    public function header(string $name, ?string $default = null): ?string
    {
        return $this->headers[strtolower($name)] ?? $default;
    }

    public function json(): array
    {
        if ($this->rawBody === '') {
            return [];
        }

        try {
            $decoded = json_decode($this->rawBody, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new HttpException(400, 'Payload JSON tidak valid.');
        }

        if (!is_array($decoded)) {
            throw new HttpException(400, 'Payload JSON harus berupa object.');
        }

        return $decoded;
    }

    public function setRouteParams(array $params): void
    {
        $this->routeParams = $params;
    }

    public function route(string $key, mixed $default = null): mixed
    {
        return $this->routeParams[$key] ?? $default;
    }

    private static function headersFromServer(array $server): array
    {
        $headers = [];
        foreach ($server as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
                $headers[$name] = $value;
            }
        }
        return $headers;
    }
}
