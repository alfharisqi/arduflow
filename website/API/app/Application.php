<?php

declare(strict_types=1);

namespace Arduflow\Api;

use Arduflow\Api\Controllers\HealthController;
use Arduflow\Api\Controllers\AdminAuthController;
use Arduflow\Api\Controllers\AdminDatabaseSyncController;
use Arduflow\Api\Controllers\InternalSyncController;
use Arduflow\Api\Controllers\UserAuthController;
use Arduflow\Api\Database\ConnectionFactory;
use Arduflow\Api\Database\SqliteMigrator;
use Arduflow\Api\Http\Request;
use Arduflow\Api\Http\Response;
use Arduflow\Api\Http\Router;
use Arduflow\Api\Middleware\CorsMiddleware;
use Arduflow\Api\Repositories\SyncStatusRepository;
use Arduflow\Api\Repositories\SyncOutboxRepository;
use Arduflow\Api\Repositories\AdminRepository;
use Arduflow\Api\Repositories\AuthLogRepository;
use Arduflow\Api\Repositories\OutboxRepository;
use Arduflow\Api\Repositories\UserRepository;
use Arduflow\Api\Security\PasswordHasher;
use Arduflow\Api\Security\SyncSecurity;
use Arduflow\Api\Security\TokenService;
use Arduflow\Api\Services\AuthSessionService;
use Arduflow\Api\Services\DatabaseHealthService;
use Arduflow\Api\Services\MailService;
use Arduflow\Api\Services\MysqlSyncReceiverService;
use Arduflow\Api\Services\SqliteToMysqlSyncService;
use Arduflow\Api\Support\Config;
use Arduflow\Api\Validation\SyncEventValidator;

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
        $outbox = new OutboxRepository();
        $users = new UserRepository($sqlite, $outbox);
        $admins = new AdminRepository($sqlite, $outbox);
        $tokens = new TokenService();
        $passwords = new PasswordHasher((bool) $config->get('auth.legacy_scrypt_enabled', false));
        $sessions = new AuthSessionService($users, $admins, $tokens);
        $sessionHours = (int) $config->get('auth.session_hours', 8);
        $userAuth = new UserAuthController(
            $users,
            new AuthLogRepository($sqlite),
            $passwords,
            $tokens,
            $sessions,
            new MailService($config),
            $sessionHours,
        );
        $adminAuth = new AdminAuthController($admins, $passwords, $tokens, $sessions, $sessionHours);
        $syncOutbox = new SyncOutboxRepository($sqlite);
        $syncSecurity = new SyncSecurity($config, $sqlite);
        $syncWorker = new SqliteToMysqlSyncService($config, $syncOutbox, $syncSecurity);
        $internalSync = new InternalSyncController(
            $syncSecurity,
            new MysqlSyncReceiverService($connections, $config, new SyncEventValidator()),
        );
        $adminSync = new AdminDatabaseSyncController(
            $config,
            $connections,
            $sessions,
            $syncStatus,
            $syncOutbox,
            $syncWorker,
        );

        $this->router = new Router();
        $this->router->get('/api/health', [$health, 'basic']);
        $this->router->get('/api/health/database', [$health, 'database']);
        $this->router->post('/api/auth/register', [$userAuth, 'register']);
        $this->router->post('/api/auth/login', [$userAuth, 'login']);
        $this->router->get('/api/auth/session', [$userAuth, 'session']);
        $this->router->post('/api/auth/logout', [$userAuth, 'logout']);
        $this->router->get('/api/auth/verify-email', [$userAuth, 'verifyEmail']);
        $this->router->post('/api/auth/verify-email', [$userAuth, 'verifyEmail']);
        $this->router->post('/api/auth/password-reset/request', [$userAuth, 'requestPasswordReset']);
        $this->router->post('/api/auth/password-reset/confirm', [$userAuth, 'confirmPasswordReset']);
        $this->router->get('/api/auth/check-availability', [$userAuth, 'availability']);
        $this->router->post('/api/auth/check-availability', [$userAuth, 'availability']);
        $this->router->put('/api/auth/profile', [$userAuth, 'updateProfile']);
        $this->router->post('/api/admin/login', [$adminAuth, 'login']);
        $this->router->get('/api/admin/session', [$adminAuth, 'session']);
        $this->router->post('/api/admin/logout', [$adminAuth, 'logout']);
        $this->router->get('/api/admin/database-sync/status', [$adminSync, 'status']);
        $this->router->post('/api/admin/database-sync/run', [$adminSync, 'run']);
        $this->router->post('/api/admin/database-sync/retry-failed', [$adminSync, 'retryFailed']);
        $this->router->post('/api/internal/sync/sqlite-to-mysql', [$internalSync, 'receive']);
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
