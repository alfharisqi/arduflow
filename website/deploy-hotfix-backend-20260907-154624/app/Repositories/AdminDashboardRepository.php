<?php

declare(strict_types=1);

namespace Arduflow\Api\Repositories;

use Arduflow\Api\Database\ConnectionFactory;
use Arduflow\Api\Database\Transaction;
use Arduflow\Api\Support\Clock;
use Arduflow\Api\Support\Config;
use Arduflow\Api\Services\AuthSessionService;
use PDO;

final class AdminDashboardRepository
{
    public function __construct(
        private readonly PDO $pdo,
        private readonly SyncStatusRepository $syncStatus,
        private readonly Config $config,
        private readonly string $sqlitePath,
        private readonly ?ConnectionFactory $connections = null,
    ) {
    }

    public function data(array $admin): array
    {
        $weekAgo = gmdate('c', time() - 604800);
        $totalUsers = $this->count('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL');
        $newUsers = $this->count('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND created_at >= :since', ['since' => $weekAgo]);
        $activeUsers = $this->count('SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE expires_at > :now', ['now' => Clock::now()]);
        $unverified = $this->count('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND email_verified_at IS NULL');
        $workshops = $this->countActiveRows('workshops');
        $programs = $this->countActiveRows('programs');
        $projects = $this->tableExists('project_submissions')
            ? $this->countActiveRows('project_submissions')
            : $this->countActiveRows('projects');
        $leads = $this->countActiveRows('leads');
        $sync = $this->syncStatus->summary();

        return [
            'admin' => AuthSessionService::publicAdmin($admin),
            'metrics' => [
                ['id' => 'users', 'label' => 'Total User', 'value' => $totalUsers, 'trend' => "{$newUsers} user baru 7 hari terakhir", 'positive' => true],
                ['id' => 'activeUsers', 'label' => 'User Aktif', 'value' => $activeUsers, 'trend' => 'Sesi login aktif saat ini', 'positive' => true],
                ['id' => 'unverifiedUsers', 'label' => 'Belum Verifikasi Email', 'value' => $unverified, 'trend' => 'Perlu tindak lanjut', 'positive' => false],
                ['id' => 'workshopsPrograms', 'label' => 'Total Workshop/Program', 'value' => $workshops + $programs, 'trend' => "{$workshops} workshop / {$programs} program", 'positive' => true],
                ['id' => 'projects', 'label' => 'Total Proyek User', 'value' => $projects, 'trend' => 'Data dari SQLite', 'positive' => true],
                ['id' => 'leads', 'label' => 'Lead / Kontak Masuk', 'value' => $leads, 'trend' => 'Semua lead tersimpan', 'positive' => true],
            ],
            'quickActions' => $this->quickActions(),
            'actionQueue' => $this->actionQueue(),
            'transactionSummary' => $this->transactionSummary(),
            'activityChart' => $this->activityChart(),
            'activities' => $this->activities(),
            'verificationRows' => $this->verificationRows(),
            'workshopRows' => $this->workshopRows(),
            'leads' => $this->leads(),
            'content' => [
                'tutorials' => $this->contentRows('tutorials'),
                'projects' => $this->contentRows('projects'),
                'drafts' => $this->draftContentRows(),
            ],
            'logs' => $this->logs(),
            'system' => $this->system(),
            'sync' => [
                'pending' => $sync['pending'], 'processing' => $sync['processing'], 'failed' => $sync['failed'],
                'syncedToday' => $sync['synced_today'], 'lastSyncAt' => $sync['last_sync_at'],
                'lastSuccessAt' => $sync['last_success_at'],
            ],
        ];
    }

    private function activities(): array
    {
        $leadWhere = $this->activeWhere('leads');
        $rows = $this->pdo->query(
            "SELECT event_type, actor_id, created_at, 'auth' AS source FROM auth_logs " .
            "UNION ALL SELECT 'lead_created', id, created_at, 'lead' AS source FROM leads WHERE {$leadWhere} " .
            'ORDER BY created_at DESC LIMIT 7'
        )->fetchAll();
        $labels = [
            'register_success' => 'User baru mendaftar', 'login_success' => 'User login terakhir',
            'login_failed' => 'Percobaan login gagal', 'email_verified' => 'Email berhasil diverifikasi',
            'profile_updated' => 'Update profile user', 'lead_created' => 'Lead baru dari form kontak',
        ];
        return array_map(function (array $row) use ($labels): array {
            $detail = '-';
            $avatarUrl = null;
            $actorName = null;

            if ($row['source'] === 'lead') {
                $statement = $this->pdo->prepare('SELECT name, email FROM leads WHERE id = :id');
                $statement->execute(['id' => $row['actor_id']]);
                $lead = $statement->fetch() ?: null;
                if (is_array($lead)) {
                    $actorName = (string) ($lead['name'] ?? '');
                    $detail = trim((string) ($lead['name'] ?? '') . ' - ' . (string) ($lead['email'] ?? ''), ' -') ?: '-';
                    $avatarUrl = $this->userAvatarByEmail((string) ($lead['email'] ?? ''));
                }
            } elseif ($row['actor_id']) {
                $statement = $this->pdo->prepare('SELECT name, email, profile_image, avatar_path FROM users WHERE id = :id');
                $statement->execute(['id' => $row['actor_id']]);
                $user = $statement->fetch() ?: null;
                if (is_array($user)) {
                    $actorName = (string) ($user['name'] ?? '');
                    $detail = (string) ($user['email'] ?? '-');
                    $avatarUrl = $this->resolveUserAvatar($user);
                }
            }
            return [
                'title' => $labels[$row['event_type']] ?? $row['event_type'],
                'detail' => $detail,
                'actorName' => $actorName,
                'avatarUrl' => $avatarUrl,
                'time' => $row['created_at'],
            ];
        }, $rows);
    }

    private function userAvatarByEmail(string $email): ?string
    {
        $email = trim($email);
        if ($email === '') {
            return null;
        }

        $statement = $this->pdo->prepare(
            'SELECT profile_image, avatar_path FROM users WHERE LOWER(email) = LOWER(:email) AND deleted_at IS NULL LIMIT 1'
        );
        $statement->execute(['email' => $email]);
        $user = $statement->fetch() ?: null;

        return is_array($user) ? $this->resolveUserAvatar($user) : null;
    }

    private function resolveUserAvatar(array $user): ?string
    {
        $profileImage = trim((string) ($user['profile_image'] ?? ''));
        if ($profileImage !== '') {
            return $profileImage;
        }

        $avatarPath = trim((string) ($user['avatar_path'] ?? ''));
        return $avatarPath !== '' ? $avatarPath : null;
    }

    private function verificationRows(): array
    {
        $rows = $this->pdo->query(
            'SELECT name, email, created_at, verification_sent_at FROM users WHERE deleted_at IS NULL ' .
            'AND email_verified_at IS NULL ORDER BY created_at DESC LIMIT 5'
        )->fetchAll();
        return array_map(fn (array $row, int $index): array => [
            'no' => (string) ($index + 1), 'name' => $row['name'], 'email' => $row['email'],
            'date' => $this->formatDate($row['created_at']), 'status' => $row['verification_sent_at'] ? 'Terkirim' : 'Menunggu',
        ], $rows, array_keys($rows));
    }

    private function workshopRows(): array
    {
        $where = $this->activeWhere('workshops');
        $select = ['title', 'status', 'created_at'];

        foreach (['method', 'start_at', 'capacity', 'payload_json'] as $column) {
            if ($this->hasColumn('workshops', $column)) {
                $select[] = $column;
            }
        }

        $rows = $this->pdo->query(
            'SELECT ' . implode(', ', $select) . " FROM workshops WHERE {$where} " .
            'ORDER BY created_at DESC LIMIT 5'
        )->fetchAll();

        return array_map(function (array $row): array {
            $payload = [];
            if (isset($row['payload_json'])) {
                $decoded = json_decode((string) $row['payload_json'], true);
                $payload = is_array($decoded) ? $decoded : [];
            }

            $date = $row['start_at'] ?? $payload['schedule']['date'] ?? $row['created_at'] ?? null;
            $method = $row['method'] ?? $payload['type'] ?? '';
            $capacity = isset($row['capacity']) ? (int) $row['capacity'] : 0;

            return [
                'program' => $row['title'],
                'date' => $this->formatDate($date),
                'participants' => $capacity > 0 ? '0 / ' . $capacity : '-',
                'status' => $method ?: ($row['status'] ?? '-'),
            ];
        }, $rows);
    }

    private function leads(): array
    {
        $rows = $this->pdo->query(
            'SELECT name, email, topic, created_at, status FROM leads WHERE ' . $this->activeWhere('leads') . ' ORDER BY created_at DESC LIMIT 5'
        )->fetchAll();
        return array_map(fn (array $row): array => [
            'name' => $row['name'], 'email' => $row['email'], 'topic' => $row['topic'] ?: '-',
            'date' => $this->formatDate($row['created_at']), 'status' => $row['status'] ?: 'Baru',
        ], $rows);
    }

    private function contentRows(string $table, bool $draftOnly = false): array
    {
        if (!in_array($table, ['tutorials', 'projects'], true)) {
            return [];
        }

        $sourceTable = $table === 'projects' && $this->tableExists('project_submissions')
            ? 'project_submissions'
            : $table;
        $where = $this->activeWhere($sourceTable);
        $hasStatus = $this->hasColumn($sourceTable, 'status');
        if ($draftOnly && !$hasStatus) {
            return [];
        }
        if ($draftOnly) {
            $where .= " AND LOWER(COALESCE(status, '')) IN ('draft', 'pending_review')";
        }

        $select = ['id', 'title', 'created_at'];
        if ($this->hasColumn($sourceTable, 'slug')) {
            $select[] = 'slug';
        }
        if ($hasStatus) {
            $select[] = 'status';
        }
        foreach ($this->contentImageColumns($sourceTable) as $column) {
            if ($this->hasColumn($sourceTable, $column)) {
                $select[] = $column;
            }
        }

        $rows = $this->pdo->query(
            'SELECT ' . implode(', ', $select) . " FROM {$sourceTable} WHERE {$where} ORDER BY created_at DESC LIMIT 3"
        )->fetchAll();
        $type = $table === 'projects' ? 'Proyek' : 'Tutorial';

        return array_map(fn (array $row): array => [
            'id' => isset($row['id']) ? (int) $row['id'] : null,
            'slug' => $row['slug'] ?? null,
            'title' => $row['title'],
            'type' => $type,
            'route' => $table === 'projects'
                ? '/admin/projects'
                : '/admin/tutorial/edit?id=' . rawurlencode((string) ($row['id'] ?? '')),
            'status' => $row['status'] ?? null,
            'statusLabel' => isset($row['status']) ? $this->contentStatusLabel((string) $row['status']) : null,
            'imageUrl' => $this->contentImageUrl($sourceTable, $row),
            'createdAt' => $row['created_at'],
            'date' => $this->formatDate($row['created_at']),
        ], $rows);
    }

    private function contentImageColumns(string $table): array
    {
        return match ($table) {
            'tutorials' => ['card_image_url', 'card_image_name'],
            'projects', 'project_submissions' => ['cover_image_url', 'cover_image_name'],
            default => [],
        };
    }

    private function contentImageUrl(string $table, array $row): ?string
    {
        if ($table === 'tutorials') {
            $url = trim((string) ($row['card_image_url'] ?? ''));
            if ($url !== '') {
                return $url;
            }

            $fileName = trim((string) ($row['card_image_name'] ?? ''));
            return $fileName === ''
                ? null
                : '/api/materi-api.php?action=image&scope=card&file=' . rawurlencode(basename($fileName));
        }

        if ($table === 'projects' || $table === 'project_submissions') {
            $url = trim((string) ($row['cover_image_url'] ?? ''));
            if ($url !== '') {
                return $url;
            }

            $fileName = trim((string) ($row['cover_image_name'] ?? ''));
            return $fileName === '' ? null : '/uploads/projects/' . rawurlencode(basename($fileName));
        }

        return null;
    }

    private function draftContentRows(): array
    {
        $rows = [
            ...$this->contentRows('tutorials', true),
            ...$this->contentRows('projects', true),
        ];

        usort($rows, fn (array $left, array $right): int => strcmp($right['createdAt'] ?? '', $left['createdAt'] ?? ''));
        return array_slice($rows, 0, 5);
    }

    private function contentStatusLabel(string $status): string
    {
        return match (strtolower($status)) {
            'draft' => 'Draft',
            'pending_review' => 'Menunggu Review',
            'published' => 'Published',
            default => $status,
        };
    }

    private function logs(): array
    {
        $sources = [];

        if ($this->tableExists('sync_outbox') && $this->hasColumn('sync_outbox', 'last_error')) {
            $sources[] = (
                "SELECT CASE WHEN status = 'failed' THEN 'ERROR' ELSE 'WARNING' END AS level, " .
                "'Sync outbox: ' || COALESCE(last_error, 'Event sinkronisasi belum berhasil.') AS message, " .
                'updated_at AS created_at FROM sync_outbox WHERE last_error IS NOT NULL'
            );
        }

        if ($this->tableExists('sync_logs')) {
            $hasMysqlStatus = $this->hasColumn('sync_logs', 'mysql_status');
            $mysqlLevel = $hasMysqlStatus ? "mysql_status = 'unreachable' OR " : '';
            $mysqlWhere = $hasMysqlStatus ? " OR mysql_status = 'unreachable'" : '';

            $sources[] = (
                "SELECT CASE WHEN {$mysqlLevel}failed_events > 0 THEN 'ERROR' ELSE 'WARNING' END AS level, " .
                "COALESCE(error_message, 'Sinkronisasi gagal pada ' || failed_events || ' event.') AS message, " .
                'COALESCE(finished_at, started_at) AS created_at FROM sync_logs ' .
                "WHERE error_message IS NOT NULL OR failed_events > 0{$mysqlWhere}"
            );
        }

        if ($this->tableExists('auth_logs')) {
            $sources[] = (
                "SELECT 'WARNING' AS level, " .
                "CASE event_type WHEN 'login_failed' THEN 'Login gagal' ELSE event_type END AS message, " .
                'created_at FROM auth_logs WHERE success = 0'
            );
        }

        if ($sources === []) {
            return [];
        }

        $rows = $this->pdo->query(
            implode(' UNION ALL ', $sources) . ' ORDER BY created_at DESC LIMIT 5'
        )->fetchAll();

        return array_map(fn (array $row): array => [
            'level' => $row['level'],
            'message' => $row['message'],
            'time' => $row['created_at'],
        ], $rows);
    }

    private function system(): array
    {
        $sqlite = $this->sqliteHealth();
        $mysql = $this->mysqlHealth();
        $mail = $this->mailHealth();
        $size = $this->sqlitePath !== ':memory:' && is_file($this->sqlitePath)
            ? number_format((float) filesize($this->sqlitePath) / 1048576, 2) . ' MB'
            : '-';
        $sync = $this->syncStatus->summary();

        return [
            [
                'title' => 'MySQL',
                'status' => $mysql['online'] ? 'Online' : 'Offline',
                'online' => $mysql['online'],
                'detail' => $mysql['online']
                    ? 'Koneksi aktif; pending sync: ' . (int) ($sync['pending'] ?? 0) . ', failed: ' . (int) ($sync['failed'] ?? 0)
                    : $mysql['detail'],
            ],
            [
                'title' => 'SQLite (Operasional)',
                'status' => $sqlite['online'] ? 'Online' : 'Offline',
                'online' => $sqlite['online'],
                'detail' => 'Size: ' . $size . '; ' . $sqlite['detail'],
            ],
            [
                'title' => 'SMTP / Mailpit',
                'status' => $mail['status'],
                'online' => $mail['online'],
                'detail' => $mail['detail'],
            ],
        ];
    }

    private function quickActions(): array
    {
        return [
            ['label' => 'Tambah Tutorial', 'route' => '/admin/tutorial/tambah', 'kind' => 'primary'],
            ['label' => 'Tambah Artikel', 'route' => '/admin/artikel/tambah', 'kind' => 'default'],
            ['label' => 'Tambah Workshop', 'route' => '/admin/tambah-workshop', 'kind' => 'default'],
            ['label' => 'Tambah Proyek', 'route' => '/admin/projects?create=1', 'kind' => 'default'],
        ];
    }

    private function actionQueue(): array
    {
        $unverified = $this->count('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND email_verified_at IS NULL');
        $newLeads = $this->count(
            "SELECT COUNT(*) FROM leads WHERE {$this->activeWhere('leads')} AND LOWER(COALESCE(status, 'new')) IN ('new', 'baru', 'open', 'pending')"
        );
        $pendingTransactions = $this->tableExists('transactions')
            ? $this->count(
                "SELECT COUNT(*) FROM transactions WHERE {$this->activeWhere('transactions')} AND status IN ('pending', 'proof_uploaded')"
            )
            : 0;
        $draftProjects = $this->tableExists('project_submissions')
            ? $this->count(
                "SELECT COUNT(*) FROM project_submissions WHERE {$this->activeWhere('project_submissions')} AND LOWER(COALESCE(status, '')) IN ('draft', 'pending_review')"
            )
            : 0;
        $failedSync = $this->tableExists('sync_outbox')
            ? $this->count("SELECT COUNT(*) FROM sync_outbox WHERE status = 'failed'")
            : 0;

        return [
            [
                'label' => 'Akun belum verifikasi',
                'count' => $unverified,
                'detail' => $unverified > 0 ? 'Butuh follow-up email verifikasi.' : 'Tidak ada akun tertunda.',
                'route' => '/admin/verification',
                'priority' => $unverified > 0 ? 'warning' : 'normal',
            ],
            [
                'label' => 'Lead baru',
                'count' => $newLeads,
                'detail' => $newLeads > 0 ? 'Perlu diproses tim admin.' : 'Tidak ada lead baru.',
                'route' => '/admin/leads',
                'priority' => $newLeads > 0 ? 'info' : 'normal',
            ],
            [
                'label' => 'Transaksi perlu review',
                'count' => $pendingTransactions,
                'detail' => $pendingTransactions > 0 ? 'Cek bukti pembayaran masuk.' : 'Tidak ada transaksi tertunda.',
                'route' => '/admin/transactions',
                'priority' => $pendingTransactions > 0 ? 'warning' : 'normal',
            ],
            [
                'label' => 'Proyek draft / pending',
                'count' => $draftProjects,
                'detail' => $draftProjects > 0 ? 'Perlu review sebelum publish.' : 'Tidak ada proyek pending.',
                'route' => '/admin/projects',
                'priority' => $draftProjects > 0 ? 'info' : 'normal',
            ],
            [
                'label' => 'Sync gagal',
                'count' => $failedSync,
                'detail' => $failedSync > 0 ? 'Periksa database sync.' : 'Tidak ada sync gagal.',
                'route' => '/admin/database',
                'priority' => $failedSync > 0 ? 'danger' : 'normal',
            ],
        ];
    }

    private function transactionSummary(): array
    {
        if (!$this->tableExists('transactions')) {
            return [
                'pending' => 0,
                'paid' => 0,
                'rejected' => 0,
                'expired' => 0,
                'revenue' => 0.0,
                'reviewNeeded' => 0,
            ];
        }

        $where = $this->activeWhere('transactions');

        return [
            'pending' => $this->count("SELECT COUNT(*) FROM transactions WHERE {$where} AND status = 'pending'"),
            'paid' => $this->count("SELECT COUNT(*) FROM transactions WHERE {$where} AND status = 'paid'"),
            'rejected' => $this->count("SELECT COUNT(*) FROM transactions WHERE {$where} AND status = 'rejected'"),
            'expired' => $this->count("SELECT COUNT(*) FROM transactions WHERE {$where} AND status = 'expired'"),
            'revenue' => (float) $this->scalar("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE {$where} AND status = 'paid'"),
            'reviewNeeded' => $this->count("SELECT COUNT(*) FROM transactions WHERE {$where} AND status IN ('pending', 'proof_uploaded')"),
        ];
    }

    private function activityChart(): array
    {
        $days = [];
        for ($offset = 6; $offset >= 0; $offset--) {
            $date = (new \DateTimeImmutable('today', new \DateTimeZone('Asia/Jakarta')))
                ->modify('-' . $offset . ' days');
            $isoDate = $date->format('Y-m-d');
            $label = $date->format('d/m');

            $days[] = [
                'date' => $isoDate,
                'label' => $label,
                'users' => $this->countByDate('users', $isoDate),
                'leads' => $this->countByDate('leads', $isoDate),
                'transactions' => $this->countByDate('transactions', $isoDate),
                'logins' => $this->count(
                    "SELECT COUNT(*) FROM auth_logs WHERE event_type = 'login_success' AND date(created_at) = :date",
                    ['date' => $isoDate]
                ),
            ];
        }

        return $days;
    }

    private function countByDate(string $table, string $date): int
    {
        if (!$this->tableExists($table)) {
            return 0;
        }

        $where = $this->activeWhere($table);
        return $this->count("SELECT COUNT(*) FROM {$table} WHERE {$where} AND date(created_at) = :date", ['date' => $date]);
    }

    private function sqliteHealth(): array
    {
        try {
            $integrity = (string) $this->pdo->query('PRAGMA quick_check')->fetchColumn();
            $writable = false;

            try {
                Transaction::immediate($this->pdo, static fn (): bool => true);
                $writable = true;
            } catch (\Throwable) {
                $writable = false;
            }

            return [
                'online' => $integrity === 'ok' && $writable,
                'detail' => $integrity === 'ok'
                    ? ($writable ? 'integrity ok, writable' : 'integrity ok, read-only')
                    : 'integrity check: ' . $integrity,
            ];
        } catch (\Throwable $exception) {
            return [
                'online' => false,
                'detail' => 'SQLite error: ' . substr($exception->getMessage(), 0, 120),
            ];
        }
    }

    private function mysqlHealth(): array
    {
        try {
            $mysql = $this->connections instanceof ConnectionFactory
                ? $this->connections->mysql()
                : $this->standaloneMysqlConnection();
            $reachable = (int) $mysql->query('SELECT 1')->fetchColumn() === 1;

            return [
                'online' => $reachable,
                'detail' => $reachable ? 'Koneksi MySQL berhasil.' : 'MySQL tidak merespons SELECT 1.',
            ];
        } catch (\Throwable $exception) {
            return [
                'online' => false,
                'detail' => 'MySQL error: ' . substr($exception->getMessage(), 0, 120),
            ];
        }
    }

    private function standaloneMysqlConnection(): PDO
    {
        $host = (string) $this->config->get('database.mysql.host', '127.0.0.1');
        $port = (int) $this->config->get('database.mysql.port', 3306);
        $database = (string) $this->config->get('database.mysql.database', 'db_arduflow');
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $host, $port, $database);

        return new PDO(
            $dsn,
            (string) $this->config->get('database.mysql.username', 'root'),
            (string) $this->config->get('database.mysql.password', ''),
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_TIMEOUT => (int) $this->config->get('database.mysql.connect_timeout_seconds', 3),
            ],
        );
    }

    private function mailHealth(): array
    {
        if (!(bool) $this->config->get('mail.enabled', true)) {
            return [
                'online' => false,
                'status' => 'Disabled',
                'detail' => 'MAIL_ENABLED=false',
            ];
        }

        $host = (string) $this->config->get('mail.host', '127.0.0.1');
        $port = (int) $this->config->get('mail.port', 1025);
        $target = $host . ':' . $port;
        $errorCode = 0;
        $errorMessage = '';
        try {
            $socket = @fsockopen($host, $port, $errorCode, $errorMessage, 2.0);
        } catch (\Throwable $exception) {
            $socket = false;
            $errorMessage = $exception->getMessage();
        }

        if (is_resource($socket)) {
            fclose($socket);
            return [
                'online' => true,
                'status' => 'Online',
                'detail' => 'SMTP reachable di ' . $target . '; Mailpit: ' . (string) $this->config->get('mail.mailpit_url', '-'),
            ];
        }

        return [
            'online' => false,
            'status' => 'Offline',
            'detail' => 'SMTP tidak terhubung di ' . $target . ($errorMessage !== '' ? '; ' . $errorMessage : ''),
        ];
    }

    private function count(string $sql, array $params = []): int
    {
        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);
        return (int) $statement->fetchColumn();
    }

    private function scalar(string $sql, array $params = []): mixed
    {
        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);
        return $statement->fetchColumn();
    }

    private function countActiveRows(string $table): int
    {
        return $this->count("SELECT COUNT(*) FROM {$table} WHERE " . $this->activeWhere($table));
    }

    private function activeWhere(string $table): string
    {
        return $this->hasColumn($table, 'deleted_at') ? 'deleted_at IS NULL' : '1 = 1';
    }

    private function hasColumn(string $table, string $column): bool
    {
        $statement = $this->pdo->query("PRAGMA table_info({$table})");
        $columns = array_column($statement->fetchAll(), 'name');
        return in_array($column, $columns, true);
    }

    private function tableExists(string $table): bool
    {
        $statement = $this->pdo->prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = :name");
        $statement->execute(['name' => $table]);
        return (bool) $statement->fetchColumn();
    }

    private function formatDate(?string $value): string
    {
        if (!$value) {
            return '-';
        }
        try {
            $date = new \DateTimeImmutable($value);
        } catch (\Throwable) {
            return $value;
        }
        $months = [1 => 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        return $date->format('d') . ' ' . $months[(int) $date->format('n')] . ' ' . $date->format('Y');
    }
}
