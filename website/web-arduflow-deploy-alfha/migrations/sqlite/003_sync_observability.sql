ALTER TABLE sync_logs ADD COLUMN duration_ms INTEGER NULL;
ALTER TABLE sync_logs ADD COLUMN mysql_status TEXT NULL;

CREATE INDEX IF NOT EXISTS sync_outbox_worker_idx
ON sync_outbox(worker_id, status);

CREATE TABLE IF NOT EXISTS sync_rate_limits (
    client_key TEXT PRIMARY KEY,
    window_started_at INTEGER NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1
);
