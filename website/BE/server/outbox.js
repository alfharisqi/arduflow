import crypto from 'node:crypto';
import { sqliteNow } from './sqlite.js';

const allowedOperations = new Set(['insert', 'update', 'delete']);

export function createOutboxEvent(database, {
  tableName,
  rowId,
  operation,
  payload,
  version = 1,
}) {
  if (!allowedOperations.has(operation)) {
    throw new Error(`Unsupported outbox operation: ${operation}`);
  }

  const createdAt = sqliteNow();
  const eventId = crypto.randomUUID();

  database.prepare(
    `INSERT INTO sync_outbox (
      id, event_id, table_name, row_id, operation, payload, version,
      status, retry_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)`,
  ).run(
    crypto.randomUUID(),
    eventId,
    tableName,
    String(rowId),
    operation,
    JSON.stringify(payload),
    Number(version) || 1,
    createdAt,
    createdAt,
  );

  return eventId;
}
