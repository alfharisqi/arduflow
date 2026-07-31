import { useState } from 'react';
import arduinoImage from '../assets/images/arduino.png';
import sensorActuatorImage from '../assets/images/sensor dann actuator.png';
import rangkaianIotImage from '../assets/images/rangkaian dasar iot.png';
import lampuOtomatisImage from '../assets/images/lampu otomatis.png';

const hardwareMaterials = [
  {
    number: '1',
    title: 'Mengenal Board',
    desc: 'Board adalah pusat kendali yang membaca input, menjalankan program, dan mengatur output.',
    type: 'board',
    image: arduinoImage,
    body:
      'Board mikrokontroler adalah papan elektronik yang menjadi otak dari sebuah proyek. Program dari IDE diunggah ke board agar perangkat dapat bekerja sesuai logika yang dibuat.',
    subtext: 'Contoh board yang sering digunakan adalah Arduino Uno, Arduino Nano, dan ESP32.',
    noteTitle: 'Inti sederhana',
    note: 'Board menerima data dari sensor, memprosesnya sesuai program, lalu mengendalikan perangkat keluaran.',
    parts: [
      ['Port USB', 'Menghubungkan board ke komputer.'],
      ['Mikrokontroler', 'Menjalankan program dan logika.'],
      ['Pin I/O', 'Menghubungkan sensor dan actuator.'],
      ['Sumber daya', 'Memberikan tegangan pada rangkaian.'],
    ],
  },
  {
    number: '2',
    title: 'Sensor dan Actuator',
    desc: 'Sensor membaca kondisi lingkungan, sedangkan actuator menghasilkan tindakan.',
    type: 'sensor-actuator',
    image: sensorActuatorImage,
    noteTitle: 'Cara kerjanya',
    note: 'Sensor membaca kondisi, board memproses data, kemudian actuator menjalankan tindakan.',
    cards: [
      [
        'Sensor',
        'Sensor mengubah kondisi fisik menjadi data yang dapat dibaca oleh board. Contoh: Sensor suhu, cahaya, kelembapan, gerak, dan jarak.',
      ],
      [
        'Actuator',
        'Actuator menerima perintah dari board lalu melakukan aksi pada perangkat. Contoh: LED, buzzer, motor, kipas, relay, dan pompa air.',
      ],
    ],
  },
  {
    number: '3',
    title: 'Rangkaian Dasar IoT',
    desc: 'Menghubungkan board, sensor, actuator, dan koneksi agar bekerja sebagai satu sistem.',
    type: 'iot-circuit',
    image: rangkaianIotImage,
    heroText:
      'Rangkaian IoT dimulai dari sensor yang membaca kondisi. Board mengolah data, mengirimkannya melalui jaringan bila diperlukan, lalu menjalankan tindakan pada actuator.',
    noteTitle: 'Catatan penting',
    note:
      'Pastikan setiap komponen terhubung pada pin yang benar dan menggunakan sumber daya yang sesuai. Periksa kembali sambungan kabel, pengaturan sensor, serta koneksi jaringan sebelum sistem dijalankan. Lakukan pengujian secara bertahap agar kesalahan pada sensor, board, cloud, atau actuator lebih mudah ditemukan.',
    exampleTitle: 'Contoh: lampu otomatis',
    example:
      'Sensor cahaya membaca ruangan. Ketika kondisi gelap, board menyalakan LED secara otomatis.',
    exampleImage: lampuOtomatisImage,
  },
];

function HardwareBody({ material }) {
  if (material.type === 'sensor-actuator') {
    return (
      <>
        <div className="hardware-ebook-hero-image">
          <img src={material.image} alt="" />
        </div>
        <div className="hardware-ebook-duo-cards">
          {material.cards.map(([title, text], index) => (
            <article className={index === 0 ? 'sensor-card' : 'actuator-card'} key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </>
    );
  }

  if (material.type === 'iot-circuit') {
    return (
      <>
        <div className="hardware-ebook-hero-image iot">
          <img src={material.image} alt="" />
          <p>{material.heroText}</p>
        </div>
        <article className="hardware-ebook-example-card">
          <div>
            <h3>{material.exampleTitle}</h3>
            <p>{material.example}</p>
          </div>
          <img src={material.exampleImage} alt="" />
        </article>
      </>
    );
  }

  return (
    <div className="hardware-ebook-board-body">
      <div className="hardware-ebook-board-copy">
        <p>{material.body}</p>
        <span>{material.subtext}</span>
        <h3>Bagian utama board :</h3>
        <div className="hardware-ebook-part-grid">
          {material.parts.map(([title, text]) => (
            <p key={title}>
              <strong>{title}</strong>
              {text}
            </p>
          ))}
        </div>
      </div>
      <img src={material.image} alt="" />
    </div>
  );
}

export function HardwareEbook() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMaterial = hardwareMaterials[activeIndex];

  const changeMaterial = (nextIndex) => {
    setActiveIndex(nextIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="hardware-ebook-section" aria-labelledby="hardware-ebook-title">
      <div className="hardware-ebook-heading">
        <h1 id="hardware-ebook-title">Dasar Hardware dan IoT</h1>
        <p>Belajar board, sensor, actuator, dan rangkaian dasar.</p>
      </div>

      <article className="hardware-ebook-panel">
        <div className="hardware-ebook-panel-header">
          <span className="hardware-ebook-number">{activeMaterial.number}</span>
          <div>
            <h2>{activeMaterial.title}</h2>
            <p>{activeMaterial.desc}</p>
          </div>
        </div>

        <HardwareBody material={activeMaterial} />

        <div className="hardware-ebook-note">
          <h3>{activeMaterial.noteTitle}</h3>
          <p>{activeMaterial.note}</p>
        </div>

        <div className="hardware-ebook-footer">
          <div className="hardware-ebook-dots" aria-label="Navigasi materi dasar hardware dan IoT">
            {hardwareMaterials.map((material, index) => (
              <button
                className={index === activeIndex ? 'active' : ''}
                type="button"
                key={material.number}
                aria-label={`Buka materi ${material.number}`}
                aria-current={index === activeIndex ? 'step' : undefined}
                onClick={() => changeMaterial(index)}
              />
            ))}
          </div>

          <div className="hardware-ebook-actions">
            {activeIndex > 0 && (
              <button
                className="hardware-ebook-button secondary"
                type="button"
                onClick={() => changeMaterial(activeIndex - 1)}
              >
                Materi Sebelumnya
              </button>
            )}
            {activeIndex < hardwareMaterials.length - 1 ? (
              <button
                className="hardware-ebook-button"
                type="button"
                onClick={() => changeMaterial(activeIndex + 1)}
              >
                Materi Selanjutnya
              </button>
            ) : (
              <a className="hardware-ebook-button" href="/tutorial#pilih-jalur-belajar">
                Selesaikan Materi
              </a>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
