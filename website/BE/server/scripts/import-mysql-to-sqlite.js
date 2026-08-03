import { backupSqlite } from '../backup.js';
import { initializeOperationalDatabase } from '../database.js';
import { closeMysqlPool, mysqlPool } from '../mysql.js';
import { closeSqliteConnection } from '../sqlite.js';

const tables = ['users', 'admins', 'leads', 'workshops', 'programs', 'tutorials', 'projects'];
const sqlite = initializeOperationalDatabase();
const summary = {};

const unsyncedOutbox = sqlite.prepare(
  `SELECT COUNT(*) AS total FROM sync_outbox WHERE status != 'synced'`,
).get();
if (Number(unsyncedOutbox.total) > 0) {
  closeSqliteConnection();
  throw new Error(
    `Import dibatalkan: masih ada ${unsyncedOutbox.total} event outbox yang belum synced. `
    + 'Jalankan worker dan pastikan outbox bersih sebelum mengimpor MySQL.',
  );
}

function normalizeValue(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function sqliteColumns(tableName) {
  return new Set(sqlite.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name));
}

async function mysqlTableExists(tableName) {
  const [rows] = await mysqlPool().execute(
    `SELECT 1 FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName],
  );
  return rows.length > 0;
}

if (process.env.SKIP_SQLITE_IMPORT_BACKUP !== 'true') {
  const backupPath = backupSqlite();
  console.log(`Pre-import backup: ${backupPath || 'database SQLite belum tersedia'}`);
}

try {
  for (const tableName of tables) {
    if (!(await mysqlTableExists(tableName))) {
      summary[tableName] = { imported: 0, skipped: 'table_missing' };
      continue;
    }

    const [rows] = await mysqlPool().query(`SELECT * FROM \`${tableName}\` ORDER BY id`);
    const allowed = sqliteColumns(tableName);
    let imported = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        const columns = Object.keys(row).filter((column) => allowed.has(column));
        const placeholders = columns.map(() => '?').join(', ');
        const updates = columns.filter((column) => column !== 'id')
          .map((column) => `\`${column}\` = excluded.\`${column}\``).join(', ');
        sqlite.prepare(
          `INSERT INTO \`${tableName}\` (${columns.map((column) => `\`${column}\``).join(', ')})
           VALUES (${placeholders})
           ON CONFLICT(id) DO UPDATE SET ${updates}`,
        ).run(...columns.map((column) => normalizeValue(row[column])));
        imported += 1;
      } catch (error) {
        failed += 1;
        console.error(`${tableName} id=${row.id}: ${error.message}`);
      }
    }
    summary[tableName] = { imported, failed, sourceRows: rows.length };
  }
} finally {
  await closeMysqlPool();
}

console.log(JSON.stringify(summary, null, 2));
