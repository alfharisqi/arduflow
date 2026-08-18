import { useEffect, useMemo, useState } from "react";
import { submitWorkshop } from "./leadApi";
import {
  fetchWorkshops,
  isPublicWorkshop,
} from "../../services/workshopApi.js";
import { showSuccessAlert } from "../../utils/alerts.js";

const MAX_PARTICIPANTS = 200;

function createEmptyParticipant() {
  return {
    name: "",
    email: "",
  };
}

function parseParticipantCount(value) {
  const count = Number(String(value || "").replace(/\D/g, ""));
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.min(count, MAX_PARTICIPANTS);
}

function parseCurrencyValue(value) {
  const amount = Number(String(value ?? "").replace(/\D/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function formatCurrency(value) {
  const amount = parseCurrencyValue(value);
  if (amount <= 0) return "Gratis";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function resizeParticipants(current, count) {
  return Array.from({ length: count }, (_, index) => current[index] || createEmptyParticipant());
}

function normalizeHeader(value) {
  return String(value || "").trim().toLowerCase();
}

function findColumnIndex(headers, candidates, fallback) {
  const index = headers.findIndex((header) =>
    candidates.some((candidate) => header.includes(candidate))
  );

  return index >= 0 ? index : fallback;
}

async function readParticipantsFile(file) {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("File tidak memiliki sheet.");
  }

  const rows = XLSX.utils
    .sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" })
    .filter((row) => row.some((cell) => String(cell || "").trim()));

  if (rows.length === 0) {
    throw new Error("File peserta kosong.");
  }

  const headers = rows[0].map(normalizeHeader);
  const hasHeader = headers.some((header) =>
    ["nama", "name", "peserta", "anggota", "email", "e-mail"].some((keyword) =>
      header.includes(keyword)
    )
  );
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const nameIndex = hasHeader
    ? findColumnIndex(headers, ["nama", "name", "peserta", "anggota"], 0)
    : 0;
  const emailIndex = hasHeader
    ? findColumnIndex(headers, ["email", "e-mail", "mail"], 1)
    : 1;

  const participants = dataRows
    .map((row) => ({
      name: String(row[nameIndex] || "").trim(),
      email: String(row[emailIndex] || "").trim(),
    }))
    .filter((participant) => participant.name || participant.email)
    .slice(0, MAX_PARTICIPANTS);

  if (participants.length === 0) {
    throw new Error("Kolom nama/email peserta tidak ditemukan.");
  }

  return participants;
}

function WorkshopForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingWorkshops, setIsLoadingWorkshops] =
    useState(true);
  const [workshopLoadError, setWorkshopLoadError] =
    useState("");
  const [workshops, setWorkshops] = useState([]);
  const [selectedWorkshopId, setSelectedWorkshopId] =
    useState("");
  const [participantCount, setParticipantCount] = useState("");
  const [participants, setParticipants] = useState([]);
  const [participantFileName, setParticipantFileName] = useState("");
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({
    type: "",
    message: "",
  });
  const storedUser = useMemo(() => {
    try {
      const rawUser = window.localStorage.getItem("arduflow_user");
      return rawUser ? JSON.parse(rawUser) : {};
    } catch {
      return {};
    }
  }, []);

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
        const params = new URLSearchParams(window.location.search);
        const requestedWorkshopId = params.get("workshop_id");
        if (
          requestedWorkshopId &&
          visibleWorkshops.some(
            (workshop) => String(workshop.id) === String(requestedWorkshopId)
          )
        ) {
          setSelectedWorkshopId(requestedWorkshopId);
        }
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

  const memberNamesValue = useMemo(
    () =>
      participants
        .map((participant, index) => {
          const name = participant.name.trim();
          const email = participant.email.trim();
          if (!name && !email) return "";
          return `${index + 1}. ${name || "-"}${email ? ` <${email}>` : ""}`;
        })
        .filter(Boolean)
        .join("\n"),
    [participants]
  );

  const participantEmailsValue = useMemo(
    () =>
      participants
        .map((participant) => participant.email.trim())
        .filter(Boolean)
        .join("\n"),
    [participants]
  );

  const paymentSummary = useMemo(() => {
    const unitPrice = parseCurrencyValue(
      selectedWorkshop?.registrationFee ?? selectedWorkshop?.price
    );
    const count = parseParticipantCount(participantCount) || participants.length;

    return {
      count,
      unitPrice,
      total: unitPrice * count,
    };
  }, [participantCount, participants.length, selectedWorkshop]);

  function handleParticipantCountChange(event) {
    const rawValue = event.target.value;
    const nextCount = parseParticipantCount(rawValue);

    setParticipantCount(nextCount ? String(nextCount) : rawValue.replace(/\D/g, "").slice(0, 3));
    setParticipants((current) => resizeParticipants(current, nextCount));
  }

  function updateParticipant(index, field, value) {
    setParticipants((current) =>
      current.map((participant, participantIndex) =>
        participantIndex === index
          ? { ...participant, [field]: value }
          : participant
      )
    );
  }

  async function handleParticipantFileChange(event) {
    const file = event.target.files?.[0] || null;
    event.target.value = "";

    if (!file) return;

    setNotification({ type: "", message: "" });

    try {
      const importedParticipants = await readParticipantsFile(file);
      setParticipants(importedParticipants);
      setParticipantCount(String(importedParticipants.length));
      setParticipantFileName(file.name);
      setNotification({
        type: "success",
        message: `${importedParticipants.length} peserta berhasil diambil dari file.`,
      });
    } catch (error) {
      setParticipantFileName("");
      setNotification({
        type: "error",
        message: error.message || "File peserta gagal dibaca.",
      });
    }
  }

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
        participantCount || formData.get("jumlah_peserta_workshop") || ""
      ).trim(),

      nama_anggota_workshop: memberNamesValue,

      email_peserta_workshop: participantEmailsValue,

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

      await showSuccessAlert(
        "Pendaftaran Berhasil",
        result.message || "Pendaftaran workshop berhasil dikirim. Silakan lanjutkan pembayaran di halaman Transaksi."
      );

      form.reset();
      setSelectedWorkshopId("");
      setParticipantCount("");
      setParticipants([]);
      setParticipantFileName("");
      window.location.assign("/transaksi");
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
      id="form-daftar-workshop"
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
              defaultValue={storedUser.name || storedUser.fullName || ""}
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
              defaultValue={storedUser.email || ""}
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
              defaultValue={storedUser.whatsapp || storedUser.phone || ""}
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
              readOnly
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
              type="number"
              min="0"
              max={MAX_PARTICIPANTS}
              inputMode="numeric"
              placeholder="Contoh: 5"
              value={participantCount}
              onChange={handleParticipantCountChange}
            />

            {errors.jumlah_peserta_workshop && (
              <small className="lead-field-error">
                {errors.jumlah_peserta_workshop}
              </small>
            )}
          </label>

          <div className="lead-field lead-participant-upload">
            <span>Upload Data Peserta</span>

            <label className="lead-file-upload">
              <input
                type="file"
                accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleParticipantFileChange}
              />
              <strong>Pilih File Excel / CSV</strong>
              <small>
                Format kolom: nama dan email. Baris peserta akan terisi otomatis.
              </small>
            </label>

            {participantFileName && (
              <small className="lead-file-name">
                File: {participantFileName}
              </small>
            )}
          </div>

          <div className="lead-payment-summary" aria-live="polite">
            <span>Total Harga</span>
            <strong>{formatCurrency(paymentSummary.total)}</strong>
            <small>
              {formatCurrency(paymentSummary.unitPrice)} x {paymentSummary.count || 0} peserta
            </small>
          </div>

          {participants.length > 0 && (
            <div className="lead-participants">
              <div className="lead-participants__head">
                <span>Nama Anggota</span>
                <span>Email Peserta</span>
              </div>

              {participants.map((participant, index) => (
                <div className="lead-participant-row" key={index}>
                  <input
                    type="text"
                    value={participant.name}
                    onChange={(event) =>
                      updateParticipant(index, "name", event.target.value)
                    }
                    placeholder={`Nama peserta ${index + 1}`}
                    maxLength={150}
                  />
                  <input
                    type="email"
                    value={participant.email}
                    onChange={(event) =>
                      updateParticipant(index, "email", event.target.value)
                    }
                    placeholder={`email${index + 1}@contoh.com`}
                    maxLength={191}
                  />
                </div>
              ))}
            </div>
          )}

          <input
            name="nama_anggota_workshop"
            type="hidden"
            value={memberNamesValue}
            readOnly
          />
          <input
            name="email_peserta_workshop"
            type="hidden"
            value={participantEmailsValue}
            readOnly
          />

          {errors.nama_anggota_workshop && (
            <small className="lead-field-error">
              {errors.nama_anggota_workshop}
            </small>
          )}

          {errors.email_peserta_workshop && (
            <small className="lead-field-error">
              {errors.email_peserta_workshop}
            </small>
          )}

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
