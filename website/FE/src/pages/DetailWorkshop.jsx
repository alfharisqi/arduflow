import workshopHero from '../assets/images/workshop-list-presentation-speaker.jpg';

const heroStats = [
  {
    label: 'Tingkat',
    value: 'Pemula',
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="5" y="6" width="22" height="16" rx="2.5" />
        <path d="M12 27h8M16 22v5" />
      </svg>
    ),
  },
  {
    label: 'Durasi',
    value: '4 Jam',
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="12" />
        <path d="M16 9v8l5-3" />
      </svg>
    ),
  },
  {
    label: 'Platform',
    value: 'Arduflow',
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="10" y="10" width="12" height="12" rx="2" />
        <path d="M16 3v5M16 24v5M3 16h5M24 16h5M7.5 7.5l3.5 3.5M21 21l3.5 3.5M24.5 7.5 21 11M11 21l-3.5 3.5" />
      </svg>
    ),
  },
];

const infoItems = [
  {
    label: 'Tanggal',
    value: '30 Juli 2025',
    detail: 'Kamis',
    icon: (
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M14 7v8M42 7v8M9 20h38M10 12h36a3 3 0 0 1 3 3v31a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V15a3 3 0 0 1 3-3Z" />
        <path d="M18 29h4M27 29h4M36 29h4M18 38h4M27 38h4M36 38h4" />
      </svg>
    ),
  },
  {
    label: 'Waktu',
    value: '08.00 - 12.00 WIB',
    detail: 'Durasi 4 jam',
    icon: (
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r="22" />
        <path d="M28 15v15l10-7" />
      </svg>
    ),
  },
  {
    label: 'Lokasi',
    value: 'Universitas Negeri Malang',
    detail: 'Jl. Cakrawala No.5, Sumbersari, Kec. Lowokwaru, Kota Malang',
    icon: (
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M28 51s18-18.2 18-31A18 18 0 0 0 10 20c0 12.8 18 31 18 31Z" />
        <circle cx="28" cy="20" r="6" />
      </svg>
    ),
  },
  {
    label: 'Harga',
    value: 'IDR 50.000',
    detail: 'Termasuk modul & e-certificate',
    icon: (
      <svg viewBox="0 0 56 56" aria-hidden="true">
        <path d="M28 5v46M40 14c-3-3.4-8-5.1-13.2-4.2-5 .9-8.8 4.1-8.8 8.4 0 5.4 5.2 7 10.2 8.1 5.1 1.1 10.8 2.6 10.8 8.6 0 4.9-4.7 8.7-10.8 8.7-5.1 0-9.3-1.8-12.2-5" />
      </svg>
    ),
    accent: true,
  },
];

export function DetailWorkshop() {
  return (
    <main className="workshop-detail-page">
      <section className="workshop-detail-shell" aria-labelledby="detail-workshop-title">
        <div className="workshop-detail-hero">
          <div className="workshop-detail-copy">
            <h1 id="detail-workshop-title">Workshop Pemula Arduflow dan IoT</h1>
            <p>Ikuti dan belajar IoT dari dasar hingga membuat proyek sederhana bersama Workshop Arduflow.</p>

            <div className="workshop-detail-chips" aria-label="Ringkasan workshop">
              {heroStats.map((item) => (
                <article className="workshop-detail-chip" key={item.label}>
                  <span className="workshop-detail-chip-icon">{item.icon}</span>
                  <span>
                    <small>{item.label}</small>
                    <strong>{item.value}</strong>
                  </span>
                </article>
              ))}
            </div>
          </div>

          <div className="workshop-detail-image">
            <img src={workshopHero} alt="Suasana workshop Arduflow" />
          </div>
        </div>

        <div className="workshop-detail-info" aria-label="Informasi workshop">
          {infoItems.map((item) => (
            <article className="workshop-detail-info-item" key={item.label}>
              <span className="workshop-detail-info-icon">{item.icon}</span>
              <span>
                <small>{item.label}</small>
                <strong className={item.accent ? 'accent' : ''}>{item.value}</strong>
                <em>{item.detail}</em>
              </span>
            </article>
          ))}
        </div>

        <div className="workshop-detail-bottom">
          <article className="workshop-detail-about">
            <h2>Tentang Workshop</h2>
            <span className="workshop-detail-accent" aria-hidden="true" />
            <p>
              Workshop ini dirancang untuk pemula yang ingin memahami konsep dasar Internet of Things (IoT)
              dan mulai membuat proyek sederhana menggunakan Arduflow.
            </p>
            <p>
              Peserta akan mempelajari dasar-dasar IoT, mengenal komponen yang digunakan, serta praktik
              langsung membuat proyek monitoring berbasis sensor dan dashboard.
            </p>
          </article>

          <aside className="workshop-detail-cta" aria-label="Daftar workshop">
            <h2>Mulai Perjalanan IoT-mu!</h2>
            <p>Bangun keterampilan masa depan dan wujudkan ide kreatifmu menjadi proyek nyata.</p>
            <a href="/kontak">Daftar Sekarang <span aria-hidden="true">&rarr;</span></a>
          </aside>
        </div>
      </section>
    </main>
  );
}
