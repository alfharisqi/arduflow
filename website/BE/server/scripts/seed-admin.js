import fs from 'node:fs';
import mysql from 'mysql2/promise';
import { config, rootPath } from '../config.js';
import { hashPassword } from '../password.js';

const admin = {
  username: 'adminarduflow2026',
  name: 'Admin Arduflow',
  email: 'admin@arduflow.local',
  password: 'arduflow2026!',
  role: 'super_admin',
};

const schema = fs.readFileSync(rootPath('database/mysql/schema.sql'), 'utf8');
const statements = schema
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

const connection = await mysql.createConnection({
  host: config.database.mysql.host,
  port: config.database.mysql.port,
  user: config.database.mysql.user,
  password: config.database.mysql.password,
  multipleStatements: false,
});

await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database.mysql.database}\``);
await connection.query(`USE \`${config.database.mysql.database}\``);

for (const statement of statements) {
  await connection.query(statement);
}

const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

await connection.execute(
  `INSERT INTO admins (
    username,
    name,
    email,
    password_hash,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)
  ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    password_hash = VALUES(password_hash),
    role = VALUES(role),
    is_active = 1,
    updated_at = VALUES(updated_at)`,
  [
    admin.username,
    admin.name,
    admin.email,
    hashPassword(admin.password),
    admin.role,
    now,
    now,
  ],
);

await connection.end();

console.log(`Admin account ready: ${admin.username}`);
