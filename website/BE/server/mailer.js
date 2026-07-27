import nodemailer from 'nodemailer';
import { config } from './config.js';

const auth = config.mail.user
  ? {
      user: config.mail.user,
      pass: config.mail.password,
    }
  : undefined;

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  secure: config.mail.secure,
  auth,
});

export async function sendVerificationEmail(user, token) {
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: config.mail.from,
    to: user.email,
    subject: 'Verifikasi akun Arduflow',
    text: [
      `Halo ${user.name},`,
      '',
      'Klik tautan berikut untuk verifikasi akun Arduflow:',
      verificationUrl,
      '',
      'Jika Anda tidak membuat akun ini, abaikan email ini.',
    ].join('\n'),
    html: `
      <p>Halo ${user.name},</p>
      <p>Klik tautan berikut untuk verifikasi akun Arduflow:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>Jika Anda tidak membuat akun ini, abaikan email ini.</p>
    `,
  });
}
