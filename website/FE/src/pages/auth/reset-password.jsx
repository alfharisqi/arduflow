import { AuthImageSlider } from '../../components/auth/AuthImageSlider.jsx';

export function ResetPassword() {
  return (
    <main className="signin-page reset-password-page">
      <AuthImageSlider />

      <section className="reset-password-panel" aria-labelledby="reset-password-title">
        <form className="reset-password-box">
          <h2 id="reset-password-title">Reset password anda</h2>

          <label className="reset-password-field">
            <span>Email address</span>
            <input type="email" name="email" placeholder="contoh@gmail.com" autoComplete="email" />
          </label>

          <div className="reset-password-actions">
            <button type="submit">Lanjut</button>
            <p>
              Sudah punya akun? <a href="/signin">Masuk</a>
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
