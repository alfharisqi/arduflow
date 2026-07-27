import { useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import hideIcon from '../../assets/icons/icon-hide-1.svg';
import { AuthImageSlider } from '../../components/auth/AuthImageSlider.jsx';
import { registerUser } from '../../services/authApi.js';

function SignUpField({ label, name, type = 'text', placeholder, children }) {
  return (
    <label className="signup-field">
      <span>{label}</span>
      {children || <input type={type} name={name} placeholder={placeholder} />}
    </label>
  );
}

export function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: '', message: '' });
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);

    try {
      const data = await registerUser({
        name: String(form.get('name') || ''),
        email: String(form.get('email') || ''),
        whatsapp: String(form.get('whatsapp') || ''),
        occupation: String(form.get('occupation') || ''),
        password: String(form.get('password') || ''),
      });

      sessionStorage.setItem('arduflow_auth_message', data.message);
      window.location.assign('/signup/email-verification');
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="signin-page signup-page">
      <AuthImageSlider />

      <section className="signup-panel" aria-labelledby="signup-title">
        <div className="signup-form-box">
          <h2 id="signup-title">Daftar Sekarang</h2>

          <form className="signup-form" onSubmit={handleSubmit}>
            <SignUpField label="Nama" name="name" placeholder="Nama lengkap anda" />
            <SignUpField label="Email address" name="email" type="email" placeholder="contoh@gmail.com" />

            <SignUpField label="Nomor Whatsapp" name="whatsapp">
              <div className="signup-phone-input">
                <div className="signup-country-code" aria-hidden="true">
                  <span className="signup-flag">
                    <span />
                  </span>
                  <img src={arrowDownIcon} alt="" />
                  <strong>+1</strong>
                </div>
                <input type="tel" name="whatsapp" aria-label="Nomor Whatsapp" />
              </div>
            </SignUpField>

            <SignUpField label="Pekerjaan / Instansi" name="occupation">
              <div className="signup-select-wrap">
                <select name="occupation" defaultValue="">
                  <option value="" disabled>Pekerjaan / Mahasiswa/ Pengajar</option>
                  <option value="siswa">Siswa</option>
                  <option value="mahasiswa">Mahasiswa</option>
                  <option value="pengajar">Pengajar</option>
                  <option value="instansi">Instansi</option>
                </select>
                <img src={arrowDownIcon} alt="" />
              </div>
            </SignUpField>

            <label className="signup-field signup-password-field">
              <span className="signup-password-label">
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
              <input type={showPassword ? 'text' : 'password'} name="password" />
              <small>Gunakan minimal 8 karakter dengan kombinasi huruf, angka, dan simbol.</small>
            </label>

            <div className="signup-checklist">
              <label>
                <input type="checkbox" defaultChecked />
                <span>
                  Dengan membuat akun, saya menyetujui <a href="/akses">Syarat dan Ketentuan serta Kebijakan Privasi</a>
                </span>
              </label>

              <label>
                <input type="checkbox" defaultChecked />
                <span>
                  Dengan membuat akun, saya juga bersedia menerima SMS dan Email, termasuk informasi fitur terbaru,
                  pembaruan produk, acara dan promosi
                </span>
              </label>
            </div>

            <div className="signup-actions">
              <button className="signup-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Memproses...' : 'Daftar'}
              </button>
              <p>
                Sudah punya akun? <a href="/signin">Masuk</a>
              </p>
            </div>

            {status.message && (
              <p className={`auth-form-message ${status.type}`}>{status.message}</p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
