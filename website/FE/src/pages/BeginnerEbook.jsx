import { useState } from 'react';
import mengenalArduflowImage from '../assets/images/mengenal arduflow.png';
import boardTutorialImage from '../assets/images/Mengenal Board Arduino UNO.jpg';
import belajarIotImage from '../assets/images/kenapa belajar IoT dengan visual.png';
import { TutorialIcon } from './Tutorial.jsx';

const beginnerEbookMaterials = [
  {
    number: '1',
    title: 'Mengenal Arduflow',
    desc: 'Memahami platform visual untuk belajar dan membuat proyek Arduino.',
    heading: 'ArduFlow adalah platform pembelajaran IoT berbasis visual programming.',
    body: 'Pengguna dapat menyusun logika program dengan blok atau node, lalu sistem membantu menghasilkan kode Arduino. Pendekatan ini membuat proses belajar lebih mudah dipahami oleh pemula tanpa harus langsung menulis seluruh kode dari awal.',
    noteTitle: 'Inti sederhana',
    note: 'ArduFlow membantu pemula mengubah ide menjadi alur program visual, kode Arduino, dan proyek IoT yang dapat diuji secara bertahap.',
    image: mengenalArduflowImage,
    type: 'intro',
  },
  {
    number: '2',
    title: 'Dasar Arduino',
    desc: 'Mengenal papan mikrokontroler yang menjadi pusat kendali proyek.',
    heading: 'Arduino menjalankan logika sesuai program yang diberikan.',
    body: 'Sensor, tombol, dan modul lain mengirimkan input ke Arduino. Setelah itu Arduino memproses nilai tersebut, menjalankan logika program, lalu mengendalikan output seperti LED, relay, motor, atau tampilan layar.',
    noteTitle: 'Pola dasar Arduino',
    note: 'Hampir semua proyek Arduino mengikuti alur yang sama: membaca input, memproses logika, lalu mengendalikan output secara berulang.',
    image: boardTutorialImage,
    type: 'arduino-flow',
    example:
      'Sensor cahaya membaca ruangan gelap. Arduino memproses nilai sensor, lalu menyalakan LED secara otomatis. Saat kondisi kembali terang, LED dapat dimatikan.',
  },
  {
    number: '3',
    title: 'Visual Programming',
    desc: 'Menyusun logika program menggunakan blok atau node yang saling terhubung.',
    noteTitle: 'Catatan Penting',
    note: 'Periksa kembali rangkaian, pin, dan urutan logika. Jika semuanya sesuai, proyek dapat diuji secara bertahap dari bagian paling sederhana.',
    image: belajarIotImage,
    type: 'visual-steps',
    steps: [
      ['Blok atau node', 'Setiap blok mewakili fungsi tertentu, seperti membaca sensor atau menyalakan LED.'],
      ['Hubungkan alur', 'Garis penghubung menentukan urutan data dan proses yang dijalankan.'],
      ['Atur parameter', 'Nilai pin, batas sensor, waktu, dan kondisi dapat diubah sesuai kebutuhan.'],
      ['Generate kode', 'Alur visual diterjemahkan menjadi kode Arduino secara otomatis.'],
      ['Upload dan uji', 'Kode dijalankan pada perangkat untuk melihat hasil rangkaian.'],
    ],
  },
];

export function BeginnerEbook() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMaterial = beginnerEbookMaterials[activeIndex];

  const changeMaterial = (nextIndex) => {
    setActiveIndex(nextIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="beginner-ebook-section" aria-labelledby="beginner-ebook-title">
      <div className="beginner-ebook-heading">
        <h1 id="beginner-ebook-title">Panduan Pemula</h1>
        <p>
          Pelajari dasar ArduFlow, Arduino, visual programming, dan IoT sebelum mulai membuat
          project pertamamu
        </p>
      </div>

      <article className="beginner-ebook-panel">
        <div className="beginner-ebook-panel-header">
          <span className="beginner-ebook-number">{activeMaterial.number}</span>
          <div>
            <h2>{activeMaterial.title}</h2>
            <p>{activeMaterial.desc}</p>
          </div>
        </div>

        {activeMaterial.type === 'arduino-flow' ? (
          <div className="beginner-ebook-body beginner-ebook-flow-body">
            <div className="beginner-ebook-flow-icons">
              <div className="ebook-flow-item">
                <TutorialIcon type="help" />
                <strong>Input</strong>
                <p>Sensor membaca cahaya, suhu, gerakan, atau kondisi lain.</p>
              </div>
              <span />
              <div className="ebook-flow-item">
                <TutorialIcon type="cpu" />
                <strong>Proses</strong>
                <p>Arduino menjalankan logika sesuai program yang diberikan.</p>
              </div>
              <span />
              <div className="ebook-flow-item">
                <TutorialIcon type="zap" />
                <strong>Output</strong>
                <p>LED, buzzer, motor, atau perangkat lain melakukan aksi.</p>
              </div>
            </div>
            <p className="beginner-ebook-example">
              <strong>Contoh Singkat :</strong> {activeMaterial.example}
            </p>
          </div>
        ) : activeMaterial.type === 'visual-steps' ? (
          <div className="beginner-ebook-body beginner-ebook-steps-body">
            {activeMaterial.steps.map(([title, text], index) => (
              <div className="ebook-step-item" key={title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="beginner-ebook-body">
            <div className="beginner-ebook-copy">
              <h3>{activeMaterial.heading}</h3>
              <p>{activeMaterial.body}</p>
            </div>
            <img src={activeMaterial.image} alt="" />
          </div>
        )}

        <div className="beginner-ebook-note">
          <h3>{activeMaterial.noteTitle}</h3>
          <p>{activeMaterial.note}</p>
        </div>

        <div className="beginner-ebook-footer">
          <div className="beginner-ebook-dots" aria-label="Navigasi materi panduan pemula">
            {beginnerEbookMaterials.map((material, index) => (
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

          <div className="beginner-ebook-actions">
            {activeIndex > 0 && (
              <button
                className="beginner-ebook-button secondary"
                type="button"
                onClick={() => changeMaterial(activeIndex - 1)}
              >
                Materi Sebelumnya
              </button>
            )}
            {activeIndex < beginnerEbookMaterials.length - 1 ? (
              <button
                className="beginner-ebook-button"
                type="button"
                onClick={() => changeMaterial(activeIndex + 1)}
              >
                Materi Selanjutnya
              </button>
            ) : (
              <a className="beginner-ebook-button" href="/tutorial#pilih-jalur-belajar">
                Selesaikan Materi
              </a>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
