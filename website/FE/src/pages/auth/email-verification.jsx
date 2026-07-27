import { AuthImageSlider } from '../../components/auth/AuthImageSlider.jsx';

export function EmailVerification() {
  return (
    <main className="signin-page verify-email-page">
      <AuthImageSlider />

      <section className="verify-email-panel" aria-labelledby="verify-email-title">
        <div className="verify-email-content">
          <div>
            <h2 id="verify-email-title">Cek email anda untuk verifikasi akun</h2>
            <p>Silakan periksa email pada inbox atau spam email.</p>
          </div>
          <a href="/signin">Kembali ke halaman login</a>
        </div>
      </section>
    </main>
  );
}
