import { AuthImageSlider } from '../../components/auth/AuthImageSlider.jsx';

export function ResetPasswordSent() {
  return (
    <main className="signin-page reset-password-sent-page">
      <AuthImageSlider />

      <section className="reset-password-sent-panel" aria-labelledby="reset-password-sent-title">
        <div className="reset-password-sent-content">
          <div>
            <h2 id="reset-password-sent-title">Tautan pemulihan telah dikirim ke email Anda!</h2>
            <p>Silakan periksa email Anda untuk langkah selanjutnya dalam ulang kata sandi.</p>
          </div>
          <a href="/signin">Kembali ke halaman login</a>
        </div>
      </section>
    </main>
  );
}
