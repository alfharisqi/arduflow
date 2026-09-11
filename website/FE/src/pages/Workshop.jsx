import { useEffect, useMemo, useState } from 'react';
import aboutArduflowPreview from '../assets/gif/about-arduflow-preview.gif';
import ideAccessFlow from '../assets/gif/ide-access-flow.gif';
import experienceGroup from '../assets/images/workshop-experience-group.png';
import experienceSoldering from '../assets/images/workshop-experience-soldering.jpg';
import experienceStudent from '../assets/images/workshop-experience-student.png';
import workshopHeroDevice from '../assets/images/workshop-hero-device.png';
import { requireUserLoginForAction } from '../utils/authRequired.js';

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

const WORKSHOP_ENDPOINTS = [
  import.meta.env.VITE_WORKSHOP_API_URL?.trim(),
  'https://arduflow.indobilliard.com/apk/uploads/web-arduflow-deploy-alfha/api/workshop-api.php',
  'https://arduflow.indobilliard.com/apk/uploads/web/api/workshop/workshop-api.php',
  typeof window !== 'undefined'
    ? new URL('/api/workshop-api.php', window.location.origin).toString()
    : '',
].filter(Boolean);

function parseWorkshopPayload(row) {
  const source = row?.payload;

  if (source && typeof source === 'object') {
    return source;
  }

  if (typeof source === 'string' && source.trim()) {
    try {
      return JSON.parse(source);
    } catch {
      return {};
    }
  }

  return {};
}

function normalizeWorkshop(row) {
  const payload = parseWorkshopPayload(row);

  return {
    id: row?.id ?? null,
    title: payload.title || row?.title || 'Workshop ArduFlow',
    slug: payload.slug || row?.slug || '',
    summary: payload.summary || 'Pelajari Arduino dan IoT bersama ArduFlow.',
    category: payload.category || row?.category || '',
    type: payload.type || '',
    date: payload.schedule?.date || row?.date || '',
    time: payload.schedule?.time || row?.time || '',
    timezone: payload.schedule?.timezone || row?.timezone || '',
    location: payload.location || row?.location || '',
    status: payload.publication?.status || row?.status || '',
    visibility: payload.publication?.visibility || row?.visibility || 'Publik',
  };
}

function getTodayDateString() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatWorkshopDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) {
    return 'Jadwal belum tersedia';
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getWorkshopDateParts(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) {
    return { dateText: 'Jadwal belum tersedia', dayText: '-' };
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return {
    dateText: new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date),
    dayText: new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
    }).format(date),
  };
}

function getWorkshopDetailHref(workshop) {
  const params = new URLSearchParams();

  if (workshop?.id !== null && workshop?.id !== undefined && String(workshop.id).trim()) {
    params.set('id', String(workshop.id));
  }

  if (workshop?.slug) {
    params.set('slug', String(workshop.slug));
  }

  const query = params.toString();

  return query ? `/workshop/detail?${query}` : '/workshop/detail';
}

const experienceGallery = [
  {
    src: experienceSoldering,
    alt: 'Peserta workshop sedang menyolder komponen Arduino',
    variant: 'soldering',
    caption: 'Mulai belajar hingga membuat proyek Arduino sendiri bersama ArduFlow.',
  },
  {
    src: experienceStudent,
    alt: 'Peserta menampilkan alur Arduflow di ponsel saat praktik IoT',
    variant: 'student',
    caption: 'Gunakan aplikasi ArduFlow dengan mudah untuk membuat dan mengembangkan proyek Arduino.',
  },
  {
    src: experienceGroup,
    alt: 'Kelompok peserta workshop merakit proyek IoT bersama mentor',
    variant: 'group',
    caption: 'Buat proyek dan lakukan praktik langsung dengan bimbingan mentor di ArduFlow.',
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
  {
    question: 'Apa yang akan dipelajari selama workshop?',
    answer:
      'Peserta mempelajari dasar Arduino dan IoT, visual programming, penggunaan node logic, koneksi sensor dan aktuator, pembuatan mini proyek, serta pengujian hasil proyek.',
  },
  {
    question: 'Apakah saya harus memiliki akun untuk mendaftar workshop?',
    answer:
      'Ya. Anda harus memiliki akun dan login terlebih dahulu sebelum dapat melakukan pendaftaran workshop. Akun digunakan untuk transaksi, menyimpan data pendaftaran dan aktivitas workshop Anda.',
  },
  {
    question: 'Apa perbedaan workshop dengan akses ArduFlow IDE?',
    answer:
      'Workshop adalah sesi belajar terarah bersama mentor untuk memahami konsep dan praktik. Akses ArduFlow IDE digunakan untuk melanjutkan latihan, membuat flow, dan belajar mandiri setelah sesi workshop sesuai akses yang diberikan pada program.',
  },
  {
    question: 'Bagaimana jika saya ingin mendaftarkan banyak peserta workshop sekaligus?',
    answer:
      'Jika Anda ingin mendaftarkan peserta dalam jumlah banyak, seperti peserta dari sekolah, perguruan tinggi, perusahaan, komunitas, atau organisasi, Anda tidak perlu melakukan pendaftaran satu per satu. Cukup siapkan file CSV data seluruh peserta yang berisi nama dan email.',
  },
  {
    question: 'Apakah setelah workshop saya masih bisa belajar mandiri?',
    answer:
      'Ya. Alur program memang dibuat agar workshop membantu memahami materi secara langsung, lalu peserta dapat melanjutkan latihan dan eksplorasi proyek melalui ArduFlow IDE menggunakan akses yang diterima.',
  },
  {
    question: 'Apakah peserta mendapatkan sertifikat?',
    answer:
      'Ya. Sertifikat diberikan kepada peserta yang mengikuti rangkaian workshop dan menyelesaikan tugas atau praktik yang ditentukan pada program.',
  },
  {
    question: 'Apakah workshop bisa diadakan untuk sekolah, kampus, atau komunitas?',
    answer:
      'Bisa. Materi, jadwal, dan format kegiatan dapat disesuaikan untuk kebutuhan kelas, praktikum, pelatihan internal, demo, maupun kegiatan komunitas.',
  },
  {
    question: 'Saya masih bingung memilih program. Harus mulai dari mana?',
    answer:
      'Jika belum pernah belajar Arduino atau IoT, mulai dari workshop pemula. Untuk kebutuhan sekolah, kampus, komunitas, atau pelatihan khusus, gunakan halaman kontak agar tim ArduFlow dapat membantu memilih format yang paling sesuai.',
  },
];

export function Workshop() {
  const [activeFaq, setActiveFaq] = useState(0);
  const [workshops, setWorkshops] = useState([]);
  const [isWorkshopLoading, setIsWorkshopLoading] = useState(true);
  const [workshopLoadError, setWorkshopLoadError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadWorkshops() {
      let lastError = null;

      for (const endpoint of WORKSHOP_ENDPOINTS) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          });

          const rawText = await response.text();
          let result;

          try {
            result = rawText ? JSON.parse(rawText) : {};
          } catch {
            throw new Error(`Response workshop bukan JSON. HTTP ${response.status}.`);
          }

          if (!response.ok || !result.success) {
            throw new Error(result.message || `Gagal mengambil workshop. HTTP ${response.status}.`);
          }

          const rows = Array.isArray(result.data?.workshops)
            ? result.data.workshops
            : [];

          if (!isActive) return;

          setWorkshops(rows.map(normalizeWorkshop));
          setWorkshopLoadError('');
          setIsWorkshopLoading(false);
          return;
        } catch (error) {
          lastError = error;
        }
      }

      if (!isActive) return;

      setWorkshops([]);
      setWorkshopLoadError(lastError?.message || 'Gagal mengambil data workshop.');
      setIsWorkshopLoading(false);
    }

    loadWorkshops();

    // Jika admin menambah/mengubah workshop saat halaman ini sedang terbuka,
    // data akan disegarkan otomatis tanpa user harus reload halaman.
    const refreshTimer = window.setInterval(loadWorkshops, 60_000);
    const refreshOnFocus = () => loadWorkshops();
    window.addEventListener('focus', refreshOnFocus);

    return () => {
      isActive = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, []);

  const upcomingWorkshops = useMemo(() => {
    const todayString = getTodayDateString();

    return [...workshops]
      .filter((item) => {
        const status = String(item.status || '').toLowerCase();
        const visibility = String(item.visibility || '').toLowerCase();

        return (
          item.date &&
          item.date >= todayString &&
          status !== 'selesai' &&
          status !== 'draft' &&
          visibility !== 'privat'
        );
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return String(a.time || '').localeCompare(String(b.time || ''));
      })
      .slice(0, 3);
  }, [workshops]);

  const nearestWorkshop = upcomingWorkshops[0] ?? null;

  const registerHref = useMemo(() => {
    const params = new URLSearchParams();

    params.set('category', '3');

    if (nearestWorkshop?.id !== null && nearestWorkshop?.id !== undefined) {
      const workshopId = String(nearestWorkshop.id).trim();

      if (workshopId) {
        params.set('workshop_id', workshopId);
      }
    }

    if (nearestWorkshop?.title) {
      params.set('workshop', String(nearestWorkshop.title));
    }

    return `/kontak?${params.toString()}#form-daftar-workshop`;
  }, [nearestWorkshop]);

  const workshopDetails = useMemo(() => {
    if (isWorkshopLoading) {
      return [
        { label: 'Tanggal', value: 'Memuat jadwal...', sub: 'Workshop terdekat', icon: 'calendar' },
        { label: 'Waktu', value: 'Memuat waktu...', sub: 'Workshop terdekat', icon: 'clock' },
        { label: 'Lokasi', value: 'Memuat lokasi...', sub: 'Workshop terdekat', icon: 'pin' },
      ];
    }

    if (!nearestWorkshop) {
      return [
        { label: 'Tanggal', value: 'Belum tersedia', sub: 'Belum ada workshop mendatang', icon: 'calendar' },
        { label: 'Waktu', value: 'Belum tersedia', sub: 'Jadwal akan diperbarui otomatis', icon: 'clock' },
        { label: 'Lokasi', value: 'Belum tersedia', sub: 'Lokasi akan tampil setelah diterbitkan', icon: 'pin' },
      ];
    }

    const { dateText, dayText } = getWorkshopDateParts(nearestWorkshop.date);
    const workshopTypeText = [nearestWorkshop.type, nearestWorkshop.category]
      .filter(Boolean)
      .join(' · ');

    return [
      {
        label: 'Tanggal',
        value: dateText,
        sub: dayText,
        icon: 'calendar',
      },
      {
        label: 'Waktu',
        value: nearestWorkshop.time || 'Waktu belum tersedia',
        sub: nearestWorkshop.timezone || 'Zona waktu belum tersedia',
        icon: 'clock',
      },
      {
        label: 'Lokasi',
        value: nearestWorkshop.location || 'Lokasi belum tersedia',
        sub: workshopTypeText || nearestWorkshop.title,
        icon: 'pin',
      },
    ];
  }, [isWorkshopLoading, nearestWorkshop]);

  return (
    <main className="workshop-page">
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

            <div className="workshop-info-grid" aria-label="Jadwal workshop terdekat">
              {workshopDetails.map((item) => (
                <article
                  className={`workshop-info-card workshop-info-card-${item.icon}`}
                  key={item.label}
                >
                  <span className={`workshop-icon ${item.icon}`} aria-hidden="true" />
                  <div className="workshop-info-content">
                    <p className="workshop-info-label">{item.label}</p>
                    <div className="workshop-info-value-group">
                      <strong>{item.value}</strong>
                      <span>{item.sub}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="workshop-actions">
              <a className="workshop-button primary" href="/daftar-workshop">
                Lihat Jadwal Workshop
              </a>

              <a
                className="workshop-button secondary"
                href={registerHref}
                onClick={(event) => requireUserLoginForAction(
                  event,
                  registerHref,
                  'Silakan login terlebih dahulu untuk mendaftar workshop. Setelah login, Anda akan diarahkan kembali ke form pendaftaran.',
                )}
              >
                IKUTI WORKSHOP
              </a>
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
            <a className="ide-access-button" href="/tutorial">Lihat Cara Pendaftaran</a>
          </div>

          <div className="ide-access-visual" aria-hidden="true">
            <img src={ideAccessFlow} alt="" />
          </div>
        </div>
      </section>

      <section className="workshop-learning-path" aria-labelledby="workshop-mendatang-title">
        <div className="learning-path-inner">
          <h2 className="learning-path-title" id="workshop-mendatang-title">
            Workshop Terbaru yang Akan Datang
          </h2>
          <p className="learning-path-desc">
            Temukan workshop ArduFlow dengan jadwal terdekat. Informasi workshop diperbarui secara otomatis sesuai jadwal dan data terbaru.
          </p>

          <div className="learning-path-grid" aria-live="polite">
            {isWorkshopLoading &&
              Array.from({ length: 3 }, (_, index) => (
                <article className="learning-path-card is-loading" key={`workshop-loading-${index}`} aria-hidden="true">
                  <span className="learning-path-skeleton short" />
                  <span className="learning-path-skeleton title" />
                  <span className="learning-path-skeleton text" />
                  <span className="learning-path-skeleton button" />
                </article>
              ))}

            {!isWorkshopLoading && workshopLoadError && (
              <div className="learning-path-state" role="status">
                <strong>Workshop belum dapat dimuat.</strong>
                <span>{workshopLoadError}</span>
              </div>
            )}

            {!isWorkshopLoading && !workshopLoadError && upcomingWorkshops.length === 0 && (
              <div className="learning-path-state" role="status">
                <strong>Belum ada workshop mendatang.</strong>
                <span>Workshop baru akan muncul otomatis setelah jadwal diterbitkan.</span>
              </div>
            )}

            {!isWorkshopLoading && !workshopLoadError && upcomingWorkshops.map((item, index) => {
              const detailHref = getWorkshopDetailHref(item);

              return (
                <a
                  className={`learning-path-card learning-path-card-link${index === 0 ? ' featured' : ''}`}
                  href={detailHref}
                  key={item.id ?? item.slug ?? `${item.title}-${item.date}`}
                  aria-label={`Lihat detail workshop ${item.title}`}
                >
                  <div className="learning-path-meta">
                    <span className="learning-path-date">{formatWorkshopDate(item.date)}</span>
                    {index === 0 && <span className="learning-path-nearest">Terdekat</span>}
                  </div>

                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>

                  <div className="learning-path-info">
                    {item.time && (
                      <span>{item.time}{item.timezone ? ` · ${item.timezone}` : ''}</span>
                    )}
                    {item.location && item.location !== '-' && <span>{item.location}</span>}
                    {(item.type || item.category) && (
                      <span>{[item.type, item.category].filter(Boolean).join(' · ')}</span>
                    )}
                  </div>

                  <span className="learning-path-button">
                    Lihat Workshop
                  </span>
                </a>
              );
            })}
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
              <figure className={`experience-gallery-card ${item.variant}`} key={item.alt} tabIndex={0}>
                <img src={item.src} alt={item.alt} />
                <figcaption>{item.caption}</figcaption>
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
            <a className="registration-button secondary" href="/daftar-workshop">Mulai Pendaftaran</a>
            <a className="registration-button primary" href="/kontak">Tanyakan Program ke Arduflow</a>
          </div>
        </div>
      </section>

      <section className="workshop-faq" aria-labelledby="faq-title">
        <div className="faq-inner">
          <div className="faq-card">
            <header className="faq-header">
              <div className="faq-heading-row">
                <span className="faq-star" aria-hidden="true" />
                <div>
                  <p className="faq-eyebrow">FAQ WORKSHOP</p>
                  <h2 className="faq-title" id="faq-title">
                    Pertanyaan Umum
                  </h2>
                </div>
              </div>
              <p className="faq-desc">
                Jawaban singkat untuk hal yang paling sering membuat peserta bingung sebelum mengikuti
                workshop dan menggunakan ArduFlow IDE.
              </p>
            </header>

            <div className="faq-list" aria-label="Daftar pertanyaan umum workshop ArduFlow IDE">
              {workshopFaqs.map((item, index) => {
                const isOpen = activeFaq === index;
                const answerId = `workshop-faq-answer-${index}`;
                const questionId = `workshop-faq-question-${index}`;

                return (
                  <article className={`faq-item${isOpen ? ' is-open' : ''}`} key={item.question}>
                    <button
                      aria-controls={answerId}
                      aria-expanded={isOpen}
                      className="faq-question"
                      id={questionId}
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? -1 : index)}
                    >
                      <span className="faq-question-text">{item.question}</span>
                      <span className="faq-toggle-icon" aria-hidden="true" />
                    </button>

                    <div
                      aria-hidden={!isOpen}
                      aria-labelledby={questionId}
                      className="faq-answer-wrap"
                      id={answerId}
                      role="region"
                    >
                      <div className="faq-answer-inner">
                        <p className="faq-answer">{item.answer}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="faq-help">
              <span>Masih ada yang ingin ditanyakan?</span>
              <a href="/kontak">Hubungi Tim ArduFlow</a>
            </div>
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
            <a className="final-cta-button primary" href="/daftar-workshop">Lihat Jadwal Workshop</a>
            <a className="final-cta-button secondary" href="/kontak">Hubungi Tim</a>
          </div>
        </div>
      </section>
    </main>
  );
}
