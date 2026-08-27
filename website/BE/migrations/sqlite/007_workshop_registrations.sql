CREATE TABLE IF NOT EXISTS workshop_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participant_name TEXT NOT NULL,
    participant_email TEXT NOT NULL,
    participant_whatsapp TEXT NOT NULL,
    institution_name TEXT,
    workshop_id INTEGER,
    transaction_id INTEGER,
    workshop_choice TEXT NOT NULL,
    participant_estimate TEXT,
    member_names TEXT,
    notes TEXT,
    source TEXT NOT NULL DEFAULT 'website',
    status TEXT NOT NULL DEFAULT 'new',
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS workshop_registrations_workshop_idx
ON workshop_registrations(workshop_id, status, created_at);
