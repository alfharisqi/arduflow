import { collaborationGoalOptions, institutionOptions } from "./leadOptions";

function CollaborationForm() {
  return (
    <section
      className="contact-leads contact-leads--collab"
      aria-labelledby="contact-collab-title"
    >
      <form
        className="lead-form-card lead-form-card--collab"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="lead-form__heading lead-form__heading--collab">
          <h2 id="contact-collab-title">2. Formulir Kontak dan Kolaborasi</h2>
          <p>Untuk sekolah, komunitas, partner, atau institusi.</p>
        </div>

        <div className="lead-form__fields lead-form__fields--compact">
          <label className="lead-field lead-field--compact">
            <span>Nama Lengkap *</span>
            <input
              name="nama_pic"
              type="text"
              placeholder="Masukkan nama lengkap"
              autoComplete="name"
              required
            />
          </label>

          <label className="lead-field lead-field--compact">
            <span>Email *</span>
            <input
              name="email_pic"
              type="email"
              placeholder="Masukkan email"
              autoComplete="email"
              required
            />
          </label>

          <label className="lead-field lead-field--compact">
            <span>Nomor WhatsApp *</span>
            <input
              name="whatsapp_pic"
              type="tel"
              placeholder="08xxxxxxxxxx"
              autoComplete="tel"
              required
            />
          </label>

          <label className="lead-field lead-field--compact">
            <span>Nama Sekolah / Komunitas / Institusi *</span>
            <input
              name="institusi"
              type="text"
              placeholder="Masukkan nama institusi"
              required
            />
          </label>

          <label className="lead-field lead-field--compact">
            <span>Jenis Institusi *</span>
            <select name="jenis_institusi" defaultValue="" required>
              <option value="" disabled>
                Pilih jenis institusi
              </option>
              {institutionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="lead-field lead-field--compact">
            <span>Tujuan *</span>
            <select name="tujuan" defaultValue="" required>
              <option value="" disabled>
                Pilih tujuan
              </option>
              {collaborationGoalOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="lead-field lead-field--compact">
            <span>Jumlah Peserta / Perkiraan User</span>
            <input
              name="jumlah_peserta"
              type="text"
              placeholder="Contoh: 30 siswa / 1 kelas"
            />
          </label>

          <label className="lead-field lead-field--compact">
            <span>Jadwal Demo / Diskusi</span>
            <input
              name="jadwal_demo"
              type="text"
              placeholder="Pilih tanggal / waktu"
            />
          </label>

          <label className="lead-consent lead-consent--compact">
            <input name="persetujuan_kolaborasi" type="checkbox" required />
            <span>
              Saya menyetujui untuk dihubungi oleh tim ArduFlow untuk keperluan
              demo / kerja sama.
            </span>
          </label>

          <button className="lead-form-submit lead-form-submit--compact" type="submit">
            KIRIM REQUEST
          </button>
        </div>
      </form>
    </section>
  );
}

export default CollaborationForm;
