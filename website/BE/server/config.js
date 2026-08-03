import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function rootPath(...segments) {
  return path.join(root, ...segments);
}

function privatePath(value) {
  return path.isAbsolute(value) ? value : rootPath(value);
}

const sqliteDatabasePath = process.env.SQLITE_DATABASE_PATH
  || process.env.DB_SQLITE_PATH
  || 'storage/database/arduflow.sqlite';

export const config = {
  port: Number(process.env.API_PORT || 3001),
  host: process.env.API_HOST || '127.0.0.1',
  frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://127.0.0.1:5173',
  database: {
    primary: 'sqlite',
    sqlitePath: privatePath(sqliteDatabasePath),
    mysql: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_DATABASE || 'db_arduflow',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      timezone: 'Z',
      connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 3000),
    },
  },
  sync: {
    enabled: process.env.SYNC_ENABLED !== 'false',
    apiUrl: process.env.SYNC_API_URL || `http://127.0.0.1:${Number(process.env.API_PORT || 3001)}/api/internal/sync/sqlite-to-mysql`,
    apiToken: process.env.SYNC_API_TOKEN || '',
    hmacSecret: process.env.SYNC_HMAC_SECRET || '',
    maxClockSkewSeconds: Number(process.env.SYNC_MAX_CLOCK_SKEW_SECONDS || 300),
    batchSize: Math.min(500, Math.max(1, Number(process.env.SYNC_BATCH_SIZE || 250))),
    processingTimeoutMinutes: Number(process.env.SYNC_PROCESSING_TIMEOUT_MINUTES || 15),
    ipAllowlist: String(process.env.SYNC_IP_ALLOWLIST || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  },
  sqliteBackup: {
    enabled: process.env.SQLITE_BACKUP_ENABLED !== 'false',
    directory: privatePath(process.env.SQLITE_BACKUP_DIRECTORY || 'storage/backups/sqlite'),
    retentionDays: Number(process.env.SQLITE_BACKUP_RETENTION_DAYS || 14),
  },
  mail: {
    host: process.env.MAIL_HOST || '127.0.0.1',
    port: Number(process.env.MAIL_PORT || 1025),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USERNAME || '',
    password: process.env.MAIL_PASSWORD || '',
    from: process.env.MAIL_FROM || 'Arduflow <no-reply@arduflow.local>',
  },
};
