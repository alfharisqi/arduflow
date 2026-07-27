import crypto from 'node:crypto';

const keyLength = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, keyLength).toString('hex');

  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, passwordHash) {
  const [algorithm, salt, originalHash] = String(passwordHash || '').split('$');

  if (algorithm !== 'scrypt' || !salt || !originalHash) {
    return false;
  }

  const hash = crypto.scryptSync(password, salt, keyLength);
  const original = Buffer.from(originalHash, 'hex');

  return original.length === hash.length && crypto.timingSafeEqual(original, hash);
}

export function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}
