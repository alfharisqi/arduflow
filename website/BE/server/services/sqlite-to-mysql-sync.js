import crypto from 'node:crypto';
import { config } from '../config.js';
import { createSyncSignature } from '../syncSecurity.js';
import { sqliteConnection, sqliteNow, withSqliteTransaction } from '../sqlite.js';

const retryMinutes = [1, 5, 15, 30, 60];

function conciseError(error) {
  const message = String(error?.message || error || 'Sinkronisasi gagal');
  const cause = error?.cause?.code || error?.cause?.message;
  return String(cause ? `${message}: ${cause}` : message).slice(0, 500);
}

function nextRetryDate(retryCount) {
  const minutes = retryMinutes[Math.min(Math.max(retryCount - 1, 0), retryMinutes.length - 1)];
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function claimOutboxEvents({
  workerId = crypto.randomUUID(),
  batchSize = config.sync.batchSize,
} = {}) {
  const staleBefore = new Date(
    Date.now() - config.sync.processingTimeoutMinutes * 60_000,
  ).toISOString();

  return withSqliteTransaction((db) => {
    const timestamp = sqliteNow();
    db.prepare(
      `UPDATE sync_outbox
       SET status = 'pending', worker_id = NULL, locked_at = NULL, updated_at = ?
       WHERE status = 'processing' AND locked_at < ?`,
    ).run(timestamp, staleBefore);

    const events = db.prepare(
      `SELECT * FROM sync_outbox
       WHERE status = 'pending'
         AND (next_retry_at IS NULL OR next_retry_at <= ?)
       ORDER BY created_at ASC
       LIMIT ?`,
    ).all(timestamp, Math.min(500, Math.max(1, batchSize)));

    const claim = db.prepare(
      `UPDATE sync_outbox
       SET status = 'processing', worker_id = ?, locked_at = ?, updated_at = ?
       WHERE id = ? AND status = 'pending'`,
    );
    const claimed = [];
    for (const event of events) {
      if (claim.run(workerId, timestamp, timestamp, event.id).changes === 1) {
        claimed.push({ ...event, worker_id: workerId, locked_at: timestamp });
      }
    }
    return { workerId, events: claimed };
  });
}

function markSynced(event, status = 'synced') {
  const timestamp = sqliteNow();
  sqliteConnection().prepare(
    `UPDATE sync_outbox
     SET status = 'synced', synced_at = ?, updated_at = ?,
         worker_id = NULL, locked_at = NULL, last_error = NULL
     WHERE id = ? AND worker_id = ? AND status = 'processing'`,
  ).run(timestamp, timestamp, event.id, event.worker_id);
  return status;
}

function markFailed(event, error, retryable = true) {
  const retryCount = Number(event.retry_count || 0) + 1;
  const status = retryable ? 'pending' : 'failed';
  const nextRetryAt = retryable ? nextRetryDate(retryCount) : null;
  sqliteConnection().prepare(
    `UPDATE sync_outbox
     SET status = ?, retry_count = ?, next_retry_at = ?, last_error = ?,
         worker_id = NULL, locked_at = NULL, updated_at = ?
     WHERE id = ? AND worker_id = ? AND status = 'processing'`,
  ).run(
    status,
    retryCount,
    nextRetryAt,
    conciseError(error),
    sqliteNow(),
    event.id,
    event.worker_id,
  );
}

function createLog(batchId, totalEvents) {
  sqliteConnection().prepare(
    `INSERT INTO sync_logs (
      batch_id, total_events, success_events, failed_events, started_at
    ) VALUES (?, ?, 0, 0, ?)`,
  ).run(batchId, totalEvents, sqliteNow());
}

function finishLog(batchId, successEvents, failedEvents, errorMessage = null, mysqlStatus = 'reachable') {
  const finishedAt = sqliteNow();
  sqliteConnection().prepare(
    `UPDATE sync_logs
     SET success_events = ?, failed_events = ?, finished_at = ?,
         duration_ms = CAST((julianday(?) - julianday(started_at)) * 86400000 AS INTEGER),
         mysql_status = ?, error_message = ?
     WHERE batch_id = ?`,
  ).run(successEvents, failedEvents, finishedAt, finishedAt, mysqlStatus, errorMessage, batchId);
}

export async function runSqliteToMysqlSync({ fetchImpl = globalThis.fetch } = {}) {
  if (!config.sync.enabled) {
    return { skipped: true, reason: 'disabled', total: 0, success: 0, failed: 0 };
  }
  if (!config.sync.apiToken || !config.sync.hmacSecret) {
    throw new Error('SYNC_API_TOKEN dan SYNC_HMAC_SECRET wajib dikonfigurasi.');
  }

  const { workerId, events } = claimOutboxEvents();
  if (events.length === 0) {
    return { skipped: false, total: 0, success: 0, failed: 0 };
  }

  const batchId = crypto.randomUUID();
  createLog(batchId, events.length);
  const body = JSON.stringify({
    batchId,
    events: events.map((event) => ({
      eventId: event.event_id,
      tableName: event.table_name,
      rowId: event.row_id,
      operation: event.operation,
      payload: JSON.parse(event.payload),
      version: event.version,
    })),
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = crypto.randomBytes(24).toString('base64url');
  const signature = createSyncSignature({ timestamp, nonce, rawBody: body });

  let response;
  let data;
  try {
    response = await fetchImpl(config.sync.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.sync.apiToken}`,
        'Content-Type': 'application/json',
        'X-Sync-Timestamp': timestamp,
        'X-Sync-Nonce': nonce,
        'X-Sync-Signature': signature,
      },
      body,
      signal: AbortSignal.timeout(30_000),
    });
    data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || `Sync API merespons HTTP ${response.status}`);
    }
  } catch (error) {
    for (const event of events) markFailed(event, error, true);
    finishLog(batchId, 0, events.length, conciseError(error), 'unreachable');
    return {
      batchId,
      workerId,
      total: events.length,
      success: 0,
      failed: events.length,
      error: conciseError(error),
    };
  }

  const results = new Map(
    (Array.isArray(data.results) ? data.results : [])
      .map((result) => [result.eventId, result]),
  );
  let success = 0;
  let failed = 0;

  for (const event of events) {
    const result = results.get(event.event_id);
    if (result && ['synced', 'already_processed', 'stale_ignored'].includes(result.status)) {
      markSynced(event, result.status);
      success += 1;
    } else {
      markFailed(event, result?.error || 'Sync API tidak mengembalikan hasil event.', result?.retryable !== false);
      failed += 1;
    }
  }

  finishLog(batchId, success, failed, failed ? 'Sebagian event gagal disinkronkan.' : null);
  return { batchId, workerId, total: events.length, success, failed };
}
