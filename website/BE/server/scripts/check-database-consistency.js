import { initializeOperationalDatabase } from '../database.js';
import { closeMysqlPool, mysqlPool } from '../mysql.js';

const tables = ['users', 'admins', 'leads', 'workshops', 'programs', 'tutorials', 'projects'];
const sqlite = initializeOperationalDatabase();
const report = { tables: {}, outboxPending: 0 };

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toISOString().slice(0, 19);
}

try {
  for (const tableName of tables) {
    const sqliteRows = sqlite.prepare(
      `SELECT id, version, updated_at, deleted_at FROM \`${tableName}\` ORDER BY id`,
    ).all();
    const [exists] = await mysqlPool().execute(
      `SELECT 1 FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
      [tableName],
    );
    if (exists.length === 0) {
      report.tables[tableName] = { sqlite: sqliteRows.length, mysql: null, tableMissing: true };
      continue;
    }

    const [mysqlRows] = await mysqlPool().query(
      `SELECT id, version, updated_at, deleted_at FROM \`${tableName}\` ORDER BY id`,
    );
    const mysqlById = new Map(mysqlRows.map((row) => [String(row.id), row]));
    const missingInMysql = [];
    const versionMismatch = [];
    const updatedAtMismatch = [];
    const deletedAtMismatch = [];

    for (const row of sqliteRows) {
      const central = mysqlById.get(String(row.id));
      if (!central) {
        missingInMysql.push(row.id);
        continue;
      }
      if (Number(row.version || 1) !== Number(central.version || 1)) versionMismatch.push(row.id);
      if (normalizeDate(row.updated_at) !== normalizeDate(central.updated_at)) updatedAtMismatch.push(row.id);
      if (normalizeDate(row.deleted_at) !== normalizeDate(central.deleted_at)) deletedAtMismatch.push(row.id);
    }

    report.tables[tableName] = {
      sqlite: sqliteRows.length,
      mysql: mysqlRows.length,
      missingInMysql,
      missingInSqlite: mysqlRows.filter((row) => !sqliteRows.some((local) => String(local.id) === String(row.id))).map((row) => row.id),
      versionMismatch,
      updatedAtMismatch,
      deletedAtMismatch,
    };
  }
  report.outboxPending = Number(sqlite.prepare(
    "SELECT COUNT(*) AS total FROM sync_outbox WHERE status != 'synced'",
  ).get().total);
} finally {
  await closeMysqlPool();
}

console.log(JSON.stringify(report, null, 2));
