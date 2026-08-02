import { useState } from 'react';
import googleIcon from '../../assets/icons/sosmed-google.png';
import twitterIcon from '../../assets/icons/sosmed-twitter.png';
import hideIcon from '../../assets/icons/icon-hide-1.svg';
import { AuthImageSlider } from '../../components/auth/AuthImageSlider.jsx';
import { loginUser } from '../../services/authApi.js';
import { showErrorAlert, showSuccessAlert } from '../../utils/alerts.js';

export function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);

    try {
      const data = await loginUser({
        identifier: String(form.get('identifier') || ''),
        password: String(form.get('password') || ''),
      });

      localStorage.setItem('arduflow_user', JSON.stringify(data.user));
      await showSuccessAlert('Login berhasil', data.message);
      window.location.assign('/');
    } catch (error) {
      await showErrorAlert('Login gagal', error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="signin-page">
      <AuthImageSlider />

      <section className="signin-panel" aria-labelledby="signin-title">
        <div className="signin-form-box">
          <h2 id="signin-title">Masuk</h2>

          <div className="signin-socials" aria-label="Masuk dengan sosial media">
            <button className="signin-social-button" type="button">
              <img src={googleIcon} alt="" />
              <span>Continue with Google</span>
            </button>
            <button className="signin-social-button" type="button">
              <img src={twitterIcon} alt="" />
              <span>Continue with Twitter</span>
            </button>
          </div>

          <div className="signin-divider" aria-hidden="true">
            <span />
            <strong>OR</strong>
            <span />
          </div>

          <form className="signin-form" onSubmit={handleSubmit}>
            <label className="signin-field">
              <span>Nama atau Email</span>
              <input type="text" name="identifier" autoComplete="username" />
            </label>

            <label className="signin-field">
              <span className="signin-password-label">
                <span>Kata Sandi</span>
                <button
                  type="button"
                  className="signin-hide-button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  <img src={hideIcon} alt="" />
                  <span>{showPassword ? 'Show' : 'Hide'}</span>
                </button>
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
              />
            </label>

            <a className="signin-forgot" href="/reset-password">Lupa Kata sandi</a>

            <div className="signin-submit-group">
              <button className="signin-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Memproses...' : 'Masuk'}
              </button>
              <p>
                Tidak punya akun? <a href="/signup">Daftar Sekarang</a>
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
