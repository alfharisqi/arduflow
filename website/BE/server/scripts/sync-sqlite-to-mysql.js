import {
  initializeOperationalDatabase,
  makePendingSyncEventsReady,
} from '../database.js';
import { runSqliteToMysqlSync } from '../services/sqlite-to-mysql-sync.js';

initializeOperationalDatabase();
if (process.argv.includes('--retry-now')) {
  const released = makePendingSyncEventsReady();
  console.log(`Pending events made ready: ${released}`);
}
const result = await runSqliteToMysqlSync();
console.log(JSON.stringify(result, null, 2));
