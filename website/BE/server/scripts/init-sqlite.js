import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config, rootPath } from '../config.js';

fs.mkdirSync(path.dirname(config.database.sqlitePath), { recursive: true });

const database = new DatabaseSync(config.database.sqlitePath);
const schema = fs.readFileSync(rootPath('database/sqlite/schema.sql'), 'utf8');
database.exec(schema);
database.close();

console.log(`SQLite database initialized: ${config.database.sqlitePath}`);
