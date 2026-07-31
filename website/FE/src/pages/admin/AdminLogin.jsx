import { useState } from 'react';
import hideIcon from '../../assets/icons/icon-hide-1.svg';
import eyeOpenIcon from '../../assets/icons/icon-eyeopen-1.svg';

export function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-content" aria-label="Admin login">
        <div className="admin-login-logo" aria-label="Arduflow">
          <span>ARDU</span>
          <strong>FLOW</strong>
        </div>

        <form className="admin-login-panel" onSubmit={handleSubmit}>
          <h1>Admin Log in</h1>

          <label className="admin-login-field">
            <span>Email address</span>
            <input type="email" name="email" placeholder="username" autoComplete="username" />
          </label>

          <label className="admin-login-field">
            <span>Password</span>
            <div className="admin-login-password">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="admin-login-eye"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                <img src={showPassword ? eyeOpenIcon : hideIcon} alt="" />
              </button>
            </div>
          </label>

          <button className="admin-login-submit" type="submit">
            LOG IN
          </button>

          <a className="admin-login-forgot" href="/admin/forgot-password">
            Forgot password?
          </a>
        </form>
      </section>
    </main>
  );
}
