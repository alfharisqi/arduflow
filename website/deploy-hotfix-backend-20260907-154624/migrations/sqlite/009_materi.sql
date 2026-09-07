CREATE TABLE IF NOT EXISTS materi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 1,
    short_description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    card_image_name TEXT,
    card_image_type TEXT,
    card_image_size INTEGER,
    difficulty_level TEXT,
    estimated_time TEXT,
    page_order INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft',
    active INTEGER NOT NULL DEFAULT 1,
    show_on_page INTEGER NOT NULL DEFAULT 1,
    featured INTEGER NOT NULL DEFAULT 0,
    comments INTEGER NOT NULL DEFAULT 1,
    access_type TEXT,
    featured_order INTEGER,
    user_level TEXT NOT NULL DEFAULT 'semua_pengguna',
    access_requirement TEXT,
    prerequisite TEXT,
    cta_text TEXT,
    cta_target_link TEXT,
    cta_url_slug TEXT,
    publish_schedule TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS materi_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    materi_id INTEGER NOT NULL,
    slide_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'text',
    content TEXT,
    estimated_time TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    image_name TEXT,
    image_type TEXT,
    image_size INTEGER,
    video_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (materi_id) REFERENCES materi(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS materi_status_order_idx
ON materi(status, active, show_on_page, page_order, display_order);

CREATE INDEX IF NOT EXISTS materi_slides_materi_order_idx
ON materi_slides(materi_id, slide_order);
