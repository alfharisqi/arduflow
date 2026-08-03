import heroImage from "../assets/images/featured-led.png";
import arduinoImage from "../assets/images/Mengenal Board Arduino UNO.jpg";
import breadboardImage from "../assets/images/library-led.png";
import ledImage from "../assets/images/featured-led.png";
import resistorImage from "../assets/images/Menghubungkan LED ke Arduino.jpg";
import jumperImage from "../assets/images/library-door-lock.png";
import usbImage from "../assets/images/library-smart-home.png";

const components = [
  { name: "Arduino Uno", qty: 1, image: arduinoImage },
  { name: "Breadboard", qty: 1, image: breadboardImage },
  { name: "LED", qty: 1, image: ledImage },
  { name: "Resistor", qty: 1, image: resistorImage },
  { name: "Kabel Jumper", qty: 2, image: jumperImage },
  { name: "Kabel USB", qty: 1, image: usbImage },
];

const nodes = [
  {
    title: "Digital Out",
    description: "Mengontrol pin digital Arduino dalam kondisi HIGH atau LOW.",
    tone: "red",
    icon: "⚡",
  },
  {
    title: "Boolean Value",
    description: "Memberikan nilai TRUE atau FALSE sebagai kondisi output.",
    tone: "green",
    icon: "▦",
  },
  {
    title: "Delay",
    description: "Memberikan jeda waktu sebelum proses selanjutnya dijalankan.",
    tone: "maroon",
    icon: "◷",
  },
  {
    title: "Timer",
    description: "Mengulangi perubahan kondisi berdasarkan interval waktu tertentu.",
    tone: "lime",
    icon: "◔",
  },
];

const stats = [
  { icon: "▱", label: "Tingkat", value: "Pemula" },
  { icon: "▣", label: "Jumlah Node", value: "4 Node" },
  { icon: "▣", label: "Platform", value: "Arduino" },
];

const steps = [
  {
    title: "Siapkan komponen",
    body: "Siapkan Arduino Uno, breadboard, LED, resistor 220Ω, kabel jumper, dan kabel USB.",
  },
  {
    title: "Susun rangkaian",
    body: "Pasang LED dan resistor pada breadboard, lalu hubungkan ke pin digital 8 dan GND Arduino.",
  },
  {
    title: "Buka ArduFlow IDE",
    body: "Masuk ke ArduFlow IDE dan buat proyek baru dengan nama “LED Sederhana”.",
  },
  {
    title: "Tambahkan Node",
    body: "Tambahkan node Timer, Boolean Value, Delay, dan Digital Out ke dalam workspace.",
  },
  {
    title: "Atur Konfigurasi",
    body: "Atur Digital Out pada pin 8 dan Delay sebesar 1000 milidetik.",
  },
  {
    title: "Hubungkan Node",
    body: "Susun koneksi node sesuai alur program agar LED dapat menyala dan mati secara berulang.",
  },
  {
    title: "Jalankan Proyek",
    body: "Generate dan upload program ke Arduino, lalu periksa hasil rangkaian.",
  },
];

function NodeDiagram() {
  return (
    <div className="detail-node-diagram" aria-label="Diagram node ArduFlow">
      <div className="diagram-node diagram-node--timer">
        <span>TIMER</span>
        <strong>Count Up</strong>
        <small>Target 10 sec</small>
      </div>
      <div className="diagram-node diagram-node--boolean">
        <span>BOOLEAN VALUE</span>
        <strong>1 / TRUE</strong>
        <small>0 / FALSE</small>
      </div>
      <div className="diagram-node diagram-node--digital">
        <span>DIGITAL OUT</span>
        <strong>Pin 13</strong>
        <small>Active HIGH</small>
      </div>
      <div className="diagram-node diagram-node--delay">
        <span>DELAY</span>
        <strong>1000 ms</strong>
        <small>milliseconds</small>
      </div>
      <span className="diagram-line diagram-line--one" aria-hidden="true" />
      <span className="diagram-line diagram-line--two" aria-hidden="true" />
      <span className="diagram-dot diagram-dot--one" aria-hidden="true" />
      <span className="diagram-dot diagram-dot--two" aria-hidden="true" />
    </div>
  );
}

export function ProjectDetail() {
  return (
    <main className="project-detail-page">
      <div className="project-detail-page__canvas">
        <section className="project-detail-hero" aria-labelledby="project-detail-title">
          <img className="project-detail-hero__image" src={heroImage} alt="" />

          <div className="project-detail-hero__content">
            <div className="project-detail-tags">
              <span>Proyek Pemula</span>
              <span>Arduino</span>
            </div>

            <h1 id="project-detail-title">LED Sederhana dengan Arduino</h1>
            <p>
              Pelajari cara menyalakan dan mematikan LED menggunakan node visual
              di ArduFlow IDE tanpa harus menulis kode secara manual tinggal tarik
              tarik saja
            </p>

            <div className="project-detail-stats" aria-label="Ringkasan proyek">
              {stats.map((stat) => (
                <div className="project-detail-stat" key={stat.label}>
                  <span aria-hidden="true">{stat.icon}</span>
                  <div>
                    <strong>{stat.label}</strong>
                    <small>{stat.value}</small>
                  </div>
                </div>
              ))}
            </div>

            <div className="project-detail-actions">
              <a className="project-detail-actions__primary" href="/ide">
                Buka ArduFlow IDE
              </a>
              <a className="project-detail-actions__secondary" href="#rangkaian">
                Lihat Rangkaian
              </a>
            </div>
          </div>
        </section>

        <section className="project-detail-info">
          <article className="detail-components-card">
            <h2>Alat dan Komponen</h2>
            <div className="detail-components-list">
              {components.map((component) => (
                <div className="detail-component-row" key={component.name}>
                  <img src={component.image} alt="" />
                  <span>{component.name}</span>
                  <strong>{component.qty}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="detail-nodes-card" id="rangkaian">
            <h2>Node ArduFlow yang Digunakan</h2>
            <div className="detail-node-list">
              {nodes.map((node) => (
                <div className="detail-node-row" key={node.title}>
                  <span className={`detail-node-icon detail-node-icon--${node.tone}`} aria-hidden="true">
                    {node.icon}
                  </span>
                  <div>
                    <strong>{node.title}</strong>
                    <p>{node.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <NodeDiagram />
          </article>
        </section>

        <section className="detail-steps-section" aria-labelledby="detail-steps-title">
          <h2 id="detail-steps-title">Langkah Pengerjaan</h2>
          <div className="detail-steps-grid">
            {steps.map((step, index) => (
              <article className="detail-step-card" key={step.title}>
                <span>{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default ProjectDetail;
