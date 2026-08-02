import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import fileIcon from '../../assets/icons/icon-file-text-1.svg';
import galleryIcon from '../../assets/icons/icon-image-placeholder-1.svg';
import mailIcon from '../../assets/icons/icon-mail-1.svg';
import zapIcon from '../../assets/icons/icon-zap-1.svg';

const projectStats = [
  { label: 'Total Proyek', value: '1.248', note: 'Semua proyek', icon: galleryIcon, tone: 'blue' },
  { label: 'Proyek Published', value: '832', note: '66.7% dari total', icon: checkIcon, tone: 'green' },
  { label: 'Menunggu Review', value: '156', note: '12.5% dari total', icon: clockIcon, tone: 'orange' },
  { label: 'Perlu Revisi / Ditolak', value: '98', note: '7.8% dari total', icon: checkIcon, tone: 'red' },
  { label: 'Total Viewer', value: '24.352', note: 'Semua proyek', icon: eyeIcon, tone: 'blue' },
  { label: 'Proyek Paling Populer', value: 'Smart Home Monitoring', note: 'Viewer: 2.845', icon: zapIcon, tone: 'red' },
];

const projects = [
  ['Smart Home Monitoring', 'Sistem monitoring rumah berbasis IoT', 'Ahmad Fauzi', '@ahmadfauzi', 'IoT', 'Advanced', 'Published', '2.845', '512 / 286', '18 Mei 2024', '20 Mei 2024'],
  ['Penyiraman Tanaman Otomatis', 'Sistem siram otomatis dengan sensor', 'Siti Aisyah', '@sitiaisyah', 'Automation', 'Intermediate', 'Review', '1.234', '244 / 120', '20 Mei 2024', '20 Mei 2024'],
  ['Sistem Keamanan Pintu', 'Keamanan pintu berbasis RFID', 'Rudi Kurniawan', '@rudik', 'Arduino', 'Beginner', 'Revisi', '945', '132 / 64', '19 Mei 2024', '20 Mei 2024'],
  ['Weather Station IoT', 'Stasiun cuaca dengan BME280', 'Dewi Lestari', '@dewilestari', 'Sensor', 'Intermediate', 'Published', '2.156', '398 / 178', '16 Mei 2024', '18 Mei 2024'],
  ['Smart Traffic Light', 'Lampu lalu lintas cerdas', 'Budi Santoso', '@budisantoso', 'Automation', 'Advanced', 'Ditolak', '312', '45 / 19', '17 Mei 2024', '19 Mei 2024'],
  ['Greenhouse Monitoring', 'Monitoring suhu & kelembapan', 'Nabila Putri', '@nabilaputri', 'IoT', 'Intermediate', 'Draft', '0', '0 / 0', '15 Mei 2024', '18 Mei 2024'],
  ['Energy Meter IoT', 'Monitoring energi listrik real-time', 'Agung Setiawan', '@agungsetiawan', 'IoT', 'Advanced', 'Published', '1.890', '276 / 98', '14 Mei 2024', '17 Mei 2024'],
  ['Sistem Parkir Otomatis', 'Parkir otomatis berbasis sensor', 'Rina Marlina', '@rinamarlina', 'Automation', 'Beginner', 'Review', '578', '86 / 32', '20 Mei 2024', '20 Mei 2024'],
];

const reviewProjects = [
  ['Penyiraman Tanaman Otomatis', 'Siti Aisyah', '20 Mei 2024'],
  ['Sistem Parkir Otomatis', 'Rina Marlina', '20 Mei 2024'],
  ['Monitoring Kolam Ikan IoT', 'Irfan Maulana', '19 Mei 2024'],
  ['Smart Trash Bin', 'Maya Indah', '18 Mei 2024'],
];

const popularProjects = [
  ['Smart Home Monitoring', '2.845', '512'],
  ['Weather Station IoT', '2.156', '398'],
  ['Energy Meter IoT', '1.890', '276'],
  ['Penyiraman Tanaman Otomatis', '1.234', '244'],
  ['Greenhouse Monitoring', '1.102', '198'],
];

const problemProjects = [
  ['Thumbnail kosong', 18],
  ['Deskripsi terlalu pendek (< 150 kata)', 23],
  ['File tidak lengkap', 15],
  ['Link rusak', 9],
  ['Belum ada kategori', 7],
];

const activityItems = [
  ['Proyek "Smart Home Monitoring" dipublish', '20 Mei 2024 14:25', 'green'],
  ['Proyek "Sistem Keamanan Pintu" diminta revisi', '19 Mei 2024 11:10', 'blue'],
  ['Proyek "Smart Traffic Light" ditolak', '19 Mei 2024 10:05', 'purple'],
  ['Proyek "Energy Meter IoT" diupdate', '17 Mei 2024 16:30', 'green'],
];

function AdminProjectsTopbar() {
  return (
    <header className="admin-dashboard-topbar">
      <label className="admin-dashboard-search">
        <span aria-hidden="true" />
        <input type="search" placeholder="Cari proyek" aria-label="Cari proyek" />
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

function ProjectBadge({ children }) {
  const slug = String(children).toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
  return <span className={`admin-projects-badge admin-projects-badge--${slug}`}>{children}</span>;
}

function ProjectAction({ label, children, active = false }) {
  return (
    <button className={`admin-projects-action${active ? ' is-active' : ''}`} type="button" aria-label={label}>
      {children}
    </button>
  );
}

export function AdminProjects() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialAdminSidebarCollapsed);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistAdminSidebarCollapsed(nextValue);
      return nextValue;
    });
  };

  return (
    <main className={`admin-dashboard-page admin-projects-page${isSidebarCollapsed ? ' admin-dashboard-page--collapsed' : ''}`}>
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={handleToggleSidebar} />

      <section className="admin-dashboard-main" aria-label="Proyek admin">
        <AdminProjectsTopbar />

        <div className="admin-projects-layout">
          <section className="admin-projects-content">
            <div className="admin-projects-heading">
              <div>
                <h1>Proyek</h1>
                <p>Dashboard <span>/</span> Proyek</p>
              </div>
            </div>

            <section className="admin-projects-stats" aria-label="Ringkasan proyek">
              {projectStats.map((item) => (
                <article className="admin-projects-stat" key={item.label}>
                  <span className={`admin-projects-stat-icon is-${item.tone}`}>
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

            <section className="admin-projects-filter" aria-label="Filter proyek">
              <label className="admin-projects-search">
                <input type="search" placeholder="Cari judul proyek / nama user..." />
              </label>
              {['Status', 'Kategori', 'Level', 'Author / User'].map((label) => (
                <label key={label}>
                  <span>{label}</span>
                  <select defaultValue="">
                    <option value="">
                      {label === 'Status' ? 'Semua Status' : label === 'Kategori' ? 'Semua Kategori' : label === 'Level' ? 'Semua Level' : 'Semua User'}
                    </option>
                  </select>
                </label>
              ))}
              <label>
                <span>Tanggal Upload</span>
                <input type="text" placeholder="Pilih rentang tanggal" />
              </label>
              <button type="button">Reset Filter</button>
            </section>

            <section className="admin-projects-table-card">
              <table className="admin-projects-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" aria-label="Pilih semua proyek" /></th>
                    <th>Judul Proyek</th>
                    <th>Pemilik / User</th>
                    <th>Kategori</th>
                    <th>Level</th>
                    <th>Status</th>
                    <th>Viewer</th>
                    <th>Like / Save</th>
                    <th>Tgl Upload</th>
                    <th>Update Terakhir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((item, index) => (
                    <tr key={item[0]}>
                      <td><input type="checkbox" aria-label={`Pilih ${item[0]}`} /></td>
                      <td>
                        <span className={`admin-projects-thumb is-${index % 5}`} />
                        <span><b>{item[0]}</b><small>{item[1]}</small></span>
                      </td>
                      <td>
                        <span className="admin-projects-avatar" />
                        <span><b>{item[2]}</b><small>{item[3]}</small></span>
                      </td>
                      <td><ProjectBadge>{item[4]}</ProjectBadge></td>
                      <td><ProjectBadge>{item[5]}</ProjectBadge></td>
                      <td><ProjectBadge>{item[6]}</ProjectBadge></td>
                      <td>{item[7]}</td>
                      <td>{item[8]}</td>
                      <td>{item[9]}</td>
                      <td>{item[10]}</td>
                      <td>
                        <div className="admin-projects-actions">
                          <ProjectAction label={`Preview ${item[0]}`}><img src={eyeIcon} alt="" /></ProjectAction>
                          <ProjectAction label={`Edit ${item[0]}`}>Edit</ProjectAction>
                          <ProjectAction label={`Featured ${item[0]}`} active={index === 3}>Star</ProjectAction>
                          <ProjectAction label={`Email ${item[0]}`}><img src={mailIcon} alt="" /></ProjectAction>
                          <ProjectAction label={`Menu ${item[0]}`}>...</ProjectAction>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="admin-projects-pagination">
                <span>Menampilkan 1 - 8 dari 1.248 proyek</span>
                <div>
                  <button type="button">&lt;</button>
                  <button type="button" className="is-active">1</button>
                  <button type="button">2</button>
                  <button type="button">3</button>
                  <button type="button">156</button>
                  <button type="button">&gt;</button>
                </div>
                <select defaultValue="10">
                  <option value="10">10 / halaman</option>
                </select>
              </div>
            </section>

            <section className="admin-projects-bottom">
              <article className="admin-projects-panel">
                <div className="admin-projects-panel-head">
                  <h2>Proyek Menunggu Review</h2>
                  <a href="/admin/projects/review">Lihat semua</a>
                </div>
                {reviewProjects.map((item, index) => (
                  <p key={item[0]}>
                    <span className={`admin-projects-mini-thumb is-${index}`} />
                    <b>{item[0]}</b>
                    <small>{item[1]}</small>
                    <time>{item[2]}</time>
                  </p>
                ))}
              </article>

              <article className="admin-projects-panel">
                <div className="admin-projects-panel-head">
                  <h2>Proyek Populer <small>(30 Hari Terakhir)</small></h2>
                  <a href="/admin/projects/popular">Lihat semua</a>
                </div>
                <table>
                  <thead><tr><th>#</th><th>Judul</th><th>Viewer</th><th>Like</th></tr></thead>
                  <tbody>
                    {popularProjects.map((item, index) => (
                      <tr key={item[0]}><td>{index + 1}</td><td>{item[0]}</td><td>{item[1]}</td><td>{item[2]}</td></tr>
                    ))}
                  </tbody>
                </table>
              </article>

              <article className="admin-projects-panel admin-projects-problems">
                <div className="admin-projects-panel-head">
                  <h2>Proyek Bermasalah</h2>
                  <a href="/admin/projects/problems">Lihat semua</a>
                </div>
                {problemProjects.map((item) => (
                  <p key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong></p>
                ))}
              </article>

              <article className="admin-projects-panel admin-projects-activity">
                <div className="admin-projects-panel-head">
                  <h2>Aktivitas Terbaru</h2>
                  <a href="/admin/projects/activity">Lihat semua</a>
                </div>
                {activityItems.map((item) => (
                  <p key={item[0]}>
                    <span className={`admin-projects-dot is-${item[2]}`} />
                    <b>{item[0]}</b>
                    <time>{item[1]}</time>
                  </p>
                ))}
              </article>
            </section>

            <section className="admin-projects-quick">
              <h2>Aksi Cepat</h2>
              <div>
                {['Buat Proyek Unggulan Baru', 'Export Data Proyek', 'Cek Link Rusak', 'Publish Proyek Terpilih', 'Bersihkan Draft Lama', 'Reorder Featured Project'].map((item) => (
                  <button type="button" key={item}>{item}</button>
                ))}
              </div>
            </section>
          </section>

          <aside className="admin-projects-detail" aria-label="Detail proyek">
            <div className="admin-projects-detail-head">
              <h2>Detail Proyek</h2>
              <button type="button" aria-label="Tutup detail">x</button>
            </div>
            <div className="admin-projects-detail-profile">
              <span className="admin-projects-detail-image" />
              <div>
                <h3>Smart Home Monitoring</h3>
                <ProjectBadge>Published</ProjectBadge>
                <p><span className="admin-projects-avatar" />Ahmad Fauzi<br /><small>@ahmadfauzi</small></p>
              </div>
            </div>
            <dl>
              <dt>Kategori</dt><dd>IoT</dd>
              <dt>Level</dt><dd>Advanced</dd>
              <dt>Tanggal Upload</dt><dd>18 Mei 2024, 10:32</dd>
              <dt>Update Terakhir</dt><dd>20 Mei 2024, 14:25</dd>
              <dt>Deskripsi Singkat</dt>
              <dd>Proyek IoT untuk memonitor suhu, kelembapan, dan status perangkat rumah secara real-time melalui dashboard web.</dd>
            </dl>
            <section className="admin-projects-components">
              <h3>Komponen Utama</h3>
              <div>
                {['ESP32', 'DHT22', 'MQ-2', 'Relay 4CH', 'LCD I2C'].map((item) => <span key={item}>{item}</span>)}
              </div>
            </section>
            <section className="admin-projects-links">
              <h3>Link & Dokumentasi</h3>
              <a href="/admin/projects/docs">GitHub Repository</a>
              <a href="/admin/projects/docs">Dokumentasi (PDF)</a>
              <a href="/admin/projects/docs">Video Demo</a>
            </section>
            <section className="admin-projects-detail-stats">
              <article><span>Viewer</span><strong>2.845</strong></article>
              <article><span>Like</span><strong>512</strong></article>
              <article><span>Save</span><strong>286</strong></article>
            </section>
            <section className="admin-projects-history">
              <h3>Riwayat Review</h3>
              <p><span className="admin-projects-dot is-green" />Dipublish oleh Admin (Budi S.)<br /><small>20 Mei 2024 14:25</small></p>
              <p><span className="admin-projects-dot is-purple" />Revisi diminta: Tambah skematik & foto alat<br /><small>19 Mei 2024 11:10</small></p>
              <p><span className="admin-projects-dot is-orange" />Menunggu review<br /><small>18 Mei 2024 10:05</small></p>
            </section>
            <div className="admin-projects-detail-actions">
              <button type="button" className="is-blue">Preview Proyek</button>
              <button type="button" className="is-green">Publish / Unpublish</button>
              <button type="button" className="is-purple">Minta Revisi</button>
              <button type="button" className="is-orange">Tandai Featured</button>
              <button type="button">Arsipkan</button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
