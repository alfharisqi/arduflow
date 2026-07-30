import { useEffect, useRef, useState } from 'react';
import { AuthImageSlider } from '../../components/auth/AuthImageSlider.jsx';
import { verifyEmailToken } from '../../services/authApi.js';

export function EmailVerification() {
  const hasRequestedVerification = useRef(false);
  const [verificationState, setVerificationState] = useState({
    title: 'Cek email anda untuk verifikasi akun',
    message: 'Silakan periksa email pada inbox atau spam email.',
    type: 'pending',
  });

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
        setVerificationState({
          title: 'Email berhasil diverifikasi',
          message: data.message || 'Akun Anda sudah aktif. Silakan masuk untuk melanjutkan.',
          type: 'success',
        });
      })
      .catch((error) => {
        setVerificationState({
          title: 'Verifikasi email gagal',
          message: error.message,
          type: 'error',
        });
      });
  }, []);

  return (
    <main className="signin-page verify-email-page">
      <AuthImageSlider />

      <section className="verify-email-panel" aria-labelledby="verify-email-title">
        <div className={`verify-email-content verify-email-content--${verificationState.type}`}>
          <div>
            <h2 id="verify-email-title">{verificationState.title}</h2>
            <p>{verificationState.message}</p>
          </div>
          <a href="/signin">Kembali ke halaman login</a>
        </div>
      </section>
    </main>
  );
}
