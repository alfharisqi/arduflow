CREATE TABLE IF NOT EXISTS gallery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    image_name TEXT,
    image_type TEXT,
    image_size INTEGER,
    image_path TEXT,
    image_url TEXT,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gallery_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    tag TEXT NOT NULL,
    description TEXT NOT NULL,
    user_name TEXT NOT NULL,
    event_date TEXT NOT NULL,
    detail_link TEXT NULL,
    note TEXT NULL,
    cover_path TEXT NULL,
    cover_url TEXT NULL,
    cover_original_name TEXT NULL,
    cover_mime TEXT NULL,
    cover_size INTEGER NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
