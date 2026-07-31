import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import bookIcon from '../../assets/icons/icon-book-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import arrowIcon from '../../assets/icons/icon-arrow-right-1.svg';
import mapIcon from '../../assets/icons/icon-map-pin-1.svg';

const programStats = [
  { label: 'Total Workshop/Program', value: '48', note: 'Semua program', icon: clockIcon, tone: 'gray' },
  { label: 'Program Aktif', value: '23', note: 'Published & berjalan', icon: checkIcon, tone: 'green' },
  { label: 'Program Draft', value: '8', note: 'Belum dipublish', icon: bookIcon, tone: 'orange' },
  { label: 'Peserta Terdaftar', value: '1.256', note: 'Di semua program', icon: usersIcon, tone: 'blue' },
  { label: 'Kuota Hampir Penuh', value: '6', note: '> 80% kuota terisi', icon: clockIcon, tone: 'red' },
  { label: 'Program Selesai', value: '17', note: 'Selesai / archived', icon: checkIcon, tone: 'purple' },
];

const programs = [
  ['Web Development 101', 'Belajar dasar-dasar web development', 'Web Dev', 'Online', '25 Mei 2024 09:00 - 12:00', 'https://zoom.us/j/123456', '50', '32 (64%)', 'Published', 'Aktif'],
  ['UI/UX Design Essentials', 'Desain UI/UX untuk pemula', 'Desain', 'Online', '28 Mei 2024 13:00 - 16:00', 'https://zoom.us/j/789012', '30', '28 (93%)', 'Published', 'Aktif'],
  ['Arduino & IoT Basics', 'Pengenalan Arduino dan IoT', 'IoT', 'Offline', '1 Jun 2024 09:00 - 15:00', 'Lab Arduflow, Jakarta', '40', '18 (45%)', 'Draft', 'Belum'],
  ['Python for Beginners', 'Belajar Python dari nol', 'Programming', 'Online', '5 Jun 2024 19:00 - 21:00', 'https://zoom.us/j/334455', '60', '60 (100%)', 'Published', 'Aktif'],
  ['Data Science Basic', 'Pengenalan data science', 'Data Science', 'Hybrid', '8 Jun 2024 09:00 - 14:00', 'Jakarta / https://zoom.us/j/556677', '40', '35 (88%)', 'Sedang Berlangsung', 'Aktif'],
  ['Mobile App Development', 'Membuat aplikasi mobile', 'Mobile Dev', 'Online', '15 Jun 2024 09:00 - 12:00', '-', '30', '0 (0%)', 'Dibatalkan', '-'],
];

const upcomingPrograms = [
  ['Web Development 101', '25 Mei 2024', '32 / 50', 'Aman'],
  ['UI/UX Design Essentials', '28 Mei 2024', '28 / 30', 'Hampir Penuh'],
  ['Arduino & IoT Basics', '1 Jun 2024', '18 / 40', 'Aman'],
  ['Python for Beginners', '5 Jun 2024', '60 / 60', 'Penuh'],
  ['Data Science Basic', '8 Jun 2024', '35 / 40', 'Hampir Penuh'],
];

const participants = [
  ['Dewi Lestari', 'Web Development 101', '20 Mei 2024 14:30', 'Lunas'],
  ['Budi Santoso', 'UI/UX Design Essentials', '20 Mei 2024 14:05', 'Lunas'],
  ['Siti Aminah', 'Arduino & IoT Basics', '20 Mei 2024 14:10', 'Lunas'],
  ['Rudi Kurniawan', 'Python for Beginners', '20 Mei 2024 13:58', 'Menunggu'],
  ['Nabila Putri', 'Data Science Basic', '20 Mei 2024 13:40', 'Lunas'],
];

const programProblems = [
  ['Link Zoom kosong', 3],
  ['Kuota penuh', 2],
  ['Belum punya mentor', 4],
  ['Sertifikat belum disiapkan', 5],
  ['Jadwal bentrok', 1],
];

function AdminProgramTopbar() {
  return (
    <header className="admin-dashboard-topbar">
      <label className="admin-dashboard-search">
        <span aria-hidden="true" />
        <input type="search" placeholder="Cari workshop / program" aria-label="Cari workshop atau program" />
      </label>
      <div className="admin-dashboard-account">
        <button className="admin-dashboard-notif" type="button" aria-label="Notifikasi">
          <img src={bellIcon} alt="" />
        </button>
        <span className="admin-dashboard-avatar" aria-hidden="true" />
        <span>
          <strong>Admin</strong>
          <small>Super Admin</small>
        </span>
      </div>
    </header>
  );
}

function ProgramBadge({ children }) {
  const slug = String(children).toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
  return <span className={`admin-program-badge admin-program-badge--${slug}`}>{children}</span>;
}

function ProgramAction({ label, children }) {
  return (
    <button className="admin-program-action" type="button" aria-label={label}>
      {children}
    </button>
  );
}

export function AdminProgram() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialAdminSidebarCollapsed);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistAdminSidebarCollapsed(nextValue);
      return nextValue;
    });
  };

  return (
    <main className={`admin-dashboard-page admin-program-page${isSidebarCollapsed ? ' admin-dashboard-page--collapsed' : ''}`}>
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={handleToggleSidebar} />

      <section className="admin-dashboard-main" aria-label="Workshop dan program admin">
        <AdminProgramTopbar />

        <div className="admin-program-layout">
          <section className="admin-program-content">
            <div className="admin-program-heading">
              <div>
                <h1>Workshop / Program</h1>
                <p>Dashboard <span>/</span> Workshop / Program</p>
              </div>
            </div>

            <section className="admin-program-stats" aria-label="Ringkasan workshop program">
              {programStats.map((item) => (
                <article className="admin-program-stat" key={item.label}>
                  <span className={`admin-program-stat-icon is-${item.tone}`}>
                    <img src={item.icon} alt="" />
                  </span>
                  <div>
                    <p>{item.label}</p>
                    <strong>{item.value}</strong>
                    <small>{item.note}</small>
                  </div>
                </article>
              ))}
            </section>

            <section className="admin-program-filter" aria-label="Filter workshop program">
              <div className="admin-program-filter-top">
                <label className="admin-program-search">
                  <input type="search" placeholder="Cari nama program..." />
                </label>
                <button type="button">Reset Filter</button>
                <button type="button" className="admin-program-primary">+ Tambah Program</button>
              </div>
              <div className="admin-program-filter-grid">
                {['Status', 'Metode', 'Kategori', 'Tanggal Mulai', 'Mentor / Pemateri'].map((label) => (
                  <label key={label}>
                    <span>{label}</span>
                    {label === 'Tanggal Mulai' ? (
                      <input type="text" placeholder="Pilih tanggal" />
                    ) : (
                      <select defaultValue="">
                        <option value="">{label === 'Status' ? 'Semua Status' : label === 'Metode' ? 'Semua Metode' : label === 'Kategori' ? 'Semua Kategori' : 'Semua Mentor'}</option>
                      </select>
                    )}
                  </label>
                ))}
              </div>
            </section>

            <section className="admin-program-table-card">
              <table className="admin-program-table">
                <thead>
                  <tr>
                    <th>Nama Workshop / Program</th>
                    <th>Kategori</th>
                    <th>Metode</th>
                    <th>Tanggal Mulai</th>
                    <th>Lokasi / Link</th>
                    <th>Kuota</th>
                    <th>Peserta</th>
                    <th>Status</th>
                    <th>Sertifikat</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {programs.map((program) => (
                    <tr key={program[0]}>
                      <td>
                        <span className="admin-program-thumb" />
                        <span><b>{program[0]}</b><small>{program[1]}</small></span>
                      </td>
                      <td><ProgramBadge>{program[2]}</ProgramBadge></td>
                      <td><ProgramBadge>{program[3]}</ProgramBadge></td>
                      <td>{program[4]}</td>
                      <td>{program[5]}</td>
                      <td>{program[6]}</td>
                      <td>{program[7]}</td>
                      <td><ProgramBadge>{program[8]}</ProgramBadge></td>
                      <td><ProgramBadge>{program[9]}</ProgramBadge></td>
                      <td>
                        <div className="admin-program-actions">
                          <ProgramAction label={`Lihat ${program[0]}`}>
                            <img src={eyeIcon} alt="" />
                          </ProgramAction>
                          <ProgramAction label={`Kelola peserta ${program[0]}`}>User</ProgramAction>
                          <ProgramAction label={`Edit ${program[0]}`}>Edit</ProgramAction>
                          <ProgramAction label={`Sertifikat ${program[0]}`}>Cert</ProgramAction>
                          <ProgramAction label={`Menu ${program[0]}`}>...</ProgramAction>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="admin-program-pagination">
                <span>Menampilkan 1 - 6 dari 48 program</span>
                <div>
                  <button type="button">&lt;</button>
                  <button type="button" className="is-active">1</button>
                  <button type="button">2</button>
                  <button type="button">3</button>
                  <button type="button">8</button>
                  <button type="button">&gt;</button>
                </div>
              </div>
            </section>

            <section className="admin-program-bottom">
              <article className="admin-program-panel">
                <div className="admin-program-panel-head">
                  <h2>Program Mendatang</h2>
                  <a href="/admin/program/upcoming">Lihat semua</a>
                </div>
                {upcomingPrograms.map((item) => (
                  <p key={item[0]}>
                    <span className="admin-program-mini-thumb" />
                    <b>{item[0]}</b>
                    <span>{item[1]}</span>
                    <span>{item[2]}</span>
                    <ProgramBadge>{item[3]}</ProgramBadge>
                  </p>
                ))}
              </article>

              <article className="admin-program-panel">
                <div className="admin-program-panel-head">
                  <h2>Peserta Terbaru</h2>
                  <a href="/admin/program/participants">Lihat semua</a>
                </div>
                {participants.map((item) => (
                  <p key={`${item[0]}-${item[1]}`}>
                    <span className="admin-program-user-dot" />
                    <b>{item[0]}</b>
                    <span>{item[1]}</span>
                    <time>{item[2]}</time>
                    <ProgramBadge>{item[3]}</ProgramBadge>
                  </p>
                ))}
              </article>

              <article className="admin-program-panel admin-program-problems">
                <div className="admin-program-panel-head">
                  <h2>Program Bermasalah</h2>
                  <a href="/admin/program/problems">Lihat semua</a>
                </div>
                {programProblems.map((item) => (
                  <p key={item[0]}>
                    <span>{item[0]}</span>
                    <strong>{item[1]}</strong>
                  </p>
                ))}
              </article>
            </section>

            <section className="admin-program-quick">
              <h2>Aksi Cepat</h2>
              <div>
                {['Buat Program Baru', 'Export Peserta', 'Kirim Reminder H-1', 'Publish Semua Draft Terpilih', 'Generate Sertifikat Program Selesai'].map((item) => (
                  <button type="button" key={item}>{item}</button>
                ))}
              </div>
            </section>
          </section>

          <aside className="admin-program-detail" aria-label="Detail program">
            <div className="admin-program-detail-head">
              <h2>Detail Program</h2>
              <button type="button" aria-label="Tutup detail">x</button>
            </div>
            <div className="admin-program-detail-profile">
              <span className="admin-program-detail-image" />
              <h3>Web Development 101</h3>
              <ProgramBadge>Published</ProgramBadge>
              <p>Belajar dasar-dasar web development</p>
              <ProgramBadge>Web Development</ProgramBadge>
            </div>
            <dl>
              <dt><img src={clockIcon} alt="" />Tanggal & Waktu</dt>
              <dd>25 Mei 2024, 09:00 - 12:00 WIB</dd>
              <dt><img src={mapIcon} alt="" />Metode</dt>
              <dd>Online (Zoom)</dd>
              <dt><img src={arrowIcon} alt="" />Link / Lokasi</dt>
              <dd>https://zoom.us/j/123456</dd>
              <dt><img src={usersIcon} alt="" />Kuota / Peserta</dt>
              <dd>50 / 32 (64%)</dd>
              <dt><img src={usersIcon} alt="" />Mentor / Pemateri</dt>
              <dd>Ahmad Fauzi</dd>
              <dt><img src={bookIcon} alt="" />Sertifikat</dt>
              <dd>Aktif</dd>
            </dl>
            <section className="admin-program-description">
              <h3>Deskripsi Singkat</h3>
              <p>Workshop ini membahas dasar HTML, CSS, dan JavaScript untuk pemula.</p>
            </section>
            <div className="admin-program-detail-actions">
              <button type="button" className="is-blue">Edit Program</button>
              <button type="button">Kelola Peserta</button>
              <button type="button">Kirim Notifikasi</button>
              <button type="button">Generate Sertifikat</button>
              <button type="button" className="is-danger">Batalkan Program</button>
              <button type="button" disabled>Duplikasi Program</button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
