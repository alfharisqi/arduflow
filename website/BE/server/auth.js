import crypto from 'node:crypto';
import {
  createUserSession,
  createUser,
  deleteUserSession,
  findUserByEmail,
  findUserById,
  findUserBySessionTokenHash,
  findUserByUsername,
  findUserByWhatsapp,
  findUserByIdentifier,
  insertAuthLog,
  updateUserProfile,
  verifyUserEmail,
} from './database.js';
import { sendVerificationEmail } from './mailer.js';
import { hashPassword, randomToken, verifyPassword } from './password.js';

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    whatsapp: user.whatsapp,
    occupation: user.occupation,
    institutionName: user.institution_name,
    profileImage: user.profile_image,
    emailVerified: Boolean(user.email_verified_at),
  };
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password);
}

function validateWhatsapp(whatsapp) {
  return /^\+\d{8,15}$/.test(whatsapp);
}

function requestMeta(request) {
  return {
    ip: request.ip || request.socket?.remoteAddress || '',
    userAgent: request.get('user-agent') || '',
  };
}

const sessionDurationMs = 8 * 60 * 60 * 1000;

function bearerToken(request) {
  const header = String(request.get('authorization') || '');
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function authenticatedUser(request) {
  const token = bearerToken(request);
  if (!token) return { token: '', user: null };
  return {
    token,
    user: await findUserBySessionTokenHash(hashToken(token)),
  };
}

export async function register(request, response) {
  const {
    name = '',
    email = '',
    whatsapp = '',
    occupation = '',
    password = '',
  } = request.body || {};

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedWhatsapp = whatsapp.trim();

  if (!name.trim() || !normalizedEmail || !normalizedWhatsapp || !password) {
    response.status(422).json({ message: 'Nama, email, nomor WhatsApp, dan kata sandi wajib diisi.' });
    return;
  }

  if (!validateEmail(normalizedEmail)) {
    response.status(422).json({ message: 'Format email tidak valid.' });
    return;
  }

  if (!validateWhatsapp(normalizedWhatsapp)) {
    response.status(422).json({ message: 'Nomor WhatsApp harus memakai kode negara dan berisi 8-15 digit.' });
    return;
  }

  if (!validatePassword(password)) {
    response.status(422).json({ message: 'Kata sandi minimal 8 karakter dengan kombinasi huruf, angka, dan simbol.' });
    return;
  }

  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    response.status(409).json({ message: 'Email sudah terdaftar.' });
    return;
  }

  const existingWhatsappUser = await findUserByWhatsapp(normalizedWhatsapp);

  if (existingWhatsappUser) {
    response.status(409).json({ message: 'Nomor WhatsApp sudah terdaftar.' });
    return;
  }

  const verificationToken = randomToken();
  const user = await createUser({
    name: name.trim(),
    email: normalizedEmail,
    whatsapp: normalizedWhatsapp,
    occupation: occupation.trim(),
    passwordHash: hashPassword(password),
    verificationToken,
  });
  const meta = requestMeta(request);

  await insertAuthLog({
    userId: user.id,
    email: user.email,
    event: 'register_success',
    ...meta,
  });

  let emailSent = true;

  try {
    await sendVerificationEmail(user, verificationToken);
  } catch (error) {
    emailSent = false;
    console.error('Verification email failed:', error);
  }

  response.status(201).json({
    message: emailSent
      ? 'Registrasi berhasil. Cek Mailpit untuk email verifikasi.'
      : 'Registrasi berhasil, tetapi email verifikasi gagal dikirim. Pastikan Mailpit berjalan.',
    user: publicUser(user),
  });
}

export async function login(request, response) {
  const { identifier = '', email = '', password = '' } = request.body || {};
  const loginIdentifier = (identifier || email).trim();

  if (!loginIdentifier || !password) {
    response.status(422).json({ message: 'Email/nama dan kata sandi wajib diisi.' });
    return;
  }

  const user = await findUserByIdentifier(loginIdentifier.toLowerCase());
  const meta = requestMeta(request);

  if (!user || !verifyPassword(password, user.password_hash)) {
    await insertAuthLog({
      email: loginIdentifier,
      event: 'login_failed',
      ...meta,
    });
    response.status(401).json({ message: 'Email/nama atau kata sandi salah.' });
    return;
  }

  await insertAuthLog({
    userId: user.id,
    email: user.email,
    event: 'login_success',
    ...meta,
  });

  const token = randomToken();
  const expiresAt = new Date(Date.now() + sessionDurationMs);
  await createUserSession({
    userId: user.id,
    tokenHash: hashToken(token),
    expiresAt: expiresAt.toISOString(),
  });

  response.json({
    message: 'Login berhasil.',
    user: publicUser(user),
    token,
    expiresAt: expiresAt.toISOString(),
  });
}

export async function userSession(request, response) {
  const { user } = await authenticatedUser(request);
  if (!user) {
    response.status(401).json({ message: 'Sesi user tidak valid atau sudah kedaluwarsa.' });
    return;
  }

  response.json({ user: publicUser(user) });
}

export async function userLogout(request, response) {
  const token = bearerToken(request);
  if (token) {
    await deleteUserSession(hashToken(token));
  }
  response.json({ message: 'Logout berhasil.' });
}

export async function verifyEmail(request, response) {
  const token = String(request.query.token || request.body?.token || '').trim();

  if (!token) {
    response.status(422).json({ message: 'Token verifikasi wajib diisi.' });
    return;
  }

  const user = await verifyUserEmail(token);

  if (!user) {
    response.status(404).json({ message: 'Token verifikasi tidak valid.' });
    return;
  }

  await insertAuthLog({
    userId: user.id,
    email: user.email,
    event: 'email_verified',
    ...requestMeta(request),
  });

  response.json({
    message: 'Email berhasil diverifikasi.',
    user: publicUser(user),
  });
}

export async function checkAvailability(request, response) {
  const email = String(request.query.email || request.body?.email || '').trim().toLowerCase();
  const whatsapp = String(request.query.whatsapp || request.body?.whatsapp || '').trim();
  const result = {};

  if (email) {
    if (!validateEmail(email)) {
      response.status(422).json({ message: 'Format email tidak valid.' });
      return;
    }

    result.emailAvailable = !(await findUserByEmail(email));
  }

  if (whatsapp) {
    if (!validateWhatsapp(whatsapp)) {
      response.status(422).json({ message: 'Nomor WhatsApp harus memakai kode negara dan berisi 8-15 digit.' });
      return;
    }

    result.whatsappAvailable = !(await findUserByWhatsapp(whatsapp));
  }

  response.json(result);
}

export async function updateProfile(request, response) {
  const {
    name = '',
    username = '',
    nickname = '',
    whatsapp = '',
    occupation = '',
    institutionName = '',
    profileImage = '',
  } = request.body || {};

  const normalizedUsername = String(username).trim();
  const normalizedWhatsapp = String(whatsapp).trim();

  const { user: sessionUser } = await authenticatedUser(request);
  if (!sessionUser) {
    response.status(401).json({ message: 'Sesi user tidak valid. Silakan login ulang.' });
    return;
  }

  const userId = Number(sessionUser.id);

  if (!name.trim()) {
    response.status(422).json({ message: 'Nama lengkap wajib diisi.' });
    return;
  }

  const currentUser = await findUserById(userId);

  if (!currentUser) {
    response.status(404).json({ message: 'User tidak ditemukan.' });
    return;
  }

  if (normalizedWhatsapp && !validateWhatsapp(normalizedWhatsapp)) {
    response.status(422).json({ message: 'Nomor WhatsApp harus memakai kode negara dan berisi 8-15 digit.' });
    return;
  }

  if (normalizedWhatsapp) {
    const existingWhatsappUser = await findUserByWhatsapp(normalizedWhatsapp);

    if (existingWhatsappUser && Number(existingWhatsappUser.id) !== userId) {
      response.status(409).json({ message: 'Nomor WhatsApp sudah terdaftar.' });
      return;
    }
  }

  if (normalizedUsername) {
    const existingUsernameUser = await findUserByUsername(normalizedUsername);

    if (existingUsernameUser && Number(existingUsernameUser.id) !== userId) {
      response.status(409).json({ message: 'Username sudah digunakan.' });
      return;
    }
  }

  const user = await updateUserProfile(userId, {
    name: name.trim(),
    username: normalizedUsername,
    nickname: String(nickname).trim(),
    whatsapp: normalizedWhatsapp,
    occupation: String(occupation).trim(),
    institutionName: String(institutionName).trim(),
    profileImage: String(profileImage).trim(),
  });

  await insertAuthLog({
    userId: user.id,
    email: user.email,
    event: 'profile_updated',
    ...requestMeta(request),
  });

  response.json({
    message: 'Profil berhasil diperbarui.',
    user: publicUser(user),
  });
}
