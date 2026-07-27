import aboutArduflowPreview from '../assets/gif/about-arduflow-preview.gif';
import ideAccessFlow from '../assets/gif/ide-access-flow.gif';
import experienceGroup from '../assets/images/workshop-experience-group.png';
import experienceSoldering from '../assets/images/workshop-experience-soldering.jpg';
import experienceStudent from '../assets/images/workshop-experience-student.png';
import workshopHeroDevice from '../assets/images/workshop-hero-device.png';

const workshopDetails = [
  { label: 'Tanggal', value: '25 Juli 2026', sub: 'Sabtu', icon: 'calendar' },
  { label: 'Waktu', value: '10.00 - 16.00', sub: 'Break included', icon: 'clock' },
  { label: 'Lokasi', value: 'Innova Lab', sub: 'Jl. MH Thamrin 09', icon: 'pin' },
];

const aboutHighlights = [
  { label: 'Platform Edukasi Arduflow', icon: 'monitor' },
  { label: 'Arduino IDE', icon: 'chip' },
  { label: 'Tutor', icon: 'user' },
  { label: 'Workshop', icon: 'rocket' },
  { label: 'Proyek IoT', icon: 'globe' },
  { label: 'Sertifikat', icon: 'cert' },
];

const targetParticipants = [
  {
    title: 'Pemula',
    text: 'Belajar Arduino dan IoT dari dasar tanpa harus langsung menulis kode rumit.',
    icon: 'user',
  },
  {
    title: 'Siswa/Mahasiswa',
    text: 'Buat proyek Arduino dan IoT untuk tugas dan praktikum.',
    icon: 'book',
  },
  {
    title: 'Pengajar',
    text: 'Mengajar konsep Arduino dan IoT dengan pendekatan visual dan praktik.',
    icon: 'community',
  },
  {
    title: 'Sekolah',
    text: 'Program pendampingan untuk kegiatan teknologi sekolah.',
    icon: 'file',
  },
  {
    title: 'Perguruan Tinggi',
    text: 'Mendukung kegiatan praktikum, penelitian, dan pengembangan proyek IoT.',
    icon: 'graduation',
  },
  {
    title: 'Komunitas',
    text: 'Belajar visual programming dan proyek IoT secara kolaboratif.',
    icon: 'globe',
  },
];

const programBenefits = [
  {
    title: 'Belajar Lebih Terarah',
    text: 'Ikuti roadmap dari fondasi sampai implementasi proyek.',
    icon: 'code',
  },
  {
    title: 'Latih Praktik Mandiri',
    text: 'Kerjakan latihan dan contoh kasus IoT secara bertahap.',
    icon: 'book',
  },
  {
    title: 'Praktik Langsung',
    text: 'Bangun rangkaian proyek Arduflow sampai selesai.',
    icon: 'rocket',
  },
  {
    title: 'Didampingi Mentor',
    text: 'Materi dan arahan membantumu memahami konsep sulit.',
    icon: 'cert',
  },
  {
    title: 'Membuat Demo di Arduflow IDE',
    text: 'Gunakan interface visual untuk mengontrol alur perangkat.',
    icon: 'monitor',
  },
  {
    title: 'Gabung Komunitas',
    text: 'Diskusi, bertanya, dan lihat progres peserta lain.',
    icon: 'community',
  },
];

const curriculumChecklist = [
  'Pengenalan Arduino dan IoT',
  'Membuat program sederhana dengan visual flow',
  'Dasar visual programming dan node logic',
  'Koneksi sensor, aktuator, dan modul komunikasi',
  'Membuat proyek IoT sederhana',
  'Melakukan pengujian dan evaluasi hasil proyek',
];

const curriculumModules = [
  { title: 'Dasar Arduino dan IoT', duration: '45 min' },
  { title: 'Visual Programming', duration: '60 min' },
  { title: 'Sensor dan Aktuator', duration: '75 min' },
  { title: 'Mini Proyek', duration: '90 min' },
  { title: 'Pengujian dan Evaluasi', duration: '45 min' },
];

const learningFlow = [
  {
    number: '01',
    title: 'Pendaftaran',
    text: 'Peserta memilih program dan mengisi data.',
  },
  {
    number: '02',
    title: 'Akses IDE',
    text: 'Peserta mendapat akun dan panduan awal.',
  },
  {
    number: '03',
    title: 'Materi Dasar',
    text: 'Belajar konsep Arduino dan IoT.',
  },
  {
    number: '04',
    title: 'Mini Proyek',
    text: 'Membangun proyek dengan bimbingan.',
  },
  {
    number: '05',
    title: 'Review',
    text: 'Mentor mengevaluasi hasil proyek.',
  },
  {
    number: '06',
    title: 'Sertifikat',
    text: 'Peserta mendapat bukti penyelesaian.',
  },
];

const learningPaths = [
  {
    title: 'Workshop Pemula Arduino dan IoT',
    text: 'Live 4 jam, cocok untuk peserta baru.',
    action: 'Lihat Program',
    href: '/akses',
  },
  {
    title: 'Workshop Arduflow IDE untuk Siswa',
    text: 'Praktik visual programming untuk kegiatan belajar.',
    action: 'Lihat Program',
    href: '/akses',
    featured: true,
  },
  {
    title: 'Program IoT untuk Sekolah',
    text: 'Pendampingan institusi dan materi kelas.',
    action: 'Konsultasikan',
    href: '/kontak',
  },
  {
    title: 'Kelas Komunitas Teknologi',
    text: 'Sesi belajar kolektif untuk komunitas.',
    action: 'Konsultasikan',
    href: '/kontak',
  },
  {
    title: 'Demo dan Kerja Sama Institusi',
    text: 'Demo produk, lisensi, dan kebutuhan lab.',
    action: 'Hubungi Tim',
    href: '/kontak',
  },
  {
    title: 'Program Lain',
    text: 'Diskusi kebutuhan khusus dan paket custom.',
    action: 'Kontak Kami',
    href: '/kontak',
  },
];

const experienceGallery = [
  {
    src: experienceSoldering,
    alt: 'Peserta workshop sedang menyolder komponen Arduino',
    variant: 'soldering',
  },
  {
    src: experienceStudent,
    alt: 'Peserta menampilkan alur Arduflow di ponsel saat praktik IoT',
    variant: 'student',
  },
  {
    src: experienceGroup,
    alt: 'Kelompok peserta workshop merakit proyek IoT bersama mentor',
    variant: 'group',
  },
];

const registrationSteps = [
  { number: '1', title: 'Pilih Program', text: 'Pilih jalur belajar yang sesuai.' },
  { number: '2', title: 'Isi Formulir', text: 'Lengkapi data peserta.' },
  { number: '3', title: 'Download & Ikuti', text: 'Dapatkan akses aplikasi.' },
  { number: '4', title: 'Konfirmasi', text: 'Selesaikan pembayaran.' },
  { number: '5', title: 'Terima Token', text: 'Gunakan token akses.' },
  { number: '6', title: 'Mulai Belajar', text: 'Masuk komunitas dan workshop.' },
];

const workshopFaqs = [
  'Apakah program ini cocok untuk pemula?',
  'Apakah peserta harus membawa coding?',
  'Apakah program memakai aplikasi Arduflow?',
  'Bagaimana cara mendapatkan token Arduflow IDE?',
  'Apakah program tersedia untuk sekolah atau komunitas?',
];

export function Workshop() {
  return (
    <>
      <section className="workshop-hero" aria-labelledby="workshop-title">
        <div className="workshop-hero-inner">
          <div className="workshop-copy">
            <h1 className="workshop-title" id="workshop-title">
              <span>Program Belajar IoT</span>
              <span>Terstruktur dengan</span>
              <strong>ARDUFLOW</strong>
            </h1>
            <p className="workshop-body">
              Rancang proyek IoT dari nol dengan alur visual, praktik langsung, dan akses Arduflow IDE.
              Cocok untuk siswa, mahasiswa, pengajar, dan profesional yang ingin belajar cepat tanpa coding rumit.
            </p>

            <div className="workshop-info-grid" aria-label="Detail workshop">
              {workshopDetails.map((item) => (
                <article className="workshop-info-card" key={item.label}>
                  <span className={`workshop-icon ${item.icon}`} aria-hidden="true" />
                  <div>
                    <p>{item.label}</p>
                    <strong>{item.value}</strong>
                    <span>{item.sub}</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="workshop-actions">
              <a className="workshop-button primary" href="/akses">Daftar Workshop</a>
              <a className="workshop-button secondary" href="#alur-belajar">Lihat Alur Belajar</a>
            </div>
          </div>
        </div>

        <div className="workshop-visual" aria-hidden="true">
          <img src={workshopHeroDevice} alt="" />
        </div>
      </section>

      <section className="workshop-about" aria-labelledby="about-arduflow-title">
        <div className="workshop-about-inner">
          <div className="about-preview" aria-hidden="true">
            <img src={aboutArduflowPreview} alt="" />
          </div>

          <div className="about-content">
            <h2 className="about-title" id="about-arduflow-title">
              Belajar IoT dengan Alur yang Lebih Terarah
            </h2>
            <p className="about-desc">
              Arduflow membantumu memahami cara perangkat saling terhubung lewat pendekatan flow-based.
              Semua konsep inti disusun bertahap agar belajar IoT terasa praktis, visual, dan menyenangkan.
            </p>
            <div className="about-chip-grid" aria-label="Fitur belajar Arduflow">
              {aboutHighlights.map((item) => (
                <div className="about-chip" key={item.label}>
                  <span className={`about-icon ${item.icon}`} aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="workshop-target" aria-labelledby="target-peserta-title">
        <div className="workshop-target-inner">
          <h2 className="target-title" id="target-peserta-title">
            Untuk Siapa Program Ini?
          </h2>
          <p className="target-desc">
            Program disusun agar cocok untuk pemula, pembelajar teknologi, dan calon pengembang solusi IoT
            yang membutuhkan alur belajar lebih rapi.
          </p>

          <div className="target-card-grid">
            {targetParticipants.map((item) => (
              <article className="target-card" key={item.title}>
                <span className="target-icon-box" aria-hidden="true">
                  <span className={`target-icon ${item.icon}`} />
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="workshop-benefits" aria-labelledby="manfaat-program-title">
        <div className="workshop-benefits-inner">
          <h2 className="benefit-title" id="manfaat-program-title">
            Manfaat Mengikuti Program Arduflow
          </h2>
          <p className="benefit-desc">
            Setiap bagian dirancang untuk mengubah konsep IoT menjadi kemampuan praktis yang bisa langsung dipakai.
          </p>

          <div className="benefit-card-grid">
            {programBenefits.map((item) => (
              <article className="benefit-card" key={item.title}>
                <span className={`benefit-icon ${item.icon}`} aria-hidden="true" />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="workshop-curriculum" aria-labelledby="kurikulum-title">
        <div className="workshop-curriculum-inner">
          <div className="curriculum-copy">
            <h2 className="curriculum-title" id="kurikulum-title">
              Materi yang Akan Dipelajari
            </h2>
            <p className="curriculum-desc">
              Modul dirancang seperti roadmap praktik: mulai dari dasar Arduino dan IoT,
              mengenal flow programming, sampai evaluasi proyek.
            </p>
            <ul className="curriculum-checklist">
              {curriculumChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="curriculum-module-list" aria-label="Daftar modul dan durasi">
            {curriculumModules.map((item) => (
              <article className="curriculum-module" key={item.title}>
                <h3>{item.title}</h3>
                <span>{item.duration}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="workshop-flow" id="alur-belajar" aria-labelledby="alur-belajar-title">
        <div className="workshop-flow-inner">
          <h2 className="flow-title" id="alur-belajar-title">
            Alur Belajar yang Terstruktur
          </h2>
          <p className="flow-desc">
            Ikuti proses belajar yang jelas dari registrasi sampai presentasi proyek.
          </p>

          <div className="flow-timeline" aria-label="Tahapan alur belajar">
            {learningFlow.map((item) => (
              <article className="flow-step" key={item.number}>
                <span className="flow-number">{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="workshop-ide-access" aria-labelledby="ide-access-title">
        <div className="ide-access-card">
          <div className="ide-access-copy">
            <p className="ide-access-tag">
              <span aria-hidden="true" />
              AKSES TOOLS
            </p>
            <h2 className="ide-access-title" id="ide-access-title">
              Workshop dan Akses Arduflow IDE
            </h2>
            <p className="ide-access-desc">
              Workshop live membantu peserta memahami ulang setiap alur dari materi.
              Setelah itu peserta mendapatkan akses belajar mandiri lewat platform Arduflow IDE.
            </p>
            <a className="ide-access-button" href="/akses">Lihat Cara Pendaftaran</a>
          </div>

          <div className="ide-access-visual" aria-hidden="true">
            <img src={ideAccessFlow} alt="" />
          </div>
        </div>
      </section>

      <section className="workshop-learning-path" aria-labelledby="pilih-jalur-title">
        <div className="learning-path-inner">
          <h2 className="learning-path-title" id="pilih-jalur-title">
            Pilih Jalur Belajar yang Sesuai
          </h2>
          <p className="learning-path-desc">
            Gunakan paket program untuk menyesuaikan pembelajaran dengan kebutuhan dan tingkat kesiapan.
          </p>

          <div className="learning-path-grid">
            {learningPaths.map((item) => (
              <article className={`learning-path-card${item.featured ? ' featured' : ''}`} key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <a className="learning-path-button" href={item.href}>{item.action}</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="workshop-experience" aria-labelledby="pengalaman-belajar-title">
        <div className="experience-inner">
          <div className="experience-copy">
            <h2 className="experience-title" id="pengalaman-belajar-title">
              Pengalaman Belajar Bersama Arduflow
            </h2>
            <p className="experience-desc">
              Cuplikan aktivitas belajar, praktik proyek, dan suasana workshop.
            </p>
          </div>

          <div className="experience-gallery" aria-label="Dokumentasi kegiatan workshop">
            {experienceGallery.map((item) => (
              <figure className={`experience-gallery-card ${item.variant}`} key={item.alt}>
                <img src={item.src} alt={item.alt} />
              </figure>
            ))}
          </div>

          <article className="experience-testimonial">
            <span className="experience-testimonial-icon" aria-hidden="true" />
            <blockquote>
              Materi lebih mudah dipahami karena langsung praktik dan dibantu mentor saat membuat proyek.
            </blockquote>
            <span className="experience-quote-line" aria-hidden="true" />
            <p className="experience-name">Budi Santoso</p>
            <p className="experience-role">Guru Teknik Elektronika</p>
          </article>
        </div>
      </section>

      <section className="workshop-registration" aria-labelledby="cara-daftar-title">
        <div className="registration-inner">
          <h2 className="registration-title" id="cara-daftar-title">
            Cara Mendaftar Program Arduflow
          </h2>
          <p className="registration-desc">
            Alur pendaftaran dibuat singkat agar pengguna bisa langsung memilih program dan mulai belajar.
          </p>

          <div className="registration-step-grid" aria-label="Tahapan pendaftaran program">
            {registrationSteps.map((item) => (
              <article className="registration-step-card" key={item.number}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>

          <div className="registration-actions">
            <a className="registration-button secondary" href="/akses">Mulai Pendaftaran</a>
            <a className="registration-button primary" href="/kontak">Tanyakan Program ke Arduflow</a>
          </div>
        </div>
      </section>

      <section className="workshop-faq" aria-labelledby="faq-title">
        <div className="faq-inner">
          <div className="faq-copy">
            <p className="faq-tag">
              <span aria-hidden="true" />
              FAQ
            </p>
            <h2 className="faq-title" id="faq-title">
              Pertanyaan Umum
            </h2>
            <p className="faq-desc">
              Punya pertanyaan seputar program, akses aplikasi, atau workshop?
              Bagian ini menjawab hal yang paling sering ditanyakan.
            </p>
          </div>

          <div className="faq-list" aria-label="Daftar pertanyaan umum">
            {workshopFaqs.map((question) => (
              <button className="faq-item" type="button" key={question}>
                <span>{question}</span>
                <span className="faq-chevron" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="workshop-final-cta" aria-labelledby="final-cta-title">
        <div className="final-cta-panel">
          <h2 className="final-cta-title" id="final-cta-title">
            Siap Belajar IoT dengan Lebih Terarah?
          </h2>
          <p className="final-cta-desc">
            Daftar program Arduflow untuk mulai belajar Arduino dan IoT melalui visual programming,
            praktik langsung, pendampingan mentor, dan akses Arduflow IDE berbasis token.
          </p>
          <div className="final-cta-actions">
            <a className="final-cta-button primary" href="/akses">Daftar Program Workshop</a>
            <a className="final-cta-button secondary" href="/kontak">Hubungi Tim</a>
          </div>
        </div>
      </section>
    </>
  );
}
