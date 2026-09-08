<?php

declare(strict_types=1);

namespace Arduflow\Api\Database;

use PDO;

final class ApiQueryIndexes
{
    public static function definitions(): array
    {
        return [
            'afw_users_login_email' => ['users', ['email', 'deleted_at'], 'LOWER(email)', 'deleted_at IS NULL'],
            'afw_users_login_username' => ['users', ['username', 'deleted_at'], 'LOWER(username)', 'deleted_at IS NULL'],
            'afw_users_login_name' => ['users', ['name', 'deleted_at'], 'LOWER(name)', 'deleted_at IS NULL'],
            'afw_users_certificate_email' => ['users', ['email'], 'email COLLATE NOCASE', ''],
            'afw_admins_login_email' => ['admins', ['email'], 'LOWER(email)', ''],
            'afw_admins_login_username' => ['admins', ['username'], 'LOWER(username)', ''],
            'afw_admins_login_name' => ['admins', ['name'], 'LOWER(name)', ''],
            'afw_auth_tokens_expiry' => ['auth_tokens', ['expires_at'], 'expires_at', ''],
            'afw_admin_tokens_expiry' => ['admin_auth_tokens', ['expires_at'], 'expires_at', ''],
            'afw_leads_user_email' => ['leads', ['email', 'deleted_at'], 'email COLLATE NOCASE', 'deleted_at IS NULL'],
            'afw_collaborations_user_email' => ['collaborations', ['pic_email', 'deleted_at'], 'pic_email COLLATE NOCASE', 'deleted_at IS NULL'],
            'afw_registrations_user_email' => ['workshop_registrations', ['participant_email', 'deleted_at'], 'participant_email COLLATE NOCASE', 'deleted_at IS NULL'],
            'afw_transactions_email_feed' => ['transactions', ['email', 'updated_at', 'created_at', 'deleted_at'], 'LOWER(email), updated_at DESC, created_at DESC', 'deleted_at IS NULL'],
            'afw_transactions_user_feed' => ['transactions', ['user_id', 'updated_at', 'created_at', 'deleted_at'], 'user_id, updated_at DESC, created_at DESC', 'deleted_at IS NULL'],
            'afw_workshops_title' => ['workshops', ['title', 'id'], 'title COLLATE NOCASE, id DESC', ''],
            'afw_workshops_text_id' => ['workshops', ['id'], 'CAST(id AS TEXT)', ''],
            'afw_projects_active_list' => ['project_submissions', ['id', 'deleted_at'], 'id DESC', 'deleted_at IS NULL'],
            'afw_partners_active_list' => ['partners', ['updated_at', 'id', 'deleted_at'], 'updated_at DESC, id DESC', 'deleted_at IS NULL'],
            'afw_testimonials_status_list' => ['testimonials', ['status', 'updated_at', 'id', 'deleted_at'], 'status, updated_at DESC, id DESC', 'deleted_at IS NULL'],
            'afw_tutorials_display' => ['tutorials', ['display_order', 'id'], 'display_order, id DESC', ''],
            'afw_slides_tutorial_order' => ['tutorial_slides', ['tutorial_id', 'slide_order', 'id'], 'tutorial_id, slide_order, id', ''],
        ];
    }

    public static function install(PDO $pdo): array
    {
        $existing = array_fill_keys(
            $pdo->query("SELECT name FROM sqlite_master WHERE type = 'index'")->fetchAll(PDO::FETCH_COLUMN),
            true
        );
        $columnsByTable = [];
        $result = ['created' => [], 'existing' => [], 'skipped' => []];

        foreach (self::definitions() as $name => [$table, $required, $expression, $where]) {
            if (isset($existing[$name])) {
                $result['existing'][] = $name;
                continue;
            }

            if (!isset($columnsByTable[$table])) {
                $columnsByTable[$table] = array_column(
                    $pdo->query('PRAGMA table_info("' . $table . '")')->fetchAll(PDO::FETCH_ASSOC),
                    'name'
                );
            }

            if (array_diff($required, $columnsByTable[$table]) !== []) {
                $result['skipped'][] = $name;
                continue;
            }

            $pdo->exec(
                'CREATE INDEX IF NOT EXISTS "' . $name . '" ON "' . $table . '" (' . $expression . ')'
                . ($where === '' ? '' : ' WHERE ' . $where)
            );
            $result['created'][] = $name;
        }

        return $result;
    }
}
