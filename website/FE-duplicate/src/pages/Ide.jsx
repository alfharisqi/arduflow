import connectComponentGif from '../assets/gif/gif-connect2component-idearduflow.gif';
import inputValueComponentGif from '../assets/gif/gif-inputvaluecomponent-idearduflow.gif';
import putComponentGif from '../assets/gif/gif-putcomponent-idearduflow.gif';
import trafficLightsGif from '../assets/gif/gif-trafficlights-idearduflow.gif';
import workflowIcon from '../assets/icons/icon-workflow-1.svg';
import cpuIcon from '../assets/icons/icon-cpu-1.svg';
import monitorIcon from '../assets/icons/icon-monitor-1.svg';
import settingsIcon from '../assets/icons/icon-settings-1.svg';
import zapIcon from '../assets/icons/icon-zap-1.svg';
import fileIcon from '../assets/icons/icon-file-text-1.svg';
import messageIcon from '../assets/icons/icon-message-square-1.svg';
import checkIcon from '../assets/icons/icon-circle-check-1.svg';

const featureCards = [
  {
    icon: workflowIcon,
    title: 'Visual Flow Builder',
    text: 'Susun logika program dengan node yang saling terhubung, lebih mudah dibaca, dan cepat diuji.',
  },
  {
    icon: cpuIcon,
    title: 'Komponen IoT Siap Pakai',
    text: 'Mulai dari LED, sensor, servo, relay, hingga input analog tersedia sebagai blok visual.',
  },
  {
    icon: monitorIcon,
    title: 'Preview Alur Program',
    text: 'Periksa koneksi node, konfigurasi pin, dan urutan kerja sebelum program dikirim ke board.',
  },
  {
    icon: settingsIcon,
    title: 'Konfigurasi Terarah',
    text: 'Atur board, port, pin, dan parameter komponen melalui panel yang dibuat untuk pemula.',
  },
];

const workflowSteps = [
  {
    title: 'Pilih Komponen',
    text: 'Ambil node input, output, sensor, atau aktuator dari panel komponen.',
    image: putComponentGif,
  },
  {
    title: 'Hubungkan Logika',
    text: 'Sambungkan node agar alur kerja perangkat terlihat jelas dari awal sampai akhir.',
    image: connectComponentGif,
  },
  {
    title: 'Isi Parameter',
    text: 'Masukkan pin, nilai, delay, dan konfigurasi lain sesuai kebutuhan proyek.',
    image: inputValueComponentGif,
  },
  {
    title: 'Uji ke Board',
    text: 'Generate program dan upload ke board untuk melihat hasilnya pada hardware.',
    image: trafficLightsGif,
  },
];

const accessSteps = [
  ['01', fileIcon, 'Daftar akses', 'Ajukan akses IDE melalui halaman token atau program workshop.'],
  ['02', messageIcon, 'Konfirmasi admin', 'Admin memverifikasi kebutuhan, kelas, atau paket akses yang dipilih.'],
  ['03', zapIcon, 'Gunakan token', 'Masukkan token untuk membuka IDE dan mulai membuat proyek visual.'],
];

export function Ide() {
  return (
    <main className="ide-page">
      <section className="ide-hero" aria-labelledby="ide-title">
        <div className="ide-hero-copy">
          <p className="ide-eyebrow">ArduFlow IDE</p>
          <h1 id="ide-title">Bangun logika Arduino dan IoT secara visual.</h1>
          <p>
            IDE visual ArduFlow membantu pemula, siswa, guru, dan komunitas menyusun alur
            program tanpa harus langsung menulis seluruh kode dari awal.
          </p>
          <div className="ide-hero-actions">
            <a className="ide-primary-button" href="/akses">Dapatkan Token IDE</a>
            <a className="ide-secondary-button" href="/tutorial/penggunaan-ide">Pelajari IDE</a>
          </div>
        </div>

        <div className="ide-hero-preview" aria-label="Preview ArduFlow IDE">
          <div className="ide-window">
            <div className="ide-window-top">
              <span />
              <span />
              <span />
              <strong>ArduFlow Visual Editor</strong>
            </div>
            <div className="ide-window-body">
              <aside className="ide-component-list">
                <b>Components</b>
                {['Digital Out', 'Servo', 'Delay', 'Sensor DHT', 'Relay'].map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </aside>
              <div className="ide-canvas-preview">
                <div className="ide-node ide-node--input">Sensor</div>
                <div className="ide-node ide-node--logic">Logic</div>
                <div className="ide-node ide-node--output">Output</div>
                <i className="ide-wire ide-wire--one" />
                <i className="ide-wire ide-wire--two" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ide-feature-section" aria-label="Fitur utama ArduFlow IDE">
        {featureCards.map((feature) => (
          <article className="ide-feature-card" key={feature.title}>
            <span>
              <img src={feature.icon} alt="" />
            </span>
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>

      <section className="ide-workflow-section" aria-labelledby="ide-workflow-title">
        <div className="ide-section-heading">
          <p className="ide-eyebrow">Cara Kerja</p>
          <h2 id="ide-workflow-title">Dari komponen ke program siap upload.</h2>
        </div>

        <div className="ide-workflow-grid">
          {workflowSteps.map((step, index) => (
            <article className="ide-workflow-card" key={step.title}>
              <img src={step.image} alt={`Demo ${step.title.toLowerCase()} di ArduFlow IDE`} />
              <div>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ide-access-panel" aria-labelledby="ide-access-title">
        <div>
          <p className="ide-eyebrow">Akses Token</p>
          <h2 id="ide-access-title">IDE dibuka memakai token dari admin.</h2>
          <p>
            Token menjaga akses tetap rapi untuk kelas, workshop, sekolah, dan komunitas.
            Setelah token aktif, pengguna dapat masuk ke IDE dan mulai membuat proyek.
          </p>
        </div>

        <div className="ide-access-list">
          {accessSteps.map(([number, icon, title, text]) => (
            <article className="ide-access-card" key={title}>
              <strong>{number}</strong>
              <img src={icon} alt="" />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ide-cta">
        <span>
          <img src={checkIcon} alt="" />
        </span>
        <div>
          <h2>Siap mencoba ArduFlow IDE?</h2>
          <p>Mulai dari token akses atau pelajari dulu alur penggunaan IDE visual.</p>
        </div>
        <a className="ide-primary-button" href="/akses">Mulai Sekarang</a>
      </section>
    </main>
  );
}
