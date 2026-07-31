import { useState } from 'react';
import hideIcon from '../../assets/icons/icon-hide-1.svg';
import eyeOpenIcon from '../../assets/icons/icon-eyeopen-1.svg';
import { loginAdmin } from '../../services/authApi.js';

export function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = await loginAdmin(form);
      localStorage.setItem('arduflow_admin', JSON.stringify(data.admin));
      window.location.href = data.redirectTo || '/admin/dashboard';
    } catch (loginError) {
      setError(loginError.message || 'Login admin gagal.');
    } finally {
      setIsSubmitting(false);
    }
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
            <span>Username</span>
            <input
              type="text"
              name="username"
              placeholder="username"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
            />
          </label>

          <label className="admin-login-field">
            <span>Password</span>
            <div className="admin-login-password">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
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

          {error ? <p className="admin-login-error">{error}</p> : null}

          <button className="admin-login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'LOADING...' : 'LOG IN'}
          </button>

          <a className="admin-login-forgot" href="/admin/forgot-password">
            Forgot password?
          </a>
        </form>
      </section>
    </main>
  );
}
