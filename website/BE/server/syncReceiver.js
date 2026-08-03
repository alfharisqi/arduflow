import { config } from './config.js';
import { mysqlPool, withMysqlTransaction } from './mysql.js';
import { verifySyncRequest } from './syncSecurity.js';

const tableColumns = {
  users: new Set([
    'id', 'name', 'username', 'nickname', 'email', 'whatsapp', 'occupation',
    'institution_name', 'profile_image', 'password_hash', 'email_verified_at',
    'verification_token', 'verification_sent_at', 'password_reset_token',
    'password_reset_sent_at', 'password_reset_expires_at', 'version',
    'deleted_at', 'created_at', 'updated_at',
  ]),
  admins: new Set([
    'id', 'username', 'name', 'email', 'password_hash', 'role', 'is_active',
    'last_login_at', 'version', 'deleted_at', 'created_at', 'updated_at',
  ]),
  leads: new Set([
    'id', 'name', 'email', 'phone', 'interest', 'message', 'version',
    'deleted_at', 'created_at', 'updated_at',
  ]),
  workshops: new Set([
    'id', 'title', 'category', 'method', 'location', 'description', 'starts_at',
    'ends_at', 'capacity', 'status', 'version', 'deleted_at', 'created_at', 'updated_at',
  ]),
};

const dateColumns = new Set([
  'email_verified_at', 'verification_sent_at', 'password_reset_sent_at',
  'password_reset_expires_at', 'last_login_at', 'deleted_at', 'created_at',
  'updated_at', 'starts_at', 'ends_at',
]);

function mysqlDate(value) {
  if (!value) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function validateSyncEvent(event) {
  if (!event || typeof event !== 'object') throw new Error('Event harus berupa object.');
  if (!/^[0-9a-f-]{36}$/i.test(String(event.eventId || ''))) throw new Error('event_id tidak valid.');
  if (!tableColumns[event.tableName]) throw new Error('Tabel sinkronisasi tidak diizinkan.');
  if (!['insert', 'update', 'delete'].includes(event.operation)) throw new Error('Operasi tidak diizinkan.');
  if (!event.payload || typeof event.payload !== 'object' || Array.isArray(event.payload)) {
    throw new Error('Payload event tidak valid.');
  }
  if (String(event.payload.id) !== String(event.rowId)) throw new Error('row_id tidak sesuai payload.');
  if (!Number.isInteger(Number(event.version)) || Number(event.version) < 1) {
    throw new Error('Versi event tidak valid.');
  }

  const unknown = Object.keys(event.payload)
    .filter((column) => !tableColumns[event.tableName].has(column));
  if (unknown.length > 0) throw new Error(`Kolom tidak diizinkan: ${unknown.join(', ')}`);
}

export async function processSyncEvent(event, { transaction = withMysqlTransaction } = {}) {
  validateSyncEvent(event);
  return transaction(async (connection) => {
    const [processed] = await connection.execute(
      'SELECT event_id FROM processed_sync_events WHERE event_id = ? FOR UPDATE',
      [event.eventId],
    );
    if (processed.length > 0) {
      return { eventId: event.eventId, status: 'already_processed' };
    }

    const [existing] = await connection.execute(
      `SELECT version FROM ${event.tableName} WHERE id = ? FOR UPDATE`,
      [event.rowId],
    );
    if (existing.length > 0 && Number(existing[0].version || 1) > Number(event.version)) {
      await connection.execute(
        'INSERT INTO processed_sync_events (event_id, processed_at) VALUES (?, UTC_TIMESTAMP())',
        [event.eventId],
      );
      return { eventId: event.eventId, status: 'stale_ignored' };
    }

    const columns = Object.keys(event.payload);
    const values = columns.map((column) => (
      dateColumns.has(column) ? mysqlDate(event.payload[column]) : event.payload[column]
    ));
    const updates = columns
      .filter((column) => column !== 'id')
      .map((column) => `${column} = VALUES(${column})`)
      .join(', ');
    const placeholders = columns.map(() => '?').join(', ');

    await connection.execute(
      `INSERT INTO ${event.tableName} (${columns.join(', ')})
       VALUES (${placeholders})
       ON DUPLICATE KEY UPDATE ${updates}`,
      values,
    );
    await connection.execute(
      'INSERT INTO processed_sync_events (event_id, processed_at) VALUES (?, UTC_TIMESTAMP())',
      [event.eventId],
    );
    return { eventId: event.eventId, status: 'synced' };
  });
}

export async function registerSyncNonce(nonce, { pool = mysqlPool() } = {}) {
  const cutoff = new Date(
    Date.now() - (config.sync.maxClockSkewSeconds * 2 * 1000),
  ).toISOString().slice(0, 19).replace('T', ' ');
  await pool.execute(
    'DELETE FROM sync_nonces WHERE created_at < ?',
    [cutoff],
  );
  try {
    await pool.execute(
      'INSERT INTO sync_nonces (nonce, created_at) VALUES (?, UTC_TIMESTAMP())',
      [nonce],
    );
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const replayError = new Error('Nonce sudah pernah digunakan.');
      replayError.statusCode = 409;
      throw replayError;
    }
    throw error;
  }
}

export async function receiveSqliteSync(request, response) {
  const security = verifySyncRequest(request);
  if (!security.ok) {
    response.status(security.status).json({ message: security.message });
    return;
  }

  const events = request.body?.events;
  if (!Array.isArray(events) || events.length === 0 || events.length > 500) {
    response.status(422).json({ message: 'Batch sinkronisasi harus berisi 1-500 event.' });
    return;
  }

  try {
    await registerSyncNonce(security.nonce);
  } catch (error) {
    response.status(error.statusCode || 503).json({ message: error.message || 'MySQL tidak dapat dihubungi.' });
    return;
  }

  const results = [];
  for (const event of events) {
    try {
      results.push(await processSyncEvent(event));
    } catch (error) {
      results.push({
        eventId: event?.eventId || null,
        status: 'failed',
        retryable: !String(error.message).includes('tidak diizinkan')
          && !String(error.message).includes('tidak valid')
          && !String(error.message).includes('tidak sesuai'),
        error: String(error.message || 'Event gagal diproses').slice(0, 240),
      });
    }
  }

  response.status(207).json({ results });
}
