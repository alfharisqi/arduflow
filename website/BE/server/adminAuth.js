import crypto from 'node:crypto';
import {
  createAdminSession,
  deleteAdminSession,
  findAdminBySessionTokenHash,
  findAdminByUsername,
  updateAdminLastLogin,
} from './database.js';
import { randomToken, verifyPassword } from './password.js';

const sessionDurationMs = 8 * 60 * 60 * 1000;

function publicAdmin(admin) {
  return {
    id: admin.id,
    username: admin.username,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function bearerToken(request) {
  const header = String(request.get('authorization') || '');

  if (!header.toLowerCase().startsWith('bearer ')) {
    return '';
  }

  return header.slice(7).trim();
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
  const token = randomToken();
  const expiresAt = new Date(Date.now() + sessionDurationMs);

  await createAdminSession({
    adminId: admin.id,
    tokenHash: hashToken(token),
    expiresAt: expiresAt.toISOString(),
  });

  response.json({
    message: 'Login admin berhasil.',
    admin: publicAdmin(admin),
    token,
    expiresAt: expiresAt.toISOString(),
    redirectTo: '/admin/dashboard',
  });
}

export async function requireAdmin(request, response, next) {
  const token = bearerToken(request);
  if (!token) {
    response.status(401).json({ message: 'Sesi admin tidak ditemukan.' });
    return;
  }

  const admin = await findAdminBySessionTokenHash(hashToken(token));
  if (!admin) {
    response.status(401).json({ message: 'Sesi admin tidak valid atau sudah kedaluwarsa.' });
    return;
  }

  request.admin = publicAdmin(admin);
  next();
}

export async function adminSession(request, response) {
  const token = bearerToken(request);

  if (!token) {
    response.status(401).json({ message: 'Sesi admin tidak ditemukan.' });
    return;
  }

  const admin = await findAdminBySessionTokenHash(hashToken(token));

  if (!admin) {
    response.status(401).json({ message: 'Sesi admin tidak valid atau sudah kedaluwarsa.' });
    return;
  }

  response.json({
    admin: publicAdmin(admin),
  });
}

export async function adminLogout(request, response) {
  const token = bearerToken(request);

  if (token) {
    await deleteAdminSession(hashToken(token));
  }

  response.json({ message: 'Logout admin berhasil.' });
}
