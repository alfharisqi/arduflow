import { leadNeedOptions } from "./leadOptions";

function LeadForm() {
  return (
    <section className="contact-leads" aria-labelledby="contact-leads-title">
      <form
        className="lead-form-card"
        onSubmit={(event) => event.preventDefault()}
      >
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
              rows="4"
            />
          </label>

          <label className="lead-consent">
            <input name="persetujuan" type="checkbox" required />
            <span>
              Saya menyetujui untuk dihubungi oleh tim ArduFlow terkait
              kebutuhan saya.
            </span>
          </label>

          <button className="lead-form-submit" type="submit">
            KIRIM FORM LEADS
          </button>
        </div>
      </form>
    </section>
  );
}

export default LeadForm;
