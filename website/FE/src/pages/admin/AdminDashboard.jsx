import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import userIcon from '../../assets/icons/icon-user-2.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import mailIcon from '../../assets/icons/icon-mail-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import cpuIcon from '../../assets/icons/icon-cpu-1.svg';
import messageIcon from '../../assets/icons/icon-message-square-1.svg';
import certificateIcon from '../../assets/icons/icon-downloadsim-1.svg';
import databaseIcon from '../../assets/icons/icons-database-1.svg';

const stats = [
  { label: 'Total User', value: '1.248', trend: '12.5% dari 7 hari lalu', icon: usersIcon, positive: true },
  { label: 'User Aktif', value: '892', trend: '8.7% dari 7 hari lalu', icon: userIcon, positive: true },
  { label: 'Belum Verifikasi Email', value: '12', trend: '7.7% dari 7 hari lalu', icon: mailIcon, positive: false },
  { label: 'Total Workshop/Program', value: '24', trend: '4.3% dari 7 hari lalu', icon: clockIcon, positive: true },
  { label: 'Total Proyek User', value: '156', trend: '11.2% dari 7 hari lalu', icon: cpuIcon, positive: true },
  { label: 'Lead / Kontak Masuk', value: '38', trend: '26.7% dari 7 hari lalu', icon: messageIcon, positive: true },
  { label: 'Sertifikat', value: '325 / 18', trend: 'Tersedia / Menunggu', icon: certificateIcon },
];

const activities = [
  ['User baru mendaftar', 'Budi Santoso (budi@example.com)', '10 menit lalu'],
  ['User login terakhir', 'Dewi Lestari (dewi@example.com)', '15 menit lalu'],
  ['Email verifikasi terkirim', 'siti.aminah@example.com', '32 menit lalu'],
  ['Email verifikasi gagal', 'rudi.k@example.com', '45 menit lalu'],
  ['Update profile user', 'Agung Setiawan', '1 jam lalu'],
  ['Lead baru dari form kontak', 'Andi Pratama - andi@example.com', '1 jam lalu'],
  ['Request token IDE', 'Sarah Wijaya', '2 jam lalu'],
];

const verificationRows = [
  ['1', 'Rizky Ananda', 'rizky@example.com', '20 Mei 2024', 'Terkirim'],
  ['2', 'Nabila Putri', 'nabila@example.com', '20 Mei 2024', 'Terkirim'],
  ['3', 'Muhammad Iqbal', 'iqbal@example.com', '19 Mei 2024', 'Gagal'],
  ['4', 'Adinda Rahma', 'adinda@example.com', '19 Mei 2024', 'Terkirim'],
  ['5', 'Fajar Ramadhan', 'fajar@example.com', '18 Mei 2024', 'Gagal'],
];

const workshopRows = [
  ['Web Development 101', '25 Mei 2024', '32 / 50', 'Online'],
  ['UI/UX Design Essentials', '28 Mei 2024', '18 / 30', 'Online'],
  ['Python for Beginners', '1 Jun 2024', '45 / 60', 'Offline'],
  ['Data Science Basic', '5 Jun 2024', '21 / 40', 'Online'],
  ['Mobile App Development', '8 Jun 2024', '12 / 30', 'Offline'],
];

const leads = [
  ['Andi Pratama', 'andi@example.com', 'Kerjasama', '20 Mei 2024', 'Baru'],
  ['Dewi Lestari', 'dewi@example.com', 'Informasi Program', '20 Mei 2024', 'Baru'],
  ['Budi Santoso', 'budi@example.com', 'Workshop', '19 Mei 2024', 'Diproses'],
  ['Siti Aminah', 'siti@example.com', 'Lainnya', '19 Mei 2024', 'Selesai'],
  ['Rudi Kurniawan', 'rudi@example.com', 'Kerjasama', '18 Mei 2024', 'Diproses'],
];

const logs = [
  ['ERROR', 'Failed to send verification email to rudi.k@example.com', '45 menit lalu'],
  ['ERROR', 'SQLSTATE[HY000] [2002] Connection refused', '1 jam lalu'],
  ['WARNING', 'Token IDE request failed for user ID: 1023', '2 jam lalu'],
];

function AdminMetricCard({ item }) {
  return (
    <article className="admin-metric-card">
      <div className="admin-metric-head">
        <span className="admin-metric-icon">
          <img src={item.icon} alt="" />
        </span>
        <span>{item.label}</span>
      </div>
      <strong>{item.value}</strong>
      <p className={item.positive === false ? 'is-down' : 'is-up'}>
        {item.positive === false ? '↓' : item.positive ? '↑' : ''}
        {item.positive === undefined ? item.trend : ` ${item.trend}`}
      </p>
    </article>
  );
}

function StatusBadge({ children }) {
  const type = String(children).toLowerCase();
  return <span className={`admin-badge admin-badge--${type}`}>{children}</span>;
}

export function AdminDashboard() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialAdminSidebarCollapsed);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistAdminSidebarCollapsed(nextValue);
      return nextValue;
    });
  };

  return (
    <main className={`admin-dashboard-page${isSidebarCollapsed ? ' admin-dashboard-page--collapsed' : ''}`}>
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={handleToggleSidebar} />

      <section className="admin-dashboard-main" aria-label="Admin dashboard">
        <header className="admin-dashboard-topbar">
          <button className="admin-dashboard-menu" type="button" aria-label="Menu">
            <span />
            <span />
            <span />
          </button>
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

        <div className="admin-dashboard-content">
          <div className="admin-dashboard-titlebar">
            <h1>Dashboard</h1>
            <button type="button">7 hari terakhir</button>
          </div>

          <section className="admin-metrics" aria-label="Ringkasan dashboard">
            {stats.map((item) => (
              <AdminMetricCard item={item} key={item.label} />
            ))}
          </section>

          <section className="admin-dashboard-grid">
            <article className="admin-panel admin-panel--activity">
              <div className="admin-panel-head">
                <h2>Aktivitas Terbaru</h2>
              </div>
              <div className="admin-activity-list">
                {activities.map(([title, detail, time]) => (
                  <div className="admin-activity-item" key={`${title}-${detail}`}>
                    <span className="admin-activity-dot" />
                    <span>
                      <strong>{title}</strong>
                      <small>{detail}</small>
                    </span>
                    <time>{time}</time>
                  </div>
                ))}
              </div>
              <button className="admin-panel-button" type="button">Lihat semua aktivitas</button>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-head">
                <h2>Verifikasi Akun</h2>
                <button type="button">Lihat semua</button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr><th>No</th><th>Nama</th><th>Email</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  {verificationRows.map((row) => (
                    <tr key={row[0]}>
                      {row.slice(0, 4).map((cell) => <td key={cell}>{cell}</td>)}
                      <td><StatusBadge>{row[4]}</StatusBadge></td>
                      <td>↗</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="admin-panel-button" type="button">Kelola verifikasi akun</button>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-head">
                <h2>Workshop / Program Mendatang</h2>
                <button type="button">Lihat semua</button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr><th>Program</th><th>Tanggal</th><th>Peserta</th><th>Status</th><th>Aksi</th></tr>
                </thead>
                <tbody>
                  {workshopRows.map((row) => (
                    <tr key={row[0]}>
                      {row.slice(0, 3).map((cell) => <td key={cell}>{cell}</td>)}
                      <td><StatusBadge>{row[3]}</StatusBadge></td>
                      <td>♢</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="admin-panel-button" type="button">Kelola workshop / program</button>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-head">
                <h2>Konten</h2>
              </div>
              <div className="admin-content-tabs">
                <button type="button" className="is-active">Tutorial Terbaru</button>
                <button type="button">Proyek Terbaru</button>
                <button type="button">Draft Belum Publish</button>
              </div>
              {['Membuat REST API dengan Laravel 10', 'Authentication dengan Sanctum', 'Dasar-dasar Tailwind CSS'].map((title, index) => (
                <div className="admin-content-item" key={title}>
                  <span className="admin-image-placeholder" />
                  <span>
                    <strong>{title}</strong>
                    <small>{20 - index * 2} Mei 2024</small>
                  </span>
                  <button type="button">Lihat</button>
                </div>
              ))}
              <button className="admin-panel-button" type="button">Kelola konten</button>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-head">
                <h2>Lead / Kontak Terbaru</h2>
                <button type="button">Lihat semua</button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr><th>Nama</th><th>Email</th><th>Topik</th><th>Tanggal</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {leads.map((row) => (
                    <tr key={`${row[0]}-${row[2]}`}>
                      {row.slice(0, 4).map((cell) => <td key={cell}>{cell}</td>)}
                      <td><StatusBadge>{row[4]}</StatusBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="admin-panel-button" type="button">Kelola lead / kontak</button>
            </article>
          </section>

          <section className="admin-bottom-grid">
            <article className="admin-panel admin-system-panel">
              <div className="admin-panel-head">
                <h2>Sistem</h2>
              </div>
              <div className="admin-system-cards">
                {[
                  ['MySQL', 'Response: 12ms', databaseIcon],
                  ['SQLite (Log/Cache)', 'Size: 48 MB', databaseIcon],
                  ['SMTP / Mailpit', 'Mailpit: http://mailpit:8025', mailIcon],
                ].map(([title, detail, icon]) => (
                  <div className="admin-system-card" key={title}>
                    <img src={icon} alt="" />
                    <strong>{title}</strong>
                    <span><i /> Online</span>
                    <small>{detail}</small>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-panel admin-log-panel">
              <div className="admin-panel-head">
                <h2>Log Error Terbaru</h2>
                <button type="button">Lihat semua log</button>
              </div>
              {logs.map(([level, message, time]) => (
                <div className="admin-log-row" key={message}>
                  <strong className={level === 'WARNING' ? 'is-warning' : ''}>{level}</strong>
                  <span>{message}</span>
                  <time>{time}</time>
                </div>
              ))}
            </article>
          </section>
        </div>
      </section>
    </main>
  );
}
