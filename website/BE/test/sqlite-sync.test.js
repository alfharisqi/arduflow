import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { after } from 'node:test';

const testDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'arduflow-sync-test-'));
process.env.SQLITE_DATABASE_PATH = path.join(testDirectory, 'arduflow.sqlite');
process.env.SQLITE_BACKUP_DIRECTORY = path.join(testDirectory, 'backups');
process.env.SYNC_ENABLED = 'true';
process.env.SYNC_API_TOKEN = 'test-token-with-at-least-thirty-two-characters';
process.env.SYNC_HMAC_SECRET = 'test-hmac-secret-with-at-least-thirty-two-characters';
process.env.SYNC_IP_ALLOWLIST = '';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';

const databaseModule = await import('../server/database.js');
const sqliteModule = await import('../server/sqlite.js');
const passwordModule = await import('../server/password.js');
const syncService = await import('../server/services/sqlite-to-mysql-sync.js');
const security = await import('../server/syncSecurity.js');
const receiver = await import('../server/syncReceiver.js');
const { createApp } = await import('../server/index.js');

const db = databaseModule.initializeOperationalDatabase();

after(() => {
  sqliteModule.closeSqliteConnection();
  const resolved = path.resolve(testDirectory);
  if (resolved.startsWith(path.resolve(os.tmpdir()))) {
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

function pendingEvents(tableName) {
  return db.prepare(
    "SELECT * FROM sync_outbox WHERE table_name = ? AND status = 'pending' ORDER BY created_at",
  ).all(tableName);
}

function syncSuccessResponse(options) {
  const body = JSON.parse(options.body);
  return {
    ok: true,
    status: 207,
    async json() {
      return {
        results: body.events.map((event) => ({ eventId: event.eventId, status: 'synced' })),
      };
    },
  };
}

test('SQLite uses the required connection PRAGMAs', () => {
  assert.equal(db.prepare('PRAGMA journal_mode').get().journal_mode, 'wal');
  assert.equal(db.prepare('PRAGMA foreign_keys').get().foreign_keys, 1);
  assert.equal(db.prepare('PRAGMA busy_timeout').get().timeout, 5000);
  assert.equal(db.prepare('PRAGMA synchronous').get().synchronous, 1);
});

test('insert, update, and soft delete create outbox events transactionally', async () => {
  const user = await databaseModule.createUser({
    name: 'Outbox User',
    email: 'outbox@example.test',
    whatsapp: '+628110000001',
    occupation: 'Tester',
    passwordHash: passwordModule.hashPassword('Password1!'),
    verificationToken: 'verification-outbox',
  });
  assert.equal(pendingEvents('users').at(-1).operation, 'insert');

  await databaseModule.updateUserProfile(user.id, {
    name: 'Outbox User Updated', username: 'outboxuser', nickname: 'Outbox',
    whatsapp: '+628110000001', occupation: 'Tester', institutionName: 'Arduflow',
    profileImage: null,
  });
  assert.equal(pendingEvents('users').at(-1).operation, 'update');

  await databaseModule.softDeleteUser(user.id);
  const deleted = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  assert.ok(deleted.deleted_at);
  assert.equal(pendingEvents('users').at(-1).operation, 'delete');
});

test('main row rolls back when the outbox insert fails', async () => {
  const before = db.prepare('SELECT COUNT(*) AS total FROM workshops').get().total;
  db.exec(`CREATE TRIGGER fail_test_outbox BEFORE INSERT ON sync_outbox
    BEGIN SELECT RAISE(ABORT, 'forced outbox failure'); END`);
  await assert.rejects(
    databaseModule.createWorkshop({ title: 'Must Roll Back' }),
    /forced outbox failure/,
  );
  db.exec('DROP TRIGGER fail_test_outbox');
  const afterCount = db.prepare('SELECT COUNT(*) AS total FROM workshops').get().total;
  assert.equal(afterCount, before);
});

test('login and protected user session work without MySQL', async () => {
  await databaseModule.createUser({
    name: 'Offline Login', email: 'offline@example.test', whatsapp: '+628110000002',
    occupation: 'Developer', passwordHash: passwordModule.hashPassword('Password1!'),
    verificationToken: 'verification-offline',
  });
  const app = createApp();
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const login = await fetch(`${base}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'offline@example.test', password: 'Password1!' }),
    });
    assert.equal(login.status, 200);
    const loginBody = await login.json();
    assert.ok(loginBody.token);

    const session = await fetch(`${base}/api/auth/session`, {
      headers: { Authorization: `Bearer ${loginBody.token}` },
    });
    assert.equal(session.status, 200);

    const publicFile = await fetch(`${base}/storage/database/arduflow.sqlite`);
    assert.equal(publicFile.status, 404);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('worker marks successful events as synced', async () => {
  db.prepare("UPDATE sync_outbox SET status = 'synced', synced_at = ?").run(new Date().toISOString());
  await databaseModule.createWorkshop({ title: 'Sync Success' });
  const result = await syncService.runSqliteToMysqlSync({ fetchImpl: async (_url, options) => syncSuccessResponse(options) });
  assert.equal(result.success, 1);
  assert.equal(db.prepare("SELECT COUNT(*) total FROM sync_outbox WHERE status != 'synced'").get().total, 0);
});

test('worker retains failed events and retries them later', async () => {
  await databaseModule.createWorkshop({ title: 'Sync Retry' });
  const failed = await syncService.runSqliteToMysqlSync({
    fetchImpl: async () => { throw new Error('MySQL tidak dapat dihubungi'); },
  });
  assert.equal(failed.failed, 1);
  const event = pendingEvents('workshops').at(-1);
  assert.equal(event.retry_count, 1);
  assert.ok(event.next_retry_at);
  assert.match(event.last_error, /MySQL tidak dapat dihubungi/);

  db.prepare('UPDATE sync_outbox SET next_retry_at = NULL WHERE id = ?').run(event.id);
  const retried = await syncService.runSqliteToMysqlSync({ fetchImpl: async (_url, options) => syncSuccessResponse(options) });
  assert.equal(retried.success, 1);
});

test('two workers cannot process the same event', async () => {
  await databaseModule.createWorkshop({ title: 'Single Claim' });
  let release;
  const delayed = new Promise((resolve) => { release = resolve; });
  const first = syncService.runSqliteToMysqlSync({
    fetchImpl: async (_url, options) => {
      await delayed;
      return syncSuccessResponse(options);
    },
  });
  await new Promise((resolve) => setImmediate(resolve));
  const second = await syncService.runSqliteToMysqlSync({ fetchImpl: async (_url, options) => syncSuccessResponse(options) });
  assert.equal(second.total, 0);
  release();
  assert.equal((await first).success, 1);
});

function syncRequest({ token = process.env.SYNC_API_TOKEN, timestamp, nonce = 'valid_nonce_123456789', body = '{}', signature } = {}) {
  const headers = {
    authorization: `Bearer ${token}`,
    'x-sync-timestamp': timestamp || String(Math.floor(Date.now() / 1000)),
    'x-sync-nonce': nonce,
  };
  headers['x-sync-signature'] = signature || security.createSyncSignature({
    timestamp: headers['x-sync-timestamp'], nonce, rawBody: body,
  });
  return {
    ip: '127.0.0.1', rawBody: Buffer.from(body),
    get(name) { return headers[name.toLowerCase()] || ''; },
  };
}

test('sync security rejects wrong token, HMAC, and expired timestamp', () => {
  assert.equal(security.verifySyncRequest(syncRequest({ token: 'wrong-token' })).status, 401);
  assert.equal(security.verifySyncRequest(syncRequest({ signature: '0'.repeat(64) })).status, 401);
  const old = String(Math.floor(Date.now() / 1000) - 1000);
  assert.equal(security.verifySyncRequest(syncRequest({ timestamp: old })).status, 401);
});

test('sync event validation rejects unknown tables and columns', () => {
  const base = {
    eventId: '123e4567-e89b-12d3-a456-426614174000', rowId: '1',
    operation: 'insert', version: 1, payload: { id: 1, version: 1 },
  };
  assert.throws(() => receiver.validateSyncEvent({ ...base, tableName: 'secrets' }), /tidak diizinkan/);
  assert.throws(() => receiver.validateSyncEvent({
    ...base, tableName: 'users', payload: { id: 1, version: 1, unknown_secret: 'x' },
  }), /Kolom tidak diizinkan/);
});

function fakeMysql() {
  const processed = new Set();
  const nonces = new Set();
  const rows = new Map();
  const connection = {
    async execute(sql, values) {
      if (sql.startsWith('SELECT event_id')) return [processed.has(values[0]) ? [{ event_id: values[0] }] : []];
      if (sql.startsWith('SELECT version')) {
        const row = rows.get(String(values[0]));
        return [row ? [{ version: row.version }] : []];
      }
      if (sql.startsWith('INSERT INTO processed_sync_events')) {
        processed.add(values[0]);
        return [{ affectedRows: 1 }];
      }
      if (sql.startsWith('INSERT INTO users')) {
        const columns = sql.match(/users \(([^)]+)\)/)[1].split(',').map((item) => item.trim());
        rows.set(String(values[columns.indexOf('id')]), Object.fromEntries(columns.map((column, index) => [column, values[index]])));
        return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  };
  const pool = {
    async execute(sql, values) {
      if (sql.startsWith('DELETE FROM sync_nonces')) return [{ affectedRows: 0 }];
      if (sql.startsWith('INSERT INTO sync_nonces')) {
        if (nonces.has(values[0])) {
          const error = new Error('duplicate');
          error.code = 'ER_DUP_ENTRY';
          throw error;
        }
        nonces.add(values[0]);
        return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected nonce SQL: ${sql}`);
    },
  };
  return { processed, rows, pool, transaction: async (callback) => callback(connection) };
}

test('receiver is idempotent, rejects nonce replay, and ignores stale versions', async () => {
  const mysql = fakeMysql();
  const base = {
    eventId: '123e4567-e89b-12d3-a456-426614174001', tableName: 'users',
    rowId: '7', operation: 'insert', version: 2,
    payload: {
      id: 7, name: 'Idempotent', email: 'idempotent@example.test',
      password_hash: 'hash', version: 2, created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
  assert.equal((await receiver.processSyncEvent(base, { transaction: mysql.transaction })).status, 'synced');
  assert.equal((await receiver.processSyncEvent(base, { transaction: mysql.transaction })).status, 'already_processed');
  assert.equal(mysql.rows.size, 1);

  const stale = { ...base, eventId: '123e4567-e89b-12d3-a456-426614174002', version: 1, payload: { ...base.payload, version: 1 } };
  assert.equal((await receiver.processSyncEvent(stale, { transaction: mysql.transaction })).status, 'stale_ignored');
  assert.equal(mysql.rows.get('7').version, 2);

  await receiver.registerSyncNonce('replay_nonce_123456789', { pool: mysql.pool });
  await assert.rejects(
    receiver.registerSyncNonce('replay_nonce_123456789', { pool: mysql.pool }),
    /Nonce sudah pernah digunakan/,
  );
});
