import fs from 'node:fs';
import path from 'node:path';
import { config, rootPath } from '../config.js';
import { backupSqlite } from '../backup.js';
import { migrateSqlite } from '../migrations.js';
import { openSqliteDatabase } from '../sqlite.js';

fs.mkdirSync(path.dirname(config.database.sqlitePath), { recursive: true });

const legacyPath = rootPath('storage/sqlite/arduflow.sqlite');

if (!fs.existsSync(config.database.sqlitePath) && fs.existsSync(legacyPath)) {
  fs.mkdirSync(path.dirname(config.database.sqlitePath), { recursive: true });
  const legacy = openSqliteDatabase(legacyPath);
  const escapedTarget = config.database.sqlitePath.replaceAll("'", "''");
  legacy.exec(`VACUUM INTO '${escapedTarget}'`);
  legacy.close();
  console.log('Legacy SQLite database copied to the configured private database directory.');
}

if (config.sqliteBackup.enabled && fs.existsSync(config.database.sqlitePath)) {
  const backupPath = backupSqlite({ label: 'pre-migration' });
  console.log(`SQLite pre-migration backup created: ${backupPath}`);
}

const database = openSqliteDatabase();
migrateSqlite(database);
database.close();

console.log(`SQLite database initialized: ${config.database.sqlitePath}`);
