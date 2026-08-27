-- MySQL DDL generated from website/web-arduflow-deploy-alfha/storage/database/arduflow.sqlite
-- SQLite TEXT values are mapped to VARCHAR(255) or LONGTEXT; date/time TEXT columns are mapped to DATETIME where obvious.
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `user_sessions`;
DROP TABLE IF EXISTS `tutorial_slides`;
DROP TABLE IF EXISTS `tutorial_learning_objectives`;
DROP TABLE IF EXISTS `tutorial_chapters`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `materi_slides`;
DROP TABLE IF EXISTS `auth_tokens`;
DROP TABLE IF EXISTS `admin_sessions`;
DROP TABLE IF EXISTS `admin_auth_tokens`;
DROP TABLE IF EXISTS `workshops`;
DROP TABLE IF EXISTS `workshop_registrations`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `user_entitlements`;
DROP TABLE IF EXISTS `tutorials`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `sync_rate_limits`;
DROP TABLE IF EXISTS `sync_outbox`;
DROP TABLE IF EXISTS `sync_logs`;
DROP TABLE IF EXISTS `schema_migrations`;
DROP TABLE IF EXISTS `project_submissions`;
DROP TABLE IF EXISTS `programs`;
DROP TABLE IF EXISTS `payment_methods`;
DROP TABLE IF EXISTS `partners`;
DROP TABLE IF EXISTS `materi`;
DROP TABLE IF EXISTS `leads`;
DROP TABLE IF EXISTS `ide_config`;
DROP TABLE IF EXISTS `gallery_submissions`;
DROP TABLE IF EXISTS `gallery_items`;
DROP TABLE IF EXISTS `collaborations`;
DROP TABLE IF EXISTS `certificates`;
DROP TABLE IF EXISTS `cache_items`;
DROP TABLE IF EXISTS `auth_logs`;
DROP TABLE IF EXISTS `articles`;
DROP TABLE IF EXISTS `admins`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `admins` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(255) NOT NULL DEFAULT 'super_admin',
  `is_active` INT NOT NULL DEFAULT 1,
  `deleted_at` DATETIME NULL,
  `version` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `last_login_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_admins_2` (`email`),
  UNIQUE KEY `sqlite_autoindex_admins_1` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `articles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `category` VARCHAR(255) NOT NULL,
  `author` VARCHAR(255) NOT NULL DEFAULT 'Admin ArduFlow',
  `excerpt` LONGTEXT NOT NULL,
  `content` LONGTEXT NOT NULL,
  `cover_image_name` VARCHAR(255) NULL,
  `cover_image_type` VARCHAR(255) NULL,
  `cover_image_size` INT NULL,
  `tags` VARCHAR(255) NOT NULL DEFAULT '[]',
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `featured` INT NOT NULL DEFAULT 0,
  `viewer` INT NOT NULL DEFAULT 0,
  `published_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_articles_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `auth_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `event_type` VARCHAR(255) NOT NULL,
  `actor_type` VARCHAR(255) NOT NULL,
  `actor_id` INT NULL,
  `success` INT NOT NULL DEFAULT 0,
  `identifier_hash` VARCHAR(255) NULL,
  `ip_address` VARCHAR(255) NULL,
  `user_agent` VARCHAR(255) NULL,
  `details` LONGTEXT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache_items` (
  `cache_key` VARCHAR(255) NOT NULL,
  `cache_value` LONGTEXT NOT NULL,
  `expires_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`cache_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `certificates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL,
  `user_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `workshop_id` INT NULL,
  `workshop_title` VARCHAR(255) NOT NULL,
  `certificate_title` VARCHAR(255) NOT NULL,
  `certificate_type` VARCHAR(255) NOT NULL,
  `completed_at` DATETIME NULL,
  `issued_at` DATETIME NULL,
  `certificate_number` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) NOT NULL,
  `downloads` INT NOT NULL DEFAULT 0,
  `file_json` LONGTEXT NULL,
  `payload_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_certificates_1` (`certificate_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `collaborations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pic_name` VARCHAR(255) NOT NULL,
  `pic_email` VARCHAR(255) NOT NULL,
  `pic_whatsapp` VARCHAR(255) NOT NULL,
  `institution_name` VARCHAR(255) NOT NULL,
  `institution_type` VARCHAR(255) NOT NULL,
  `goal` VARCHAR(255) NOT NULL,
  `participant_estimate` VARCHAR(255) NULL,
  `demo_schedule` VARCHAR(255) NULL,
  `source` VARCHAR(255) NOT NULL DEFAULT 'website',
  `status` VARCHAR(255) NOT NULL DEFAULT 'new',
  `deleted_at` DATETIME NULL,
  `version` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `description` LONGTEXT NULL,
  `proposal_file_name` VARCHAR(255) NULL,
  `proposal_file_type` VARCHAR(255) NULL,
  `proposal_file_size` INT NULL,
  `proposal_file_path` VARCHAR(255) NULL,
  `proposal_file_url` LONGTEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `gallery_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` LONGTEXT NULL,
  `category` VARCHAR(255) NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `image_name` VARCHAR(255) NULL,
  `image_type` VARCHAR(255) NULL,
  `image_size` INT NULL,
  `image_path` VARCHAR(255) NULL,
  `image_url` LONGTEXT NULL,
  `payload_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `gallery_submissions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `tag` VARCHAR(255) NOT NULL,
  `description` LONGTEXT NOT NULL,
  `user_name` VARCHAR(255) NOT NULL,
  `event_date` VARCHAR(50) NOT NULL,
  `detail_link` VARCHAR(255) NULL,
  `note` VARCHAR(255) NULL,
  `cover_path` VARCHAR(255) NULL,
  `cover_original_name` VARCHAR(255) NULL,
  `cover_mime` VARCHAR(255) NULL,
  `cover_size` INT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `payload_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `cover_url` LONGTEXT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ide_config` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL DEFAULT 'Akses ArduFlow IDE',
  `price` INT NOT NULL DEFAULT 150000,
  `currency` VARCHAR(255) NOT NULL DEFAULT 'IDR',
  `duration_days` INT NOT NULL DEFAULT 365,
  `is_active` INT NOT NULL DEFAULT 1,
  `description` LONGTEXT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `leads` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `whatsapp` VARCHAR(255) NULL,
  `topic` VARCHAR(255) NOT NULL,
  `message` LONGTEXT NOT NULL,
  `source` VARCHAR(255) NOT NULL DEFAULT 'website',
  `status` VARCHAR(255) NOT NULL DEFAULT 'new',
  `deleted_at` DATETIME NULL,
  `version` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `materi` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `category` VARCHAR(255) NOT NULL,
  `display_order` INT NOT NULL DEFAULT 1,
  `short_description` LONGTEXT NOT NULL,
  `full_description` LONGTEXT NOT NULL,
  `card_image_name` VARCHAR(255) NULL,
  `card_image_type` VARCHAR(255) NULL,
  `card_image_size` INT NULL,
  `difficulty_level` VARCHAR(255) NULL,
  `estimated_time` VARCHAR(255) NULL,
  `page_order` INT NOT NULL DEFAULT 1,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `active` INT NOT NULL DEFAULT 1,
  `show_on_page` INT NOT NULL DEFAULT 1,
  `featured` INT NOT NULL DEFAULT 0,
  `comments` INT NOT NULL DEFAULT 1,
  `access_type` VARCHAR(255) NULL,
  `featured_order` INT NULL,
  `user_level` VARCHAR(255) NOT NULL DEFAULT 'semua_pengguna',
  `access_requirement` VARCHAR(255) NULL,
  `prerequisite` VARCHAR(255) NULL,
  `cta_text` VARCHAR(255) NULL,
  `cta_target_link` VARCHAR(255) NULL,
  `cta_url_slug` VARCHAR(255) NULL,
  `publish_schedule` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_materi_1` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `partners` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `type` VARCHAR(255) NOT NULL DEFAULT 'Institusi',
  `pic_name` VARCHAR(255) NOT NULL DEFAULT '',
  `pic_role` VARCHAR(255) NOT NULL DEFAULT '',
  `email` VARCHAR(255) NOT NULL DEFAULT '',
  `whatsapp` VARCHAR(255) NOT NULL DEFAULT '',
  `city` VARCHAR(255) NOT NULL DEFAULT '',
  `province` VARCHAR(255) NOT NULL DEFAULT '',
  `website` VARCHAR(255) NOT NULL DEFAULT '',
  `social_media` VARCHAR(255) NOT NULL DEFAULT '',
  `description` LONGTEXT NOT NULL,
  `programs_json` LONGTEXT NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'Draft',
  `show_homepage` INT NOT NULL DEFAULT 0,
  `featured` INT NOT NULL DEFAULT 0,
  `follow_up_note` VARCHAR(255) NOT NULL DEFAULT '',
  `start_date` VARCHAR(50) NULL,
  `last_contact_at` DATETIME NULL,
  `deleted_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payment_methods` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `method_type` VARCHAR(255) NOT NULL DEFAULT 'Transfer Bank',
  `channel` VARCHAR(255) NULL,
  `recipient_name` VARCHAR(255) NULL,
  `payment_code` VARCHAR(255) NULL,
  `qris_file_name` VARCHAR(255) NULL,
  `qris_file_type` VARCHAR(255) NULL,
  `qris_file_size` INT NULL,
  `qris_file_path` VARCHAR(255) NULL,
  `qris_file_url` LONGTEXT NULL,
  `is_active` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME NULL,
  `version` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `programs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` LONGTEXT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `deleted_at` DATETIME NULL,
  `version` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `project_submissions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(255) NOT NULL,
  `description` LONGTEXT NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `visibility` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `payload_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `external_id` VARCHAR(255) NULL,
  `slug` VARCHAR(255) NULL,
  `cover_image_name` VARCHAR(255) NULL,
  `cover_image_type` VARCHAR(255) NULL,
  `cover_image_size` INT NULL,
  `cover_image_path` VARCHAR(255) NULL,
  `cover_image_url` LONGTEXT NULL,
  `project_file_name` VARCHAR(255) NULL,
  `project_file_type` VARCHAR(255) NULL,
  `project_file_size` INT NULL,
  `project_file_path` VARCHAR(255) NULL,
  `project_file_url` LONGTEXT NULL,
  `component_images_json` LONGTEXT NULL,
  `circuit_image_name` VARCHAR(255) NULL,
  `circuit_image_type` VARCHAR(255) NULL,
  `circuit_image_size` INT NULL,
  `circuit_image_path` VARCHAR(255) NULL,
  `circuit_image_url` LONGTEXT NULL,
  `deleted_at` DATETIME NULL,
  `version` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `schema_migrations` (
  `version` VARCHAR(255) NOT NULL,
  `applied_at` DATETIME NOT NULL,
  PRIMARY KEY (`version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sync_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `batch_id` VARCHAR(255) NOT NULL,
  `total_events` INT NOT NULL,
  `success_events` INT NOT NULL DEFAULT 0,
  `failed_events` INT NOT NULL DEFAULT 0,
  `started_at` DATETIME NOT NULL,
  `finished_at` DATETIME NULL,
  `error_message` LONGTEXT NULL,
  `duration_ms` INT NULL,
  `mysql_status` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sync_outbox` (
  `id` VARCHAR(191) NOT NULL,
  `event_id` VARCHAR(255) NOT NULL,
  `table_name` VARCHAR(255) NOT NULL,
  `row_id` VARCHAR(255) NOT NULL,
  `operation` VARCHAR(255) NOT NULL,
  `payload` LONGTEXT NOT NULL,
  `version` INT NOT NULL DEFAULT 1,
  `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `retry_count` INT NOT NULL DEFAULT 0,
  `next_retry_at` DATETIME NULL,
  `last_error` LONGTEXT NULL,
  `worker_id` VARCHAR(255) NULL,
  `locked_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `synced_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_sync_outbox_2` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sync_rate_limits` (
  `client_key` VARCHAR(255) NOT NULL,
  `window_started_at` INT NOT NULL,
  `request_count` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`client_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `transactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL,
  `user_name` VARCHAR(255) NULL,
  `email` VARCHAR(255) NULL,
  `item_type` VARCHAR(255) NOT NULL DEFAULT 'workshop',
  `item_id` INT NULL,
  `item_title` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `currency` VARCHAR(255) NOT NULL DEFAULT 'IDR',
  `payment_method` VARCHAR(255) NULL,
  `payment_channel` VARCHAR(255) NULL,
  `invoice_number` VARCHAR(255) NOT NULL,
  `reference_number` VARCHAR(255) NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'pending',
  `paid_at` DATETIME NULL,
  `due_at` DATETIME NULL,
  `notes` LONGTEXT NULL,
  `payload_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `proof_file_name` VARCHAR(255) NULL,
  `proof_file_type` VARCHAR(255) NULL,
  `proof_file_size` INT NULL,
  `proof_file_path` VARCHAR(255) NULL,
  `proof_file_url` LONGTEXT NULL,
  `proof_uploaded_at` DATETIME NULL,
  `reviewed_at` DATETIME NULL,
  `reviewed_by` VARCHAR(255) NULL,
  `rejection_reason` VARCHAR(255) NULL,
  `payment_code` VARCHAR(255) NULL,
  `recipient_name` VARCHAR(255) NULL,
  `qris_file_name` VARCHAR(255) NULL,
  `qris_file_type` VARCHAR(255) NULL,
  `qris_file_size` INT NULL,
  `qris_file_path` VARCHAR(255) NULL,
  `qris_file_url` LONGTEXT NULL,
  `deleted_at` DATETIME NULL,
  `version` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_transactions_1` (`invoice_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tutorials` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `category` VARCHAR(255) NOT NULL,
  `display_order` INT NOT NULL DEFAULT 1,
  `short_description` LONGTEXT NOT NULL,
  `full_description` LONGTEXT NOT NULL,
  `card_image_name` VARCHAR(255) NULL,
  `card_image_type` VARCHAR(255) NULL,
  `card_image_size` INT NULL,
  `difficulty_level` VARCHAR(255) NULL,
  `estimated_time` VARCHAR(255) NULL,
  `page_order` INT NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `user_level` VARCHAR(255) NOT NULL DEFAULT 'semua_pengguna',
  `access_requirement` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `card_image_path` VARCHAR(255) NULL,
  `card_image_url` LONGTEXT NULL,
  `active` INT NOT NULL DEFAULT 1,
  `show_on_page` INT NOT NULL DEFAULT 1,
  `featured` INT NOT NULL DEFAULT 0,
  `comments` INT NOT NULL DEFAULT 1,
  `access_type` VARCHAR(255) NULL,
  `featured_order` INT NULL,
  `prerequisite` VARCHAR(255) NULL,
  `cta_text` VARCHAR(255) NULL,
  `cta_target_link` VARCHAR(255) NULL,
  `cta_url_slug` VARCHAR(255) NULL,
  `publish_schedule` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_tutorials_1` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_entitlements` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `transaction_id` INT NOT NULL,
  `user_id` INT NULL,
  `email` VARCHAR(255) NULL,
  `product_type` VARCHAR(255) NOT NULL,
  `product_id` INT NULL,
  `product_title` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'active',
  `granted_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `deleted_at` DATETIME NULL,
  `version` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_entitlements_transaction` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(255) NULL,
  `nickname` VARCHAR(255) NULL,
  `email` VARCHAR(255) NOT NULL,
  `whatsapp` VARCHAR(255) NULL,
  `occupation` VARCHAR(255) NULL,
  `institution_name` VARCHAR(255) NULL,
  `avatar_path` LONGTEXT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `email_verified_at` DATETIME NULL,
  `verification_token` VARCHAR(255) NULL,
  `verification_sent_at` DATETIME NULL,
  `password_reset_token` VARCHAR(255) NULL,
  `password_reset_expires_at` DATETIME NULL,
  `deleted_at` DATETIME NULL,
  `version` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `profile_image` LONGTEXT NULL,
  `password_reset_sent_at` DATETIME NULL,
  `is_active` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_users_1` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `workshop_registrations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `participant_name` VARCHAR(255) NOT NULL,
  `participant_email` VARCHAR(255) NOT NULL,
  `participant_whatsapp` VARCHAR(255) NOT NULL,
  `institution_name` VARCHAR(255) NULL,
  `workshop_choice` VARCHAR(255) NOT NULL,
  `participant_estimate` VARCHAR(255) NULL,
  `notes` LONGTEXT NULL,
  `source` VARCHAR(255) NOT NULL DEFAULT 'website',
  `status` VARCHAR(255) NOT NULL DEFAULT 'new',
  `deleted_at` DATETIME NULL,
  `version` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `workshop_id` INT NULL,
  `member_names` LONGTEXT NULL,
  `transaction_id` INT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `workshops` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `status` VARCHAR(255) NULL,
  `category` VARCHAR(255) NULL,
  `payload_json` LONGTEXT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `cover_image_name` VARCHAR(255) NULL,
  `cover_image_type` VARCHAR(255) NULL,
  `cover_image_size` INT NULL,
  `cover_image_path` VARCHAR(255) NULL,
  `cover_image_url` LONGTEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_workshops_1` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `admin_auth_tokens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `admin_id` INT NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_admin_auth_tokens_1` (`token_hash`),
  CONSTRAINT `fk_admin_auth_tokens_admin_id_admins_id` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `admin_sessions` (
  `id` VARCHAR(191) NOT NULL,
  `admin_id` INT NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL,
  `last_used_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_admin_sessions_2` (`token_hash`),
  CONSTRAINT `fk_admin_sessions_admin_id_admins_id` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `auth_tokens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_auth_tokens_1` (`token_hash`),
  CONSTRAINT `fk_auth_tokens_user_id_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `materi_slides` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `materi_id` INT NOT NULL,
  `slide_order` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content_type` LONGTEXT NOT NULL,
  `content` LONGTEXT NULL,
  `estimated_time` VARCHAR(255) NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `image_name` VARCHAR(255) NULL,
  `image_type` VARCHAR(255) NULL,
  `image_size` INT NULL,
  `video_url` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_materi_slides_materi_id_materi_id` FOREIGN KEY (`materi_id`) REFERENCES `materi` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `projects` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` LONGTEXT NULL,
  `category` VARCHAR(255) NULL,
  `level` VARCHAR(255) NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `deleted_at` DATETIME NULL,
  `version` INT NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `cover_image_name` VARCHAR(255) NULL,
  `cover_image_type` VARCHAR(255) NULL,
  `cover_image_size` INT NULL,
  `cover_image_path` VARCHAR(255) NULL,
  `cover_image_url` LONGTEXT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_projects_user_id_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tutorial_chapters` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tutorial_id` INT NOT NULL,
  `chapter_order` INT NOT NULL DEFAULT 1,
  `title` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tutorial_chapters_tutorial_id_tutorials_id` FOREIGN KEY (`tutorial_id`) REFERENCES `tutorials` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tutorial_learning_objectives` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tutorial_id` INT NOT NULL,
  `objective_order` INT NOT NULL DEFAULT 1,
  `objective` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tutorial_learning_objectives_tutorial_id_tutorials_id` FOREIGN KEY (`tutorial_id`) REFERENCES `tutorials` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tutorial_slides` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tutorial_id` INT NOT NULL,
  `slide_order` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content_type` LONGTEXT NOT NULL,
  `content` LONGTEXT NULL,
  `image_name` VARCHAR(255) NULL,
  `video_url` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  `image_path` VARCHAR(255) NULL,
  `image_url` LONGTEXT NULL,
  `estimated_time` VARCHAR(255) NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'draft',
  `image_type` VARCHAR(255) NULL,
  `image_size` INT NULL,
  `chapter_id` INT NULL,
  `code_title` VARCHAR(255) NULL,
  `code_language` VARCHAR(255) NULL,
  `code_content` LONGTEXT NULL,
  `allow_copy` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tutorial_slides_tutorial_id_tutorials_id` FOREIGN KEY (`tutorial_id`) REFERENCES `tutorials` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_sessions` (
  `id` VARCHAR(191) NOT NULL,
  `user_id` INT NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL,
  `last_used_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sqlite_autoindex_user_sessions_2` (`token_hash`),
  CONSTRAINT `fk_user_sessions_user_id_users_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_articles_category` ON `articles` (`category`);
CREATE INDEX `idx_articles_status` ON `articles` (`status`, `published_at`);
CREATE INDEX `idx_certificates_workshop` ON `certificates` (`workshop_id`);
CREATE INDEX `idx_certificates_status` ON `certificates` (`status`);
CREATE INDEX `idx_certificates_user` ON `certificates` (`user_id`);
CREATE INDEX `idx_certificates_email` ON `certificates` (`email`);
CREATE INDEX `materi_status_order_idx` ON `materi` (`status`, `active`, `show_on_page`, `page_order`, `display_order`);
CREATE INDEX `idx_partners_homepage` ON `partners` (`show_homepage`, `featured`);
CREATE INDEX `idx_partners_status` ON `partners` (`status`);
CREATE INDEX `idx_payment_methods_active` ON `payment_methods` (`is_active`);
CREATE INDEX `programs_deleted_idx` ON `programs` (`deleted_at`);
CREATE INDEX `programs_status_idx` ON `programs` (`status`);
CREATE INDEX `sync_outbox_worker_idx` ON `sync_outbox` (`worker_id`, `status`);
CREATE INDEX `sync_outbox_ready_idx` ON `sync_outbox` (`status`, `next_retry_at`, `created_at`);
CREATE INDEX `idx_transactions_created_at` ON `transactions` (`created_at`);
CREATE INDEX `idx_transactions_status` ON `transactions` (`status`);
CREATE INDEX `idx_transactions_email` ON `transactions` (`email`);
CREATE INDEX `idx_transactions_user_id` ON `transactions` (`user_id`);
CREATE INDEX `idx_user_entitlements_email` ON `user_entitlements` (`email`);
CREATE INDEX `idx_user_entitlements_user_id` ON `user_entitlements` (`user_id`);
CREATE INDEX `users_password_reset_token_idx` ON `users` (`password_reset_token`);
CREATE INDEX `users_verification_token_idx` ON `users` (`verification_token`);
-- SQLite partial unique index users_username_unique was converted to a regular MySQL index; enforce the partial uniqueness rule separately if needed.
CREATE INDEX `users_username_unique` ON `users` (`username`);
-- SQLite partial unique index users_whatsapp_unique was converted to a regular MySQL index; enforce the partial uniqueness rule separately if needed.
CREATE INDEX `users_whatsapp_unique` ON `users` (`whatsapp`);
CREATE INDEX `workshop_registrations_workshop_idx` ON `workshop_registrations` (`workshop_id`, `status`, `created_at`);
CREATE INDEX `idx_workshop_registrations_created_at` ON `workshop_registrations` (`created_at`);
CREATE INDEX `idx_workshop_registrations_status` ON `workshop_registrations` (`status`);
CREATE INDEX `idx_workshop_registrations_email` ON `workshop_registrations` (`participant_email`);
CREATE INDEX `idx_workshops_category` ON `workshops` (`category`);
CREATE INDEX `idx_workshops_status` ON `workshops` (`status`);
CREATE INDEX `admin_sessions_token_hash_idx` ON `admin_sessions` (`token_hash`);
CREATE INDEX `materi_slides_materi_order_idx` ON `materi_slides` (`materi_id`, `slide_order`);
CREATE INDEX `idx_tutorial_chapters_tutorial` ON `tutorial_chapters` (`tutorial_id`, `chapter_order`);
CREATE INDEX `idx_tutorial_objectives_tutorial` ON `tutorial_learning_objectives` (`tutorial_id`, `objective_order`);
CREATE INDEX `idx_tutorial_slides_chapter` ON `tutorial_slides` (`tutorial_id`, `chapter_id`, `slide_order`);
CREATE INDEX `user_sessions_token_hash_idx` ON `user_sessions` (`token_hash`);
