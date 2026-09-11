import { useEffect, useState } from "react";
import googleIcon from "../../assets/icons/sosmed-google.png";
import twitterIcon from "../../assets/icons/sosmed-twitter.png";
import hideIcon from "../../assets/icons/icon-hide-1.svg";
import eyeOpenIcon from "../../assets/icons/icon-eyeopen-1.svg";
import { AuthImageSlider } from "../../components/auth/AuthImageSlider.jsx";
import { loginUser } from "../../services/authApi.js";
import { setUserAuthState } from "../../services/authSession.js";
import {
  showErrorAlert,
  showSuccessAlert,
} from "../../utils/alerts.js";
import { getAfterLoginRedirect } from "../../utils/authRequired.js";

export function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verificationStatus = params.get('verified');
    const queryMessage = params.get('message');
    const storedMessage = sessionStorage.getItem('arduflow_auth_message');

    if (verificationStatus === '1') {
      const message = queryMessage || storedMessage || 'Email berhasil diverifikasi. Silakan masuk untuk melanjutkan.';
      sessionStorage.removeItem('arduflow_auth_message');
      showSuccessAlert('Verifikasi berhasil', message);
      window.history.replaceState({}, '', '/signin');
    } else if (verificationStatus === '0') {
      const message = queryMessage || 'Verifikasi email gagal. Silakan minta ulang email verifikasi.';
      showErrorAlert('Verifikasi gagal', message);
      window.history.replaceState({}, '', '/signin');
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    const identifier = String(
      formData.get("identifier") || ""
    ).trim();

    const password = String(
      formData.get("password") || ""
    );

    if (!identifier || !password) {
      await showErrorAlert(
        "Login gagal",
        "Nama atau email dan kata sandi wajib diisi."
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginUser({
        identifier,
        password,
      });

      console.log("Response login:", result);

      const user =
        result?.data?.user ??
        result?.user ??
        null;

      const token =
        result?.data?.token ??
        result?.token ??
        null;

      if (!user || !token) {
        console.error(
          "Response login tidak lengkap:",
          result
        );

        throw new Error(
          "Response login tidak memiliki data user atau token."
        );
      }

      setUserAuthState(user, token);

      showSuccessAlert(
        "Login berhasil",
        result.message || "Selamat datang kembali."
      );

      const redirectTo = getAfterLoginRedirect('/dashboard');

      window.setTimeout(() => {
        window.location.replace(redirectTo);
      }, 250);
    } catch (error) {
      console.error("Login gagal:", error);

      await showErrorAlert(
        "Login gagal",
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat login."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="signin-page">
      <AuthImageSlider />

      <section
        className="signin-panel"
        aria-labelledby="signin-title"
      >
        <a className="auth-back-button" href="/">← Kembali</a>

        <div className="signin-form-box">
          <h2 id="signin-title">Masuk</h2>

          <div
            className="signin-socials"
            aria-label="Masuk dengan sosial media"
          >
            <button
              className="signin-social-button"
              type="button"
            >
              <img src={googleIcon} alt="" />
              <span>Continue with Google</span>
            </button>

            <button
              className="signin-social-button"
              type="button"
            >
              <img src={twitterIcon} alt="" />
              <span>Continue with Twitter</span>
            </button>
          </div>

          <div
            className="signin-divider"
            aria-hidden="true"
          >
            <span />
            <strong>OR</strong>
            <span />
          </div>

          <form
            className="signin-form"
            onSubmit={handleSubmit}
          >
            <label className="signin-field">
              <span>Nama atau Email</span>

              <input
                type="text"
                name="identifier"
                placeholder="Masukkan nama atau email"
                autoComplete="username"
                required
              />
            </label>

            <label className="signin-field">
              <span className="signin-password-label">
                <span>Kata Sandi</span>

                <button
                  type="button"
                  className="signin-hide-button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                >
                  <img src={showPassword ? eyeOpenIcon : hideIcon} alt="" />
                  <span>
                    {showPassword ? "Hide" : "Show"}
                  </span>
                </button>
              </span>

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="Masukkan kata sandi"
                autoComplete="current-password"
                minLength={6}
                required
              />
            </label>

            <a
              className="signin-forgot"
              href="/reset-password"
            >
              Lupa Kata Sandi
            </a>

            <div className="signin-submit-group">
              <button
                className="signin-submit"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Memproses..."
                  : "Masuk"}
              </button>

              <p>
                Tidak punya akun?{" "}
                <a href="/signup">
                  Daftar Sekarang
                </a>
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
