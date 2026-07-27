import { useEffect, useState } from 'react';
import { AuthImageSlider } from '../../components/auth/AuthImageSlider.jsx';
import { verifyEmailToken } from '../../services/authApi.js';

export function EmailVerification() {
  const [message, setMessage] = useState(() => (
    sessionStorage.getItem('arduflow_auth_message') || 'Silakan periksa email pada inbox atau spam email.'
  ));

  useEffect(() => {
    sessionStorage.removeItem('arduflow_auth_message');

    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
      return;
    }

    verifyEmailToken(token)
      .then((data) => {
        setMessage(data.message || 'Email berhasil diverifikasi.');
      })
      .catch((error) => {
        setMessage(error.message);
      });
  }, []);

  return (
    <main className="signin-page verify-email-page">
      <AuthImageSlider />

      <section className="verify-email-panel" aria-labelledby="verify-email-title">
        <div className="verify-email-content">
          <div>
            <h2 id="verify-email-title">Cek email anda untuk verifikasi akun</h2>
            <p>{message}</p>
          </div>
          <a href="/signin">Kembali ke halaman login</a>
        </div>
      </section>
    </main>
  );
}
