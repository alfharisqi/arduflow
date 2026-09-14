import { useEffect, useRef, useState } from 'react';
import { AuthImageSlider } from '../../components/auth/AuthImageSlider.jsx';
import { resendVerificationEmail, verifyEmailToken } from '../../services/authApi.js';
import { showErrorAlert, showSuccessAlert } from '../../utils/alerts.js';

function secondsLeft(storageKey) {
  const until = Number(sessionStorage.getItem(storageKey) || 0);
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

export function EmailVerification() {
  const hasRequestedVerification = useRef(false);
  const verificationEmail = sessionStorage.getItem('arduflow_verification_email') || '';
  const [remainingSeconds, setRemainingSeconds] = useState(() => secondsLeft('arduflow_verification_resend_until'));
  const [isResending, setResending] = useState(false);
  const [verificationState, setVerificationState] = useState({
    title: 'Cek email anda untuk verifikasi akun',
    message: 'Silakan periksa email pada inbox atau spam email.',
    type: 'pending',
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingSeconds(secondsLeft('arduflow_verification_resend_until'));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    sessionStorage.removeItem('arduflow_auth_message');

    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
      return;
    }

    if (hasRequestedVerification.current) {
      return;
    }

    hasRequestedVerification.current = true;

    verifyEmailToken(token)
      .then((data) => {
        const message = data.message || 'Akun Anda sudah aktif. Silakan masuk untuk melanjutkan.';
        setVerificationState({
          title: 'Email berhasil diverifikasi',
          message,
          type: 'success',
        });
        sessionStorage.setItem('arduflow_auth_message', message);
        window.setTimeout(() => {
          window.location.replace('/signin?verified=1');
        }, 1500);
      })
      .catch((error) => {
        setVerificationState({
          title: 'Verifikasi email gagal',
          message: error.message,
          type: 'error',
        });
      });
  }, []);

  async function handleResendVerification() {
    if (!verificationEmail) {
      await showErrorAlert('Email belum tersedia', 'Silakan daftar ulang atau masukkan email dari halaman registrasi.');
      window.location.href = '/signup';
      return;
    }

    setResending(true);
    try {
      const data = await resendVerificationEmail(verificationEmail);
      const nextCooldown = Number(data.retryAfter) || 60;
      sessionStorage.setItem('arduflow_verification_resend_until', String(Date.now() + (nextCooldown * 1000)));
      setRemainingSeconds(nextCooldown);
      await showSuccessAlert('Email dikirim ulang', data.message);
    } catch (error) {
      const retryAfter = Number(error.retryAfter) || 60;
      if (retryAfter > 0) {
        sessionStorage.setItem('arduflow_verification_resend_until', String(Date.now() + (retryAfter * 1000)));
        setRemainingSeconds(retryAfter);
      }
      await showErrorAlert('Gagal mengirim ulang', error.message);
    } finally {
      setResending(false);
    }
  }

  const resendDisabled = isResending || remainingSeconds > 0;

  return (
    <main className="signin-page verify-email-page">
      <AuthImageSlider />

      <section className="verify-email-panel" aria-labelledby="verify-email-title">
        <div className={`verify-email-content verify-email-content--${verificationState.type}`}>
          <a className="auth-back-button" href="/">← Kembali</a>

          <div>
            <h2 id="verify-email-title">{verificationState.title}</h2>
            <p>{verificationState.message}</p>
            {verificationEmail && verificationState.type === 'pending' ? (
              <p className="auth-email-target">Dikirim ke: {verificationEmail}</p>
            ) : null}
          </div>
          {verificationState.type === 'pending' ? (
            <div className="auth-resend-actions">
              <button type="button" onClick={handleResendVerification} disabled={resendDisabled}>
                {isResending
                  ? 'Mengirim...'
                  : remainingSeconds > 0
                    ? `Kirim ulang dalam ${remainingSeconds} detik`
                    : 'Kirim ulang email'}
              </button>
              <a href="/signin">Kembali ke halaman login</a>
            </div>
          ) : (
            <a href="/signin">Kembali ke halaman login</a>
          )}
        </div>
      </section>
    </main>
  );
}
