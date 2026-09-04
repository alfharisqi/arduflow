CREATE TABLE IF NOT EXISTS project_submissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'draft',
    visibility VARCHAR(64) NOT NULL DEFAULT 'draft',
    cover_image_name VARCHAR(255) NULL,
    cover_image_type VARCHAR(128) NULL,
    cover_image_size BIGINT UNSIGNED NULL,
    cover_image_path VARCHAR(1000) NULL,
    cover_image_url VARCHAR(1000) NULL,
    project_file_name VARCHAR(255) NULL,
    project_file_type VARCHAR(128) NULL,
    project_file_size BIGINT UNSIGNED NULL,
    project_file_path VARCHAR(1000) NULL,
    project_file_url VARCHAR(1000) NULL,
    circuit_image_name VARCHAR(255) NULL,
    circuit_image_type VARCHAR(128) NULL,
    circuit_image_size BIGINT UNSIGNED NULL,
    circuit_image_path VARCHAR(1000) NULL,
    circuit_image_url VARCHAR(1000) NULL,
    component_images_json LONGTEXT NULL,
    payload_json LONGTEXT NOT NULL,
    deleted_at DATETIME NULL,
    version INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_project_submissions_status (status),
    INDEX idx_project_submissions_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

ALTER TABLE user_entitlements ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;
ALTER TABLE user_entitlements ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS workshop_registrations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    workshop_id BIGINT UNSIGNED NULL,
    transaction_id BIGINT UNSIGNED NULL,
    user_id BIGINT UNSIGNED NULL,
    name VARCHAR(191) NOT NULL,
    email VARCHAR(191) NOT NULL,
    whatsapp VARCHAR(64) NULL,
    institution VARCHAR(191) NULL,
    occupation VARCHAR(191) NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'pending',
    notes TEXT NULL,
    payload_json LONGTEXT NULL,
    deleted_at DATETIME NULL,
    version INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_workshop_registrations_workshop_id (workshop_id),
    INDEX idx_workshop_registrations_transaction_id (transaction_id),
    INDEX idx_workshop_registrations_user_id (user_id),
    INDEX idx_workshop_registrations_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
