CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NULL,
    interest TEXT NOT NULL DEFAULT 'akses',
    message TEXT NULL,
    created_at TEXT NOT NULL
);

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
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tutorials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    level TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    project_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL
);
