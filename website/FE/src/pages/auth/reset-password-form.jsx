import { useState } from 'react';
import hideIcon from '../../assets/icons/icon-hide-1.svg';
import { AuthImageSlider } from '../../components/auth/AuthImageSlider.jsx';
import { confirmPasswordReset } from '../../services/authApi.js';
import { showErrorAlert, showSuccessAlert } from '../../utils/alerts.js';

export function ResetPasswordForm() {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const token = new URLSearchParams(window.location.search).get('token') || '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('newPassword') || '');
    const confirmPassword = String(form.get('confirmPassword') || '');

    if (!token) {
      await showErrorAlert('Token tidak ditemukan', 'Buka form reset password dari tombol di email reset password.');
      return;
    }

    if (password !== confirmPassword) {
      await showErrorAlert('Password tidak sama', 'Ulangi kata sandi harus sama dengan password baru.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await confirmPasswordReset({ token, password });
      await showSuccessAlert('Password berhasil direset', data.message);
      window.location.href = '/signin';
    } catch (error) {
      await showErrorAlert('Reset password gagal', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="signin-page reset-password-form-page">
      <AuthImageSlider />

      <section className="reset-password-panel" aria-labelledby="reset-password-form-title">
        <form className="reset-password-form-box" onSubmit={handleSubmit}>
          <h2 id="reset-password-form-title">Reset password anda</h2>

          <div className="reset-password-form-fields">
            <label className="reset-password-field reset-password-form-field">
              <span className="signin-password-label">
                <span>Password Baru</span>
                <button
                  type="button"
                  className="signin-hide-button"
                  onClick={() => setShowNewPassword((current) => !current)}
                >
                  <img src={hideIcon} alt="" />
                  <span>{showNewPassword ? 'Show' : 'Hide'}</span>
                </button>
              </span>
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                autoComplete="new-password"
                required
              />
              <small>Gunakan minimal 8 karakter dengan kombinasi huruf, angka dan simbol</small>
            </label>

            <label className="reset-password-field reset-password-form-field reset-password-confirm-field">
              <span className="signin-password-label">
                <span className="sr-only">Ulangi Kata Sandi</span>
                <button
                  type="button"
                  className="signin-hide-button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                >
                  <img src={hideIcon} alt="" />
                  <span>{showConfirmPassword ? 'Show' : 'Hide'}</span>
                </button>
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                autoComplete="new-password"
                required
              />
              <small>Ulangi Kata Sandi</small>
            </label>
          </div>

          <div className="reset-password-actions">
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Reset'}</button>
            <p>
              Sudah punya akun? <a href="/signin">Masuk</a>
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
