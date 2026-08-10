import { useState } from 'react';

import hideIcon from '../../assets/icons/icon-hide-1.svg';
import eyeOpenIcon from '../../assets/icons/icon-eyeopen-1.svg';

import { loginAdmin } from '../../services/authApi.js';

import {
  showErrorAlert,
  showSuccessAlert,
} from '../../utils/alerts.js';

export function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    username: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Input Change
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const username = form.username.trim();
    const password = form.password;

    /*
    |--------------------------------------------------------------------------
    | Validasi sederhana
    |--------------------------------------------------------------------------
    */

    if (!username || !password) {
      await showErrorAlert(
        'Login admin gagal',
        'Username dan password wajib diisi.'
      );

      return;
    }

    setIsSubmitting(true);

    try {
      /*
      |--------------------------------------------------------------------------
      | Request login
      |--------------------------------------------------------------------------
      |
      | Backend mendukung:
      |
      | {
      |   identifier: "...",
      |   password: "..."
      | }
      |
      */

      const response = await loginAdmin({
        identifier: username,
        password,
      });

      console.log(
        'Response login admin:',
        response
      );

      /*
      |--------------------------------------------------------------------------
      | Struktur response
      |--------------------------------------------------------------------------
      |
      | {
      |   success: true,
      |   message: "...",
      |   data: {
      |     token: "...",
      |     admin: {...}
      |   }
      | }
      |
      */

      const token =
        response?.data?.token;

      const admin =
        response?.data?.admin;

      const expiresAt =
        response?.data?.expires_at;

      /*
      |--------------------------------------------------------------------------
      | Validasi response
      |--------------------------------------------------------------------------
      */

      if (
        response?.success !== true ||
        !token ||
        !admin
      ) {
        console.error(
          'Response login admin tidak lengkap:',
          response
        );

        throw new Error(
          'Token atau data admin tidak ditemukan pada response login.'
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Simpan Session Admin
      |--------------------------------------------------------------------------
      */

      window.localStorage.setItem(
        'arduflow_admin_token',
        token
      );

      window.localStorage.setItem(
        'arduflow_admin',
        JSON.stringify(admin)
      );

      if (expiresAt) {
        window.localStorage.setItem(
          'arduflow_admin_expires_at',
          expiresAt
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Debug
      |--------------------------------------------------------------------------
      */

      console.log(
        'Token admin berhasil disimpan:',
        Boolean(
          window.localStorage.getItem(
            'arduflow_admin_token'
          )
        )
      );

      console.log(
        'Data admin berhasil disimpan:',
        admin
      );

      /*
      |--------------------------------------------------------------------------
      | Event auth
      |--------------------------------------------------------------------------
      */

      window.dispatchEvent(
        new Event(
          'arduflow-auth-change'
        )
      );

      /*
      |--------------------------------------------------------------------------
      | Alert
      |--------------------------------------------------------------------------
      */

      await showSuccessAlert(
        'Login admin berhasil',
        response.message ||
          'Selamat datang di dashboard admin.'
      );

      /*
      |--------------------------------------------------------------------------
      | Redirect
      |--------------------------------------------------------------------------
      */

      const redirectTo =
        response?.data?.redirectTo ||
        response?.redirectTo ||
        '/admin/dashboard';

      window.location.href =
        redirectTo;
    } catch (loginError) {
      console.error(
        'Login admin gagal:',
        loginError
      );

      /*
      |--------------------------------------------------------------------------
      | Jangan simpan session gagal
      |--------------------------------------------------------------------------
      */

      window.localStorage.removeItem(
        'arduflow_admin'
      );

      window.localStorage.removeItem(
        'arduflow_admin_token'
      );

      window.localStorage.removeItem(
        'arduflow_admin_expires_at'
      );

      await showErrorAlert(
        'Login admin gagal',
        loginError.message ||
          'Username atau password admin salah.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | JSX
  |--------------------------------------------------------------------------
  */

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <span>ARDU</span>
          <strong>FLOW</strong>
        </div>

        <form
          className="admin-login-panel"
          onSubmit={handleSubmit}
        >
          <h1>
            Admin Log in
          </h1>

          {/* Username */}

          <label className="admin-login-field">
            <span>
              Username
            </span>

            <input
              type="text"
              name="username"
              placeholder="username"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </label>

          {/* Password */}

          <label className="admin-login-field">
            <span>
              Password
            </span>

            <div className="admin-login-password">
              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                name="password"
                placeholder="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                disabled={isSubmitting}
              />

              <button
                type="button"
                className="admin-login-eye"
                onClick={() =>
                  setShowPassword(
                    (value) => !value
                  )
                }
                aria-label={
                  showPassword
                    ? 'Sembunyikan password'
                    : 'Tampilkan password'
                }
              >
                <img
                  src={
                    showPassword
                      ? eyeOpenIcon
                      : hideIcon
                  }
                  alt=""
                />
              </button>
            </div>
          </label>

          {/* Login */}

          <button
            className="admin-login-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'LOADING...'
              : 'LOG IN'}
          </button>

          <a
            className="admin-login-forgot"
            href="/admin/forgot-password"
          >
            Forgot password?
          </a>
        </form>
      </section>
    </main>
  );
}