import fs from 'node:fs';
import { config } from './config.js';
import { migrateSqlite } from './migrations.js';
import { createOutboxEvent } from './outbox.js';
import {
  sqliteConnection,
  sqliteNow,
  withSqliteTransaction,
} from './sqlite.js';

let initialized = false;

export function initializeOperationalDatabase() {
  if (!initialized) {
    migrateSqlite(sqliteConnection());
    initialized = true;
  }
  return sqliteConnection();
}

function database() {
  return initializeOperationalDatabase();
}

function one(sql, params = []) {
  return database().prepare(sql).get(...params) || null;
}

function all(sql, params = []) {
  return database().prepare(sql).all(...params);
}

function enqueueRow(db, tableName, rowId, operation) {
  const row = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(rowId);
  if (!row) {
    throw new Error(`Cannot enqueue missing ${tableName} row ${rowId}`);
  }

  createOutboxEvent(db, {
    tableName,
    rowId,
    operation,
    payload: row,
    version: row.version || 1,
  });

  return row;
}

export async function insertAuthLog({ userId = null, email = '', event, ip = '', userAgent = '', meta = null }) {
  try {
    database().prepare(
      'INSERT INTO auth_logs (user_id, email, event, ip, user_agent, meta, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(
      userId,
      email || null,
      event,
      ip || null,
      userAgent || null,
      meta ? JSON.stringify(meta) : null,
      sqliteNow(),
    );
  } catch (error) {
    console.error('SQLite auth log failed:', error.message);
  }
}

export async function insertLead(lead) {
  initializeOperationalDatabase();
  return withSqliteTransaction((db) => {
    const createdAt = sqliteNow();
    const result = db.prepare(
      `INSERT INTO leads (
        name, email, phone, interest, message, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    ).run(
      lead.name,
      lead.email,
      lead.phone || null,
      lead.interest || 'akses',
      lead.message || null,
      createdAt,
      createdAt,
    );

    return enqueueRow(db, 'leads', result.lastInsertRowid, 'insert');
  });
}

export async function findUserByEmail(email) {
  return one('SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND deleted_at IS NULL', [email]);
}

export async function findUserById(id) {
  return one('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', [id]);
}

export async function findUserByUsername(username) {
  return one('SELECT * FROM users WHERE LOWER(username) = LOWER(?) AND deleted_at IS NULL', [username]);
}

export async function findUserByWhatsapp(whatsapp) {
  return one('SELECT * FROM users WHERE whatsapp = ? AND deleted_at IS NULL', [whatsapp]);
}

export async function findUserByIdentifier(identifier) {
  return one(
    `SELECT * FROM users
     WHERE deleted_at IS NULL
       AND (LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?) OR LOWER(username) = LOWER(?))`,
    [identifier, identifier, identifier],
  );
}

export async function findAdminByUsername(username) {
  return one(
    'SELECT * FROM admins WHERE LOWER(username) = LOWER(?) AND deleted_at IS NULL',
    [username],
  );
}

export async function upsertAdmin(admin) {
  initializeOperationalDatabase();
  return withSqliteTransaction((db) => {
    const existing = db.prepare(
      'SELECT * FROM admins WHERE LOWER(username) = LOWER(?)',
    ).get(admin.username);
    const timestamp = sqliteNow();

    db.prepare(
      `INSERT INTO admins (
        username, name, email, password_hash, role, is_active,
        version, deleted_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, NULL, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        name = excluded.name,
        email = excluded.email,
        password_hash = excluded.password_hash,
        role = excluded.role,
        is_active = excluded.is_active,
        deleted_at = NULL,
        version = admins.version + 1,
        updated_at = excluded.updated_at`,
    ).run(
      admin.username,
      admin.name,
      admin.email || null,
      admin.passwordHash,
      admin.role || 'super_admin',
      admin.isActive === false ? 0 : 1,
      timestamp,
      timestamp,
    );

    const row = db.prepare('SELECT * FROM admins WHERE username = ?').get(admin.username);
    return enqueueRow(db, 'admins', row.id, existing ? 'update' : 'insert');
  });
}

export async function updateAdminLastLogin(adminId) {
  initializeOperationalDatabase();
  return withSqliteTransaction((db) => {
    const timestamp = sqliteNow();
    db.prepare(
      `UPDATE admins
       SET last_login_at = ?, updated_at = ?, version = version + 1
       WHERE id = ? AND deleted_at IS NULL`,
    ).run(timestamp, timestamp, adminId);
    return enqueueRow(db, 'admins', adminId, 'update');
  });
}

export async function createAdminSession({ adminId, tokenHash, expiresAt }) {
  const db = database();
  db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(sqliteNow());
  db.prepare(
    'INSERT INTO admin_sessions (admin_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)',
  ).run(adminId, tokenHash, expiresAt, sqliteNow());
}

export async function findAdminBySessionTokenHash(tokenHash) {
  return one(
    `SELECT admins.*
     FROM admin_sessions
     INNER JOIN admins ON admins.id = admin_sessions.admin_id
     WHERE admin_sessions.token_hash = ?
       AND admin_sessions.expires_at > ?
       AND admins.is_active = 1
       AND admins.deleted_at IS NULL`,
    [tokenHash, sqliteNow()],
  );
}

export async function deleteAdminSession(tokenHash) {
  database().prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(tokenHash);
}

export async function createUserSession({ userId, tokenHash, expiresAt }) {
  const db = database();
  db.prepare('DELETE FROM user_sessions WHERE expires_at <= ?').run(sqliteNow());
  db.prepare(
    'INSERT INTO user_sessions (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)',
  ).run(userId, tokenHash, expiresAt, sqliteNow());
}

export async function findUserBySessionTokenHash(tokenHash) {
  return one(
    `SELECT users.*
     FROM user_sessions
     INNER JOIN users ON users.id = user_sessions.user_id
     WHERE user_sessions.token_hash = ?
       AND user_sessions.expires_at > ?
       AND users.deleted_at IS NULL`,
    [tokenHash, sqliteNow()],
  );
}

export async function deleteUserSession(tokenHash) {
  database().prepare('DELETE FROM user_sessions WHERE token_hash = ?').run(tokenHash);
}

export async function createUser(user) {
  initializeOperationalDatabase();
  return withSqliteTransaction((db) => {
    const timestamp = sqliteNow();
    const result = db.prepare(
      `INSERT INTO users (
        name, email, whatsapp, occupation, password_hash,
        verification_token, verification_sent_at, version,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    ).run(
      user.name,
      user.email,
      user.whatsapp || null,
      user.occupation || null,
      user.passwordHash,
      user.verificationToken,
      timestamp,
      timestamp,
      timestamp,
    );

    return enqueueRow(db, 'users', result.lastInsertRowid, 'insert');
  });
}

export async function updateUserProfile(userId, profile) {
  initializeOperationalDatabase();
  return withSqliteTransaction((db) => {
    const timestamp = sqliteNow();
    const result = db.prepare(
      `UPDATE users
       SET name = ?, username = ?, nickname = ?, whatsapp = ?, occupation = ?,
           institution_name = ?, profile_image = ?, updated_at = ?, version = version + 1
       WHERE id = ? AND deleted_at IS NULL`,
    ).run(
      profile.name,
      profile.username || null,
      profile.nickname || null,
      profile.whatsapp || null,
      profile.occupation || null,
      profile.institutionName || null,
      profile.profileImage || null,
      timestamp,
      userId,
    );

    if (result.changes === 0) {
      return null;
    }
    return enqueueRow(db, 'users', userId, 'update');
  });
}

export async function verifyUserEmail(token) {
  initializeOperationalDatabase();
  return withSqliteTransaction((db) => {
    const user = db.prepare(
      'SELECT * FROM users WHERE verification_token = ? AND deleted_at IS NULL',
    ).get(token);

    if (!user) {
      return null;
    }

    const timestamp = sqliteNow();
    db.prepare(
      `UPDATE users
       SET email_verified_at = ?, verification_token = NULL,
           updated_at = ?, version = version + 1
       WHERE id = ?`,
    ).run(timestamp, timestamp, user.id);

    return enqueueRow(db, 'users', user.id, 'update');
  });
}

export async function createPasswordResetToken(userId, token, expiresAt) {
  initializeOperationalDatabase();
  return withSqliteTransaction((db) => {
    const timestamp = sqliteNow();
    const result = db.prepare(
      `UPDATE users
       SET password_reset_token = ?, password_reset_sent_at = ?,
           password_reset_expires_at = ?, updated_at = ?, version = version + 1
       WHERE id = ? AND deleted_at IS NULL`,
    ).run(token, timestamp, expiresAt, timestamp, userId);

    if (result.changes === 0) {
      return null;
    }

    return enqueueRow(db, 'users', userId, 'update');
  });
}

export async function resetUserPasswordByToken(token, passwordHash) {
  initializeOperationalDatabase();
  return withSqliteTransaction((db) => {
    const user = db.prepare(
      `SELECT * FROM users
       WHERE password_reset_token = ?
         AND password_reset_expires_at > ?
         AND deleted_at IS NULL`,
    ).get(token, sqliteNow());

    if (!user) {
      return null;
    }

    const timestamp = sqliteNow();
    db.prepare(
      `UPDATE users
       SET password_hash = ?, password_reset_token = NULL,
           password_reset_sent_at = NULL, password_reset_expires_at = NULL,
           updated_at = ?, version = version + 1
       WHERE id = ?`,
    ).run(passwordHash, timestamp, user.id);

    return enqueueRow(db, 'users', user.id, 'update');
  });
}

export async function softDeleteUser(userId) {
  initializeOperationalDatabase();
  return withSqliteTransaction((db) => {
    const timestamp = sqliteNow();
    const result = db.prepare(
      `UPDATE users
       SET deleted_at = ?, updated_at = ?, version = version + 1
       WHERE id = ? AND deleted_at IS NULL`,
    ).run(timestamp, timestamp, userId);
    if (result.changes === 0) return null;
    return enqueueRow(db, 'users', userId, 'delete');
  });
}

export async function listWorkshops() {
  return all('SELECT * FROM workshops WHERE deleted_at IS NULL ORDER BY starts_at, created_at');
}

export async function findWorkshopById(id) {
  return one('SELECT * FROM workshops WHERE id = ? AND deleted_at IS NULL', [id]);
}

export async function createWorkshop(workshop) {
  initializeOperationalDatabase();
  return withSqliteTransaction((db) => {
    const timestamp = sqliteNow();
    const result = db.prepare(
      `INSERT INTO workshops (
        title, category, method, location, description, starts_at, ends_at,
        capacity, status, version, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    ).run(
      workshop.title,
      workshop.category || null,
      workshop.method || null,
      workshop.location || null,
      workshop.description || null,
      workshop.startsAt || null,
      workshop.endsAt || null,
      workshop.capacity ?? null,
      workshop.status || 'draft',
      timestamp,
      timestamp,
    );
    return enqueueRow(db, 'workshops', result.lastInsertRowid, 'insert');
  });
}

export async function updateWorkshop(id, workshop) {
  initializeOperationalDatabase();
  return withSqliteTransaction((db) => {
    const current = db.prepare(
      'SELECT * FROM workshops WHERE id = ? AND deleted_at IS NULL',
    ).get(id);
    if (!current) return null;

    db.prepare(
      `UPDATE workshops SET
        title = ?, category = ?, method = ?, location = ?, description = ?,
        starts_at = ?, ends_at = ?, capacity = ?, status = ?,
        version = version + 1, updated_at = ?
       WHERE id = ?`,
    ).run(
      workshop.title ?? current.title,
      workshop.category ?? current.category,
      workshop.method ?? current.method,
      workshop.location ?? current.location,
      workshop.description ?? current.description,
      workshop.startsAt ?? current.starts_at,
      workshop.endsAt ?? current.ends_at,
      workshop.capacity ?? current.capacity,
      workshop.status ?? current.status,
      sqliteNow(),
      id,
    );
    return enqueueRow(db, 'workshops', id, 'update');
  });
}

export async function softDeleteWorkshop(id) {
  initializeOperationalDatabase();
  return withSqliteTransaction((db) => {
    const timestamp = sqliteNow();
    const result = db.prepare(
      `UPDATE workshops SET deleted_at = ?, updated_at = ?, version = version + 1
       WHERE id = ? AND deleted_at IS NULL`,
    ).run(timestamp, timestamp, id);
    if (result.changes === 0) return null;
    return enqueueRow(db, 'workshops', id, 'delete');
  });
}

export function getSyncStatus() {
  const counts = database().prepare(
    `SELECT
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) AS processing,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
       SUM(CASE WHEN status = 'synced' AND synced_at >= ? THEN 1 ELSE 0 END) AS synced_today
     FROM sync_outbox`,
  ).get(new Date().toISOString().slice(0, 10));
  const lastLog = one(
    `SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 1`,
  );
  const lastSuccess = one(
    `SELECT finished_at FROM sync_logs
     WHERE success_events > 0 ORDER BY finished_at DESC LIMIT 1`,
  );

  return {
    pending: Number(counts.pending || 0),
    processing: Number(counts.processing || 0),
    failed: Number(counts.failed || 0),
    syncedToday: Number(counts.synced_today || 0),
    lastSyncAt: lastLog?.finished_at || lastLog?.started_at || null,
    lastSuccessAt: lastSuccess?.finished_at || null,
  };
}

export function resetFailedSyncEvents() {
  const timestamp = sqliteNow();
  const result = database().prepare(
    `UPDATE sync_outbox
     SET status = 'pending', next_retry_at = NULL, worker_id = NULL,
         locked_at = NULL, updated_at = ?
     WHERE status = 'failed'`,
  ).run(timestamp);
  return Number(result.changes);
}

export function makePendingSyncEventsReady() {
  const timestamp = sqliteNow();
  const result = database().prepare(
    `UPDATE sync_outbox
     SET next_retry_at = NULL, updated_at = ?
     WHERE status = 'pending' AND next_retry_at IS NOT NULL`,
  ).run(timestamp);
  return Number(result.changes);
}

export function operationalDatabaseWritable() {
  try {
    fs.accessSync(config.database.sqlitePath, fs.constants.R_OK | fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export function health() {
  const sync = getSyncStatus();
  return {
    status: 'ok',
    primaryDatabase: 'sqlite',
    localDatabase: 'sqlite',
    pendingSyncEvents: sync.pending,
  };
}
