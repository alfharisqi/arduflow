import crypto from 'node:crypto';
import { config } from './config.js';

const rateBuckets = new Map();

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length
    && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSyncSignature({ timestamp, nonce, rawBody, secret = config.sync.hmacSecret }) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}\n${nonce}\n${rawBody}`)
    .digest('hex');
}

export function checkSyncRateLimit(ip, now = Date.now()) {
  const key = ip || 'unknown';
  const current = rateBuckets.get(key);
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  current.count += 1;
  return current.count <= 30;
}

export function verifySyncRequest(request, now = Date.now()) {
  if (!config.sync.apiToken || !config.sync.hmacSecret) {
    return { ok: false, status: 503, message: 'Sinkronisasi belum dikonfigurasi.' };
  }

  const ip = request.ip || request.socket?.remoteAddress || '';
  if (config.sync.ipAllowlist.length > 0 && !config.sync.ipAllowlist.includes(ip)) {
    return { ok: false, status: 403, message: 'Alamat pengirim tidak diizinkan.' };
  }

  if (!checkSyncRateLimit(ip, now)) {
    return { ok: false, status: 429, message: 'Terlalu banyak request sinkronisasi.' };
  }

  const authorization = String(request.get('authorization') || '');
  const token = authorization.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : '';
  if (!safeEqual(token, config.sync.apiToken)) {
    return { ok: false, status: 401, message: 'Token sinkronisasi tidak valid.' };
  }

  const timestamp = String(request.get('x-sync-timestamp') || '');
  const nonce = String(request.get('x-sync-nonce') || '');
  const signature = String(request.get('x-sync-signature') || '').toLowerCase();
  const timestampNumber = Number(timestamp);
  const skewSeconds = Math.abs(Math.floor(now / 1000) - timestampNumber);

  if (!Number.isInteger(timestampNumber) || skewSeconds > config.sync.maxClockSkewSeconds) {
    return { ok: false, status: 401, message: 'Timestamp sinkronisasi kedaluwarsa.' };
  }
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(nonce)) {
    return { ok: false, status: 422, message: 'Nonce sinkronisasi tidak valid.' };
  }

  const rawBody = request.rawBody?.toString('utf8') || '';
  const expected = createSyncSignature({ timestamp, nonce, rawBody });
  if (!/^[a-f0-9]{64}$/.test(signature) || !safeEqual(signature, expected)) {
    return { ok: false, status: 401, message: 'Signature sinkronisasi tidak valid.' };
  }

  return { ok: true, timestamp, nonce };
}
