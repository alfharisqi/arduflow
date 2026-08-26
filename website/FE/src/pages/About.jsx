import { useState } from 'react';

const values = [
  {
    number: '01',
    label: 'TENTANG KDS',
    title: 'Divisi IT Development PT KAE',
    description:
      'KDS melakukan percepatan penetrasi dan transformasi digital di Indonesia untuk mendukung Industri 4.0 dan era IoT.',
    icon: 'technology',
  },
  {
    number: '02',
    label: 'TENTANG KAE',
    title: 'Innovative Technology',
    description:
      'PT Karya Abadi Electrindo bergerak di bidang Innovative Technology and Electrical Engineering berbasis Internet of Things.',
    icon: 'reliable',
  },
  {
    number: '03',
    label: 'KONTAK',
    title: '(+62) 895-3597-15003',
    description:
      'KDS dapat dihubungi untuk diskusi kebutuhan solusi digital, IoT, RFID, GPS tracking, ICT, lighting, dan safety.',
    icon: 'education',
  },
  {
    number: '04',
    label: 'ALAMAT',
    title: 'Jakarta Pusat',
    description:
      'Jl. M.H. Thamrin No.9, Menteng, Jakarta Pusat 10340.',
    icon: 'product',
  },
];

const missions = [
  {
    number: '01',
    title: 'Transformasi digital industri',
    description:
      'KDS mendukung perusahaan dalam membangun sistem digital yang dibutuhkan untuk operasional modern.',
  },
  {
    number: '02',
    title: 'Sistem pendukung Industri 4.0',
    description:
      'KDS menciptakan sistem yang diperlukan industri untuk memasuki era Internet of Things.',
  },
  {
    number: '03',
    title: 'Engineering berbasis IoT',
    description:
      'PT KAE mendukung Revolusi Industri di Indonesia melalui electrical engineering berbasis teknologi inovatif.',
  },
];

const audiences = [
  {
    icon: 'community',
    title: 'Telepon',
    description:
      '(+62) 895-3597-15003',
  },
  {
    icon: 'technology',
    title: 'Email',
    description:
      'hallo@karyaabadielectrindo.com',
  },
  {
    icon: 'reliable',
    title: 'Alamat',
    description:
      'Jl. M.H. Thamrin No.9, Menteng, Jakarta Pusat 10340.',
  },
  {
    icon: 'school',
    title: 'Website',
    description:
      'kds.karyaabadielectrindo.com',
  },
];

const capabilities = [
  { label: 'IOT Solutions', href: 'https://kds.karyaabadielectrindo.com/#iotsolutions' },
  { label: 'RFID System Solutions', href: 'https://kds.karyaabadielectrindo.com/#rfidsolutions' },
  { label: 'RFID Parking System', href: 'https://kds.karyaabadielectrindo.com/#rfidparking' },
  { label: 'RFID Visitor Pass Management System', href: 'https://kds.karyaabadielectrindo.com/#rfidvisitor' },
  { label: 'RFID Warehouse Assets Tracking', href: 'https://kds.karyaabadielectrindo.com/#rfidwarehouse' },
  { label: 'RFID & GPS Vehicle Live Tracking', href: 'https://kds.karyaabadielectrindo.com/#rfidvehicle' },
  { label: 'RFID OnBUS Ticket System', href: 'https://kds.karyaabadielectrindo.com/#rfidvehicle' },
  { label: 'KAE Lighting Solutions', href: 'https://kds.karyaabadielectrindo.com/#lightingolutions' },
  { label: 'KAE ICT Solutions', href: 'https://kds.karyaabadielectrindo.com/#ictsolutions' },
  { label: 'KAE Safety Solutions', href: 'https://kds.karyaabadielectrindo.com/#safetysolutions' },
];

function Icon({ type, size = 28 }) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  switch (type) {
    case 'technology':
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <rect x="8" y="8" width="8" height="8" rx="1" />
          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
        </svg>
      );

    case 'reliable':
      return (
        <svg {...commonProps}>
          <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />
          <path d="m9 12 2 2 4-5" />
        </svg>
      );

    case 'education':
      return (
        <svg {...commonProps}>
          <path d="m3 10 9-5 9 5-9 5-9-5Z" />
          <path d="M7 12v4c3 2 7 2 10 0v-4" />
        </svg>
      );

    case 'product':
      return (
        <svg {...commonProps}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 9h4M7 13h2M15 10l2 2-2 2" />
        </svg>
      );

    case 'student':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6" />
        </svg>
      );

    case 'teacher':
      return (
        <svg {...commonProps}>
          <circle cx="9" cy="7" r="3" />
          <path d="M3 21v-2c0-3 2-5 6-5 3 0 5 1 6 3" />
          <path d="M16 3h5v9h-5M18 7h1" />
        </svg>
      );

    case 'school':
      return (
        <svg {...commonProps}>
          <path d="M3 21h18M5 21V9l7-5 7 5v12" />
          <path d="M9 21v-6h6v6M9 11h.01M15 11h.01" />
        </svg>
      );

    case 'community':
      return (
        <svg {...commonProps}>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="10" r="2" />
          <path d="M3 21v-2c0-3 2-5 6-5s6 2 6 5v2M15 15c3 0 5 1.5 5 4v2" />
        </svg>
      );

    case 'arrow':
      return (
        <svg {...commonProps}>
          <path d="M5 12h14M14 7l5 5-5 5" />
        </svg>
      );

    case 'check':
      return (
        <svg {...commonProps}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    default:
      return null;
  }
}

function KdsVisual() {
  return (
    <div className="about-visual">
      <div className="about-grid-bg" />

      <div className="about-board">
        <div className="board-header">
          <div>
            <span className="board-dot red" />
            <span className="board-dot yellow" />
            <span className="board-dot green" />
          </div>

          <span>KDS Monitoring System</span>
        </div>

        <div className="board-canvas">
          <div className="visual-node node-input">
            <span className="node-type">RFID</span>
            <strong>Asset Tag</strong>
            <small>Warehouse</small>
            <span className="node-port right" />
          </div>

          <div className="visual-line line-one" />

          <div className="visual-node node-logic">
            <span className="node-port left" />
            <span className="node-type">IOT</span>
            <strong>Gateway</strong>
            <small>Live Data</small>
            <span className="node-port right" />
          </div>

          <div className="visual-line line-two" />

          <div className="visual-node node-output">
            <span className="node-port left" />
            <span className="node-type">DASHBOARD</span>
            <strong>Monitoring</strong>
            <small>Real-time</small>
          </div>

          <div className="board-code">
            <span>RFID / GPS / IoT</span>
            <strong>Industrial System Online</strong>
            <span className="status-online">● Ready</span>
          </div>
        </div>
      </div>

      <div className="visual-badge badge-iot">
        <span className="badge-icon">
          <Icon type="technology" size={19} />
        </span>
        <div>
          <small>Solutions</small>
          <strong>Digital & IoT</strong>
        </div>
      </div>

      <div className="visual-badge badge-code">
        <span className="badge-code-symbol">RFID</span>
        <div>
          <small>System</small>
          <strong>Tracking & Monitoring</strong>
        </div>
      </div>
    </div>
  );
}

export function About() {
  const [activeMission, setActiveMission] = useState(0);

  const goTo = (path) => {
    window.location.href = path;
  };

  return (
    <>
      <main className="about-page">
        {/* HERO */}
        <section className="about-hero">
          <div className="about-glow glow-one" />
          <div className="about-glow glow-two" />

          <div className="about-container about-hero-grid">
            <div className="about-hero-content">
              <div className="about-eyebrow">
                <span />
                TENTANG KDS
              </div>

              <h1>
                Divisi IT Development
                <span> PT Karya Abadi Electrindo.</span>
              </h1>

              <p>
                Karya Abadi Digital Solutions (KDS) merupakan divisi IT
                Development dari PT KAE untuk melakukan percepatan penetrasi
                dan transformasi Digital di Indonesia.
              </p>

              <div className="about-hero-actions">
                <button
                  type="button"
                  className="about-button primary"
                  onClick={() => {
                    document.getElementById('our-story')?.scrollIntoView({
                      behavior: 'smooth',
                    });
                  }}
                >
                  Kenali KDS
                  <Icon type="arrow" size={18} />
                </button>

                <button
                  type="button"
                  className="about-button secondary"
                  onClick={() => window.open('https://wa.me/62895359715003', '_blank')}
                >
                  Hubungi KDS
                </button>
              </div>

              <div className="hero-mini-info">
                <div>
                  <strong>KDS</strong>
                  <span>IT Development</span>
                </div>

                <i />

                <div>
                  <strong>KAE</strong>
                  <span>Electrical Engineering</span>
                </div>

                <i />

                <div>
                  <strong>IoT</strong>
                  <span>Industry 4.0</span>
                </div>
              </div>
            </div>

            <KdsVisual />
          </div>
        </section>

        {/* VALUES */}
        <section className="about-values">
          <div className="about-container">
            <div className="value-grid">
              {values.map((item) => (
                <article className="value-card" key={item.number}>
                  <div className="value-top">
                    <div className="value-icon">
                      <Icon type={item.icon} />
                    </div>

                    <span className="value-number">{item.number}</span>
                  </div>

                  <span className="value-label">{item.label}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* STORY */}
        <section className="about-story" id="our-story">
          <div className="about-container story-grid">
            <div className="story-visual">
              <div className="story-card-main">
                <span className="story-code">&lt;/&gt;</span>

                <div>
                  <small>TENTANG KDS</small>
                  <strong>
                    IT Development
                    <br />
                    PT KAE
                  </strong>
                </div>
              </div>

              <div className="story-floating-card">
                <span>KDS</span>
                <p>
                  Digital.
                  <br />
                  IoT.
                  <br />
                  Industry 4.0.
                </p>
              </div>

              <div className="story-dots" />
            </div>

            <div className="story-content">
              <div className="section-eyebrow">SIAPA KAMI?</div>

              <h2>
                KDS mempercepat transformasi
                <span> digital di Indonesia.</span>
              </h2>

              <p className="story-lead">
                Karya Abadi Digital Solutions (KDS) merupakan divisi IT
                Development dari PT KAE untuk melakukan percepatan penetrasi
                dan transformasi Digital di Indonesia.
              </p>

              <p>
                KDS telah banyak menciptakan sistem yang diperlukan pada
                industri untuk mendukung terciptanya Industri 4.0 atau era
                Internet of Things.
              </p>

              <p>
                Fokus KDS berada pada pengembangan sistem digital, IoT, RFID,
                tracking, ICT, lighting, safety, serta solusi teknologi yang
                mendukung kebutuhan operasional perusahaan.
              </p>

              <div className="story-highlight">
                <span>“</span>
                <p>
                  Your Comfort is Our Priority.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM / SOLUTION */}
        <section className="about-solution">
          <div className="about-container">
            <div className="section-heading center">
              <div className="section-eyebrow">KDS & KAE</div>
              <h2>
                Dua fokus teknologi
                <span> dalam satu ekosistem.</span>
              </h2>
              <p>
                KDS berperan sebagai divisi IT Development, sedangkan PT KAE
                bergerak di bidang Innovative Technology and Electrical
                Engineering berbasis Internet of Things.
              </p>
            </div>

            <div className="solution-flow">
              <article className="problem-card">
                <span className="solution-tag">TENTANG KDS</span>
                <h3>Karya Abadi Digital Solutions</h3>

                <div className="problem-list">
                  <div>
                    <span>•</span>
                    Divisi IT Development dari PT KAE
                  </div>
                  <div>
                    <span>•</span>
                    Percepatan penetrasi dan transformasi Digital
                  </div>
                  <div>
                    <span>•</span>
                    Pengembangan sistem untuk industri
                  </div>
                  <div>
                    <span>•</span>
                    Mendukung Industri 4.0 dan era IoT
                  </div>
                </div>
              </article>

              <div className="solution-arrow">
                <Icon type="arrow" size={27} />
              </div>

              <article className="answer-card">
                <span className="solution-tag">TENTANG KAE</span>
                <h3>PT Karya Abadi Electrindo</h3>

                <div className="answer-list">
                  {[
                    'Innovative Technology',
                    'Electrical Engineering',
                    'Berbasis Internet of Things',
                    'Mendukung Revolusi Industri di Indonesia',
                  ].map((text) => (
                    <div key={text}>
                      <span>
                        <Icon type="check" size={15} />
                      </span>
                      {text}
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="about-how">
          <div className="about-container">
            <div className="section-heading">
              <div className="section-eyebrow">RINGKASAN</div>
              <h2>
                Informasi utama
                <span> perusahaan.</span>
              </h2>
            </div>

            <div className="workflow-wrapper">
              <div className="workflow-card">
                <span className="workflow-number">01</span>
                <span className="workflow-category">KDS</span>
                <h3>IT Development</h3>
                <p>
                  Divisi PT KAE yang berfokus pada transformasi digital di
                  Indonesia.
                </p>
              </div>

              <div className="workflow-connector">
                <span />
              </div>

              <div className="workflow-card">
                <span className="workflow-number">02</span>
                <span className="workflow-category">KAE</span>
                <h3>Electrical Engineering</h3>
                <p>
                  Perusahaan berbasis Innovative Technology and Electrical
                  Engineering.
                </p>
              </div>

              <div className="workflow-connector">
                <span />
              </div>

              <div className="workflow-card">
                <span className="workflow-number">03</span>
                <span className="workflow-category">IOT</span>
                <h3>Industry 4.0</h3>
                <p>
                  KDS menciptakan sistem pendukung industri untuk era Internet
                  of Things.
                </p>
              </div>

              <div className="workflow-connector">
                <span />
              </div>

              <div className="workflow-card">
                <span className="workflow-number">04</span>
                <span className="workflow-category">CONTACT</span>
                <h3>Hubungi Kami</h3>
                <p>
                  (+62) 895-3597-15003 dan
                  hallo@karyaabadielectrindo.com.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* VISION MISSION */}
        <section className="vision-section">
          <div className="about-container vision-grid">
            <div className="vision-intro">
              <div className="section-eyebrow light">VISI & MISI</div>

              <h2>
                Innovative Technology and
                <span> Electrical Engineering.</span>
              </h2>

              <p>
                PT Karya Abadi Electrindo (KAE) adalah perusahaan yang bergerak
                di bidang Innovative Technology and Electrical Engineering yang
                berbasiskan Internet of Things.
              </p>

              <div className="vision-box">
                <span>VISI KAMI</span>
                <strong>
                  Mendukung tercapainya Revolusi Industri di Indonesia melalui
                  teknologi inovatif dan solusi engineering berbasis IoT.
                </strong>
              </div>
            </div>

            <div className="mission-list">
              {missions.map((mission, index) => (
                <button
                  type="button"
                  key={mission.number}
                  className={`mission-card ${
                    activeMission === index ? 'active' : ''
                  }`}
                  onMouseEnter={() => setActiveMission(index)}
                  onFocus={() => setActiveMission(index)}
                >
                  <span className="mission-number">{mission.number}</span>

                  <div>
                    <h3>{mission.title}</h3>
                    <p>{mission.description}</p>
                  </div>

                  <span className="mission-arrow">↗</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* CAPABILITIES */}
        <section className="about-capability">
          <div className="about-container capability-grid">
            <div>
              <div className="section-eyebrow">FOKUS KAMI</div>
              <h2>
                Layanan KDS
                <span> dan KAE.</span>
              </h2>
            </div>

            <div className="capability-list">
              {capabilities.map((item, index) => (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  key={item.label}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{item.label}</strong>
                  <span className="capability-arrow">↗</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* AUDIENCE */}
        <section className="about-audience">
          <div className="about-container">
            <div className="section-heading center">
              <div className="section-eyebrow">KONTAK & LOKASI</div>

              <h2>
                Hubungi Karya Abadi
                <span> Digital Solutions.</span>
              </h2>

              <p>
                Silahkan bicarakan dengan kami tentang permasalahan atau
                keinginan yang akan anda wujudkan mengenai solusi digital
                perusahaan anda.
              </p>
            </div>

            <div className="audience-grid">
              {audiences.map((item) => (
                <article className="audience-card" key={item.title}>
                  <div className="audience-icon">
                    <Icon type={item.icon} size={30} />
                  </div>

                  <h3>{item.title}</h3>
                  <p>{item.description}</p>

                  <span className="audience-line" />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* COMPANY */}
        <section className="company-section">
          <div className="about-container company-card">
            <div className="company-decoration">
              <span>KDS</span>
            </div>

            <div className="company-copy">
              <div className="section-eyebrow light">EKOSISTEM TEKNOLOGI</div>

              <h2>Tentang KDS dan PT KAE</h2>

              <p>
                KDS merupakan divisi IT Development dari PT KAE untuk
                melakukan percepatan penetrasi dan transformasi Digital di
                Indonesia. PT KAE bergerak di bidang Innovative Technology and
                Electrical Engineering berbasis Internet of Things.
              </p>

              <div className="company-tags">
                <span>(+62) 895-3597-15003</span>
                <span>hallo@karyaabadielectrindo.com</span>
                <span>Jl. M.H. Thamrin No.9</span>
                <span>Menteng, Jakarta Pusat 10340</span>
              </div>

              <a
                href="https://kds.karyaabadielectrindo.com/"
                target="_blank"
                rel="noreferrer"
                className="company-link"
              >
                Kunjungi Website KDS
                <Icon type="arrow" size={17} />
              </a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="about-cta">
          <div className="about-container">
            <div className="cta-card">
              <div className="cta-grid" />
              <div className="cta-glow" />

              <div className="cta-content">
                <span>HUBUNGI KDS</span>

                <h2>
                  Diskusikan kebutuhan transformasi digital perusahaan Anda.
                </h2>

                <p>
                  KDS siap membantu kebutuhan sistem digital, IoT, RFID,
                  tracking, lighting, ICT, safety, dan solusi teknologi
                  berbasis engineering.
                </p>

                <div className="cta-buttons">
                  <button
                    type="button"
                    onClick={() => window.open('https://wa.me/62895359715003', '_blank')}
                    className="about-button cta-primary"
                  >
                    Hubungi KDS
                    <Icon type="arrow" size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => window.open('https://kds.karyaabadielectrindo.com/', '_blank')}
                    className="about-button cta-secondary"
                  >
                    Lihat Website
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .about-page {
          --navy: #030b1e;
          --navy-soft: #06172c;
          --blue: #00a8ff;
          --cyan: #00a2ff;
          --orange: #ff6a00;
          --text: #f6f8fc;
          --muted: #9bacbf;
          --border: #17324f;

          background: var(--navy);
          color: var(--text);
          overflow: hidden;
          font-family: "Rajdhani", Arial, Helvetica, sans-serif;
        }

        .about-container {
          width: min(1120px, calc(100% - 48px));
          margin: 0 auto;
        }

        .about-hero {
          position: relative;
          min-height: 680px;
          display: flex;
          align-items: center;
          background:
            radial-gradient(
              94.74% 149.33% at 80% 20%,
              rgba(0, 162, 255, 0.3) 6.23%,
              rgba(0, 162, 255, 0) 40%
            ),
            radial-gradient(
              94.74% 149.33% at 20% 80%,
              rgba(255, 106, 0, 0.4) 0%,
              rgba(255, 106, 0, 0) 40%
            ),
            var(--navy);
          overflow: hidden;
        }

        .about-hero::after {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0.12;
          background-image:
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 50px 50px;
          mask-image: linear-gradient(to right, transparent, black);
          pointer-events: none;
        }

        .about-hero-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1fr 0.95fr;
          gap: 56px;
          align-items: center;
          padding: 96px 0 82px;
        }

        .about-eyebrow,
        .section-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 2px;
          color: var(--blue);
          text-transform: uppercase;
        }

        .about-eyebrow {
          color: var(--blue);
        }

        .about-eyebrow span {
          width: 28px;
          height: 2px;
          background: var(--orange);
        }

        .about-hero h1 {
          max-width: 630px;
          margin: 20px 0 22px;
          color: #fff;
          font-family: "Rajdhani", Arial, Helvetica, sans-serif;
          font-size: clamp(46px, 5.5vw, 72px);
          font-weight: 700;
          line-height: 1.02;
          letter-spacing: 0;
        }

        .about-hero h1 span,
        .section-heading h2 span,
        .story-content h2 span,
        .capability-grid h2 span,
        .vision-intro h2 span {
          color: var(--orange);
        }

        .about-hero-content > p {
          max-width: 590px;
          color: var(--muted);
          font-size: 17px;
          font-weight: 600;
          line-height: 1.8;
        }

        .about-hero-actions,
        .cta-buttons {
          display: flex;
          gap: 12px;
          margin-top: 34px;
        }

        .about-button {
          min-height: 50px;
          border-radius: 6px;
          padding: 0 23px;
          border: 0;
          display: inline-flex;
          gap: 10px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-family: "Rajdhani", Arial, Helvetica, sans-serif;
          font-weight: 700;
          font-size: 14px;
          text-transform: uppercase;
          transition: .25s ease;
          white-space: nowrap;
        }

        .about-button.primary {
          background:
            radial-gradient(
              100% 100% at 50% 0%,
              rgba(255, 255, 255, 0.3) 0%,
              rgba(255, 255, 255, 0) 100%
            ),
            var(--orange);
          color: white;
          box-shadow: 0 4px 8px -2px rgba(255, 98, 65, 0.48);
        }

        .about-button.secondary {
          border: 1px solid rgba(255, 106, 0, 0.42);
          color: var(--orange);
          background: radial-gradient(
            100% 100% at 50% 0%,
            rgba(255, 106, 0, 0.3) 0%,
            rgba(255, 106, 0, 0) 100%
          );
        }

        .about-button:hover {
          transform: translateY(-2px);
        }

        .hero-mini-info {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 45px;
          color: white;
        }

        .hero-mini-info div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hero-mini-info strong {
          font-size: 14px;
        }

        .hero-mini-info span {
          color: var(--muted);
          font-size: 11px;
        }

        .hero-mini-info i {
          width: 1px;
          height: 31px;
          background: rgba(255,255,255,.15);
        }

        /* Visual IDE */
        .about-visual {
          position: relative;
          min-height: 470px;
        }

        .about-grid-bg {
          position: absolute;
          width: 480px;
          height: 480px;
          right: -30px;
          top: -20px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(19,178,229,.16), transparent 65%);
        }

        .about-board {
          position: absolute;
          width: min(570px, 100%);
          right: 0;
          top: 40px;
          border: 1px solid rgba(0, 168, 255, .24);
          border-radius: 6px;
          background: rgba(5, 19, 43, .93);
          box-shadow: 0 30px 100px rgba(0,0,0,.4);
          overflow: hidden;
          transform: perspective(1200px) rotateY(-4deg) rotateX(1deg);
        }

        .board-header {
          height: 43px;
          border-bottom: 1px solid rgba(255,255,255,.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          color: #7690ae;
          font-size: 11px;
        }

        .board-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          margin-right: 6px;
        }

        .board-dot.red { background: #ed6a5e; }
        .board-dot.yellow { background: #f5bf4f; }
        .board-dot.green { background: #61c454; }

        .board-canvas {
          height: 350px;
          position: relative;
          background-image:
            radial-gradient(rgba(120,163,199,.17) 1px, transparent 1px);
          background-size: 17px 17px;
        }

        .visual-node {
          position: absolute;
          width: 128px;
          border-radius: 6px;
          padding: 11px 12px;
          border: 1px solid rgba(255,255,255,.12);
          box-shadow: 0 12px 20px rgba(0,0,0,.25);
          color: white;
        }

        .visual-node strong,
        .visual-node small {
          display: block;
        }

        .visual-node strong {
          font-size: 12px;
          margin: 5px 0 2px;
        }

        .visual-node small {
          color: #8395ad;
          font-size: 9px;
        }

        .node-type {
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .node-input {
          left: 30px;
          top: 120px;
          background: #07314a;
          border-top: 3px solid var(--blue);
        }

        .node-logic {
          left: 210px;
          top: 70px;
          background: #292143;
          border-top: 3px solid #8c72e9;
        }

        .node-output {
          right: 25px;
          top: 150px;
          background: #3b241d;
          border-top: 3px solid var(--orange);
        }

        .node-port {
          position: absolute;
          width: 8px;
          height: 8px;
          border: 2px solid #92dcf7;
          border-radius: 50%;
          background: #081931;
          top: 50%;
          transform: translateY(-50%);
        }

        .node-port.right { right: -5px; }
        .node-port.left { left: -5px; }

        .visual-line {
          height: 1px;
          position: absolute;
          background: linear-gradient(90deg, var(--blue), var(--orange));
          transform-origin: left;
        }

        .line-one {
          width: 72px;
          left: 158px;
          top: 153px;
          transform: rotate(-31deg);
        }

        .line-two {
          width: 87px;
          left: 338px;
          top: 113px;
          transform: rotate(36deg);
        }

        .board-code {
          position: absolute;
          left: 25px;
          right: 25px;
          bottom: 18px;
          height: 50px;
          display: flex;
          align-items: center;
          padding: 0 14px;
          gap: 13px;
          background: rgba(1,8,20,.8);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 8px;
          color: #7589a8;
          font-size: 9px;
        }

        .board-code strong {
          color: white;
          flex: 1;
          font-size: 10px;
        }

        .status-online {
          color: #57d77d;
        }

        .visual-badge {
          position: absolute;
          z-index: 3;
          padding: 11px 15px;
          border-radius: 6px;
          background: #101c34;
          border: 1px solid rgba(0, 168, 255, .24);
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
          box-shadow: 0 15px 40px rgba(0,0,0,.3);
        }

        .visual-badge small,
        .visual-badge strong {
          display: block;
        }

        .visual-badge small {
          color: #6f86a5;
          font-size: 9px;
        }

        .visual-badge strong {
          margin-top: 2px;
          font-size: 11px;
          color: #fff;
        }

        .badge-iot {
          left: -18px;
          top: 24px;
        }

        .badge-code {
          right: -16px;
          bottom: 16px;
        }

        .badge-icon,
        .badge-code-symbol {
          width: 33px;
          height: 33px;
          border-radius: 7px;
          display: grid;
          place-items: center;
          background: rgba(0, 168, 255, .12);
          color: var(--blue);
        }

        .badge-code-symbol {
          color: #ff9b57;
          background: rgba(255, 106, 0, .12);
          font-size: 12px;
          font-weight: 800;
        }

        /* Value */
        .about-values {
          position: relative;
          margin-top: -1px;
          background: var(--navy);
        }

        .value-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .value-card {
          min-height: 265px;
          padding: 32px 28px;
          border: 1px solid var(--border);
          border-radius: 0;
          transition: .25s;
          background: #1d293d;
          border-top: 5px solid var(--orange);
        }

        .value-card:hover {
          background: #24344e;
          transform: translateY(-4px);
        }

        .value-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 26px;
        }

        .value-icon {
          width: 44px;
          height: 44px;
          border-radius: 6px;
          background: rgba(255, 106, 0, .1);
          display: grid;
          place-items: center;
          color: var(--orange);
        }

        .value-number {
          color: #637895;
          font-size: 11px;
          font-weight: 700;
        }

        .value-label {
          color: var(--blue);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .value-card h3 {
          margin: 7px 0 10px;
          font-size: 18px;
          color: var(--orange);
        }

        .value-card p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.7;
        }

        /* Story */
        .about-story {
          padding: 110px 0;
          background:
            radial-gradient(84.44% 133.1% at -6.74% 53.32%, rgba(255, 106, 0, 0.22) 0%, rgba(255, 106, 0, 0) 32.6%),
            var(--navy);
        }

        .story-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 72px;
          align-items: center;
        }

        .story-visual {
          min-height: 450px;
          position: relative;
          background:
            linear-gradient(135deg, rgba(0,168,255,.12), rgba(255,106,0,.06));
          border: 1px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
        }

        .story-card-main {
          position: absolute;
          left: 60px;
          top: 80px;
          width: 330px;
          height: 260px;
          padding: 35px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #05142c;
          color: white;
          border-radius: 6px;
          box-shadow: 0 30px 60px rgba(6,22,48,.23);
        }

        .story-code {
          color: var(--orange);
          font-size: 38px;
          font-weight: 800;
        }

        .story-card-main small {
          display: block;
          color: #7187a6;
          font-size: 9px;
          letter-spacing: 1.4px;
          margin-bottom: 9px;
        }

        .story-card-main strong {
          font-size: 23px;
          line-height: 1.3;
        }

        .story-floating-card {
          position: absolute;
          right: 28px;
          bottom: 42px;
          width: 160px;
          padding: 22px;
          border-radius: 6px;
          background: var(--orange);
          color: white;
          box-shadow: 0 20px 40px rgba(19,170,222,.25);
        }

        .story-floating-card > span {
          font-weight: 900;
          font-size: 27px;
        }

        .story-floating-card p {
          margin: 15px 0 0;
          font-size: 12px;
          line-height: 1.8;
          color: #e4faff;
        }

        .story-content h2,
        .section-heading h2,
        .capability-grid h2,
        .vision-intro h2 {
          margin: 14px 0 22px;
          font-size: clamp(34px, 4vw, 50px);
          line-height: 1.08;
          letter-spacing: 0;
        }

        .story-content h2 span,
        .capability-grid h2 span {
          display: block;
          color: var(--orange);
        }

        .story-content > p {
          color: var(--muted);
          font-size: 14px;
          font-weight: 600;
          line-height: 1.85;
        }

        .story-content .story-lead {
          color: var(--text);
          font-size: 16px;
        }

        .story-highlight {
          margin-top: 28px;
          padding: 19px 22px;
          display: flex;
          gap: 15px;
          background: #101c34;
          border-left: 3px solid var(--orange);
        }

        .story-highlight > span {
          color: var(--orange);
          font-size: 33px;
          line-height: 1;
        }

        .story-highlight p {
          margin: 0;
          color: var(--text);
          font-weight: 700;
          line-height: 1.6;
        }

        /* General heading */
        .section-heading {
          max-width: 650px;
          margin-bottom: 60px;
        }

        .section-heading.center {
          text-align: center;
          margin-left: auto;
          margin-right: auto;
        }

        .section-heading.center .section-eyebrow {
          justify-content: center;
        }

        .section-heading > p {
          color: var(--muted);
          line-height: 1.7;
        }

        .section-heading h2 span {
          color: var(--orange);
        }

        /* solution */
        .about-solution {
          padding: 96px 0;
          background: var(--navy-soft);
        }

        .solution-flow {
          max-width: 950px;
          margin: auto;
          display: grid;
          grid-template-columns: 1fr 70px 1fr;
          align-items: center;
          gap: 0;
        }

        .problem-card,
        .answer-card {
          min-height: 320px;
          padding: 34px;
          background: #101c34;
          border: 1px solid var(--border);
          border-radius: 6px;
        }

        .problem-card {
          background: #101c34;
        }

        .answer-card {
          color: white;
          background: #1d293d;
          border-top: 5px solid var(--orange);
          box-shadow: 0 25px 50px rgba(4,24,51,.17);
        }

        .solution-tag {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: var(--blue);
        }

        .answer-card .solution-tag {
          color: var(--orange);
        }

        .problem-card h3,
        .answer-card h3 {
          margin: 10px 0 28px;
          font-size: 21px;
          color: var(--text);
        }

        .problem-list,
        .answer-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .problem-list div,
        .answer-list div {
          display: flex;
          gap: 11px;
          align-items: center;
          font-size: 13px;
        }

        .problem-list span {
          width: 23px;
          height: 23px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(255, 106, 0, .12);
          color: var(--orange);
        }

        .answer-list div {
          color: var(--muted);
        }

        .answer-list span {
          width: 23px;
          height: 23px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(0,168,255,.14);
          color: var(--blue);
        }

        .solution-arrow {
          width: 48px;
          height: 48px;
          margin: auto;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: white;
          background: var(--orange);
          z-index: 3;
        }

        /* How */
        .about-how {
          padding: 104px 0;
          background: var(--navy);
        }

        .workflow-wrapper {
          display: grid;
          grid-template-columns: 1fr 45px 1fr 45px 1fr 45px 1fr;
          align-items: center;
        }

        .workflow-card {
          min-height: 220px;
          padding: 26px;
          border: 1px solid var(--border);
          border-radius: 0;
          position: relative;
          transition: .25s;
          background: #1d293d;
          border-top: 5px solid var(--blue);
        }

        .workflow-card:hover {
          border-color: var(--blue);
          box-shadow: 0 14px 32px rgba(0, 168, 255, .12);
        }

        .workflow-number {
          position: absolute;
          right: 21px;
          top: 19px;
          color: #637895;
          font-weight: 800;
          font-size: 12px;
        }

        .workflow-category {
          color: var(--orange);
          font-size: 9px;
          letter-spacing: 1.5px;
          font-weight: 800;
        }

        .workflow-card h3 {
          margin: 40px 0 11px;
          font-size: 19px;
          color: var(--text);
        }

        .workflow-card p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .workflow-connector span {
          display: block;
          height: 1px;
          background: var(--border);
          position: relative;
        }

        .workflow-connector span::after {
          content: "";
          position: absolute;
          right: -1px;
          top: -3px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--orange);
        }

        /* vision */
        .vision-section {
          padding: 104px 0;
          color: white;
          background:
            radial-gradient(94.74% 149.33% at 80% 20%, rgba(0, 162, 255, 0.24) 6.23%, rgba(0, 162, 255, 0) 40%),
            var(--navy);
        }

        .vision-grid {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 76px;
        }

        .section-eyebrow.light {
          color: var(--blue);
        }

        .vision-intro h2 span {
          color: var(--orange);
        }

        .vision-intro > p {
          color: #889ab3;
          line-height: 1.8;
        }

        .vision-box {
          margin-top: 42px;
          padding: 25px;
          border: 1px solid rgba(73,200,238,.2);
          border-radius: 6px;
          background: #101c34;
          border-top: 5px solid var(--orange);
        }

        .vision-box span {
          color: var(--blue);
          display: block;
          font-size: 9px;
          letter-spacing: 1.5px;
          font-weight: 800;
          margin-bottom: 10px;
        }

        .vision-box strong {
          font-size: 14px;
          line-height: 1.7;
        }

        .mission-list {
          display: flex;
          flex-direction: column;
        }

        .mission-card {
          width: 100%;
          text-align: left;
          display: grid;
          grid-template-columns: 55px 1fr 30px;
          gap: 17px;
          padding: 25px 16px;
          border: 0;
          border-bottom: 1px solid rgba(255,255,255,.1);
          color: white;
          background: transparent;
          cursor: pointer;
          transition: .2s;
        }

        .mission-card.active {
          box-shadow: inset 3px 0 0 #2ac7f1;
          background: rgba(21,174,221,.07);
        }

        .mission-number {
          color: var(--orange);
          font-size: 11px;
          font-weight: 800;
        }

        .mission-card h3 {
          margin: 0 0 7px;
          font-size: 17px;
        }

        .mission-card p {
          margin: 0;
          color: #7d90aa;
          font-size: 12px;
          line-height: 1.7;
        }

        .mission-arrow {
          color: var(--orange);
        }

        /* Capability */
        .about-capability {
          padding: 104px 0;
          background: var(--navy-soft);
        }

        .capability-grid {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 76px;
        }

        .capability-list > a {
          display: grid;
          grid-template-columns: 60px 1fr 30px;
          align-items: center;
          min-height: 70px;
          border-bottom: 1px solid var(--border);
          color: inherit;
          text-decoration: none;
        }

        .capability-list > a > span:first-child {
          color: #637895;
          font-size: 10px;
          font-weight: 700;
        }

        .capability-list strong {
          font-size: 16px;
          color: var(--text);
        }

        .capability-arrow {
          color: var(--orange);
        }

        /* audience */
        .about-audience {
          padding: 96px 0;
          background: var(--navy);
        }

        .audience-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .audience-card {
          min-height: 238px;
          position: relative;
          padding: 28px;
          background: #1d293d;
          border: 1px solid var(--border);
          border-radius: 0;
          border-top: 5px solid var(--orange);
          overflow: hidden;
          transition: .25s;
        }

        .audience-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 40px rgba(0,0,0,.18);
        }

        .audience-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 6px;
          color: var(--orange);
          background: rgba(255, 106, 0, .1);
        }

        .audience-card h3 {
          margin: 30px 0 11px;
          color: var(--text);
        }

        .audience-card p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .audience-line {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 3px;
          background: var(--blue);
          transition: .25s;
        }

        .audience-card:hover .audience-line {
          width: 100%;
        }

        /* Company */
        .company-section {
          padding: 96px 0;
          background: var(--navy-soft);
        }

        .company-card {
          min-height: 360px;
          display: grid;
          grid-template-columns: .7fr 1.3fr;
          color: white;
          background:
            radial-gradient(circle at 10% 50%, rgba(24,188,231,.19), transparent 28%),
            #041126;
          border: 1px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
        }

        .company-decoration {
          display: grid;
          place-items: center;
          border-right: 1px solid rgba(255,255,255,.08);
          position: relative;
          overflow: hidden;
        }

        .company-decoration::after {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          border: 1px solid rgba(54,206,244,.16);
          transform: rotate(45deg);
        }

        .company-decoration span {
          position: relative;
          z-index: 2;
          font-size: 72px;
          font-weight: 900;
          letter-spacing: 0;
          color: var(--orange);
        }

        .company-copy {
          padding: 56px;
        }

        .company-copy h2 {
          margin: 13px 0 17px;
          font-size: clamp(30px, 3.3vw, 38px);
          line-height: 1.15;
        }

        .company-copy > p {
          max-width: 650px;
          color: #91a2ba;
          font-size: 14px;
          line-height: 1.85;
        }

        .company-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 25px 0;
        }

        .company-tags span {
          border: 1px solid rgba(255, 106, 0, .3);
          background: rgba(255, 106, 0, .08);
          border-radius: 6px;
          padding: 8px 13px;
          color: var(--orange);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .company-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--orange);
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        /* CTA */
        .about-cta {
          padding: 8px 0 104px;
          background: var(--navy-soft);
        }

        .cta-card {
          min-height: 390px;
          position: relative;
          border: 1px solid var(--border);
          border-radius: 6px;
          display: grid;
          place-items: center;
          overflow: hidden;
          text-align: center;
          background:
            radial-gradient(circle at 50% 120%, rgba(18,194,234,.24), transparent 42%),
            var(--navy);
        }

        .cta-grid {
          position: absolute;
          inset: 0;
          opacity: .09;
          background-image:
            linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .cta-glow {
          position: absolute;
          width: 260px;
          height: 260px;
          left: 50%;
          bottom: -150px;
          transform: translateX(-50%);
          border-radius: 50%;
          background: rgba(34, 188, 233, .22);
          filter: blur(18px);
        }

        .cta-content {
          position: relative;
          z-index: 2;
          max-width: 750px;
          padding: 60px 30px;
        }

        .cta-content > span {
          color: var(--blue);
          font-size: 10px;
          letter-spacing: 1.8px;
          font-weight: 800;
        }

        .cta-content h2 {
          margin: 15px 0;
          color: white;
          font-size: clamp(32px, 4vw, 47px);
          line-height: 1.14;
          letter-spacing: 0;
        }

        .cta-content p {
          max-width: 600px;
          margin: auto;
          color: #8b9db5;
          line-height: 1.7;
        }

        .cta-buttons {
          justify-content: center;
        }

        .cta-primary {
          background:
            radial-gradient(
              100% 100% at 50% 0%,
              rgba(255, 255, 255, 0.3) 0%,
              rgba(255, 255, 255, 0) 100%
            ),
            var(--orange);
          color: white;
        }

        .cta-secondary {
          color: white;
          border: 1px solid rgba(255,255,255,.2);
          background: rgba(255,255,255,.05);
        }

        @media (max-width: 1024px) {
          .about-hero-grid,
          .story-grid,
          .vision-grid,
          .capability-grid {
            gap: 55px;
          }

          .value-grid,
          .audience-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .workflow-wrapper {
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }

          .workflow-connector {
            display: none;
          }

          .about-visual {
            min-height: 430px;
            transform: scale(.92);
            transform-origin: center right;
          }
        }

        @media (max-width: 800px) {
          .about-container {
            width: min(100% - 32px, 1120px);
          }

          .about-hero-grid,
          .story-grid,
          .vision-grid,
          .capability-grid,
          .company-card {
            grid-template-columns: 1fr;
          }

          .about-hero-grid {
            padding: 82px 0 70px;
          }

          .about-hero h1 {
            letter-spacing: 0;
          }

          .about-visual {
            min-height: 430px;
            transform: none;
          }

          .story-grid,
          .vision-grid,
          .capability-grid {
            gap: 50px;
          }

          .solution-flow {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .solution-arrow {
            transform: rotate(90deg);
          }

          .company-decoration {
            min-height: 200px;
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,.08);
          }

          .company-copy {
            padding: 40px 30px;
          }
        }

        @media (max-width: 580px) {
          .about-hero {
            min-height: auto;
          }

          .about-hero h1 {
            font-size: 40px;
            line-height: 1.08;
          }

          .about-hero-actions,
          .cta-buttons {
            flex-direction: column;
          }

          .about-button {
            width: 100%;
          }

          .hero-mini-info {
            gap: 12px;
            justify-content: space-between;
          }

          .hero-mini-info i {
            display: none;
          }

          .value-grid,
          .audience-grid,
          .workflow-wrapper {
            grid-template-columns: 1fr;
          }

          .about-values .about-container {
            width: min(100% - 32px, 1120px);
          }

          .value-card {
            min-height: auto;
          }

          .about-board {
            position: relative;
            top: 0;
            right: auto;
            width: 100%;
            transform: none;
          }

          .board-canvas {
            height: 430px;
          }

          .visual-node {
            left: 24px;
            right: auto;
            width: calc(100% - 48px);
          }

          .node-input {
            top: 34px;
          }

          .node-logic {
            top: 134px;
          }

          .node-output {
            top: 234px;
          }

          .visual-line {
            display: none;
          }

          .board-code {
            left: 24px;
            right: 24px;
            bottom: 24px;
            height: auto;
            min-height: 58px;
            align-items: flex-start;
            flex-direction: column;
            justify-content: center;
            gap: 4px;
          }

          .visual-badge {
            position: relative;
            width: 100%;
            margin-top: 12px;
            left: auto;
            right: auto;
            top: auto;
            bottom: auto;
          }

          .story-card-main {
            position: relative;
            left: auto;
            top: auto;
            width: 100%;
            height: auto;
            min-height: 220px;
          }

          .story-floating-card {
            position: relative;
            right: auto;
            bottom: auto;
            width: 100%;
            margin-top: 14px;
          }

          .story-visual {
            min-height: auto;
            padding: 18px;
          }

          .about-story,
          .about-solution,
          .about-how,
          .vision-section,
          .about-capability,
          .about-audience,
          .company-section {
            padding: 72px 0;
          }

          .mission-card {
            grid-template-columns: 35px 1fr 20px;
          }

          .company-copy h2 {
            font-size: 30px;
          }

          .badge-iot {
            left: auto;
          }

          .badge-code {
            right: auto;
          }
        }
      `}</style>
    </>
  );
}

export default About;
