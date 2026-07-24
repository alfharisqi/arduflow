import express from 'express';
import { config } from './config.js';
import { health, insertLead } from './database.js';

const app = express();

app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json(health());
});

app.post('/api/leads', async (request, response) => {
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
});

app.listen(config.port, '127.0.0.1', () => {
  console.log(`Arduflow API running at http://127.0.0.1:${config.port}`);
});
