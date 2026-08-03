import express from 'express';
import { fileURLToPath } from 'node:url';
import { adminLogin, adminLogout, adminSession, requireAdmin } from './adminAuth.js';
import {
  checkAvailability,
  login,
  register,
  updateProfile,
  userLogout,
  userSession,
  verifyEmail,
} from './auth.js';
import { config } from './config.js';
import {
  databaseHealth,
  retryFailedSync,
  runSync,
  syncStatus,
} from './databaseSyncAdmin.js';
import { health, initializeOperationalDatabase, insertLead } from './database.js';
import { receiveSqliteSync } from './syncReceiver.js';
import { startSyncScheduler } from './services/sync-scheduler.js';
import {
  deleteWorkshop,
  getWorkshop,
  getWorkshops,
  postWorkshop,
  putWorkshop,
} from './workshops.js';

function asyncHandler(handler) {
  return async (request, response, next) => {
    try {
      await handler(request, response, next);
    } catch (error) {
      next(error);
    }
  };
}

export function createApp() {
  initializeOperationalDatabase();
  const app = express();

  app.use((request, response, next) => {
    response.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://127.0.0.1:5173');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Sync-Timestamp, X-Sync-Nonce, X-Sync-Signature',
    );

    if (request.method === 'OPTIONS') {
      response.sendStatus(204);
      return;
    }

    next();
  });

  app.use(express.json({
    limit: '8mb',
    verify(request, _response, buffer) {
      request.rawBody = Buffer.from(buffer);
    },
  }));

  app.get('/api/health', (_request, response) => response.json(health()));
  app.get('/api/health/database', asyncHandler(databaseHealth));

  app.post('/api/auth/register', asyncHandler(register));
  app.post('/api/auth/login', asyncHandler(login));
  app.get('/api/auth/session', asyncHandler(userSession));
  app.post('/api/auth/logout', asyncHandler(userLogout));
  app.get('/api/auth/verify-email', asyncHandler(verifyEmail));
  app.post('/api/auth/verify-email', asyncHandler(verifyEmail));
  app.get('/api/auth/check-availability', asyncHandler(checkAvailability));
  app.post('/api/auth/check-availability', asyncHandler(checkAvailability));
  app.put('/api/auth/profile', asyncHandler(updateProfile));

  app.post('/api/admin/login', asyncHandler(adminLogin));
  app.get('/api/admin/session', asyncHandler(adminSession));
  app.post('/api/admin/logout', asyncHandler(adminLogout));
  app.get('/api/admin/database-sync/status', asyncHandler(requireAdmin), asyncHandler(syncStatus));
  app.post('/api/admin/database-sync/run', asyncHandler(requireAdmin), asyncHandler(runSync));
  app.post('/api/admin/database-sync/retry-failed', asyncHandler(requireAdmin), asyncHandler(retryFailedSync));

  app.post('/api/internal/sync/sqlite-to-mysql', asyncHandler(receiveSqliteSync));

  app.get('/api/workshops', asyncHandler(getWorkshops));
  app.get('/api/workshops/:id', asyncHandler(getWorkshop));
  app.post('/api/workshops', asyncHandler(requireAdmin), asyncHandler(postWorkshop));
  app.put('/api/workshops/:id', asyncHandler(requireAdmin), asyncHandler(putWorkshop));
  app.delete('/api/workshops/:id', asyncHandler(requireAdmin), asyncHandler(deleteWorkshop));

  app.post('/api/leads', asyncHandler(async (request, response) => {
    const { name = '', email = '', phone = '', interest = 'akses', message = '' } = request.body || {};

    if (!name.trim() || !email.trim()) {
      response.status(422).json({ message: 'Nama dan email wajib diisi.' });
      return;
    }

    await insertLead({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      interest: interest.trim(),
      message: message.trim(),
    });

    response.status(201).json({ message: 'Form berhasil dikirim. Admin akan menghubungi Anda.' });
  }));

  app.use((error, _request, response, _next) => {
    console.error(error);
    if (error.type === 'entity.too.large') {
      response.status(413).json({ message: 'Ukuran foto terlalu besar. Gunakan gambar yang lebih kecil.' });
      return;
    }
    response.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : 'Terjadi kesalahan server.',
    });
  });

  return app;
}

export const app = createApp();

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  app.listen(config.port, config.host, () => {
    console.log(`Arduflow API running at http://${config.host}:${config.port}`);
    startSyncScheduler();
  });
}
