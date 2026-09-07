<?php

declare(strict_types=1);

namespace Arduflow\Api\Services;

final class SyncHttpClient
{
    public function post(string $url, string $body, array $headers, int $timeoutSeconds): array
    {
        return function_exists('curl_init')
            ? $this->postWithCurl($url, $body, $headers, $timeoutSeconds)
            : $this->postWithStreams($url, $body, $headers, $timeoutSeconds);
    }

    private function postWithCurl(string $url, string $body, array $headers, int $timeoutSeconds): array
    {
        $handle = curl_init($url);
        if ($handle === false) {
            throw new \RuntimeException('HTTP client sinkronisasi tidak dapat dibuat.');
        }
        $headerLines = [];
        foreach ($headers as $name => $value) {
            $headerLines[] = $name . ': ' . $value;
        }
        curl_setopt_array($handle, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headerLines,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_CONNECTTIMEOUT => min(10, $timeoutSeconds),
            CURLOPT_TIMEOUT => $timeoutSeconds,
        ]);
        $raw = curl_exec($handle);
        if ($raw === false) {
            $message = curl_error($handle);
            curl_close($handle);
            throw new \RuntimeException('Sync API tidak dapat dihubungi: ' . $message);
        }
        $statusCode = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
        curl_close($handle);
        return ['statusCode' => $statusCode, 'body' => $this->decode((string) $raw)];
    }

    private function postWithStreams(string $url, string $body, array $headers, int $timeoutSeconds): array
    {
        $headerLines = [];
        foreach ($headers as $name => $value) {
            $headerLines[] = $name . ': ' . $value;
        }
        $context = stream_context_create(['http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headerLines),
            'content' => $body,
            'timeout' => $timeoutSeconds,
            'ignore_errors' => true,
        ]]);
        $raw = @file_get_contents($url, false, $context);
        if ($raw === false) {
            throw new \RuntimeException('Sync API tidak dapat dihubungi.');
        }
        $statusCode = 0;
        foreach ($http_response_header ?? [] as $line) {
            if (preg_match('#^HTTP/\S+\s+(\d{3})#', $line, $match) === 1) {
                $statusCode = (int) $match[1];
            }
        }
        return ['statusCode' => $statusCode, 'body' => $this->decode($raw)];
    }

    private function decode(string $raw): array
    {
        if ($raw === '') {
            return [];
        }
        try {
            $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
            return is_array($decoded) ? $decoded : [];
        } catch (\JsonException) {
            throw new \RuntimeException('Sync API mengembalikan JSON yang tidak valid.');
        }
    }
}
