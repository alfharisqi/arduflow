<?php

declare(strict_types=1);

namespace Arduflow\Api\Repositories;

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
    ) {
    }

    public function data(array $admin): array
    {
        $weekAgo = gmdate('c', time() - 604800);
        $totalUsers = $this->count('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL');
        $newUsers = $this->count('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND created_at >= :since', ['since' => $weekAgo]);
        $activeUsers = $this->count('SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE expires_at > :now', ['now' => Clock::now()]);
        $unverified = $this->count('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND email_verified_at IS NULL');
        $workshops = $this->count('SELECT COUNT(*) FROM workshops WHERE deleted_at IS NULL');
        $programs = $this->count('SELECT COUNT(*) FROM programs WHERE deleted_at IS NULL');
        $projects = $this->count('SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL');
        $leads = $this->count('SELECT COUNT(*) FROM leads WHERE deleted_at IS NULL');
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
                ['id' => 'certificates', 'label' => 'Sertifikat', 'value' => '0 / 0', 'trend' => 'Tabel sertifikat belum tersedia'],
            ],
            'activities' => $this->activities(),
            'verificationRows' => $this->verificationRows(),
            'workshopRows' => $this->workshopRows(),
            'leads' => $this->leads(),
            'content' => [
                'tutorials' => $this->contentRows('tutorials'),
                'projects' => $this->contentRows('projects'),
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
        $rows = $this->pdo->query(
            "SELECT event_type, actor_id, created_at FROM auth_logs " .
            "UNION ALL SELECT 'lead_created', id, created_at FROM leads WHERE deleted_at IS NULL " .
            'ORDER BY created_at DESC LIMIT 7'
        )->fetchAll();
        $labels = [
            'register_success' => 'User baru mendaftar', 'login_success' => 'User login terakhir',
            'login_failed' => 'Percobaan login gagal', 'email_verified' => 'Email berhasil diverifikasi',
            'profile_updated' => 'Update profile user', 'lead_created' => 'Lead baru dari form kontak',
        ];
        return array_map(function (array $row) use ($labels): array {
            $detail = '-';
            if ($row['event_type'] === 'lead_created') {
                $statement = $this->pdo->prepare('SELECT name || :separator || email FROM leads WHERE id = :id');
                $statement->execute(['separator' => ' - ', 'id' => $row['actor_id']]);
                $detail = (string) ($statement->fetchColumn() ?: '-');
            } elseif ($row['actor_id']) {
                $statement = $this->pdo->prepare('SELECT email FROM users WHERE id = :id');
                $statement->execute(['id' => $row['actor_id']]);
                $detail = (string) ($statement->fetchColumn() ?: '-');
            }
            return ['title' => $labels[$row['event_type']] ?? $row['event_type'], 'detail' => $detail, 'time' => $row['created_at']];
        }, $rows);
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
        $rows = $this->pdo->query(
            'SELECT title, method, start_at, capacity, status FROM workshops WHERE deleted_at IS NULL ' .
            'ORDER BY start_at IS NULL, start_at ASC, created_at DESC LIMIT 5'
        )->fetchAll();
        return array_map(fn (array $row): array => [
            'program' => $row['title'], 'date' => $this->formatDate($row['start_at']),
            'participants' => '0 / ' . (int) $row['capacity'], 'status' => $row['method'] ?: $row['status'],
        ], $rows);
    }

    private function leads(): array
    {
        $rows = $this->pdo->query(
            'SELECT name, email, topic, created_at, status FROM leads WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5'
        )->fetchAll();
        return array_map(fn (array $row): array => [
            'name' => $row['name'], 'email' => $row['email'], 'topic' => $row['topic'] ?: '-',
            'date' => $this->formatDate($row['created_at']), 'status' => $row['status'] ?: 'Baru',
        ], $rows);
    }

    private function contentRows(string $table): array
    {
        if (!in_array($table, ['tutorials', 'projects'], true)) {
            return [];
        }
        $rows = $this->pdo->query("SELECT title, created_at FROM {$table} WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 3")->fetchAll();
        return array_map(fn (array $row): array => ['title' => $row['title'], 'date' => $this->formatDate($row['created_at'])], $rows);
    }

    private function logs(): array
    {
        $rows = $this->pdo->query(
            "SELECT CASE WHEN status = 'failed' THEN 'ERROR' ELSE 'WARNING' END AS level, " .
            "COALESCE(last_error, 'Event sinkronisasi belum berhasil.') AS message, updated_at AS created_at " .
            'FROM sync_outbox WHERE last_error IS NOT NULL UNION ALL ' .
            "SELECT CASE WHEN mysql_status = 'unreachable' THEN 'ERROR' ELSE 'WARNING' END, " .
            "COALESCE(error_message, 'Sinkronisasi selesai dengan catatan.'), COALESCE(finished_at, started_at) " .
            'FROM sync_logs WHERE error_message IS NOT NULL ORDER BY created_at DESC LIMIT 3'
        )->fetchAll();
        return array_map(fn (array $row): array => ['level' => $row['level'], 'message' => $row['message'], 'time' => $row['created_at']], $rows);
    }

    private function system(): array
    {
        $lastMysqlStatus = $this->pdo->query('SELECT mysql_status FROM sync_logs ORDER BY id DESC LIMIT 1')->fetchColumn();
        $mysqlStatus = $lastMysqlStatus === 'reachable' ? 'Online' : ($lastMysqlStatus === 'unreachable' ? 'Offline' : 'Belum diperiksa');
        $size = $this->sqlitePath !== ':memory:' && is_file($this->sqlitePath)
            ? number_format((float) filesize($this->sqlitePath) / 1048576, 2) . ' MB'
            : '-';
        return [
            ['title' => 'MySQL', 'status' => $mysqlStatus, 'detail' => 'Status dari worker terakhir; tidak wajib untuk request user'],
            ['title' => 'SQLite (Operasional)', 'status' => 'Online', 'detail' => 'Size: ' . $size],
            ['title' => 'SMTP / Mailpit', 'status' => $this->config->get('mail.enabled', true) ? 'Configured' : 'Disabled', 'detail' => $this->config->get('mail.host') . ':' . $this->config->get('mail.port')],
        ];
    }

    private function count(string $sql, array $params = []): int
    {
        $statement = $this->pdo->prepare($sql);
        $statement->execute($params);
        return (int) $statement->fetchColumn();
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
