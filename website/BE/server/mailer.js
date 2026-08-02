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

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function sendVerificationEmail(user, token) {
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;
  const safeName = escapeHtml(user.name || 'Pengguna');
  const safeVerificationUrl = escapeHtml(verificationUrl);

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
      <div style="margin:0;padding:32px;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033;">
        <div style="max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border-radius:12px;">
          <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#030b1e;">Verifikasi akun Arduflow</h1>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Halo ${safeName},</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">
            Klik tombol berikut untuk verifikasi akun Arduflow Anda.
          </p>
          <a
            href="${safeVerificationUrl}"
            style="display:inline-block;padding:13px 24px;background:#ff6a00;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;"
          >
            Verifikasi Email
          </a>
          <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#607086;">
            Jika tombol tidak bisa dibuka, salin tautan ini ke browser:<br />
            <a href="${safeVerificationUrl}" style="color:#00a2ff;word-break:break-all;">${safeVerificationUrl}</a>
          </p>
          <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#607086;">
            Jika Anda tidak membuat akun ini, abaikan email ini.
          </p>
        </div>
      </div>
    `,
  });
}
