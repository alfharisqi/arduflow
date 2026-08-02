import { initializeOperationalDatabase, softDeleteUser } from '../database.js';

if (process.env.ALLOW_USER_SOFT_RESET !== 'true') {
  throw new Error('Set ALLOW_USER_SOFT_RESET=true untuk menjalankan soft reset user.');
}

const database = initializeOperationalDatabase();
const users = database.prepare(
  'SELECT id FROM users WHERE deleted_at IS NULL ORDER BY id',
).all();

for (const user of users) {
  await softDeleteUser(user.id);
}

database.prepare('DELETE FROM user_sessions').run();
console.log(`Soft deleted users: ${users.length}`);
