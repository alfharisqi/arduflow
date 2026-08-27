import { useState } from "react";
import googleIcon from "../../assets/icons/sosmed-google.png";
import twitterIcon from "../../assets/icons/sosmed-twitter.png";
import hideIcon from "../../assets/icons/icon-hide-1.svg";
import { AuthImageSlider } from "../../components/auth/AuthImageSlider.jsx";
import { loginUser } from "../../services/authApi.js";
import {
  showErrorAlert,
  showSuccessAlert,
} from "../../utils/alerts.js";

export function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      localStorage.setItem(
        "arduflow_user",
        JSON.stringify(user)
      );

      localStorage.setItem(
        "arduflow_user_token",
        token
      );

      await showSuccessAlert(
        "Login berhasil",
        result.message || "Selamat datang kembali."
      );

      window.location.assign("/");
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
                  <img src={hideIcon} alt="" />
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