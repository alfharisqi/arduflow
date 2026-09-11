import { useEffect, useState } from 'react';
import { AuthImageSlider } from '../../components/auth/AuthImageSlider.jsx';
import { requestPasswordReset } from '../../services/authApi.js';
import { showErrorAlert, showSuccessAlert } from '../../utils/alerts.js';

function secondsLeft(storageKey) {
  const until = Number(sessionStorage.getItem(storageKey) || 0);
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

export function ResetPasswordSent() {
  const email = sessionStorage.getItem('arduflow_reset_email') || '';
  const [remainingSeconds, setRemainingSeconds] = useState(() => secondsLeft('arduflow_reset_resend_until'));
  const [isResending, setResending] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingSeconds(secondsLeft('arduflow_reset_resend_until'));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  async function handleResend() {
    if (!email) {
      await showErrorAlert('Email belum tersedia', 'Silakan masukkan email kembali di halaman reset password.');
      window.location.href = '/reset-password';
      return;
    }

    setResending(true);
    try {
      const data = await requestPasswordReset(email);
      const nextCooldown = Number(data.retryAfter) || 60;
      sessionStorage.setItem('arduflow_reset_resend_until', String(Date.now() + (nextCooldown * 1000)));
      setRemainingSeconds(nextCooldown);
      await showSuccessAlert('Email dikirim ulang', data.message);
    } catch (error) {
      const retryAfter = Number(error.retryAfter) || 60;
      if (retryAfter > 0) {
        sessionStorage.setItem('arduflow_reset_resend_until', String(Date.now() + (retryAfter * 1000)));
        setRemainingSeconds(retryAfter);
      }
      await showErrorAlert('Gagal mengirim ulang', error.message);
    } finally {
      setResending(false);
    }
  }

  const resendDisabled = isResending || remainingSeconds > 0;

  return (
    <main className="signin-page reset-password-sent-page">
      <AuthImageSlider />

      <section className="reset-password-sent-panel" aria-labelledby="reset-password-sent-title">
        <a className="auth-back-button" href="/">← Kembali</a>

        <div className="reset-password-sent-content">
          <div>
            <h2 id="reset-password-sent-title">Tautan pemulihan telah dikirim ke email Anda!</h2>
            <p>Silakan periksa email Anda untuk langkah selanjutnya dalam ulang kata sandi.</p>
            {email ? <p className="auth-email-target">Dikirim ke: {email}</p> : null}
          </div>
          <div className="auth-resend-actions">
            <button type="button" onClick={handleResend} disabled={resendDisabled}>
              {isResending
                ? 'Mengirim...'
                : remainingSeconds > 0
                  ? `Kirim ulang dalam ${remainingSeconds} detik`
                  : 'Kirim ulang email'}
            </button>
            <a href="/signin">Kembali ke halaman login</a>
          </div>
        </div>
      </section>
    </main>
  );
}
