import fs from 'node:fs';
import { rootPath } from './config.js';
import { sqliteNow } from './sqlite.js';

function hasColumn(database, tableName, columnName) {
  return database.prepare(`PRAGMA table_info(${tableName})`).all()
    .some((column) => column.name === columnName);
}

function ensureColumn(database, tableName, columnName, definition) {
  if (!hasColumn(database, tableName, columnName)) {
    database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function tableExists(database, tableName) {
  return Boolean(database.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
  ).get(tableName));
}

function addOperationalColumns(database, tableName) {
  if (!tableExists(database, tableName)) {
    return;
  }

  ensureColumn(database, tableName, 'version', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn(database, tableName, 'deleted_at', 'TEXT NULL');
  ensureColumn(database, tableName, 'updated_at', 'TEXT NULL');
  database.prepare(
    `UPDATE ${tableName}
     SET updated_at = COALESCE(updated_at, created_at, ?),
         version = COALESCE(version, 1)`,
  ).run(sqliteNow());
}

export function migrateSqlite(database) {
  const schema = fs.readFileSync(rootPath('database/sqlite/schema.sql'), 'utf8')
    .replace(/^PRAGMA .*;\s*$/gm, '');

  database.exec('BEGIN IMMEDIATE');
  try {
    // Add columns required by indexes before applying the idempotent schema.
    if (tableExists(database, 'users')) {
      ensureColumn(database, 'users', 'username', 'TEXT NULL');
      ensureColumn(database, 'users', 'nickname', 'TEXT NULL');
      ensureColumn(database, 'users', 'institution_name', 'TEXT NULL');
      ensureColumn(database, 'users', 'profile_image', 'TEXT NULL');
      ensureColumn(database, 'users', 'version', 'INTEGER NOT NULL DEFAULT 1');
      ensureColumn(database, 'users', 'deleted_at', 'TEXT NULL');
    }

    for (const tableName of ['leads', 'programs', 'tutorials', 'projects']) {
      addOperationalColumns(database, tableName);
    }

    database.exec(schema);
    ensureColumn(database, 'sync_logs', 'duration_ms', 'INTEGER NULL');
    ensureColumn(database, 'sync_logs', 'mysql_status', 'TEXT NULL');
    database.exec('CREATE UNIQUE INDEX IF NOT EXISTS uq_users_username ON users (username) WHERE username IS NOT NULL');
    database.exec('CREATE UNIQUE INDEX IF NOT EXISTS uq_users_whatsapp ON users (whatsapp) WHERE whatsapp IS NOT NULL');

    database.prepare(
      `INSERT OR IGNORE INTO schema_migrations (version, applied_at)
       VALUES ('001_sqlite_primary_outbox', ?)`,
    ).run(sqliteNow());
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}
