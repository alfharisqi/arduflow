import { useState } from 'react';

const values = [
  {
    number: '01',
    label: 'TECHNOLOGY',
    title: 'Innovative Technology',
    description:
      'Terus melakukan inovasi dan mengikuti perkembangan teknologi agar solusi pembelajaran IoT tetap relevan dengan kebutuhan masa kini.',
    icon: 'technology',
  },
  {
    number: '02',
    label: 'RELIABLE',
    title: 'Highly Dedicated',
    description:
      'Dikembangkan dengan pengalaman di bidang Internet of Things, microcontroller, dan solusi digital untuk menghadirkan pengalaman belajar yang dapat diandalkan.',
    icon: 'reliable',
  },
  {
    number: '03',
    label: 'PROFESSIONAL',
    title: 'Educational Experience',
    description:
      'Menghadirkan pembelajaran IoT yang terstruktur, praktis, dan lebih mudah dipahami oleh pelajar, pengajar, maupun pemula.',
    icon: 'education',
  },
  {
    number: '04',
    label: 'PRODUCT',
    title: 'Reliable Platform',
    description:
      'ArduFlow dirancang sebagai platform pembelajaran yang menghubungkan visual programming dengan perangkat IoT nyata.',
    icon: 'product',
  },
];

const missions = [
  {
    number: '01',
    title: 'Mempermudah pembelajaran IoT',
    description:
      'Membantu pengguna memahami konsep IoT, microcontroller, sensor, actuator, dan logika pemrograman dengan pendekatan yang lebih visual.',
  },
  {
    number: '02',
    title: 'Menciptakan pengalaman belajar yang praktis',
    description:
      'Menghubungkan materi pembelajaran dengan praktik dan project sehingga pengguna tidak hanya memahami teori.',
  },
  {
    number: '03',
    title: 'Terus berinovasi',
    description:
      'Mengembangkan ArduFlow mengikuti perkembangan teknologi agar tetap relevan untuk pendidikan dan kebutuhan industri.',
  },
];

const audiences = [
  {
    icon: 'student',
    title: 'Pelajar',
    description:
      'Belajar IoT dari dasar tanpa harus langsung menghadapi kompleksitas pemrograman.',
  },
  {
    icon: 'teacher',
    title: 'Guru & Pengajar',
    description:
      'Mendukung proses mengajar IoT melalui visual programming dan pembelajaran berbasis project.',
  },
  {
    icon: 'school',
    title: 'Sekolah',
    description:
      'Membantu sekolah mengembangkan kegiatan praktikum dan pembelajaran teknologi IoT.',
  },
  {
    icon: 'community',
    title: 'Komunitas',
    description:
      'Media belajar, workshop, eksperimen, dan kolaborasi project berbasis IoT.',
  },
];

const capabilities = [
  'Visual Programming',
  'Arduino & Microcontroller',
  'Internet of Things',
  'Sensor & Actuator',
  'Project-Based Learning',
  'Workshop & Training',
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

function ArduFlowVisual() {
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

          <span>ArduFlow IDE</span>
        </div>

        <div className="board-canvas">
          <div className="visual-node node-input">
            <span className="node-type">INPUT</span>
            <strong>DHT Sensor</strong>
            <small>Temperature</small>
            <span className="node-port right" />
          </div>

          <div className="visual-line line-one" />

          <div className="visual-node node-logic">
            <span className="node-port left" />
            <span className="node-type">LOGIC</span>
            <strong>Compare</strong>
            <small>Temp &gt; 30°C</small>
            <span className="node-port right" />
          </div>

          <div className="visual-line line-two" />

          <div className="visual-node node-output">
            <span className="node-port left" />
            <span className="node-type">OUTPUT</span>
            <strong>Digital Write</strong>
            <small>LED • ON</small>
          </div>

          <div className="board-code">
            <span>Arduino / ESP32</span>
            <strong>Code Generated</strong>
            <span className="status-online">● Ready</span>
          </div>
        </div>
      </div>

      <div className="visual-badge badge-iot">
        <span className="badge-icon">
          <Icon type="technology" size={19} />
        </span>
        <div>
          <small>Learning</small>
          <strong>Internet of Things</strong>
        </div>
      </div>

      <div className="visual-badge badge-code">
        <span className="badge-code-symbol">&lt;/&gt;</span>
        <div>
          <small>Generate</small>
          <strong>Arduino Code</strong>
        </div>
      </div>
    </div>
  );
}

export function Partner() {
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
                TENTANG ARDUFLOW
              </div>

              <h1>
                Membuat IoT Lebih
                <span> Mudah Dipelajari.</span>
              </h1>

              <p>
                ArduFlow adalah platform edukasi IoT berbasis visual
                programming yang membantu pelajar, pengajar, dan pemula
                memahami teknologi IoT melalui cara belajar yang lebih visual,
                praktis, dan terstruktur.
              </p>

              <div className="about-hero-actions">
                <button
                  type="button"
                  className="about-button primary"
                  onClick={() => {
                    document
                      .getElementById('our-story')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Kenali ArduFlow
                  <Icon type="arrow" size={18} />
                </button>

                <button
                  type="button"
                  className="about-button secondary"
                  onClick={() => goTo('/workshop')}
                >
                  Lihat Workshop
                </button>
              </div>

              <div className="hero-mini-info">
                <div>
                  <strong>Visual</strong>
                  <span>Programming</span>
                </div>

                <i />

                <div>
                  <strong>IoT</strong>
                  <span>Education</span>
                </div>

                <i />

                <div>
                  <strong>Project</strong>
                  <span>Based Learning</span>
                </div>
              </div>
            </div>

            <ArduFlowVisual />
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
                  <small>DARI IDE MENJADI PROJECT</small>
                  <strong>
                    Visual Programming
                    <br />
                    untuk IoT
                  </strong>
                </div>
              </div>

              <div className="story-floating-card">
                <span>IoT</span>
                <p>
                  Belajar.
                  <br />
                  Eksperimen.
                  <br />
                  Berkarya.
                </p>
              </div>

              <div className="story-dots" />
            </div>

            <div className="story-content">
              <div className="section-eyebrow">SIAPA KAMI?</div>

              <h2>
                Teknologi seharusnya
                <span> mudah dipahami.</span>
              </h2>

              <p className="story-lead">
                ArduFlow hadir untuk membuat proses belajar Internet of Things
                menjadi lebih sederhana bagi pengguna yang baru memasuki dunia
                Arduino, microcontroller, sensor, dan automation.
              </p>

              <p>
                ArduFlow mengadaptasi pendekatan visual programming sehingga
                pengguna dapat membangun alur logika melalui node, memahami
                hubungan input dan output, kemudian menerapkannya pada
                perangkat IoT nyata.
              </p>

              <p>
                Platform ini tumbuh dari semangat pengembangan teknologi
                digital dan IoT untuk mendukung pembelajaran yang lebih dekat
                dengan kebutuhan dunia industri.
              </p>

              <div className="story-highlight">
                <span>“</span>
                <p>
                  Dari menyusun logika secara visual hingga mengendalikan
                  perangkat nyata.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM / SOLUTION */}
        <section className="about-solution">
          <div className="about-container">
            <div className="section-heading center">
              <div className="section-eyebrow">MENGAPA ARDUFLOW?</div>
              <h2>
                Dari kompleks menjadi
                <span> lebih sederhana.</span>
              </h2>
              <p>
                Kami ingin mengurangi hambatan awal dalam belajar IoT tanpa
                menghilangkan pemahaman terhadap konsep dasarnya.
              </p>
            </div>

            <div className="solution-flow">
              <article className="problem-card">
                <span className="solution-tag">TANTANGAN</span>
                <h3>Belajar IoT secara konvensional</h3>

                <div className="problem-list">
                  <div>
                    <span>×</span>
                    Bingung memulai pemrograman
                  </div>
                  <div>
                    <span>×</span>
                    Sulit memahami pin dan hardware
                  </div>
                  <div>
                    <span>×</span>
                    Logika program terasa kompleks
                  </div>
                  <div>
                    <span>×</span>
                    Teori sulit dihubungkan dengan praktik
                  </div>
                </div>
              </article>

              <div className="solution-arrow">
                <Icon type="arrow" size={27} />
              </div>

              <article className="answer-card">
                <span className="solution-tag">ARDUFLOW</span>
                <h3>Pembelajaran yang lebih visual</h3>

                <div className="answer-list">
                  {[
                    'Visual programming berbasis node',
                    'Alur logika lebih mudah dipahami',
                    'Terhubung dengan Arduino & IoT',
                    'Belajar melalui project nyata',
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
              <div className="section-eyebrow">CARA BELAJAR</div>
              <h2>
                Belajar dengan cara
                <span> melihat alurnya.</span>
              </h2>
            </div>

            <div className="workflow-wrapper">
              <div className="workflow-card">
                <span className="workflow-number">01</span>
                <span className="workflow-category">INPUT</span>
                <h3>Pilih Node</h3>
                <p>
                  Gunakan node sensor, input, output, logic, dan komponen
                  lainnya.
                </p>
              </div>

              <div className="workflow-connector">
                <span />
              </div>

              <div className="workflow-card">
                <span className="workflow-number">02</span>
                <span className="workflow-category">LOGIC</span>
                <h3>Susun Logika</h3>
                <p>
                  Hubungkan node untuk membentuk alur program secara visual.
                </p>
              </div>

              <div className="workflow-connector">
                <span />
              </div>

              <div className="workflow-card">
                <span className="workflow-number">03</span>
                <span className="workflow-category">GENERATE</span>
                <h3>Generate Code</h3>
                <p>
                  ArduFlow menerjemahkan alur visual menjadi kode
                  microcontroller.
                </p>
              </div>

              <div className="workflow-connector">
                <span />
              </div>

              <div className="workflow-card">
                <span className="workflow-number">04</span>
                <span className="workflow-category">PROJECT</span>
                <h3>Jalankan Project</h3>
                <p>
                  Implementasikan hasilnya pada Arduino, ESP32, sensor, dan
                  actuator.
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
                Membangun generasi yang lebih dekat dengan
                <span> teknologi IoT.</span>
              </h2>

              <p>
                Kami ingin menghadirkan media pembelajaran teknologi yang terus
                berkembang dan membantu lebih banyak orang memahami serta
                menciptakan solusi berbasis Internet of Things.
              </p>

              <div className="vision-box">
                <span>VISI KAMI</span>
                <strong>
                  Menjadi platform pembelajaran IoT yang mudah digunakan,
                  inovatif, dan relevan dengan perkembangan teknologi.
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
                Menghubungkan pendidikan dengan
                <span> teknologi nyata.</span>
              </h2>
            </div>

            <div className="capability-list">
              {capabilities.map((item, index) => (
                <div key={item}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{item}</strong>
                  <span className="capability-arrow">↗</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AUDIENCE */}
        <section className="about-audience">
          <div className="about-container">
            <div className="section-heading center">
              <div className="section-eyebrow">ARDUFLOW UNTUK SIAPA?</div>

              <h2>
                Teknologi yang bisa dipelajari
                <span> siapa saja.</span>
              </h2>

              <p>
                ArduFlow dikembangkan untuk mendukung pembelajaran IoT dalam
                berbagai lingkungan pendidikan dan komunitas.
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

        {/* KDS / COMPANY */}
        <section className="company-section">
          <div className="about-container company-card">
            <div className="company-decoration">
              <span>KDS</span>
            </div>

            <div className="company-copy">
              <div className="section-eyebrow light">EKOSISTEM TEKNOLOGI</div>

              <h2>Karya Abadi Digital Solutions</h2>

              <p>
                Karya Abadi Digital Solutions (KDS) merupakan divisi IT
                Development dari PT Karya Abadi Electrindo yang berorientasi
                pada pengembangan Digital & IoT Solutions untuk mendukung
                transformasi digital dan perkembangan Industri 4.0 di
                Indonesia.
              </p>

              <div className="company-tags">
                <span>Digital Solutions</span>
                <span>Internet of Things</span>
                <span>Microcontroller</span>
                <span>Industry 4.0</span>
              </div>

              <a
                href="https://kds.karyaabadielectrindo.com/"
                target="_blank"
                rel="noreferrer"
                className="company-link"
              >
                Tentang KDS
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
                <span>MULAI BELAJAR BERSAMA ARDUFLOW</span>

                <h2>
                  Bangun project IoT pertamamu dengan cara yang lebih visual.
                </h2>

                <p>
                  Pelajari konsep dasar, susun logika dengan visual programming,
                  dan implementasikan pada perangkat nyata.
                </p>

                <div className="cta-buttons">
                  <button
                    type="button"
                    onClick={() => goTo('/tutorial')}
                    className="about-button cta-primary"
                  >
                    Jelajahi Materi
                    <Icon type="arrow" size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => goTo('/workshop')}
                    className="about-button cta-secondary"
                  >
                    Lihat Workshop
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
          --navy-soft: #07142c;
          --blue: #0e62f5;
          --cyan: #25c5f3;
          --orange: #ff8b37;
          --text: #101828;
          --muted: #667085;
          --border: #e6eaf0;

          background: #ffffff;
          color: var(--text);
          overflow: hidden;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .about-container {
          width: min(1180px, calc(100% - 48px));
          margin: 0 auto;
        }

        .about-hero {
          position: relative;
          min-height: 730px;
          display: flex;
          align-items: center;
          background:
            radial-gradient(
              circle at 85% 30%,
              rgba(24, 177, 236, 0.17),
              transparent 31%
            ),
            radial-gradient(
              circle at 8% 70%,
              rgba(255, 132, 54, 0.09),
              transparent 27%
            ),
            linear-gradient(135deg, #020817, #06152f 70%, #071a35);
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
          grid-template-columns: 0.93fr 1.07fr;
          gap: 70px;
          align-items: center;
          padding: 110px 0 90px;
        }

        .about-eyebrow,
        .section-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 12px;
          letter-spacing: 2px;
          color: #1176dd;
        }

        .about-eyebrow {
          color: #62d9ff;
        }

        .about-eyebrow span {
          width: 28px;
          height: 2px;
          background: #62d9ff;
        }

        .about-hero h1 {
          max-width: 630px;
          margin: 20px 0 22px;
          color: #fff;
          font-size: clamp(46px, 5.5vw, 72px);
          line-height: 1.02;
          letter-spacing: -3px;
        }

        .about-hero h1 span,
        .section-heading h2 span,
        .story-content h2 span,
        .capability-grid h2 span,
        .vision-intro h2 span {
          color: #31c9f4;
        }

        .about-hero-content > p {
          max-width: 590px;
          color: #aab8cf;
          font-size: 17px;
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
          border-radius: 9px;
          padding: 0 23px;
          border: 0;
          display: inline-flex;
          gap: 10px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          transition: .25s ease;
        }

        .about-button.primary {
          background: linear-gradient(135deg, #168bdc, #13b6e8);
          color: white;
          box-shadow: 0 12px 30px rgba(20, 166, 229, .23);
        }

        .about-button.secondary {
          border: 1px solid rgba(255,255,255,.2);
          color: #fff;
          background: rgba(255,255,255,.05);
        }

        .about-button:hover {
          transform: translateY(-2px);
        }

        .hero-mini-info {
          display: flex;
          align-items: center;
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
          color: #6f819e;
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
          border: 1px solid rgba(112,209,255,.2);
          border-radius: 17px;
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
          border-radius: 8px;
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
          border-top: 3px solid #25c5f3;
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
          border-top: 3px solid #f28b43;
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
          background: linear-gradient(90deg, #21c4f0, #806fe0);
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
          border-radius: 11px;
          background: rgba(9,27,52,.94);
          border: 1px solid rgba(255,255,255,.12);
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
          background: rgba(37,197,243,.12);
          color: #35cdf5;
        }

        .badge-code-symbol {
          color: #ff9b57;
          background: rgba(255,139,55,.12);
          font-size: 12px;
          font-weight: 800;
        }

        /* Value */
        .about-values {
          position: relative;
          margin-top: -1px;
          background: #fff;
        }

        .value-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-left: 1px solid var(--border);
        }

        .value-card {
          min-height: 285px;
          padding: 35px 29px;
          border-right: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          transition: .25s;
        }

        .value-card:hover {
          background: #f8fbfe;
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
          border-radius: 9px;
          background: #edf8ff;
          display: grid;
          place-items: center;
          color: #1087d5;
        }

        .value-number {
          color: #cad3df;
          font-size: 11px;
          font-weight: 700;
        }

        .value-label {
          color: #1287d5;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .value-card h3 {
          margin: 7px 0 10px;
          font-size: 18px;
        }

        .value-card p {
          margin: 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.7;
        }

        /* Story */
        .about-story {
          padding: 125px 0;
        }

        .story-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 100px;
          align-items: center;
        }

        .story-visual {
          min-height: 450px;
          position: relative;
          background:
            linear-gradient(135deg, rgba(9,100,165,.12), rgba(30,204,239,.04));
          border-radius: 20px;
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
          border-radius: 12px;
          box-shadow: 0 30px 60px rgba(6,22,48,.23);
        }

        .story-code {
          color: #28c5ed;
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
          border-radius: 10px;
          background: #13aade;
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
          letter-spacing: -1.8px;
        }

        .story-content h2 span,
        .capability-grid h2 span {
          display: block;
          color: #1086d5;
        }

        .story-content > p {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.85;
        }

        .story-content .story-lead {
          color: #27364b;
          font-size: 16px;
        }

        .story-highlight {
          margin-top: 28px;
          padding: 19px 22px;
          display: flex;
          gap: 15px;
          background: #f4faff;
          border-left: 3px solid #1cb8e7;
        }

        .story-highlight > span {
          color: #1cb8e7;
          font-size: 33px;
          line-height: 1;
        }

        .story-highlight p {
          margin: 0;
          color: #25364d;
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
          color: #1184d2;
        }

        /* solution */
        .about-solution {
          padding: 110px 0;
          background: #f6f9fc;
        }

        .solution-flow {
          max-width: 950px;
          margin: auto;
          display: grid;
          grid-template-columns: 1fr 70px 1fr;
          align-items: center;
        }

        .problem-card,
        .answer-card {
          min-height: 350px;
          padding: 37px;
          background: white;
          border: 1px solid #e2e7ed;
          border-radius: 13px;
        }

        .answer-card {
          color: white;
          background: linear-gradient(145deg, #07172f, #09264a);
          border: 0;
          box-shadow: 0 25px 50px rgba(4,24,51,.17);
        }

        .solution-tag {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #9ba7b5;
        }

        .answer-card .solution-tag {
          color: #3ac6ef;
        }

        .problem-card h3,
        .answer-card h3 {
          margin: 10px 0 28px;
          font-size: 21px;
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
          background: #fff1f0;
          color: #f05d58;
        }

        .answer-list div {
          color: #c2d0e1;
        }

        .answer-list span {
          width: 23px;
          height: 23px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(43,202,239,.14);
          color: #37d1f5;
        }

        .solution-arrow {
          width: 48px;
          height: 48px;
          margin: auto;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: white;
          background: #15acdF;
          z-index: 3;
        }

        /* How */
        .about-how {
          padding: 120px 0;
        }

        .workflow-wrapper {
          display: grid;
          grid-template-columns: 1fr 45px 1fr 45px 1fr 45px 1fr;
          align-items: center;
        }

        .workflow-card {
          min-height: 235px;
          padding: 27px;
          border: 1px solid var(--border);
          border-radius: 12px;
          position: relative;
          transition: .25s;
        }

        .workflow-card:hover {
          border-color: #8bd8f1;
          box-shadow: 0 15px 40px rgba(14,77,120,.08);
        }

        .workflow-number {
          position: absolute;
          right: 21px;
          top: 19px;
          color: #d3dae2;
          font-weight: 800;
          font-size: 12px;
        }

        .workflow-category {
          color: #0c98d0;
          font-size: 9px;
          letter-spacing: 1.5px;
          font-weight: 800;
        }

        .workflow-card h3 {
          margin: 40px 0 11px;
          font-size: 19px;
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
          background: #9eddef;
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
          background: #26b8e4;
        }

        /* vision */
        .vision-section {
          padding: 120px 0;
          color: white;
          background:
            radial-gradient(circle at 75% 20%, rgba(22,175,224,.15), transparent 30%),
            #030d21;
        }

        .vision-grid {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 100px;
        }

        .section-eyebrow.light {
          color: #2bc6f1;
        }

        .vision-intro h2 span {
          color: #2bc6f1;
        }

        .vision-intro > p {
          color: #889ab3;
          line-height: 1.8;
        }

        .vision-box {
          margin-top: 42px;
          padding: 25px;
          border: 1px solid rgba(73,200,238,.2);
          border-radius: 10px;
          background: rgba(25,168,216,.06);
        }

        .vision-box span {
          color: #27c4ee;
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
          padding: 27px 10px;
          border: 0;
          border-bottom: 1px solid rgba(255,255,255,.1);
          color: white;
          background: transparent;
          cursor: pointer;
          transition: .2s;
        }

        .mission-card.active {
          padding-left: 22px;
          background: rgba(21,174,221,.07);
        }

        .mission-number {
          color: #28c3ec;
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
          color: #2ac7f1;
        }

        /* Capability */
        .about-capability {
          padding: 120px 0;
        }

        .capability-grid {
          display: grid;
          grid-template-columns: .9fr 1.1fr;
          gap: 100px;
        }

        .capability-list > div {
          display: grid;
          grid-template-columns: 60px 1fr 30px;
          align-items: center;
          min-height: 70px;
          border-bottom: 1px solid var(--border);
        }

        .capability-list > div > span:first-child {
          color: #b5c0cd;
          font-size: 10px;
          font-weight: 700;
        }

        .capability-list strong {
          font-size: 16px;
        }

        .capability-arrow {
          color: #0d99d5;
        }

        /* audience */
        .about-audience {
          padding: 115px 0;
          background: #f7f9fc;
        }

        .audience-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .audience-card {
          min-height: 260px;
          position: relative;
          padding: 30px;
          background: white;
          border: 1px solid #e5e9ef;
          border-radius: 11px;
          overflow: hidden;
          transition: .25s;
        }

        .audience-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 40px rgba(15,48,75,.08);
        }

        .audience-icon {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          color: #118bd1;
          background: #edf8fe;
        }

        .audience-card h3 {
          margin: 30px 0 11px;
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
          background: #1ab7e7;
          transition: .25s;
        }

        .audience-card:hover .audience-line {
          width: 100%;
        }

        /* Company */
        .company-section {
          padding: 110px 0;
        }

        .company-card {
          min-height: 400px;
          display: grid;
          grid-template-columns: .7fr 1.3fr;
          color: white;
          background:
            radial-gradient(circle at 10% 50%, rgba(24,188,231,.19), transparent 28%),
            #041126;
          border-radius: 18px;
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
          letter-spacing: -6px;
          color: #2bc8ef;
        }

        .company-copy {
          padding: 65px;
        }

        .company-copy h2 {
          margin: 13px 0 17px;
          font-size: 37px;
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
          border: 1px solid rgba(64,203,241,.2);
          background: rgba(38,184,225,.06);
          border-radius: 30px;
          padding: 8px 13px;
          color: #a9dbe9;
          font-size: 10px;
        }

        .company-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #32c9f0;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
        }

        /* CTA */
        .about-cta {
          padding: 25px 0 120px;
        }

        .cta-card {
          min-height: 430px;
          position: relative;
          border-radius: 18px;
          display: grid;
          place-items: center;
          overflow: hidden;
          text-align: center;
          background:
            radial-gradient(circle at 50% 120%, rgba(18,194,234,.24), transparent 42%),
            #031027;
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

        .cta-content {
          position: relative;
          z-index: 2;
          max-width: 750px;
          padding: 60px 30px;
        }

        .cta-content > span {
          color: #33c7ef;
          font-size: 10px;
          letter-spacing: 1.8px;
          font-weight: 800;
        }

        .cta-content h2 {
          margin: 15px 0;
          color: white;
          font-size: clamp(32px, 4vw, 47px);
          line-height: 1.14;
          letter-spacing: -1.5px;
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
          background: #22bce9;
          color: #021124;
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
            transform: scale(.9);
            transform-origin: center right;
          }
        }

        @media (max-width: 800px) {
          .about-container {
            width: min(100% - 32px, 1180px);
          }

          .about-hero-grid,
          .story-grid,
          .vision-grid,
          .capability-grid,
          .company-card {
            grid-template-columns: 1fr;
          }

          .about-hero-grid {
            padding-top: 90px;
          }

          .about-hero h1 {
            letter-spacing: -2px;
          }

          .about-visual {
            min-height: 420px;
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
            font-size: 43px;
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

          .value-grid,
          .audience-grid,
          .workflow-wrapper {
            grid-template-columns: 1fr;
          }

          .about-values .about-container {
            width: 100%;
          }

          .value-card {
            min-height: auto;
          }

          .story-card-main {
            left: 20px;
            top: 55px;
            width: calc(100% - 65px);
          }

          .story-floating-card {
            right: 5px;
          }

          .about-story,
          .about-solution,
          .about-how,
          .vision-section,
          .about-capability,
          .about-audience,
          .company-section {
            padding: 80px 0;
          }

          .mission-card {
            grid-template-columns: 35px 1fr 20px;
          }

          .company-copy h2 {
            font-size: 30px;
          }

          .badge-iot {
            left: 0;
          }

          .badge-code {
            right: 0;
          }
        }
      `}</style>
    </>
  );
}

export default Partner;
