import { backupSqlite } from '../backup.js';
import { initializeOperationalDatabase } from '../database.js';

initializeOperationalDatabase();
const filePath = backupSqlite();
if (!filePath) {
  throw new Error('SQLite database belum tersedia untuk dibackup.');
}
console.log(`SQLite backup created: ${filePath}`);
