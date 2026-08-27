import { useState } from 'react';
import { AuthImageSlider } from '../../components/auth/AuthImageSlider.jsx';
import { requestPasswordReset } from '../../services/authApi.js';
import { showErrorAlert, showSuccessAlert } from '../../utils/alerts.js';

export function ResetPassword() {
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();

    if (!email) {
      await showErrorAlert('Email wajib diisi', 'Masukkan email akun Arduflow Anda.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await requestPasswordReset(email);
      await showSuccessAlert('Email reset password terkirim', data.message);
      window.location.href = '/reset-password/email-sent';
    } catch (error) {
      await showErrorAlert('Reset password gagal', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="signin-page reset-password-page">
      <AuthImageSlider />

      <section className="reset-password-panel" aria-labelledby="reset-password-title">
        <form className="reset-password-box" onSubmit={handleSubmit}>
          <h2 id="reset-password-title">Reset password anda</h2>

          <label className="reset-password-field">
            <span>Email address</span>
            <input type="email" name="email" placeholder="contoh@gmail.com" autoComplete="email" required />
          </label>

          <div className="reset-password-actions">
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Mengirim...' : 'Lanjut'}</button>
            <p>
              Sudah punya akun? <a href="/signin">Masuk</a>
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
