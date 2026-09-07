<?php

declare(strict_types=1);

namespace Arduflow\Api\Controllers;

use Arduflow\Api\Http\HttpException;
use Arduflow\Api\Http\Request;
use Arduflow\Api\Http\Response;
use Arduflow\Api\Security\SyncSecurity;
use Arduflow\Api\Services\MysqlSyncReceiverService;

final class InternalSyncController
{
    public function __construct(
        private readonly SyncSecurity $security,
        private readonly MysqlSyncReceiverService $receiver,
    ) {
    }

    public function receive(Request $request): Response
    {
        $security = $this->security->verify($request);
        if (!$security['ok']) {
            return Response::json(['message' => $security['message']], (int) $security['status']);
        }
        $body = $request->json();
        $events = $body['events'] ?? null;
        if (!is_array($events) || $events === [] || count($events) > 500) {
            return Response::json(['message' => 'Batch sinkronisasi harus berisi 1-500 event.'], 422);
        }
        try {
            $this->receiver->registerNonce((string) $security['nonce']);
        } catch (HttpException $exception) {
            return Response::json(['message' => $exception->getMessage()], $exception->status);
        } catch (\Throwable) {
            return Response::json(['message' => 'MySQL tidak dapat dihubungi.'], 503);
        }
        return Response::json(['results' => $this->receiver->processBatch($events)], 207);
    }
}
