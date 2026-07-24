import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import mysql from 'mysql2/promise';
import { config } from './config.js';

let sqlite;
let mysqlPool;

function sqliteConnection() {
  if (!sqlite) {
    fs.mkdirSync(path.dirname(config.database.sqlitePath), { recursive: true });
    sqlite = new DatabaseSync(config.database.sqlitePath);
  }

  return sqlite;
}

async function mysqlConnection() {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool({
      ...config.database.mysql,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  return mysqlPool;
}

export async function insertLead(lead) {
  const values = {
    name: lead.name,
    email: lead.email,
    phone: lead.phone || null,
    interest: lead.interest || 'akses',
    message: lead.message || null,
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  };

  if (config.database.connection === 'mysql') {
    const pool = await mysqlConnection();
    await pool.execute(
      'INSERT INTO leads (name, email, phone, interest, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [values.name, values.email, values.phone, values.interest, values.message, values.created_at],
    );
    return;
  }

  sqliteConnection()
    .prepare('INSERT INTO leads (name, email, phone, interest, message, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(values.name, values.email, values.phone, values.interest, values.message, values.created_at);
}

export function health() {
  return {
    status: 'ok',
    database: config.database.connection,
  };
}
