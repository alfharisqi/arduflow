import mysql from 'mysql2/promise';
import { config } from './config.js';

let pool;

export function mysqlPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...config.database.mysql,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

export async function mysqlReachable() {
  try {
    await mysqlPool().query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

export async function withMysqlTransaction(callback) {
  const connection = await mysqlPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function closeMysqlPool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
