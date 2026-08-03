import { config } from './config.js';
import {
  getSyncStatus,
  operationalDatabaseWritable,
  resetFailedSyncEvents,
} from './database.js';
import { mysqlReachable } from './mysql.js';
import { runSqliteToMysqlSync } from './services/sqlite-to-mysql-sync.js';
import { sqliteConnection } from './sqlite.js';

export async function databaseHealth(_request, response) {
  let sqliteStatus = 'healthy';
  try {
    const check = sqliteConnection().prepare('PRAGMA quick_check').get();
    if (check?.quick_check !== 'ok') sqliteStatus = 'unhealthy';
  } catch {
    sqliteStatus = 'unhealthy';
  }

  const sync = getSyncStatus();
  const reachable = await mysqlReachable();
  response.json({
    sqlite: {
      status: sqliteStatus,
      writable: operationalDatabaseWritable(),
    },
    mysql: {
      status: reachable ? 'healthy' : 'unreachable',
      required_for_user_request: false,
    },
    sync: {
      pending: sync.pending,
      last_success_at: sync.lastSuccessAt,
    },
  });
}

export async function syncStatus(_request, response) {
  const status = getSyncStatus();
  response.json({
    enabled: config.sync.enabled,
    pending: status.pending,
    processing: status.processing,
    failed: status.failed,
    synced_today: status.syncedToday,
    last_sync_at: status.lastSyncAt,
    last_success_at: status.lastSuccessAt,
    mysql_reachable: await mysqlReachable(),
  });
}

export async function runSync(_request, response) {
  const result = await runSqliteToMysqlSync();
  response.json({ message: 'Worker sinkronisasi selesai dijalankan.', result });
}

export async function retryFailedSync(_request, response) {
  const retried = resetFailedSyncEvents();
  response.json({ message: `${retried} event dikembalikan ke antrean.`, retried });
}
