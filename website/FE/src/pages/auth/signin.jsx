import { useState } from 'react';
import googleIcon from '../../assets/icons/sosmed-google.png';
import twitterIcon from '../../assets/icons/sosmed-twitter.png';
import hideIcon from '../../assets/icons/icon-hide-1.svg';
import { AuthImageSlider } from '../../components/auth/AuthImageSlider.jsx';

export function SignIn() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="signin-page">
      <AuthImageSlider />

      <section className="signin-panel" aria-labelledby="signin-title">
        <p className="signin-panel__signup">
          Don&apos;t have an account? <a href="/signup">Sign up</a>
        </p>

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

          <form className="signin-form">
            <label className="signin-field">
              <span>Nama atau Email</span>
              <input type="email" name="email" autoComplete="email" />
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

            <a className="signin-forgot" href="/akses">Lupa Kata sandi</a>

            <div className="signin-submit-group">
              <button className="signin-submit" type="submit">Masuk</button>
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
