ALTER TABLE workshops ADD COLUMN IF NOT EXISTS cover_image_name VARCHAR(255) NULL;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS cover_image_type VARCHAR(128) NULL;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS cover_image_size INT NULL;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS cover_image_path VARCHAR(1000) NULL;
ALTER TABLE workshops ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(1000) NULL;

ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS card_image_name VARCHAR(255) NULL;
ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS card_image_type VARCHAR(128) NULL;
ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS card_image_size INT NULL;
ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS card_image_path VARCHAR(1000) NULL;
ALTER TABLE tutorials ADD COLUMN IF NOT EXISTS card_image_url VARCHAR(1000) NULL;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image_name VARCHAR(255) NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image_type VARCHAR(128) NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image_size INT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image_path VARCHAR(1000) NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(1000) NULL;

CREATE TABLE IF NOT EXISTS gallery_items (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    category VARCHAR(128) NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'draft',
    image_name VARCHAR(255) NULL,
    image_type VARCHAR(128) NULL,
    image_size INT NULL,
    image_path VARCHAR(1000) NULL,
    image_url VARCHAR(1000) NULL,
    payload_json LONGTEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gallery_submissions (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    tag VARCHAR(128) NOT NULL,
    description TEXT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    detail_link VARCHAR(1000) NULL,
    note TEXT NULL,
    cover_path VARCHAR(1000) NULL,
    cover_url VARCHAR(1000) NULL,
    cover_original_name VARCHAR(255) NULL,
    cover_mime VARCHAR(128) NULL,
    cover_size INT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'draft',
    payload_json LONGTEXT NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
