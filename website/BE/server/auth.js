import {
  createUser,
  findUserByEmail,
  findUserByIdentifier,
  insertAuthLog,
  verifyUserEmail,
} from './database.js';
import { sendVerificationEmail } from './mailer.js';
import { hashPassword, randomToken, verifyPassword } from './password.js';

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    whatsapp: user.whatsapp,
    occupation: user.occupation,
    emailVerified: Boolean(user.email_verified_at),
  };
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function requestMeta(request) {
  return {
    ip: request.ip || request.socket?.remoteAddress || '',
    userAgent: request.get('user-agent') || '',
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

  if (!name.trim() || !normalizedEmail || !password) {
    response.status(422).json({ message: 'Nama, email, dan kata sandi wajib diisi.' });
    return;
  }

  if (!validateEmail(normalizedEmail)) {
    response.status(422).json({ message: 'Format email tidak valid.' });
    return;
  }

  if (password.length < 8) {
    response.status(422).json({ message: 'Kata sandi minimal 8 karakter.' });
    return;
  }

  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    response.status(409).json({ message: 'Email sudah terdaftar.' });
    return;
  }

  const verificationToken = randomToken();
  const user = await createUser({
    name: name.trim(),
    email: normalizedEmail,
    whatsapp: whatsapp.trim(),
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

  response.json({
    message: 'Login berhasil.',
    user: publicUser(user),
  });
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
