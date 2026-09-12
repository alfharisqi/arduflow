<?php

declare(strict_types=1);

namespace Arduflow\Api\Database;

use DateTimeImmutable;
use DateTimeZone;
use PDO;

final class LegacyApiMigrator
{
    private const VERSION = '011_legacy_api_schema';

    public function migrate(PDO $pdo): int
    {
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS schema_migrations (' .
            'version TEXT PRIMARY KEY, applied_at TEXT NOT NULL' .
            ')'
        );

        $statement = $pdo->prepare(
            'SELECT 1 FROM schema_migrations WHERE version = :version LIMIT 1'
        );
        $statement->execute([':version' => self::VERSION]);

        if ($statement->fetchColumn() !== false) {
            return 0;
        }

        Transaction::immediate($pdo, function () use ($pdo): void {
            $this->run($pdo);

            $statement = $pdo->prepare(
                'INSERT INTO schema_migrations (version, applied_at) VALUES (:version, :applied_at)'
            );
            $statement->execute([
                ':version' => self::VERSION,
                ':applied_at' => gmdate('c'),
            ]);
        });

        return 1;
    }

    public function migrateCertificates(PDO $pdo): void
    {
        $this->ensureTable(
            $pdo,
            'certificates',
            'CREATE TABLE certificates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                registration_id INTEGER NULL,
                member_key TEXT NULL,
                user_id INTEGER NULL,
                user_name TEXT NOT NULL,
                email TEXT NOT NULL,
                workshop_id INTEGER NULL,
                workshop_title TEXT NOT NULL,
                certificate_title TEXT NOT NULL,
                certificate_type TEXT NOT NULL,
                completed_at TEXT NULL,
                issued_at TEXT NULL,
                certificate_number TEXT NOT NULL UNIQUE,
                status TEXT NOT NULL,
                downloads INTEGER NOT NULL DEFAULT 0,
                file_json TEXT NULL,
                payload_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )'
        );

        $this->ensureColumns($pdo, 'certificates', [
            'registration_id' => 'INTEGER NULL',
            'member_key' => 'TEXT NULL',
            'user_id' => 'INTEGER NULL',
        ]);

        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_certificates_registration ON certificates(registration_id)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_certificates_registration_member ON certificates(registration_id, workshop_id, member_key)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_certificates_email ON certificates(email)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_certificates_workshop ON certificates(workshop_id)');
    }

    private function run(PDO $pdo): void
    {
        $this->articles($pdo);
        $this->authTokens($pdo);
        $this->contentLegacy($pdo);
        $this->transactions($pdo);
        $this->partners($pdo);
        $this->testimonials($pdo);
        $this->ideConfig($pdo);
        $this->notifications($pdo);
        $this->syncInfrastructure($pdo);
    }

    private function articles(PDO $pdo): void
    {
        $this->ensureTable(
            $pdo,
            'articles',
            'CREATE TABLE articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                category TEXT NOT NULL,
                author TEXT NOT NULL DEFAULT "Admin ArduFlow",
                excerpt TEXT NOT NULL DEFAULT "",
                content TEXT NOT NULL,
                cover_image_name TEXT,
                cover_image_type TEXT,
                cover_image_size INTEGER,
                tags TEXT NOT NULL DEFAULT "[]",
                status TEXT NOT NULL DEFAULT "draft",
                featured INTEGER NOT NULL DEFAULT 0,
                viewer INTEGER NOT NULL DEFAULT 0,
                published_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )'
        );

        $pdo->exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status, published_at)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category)');
    }

    private function authTokens(PDO $pdo): void
    {
        $this->ensureTable(
            $pdo,
            'auth_tokens',
            'CREATE TABLE auth_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )'
        );

        $this->ensureTable(
            $pdo,
            'admin_auth_tokens',
            'CREATE TABLE admin_auth_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                admin_id INTEGER NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
            )'
        );
    }

    private function contentLegacy(PDO $pdo): void
    {
        $this->ensureColumns($pdo, 'workshops', [
            'slug' => 'TEXT',
            'payload_json' => 'TEXT NOT NULL DEFAULT "{}"',
            'cover_image_name' => 'TEXT',
            'cover_image_type' => 'TEXT',
            'cover_image_size' => 'INTEGER',
            'cover_image_path' => 'TEXT',
            'cover_image_url' => 'TEXT',
        ]);
        $pdo->exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_workshops_slug ON workshops(slug) WHERE slug IS NOT NULL AND slug <> ""');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_workshops_status ON workshops(status)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_workshops_category ON workshops(category)');

        $this->ensureColumns($pdo, 'gallery_submissions', [
            'cover_url' => 'TEXT',
            'cover_path' => 'TEXT',
            'cover_original_name' => 'TEXT',
            'cover_mime' => 'TEXT',
            'cover_size' => 'INTEGER',
        ]);

        $this->renameTableIfNeeded($pdo, 'tutorials', 'materi');
        $this->renameTableIfNeeded($pdo, 'tutorial_chapters', 'materi_chapters');
        $this->renameTableIfNeeded($pdo, 'tutorial_learning_objectives', 'materi_learning_objectives');
        $this->renameTableIfNeeded($pdo, 'tutorial_slides', 'materi_slides');

        foreach (['materi_chapters', 'materi_learning_objectives', 'materi_slides'] as $table) {
            $this->renameColumnIfNeeded($pdo, $table, 'tutorial_id', 'materi_id');
        }

        $this->ensureTable(
            $pdo,
            'materi',
            'CREATE TABLE materi (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                category TEXT NOT NULL,
                display_order INTEGER NOT NULL DEFAULT 1,
                short_description TEXT NOT NULL DEFAULT "",
                full_description TEXT NOT NULL DEFAULT "",
                card_image_name TEXT,
                card_image_type TEXT,
                card_image_size INTEGER,
                difficulty_level TEXT,
                estimated_time TEXT,
                page_order INTEGER NOT NULL DEFAULT 1,
                status TEXT NOT NULL DEFAULT "draft",
                active INTEGER NOT NULL DEFAULT 1,
                show_on_page INTEGER NOT NULL DEFAULT 1,
                featured INTEGER NOT NULL DEFAULT 0,
                comments INTEGER NOT NULL DEFAULT 1,
                access_type TEXT,
                featured_order INTEGER,
                user_level TEXT NOT NULL DEFAULT "semua_pengguna",
                access_requirement TEXT,
                prerequisite TEXT,
                cta_text TEXT,
                cta_target_link TEXT,
                cta_url_slug TEXT,
                publish_schedule TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )'
        );

        $this->ensureColumns($pdo, 'materi', [
            'display_order' => 'INTEGER NOT NULL DEFAULT 1',
            'short_description' => 'TEXT NOT NULL DEFAULT ""',
            'full_description' => 'TEXT NOT NULL DEFAULT ""',
            'difficulty_level' => 'TEXT',
            'estimated_time' => 'TEXT',
            'page_order' => 'INTEGER NOT NULL DEFAULT 1',
            'active' => 'INTEGER NOT NULL DEFAULT 1',
            'show_on_page' => 'INTEGER NOT NULL DEFAULT 1',
            'featured' => 'INTEGER NOT NULL DEFAULT 0',
            'comments' => 'INTEGER NOT NULL DEFAULT 1',
            'access_type' => 'TEXT',
            'featured_order' => 'INTEGER',
            'user_level' => 'TEXT NOT NULL DEFAULT "semua_pengguna"',
            'access_requirement' => 'TEXT',
            'prerequisite' => 'TEXT',
            'cta_text' => 'TEXT',
            'cta_target_link' => 'TEXT',
            'cta_url_slug' => 'TEXT',
            'publish_schedule' => 'TEXT',
        ]);

        $this->ensureTable(
            $pdo,
            'materi_chapters',
            'CREATE TABLE materi_chapters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                materi_id INTEGER NOT NULL,
                chapter_order INTEGER NOT NULL DEFAULT 1,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (materi_id) REFERENCES materi(id) ON DELETE CASCADE
            )'
        );

        $this->ensureTable(
            $pdo,
            'materi_learning_objectives',
            'CREATE TABLE materi_learning_objectives (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                materi_id INTEGER NOT NULL,
                objective_order INTEGER NOT NULL DEFAULT 1,
                objective TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (materi_id) REFERENCES materi(id) ON DELETE CASCADE
            )'
        );

        $this->ensureTable(
            $pdo,
            'materi_slides',
            'CREATE TABLE materi_slides (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                materi_id INTEGER NOT NULL,
                chapter_id INTEGER,
                slide_order INTEGER NOT NULL,
                title TEXT NOT NULL,
                content_type TEXT NOT NULL DEFAULT "text",
                content TEXT,
                code_title TEXT,
                code_language TEXT,
                code_content TEXT,
                allow_copy INTEGER NOT NULL DEFAULT 1,
                estimated_time TEXT,
                status TEXT NOT NULL DEFAULT "draft",
                image_name TEXT,
                image_type TEXT,
                image_size INTEGER,
                video_url TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (materi_id) REFERENCES materi(id) ON DELETE CASCADE,
                FOREIGN KEY (chapter_id) REFERENCES materi_chapters(id) ON DELETE SET NULL
            )'
        );

        $this->ensureColumns($pdo, 'materi_slides', [
            'chapter_id' => 'INTEGER',
            'estimated_time' => 'TEXT',
            'status' => 'TEXT NOT NULL DEFAULT "draft"',
            'image_type' => 'TEXT',
            'image_size' => 'INTEGER',
            'code_title' => 'TEXT',
            'code_language' => 'TEXT',
            'code_content' => 'TEXT',
            'allow_copy' => 'INTEGER NOT NULL DEFAULT 1',
        ]);

        $this->ensureTable(
            $pdo,
            'project_submissions',
            'CREATE TABLE project_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT "draft",
                visibility TEXT NOT NULL DEFAULT "draft",
                cover_image_name TEXT,
                cover_image_type TEXT,
                cover_image_size INTEGER,
                cover_image_path TEXT,
                cover_image_url TEXT,
                project_file_name TEXT,
                project_file_type TEXT,
                project_file_size INTEGER,
                project_file_path TEXT,
                project_file_url TEXT,
                circuit_image_name TEXT,
                circuit_image_type TEXT,
                circuit_image_size INTEGER,
                circuit_image_path TEXT,
                circuit_image_url TEXT,
                component_images_json TEXT,
                payload_json TEXT NOT NULL,
                deleted_at TEXT,
                version INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )'
        );

        $this->ensureColumns($pdo, 'project_submissions', [
            'cover_image_name' => 'TEXT',
            'cover_image_type' => 'TEXT',
            'cover_image_size' => 'INTEGER',
            'cover_image_path' => 'TEXT',
            'cover_image_url' => 'TEXT',
            'project_file_name' => 'TEXT',
            'project_file_type' => 'TEXT',
            'project_file_size' => 'INTEGER',
            'project_file_path' => 'TEXT',
            'project_file_url' => 'TEXT',
            'circuit_image_name' => 'TEXT',
            'circuit_image_type' => 'TEXT',
            'circuit_image_size' => 'INTEGER',
            'circuit_image_path' => 'TEXT',
            'circuit_image_url' => 'TEXT',
            'component_images_json' => 'TEXT',
            'deleted_at' => 'TEXT',
            'version' => 'INTEGER NOT NULL DEFAULT 1',
        ]);

        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_materi_chapters_materi ON materi_chapters(materi_id, chapter_order)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_materi_objectives_materi ON materi_learning_objectives(materi_id, objective_order)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_materi_slides_chapter ON materi_slides(materi_id, chapter_id, slide_order)');
    }

    private function transactions(PDO $pdo): void
    {
        $this->ensureTable(
            $pdo,
            'transactions',
            'CREATE TABLE transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NULL,
                user_name TEXT,
                email TEXT,
                item_type TEXT NOT NULL DEFAULT "workshop",
                item_id INTEGER NULL,
                item_title TEXT NOT NULL,
                amount REAL NOT NULL DEFAULT 0,
                currency TEXT NOT NULL DEFAULT "IDR",
                payment_method TEXT,
                payment_channel TEXT,
                payment_code TEXT,
                recipient_name TEXT,
                qris_file_name TEXT,
                qris_file_type TEXT,
                qris_file_size INTEGER,
                qris_file_path TEXT,
                qris_file_url TEXT,
                invoice_number TEXT NOT NULL UNIQUE,
                reference_number TEXT,
                status TEXT NOT NULL DEFAULT "pending",
                paid_at TEXT,
                due_at TEXT,
                notes TEXT,
                proof_file_name TEXT,
                proof_file_type TEXT,
                proof_file_size INTEGER,
                proof_file_path TEXT,
                proof_file_url TEXT,
                proof_uploaded_at TEXT,
                reviewed_at TEXT,
                reviewed_by TEXT,
                rejection_reason TEXT,
                payload_json TEXT NOT NULL DEFAULT "{}",
                deleted_at TEXT,
                version INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )'
        );

        $this->ensureColumns($pdo, 'transactions', [
            'payment_code' => 'TEXT',
            'recipient_name' => 'TEXT',
            'qris_file_name' => 'TEXT',
            'qris_file_type' => 'TEXT',
            'qris_file_size' => 'INTEGER',
            'qris_file_path' => 'TEXT',
            'qris_file_url' => 'TEXT',
            'proof_file_name' => 'TEXT',
            'proof_file_type' => 'TEXT',
            'proof_file_size' => 'INTEGER',
            'proof_file_path' => 'TEXT',
            'proof_file_url' => 'TEXT',
            'proof_uploaded_at' => 'TEXT',
            'reviewed_at' => 'TEXT',
            'reviewed_by' => 'TEXT',
            'rejection_reason' => 'TEXT',
            'deleted_at' => 'TEXT',
            'version' => 'INTEGER NOT NULL DEFAULT 1',
        ]);

        $this->ensureTable(
            $pdo,
            'user_entitlements',
            'CREATE TABLE user_entitlements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id INTEGER NOT NULL,
                user_id INTEGER NULL,
                email TEXT,
                product_type TEXT NOT NULL,
                product_id INTEGER NULL,
                product_title TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT "active",
                granted_at TEXT NOT NULL,
                deleted_at TEXT,
                version INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )'
        );
        $this->ensureColumns($pdo, 'user_entitlements', [
            'disabled_reason' => 'TEXT',
            'disabled_at' => 'TEXT',
            'disabled_by' => 'TEXT',
            'deleted_at' => 'TEXT',
            'version' => 'INTEGER NOT NULL DEFAULT 1',
        ]);

        $this->ensureTable(
            $pdo,
            'payment_methods',
            'CREATE TABLE payment_methods (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                method_type TEXT NOT NULL DEFAULT "Transfer Bank",
                channel TEXT,
                recipient_name TEXT,
                payment_code TEXT,
                qris_file_name TEXT,
                qris_file_type TEXT,
                qris_file_size INTEGER,
                qris_file_path TEXT,
                qris_file_url TEXT,
                is_active INTEGER NOT NULL DEFAULT 1,
                deleted_at TEXT,
                version INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )'
        );
        $this->ensureColumns($pdo, 'payment_methods', [
            'method_type' => 'TEXT NOT NULL DEFAULT "Transfer Bank"',
            'channel' => 'TEXT',
            'recipient_name' => 'TEXT',
            'payment_code' => 'TEXT',
            'qris_file_name' => 'TEXT',
            'qris_file_type' => 'TEXT',
            'qris_file_size' => 'INTEGER',
            'qris_file_path' => 'TEXT',
            'qris_file_url' => 'TEXT',
            'is_active' => 'INTEGER NOT NULL DEFAULT 1',
            'deleted_at' => 'TEXT',
            'version' => 'INTEGER NOT NULL DEFAULT 1',
        ]);

        $this->ensureColumns($pdo, 'workshop_registrations', [
            'workshop_id' => 'INTEGER NULL',
            'member_names' => 'TEXT NULL',
            'transaction_id' => 'INTEGER NULL',
        ]);

        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_transactions_email ON transactions(email)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at)');
        $pdo->exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_user_entitlements_transaction ON user_entitlements(transaction_id)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_id ON user_entitlements(user_id)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_user_entitlements_email ON user_entitlements(email)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_user_entitlements_product ON user_entitlements(product_type, product_id)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active)');
    }

    private function partners(PDO $pdo): void
    {
        $tableWasMissing = !$this->tableExists($pdo, 'partners');
        $this->ensureTable(
            $pdo,
            'partners',
            'CREATE TABLE partners (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT "Institusi",
                pic_name TEXT NOT NULL DEFAULT "",
                pic_role TEXT NOT NULL DEFAULT "",
                email TEXT NOT NULL DEFAULT "",
                whatsapp TEXT NOT NULL DEFAULT "",
                city TEXT NOT NULL DEFAULT "",
                province TEXT NOT NULL DEFAULT "",
                website TEXT NOT NULL DEFAULT "",
                social_media TEXT NOT NULL DEFAULT "",
                logo_url TEXT NOT NULL DEFAULT "",
                description TEXT NOT NULL DEFAULT "",
                programs_json TEXT NOT NULL DEFAULT "[]",
                status TEXT NOT NULL DEFAULT "Draft",
                show_homepage INTEGER NOT NULL DEFAULT 0,
                featured INTEGER NOT NULL DEFAULT 0,
                follow_up_note TEXT NOT NULL DEFAULT "",
                start_date TEXT,
                last_contact_at TEXT,
                deleted_at TEXT,
                version INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )'
        );
        $this->ensureColumns($pdo, 'partners', [
            'logo_url' => 'TEXT NOT NULL DEFAULT ""',
            'version' => 'INTEGER NOT NULL DEFAULT 1',
        ]);

        $this->ensureColumns($pdo, 'collaborations', [
            'description' => 'TEXT NULL',
            'proposal_file_name' => 'TEXT NULL',
            'proposal_file_type' => 'TEXT NULL',
            'proposal_file_size' => 'INTEGER NULL',
            'proposal_file_path' => 'TEXT NULL',
            'proposal_file_url' => 'TEXT NULL',
        ]);

        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_partners_homepage ON partners(show_homepage, featured)');

        unset($tableWasMissing);
    }

    private function testimonials(PDO $pdo): void
    {
        $this->ensureTable(
            $pdo,
            'testimonials',
            'CREATE TABLE testimonials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_type TEXT NOT NULL DEFAULT "general",
                source_id TEXT NOT NULL DEFAULT "",
                user_id TEXT NOT NULL DEFAULT "",
                name TEXT NOT NULL DEFAULT "",
                email TEXT NOT NULL DEFAULT "",
                role TEXT NOT NULL DEFAULT "",
                quote TEXT NOT NULL DEFAULT "",
                rating INTEGER NOT NULL DEFAULT 5,
                consent_public INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT "Menunggu",
                admin_note TEXT NOT NULL DEFAULT "",
                deleted_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )'
        );

        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_testimonials_status ON testimonials(status)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_testimonials_email ON testimonials(email)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS idx_testimonials_source ON testimonials(source_type, source_id)');
    }

    private function ideConfig(PDO $pdo): void
    {
        $this->ensureTable(
            $pdo,
            'ide_config',
            'CREATE TABLE ide_config (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                title TEXT NOT NULL DEFAULT "Akses ArduFlow IDE",
                price INTEGER NOT NULL DEFAULT 150000,
                currency TEXT NOT NULL DEFAULT "IDR",
                duration_days INTEGER NOT NULL DEFAULT 365,
                is_active INTEGER NOT NULL DEFAULT 1,
                description TEXT,
                updated_at TEXT NOT NULL
            )'
        );

        $statement = $pdo->prepare(
            'INSERT OR IGNORE INTO ide_config (
                id, title, price, currency, duration_days, is_active, description, updated_at
            ) VALUES (
                1, :title, 150000, "IDR", 365, 1, :description, :updated_at
            )'
        );
        $statement->execute([
            ':title' => 'Akses ArduFlow IDE',
            ':description' => 'Akses visual programming ArduFlow IDE untuk membuat dan mengelola project Arduino dan IoT.',
            ':updated_at' => (new DateTimeImmutable('now', new DateTimeZone('Asia/Jakarta')))->format(DATE_ATOM),
        ]);
    }

    private function notifications(PDO $pdo): void
    {
        $this->ensureTable(
            $pdo,
            'user_notification_email_logs',
            'CREATE TABLE user_notification_email_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                notification_key TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT NOT NULL DEFAULT "",
                status TEXT NOT NULL DEFAULT "sent",
                error_message TEXT,
                created_at TEXT NOT NULL,
                UNIQUE(notification_key, email)
            )'
        );
    }

    private function syncInfrastructure(PDO $pdo): void
    {
        $this->ensureTable(
            $pdo,
            'sync_outbox',
            "CREATE TABLE sync_outbox (
                id TEXT PRIMARY KEY,
                event_id TEXT NOT NULL UNIQUE,
                table_name TEXT NOT NULL,
                row_id TEXT NOT NULL,
                operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
                payload TEXT NOT NULL,
                version INTEGER NOT NULL DEFAULT 1,
                status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'synced', 'failed')),
                retry_count INTEGER NOT NULL DEFAULT 0,
                next_retry_at TEXT,
                last_error TEXT,
                worker_id TEXT,
                locked_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                synced_at TEXT
            )"
        );

        $this->ensureTable(
            $pdo,
            'sync_logs',
            'CREATE TABLE sync_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batch_id TEXT NOT NULL,
                total_events INTEGER NOT NULL,
                success_events INTEGER NOT NULL DEFAULT 0,
                failed_events INTEGER NOT NULL DEFAULT 0,
                started_at TEXT NOT NULL,
                finished_at TEXT,
                duration_ms INTEGER,
                mysql_status TEXT,
                error_message TEXT
            )'
        );

        $this->ensureColumns($pdo, 'sync_logs', [
            'duration_ms' => 'INTEGER',
            'mysql_status' => 'TEXT',
        ]);

        foreach ([
            'leads',
            'workshops',
            'project_submissions',
            'transactions',
            'payment_methods',
            'user_entitlements',
            'workshop_registrations',
            'partners',
        ] as $table) {
            $this->ensureColumns($pdo, $table, [
                'deleted_at' => 'TEXT',
                'version' => 'INTEGER NOT NULL DEFAULT 1',
            ]);
        }

        $pdo->exec('CREATE INDEX IF NOT EXISTS sync_outbox_ready_idx ON sync_outbox(status, next_retry_at, created_at)');
        $pdo->exec('CREATE INDEX IF NOT EXISTS sync_outbox_worker_idx ON sync_outbox(worker_id, status)');
    }

    private function renameTableIfNeeded(PDO $pdo, string $from, string $to): void
    {
        if (!$this->tableExists($pdo, $from) || $this->tableExists($pdo, $to)) {
            return;
        }

        $pdo->exec(
            'ALTER TABLE ' . $this->quoteIdentifier($from) .
            ' RENAME TO ' . $this->quoteIdentifier($to)
        );
    }

    private function renameColumnIfNeeded(PDO $pdo, string $table, string $from, string $to): void
    {
        $columns = $this->columns($pdo, $table);
        if (!in_array($from, $columns, true) || in_array($to, $columns, true)) {
            return;
        }

        $pdo->exec(
            'ALTER TABLE ' . $this->quoteIdentifier($table) .
            ' RENAME COLUMN ' . $this->quoteIdentifier($from) .
            ' TO ' . $this->quoteIdentifier($to)
        );
    }

    private function ensureTable(PDO $pdo, string $table, string $sql): void
    {
        if ($this->tableExists($pdo, $table)) {
            return;
        }

        $pdo->exec($sql);
    }

    private function ensureColumns(PDO $pdo, string $table, array $definitions): void
    {
        $columns = $this->columns($pdo, $table);
        if ($columns === []) {
            return;
        }

        foreach ($definitions as $column => $definition) {
            if (!in_array($column, $columns, true)) {
                $pdo->exec(
                    'ALTER TABLE ' . $this->quoteIdentifier($table) .
                    ' ADD COLUMN ' . $this->quoteIdentifier((string) $column) . ' ' . $definition
                );
            }
        }
    }

    private function tableExists(PDO $pdo, string $table): bool
    {
        $statement = $pdo->prepare(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = :table LIMIT 1"
        );
        $statement->execute([':table' => $table]);

        return $statement->fetchColumn() !== false;
    }

    private function columns(PDO $pdo, string $table): array
    {
        if (!$this->tableExists($pdo, $table)) {
            return [];
        }

        $statement = $pdo->query('PRAGMA table_info(' . $this->quoteIdentifier($table) . ')');

        return array_map(
            static fn (array $column): string => (string) $column['name'],
            $statement->fetchAll(PDO::FETCH_ASSOC)
        );
    }

    private function quoteIdentifier(string $identifier): string
    {
        return '"' . str_replace('"', '""', $identifier) . '"';
    }

    private function seedPartners(PDO $pdo): void
    {
        unset($pdo);
    }
}
