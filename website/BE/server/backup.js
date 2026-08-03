import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { openSqliteDatabase } from './sqlite.js';

function timestamp(date = new Date()) {
  return date.toISOString().replaceAll(':', '-').replaceAll('.', '-');
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

export function pruneSqliteBackups(now = new Date()) {
  if (!fs.existsSync(config.sqliteBackup.directory)) {
    return [];
  }

  const cutoff = now.getTime() - (config.sqliteBackup.retentionDays * 24 * 60 * 60 * 1000);
  const removed = [];

  for (const entry of fs.readdirSync(config.sqliteBackup.directory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.sqlite')) {
      continue;
    }

    const filePath = path.join(config.sqliteBackup.directory, entry.name);
    if (fs.statSync(filePath).mtimeMs < cutoff) {
      fs.rmSync(filePath);
      removed.push(filePath);
    }
  }

  return removed;
}

export function backupSqlite({ sourcePath = config.database.sqlitePath, label = 'arduflow' } = {}) {
  if (!fs.existsSync(sourcePath)) {
    return null;
  }

  fs.mkdirSync(config.sqliteBackup.directory, { recursive: true });
  const destination = path.join(
    config.sqliteBackup.directory,
    `${label}-${timestamp()}.sqlite`,
  );
  const source = openSqliteDatabase(sourcePath);

  try {
    source.exec(`VACUUM INTO ${sqlString(destination)}`);
  } finally {
    source.close();
  }

  pruneSqliteBackups();
  return destination;
}
