CREATE INDEX IF NOT EXISTS workshops_status_start_idx ON workshops(status, start_at);
CREATE INDEX IF NOT EXISTS workshops_deleted_idx ON workshops(deleted_at);
CREATE INDEX IF NOT EXISTS programs_status_idx ON programs(status);
CREATE INDEX IF NOT EXISTS programs_deleted_idx ON programs(deleted_at);
