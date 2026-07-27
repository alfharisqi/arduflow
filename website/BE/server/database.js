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

function isMysql() {
  return config.database.connection === 'mysql';
}

export async function one(sql, params = []) {
  if (isMysql()) {
    const pool = await mysqlConnection();
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  }

  return sqliteConnection().prepare(sql).get(...params) || null;
}

export async function run(sql, params = []) {
  if (isMysql()) {
    const pool = await mysqlConnection();
    const [result] = await pool.execute(sql, params);
    return result;
  }

  return sqliteConnection().prepare(sql).run(...params);
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

  await run(
    'INSERT INTO leads (name, email, phone, interest, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [values.name, values.email, values.phone, values.interest, values.message, values.created_at],
  );
}

export async function findUserByEmail(email) {
  return one('SELECT * FROM users WHERE email = ?', [email]);
}

export async function findUserByIdentifier(identifier) {
  return one('SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)', [identifier, identifier]);
}

export async function createUser(user) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  await run(
    `INSERT INTO users (
      name,
      email,
      whatsapp,
      occupation,
      password_hash,
      verification_token,
      verification_sent_at,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.name,
      user.email,
      user.whatsapp || null,
      user.occupation || null,
      user.passwordHash,
      user.verificationToken,
      now,
      now,
      now,
    ],
  );

  return findUserByEmail(user.email);
}

export async function verifyUserEmail(token) {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const user = await one('SELECT * FROM users WHERE verification_token = ?', [token]);

  if (!user) {
    return null;
  }

  await run(
    'UPDATE users SET email_verified_at = ?, verification_token = NULL, updated_at = ? WHERE id = ?',
    [now, now, user.id],
  );

  return findUserByEmail(user.email);
}

export function health() {
  return {
    status: 'ok',
    database: config.database.connection,
  };
}
