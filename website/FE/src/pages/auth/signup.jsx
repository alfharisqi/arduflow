import { useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import hideIcon from '../../assets/icons/icon-hide-1.svg';
import { AuthImageSlider } from '../../components/auth/AuthImageSlider.jsx';

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

  return (
    <main className="signin-page signup-page">
      <AuthImageSlider />

      <section className="signup-panel" aria-labelledby="signup-title">
        <div className="signup-form-box">
          <h2 id="signup-title">Daftar Sekarang</h2>

          <form className="signup-form" action="/signup/email-verification">
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
              <button className="signup-submit" type="submit">Daftar</button>
              <p>
                Sudah punya akun? <a href="/signin">Masuk</a>
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
