import { workshopOptions } from "./leadOptions";

function WorkshopForm() {
  return (
    <section className="contact-leads" aria-labelledby="contact-workshop-title">
      <form
        className="lead-form-card"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="lead-form__heading">
          <h2 id="contact-workshop-title">3. Form Daftar Workshop</h2>
          <p>Untuk calon peserta yang ingin mendaftar workshop ArduFlow.</p>
        </div>

        <div className="lead-form__fields">
          <label className="lead-field">
            <span>Nama Lengkap *</span>
            <input
              name="nama_workshop"
              type="text"
              placeholder="Masukkan nama lengkap"
              autoComplete="name"
              required
            />
          </label>

          <label className="lead-field">
            <span>Email *</span>
            <input
              name="email_workshop"
              type="email"
              placeholder="Masukkan email"
              autoComplete="email"
              required
            />
          </label>

          <label className="lead-field">
            <span>Nomor WhatsApp *</span>
            <input
              name="whatsapp_workshop"
              type="tel"
              placeholder="08xxxxxxxxxx"
              autoComplete="tel"
              required
            />
          </label>

          <label className="lead-field">
            <span>Asal Sekolah / Komunitas / Institusi</span>
            <input
              name="asal_workshop"
              type="text"
              placeholder="Masukkan asal sekolah, komunitas, atau institusi"
            />
          </label>

          <label className="lead-field">
            <span>Pilihan Workshop *</span>
            <select name="pilihan_workshop" defaultValue="" required>
              <option value="" disabled>
                Pilih workshop
              </option>
              {workshopOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="lead-field">
            <span>Jumlah Peserta</span>
            <input
              name="jumlah_peserta_workshop"
              type="text"
              placeholder="Contoh: 5 peserta / 1 kelompok"
            />
          </label>

          <label className="lead-field">
            <span>Catatan Tambahan</span>
            <textarea
              name="catatan_workshop"
              placeholder="Tulis kebutuhan atau pertanyaan khusus..."
              rows="4"
            />
          </label>

          <label className="lead-consent">
            <input name="persetujuan_workshop" type="checkbox" required />
            <span>
              Saya menyetujui untuk dihubungi oleh tim ArduFlow terkait
              pendaftaran workshop.
            </span>
          </label>

          <button className="lead-form-submit" type="submit">
            DAFTAR WORKSHOP
          </button>
        </div>
      </form>
    </section>
  );
}

export default WorkshopForm;
