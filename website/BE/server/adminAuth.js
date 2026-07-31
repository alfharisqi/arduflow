import { findAdminByUsername, updateAdminLastLogin } from './database.js';
import { verifyPassword } from './password.js';

function publicAdmin(admin) {
  return {
    id: admin.id,
    username: admin.username,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
}

export async function adminLogin(request, response) {
  const { username = '', email = '', password = '' } = request.body || {};
  const loginUsername = String(username || email).trim();

  if (!loginUsername || !password) {
    response.status(422).json({ message: 'Username dan password wajib diisi.' });
    return;
  }

  const admin = await findAdminByUsername(loginUsername);

  if (!admin || !admin.is_active || !verifyPassword(password, admin.password_hash)) {
    response.status(401).json({ message: 'Username atau password admin salah.' });
    return;
  }

  await updateAdminLastLogin(admin.id);

  response.json({
    message: 'Login admin berhasil.',
    admin: publicAdmin(admin),
    redirectTo: '/admin/dashboard',
  });
}
