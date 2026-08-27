<?php

declare(strict_types=1);

namespace Arduflow\Api\Controllers;

use Arduflow\Api\Http\Request;
use Arduflow\Api\Http\Response;
use Arduflow\Api\Services\AuthSessionService;
use Arduflow\Api\Support\Config;

final class AdminRealtimeController
{
    public function __construct(
        private readonly AuthSessionService $sessions,
        private readonly Config $config,
    ) {
    }

    public function mqtt(Request $request): Response
    {
        if (!$this->sessions->admin($request)) {
            return Response::json(['message' => 'Akses admin diperlukan.'], 401);
        }

        $prefix = trim((string) $this->config->get('mqtt.topic_prefix', 'arduflow'), '/');
        $topics = [
            "{$prefix}/admin/database/sync",
            "{$prefix}/admin/transactions",
            "{$prefix}/admin/projects",
            "{$prefix}/admin/system",
        ];

        return Response::json([
            'enabled' => (bool) $this->config->get('mqtt.enabled', false),
            'websocket_url' => (string) $this->config->get('mqtt.websocket_url', 'ws://127.0.0.1:9001/mqtt'),
            'client_id' => 'arduflow-admin-' . bin2hex(random_bytes(4)),
            'username' => (string) $this->config->get('mqtt.browser_username', ''),
            'password' => (string) $this->config->get('mqtt.browser_password', ''),
            'topics' => $topics,
        ]);
    }
}
