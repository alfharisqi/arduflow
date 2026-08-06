import { useState } from "react";
import { workshopOptions } from "./leadOptions";
import { submitWorkshop } from "./leadApi";

function WorkshopForm() {
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
      form_type: "workshop",

      nama_workshop: String(
        formData.get("nama_workshop") || ""
      ).trim(),

      email_workshop: String(
        formData.get("email_workshop") || ""
      ).trim(),

      whatsapp_workshop: String(
        formData.get("whatsapp_workshop") || ""
      ).trim(),

      asal_workshop: String(
        formData.get("asal_workshop") || ""
      ).trim(),

      pilihan_workshop: String(
        formData.get("pilihan_workshop") || ""
      ).trim(),

      jumlah_peserta_workshop: String(
        formData.get("jumlah_peserta_workshop") || ""
      ).trim(),

      catatan_workshop: String(
        formData.get("catatan_workshop") || ""
      ).trim(),

      persetujuan_workshop:
        formData.get("persetujuan_workshop") === "on",
    };

    console.log("Payload workshop:", payload);

    setIsSubmitting(true);
    setErrors({});
    setNotification({
      type: "",
      message: "",
    });

    try {
      const result = await submitWorkshop(payload);

      console.log("Workshop berhasil:", result);

      setNotification({
        type: "success",
        message:
          result.message ||
          "Pendaftaran workshop berhasil dikirim.",
      });

      form.reset();
    } catch (error) {
      console.error("Workshop gagal:", error);

      setErrors(error.errors || {});

      setNotification({
        type: "error",
        message:
          error.message ||
          "Pendaftaran workshop gagal dikirim.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="contact-leads"
      aria-labelledby="contact-workshop-title"
    >
      <form
        className="lead-form-card"
        onSubmit={handleSubmit}
      >
        <div className="lead-form__heading">
          <h2 id="contact-workshop-title">
            3. Form Daftar Workshop
          </h2>

          <p>
            Untuk calon peserta yang ingin mendaftar workshop
            ArduFlow.
          </p>
        </div>

        <div className="lead-form__fields">
          <label className="lead-field">
            <span>Nama Lengkap *</span>

            <input
              name="nama_workshop"
              type="text"
              placeholder="Masukkan nama lengkap"
              autoComplete="name"
              minLength={3}
              maxLength={150}
              required
            />

            {errors.nama_workshop && (
              <small className="lead-field-error">
                {errors.nama_workshop}
              </small>
            )}
          </label>

          <label className="lead-field">
            <span>Email *</span>

            <input
              name="email_workshop"
              type="email"
              placeholder="Masukkan email"
              autoComplete="email"
              maxLength={191}
              required
            />

            {errors.email_workshop && (
              <small className="lead-field-error">
                {errors.email_workshop}
              </small>
            )}
          </label>

          <label className="lead-field">
            <span>Nomor WhatsApp *</span>

            <input
              name="whatsapp_workshop"
              type="tel"
              placeholder="08xxxxxxxxxx"
              autoComplete="tel"
              inputMode="numeric"
              required
            />

            {errors.whatsapp_workshop && (
              <small className="lead-field-error">
                {errors.whatsapp_workshop}
              </small>
            )}
          </label>

          <label className="lead-field">
            <span>
              Asal Sekolah / Komunitas / Institusi
            </span>

            <input
              name="asal_workshop"
              type="text"
              placeholder="Masukkan asal sekolah, komunitas, atau institusi"
              maxLength={200}
            />

            {errors.asal_workshop && (
              <small className="lead-field-error">
                {errors.asal_workshop}
              </small>
            )}
          </label>

          <label className="lead-field">
            <span>Pilihan Workshop *</span>

            <select
              name="pilihan_workshop"
              defaultValue=""
              required
            >
              <option value="" disabled>
                Pilih workshop
              </option>

              {workshopOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {errors.pilihan_workshop && (
              <small className="lead-field-error">
                {errors.pilihan_workshop}
              </small>
            )}
          </label>

          <label className="lead-field">
            <span>Jumlah Peserta</span>

            <input
              name="jumlah_peserta_workshop"
              type="text"
              placeholder="Contoh: 5 peserta / 1 kelompok"
              maxLength={150}
            />

            {errors.jumlah_peserta_workshop && (
              <small className="lead-field-error">
                {errors.jumlah_peserta_workshop}
              </small>
            )}
          </label>

          <label className="lead-field">
            <span>Catatan Tambahan</span>

            <textarea
              name="catatan_workshop"
              placeholder="Tulis kebutuhan atau pertanyaan khusus..."
              rows={4}
              maxLength={2000}
            />

            {errors.catatan_workshop && (
              <small className="lead-field-error">
                {errors.catatan_workshop}
              </small>
            )}
          </label>

          <label className="lead-consent">
            <input
              name="persetujuan_workshop"
              type="checkbox"
              required
            />

            <span>
              Saya menyetujui untuk dihubungi oleh tim
              ArduFlow terkait pendaftaran workshop.
            </span>
          </label>

          {errors.persetujuan_workshop && (
            <small className="lead-field-error">
              {errors.persetujuan_workshop}
            </small>
          )}

          <button
            className="lead-form-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "MENGIRIM..."
              : "DAFTAR WORKSHOP"}
          </button>

          {notification.message && (
            <div
              className={`lead-form-notification lead-form-notification--${notification.type}`}
              role="status"
              aria-live="polite"
            >
              {notification.message}
            </div>
          )}
        </div>
      </form>
    </section>
  );
}

export default WorkshopForm;
