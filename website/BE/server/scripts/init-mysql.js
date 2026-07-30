import fs from 'node:fs';
import mysql from 'mysql2/promise';
import { config, rootPath } from '../config.js';

const schema = fs.readFileSync(rootPath('database/mysql/schema.sql'), 'utf8');
const statements = schema
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

const connection = await mysql.createConnection({
  host: config.database.mysql.host,
  port: config.database.mysql.port,
  user: config.database.mysql.user,
  password: config.database.mysql.password,
  multipleStatements: false,
});

await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database.mysql.database}\``);
await connection.query(`USE \`${config.database.mysql.database}\``);

for (const statement of statements) {
  await connection.query(statement);
}

async function ensureUsersColumn(columnName, definition) {
  const [columns] = await connection.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = ?`,
    [config.database.mysql.database, columnName],
  );

  if (columns.length === 0) {
    await connection.query(`ALTER TABLE users ADD COLUMN ${definition}`);
  }
}

await ensureUsersColumn('username', 'username VARCHAR(80) NULL');
await ensureUsersColumn('nickname', 'nickname VARCHAR(80) NULL');
await ensureUsersColumn('institution_name', 'institution_name VARCHAR(160) NULL');

const [usernameIndexes] = await connection.query(
  `SELECT INDEX_NAME
   FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = ?
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'username'
     AND NON_UNIQUE = 0`,
  [config.database.mysql.database],
);

if (usernameIndexes.length === 0) {
  try {
    await connection.query('ALTER TABLE users ADD UNIQUE INDEX uq_users_username (username)');
  } catch (error) {
    console.warn('Unique index users.username belum dibuat. Pastikan tidak ada username duplikat, lalu jalankan init lagi.');
    console.warn(error.message);
  }
}

const [whatsappIndexes] = await connection.query(
  `SELECT INDEX_NAME
   FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = ?
     AND TABLE_NAME = 'users'
     AND COLUMN_NAME = 'whatsapp'
     AND NON_UNIQUE = 0`,
  [config.database.mysql.database],
);

if (whatsappIndexes.length === 0) {
  try {
    await connection.query('ALTER TABLE users ADD UNIQUE INDEX uq_users_whatsapp (whatsapp)');
  } catch (error) {
    console.warn('Unique index users.whatsapp belum dibuat. Pastikan tidak ada nomor WhatsApp duplikat, lalu jalankan init lagi.');
    console.warn(error.message);
  }
}

await connection.end();

console.log(`MySQL database initialized: ${config.database.mysql.database}`);
