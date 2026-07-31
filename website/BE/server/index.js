import express from 'express';
import { adminLogin, adminLogout, adminSession } from './adminAuth.js';
import { checkAvailability, login, register, updateProfile, verifyEmail } from './auth.js';
import { config } from './config.js';
import { health, insertLead } from './database.js';

const app = express();

function asyncHandler(handler) {
  return async (request, response, next) => {
    try {
      await handler(request, response, next);
    } catch (error) {
      next(error);
    }
  };
}

app.use((request, response, next) => {
  response.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://127.0.0.1:5173');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    response.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json({ limit: '8mb' }));

app.get('/api/health', (_request, response) => {
  response.json(health());
});

app.post('/api/auth/register', asyncHandler(register));
app.post('/api/auth/login', asyncHandler(login));
app.post('/api/admin/login', asyncHandler(adminLogin));
app.get('/api/admin/session', asyncHandler(adminSession));
app.post('/api/admin/logout', asyncHandler(adminLogout));
app.get('/api/auth/verify-email', asyncHandler(verifyEmail));
app.post('/api/auth/verify-email', asyncHandler(verifyEmail));
app.get('/api/auth/check-availability', asyncHandler(checkAvailability));
app.post('/api/auth/check-availability', asyncHandler(checkAvailability));
app.put('/api/auth/profile', asyncHandler(updateProfile));

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

  response.status(500).json({ message: 'Terjadi kesalahan server.' });
});

app.listen(config.port, '127.0.0.1', () => {
  console.log(`Arduflow API running at http://127.0.0.1:${config.port}`);
});
