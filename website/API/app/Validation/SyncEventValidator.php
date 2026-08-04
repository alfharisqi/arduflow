<?php

declare(strict_types=1);

namespace Arduflow\Api\Validation;

final class SyncEventValidator
{
    private const TABLE_COLUMNS = [
        'users' => [
            'id', 'name', 'username', 'nickname', 'email', 'whatsapp', 'occupation', 'institution_name',
            'profile_image', 'password_hash', 'email_verified_at', 'verification_token', 'verification_sent_at',
            'password_reset_token', 'password_reset_sent_at', 'password_reset_expires_at', 'deleted_at',
            'version', 'created_at', 'updated_at',
        ],
        'admins' => [
            'id', 'username', 'email', 'name', 'password_hash', 'role', 'is_active', 'last_login_at',
            'deleted_at', 'version', 'created_at', 'updated_at',
        ],
        'leads' => [
            'id', 'name', 'email', 'whatsapp', 'topic', 'message', 'source', 'status', 'deleted_at',
            'version', 'created_at', 'updated_at',
        ],
        'workshops' => [
            'id', 'title', 'description', 'category', 'method', 'location', 'meeting_url', 'start_at', 'end_at',
            'capacity', 'status', 'certificate_enabled', 'created_by_admin_id', 'deleted_at', 'version',
            'created_at', 'updated_at',
        ],
        'programs' => ['id', 'name', 'description', 'status', 'deleted_at', 'version', 'created_at', 'updated_at'],
        'tutorials' => [
            'id', 'title', 'slug', 'category', 'level', 'status', 'content', 'author_admin_id', 'deleted_at',
            'version', 'created_at', 'updated_at',
        ],
        'projects' => [
            'id', 'user_id', 'title', 'description', 'category', 'level', 'status', 'deleted_at',
            'version', 'created_at', 'updated_at',
        ],
    ];

    public function validate(array $event): void
    {
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', (string) ($event['eventId'] ?? '')) !== 1) {
            throw new \InvalidArgumentException('event_id tidak valid.');
        }
        $table = (string) ($event['tableName'] ?? '');
        if (!isset(self::TABLE_COLUMNS[$table])) {
            throw new \InvalidArgumentException('Tabel sinkronisasi tidak diizinkan.');
        }
        if (!in_array((string) ($event['operation'] ?? ''), ['insert', 'update', 'delete'], true)) {
            throw new \InvalidArgumentException('Operasi sinkronisasi tidak diizinkan.');
        }
        $payload = $event['payload'] ?? null;
        if (!is_array($payload) || array_is_list($payload)) {
            throw new \InvalidArgumentException('Payload event tidak valid.');
        }
        if ((string) ($payload['id'] ?? '') !== (string) ($event['rowId'] ?? '')) {
            throw new \InvalidArgumentException('row_id tidak sesuai payload.');
        }
        foreach (['id', 'version', 'updated_at'] as $requiredColumn) {
            if (!array_key_exists($requiredColumn, $payload)) {
                throw new \InvalidArgumentException("Kolom wajib {$requiredColumn} tidak tersedia.");
            }
        }
        $version = filter_var($event['version'] ?? null, FILTER_VALIDATE_INT);
        if ($version === false || $version < 1) {
            throw new \InvalidArgumentException('Versi event tidak valid.');
        }
        if ((int) $payload['version'] !== $version) {
            throw new \InvalidArgumentException('Versi payload tidak sesuai event.');
        }
        $unknown = array_diff(array_keys($payload), self::TABLE_COLUMNS[$table]);
        if ($unknown !== []) {
            throw new \InvalidArgumentException('Kolom tidak diizinkan: ' . implode(', ', $unknown));
        }
    }

    public function columns(string $table): array
    {
        return self::TABLE_COLUMNS[$table] ?? [];
    }
}
