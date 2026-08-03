PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;

CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT NULL,
    nickname TEXT NULL,
    email TEXT NOT NULL UNIQUE,
    whatsapp TEXT NULL,
    occupation TEXT NULL,
    institution_name TEXT NULL,
    profile_image TEXT NULL,
    password_hash TEXT NOT NULL,
    email_verified_at TEXT NULL,
    verification_token TEXT NULL,
    verification_sent_at TEXT NULL,
    password_reset_token TEXT NULL,
    password_reset_sent_at TEXT NULL,
    password_reset_expires_at TEXT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON users (username) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_whatsapp ON users (whatsapp) WHERE whatsapp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users (verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users (password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);

CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'super_admin',
    is_active INTEGER NOT NULL DEFAULT 1,
    last_login_at TEXT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions (admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions (expires_at);

CREATE TABLE IF NOT EXISTS user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions (expires_at);

CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NULL,
    interest TEXT NOT NULL DEFAULT 'akses',
    message TEXT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workshops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NULL,
    method TEXT NULL,
    location TEXT NULL,
    description TEXT NULL,
    starts_at TEXT NULL,
    ends_at TEXT NULL,
    capacity INTEGER NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workshops_status ON workshops (status);
CREATE INDEX IF NOT EXISTS idx_workshops_deleted_at ON workshops (deleted_at);

CREATE TABLE IF NOT EXISTS auth_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NULL,
    email TEXT NULL,
    event TEXT NOT NULL,
    ip TEXT NULL,
    user_agent TEXT NULL,
    meta TEXT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_email ON auth_logs (email);
CREATE INDEX IF NOT EXISTS idx_auth_logs_event ON auth_logs (event);

CREATE TABLE IF NOT EXISTS cache_items (
    cache_key TEXT PRIMARY KEY,
    cache_value TEXT NOT NULL,
    expires_at TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tutorials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    level TEXT NOT NULL,
    description TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    project_type TEXT NOT NULL,
    description TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_outbox (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE,
    table_name TEXT NOT NULL,
    row_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
    payload TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'synced', 'failed')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    next_retry_at TEXT NULL,
    last_error TEXT NULL,
    worker_id TEXT NULL,
    locked_at TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    synced_at TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_outbox_dispatch ON sync_outbox (status, next_retry_at, created_at);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_worker ON sync_outbox (worker_id, status);

CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT NOT NULL,
    total_events INTEGER NOT NULL,
    success_events INTEGER NOT NULL DEFAULT 0,
    failed_events INTEGER NOT NULL DEFAULT 0,
    started_at TEXT NOT NULL,
    finished_at TEXT NULL,
    duration_ms INTEGER NULL,
    mysql_status TEXT NULL,
    error_message TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs (started_at);
