import { Hero } from '../components/Hero.jsx';

const whatIsCards = [
  {
    icon: 'book',
    title: 'Learn IoT Easily',
    text: 'Belajar IoT tanpa harus merasa kewalahan dengan baris kode yang rumit.',
  },
  {
    icon: 'layers',
    title: 'Visual Blocks',
    text: 'Susun logika program menggunakan blok visual atau node yang intuitif.',
  },
  {
    icon: 'settings',
    title: 'Compatible',
    text: 'Cocok untuk berbagai tipe Arduino, sensor, aktuator, dan proyek pemula.',
  },
  {
    icon: 'users',
    title: 'Collaborative',
    text: 'Dapat digunakan di kelas, workshop, komunitas, atau belajar mandiri.',
  },
];

const visualSteps = [
  {
    visual: 'components',
    title: 'Pilih Komponen',
    text: 'Pilih sensor atau output yang akan digunakan.',
  },
  {
    visual: 'flow',
    title: 'Susun Alur Program',
    text: 'Hubungkan blok untuk mengatur alur kerja',
  },
  {
    visual: 'upload',
    title: 'Upload ke Board',
    text: 'Kirim program ke hardware anda',
  },
  {
    visual: 'config',
    title: 'Konfigurasi Input/Output',
    text: 'Atur parameter pin pada setiap komponen',
  },
];

const problemRows = [
  [
    {
      icon: 'zap',
      text: 'Coding Arduino terasa sulit bagi pemula yang baru memulai.',
    },
    {
      icon: 'help',
      text: 'Sensor dan aktuator yang banyak bisa membingungkan koneksinya.',
    },
    {
      icon: 'graduation',
      text: 'Guru membutuhkan media mengajar yang lebih interaktif dan mudah.',
    },
  ],
  [
    {
      icon: 'workflow',
      text: 'Workshop IoT membutuhkan alur pembelajaran yang praktis dan cepat.',
    },
    {
      icon: 'check',
      text: 'Siswa membutuhkan contoh proyek yang jelas untuk referensi.',
    },
    {
      icon: 'layers',
      text: 'Keterbatasan waktu dalam mempelajari dasar bahasa pemrograman C++.',
    },
  ],
];

const benefitRows = [
  [
    'Visual programming untuk memahami logika program dengan cepat.',
    'Mendukung pembelajaran berbasis proyek yang menantang.',
  ],
  [
    'Membuat workshop IoT menjadi lebih terstruktur dan efektif.',
    'Membantu pengguna membuat prototype sederhana dengan cepat.',
  ],
  [
    'Cocok untuk pemula, siswa, guru, dan seluruh komunitas.',
    'Menyediakan learning path dari tingkat dasar hingga mahir.',
  ],
];

const ideAccessSteps = [
  {
    icon: 'file',
    step: 'Step 1',
    label: 'Daftar Melalui Formulir',
  },
  {
    icon: 'layers',
    step: 'Step 2',
    label: 'Pilih Program atau Paket Akses',
  },
  {
    icon: 'zap',
    step: 'Step 3',
    label: 'Lakukan Pembayaran / Konfirmasi',
  },
  {
    icon: 'message',
    step: 'Step 4',
    label: 'Terima Token dari Admin',
  },
  {
    icon: 'monitor',
    step: 'Step 5',
    label: 'Login ke Arduflow IDE',
  },
];

const programItems = [
  {
    icon: 'graduation',
    title: 'IoT Workshop untuk Sekolah',
  },
  {
    icon: 'user',
    title: 'Teacher Training Program',
  },
  {
    icon: 'users',
    title: 'Community Workshop',
  },
  {
    icon: 'book',
    title: 'Beginner Arduino Class',
  },
  {
    icon: 'monitor',
    title: 'Campus Program',
  },
  {
    icon: 'message',
    title: 'Private Class',
  },
  {
    icon: 'settings',
    title: 'Corporate Training',
  },
  {
    icon: 'cpu',
    title: 'Custom IoT Solutions',
  },
];

function WhatIsIcon({ type }) {
  const common = {
    width: '24',
    height: '24',
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  };

  if (type === 'layers') {
    return (
      <svg {...common}>
        <path d="M12 3L3 8L12 13L21 8L12 3Z" />
        <path d="M3 12L12 17L21 12" />
        <path d="M3 16L12 21L21 16" />
      </svg>
    );
  }

  if (type === 'settings') {
    return (
      <svg {...common}>
        <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 0 0 12 8.5Z" />
        <path d="M19.4 15A1.65 1.65 0 0 0 19.73 16.82L19.79 16.88A2 2 0 1 1 16.96 19.71L16.9 19.65A1.65 1.65 0 0 0 15.08 19.32A1.65 1.65 0 0 0 14.08 20.83V21A2 2 0 1 1 10.08 21V20.91A1.65 1.65 0 0 0 9 19.4A1.65 1.65 0 0 0 7.18 19.73L7.12 19.79A2 2 0 1 1 4.29 16.96L4.35 16.9A1.65 1.65 0 0 0 4.68 15.08A1.65 1.65 0 0 0 3.17 14.08H3A2 2 0 1 1 3 10.08H3.09A1.65 1.65 0 0 0 4.6 9A1.65 1.65 0 0 0 4.27 7.18L4.21 7.12A2 2 0 1 1 7.04 4.29L7.1 4.35A1.65 1.65 0 0 0 8.92 4.68H9A1.65 1.65 0 0 0 10 3.17V3A2 2 0 1 1 14 3V3.09A1.65 1.65 0 0 0 15 4.6A1.65 1.65 0 0 0 16.82 4.27L16.88 4.21A2 2 0 1 1 19.71 7.04L19.65 7.1A1.65 1.65 0 0 0 19.32 8.92V9A1.65 1.65 0 0 0 20.83 10H21A2 2 0 1 1 21 14H20.91A1.65 1.65 0 0 0 19.4 15Z" />
      </svg>
    );
  }

  if (type === 'users') {
    return (
      <svg {...common}>
        <path d="M17 21V19A4 4 0 0 0 13 15H5A4 4 0 0 0 1 19V21" />
        <path d="M9 11A4 4 0 1 0 9 3A4 4 0 0 0 9 11Z" />
        <path d="M23 21V19A4 4 0 0 0 20 15.13" />
        <path d="M16 3.13A4 4 0 0 1 16 10.87" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M2 4.5A3.5 3.5 0 0 1 5.5 3H11V21H5.5A3.5 3.5 0 0 0 2 22.5V4.5Z" />
      <path d="M22 4.5A3.5 3.5 0 0 0 18.5 3H13V21H18.5A3.5 3.5 0 0 1 22 22.5V4.5Z" />
    </svg>
  );
}

function ProblemIcon({ type }) {
  const common = {
    width: '24',
    height: '24',
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  };

  if (type === 'help') {
    return (
      <svg {...common}>
        <path d="M12 22A10 10 0 1 0 12 2A10 10 0 0 0 12 22Z" />
        <path d="M9.1 9A3 3 0 1 1 14.9 10.2C14.1 11.4 12 11.8 12 14" />
        <path d="M12 17H12.01" />
      </svg>
    );
  }

  if (type === 'graduation') {
    return (
      <svg {...common}>
        <path d="M22 10L12 5L2 10L12 15L22 10Z" />
        <path d="M6 12.5V17C9.8 19 14.2 19 18 17V12.5" />
        <path d="M22 10V16" />
      </svg>
    );
  }

  if (type === 'workflow') {
    return (
      <svg {...common}>
        <path d="M6 6H10V10H6V6Z" />
        <path d="M14 14H18V18H14V14Z" />
        <path d="M10 8H12A4 4 0 0 1 16 12V14" />
        <path d="M6 10V12A4 4 0 0 0 10 16H14" />
      </svg>
    );
  }

  if (type === 'check') {
    return (
      <svg {...common}>
        <path d="M12 22A10 10 0 1 0 12 2A10 10 0 0 0 12 22Z" />
        <path d="M8 12L11 15L16 9" />
      </svg>
    );
  }

  if (type === 'layers') {
    return (
      <svg {...common}>
        <path d="M12 3L3 8L12 13L21 8L12 3Z" />
        <path d="M3 12L12 17L21 12" />
        <path d="M3 16L12 21L21 16" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M13 2L4 14H11L10 22L20 9H13L13 2Z" />
    </svg>
  );
}

function BenefitCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 14.5A6.5 6.5 0 1 0 8 1.5A6.5 6.5 0 0 0 8 14.5Z" />
      <path d="M5.35 8.1L7.2 9.95L10.8 6.35" />
    </svg>
  );
}

function IdeAccessIcon({ type }) {
  const common = {
    width: '32',
    height: '32',
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  };

  if (type === 'layers') {
    return (
      <svg {...common}>
        <path d="M12 3L3 8L12 13L21 8L12 3Z" />
        <path d="M3 12L12 17L21 12" />
        <path d="M3 16L12 21L21 16" />
      </svg>
    );
  }

  if (type === 'zap') {
    return (
      <svg {...common}>
        <path d="M13 2L4 14H11L10 22L20 9H13L13 2Z" />
      </svg>
    );
  }

  if (type === 'message') {
    return (
      <svg {...common}>
        <path d="M21 15A4 4 0 0 1 17 19H7L3 23V7A4 4 0 0 1 7 3H17A4 4 0 0 1 21 7V15Z" />
      </svg>
    );
  }

  if (type === 'monitor') {
    return (
      <svg {...common}>
        <path d="M3 4H21V16H3V4Z" />
        <path d="M8 21H16" />
        <path d="M12 16V21" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M14 2H6A2 2 0 0 0 4 4V20A2 2 0 0 0 6 22H18A2 2 0 0 0 20 20V8L14 2Z" />
      <path d="M14 2V8H20" />
      <path d="M8 13H16" />
      <path d="M8 17H16" />
      <path d="M8 9H10" />
    </svg>
  );
}

function ProgramIcon({ type }) {
  const common = {
    width: '40',
    height: '40',
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
  };

  if (type === 'graduation') {
    return (
      <svg {...common}>
        <path d="M22 10L12 5L2 10L12 15L22 10Z" />
        <path d="M6 12.5V17C9.8 19 14.2 19 18 17V12.5" />
        <path d="M22 10V16" />
      </svg>
    );
  }

  if (type === 'user') {
    return (
      <svg {...common}>
        <path d="M20 21V19A4 4 0 0 0 16 15H8A4 4 0 0 0 4 19V21" />
        <path d="M12 11A4 4 0 1 0 12 3A4 4 0 0 0 12 11Z" />
      </svg>
    );
  }

  if (type === 'users') {
    return (
      <svg {...common}>
        <path d="M17 21V19A4 4 0 0 0 13 15H5A4 4 0 0 0 1 19V21" />
        <path d="M9 11A4 4 0 1 0 9 3A4 4 0 0 0 9 11Z" />
        <path d="M23 21V19A4 4 0 0 0 20 15.13" />
        <path d="M16 3.13A4 4 0 0 1 16 10.87" />
      </svg>
    );
  }

  if (type === 'book') {
    return (
      <svg {...common}>
        <path d="M2 4.5A3.5 3.5 0 0 1 5.5 3H11V21H5.5A3.5 3.5 0 0 0 2 22.5V4.5Z" />
        <path d="M22 4.5A3.5 3.5 0 0 0 18.5 3H13V21H18.5A3.5 3.5 0 0 1 22 22.5V4.5Z" />
      </svg>
    );
  }

  if (type === 'monitor') {
    return (
      <svg {...common}>
        <path d="M3 4H21V16H3V4Z" />
        <path d="M8 21H16" />
        <path d="M12 16V21" />
      </svg>
    );
  }

  if (type === 'message') {
    return (
      <svg {...common}>
        <path d="M21 15A4 4 0 0 1 17 19H7L3 23V7A4 4 0 0 1 7 3H17A4 4 0 0 1 21 7V15Z" />
      </svg>
    );
  }

  if (type === 'settings') {
    return (
      <svg {...common}>
        <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 0 0 12 8.5Z" />
        <path d="M19.4 15A1.65 1.65 0 0 0 19.73 16.82L19.79 16.88A2 2 0 1 1 16.96 19.71L16.9 19.65A1.65 1.65 0 0 0 15.08 19.32A1.65 1.65 0 0 0 14.08 20.83V21A2 2 0 1 1 10.08 21V20.91A1.65 1.65 0 0 0 9 19.4A1.65 1.65 0 0 0 7.18 19.73L7.12 19.79A2 2 0 1 1 4.29 16.96L4.35 16.9A1.65 1.65 0 0 0 4.68 15.08A1.65 1.65 0 0 0 3.17 14.08H3A2 2 0 1 1 3 10.08H3.09A1.65 1.65 0 0 0 4.6 9A1.65 1.65 0 0 0 4.27 7.18L4.21 7.12A2 2 0 1 1 7.04 4.29L7.1 4.35A1.65 1.65 0 0 0 8.92 4.68H9A1.65 1.65 0 0 0 10 3.17V3A2 2 0 1 1 14 3V3.09A1.65 1.65 0 0 0 15 4.6A1.65 1.65 0 0 0 16.82 4.27L16.88 4.21A2 2 0 1 1 19.71 7.04L19.65 7.1A1.65 1.65 0 0 0 19.32 8.92V9A1.65 1.65 0 0 0 20.83 10H21A2 2 0 1 1 21 14H20.91A1.65 1.65 0 0 0 19.4 15Z" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M8 8H16V16H8V8Z" />
      <path d="M4 4H20V20H4V4Z" />
      <path d="M9 1V4" />
      <path d="M15 1V4" />
      <path d="M9 20V23" />
      <path d="M15 20V23" />
      <path d="M20 9H23" />
      <path d="M20 15H23" />
      <path d="M1 9H4" />
      <path d="M1 15H4" />
    </svg>
  );
}

function VisualStepPreview({ type }) {
  return (
    <div className={`visual-preview ${type}`}>
      <div className="visual-sidebar">
        <span>Search nodes...</span>
        <strong>HARDWARE I/O</strong>
        <i>Digital Out</i>
        <i>Digital In</i>
        <i>PWM / Analog Out</i>
        <i>Servo Motor</i>
        <i>Analog In</i>
      </div>
      <div className="visual-canvas">
        <div className="vp-node input-node">BOOLEAN <b>HIGH</b></div>
        <div className="vp-node output-node">LIGHT BULB</div>
        <div className="vp-node small-node">SQUARE WAVE</div>
        <div className="vp-node pin-node">DIGITAL OUT</div>
        <div className="vp-wire one" />
        <div className="vp-wire two" />
      </div>
    </div>
  );
}

export function Home() {
  return (
    <>
      <Hero />
      <section className="what-section">
        <div className="what-inner">
          <div className="what-copy">
            <h2>Apa Itu Arduflow</h2>
            <p>
              Arduflow adalah platform edukasi IoT yang menggabungkan IDE visual, materi pembelajaran,
              proyek contoh, dan program pelatihan untuk membantu siapa saja belajar Arduino dan IoT
              dengan lebih mudah.
            </p>
          </div>
          <div className="what-cards">
            {whatIsCards.map((card) => (
              <article className="what-card" key={card.title}>
                <div className="what-icon">
                  <WhatIsIcon type={card.icon} />
                </div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="visual-work-section">
        <div className="visual-work-inner">
          <h2>Cara Kerja Visual Programming</h2>
          <div className="visual-work-cards">
            <span className="flow-line line-one" />
            <span className="flow-line line-two" />
            <span className="flow-line line-three" />
            {visualSteps.map((step) => (
              <article className={`visual-work-card ${step.visual}`} key={step.title}>
                <VisualStepPreview type={step.visual} />
                <div className="visual-work-label">
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </article>
            ))}
          </div>
          <a className="project-link-button" href="/project">
            Lihat Contoh Proyek
            <span aria-hidden="true">&gt;</span>
          </a>
        </div>
      </section>
      <section className="problems-section">
        <div className="problems-inner">
          <h2>Masalah yang Diselesaikan</h2>
          <div className="problem-row problem-row-top">
            {problemRows[0].map((problem) => (
              <article className="problem-item" key={problem.text}>
                <div className="problem-icon">
                  <ProblemIcon type={problem.icon} />
                </div>
                <p>{problem.text}</p>
              </article>
            ))}
          </div>
          <div className="problem-row problem-row-bottom">
            {problemRows[1].map((problem) => (
              <article className="problem-item" key={problem.text}>
                <div className="problem-icon">
                  <ProblemIcon type={problem.icon} />
                </div>
                <p>{problem.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="benefits-section">
        <div className="benefits-inner">
          <h2>Manfaat Arduflow</h2>
          {benefitRows.map((row, rowIndex) => (
            <div className={`benefit-row benefit-row-${rowIndex + 1}`} key={row.join('-')}>
              {row.map((benefit) => (
                <article className="benefit-card" key={benefit}>
                  <div className="benefit-icon">
                    <BenefitCheckIcon />
                  </div>
                  <p>{benefit}</p>
                </article>
              ))}
            </div>
          ))}
        </div>
      </section>
      <section className="ide-access-section">
        <div className="ide-access-inner">
          <h2>Cara Mendapatkan Akses IDE</h2>
          <div className="ide-access-steps">
            {ideAccessSteps.map((item) => (
              <article className="ide-access-step" key={item.step}>
                <div className="ide-access-icon">
                  <IdeAccessIcon type={item.icon} />
                </div>
                <div className="ide-access-label">
                  <strong>{item.step}</strong>
                  <p>{item.label}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="ide-access-actions">
            <a className="ide-token-button" href="/akses">Daftar untuk Mendapatkan Token</a>
            <p>
              Sudah punya token? <a href="/ide">Masuk ke IDE</a>
            </p>
          </div>
        </div>
      </section>
      <section className="program-section">
        <div className="program-inner">
          <h2>Program / Workshop</h2>
          <div className="program-grid">
            {programItems.map((program) => (
              <article className="program-card" key={program.title}>
                <div className="program-icon">
                  <ProgramIcon type={program.icon} />
                </div>
                <h3>{program.title}</h3>
              </article>
            ))}
          </div>
          <div className="program-actions">
            <a className="program-primary" href="/workshop">Daftar Workshop</a>
            <a className="program-secondary" href="/kontak">Ajukan Kerja Sama</a>
          </div>
        </div>
      </section>
    </>
  );
}
