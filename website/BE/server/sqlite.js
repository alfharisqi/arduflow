import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

let connection;

export function applySqlitePragmas(database) {
  database.exec('PRAGMA journal_mode = WAL');
  database.exec('PRAGMA foreign_keys = ON');
  database.exec('PRAGMA busy_timeout = 5000');
  database.exec('PRAGMA synchronous = NORMAL');
}

export function openSqliteDatabase(filePath = config.database.sqlitePath, options = {}) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const database = new DatabaseSync(filePath, options);
  applySqlitePragmas(database);
  return database;
}

export function sqliteConnection() {
  if (!connection) {
    connection = openSqliteDatabase();
  }

  return connection;
}

export function closeSqliteConnection() {
  if (connection) {
    connection.close();
    connection = undefined;
  }
}

export function withSqliteTransaction(callback, mode = 'IMMEDIATE') {
  const database = sqliteConnection();
  database.exec(`BEGIN ${mode}`);

  try {
    const result = callback(database);
    database.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      database.exec('ROLLBACK');
    } catch {
      // Preserve the original transaction error.
    }
    throw error;
  }
}

export function sqliteNow(date = new Date()) {
  return date.toISOString();
}
