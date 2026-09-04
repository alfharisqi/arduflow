import { useState } from "react";
import { leadNeedOptions } from "./leadOptions";
import { submitLead } from "./leadApi";

function LeadForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
  });

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      form_type: "lead",
      nama: String(formData.get("nama") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      whatsapp: String(formData.get("whatsapp") || "").trim(),
      kebutuhan: String(formData.get("kebutuhan") || "").trim(),
      pesan: String(formData.get("pesan") || "").trim(),
      persetujuan: formData.get("persetujuan") === "on",
    };

    console.log("Payload leads:", payload);

    setIsSubmitting(true);
    setNotification({
      type: "",
      message: "",
    });

    try {
      const result = await submitLead(payload);

      console.log("Response leads:", result);

      setNotification({
        type: "success",
        message: result.message || "Form leads berhasil dikirim.",
      });

      form.reset();
    } catch (error) {
      console.error("Gagal mengirim form leads:", error);

      setNotification({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Form leads gagal dikirim.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      className="contact-leads"
      aria-labelledby="contact-leads-title"
    >
      <form className="lead-form-card" onSubmit={handleSubmit}>
        <div className="lead-form__heading">
          <h2 id="contact-leads-title">1. Form Leads</h2>
          <p>Untuk calon pengguna yang tertarik dengan ArduFlow.</p>
        </div>

        <div className="lead-form__fields">
          <label className="lead-field">
            <span>Nama Lengkap *</span>

            <input
              name="nama"
              type="text"
              placeholder="Masukkan nama lengkap"
              autoComplete="name"
              minLength={3}
              maxLength={150}
              required
            />
          </label>

          <label className="lead-field">
            <span>Email *</span>

            <input
              name="email"
              type="email"
              placeholder="Masukkan email"
              autoComplete="email"
              maxLength={191}
              required
            />
          </label>

          <label className="lead-field">
            <span>Nomor WhatsApp *</span>

            <input
              name="whatsapp"
              type="tel"
              placeholder="08xxxxxxxxxx"
              autoComplete="tel"
              inputMode="numeric"
              required
            />
          </label>

          <label className="lead-field">
            <span>Kebutuhan Anda *</span>

            <select name="kebutuhan" defaultValue="" required>
              <option value="" disabled>
                Pilih kebutuhan
              </option>

              {leadNeedOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="lead-field">
            <span>Pesan Tambahan (opsional)</span>

            <textarea
              name="pesan"
              placeholder="Tulis pesan Anda di sini..."
              rows={4}
              maxLength={2000}
            />
          </label>

          <label className="lead-consent">
            <input
              name="persetujuan"
              type="checkbox"
              required
            />

            <span>
              Saya menyetujui untuk dihubungi oleh tim ArduFlow
              terkait kebutuhan saya.
            </span>
          </label>

          <button
            className="lead-form-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "MENGIRIM..."
              : "KIRIM FORM LEADS"}
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

export default LeadForm;