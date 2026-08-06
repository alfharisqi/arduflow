import { useState } from "react";
import {
  collaborationGoalOptions,
  institutionOptions,
} from "./leadOptions";
import { submitCollaboration } from "./leadApi";

function CollaborationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({
    type: "",
    message: "",
  });

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      form_type: "collaboration",

      nama_pic: String(
        formData.get("nama_pic") || ""
      ).trim(),

      email_pic: String(
        formData.get("email_pic") || ""
      ).trim(),

      whatsapp_pic: String(
        formData.get("whatsapp_pic") || ""
      ).trim(),

      institusi: String(
        formData.get("institusi") || ""
      ).trim(),

      jenis_institusi: String(
        formData.get("jenis_institusi") || ""
      ).trim(),

      tujuan: String(
        formData.get("tujuan") || ""
      ).trim(),

      jumlah_peserta: String(
        formData.get("jumlah_peserta") || ""
      ).trim(),

      jadwal_demo: String(
        formData.get("jadwal_demo") || ""
      ).trim(),

      persetujuan_kolaborasi:
        formData.get("persetujuan_kolaborasi") === "on",
    };

    console.log("Payload kolaborasi:", payload);

    setIsSubmitting(true);
    setErrors({});
    setNotification({
      type: "",
      message: "",
    });

    try {
      const result = await submitCollaboration(payload);

      console.log("Response kolaborasi:", result);

      setNotification({
        type: "success",
        message:
          result.message ||
          "Permintaan kolaborasi berhasil dikirim.",
      });

      form.reset();
    } catch (error) {
      console.error(
        "Gagal mengirim formulir kolaborasi:",
        error
      );

      setErrors(error.errors || {});

      setNotification({
        type: "error",
        message:
          error.message ||
          "Permintaan kolaborasi gagal dikirim.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="contact-leads contact-leads--collab"
      aria-labelledby="contact-collab-title"
    >
      <form
        className="lead-form-card lead-form-card--collab"
        onSubmit={handleSubmit}
      >
        <div className="lead-form__heading lead-form__heading--collab">
          <h2 id="contact-collab-title">
            2. Formulir Kontak dan Kolaborasi
          </h2>

          <p>
            Untuk sekolah, komunitas, partner, atau institusi.
          </p>
        </div>

        <div className="lead-form__fields lead-form__fields--compact">
          <label className="lead-field lead-field--compact">
            <span>Nama Lengkap *</span>

            <input
              name="nama_pic"
              type="text"
              placeholder="Masukkan nama lengkap"
              autoComplete="name"
              minLength={3}
              maxLength={150}
              required
            />

            {errors.nama_pic && (
              <small className="lead-field-error">
                {errors.nama_pic}
              </small>
            )}
          </label>

          <label className="lead-field lead-field--compact">
            <span>Email *</span>

            <input
              name="email_pic"
              type="email"
              placeholder="Masukkan email"
              autoComplete="email"
              maxLength={191}
              required
            />

            {errors.email_pic && (
              <small className="lead-field-error">
                {errors.email_pic}
              </small>
            )}
          </label>

          <label className="lead-field lead-field--compact">
            <span>Nomor WhatsApp *</span>

            <input
              name="whatsapp_pic"
              type="tel"
              placeholder="08xxxxxxxxxx"
              autoComplete="tel"
              inputMode="numeric"
              required
            />

            {errors.whatsapp_pic && (
              <small className="lead-field-error">
                {errors.whatsapp_pic}
              </small>
            )}
          </label>

          <label className="lead-field lead-field--compact">
            <span>
              Nama Sekolah / Komunitas / Institusi *
            </span>

            <input
              name="institusi"
              type="text"
              placeholder="Masukkan nama institusi"
              maxLength={200}
              required
            />

            {errors.institusi && (
              <small className="lead-field-error">
                {errors.institusi}
              </small>
            )}
          </label>

          <label className="lead-field lead-field--compact">
            <span>Jenis Institusi *</span>

            <select
              name="jenis_institusi"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Pilih jenis institusi
              </option>

              {institutionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {errors.jenis_institusi && (
              <small className="lead-field-error">
                {errors.jenis_institusi}
              </small>
            )}
          </label>

          <label className="lead-field lead-field--compact">
            <span>Tujuan *</span>

            <select
              name="tujuan"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Pilih tujuan
              </option>

              {collaborationGoalOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {errors.tujuan && (
              <small className="lead-field-error">
                {errors.tujuan}
              </small>
            )}
          </label>

          <label className="lead-field lead-field--compact">
            <span>Jumlah Peserta / Perkiraan User</span>

            <input
              name="jumlah_peserta"
              type="text"
              placeholder="Contoh: 30 siswa / 1 kelas"
              maxLength={150}
            />

            {errors.jumlah_peserta && (
              <small className="lead-field-error">
                {errors.jumlah_peserta}
              </small>
            )}
          </label>

          <label className="lead-field lead-field--compact">
            <span>Jadwal Demo / Diskusi</span>

            <input
              name="jadwal_demo"
              type="datetime-local"
            />

            {errors.jadwal_demo && (
              <small className="lead-field-error">
                {errors.jadwal_demo}
              </small>
            )}
          </label>

          <label className="lead-consent lead-consent--compact">
            <input
              name="persetujuan_kolaborasi"
              type="checkbox"
              required
            />

            <span>
              Saya menyetujui untuk dihubungi oleh tim ArduFlow
              untuk keperluan demo / kerja sama.
            </span>
          </label>

          {errors.persetujuan_kolaborasi && (
            <small className="lead-field-error">
              {errors.persetujuan_kolaborasi}
            </small>
          )}

          <button
            className="lead-form-submit lead-form-submit--compact"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "MENGIRIM..."
              : "KIRIM REQUEST"}
          </button>

          {notification.message && (
            <p
              className={`lead-form-notification lead-form-notification--${notification.type}`}
              role="status"
              aria-live="polite"
            >
              {notification.message}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

export default CollaborationForm;
