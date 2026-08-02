import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import mysql from 'mysql2/promise';
import { config } from '../config.js';

function resetSqliteUsers() {
  fs.mkdirSync(path.dirname(config.database.sqlitePath), { recursive: true });

  const database = new DatabaseSync(config.database.sqlitePath);
  const usersTable = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'")
    .get();
  const authLogsTable = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'auth_logs'")
    .get();

  if (usersTable) {
    database.prepare('DELETE FROM users').run();
    database.prepare("DELETE FROM sqlite_sequence WHERE name = 'users'").run();
    console.log('SQLite users cleared.');
  } else {
    console.log('SQLite users table not found, skipped.');
  }

  if (authLogsTable) {
    database.prepare('DELETE FROM auth_logs').run();
    database.prepare("DELETE FROM sqlite_sequence WHERE name = 'auth_logs'").run();
    console.log('SQLite auth logs cleared.');
  }

  database.close();
}

async function resetMysqlUsers() {
  try {
    const connection = await mysql.createConnection({
      host: config.database.mysql.host,
      port: config.database.mysql.port,
      user: config.database.mysql.user,
      password: config.database.mysql.password,
      database: config.database.mysql.database,
    });

    await connection.query('DELETE FROM users');
    await connection.query('ALTER TABLE users AUTO_INCREMENT = 1');
    await connection.end();

    console.log('MySQL users cleared.');
  } catch (error) {
    console.log(`MySQL users not cleared: ${error.code || error.message}`);
  }
}

resetSqliteUsers();
await resetMysqlUsers();
