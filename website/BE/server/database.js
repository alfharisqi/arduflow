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

function now() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

async function mysqlOne(sql, params = []) {
  const pool = await mysqlConnection();
  const [rows] = await pool.execute(sql, params);

  return rows[0] || null;
}

async function mysqlRun(sql, params = []) {
  const pool = await mysqlConnection();
  const [result] = await pool.execute(sql, params);

  return result;
}

function sqliteRun(sql, params = []) {
  return sqliteConnection().prepare(sql).run(...params);
}

export async function insertAuthLog({ userId = null, email = '', event, ip = '', userAgent = '', meta = null }) {
  try {
    sqliteRun(
      'INSERT INTO auth_logs (user_id, email, event, ip, user_agent, meta, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        userId,
        email || null,
        event,
        ip || null,
        userAgent || null,
        meta ? JSON.stringify(meta) : null,
        now(),
      ],
    );
  } catch (error) {
    console.error('SQLite auth log failed:', error);
  }
}

export async function insertLead(lead) {
  const values = {
    name: lead.name,
    email: lead.email,
    phone: lead.phone || null,
    interest: lead.interest || 'akses',
    message: lead.message || null,
    created_at: now(),
  };

  await mysqlRun(
    'INSERT INTO leads (name, email, phone, interest, message, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [values.name, values.email, values.phone, values.interest, values.message, values.created_at],
  );
}

export async function findUserByEmail(email) {
  return mysqlOne('SELECT * FROM users WHERE email = ?', [email]);
}

export async function findUserByIdentifier(identifier) {
  return mysqlOne('SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)', [identifier, identifier]);
}

export async function createUser(user) {
  const createdAt = now();

  await mysqlRun(
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
      createdAt,
      createdAt,
      createdAt,
    ],
  );

  return findUserByEmail(user.email);
}

export async function verifyUserEmail(token) {
  const verifiedAt = now();
  const user = await mysqlOne('SELECT * FROM users WHERE verification_token = ?', [token]);

  if (!user) {
    return null;
  }

  await mysqlRun(
    'UPDATE users SET email_verified_at = ?, verification_token = NULL, updated_at = ? WHERE id = ?',
    [verifiedAt, verifiedAt, user.id],
  );

  return findUserByEmail(user.email);
}

export function health() {
  return {
    status: 'ok',
    primaryDatabase: config.database.primary,
    localDatabase: 'sqlite',
  };
}
