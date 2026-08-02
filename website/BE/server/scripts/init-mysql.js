import fs from 'node:fs';
import mysql from 'mysql2/promise';
import { config, rootPath } from '../config.js';

const schema = fs.readFileSync(rootPath('database/mysql/schema.sql'), 'utf8');
const statements = schema.split(';').map((value) => value.trim()).filter(Boolean);
const connection = await mysql.createConnection({
  host: config.database.mysql.host,
  port: config.database.mysql.port,
  user: config.database.mysql.user,
  password: config.database.mysql.password,
  connectTimeout: config.database.mysql.connectTimeout,
  multipleStatements: false,
});

async function columnExists(tableName, columnName) {
  const [rows] = await connection.execute(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [config.database.mysql.database, tableName, columnName],
  );
  return rows.length > 0;
}

async function tableExists(tableName) {
  const [rows] = await connection.execute(
    `SELECT 1 FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [config.database.mysql.database, tableName],
  );
  return rows.length > 0;
}

async function ensureColumn(tableName, columnName, definition) {
  if (await tableExists(tableName) && !(await columnExists(tableName, columnName))) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  }
}

async function ensureUniqueIndex(tableName, indexName, columnName) {
  const [rows] = await connection.execute(
    `SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [config.database.mysql.database, tableName, indexName],
  );
  if (rows.length === 0) {
    await connection.query(
      `ALTER TABLE \`${tableName}\` ADD UNIQUE INDEX \`${indexName}\` (\`${columnName}\`)`,
    );
  }
}

try {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database.mysql.database}\``);
  await connection.query(`USE \`${config.database.mysql.database}\``);

  const additions = {
    users: {
      username: 'VARCHAR(80) NULL', nickname: 'VARCHAR(80) NULL',
      institution_name: 'VARCHAR(160) NULL', profile_image: 'MEDIUMTEXT NULL',
      version: 'INT UNSIGNED NOT NULL DEFAULT 1', deleted_at: 'DATETIME NULL',
    },
    admins: {
      version: 'INT UNSIGNED NOT NULL DEFAULT 1', deleted_at: 'DATETIME NULL',
    },
    leads: {
      version: 'INT UNSIGNED NOT NULL DEFAULT 1', deleted_at: 'DATETIME NULL',
      updated_at: 'DATETIME NULL',
    },
    programs: {
      version: 'INT UNSIGNED NOT NULL DEFAULT 1', deleted_at: 'DATETIME NULL',
      updated_at: 'DATETIME NULL',
    },
    tutorials: {
      version: 'INT UNSIGNED NOT NULL DEFAULT 1', deleted_at: 'DATETIME NULL',
      updated_at: 'DATETIME NULL',
    },
    projects: {
      version: 'INT UNSIGNED NOT NULL DEFAULT 1', deleted_at: 'DATETIME NULL',
      updated_at: 'DATETIME NULL',
    },
  };

  for (const [tableName, columns] of Object.entries(additions)) {
    for (const [columnName, definition] of Object.entries(columns)) {
      await ensureColumn(tableName, columnName, definition);
    }
  }

  // CREATE TABLE IF NOT EXISTS now succeeds against both fresh and legacy schemas.
  for (const statement of statements) {
    await connection.query(statement);
  }

  await ensureUniqueIndex('users', 'uq_users_username', 'username');
  await ensureUniqueIndex('users', 'uq_users_whatsapp', 'whatsapp');

  for (const tableName of ['leads', 'programs', 'tutorials', 'projects']) {
    if (await tableExists(tableName)) {
      await connection.query(
        `UPDATE \`${tableName}\`
         SET version = COALESCE(version, 1),
             updated_at = COALESCE(updated_at, created_at, UTC_TIMESTAMP())`,
      );
    }
  }
} finally {
  await connection.end();
}

console.log(`MySQL database initialized: ${config.database.mysql.database}`);
