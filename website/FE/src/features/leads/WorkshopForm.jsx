import { useEffect, useMemo, useState } from "react";
import { submitWorkshop } from "./leadApi";
import {
  fetchWorkshops,
  isPublicWorkshop,
} from "../../services/workshopApi.js";

function WorkshopForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingWorkshops, setIsLoadingWorkshops] =
    useState(true);
  const [workshopLoadError, setWorkshopLoadError] =
    useState("");
  const [workshops, setWorkshops] = useState([]);
  const [selectedWorkshopId, setSelectedWorkshopId] =
    useState("");
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({
    type: "",
    message: "",
  });

  useEffect(() => {
    let isActive = true;

    async function loadWorkshops() {
      setIsLoadingWorkshops(true);
      setWorkshopLoadError("");

      try {
        const rows = await fetchWorkshops();
        const publicWorkshops = rows.filter(isPublicWorkshop);
        const visibleWorkshops =
          publicWorkshops.length > 0 ? publicWorkshops : rows;

        if (!isActive) return;

        setWorkshops(visibleWorkshops);
      } catch (error) {
        if (!isActive) return;

        setWorkshopLoadError(
          error.message ||
            "Data workshop tidak dapat dimuat dari database."
        );
        setWorkshops([]);
      } finally {
        if (isActive) {
          setIsLoadingWorkshops(false);
        }
      }
    }

    loadWorkshops();

    return () => {
      isActive = false;
    };
  }, []);

  const selectedWorkshop = useMemo(
    () =>
      workshops.find(
        (workshop) =>
          String(workshop.id) === String(selectedWorkshopId)
      ) || null,
    [selectedWorkshopId, workshops]
  );

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

      pilihan_workshop_id: String(
        formData.get("pilihan_workshop_id") || ""
      ).trim(),

      jumlah_peserta_workshop: String(
        formData.get("jumlah_peserta_workshop") || ""
      ).trim(),

      nama_anggota_workshop: String(
        formData.get("nama_anggota_workshop") || ""
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
      setSelectedWorkshopId("");
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
              name="pilihan_workshop_id"
              value={selectedWorkshopId}
              onChange={(event) =>
                setSelectedWorkshopId(event.target.value)
              }
              disabled={isLoadingWorkshops}
              required
            >
              <option value="" disabled>
                {isLoadingWorkshops
                  ? "Memuat workshop..."
                  : "Pilih workshop"}
              </option>

              {workshops.map((workshop) => (
                <option key={workshop.id} value={workshop.id}>
                  {workshop.title}
                </option>
              ))}
            </select>

            <input
              name="pilihan_workshop"
              type="hidden"
              value={selectedWorkshop?.title || ""}
            />

            {workshopLoadError && (
              <small className="lead-field-error">
                {workshopLoadError}
              </small>
            )}

            {errors.pilihan_workshop && (
              <small className="lead-field-error">
                {errors.pilihan_workshop}
              </small>
            )}
          </label>

          <label className="lead-field">
            <span>Jumlah Anggota / Peserta</span>

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
            <span>Nama Anggota</span>

            <textarea
              name="nama_anggota_workshop"
              placeholder="Tulis nama anggota/peserta, satu nama per baris..."
              rows={4}
              maxLength={2000}
            />

            {errors.nama_anggota_workshop && (
              <small className="lead-field-error">
                {errors.nama_anggota_workshop}
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
            disabled={isSubmitting || isLoadingWorkshops}
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
