import { initializeOperationalDatabase, upsertAdmin } from '../database.js';
import { hashPassword } from '../password.js';

const admin = {
  username: String(process.env.ADMIN_SEED_USERNAME || '').trim(),
  name: String(process.env.ADMIN_SEED_NAME || 'Admin Arduflow').trim(),
  email: String(process.env.ADMIN_SEED_EMAIL || '').trim() || null,
  password: String(process.env.ADMIN_SEED_PASSWORD || ''),
  role: String(process.env.ADMIN_SEED_ROLE || 'super_admin').trim(),
};

if (!admin.username || !admin.password) {
  throw new Error('ADMIN_SEED_USERNAME dan ADMIN_SEED_PASSWORD wajib diatur di .env.');
}

initializeOperationalDatabase();
await upsertAdmin({
  username: admin.username,
  name: admin.name,
  email: admin.email,
  passwordHash: hashPassword(admin.password),
  role: admin.role,
  isActive: true,
});

console.log(`Admin account ready: ${admin.username}`);
