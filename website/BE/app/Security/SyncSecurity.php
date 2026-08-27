<?php

declare(strict_types=1);

namespace Arduflow\Api\Security;

use Arduflow\Api\Database\Transaction;
use Arduflow\Api\Http\Request;
use Arduflow\Api\Support\Config;
use PDO;

final class SyncSecurity
{
    public function __construct(
        private readonly Config $config,
        private readonly ?PDO $sqlite = null,
    ) {
    }

    public function signature(string $timestamp, string $nonce, string $rawBody): string
    {
        return hash_hmac(
            'sha256',
            $timestamp . "\n" . $nonce . "\n" . $rawBody,
            (string) $this->config->get('sync.hmac_secret', ''),
        );
    }

    public function verify(Request $request, ?int $now = null): array
    {
        $token = (string) $this->config->get('sync.api_token', '');
        $secret = (string) $this->config->get('sync.hmac_secret', '');
        if ($token === '' || $secret === '') {
            return $this->failure(503, 'Sinkronisasi belum dikonfigurasi.');
        }

        $allowlist = (array) $this->config->get('sync.ip_allowlist', []);
        if ($allowlist !== [] && !in_array($request->clientIp, $allowlist, true)) {
            return $this->failure(403, 'Alamat pengirim tidak diizinkan.');
        }
        if (!$this->withinRateLimit($request->clientIp ?: 'unknown', $now ?? time())) {
            return $this->failure(429, 'Terlalu banyak request sinkronisasi.');
        }

        $authorization = trim((string) $request->header('authorization', ''));
        $incomingToken = str_starts_with(strtolower($authorization), 'bearer ')
            ? trim(substr($authorization, 7))
            : '';
        if (!$this->safeEquals($token, $incomingToken)) {
            return $this->failure(401, 'Token sinkronisasi tidak valid.');
        }

        $timestamp = trim((string) $request->header('x-sync-timestamp', ''));
        $nonce = trim((string) $request->header('x-sync-nonce', ''));
        $signature = strtolower(trim((string) $request->header('x-sync-signature', '')));
        $current = $now ?? time();
        if ($timestamp === '' || !ctype_digit($timestamp)) {
            return $this->failure(401, 'Timestamp sinkronisasi kedaluwarsa.');
        }
        $skew = abs($current - (int) $timestamp);
        if ($skew > (int) $this->config->get('sync.max_clock_skew_seconds', 300)) {
            return $this->failure(401, 'Timestamp sinkronisasi kedaluwarsa.');
        }
        if (preg_match('/^[A-Za-z0-9_-]{16,128}$/', $nonce) !== 1) {
            return $this->failure(422, 'Nonce sinkronisasi tidak valid.');
        }

        $expected = $this->signature($timestamp, $nonce, $request->rawBody);
        if (preg_match('/^[a-f0-9]{64}$/', $signature) !== 1 || !$this->safeEquals($expected, $signature)) {
            return $this->failure(401, 'Signature sinkronisasi tidak valid.');
        }
        return ['ok' => true, 'timestamp' => $timestamp, 'nonce' => $nonce];
    }

    private function withinRateLimit(string $clientKey, int $now): bool
    {
        if (!$this->sqlite instanceof PDO) {
            return true;
        }

        return Transaction::immediate($this->sqlite, function () use ($clientKey, $now): bool {
            $statement = $this->sqlite->prepare(
                'SELECT window_started_at, request_count FROM sync_rate_limits WHERE client_key = :client_key'
            );
            $statement->execute(['client_key' => $clientKey]);
            $current = $statement->fetch();
            if (!$current || (int) $current['window_started_at'] <= $now - 60) {
                $this->sqlite->prepare(
                    'INSERT INTO sync_rate_limits (client_key, window_started_at, request_count) VALUES (:key, :started, 1) ' .
                    'ON CONFLICT(client_key) DO UPDATE SET window_started_at = excluded.window_started_at, request_count = 1'
                )->execute(['key' => $clientKey, 'started' => $now]);
                return true;
            }

            $count = (int) $current['request_count'] + 1;
            $this->sqlite->prepare(
                'UPDATE sync_rate_limits SET request_count = :count WHERE client_key = :client_key'
            )->execute(['count' => $count, 'client_key' => $clientKey]);
            return $count <= 30;
        });
    }

    private function safeEquals(string $expected, string $actual): bool
    {
        return strlen($expected) === strlen($actual) && hash_equals($expected, $actual);
    }

    private function failure(int $status, string $message): array
    {
        return ['ok' => false, 'status' => $status, 'message' => $message];
    }
}
