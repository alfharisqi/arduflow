import { useState } from 'react';

const ideMaterials = [
  {
    number: '1',
    title: 'Mengenal Tampilan IDE',
    desc: 'Mengenali bagian utama IDE sebelum mulai menyusun program visual.',
    sectionLabel: 'Bagian utama pada IDE',
    note:
      'Nama atau posisi menu dapat berubah mengikuti versi IDE. Fokuslah pada fungsi utamanya: memilih node, menyusun alur, mengatur parameter, memeriksa kesalahan, lalu menjalankan proyek.',
    type: 'ide-layout',
    cards: [
      ['Toolbar utama', 'Berisi menu Proyek Baru, Simpan, Validasi, Generate Kode, dan Upload ke board.'],
      ['Palet node', 'Kumpulan node input, logika, proses, output, timer, dan komunikasi yang dapat digunakan.'],
      ['Workspace / canvas', 'Area untuk meletakkan, menyusun, memindahkan, dan menghubungkan node.'],
      ['Panel properti', 'Digunakan untuk mengatur nama node, pin, nilai, kondisi, waktu, atau parameter lain.'],
      ['Status / console', 'Menampilkan hasil validasi, pesan kesalahan, proses generate, dan informasi upload.'],
      ['Kontrol tampilan', 'Membantu memperbesar, memperkecil, merapikan, dan melihat seluruh alur proyek.'],
    ],
    flowTitle: 'Alur penggunaan singkat',
    flow: ['Pilih node', 'Seret ke canvas', 'Hubungkan', 'Atur properti', 'Validasi'],
  },
  {
    number: '2',
    title: 'Membuat Proyek',
    desc: 'Langkah sederhana dari proyek kosong sampai program siap diuji pada perangkat.',
    sectionLabel: 'Bagian utama pada IDE',
    note:
      'Pastikan semua node terhubung, parameter sudah benar, dan board serta port telah dipilih sebelum melakukan generate dan upload program.',
    type: 'project-flow',
    cards: [
      ['Buat proyek baru', 'Klik Proyek Baru, masukkan nama proyek, lalu pilih jenis board atau perangkat yang digunakan.'],
      ['Tambahkan node', 'Pilih node input, logika, proses, dan output dari palet, kemudian letakkan pada workspace.'],
      ['Hubungkan alur', 'Sambungkan port node dari sumber data menuju proses dan output sesuai urutan kerja.'],
      ['Atur parameter', 'Tentukan nomor pin, nilai batas, waktu, kondisi, atau pengaturan lain pada panel properti.'],
      ['Validasi dan generate', 'Periksa node yang belum terhubung atau parameter kosong, lalu hasilkan kode Arduino.'],
      ['Upload dan uji', 'Hubungkan board, pilih port yang sesuai, upload program, lalu amati hasil pada rangkaian.'],
    ],
    flowTitle: 'Contoh proyek sederhana: sensor cahaya menyalakan LED',
    flow: ['Sensor cahaya', 'Kondisi nilai', 'LED menyala'],
  },
  {
    number: '3',
    title: 'Manajemen Node',
    desc: 'Mengatur node agar alur program mudah dibaca, diubah, dan diperiksa.',
    sectionLabel: 'Operasi dasar node',
    note:
      'Susun node secara rapi, gunakan nama yang jelas, dan pastikan setiap koneksi sesuai agar alur program mudah dipahami serta mengurangi kesalahan.',
    type: 'node-management',
    cards: [
      ['Tambah node', 'Pilih node dari palet lalu seret ke workspace.'],
      ['Pindahkan node', 'Geser node untuk merapikan posisi dan urutan alur.'],
      ['Hubungkan node', 'Tarik koneksi dari port output menuju port input.'],
      ['Atur node', 'Ubah nama, pin, nilai, kondisi, dan parameter lainnya.'],
      ['Duplikasi node', 'Salin node yang memiliki pengaturan serupa agar lebih cepat.'],
      ['Hapus node', 'Hapus node atau koneksi yang tidak lagi digunakan.'],
    ],
    flowTitle: 'Jenis node yang umum digunakan',
    flow: ['Input', 'Logika', 'Output', 'Timer'],
    flowDesc: [
      'Membaca sensor atau tombol.',
      'Membuat kondisi dan keputusan.',
      'Mengendalikan LED, buzzer, atau relay.',
      'Memberi jeda atau pengulangan waktu.',
    ],
  },
];

function IdeStepCards({ material }) {
  return (
    <>
      <p className="ide-ebook-section-label">{material.sectionLabel}</p>
      <div className="ide-ebook-card-grid">
        {material.cards.map(([title, text], index) => (
          <article className="ide-ebook-info-card" key={title}>
            <span>{index + 1}</span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function IdeFlowCard({ material }) {
  return (
    <div className={`ide-ebook-flow-card ${material.type}`}>
      <h3>{material.flowTitle}</h3>
      <div className="ide-ebook-flow-items">
        {material.flow.map((item, index) => (
          <div className="ide-ebook-flow-item" key={item}>
            <strong>{item}</strong>
            {material.flowDesc?.[index] && <p>{material.flowDesc[index]}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function IdeEbook() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeMaterial = ideMaterials[activeIndex];

  const changeMaterial = (nextIndex) => {
    setActiveIndex(nextIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="ide-ebook-section" aria-labelledby="ide-ebook-title">
      <div className="ide-ebook-heading">
        <h1 id="ide-ebook-title">Penggunaan IDE</h1>
        <p>Mengenal tampilan IDE, membuat Proyek, dan manajemen node.</p>
      </div>

      <article className="ide-ebook-panel">
        <div className="ide-ebook-panel-header">
          <span className="ide-ebook-number">{activeMaterial.number}</span>
          <div>
            <h2>{activeMaterial.title}</h2>
            <p>{activeMaterial.desc}</p>
          </div>
        </div>

        <IdeStepCards material={activeMaterial} />
        <IdeFlowCard material={activeMaterial} />

        <div className="ide-ebook-note">
          <h3>Catatan Penting</h3>
          <p>{activeMaterial.note}</p>
        </div>

        <div className="ide-ebook-footer">
          <div className="ide-ebook-dots" aria-label="Navigasi materi penggunaan IDE">
            {ideMaterials.map((material, index) => (
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

          <div className="ide-ebook-actions">
            {activeIndex > 0 && (
              <button
                className="ide-ebook-button secondary"
                type="button"
                onClick={() => changeMaterial(activeIndex - 1)}
              >
                Materi Sebelumnya
              </button>
            )}
            {activeIndex < ideMaterials.length - 1 ? (
              <button
                className="ide-ebook-button"
                type="button"
                onClick={() => changeMaterial(activeIndex + 1)}
              >
                Materi Selanjutnya
              </button>
            ) : (
              <a className="ide-ebook-button" href="/tutorial#pilih-jalur-belajar">
                Selesaikan Materi
              </a>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
