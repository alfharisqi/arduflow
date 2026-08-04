<?php

declare(strict_types=1);

namespace Arduflow\Api;

use Arduflow\Api\Controllers\HealthController;
use Arduflow\Api\Database\ConnectionFactory;
use Arduflow\Api\Database\SqliteMigrator;
use Arduflow\Api\Http\Request;
use Arduflow\Api\Http\Response;
use Arduflow\Api\Http\Router;
use Arduflow\Api\Middleware\CorsMiddleware;
use Arduflow\Api\Repositories\SyncStatusRepository;
use Arduflow\Api\Services\DatabaseHealthService;
use Arduflow\Api\Support\Config;

final class Application
{
    private readonly Router $router;
    private readonly CorsMiddleware $cors;

    public function __construct(
        Config $config,
        ConnectionFactory $connections,
        string $root,
    ) {
        $sqlite = $connections->sqlite();
        (new SqliteMigrator($root . '/migrations/sqlite'))->migrate($sqlite);

        $syncStatus = new SyncStatusRepository($sqlite);
        $health = new HealthController($syncStatus, new DatabaseHealthService($connections, $syncStatus));

        $this->router = new Router();
        $this->router->get('/api/health', [$health, 'basic']);
        $this->router->get('/api/health/database', [$health, 'database']);
        $this->cors = new CorsMiddleware((array) $config->get('app.cors_origins', []));
    }

    public function handle(Request $request): Response
    {
        $preflight = $this->cors->handle($request);
        if ($preflight instanceof Response) {
            return $preflight;
        }

        return $this->router->dispatch($request)->withHeaders($this->cors->headers($request));
    }
}
