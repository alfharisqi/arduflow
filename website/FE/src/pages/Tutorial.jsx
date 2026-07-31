import tutorialDevice from '../assets/images/tutorial-device.png';
import apaItuArduflowImage from '../assets/images/apa itu arduflow.png';
import daftarAkunImage from '../assets/images/cara daftar untuk mendatkan akun.png';
import masukIdeImage from '../assets/images/cara masuk ke arduflow IDE.png';
import tokenIdeImage from '../assets/images/cara mendapatkan token IDE.png';
import belajarIotImage from '../assets/images/kenapa belajar IoT dengan visual.png';
import projectPertamaImage from '../assets/images/membuat project pertama.png';
import relayTutorialImage from '../assets/images/Kontrol Relay dengan Arduflow.jpg';
import boardTutorialImage from '../assets/images/Mengenal Board Arduino UNO.jpg';
import dhtTutorialImage from '../assets/images/Menggunakan Sensor DHT22.jpg';
import ledTutorialImage from '../assets/images/Menghubungkan LED ke Arduino.jpg';
import troubleshootingTutorialImage from '../assets/images/Troubleshooting Board Tidak Terdeteksi.jpg';

export function TutorialIcon({ type }) {
  if (type === 'code') {
    return (
      <svg viewBox="0 0 50 22" aria-hidden="true">
        <path d="M17 5L7 11L17 17" />
        <path d="M33 5L43 11L33 17" />
        <path d="M28 3L22 19" />
      </svg>
    );
  }

  if (type === 'cpu') {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <rect x="11" y="11" width="18" height="18" rx="2" />
        <rect x="16" y="16" width="8" height="8" rx="1" />
        <path d="M16 3V8M24 3V8M16 32V37M24 32V37M3 16H8M3 24H8M32 16H37M32 24H37" />
      </svg>
    );
  }

  if (type === 'zap') {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M23 3L9 22H19L17 37L31 16H21L23 3Z" />
      </svg>
    );
  }

  if (type === 'settings') {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M20 13A7 7 0 1 0 20 27A7 7 0 0 0 20 13Z" />
        <path d="M31 21.5V18.5L35 15.5L31 8.5L26.2 10.5L23.5 9L22.8 4H14.8L14.1 9L11.4 10.5L6.6 8.5L2.6 15.5L6.6 18.5V21.5L2.6 24.5L6.6 31.5L11.4 29.5L14.1 31L14.8 36H22.8L23.5 31L26.2 29.5L31 31.5L35 24.5L31 21.5Z" />
      </svg>
    );
  }

  if (type === 'layers') {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M20 5L35 13L20 21L5 13L20 5Z" />
        <path d="M5 21L20 29L35 21" />
        <path d="M5 28L20 36L35 28" />
      </svg>
    );
  }

  if (type === 'help') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="16" />
        <path d="M19 19A5 5 0 0 1 24 15A5 5 0 0 1 29 20C29 24 24 24 24 28" />
        <path d="M24 34H24.1" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M8 9H17A5 5 0 0 1 22 14V32A5 5 0 0 0 17 27H8V9Z" />
      <path d="M32 9H23A5 5 0 0 0 18 14V32A5 5 0 0 1 23 27H32V9Z" />
    </svg>
  );
}

const learningPaths = [
  {
    icon: 'book',
    title: 'Panduan Pemula',
    text: 'Mengenal Arduflow, dasar Arduino, dan visual programming.',
  },
  {
    icon: 'code',
    title: 'Penggunaan IDE',
    text: 'Mengenal tampilan IDE, membuat Proyek, dan manajemen node.',
  },
  {
    icon: 'cpu',
    title: 'Dasar Hardware dan IoT',
    text: 'Belajar board, sensor, actuator, dan rangkaian dasar.',
  },
  {
    icon: 'zap',
    title: 'Contoh Proyek',
    text: 'Kumpulan Proyek praktis dan level Dasar hingga Lanjut.',
  },
];

const recommendedFlow = [
  'Level 1 - Pemula',
  'Level 2 - Dasar IDE',
  'Level 3 - Dasar Hardware',
  'Level 4 - Proyek Terarah',
  'Level 5 - Proyek Lanjutan',
];

const starterMaterials = [
  { title: 'Apa itu Arduflow?', meta: '8 menit - Gratis', visual: 'arduino', image: apaItuArduflowImage },
  { title: 'Kenapa Belajar IoT dengan Visual', meta: '8 menit - Gratis', visual: 'iot', image: belajarIotImage },
  { title: 'Cara Daftar untuk Mendapatkan Akun', meta: '8 menit - Gratis', visual: 'akun', image: daftarAkunImage },
  { title: 'Cara Mendapatkan Token IDE', meta: '8 menit - Gratis', visual: 'token', image: tokenIdeImage },
  { title: 'Cara Masuk ke Arduflow IDE', meta: '8 menit - Gratis', visual: 'ide', image: masukIdeImage },
  { title: 'Membuat Proyek Pertama', meta: '8 menit - Gratis', visual: 'project', image: projectPertamaImage },
];

const tutorialCategories = [
  { icon: 'book', title: 'Panduan Pemula', count: '24 Materi' },
  { icon: 'settings', title: 'Akses dan Akun', count: '18 Materi' },
  { icon: 'code', title: 'Tutorial Penggunaan IDE', count: '36 Materi' },
  { icon: 'cpu', title: 'Dasar Elektronika dan IoT', count: '29 Materi' },
  { icon: 'layers', title: 'Contoh Proyek IoT', count: '32 Materi' },
  { icon: 'help', title: 'FAQ dan Troubleshooting', count: '22 Materi' },
];

const materialFilters = [
  { title: 'Kategori', items: ['Semua Materi', 'Panduan Pemula', 'Akses dan Akun', 'Penggunaan IDE'] },
  { title: 'Level', items: ['Semua Materi', 'Panduan Pemula', 'Akses dan Akun'] },
  { title: 'Format', items: ['Semua Materi', 'Panduan Pemula', 'Akses dan Akun'] },
  { title: 'Akses', items: ['Semua Materi', 'Panduan Pemula', 'Akses dan Akun'] },
];

const allTutorials = [
  {
    category: 'Dasar Elektronika Arduino',
    title: 'Mengenal Board Arduino UNO',
    meta: '8 mnt - Pemula - Gratis',
    thumb: 'board',
    image: boardTutorialImage,
  },
  {
    category: 'Dasar Elektronika Arduino',
    title: 'Menghubungkan LED ke Arduino',
    meta: '7 mnt - Pemula - Gratis',
    thumb: 'led',
    image: ledTutorialImage,
  },
  {
    category: 'Dasar Elektronika Arduino',
    title: 'Menggunakan Sensor DHT22',
    meta: '10 mnt - Dasar - Butuh Token',
    thumb: 'sensor',
    image: dhtTutorialImage,
  },
  {
    category: 'Contoh Proyek IoT',
    title: 'Kontrol Relay dengan Arduflow',
    meta: '12 mnt - Dasar - Butuh Token',
    thumb: 'relay',
    image: relayTutorialImage,
  },
  {
    category: 'FAQ dan Troubleshooting',
    title: 'Troubleshooting: Board Tidak Terdeteksi',
    meta: '6 mnt - Semua Level - Gratis',
    thumb: 'trouble',
    image: troubleshootingTutorialImage,
  },
];

export function Tutorial() {
  return (
    <>
      <section className="tutorial-learning-hero" aria-labelledby="tutorial-learning-title">
        <div className="tutorial-learning-copy">
          <p className="tutorial-learning-eyebrow">Pusat Belajar Arduflow</p>
          <h1 id="tutorial-learning-title">
            <span>Belajar</span>
            <span>Arduflow</span>
            <span>Dari Dasar</span>
          </h1>
          <p>
            Pelajari dasar IoT, penggunaan Arduflow IDE, dan pembuatan proyek melalui panduan
            yang tersusun seperti workshop modern.
          </p>
          <form className="tutorial-search" role="search">
            <label htmlFor="tutorial-search-input">Cari materi tutorial</label>
            <input
              id="tutorial-search-input"
              type="search"
              placeholder="Cari tutorial, proyek, atau panduan..."
            />
          </form>
          <div className="tutorial-learning-actions">
            <a className="tutorial-primary-action" href="#materi-tutorial">
              Mulai Belajar
            </a>
            <a className="tutorial-secondary-action" href="#materi-tutorial">
              Lihat Semua Materi
            </a>
          </div>
        </div>
        <div className="tutorial-device-scene">
          <img src={tutorialDevice} alt="Rangkaian IoT Arduflow di breadboard" />
        </div>
      </section>
      <section
        className="tutorial-path-section"
        id="pilih-jalur-belajar"
        aria-labelledby="tutorial-path-title"
      >
        <div className="tutorial-path-inner">
          <div className="tutorial-path-heading">
            <h2 id="tutorial-path-title">Pilih Jalur Belajarmu</h2>
            <p>Mulai dari materi yang sesuai dengan pengetahuan dan tujuan belajarmu.</p>
          </div>

          <div className="tutorial-path-cards">
            {learningPaths.map((path, index) => (
              <article className="tutorial-path-card" key={path.title}>
                <div className={`tutorial-path-icon ${path.icon}-icon`}>
                  <TutorialIcon type={path.icon} />
                </div>
                <h3>{path.title}</h3>
                <p>{path.text}</p>
                <a
                  href={
                    index === 0
                      ? '/tutorial/panduan-pemula'
                      : index === 1
                        ? '/tutorial/penggunaan-ide'
                        : index === 2
                          ? '/tutorial/dasar-hardware-iot'
                          : '#materi-tutorial'
                  }
                >
                  Pelajari
                </a>
              </article>
            ))}
          </div>

          <div className="tutorial-flow-heading">
            <h2>Alur Belajar yang Disarankan</h2>
            <p>
              Ikuti langkah bertahap untuk memahami Arduflow dari dasar hingga membuat Proyek
              lanjutan.
            </p>
          </div>

          <div className="tutorial-flow" aria-label="Alur belajar yang disarankan">
            {recommendedFlow.map((step, index) => (
              <div className="tutorial-flow-step" key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>

          {/* <a className="tutorial-flow-button" href="#materi-tutorial">Lihat Jalur Lengkap</a> */}
        </div>
      </section>
      <section className="tutorial-material-section" id="materi-tutorial">
        <div className="tutorial-material-inner">
          <div className="tutorial-material-heading">
            <div>
              <h2>Mulai Dari Materi Ini</h2>
              <p>Rekomendasi materi penting untuk memulai belajar Arduflow.</p>
            </div>
            <a href="#materi-tutorial">Lihat Semua Tutorial &gt;</a>
          </div>

          <div className="starter-material-grid">
            {starterMaterials.map((material) => (
              <article className="starter-material-card" key={material.title}>
                <div className={`starter-material-visual ${material.visual}`}>
                  <img src={material.image} alt="" />
                  <span />
                </div>
                <div className="starter-material-content">
                  <h3>{material.title}</h3>
                  <p>{material.meta}</p>
                  <a href="#materi-tutorial">Pelajari</a>
                </div>
              </article>
            ))}
          </div>

          <div className="tutorial-category-heading">
            <h2>Jelajahi Berdasarkan Kategori</h2>
            <p>Temukan materi sesuai kebutuhanmu.</p>
          </div>

          <div className="tutorial-category-grid">
            {tutorialCategories.map((category) => (
              <article className="tutorial-category-card" key={category.title}>
                <div className={`tutorial-category-icon ${category.icon}-icon`}>
                  <TutorialIcon type={category.icon} />
                </div>
                <div className="tutorial-category-label">
                  <h3>{category.title}</h3>
                  <p>{category.count}</p>
                </div>
                <a href="#materi-tutorial">Pelajari</a>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="all-tutorial-section" aria-labelledby="all-tutorial-title">
        <div className="all-tutorial-inner">
          <h2 id="all-tutorial-title">Semua Materi Tutorial</h2>

          <div className="all-tutorial-controls" aria-label="Kontrol tampilan materi">
            <button type="button">Urutkan: Terbaru</button>
            <button type="button" aria-label="Tampilan grid">▦</button>
            <button type="button" aria-label="Tampilan list">≡</button>
          </div>

          <aside className="tutorial-filter-panel" aria-label="Filter materi tutorial">
            <h3>Filter Materi</h3>
            {materialFilters.map((group) => (
              <fieldset key={group.title}>
                <legend>{group.title}</legend>
                {group.items.map((item) => (
                  <label key={`${group.title}-${item}`}>
                    <input type="checkbox" />
                    <span>{item}</span>
                  </label>
                ))}
              </fieldset>
            ))}
          </aside>

          <div className="all-tutorial-list">
            {allTutorials.map((tutorial) => (
              <article className="all-tutorial-row" key={tutorial.title}>
                <div className={`all-tutorial-thumb ${tutorial.thumb}`}>
                  <img src={tutorial.image} alt="" />
                </div>
                <div className="all-tutorial-row-copy">
                  <p>{tutorial.category}</p>
                  <h3>{tutorial.title}</h3>
                  <span>{tutorial.meta}</span>
                </div>
                <a href="#materi-tutorial">Pelajari</a>
              </article>
            ))}
          </div>

          <button className="all-tutorial-load" type="button">Muat Lebih Banyak</button>
        </div>
      </section>
    </>
  );
}
