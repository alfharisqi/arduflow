<?php

declare(strict_types=1);

namespace Arduflow\Api\Services;

use Arduflow\Api\Repositories\SyncOutboxRepository;
use Arduflow\Api\Security\SyncSecurity;
use Arduflow\Api\Support\Config;
use Arduflow\Api\Support\Uuid;

final class SqliteToMysqlSyncService
{
    private readonly \Closure $transport;

    public function __construct(
        private readonly Config $config,
        private readonly SyncOutboxRepository $outbox,
        private readonly SyncSecurity $security,
        ?callable $transport = null,
        private readonly ?MqttService $mqtt = null,
    ) {
        $client = new SyncHttpClient();
        $this->transport = $transport !== null
            ? \Closure::fromCallable($transport)
            : static fn (string $url, string $body, array $headers, int $timeout): array =>
                $client->post($url, $body, $headers, $timeout);
    }

    public function run(): array
    {
        if (!(bool) $this->config->get('sync.enabled', true)) {
            return ['skipped' => true, 'reason' => 'disabled', 'total' => 0, 'success' => 0, 'failed' => 0];
        }
        if (
            trim((string) $this->config->get('sync.api_url', '')) === '' ||
            trim((string) $this->config->get('sync.api_token', '')) === '' ||
            trim((string) $this->config->get('sync.hmac_secret', '')) === ''
        ) {
            throw new \RuntimeException('SYNC_API_URL, SYNC_API_TOKEN, dan SYNC_HMAC_SECRET wajib dikonfigurasi.');
        }

        $workerId = Uuid::v4();
        $batchId = Uuid::v4();
        $startedAt = microtime(true);
        $events = $this->outbox->claim(
            $workerId,
            (int) $this->config->get('sync.batch_size', 250),
            (int) $this->config->get('sync.processing_timeout_minutes', 15),
        );
        if ($events === []) {
            $this->outbox->createLog($batchId, 0);
            $this->outbox->finishLog(
                $batchId,
                0,
                0,
                (int) round((microtime(true) - $startedAt) * 1000),
                'not_attempted',
                'Tidak ada event pending.',
            );
            $result = compact('batchId', 'workerId') + ['skipped' => false, 'total' => 0, 'success' => 0, 'failed' => 0];
            $this->publishSyncEvent('completed', $result, 'not_attempted');
            return $result;
        }

        $this->outbox->createLog($batchId, count($events));
        $payloadEvents = [];
        $processableEvents = [];
        $failed = 0;
        foreach ($events as $event) {
            try {
                $payload = json_decode((string) $event['payload'], true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException $exception) {
                $this->outbox->markFailed($event, 'Payload outbox bukan JSON valid.', false);
                $failed++;
                continue;
            }
            $processableEvents[] = $event;
            $payloadEvents[] = [
                'eventId' => $event['event_id'],
                'tableName' => $event['table_name'],
                'rowId' => $event['row_id'],
                'operation' => $event['operation'],
                'payload' => $payload,
                'version' => (int) $event['version'],
            ];
        }
        if ($processableEvents === []) {
            $this->outbox->finishLog(
                $batchId,
                0,
                $failed,
                (int) round((microtime(true) - $startedAt) * 1000),
                'not_attempted',
                'Tidak ada payload outbox yang valid.',
            );
            return compact('batchId', 'workerId', 'failed') + ['total' => count($events), 'success' => 0];
        }
        $rawBody = (string) json_encode(
            ['batchId' => $batchId, 'events' => $payloadEvents],
            JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
        );
        $timestamp = (string) time();
        $nonce = rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');
        $headers = [
            'Authorization' => 'Bearer ' . (string) $this->config->get('sync.api_token'),
            'Content-Type' => 'application/json',
            'X-Sync-Timestamp' => $timestamp,
            'X-Sync-Nonce' => $nonce,
            'X-Sync-Signature' => $this->security->signature($timestamp, $nonce, $rawBody),
        ];

        try {
            $response = ($this->transport)(
                (string) $this->config->get('sync.api_url'),
                $rawBody,
                $headers,
                (int) $this->config->get('sync.http_timeout_seconds', 30),
            );
            $statusCode = (int) ($response['statusCode'] ?? 0);
            if ($statusCode < 200 || $statusCode >= 300) {
                throw new \RuntimeException((string) ($response['body']['message'] ?? "Sync API merespons HTTP {$statusCode}."));
            }
        } catch (\Throwable $exception) {
            $error = $this->conciseError($exception);
            foreach ($processableEvents as $event) {
                $this->outbox->markFailed($event, $error, true);
            }
            $totalFailed = $failed + count($processableEvents);
            $this->outbox->finishLog(
                $batchId,
                0,
                $totalFailed,
                (int) round((microtime(true) - $startedAt) * 1000),
                'unreachable',
                $error,
            );
            $result = compact('batchId', 'workerId') + [
                'total' => count($events),
                'success' => 0,
                'failed' => $totalFailed,
                'error' => $error,
            ];
            $this->publishSyncEvent('failed', $result, 'unreachable');
            return $result;
        }

        $results = [];
        foreach ((array) ($response['body']['results'] ?? []) as $result) {
            if (is_array($result) && isset($result['eventId'])) {
                $results[(string) $result['eventId']] = $result;
            }
        }
        $success = 0;
        foreach ($processableEvents as $event) {
            $result = $results[(string) $event['event_id']] ?? null;
            if ($result && in_array((string) ($result['status'] ?? ''), ['synced', 'already_processed', 'stale_ignored'], true)) {
                $this->outbox->markSynced($event);
                $success++;
                continue;
            }
            $this->outbox->markFailed(
                $event,
                (string) ($result['error'] ?? 'Sync API tidak mengembalikan hasil event.'),
                ($result['retryable'] ?? true) !== false,
            );
            $failed++;
        }
        $this->outbox->finishLog(
            $batchId,
            $success,
            $failed,
            (int) round((microtime(true) - $startedAt) * 1000),
            'reachable',
            $failed > 0 ? 'Sebagian event gagal disinkronkan.' : null,
        );
        $result = compact('batchId', 'workerId', 'success', 'failed') + ['total' => count($events)];
        $this->publishSyncEvent($failed > 0 ? 'partial_failed' : 'completed', $result, 'reachable');
        return $result;
    }

    private function conciseError(\Throwable $exception): string
    {
        return substr(trim($exception->getMessage()) ?: 'Sinkronisasi gagal.', 0, 500);
    }

    private function publishSyncEvent(string $status, array $result, string $mysqlStatus): void
    {
        $this->mqtt?->publish('admin/database/sync', [
            'type' => 'database.sync.' . $status,
            'status' => $status,
            'mysqlStatus' => $mysqlStatus,
            'result' => $result,
            'publishedAt' => gmdate('c'),
        ]);
    }
}
