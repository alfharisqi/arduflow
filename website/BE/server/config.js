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
  database: {
    connection: process.env.DB_CONNECTION || 'sqlite',
    sqlitePath: rootPath(process.env.DB_SQLITE_PATH || 'storage/sqlite/arduflow.sqlite'),
    mysql: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_DATABASE || 'arduflow',
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
    },
  },
};
