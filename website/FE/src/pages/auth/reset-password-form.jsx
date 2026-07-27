import { useState } from 'react';
import hideIcon from '../../assets/icons/icon-hide-1.svg';
import { AuthImageSlider } from '../../components/auth/AuthImageSlider.jsx';

export function ResetPasswordForm() {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <main className="signin-page reset-password-form-page">
      <AuthImageSlider />

      <section className="reset-password-panel" aria-labelledby="reset-password-form-title">
        <form className="reset-password-form-box">
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
              <input type={showNewPassword ? 'text' : 'password'} name="newPassword" autoComplete="new-password" />
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
              />
              <small>Ulangi Kata Sandi</small>
            </label>
          </div>

          <div className="reset-password-actions">
            <button type="submit">Reset</button>
            <p>
              Sudah punya akun? <a href="/signin">Masuk</a>
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
