ALTER TABLE users ADD COLUMN profile_image TEXT NULL;
ALTER TABLE users ADD COLUMN password_reset_sent_at TEXT NULL;
ALTER TABLE admins ADD COLUMN last_login_at TEXT NULL;

CREATE INDEX IF NOT EXISTS users_verification_token_idx ON users(verification_token);
CREATE INDEX IF NOT EXISTS users_password_reset_token_idx ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS user_sessions_token_hash_idx ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS admin_sessions_token_hash_idx ON admin_sessions(token_hash);
