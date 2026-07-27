import { useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import hideIcon from '../../assets/icons/icon-hide-1.svg';
import { AuthImageSlider } from '../../components/auth/AuthImageSlider.jsx';
import { registerUser } from '../../services/authApi.js';

const phoneCountries = [
  { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'BN', name: 'Brunei', dial: '+673', flag: '🇧🇳' },
  { code: 'TH', name: 'Thailand', dial: '+66', flag: '🇹🇭' },
  { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnam', dial: '+84', flag: '🇻🇳' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971', flag: '🇦🇪' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
];

function normalizeWhatsapp(dialCode, phone) {
  const cleanDialCode = String(dialCode || '').replace(/[^\d+]/g, '');
  const cleanPhone = String(phone || '').replace(/[^\d]/g, '').replace(/^0+/, '');

  if (!cleanPhone) {
    return '';
  }

  return `${cleanDialCode}${cleanPhone}`;
}

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
  const [selectedCountryCode, setSelectedCountryCode] = useState('ID');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedCountry = phoneCountries.find((country) => country.code === selectedCountryCode) || phoneCountries[0];

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: '', message: '' });
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);

    try {
      const data = await registerUser({
        name: String(form.get('name') || ''),
        email: String(form.get('email') || ''),
        whatsapp: normalizeWhatsapp(form.get('whatsapp_dial'), form.get('whatsapp')),
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
                <div className="signup-country-code">
                  <span className="signup-flag" aria-hidden="true">{selectedCountry.flag}</span>
                  <select
                    name="whatsapp_dial"
                    aria-label="Kode negara WhatsApp"
                    value={selectedCountry.dial}
                    onChange={(event) => {
                      const nextCountry = phoneCountries.find((country) => country.dial === event.target.value);
                      setSelectedCountryCode(nextCountry?.code || 'ID');
                    }}
                  >
                    {phoneCountries.map((country) => (
                      <option key={country.code} value={country.dial}>
                        {country.name} {country.dial}
                      </option>
                    ))}
                  </select>
                  <img src={arrowDownIcon} alt="" aria-hidden="true" />
                  <strong>{selectedCountry.dial}</strong>
                </div>
                <input
                  type="tel"
                  name="whatsapp"
                  aria-label="Nomor Whatsapp"
                  inputMode="tel"
                  placeholder="81234567890"
                />
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
