import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function rootPath(...segments) {
  return path.join(root, ...segments);
}

export const config = {
  port: Number(process.env.API_PORT || 3001),
  frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://127.0.0.1:5173',
  database: {
    primary: process.env.DB_PRIMARY || 'mysql',
    sqlitePath: rootPath(process.env.DB_SQLITE_PATH || 'storage/sqlite/arduflow.sqlite'),
    mysql: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_DATABASE || 'db_arduflow',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
    },
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
