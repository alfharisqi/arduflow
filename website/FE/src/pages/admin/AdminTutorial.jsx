import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import bookIcon from '../../assets/icons/icon-book-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import fileIcon from '../../assets/icons/icon-file-text-1.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import reportIcon from '../../assets/icons/icons-reportchart-1.svg';
import zapIcon from '../../assets/icons/icon-zap-1.svg';

const tutorialStats = [
  { label: 'Total Tutorial', value: '128', note: 'Semua materi', icon: bookIcon, tone: 'blue' },
  { label: 'Tutorial Published', value: '86', note: '67.2% dari total', icon: checkIcon, tone: 'green' },
  { label: 'Draft Belum Publish', value: '28', note: '21.9% dari total', icon: fileIcon, tone: 'orange' },
  { label: 'Total Viewer / Pembaca', value: '18.452', note: 'Semua materi', icon: usersIcon, tone: 'blue' },
  { label: 'Materi Paling Populer', value: 'Dasar Arduino untuk Pemula', note: 'Viewer: 2.845', icon: zapIcon, tone: 'purple' },
  { label: 'Materi Perlu Revisi', value: '15', note: 'Perlu diperiksa', icon: clockIcon, tone: 'red' },
];

const tutorials = [
  ['Dasar Arduino untuk Pemula', 'Pengenalan Arduino dan setup pertama', 'Arduino', 'Beginner', 'Published', 'Ahmad Fauzi', '2.845', '1.924', '10 Mei 2024', '12 Mei 2024', '20 Mei 2024'],
  ['Membaca Sensor Suhu DHT11', 'Tutorial membaca data suhu dan kelembapan', 'Sensor', 'Beginner', 'Published', 'Siti A.', '1.890', '1.210', '8 Mei 2024', '10 Mei 2024', '19 Mei 2024'],
  ['IoT dengan NodeMCU', 'Menghubungkan device ke internet', 'IoT', 'Intermediate', 'Published', 'Rudi K.', '1.754', '876', '5 Mei 2024', '7 Mei 2024', '18 Mei 2024'],
  ['Dasar Web Dashboard IoT', 'Membuat dashboard sederhana', 'Web', 'Intermediate', 'Draft', 'Dewi L.', '0', '0', '18 Mei 2024', '-', '20 Mei 2024'],
  ['Flowchart di Arduflow IDE', 'Mengenal flowchart pada IDE', 'IDE', 'Beginner', 'Draft', 'Budi S.', '0', '0', '17 Mei 2024', '-', '19 Mei 2024'],
  ['Komunikasi Serial Arduino', 'Serial monitor dan komunikasi data', 'Arduino', 'Beginner', 'Archived', 'Ahmad Fauzi', '965', '645', '20 Apr 2024', '22 Apr 2024', '15 Mei 2024'],
  ['Proyek Smart Home Sederhana', 'Membuat sistem kontrol lampu', 'IoT', 'Advanced', 'Published', 'Siti A.', '1.234', '512', '12 Apr 2024', '15 Apr 2024', '10 Mei 2024'],
  ['Integrasi API ke Dashboard', 'Mengambil data dari API eksternal', 'Web', 'Advanced', 'Draft', 'Rudi K.', '0', '0', '19 Mei 2024', '-', '20 Mei 2024'],
];

const popularTutorials = [
  ['Dasar Arduino untuk Pemula', '2.845', '67.6%'],
  ['Membaca Sensor Suhu DHT11', '1.890', '64.0%'],
  ['IoT dengan NodeMCU', '1.754', '50.1%'],
  ['Proyek Smart Home Sederhana', '1.234', '41.5%'],
  ['Komunikasi Serial Arduino', '965', '66.8%'],
];

const draftTutorials = [
  ['Dasar Web Dashboard IoT', 'Dewi L.', '20 Mei 2024'],
  ['Flowchart di Arduflow IDE', 'Budi S.', '19 Mei 2024'],
  ['Integrasi API ke Dashboard', 'Rudi K.', '20 Mei 2024'],
  ['Data Logger dengan SD Card', 'Ahmad F.', '18 Mei 2024'],
  ['MQTT untuk IoT', 'Siti A.', '17 Mei 2024'],
];

const issueItems = [
  ['Thumbnail kosong', 5],
  ['Link rusak', 7],
  ['Belum punya kategori', 3],
  ['Konten terlalu pendek (< 300 kata)', 4],
  ['Belum ada quiz / praktik', 6],
];

const activityItems = [
  ['Tutorial "Dasar Arduino" dipublish', '20 Mei 2024 14:25', 'blue'],
  ['Tutorial "IoT NodeMCU" diupdate', '20 Mei 2024 13:40', 'purple'],
  ['Tutorial "Sensor DHT11" diupdate', '20 Mei 2024 11:15', 'green'],
  ['Tutorial "Dashboard IoT" dibuat (draft)', '20 Mei 2024 10:10', 'orange'],
  ['Tutorial "Komunikasi Serial" diarsipkan', '19 Mei 2024 16:30', 'gray'],
];

function AdminTutorialTopbar() {
  return (
    <header className="admin-dashboard-topbar">
      <label className="admin-dashboard-search">
        <span aria-hidden="true" />
        <input type="search" placeholder="Cari tutorial / materi" aria-label="Cari tutorial atau materi" />
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

function TutorialBadge({ children }) {
  const slug = String(children).toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
  return <span className={`admin-tutorial-badge admin-tutorial-badge--${slug}`}>{children}</span>;
}

function TutorialAction({ label, children }) {
  return (
    <button className="admin-tutorial-action" type="button" aria-label={label}>
      {children}
    </button>
  );
}

export function AdminTutorial() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialAdminSidebarCollapsed);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistAdminSidebarCollapsed(nextValue);
      return nextValue;
    });
  };

  return (
    <main className={`admin-dashboard-page admin-tutorial-page${isSidebarCollapsed ? ' admin-dashboard-page--collapsed' : ''}`}>
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={handleToggleSidebar} />

      <section className="admin-dashboard-main" aria-label="Tutorial dan materi admin">
        <AdminTutorialTopbar />

        <div className="admin-tutorial-layout">
          <section className="admin-tutorial-content">
            <div className="admin-tutorial-heading">
              <div>
                <h1>Tutorial / Materi</h1>
                <p>Dashboard <span>/</span> Tutorial / Materi</p>
              </div>
            </div>

            <section className="admin-tutorial-stats" aria-label="Ringkasan tutorial">
              {tutorialStats.map((item) => (
                <article className="admin-tutorial-stat" key={item.label}>
                  <span className={`admin-tutorial-stat-icon is-${item.tone}`}>
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

            <section className="admin-tutorial-filter" aria-label="Filter tutorial">
              <label className="admin-tutorial-search">
                <input type="search" placeholder="Cari judul tutorial..." />
              </label>
              {['Status', 'Kategori', 'Level', 'Author / Admin'].map((label) => (
                <label key={label}>
                  <span>{label}</span>
                  <select defaultValue="">
                    <option value="">
                      {label === 'Status' ? 'Semua Status' : label === 'Kategori' ? 'Semua Kategori' : label === 'Level' ? 'Semua Level' : 'Semua Author'}
                    </option>
                  </select>
                </label>
              ))}
              <label>
                <span>Tanggal Publish</span>
                <input type="text" placeholder="Pilih rentang tanggal" />
              </label>
              <button type="button">Reset Filter</button>
            </section>

            <div className="admin-tutorial-table-toolbar">
              <button type="button" className="admin-tutorial-primary">+ Tambah Tutorial</button>
            </div>

            <section className="admin-tutorial-table-card">
              <table className="admin-tutorial-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" aria-label="Pilih semua tutorial" /></th>
                    <th>Judul Tutorial</th>
                    <th>Kategori</th>
                    <th>Level</th>
                    <th>Status</th>
                    <th>Author</th>
                    <th>Viewer</th>
                    <th>Selesai</th>
                    <th>Tgl Dibuat</th>
                    <th>Tgl Publish</th>
                    <th>Update Terakhir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {tutorials.map((item, index) => (
                    <tr key={item[0]}>
                      <td><input type="checkbox" aria-label={`Pilih ${item[0]}`} /></td>
                      <td>
                        <span className={`admin-tutorial-thumb is-${index % 4}`} />
                        <span><b>{item[0]}</b><small>{item[1]}</small></span>
                      </td>
                      <td><TutorialBadge>{item[2]}</TutorialBadge></td>
                      <td><TutorialBadge>{item[3]}</TutorialBadge></td>
                      <td><TutorialBadge>{item[4]}</TutorialBadge></td>
                      <td>{item[5]}</td>
                      <td>{item[6]}</td>
                      <td>{item[7]}</td>
                      <td>{item[8]}</td>
                      <td>{item[9]}</td>
                      <td>{item[10]}</td>
                      <td>
                        <div className="admin-tutorial-actions">
                          <TutorialAction label={`Preview ${item[0]}`}><img src={eyeIcon} alt="" /></TutorialAction>
                          <TutorialAction label={`Edit ${item[0]}`}>Edit</TutorialAction>
                          <TutorialAction label={`Statistik ${item[0]}`}><img src={reportIcon} alt="" /></TutorialAction>
                          <TutorialAction label={`Menu ${item[0]}`}>...</TutorialAction>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="admin-tutorial-pagination">
                <span>Menampilkan 1 - 8 dari 128 data</span>
                <div>
                  <button type="button">&lt;</button>
                  <button type="button" className="is-active">1</button>
                  <button type="button">2</button>
                  <button type="button">3</button>
                  <button type="button">16</button>
                  <button type="button">&gt;</button>
                </div>
                <select defaultValue="10">
                  <option value="10">10 / halaman</option>
                </select>
              </div>
            </section>

            <section className="admin-tutorial-bottom">
              <article className="admin-tutorial-panel">
                <div className="admin-tutorial-panel-head">
                  <h2>Tutorial Populer</h2>
                  <a href="/admin/tutorial/popular">Lihat semua</a>
                </div>
                <table>
                  <thead><tr><th>#</th><th>Judul</th><th>Viewer</th><th>Completion Rate</th></tr></thead>
                  <tbody>
                    {popularTutorials.map((item, index) => (
                      <tr key={item[0]}><td>{index + 1}</td><td>{item[0]}</td><td>{item[1]}</td><td>{item[2]}</td></tr>
                    ))}
                  </tbody>
                </table>
              </article>

              <article className="admin-tutorial-panel">
                <div className="admin-tutorial-panel-head">
                  <h2>Draft Perlu Dilanjutkan</h2>
                  <a href="/admin/tutorial/drafts">Lihat semua</a>
                </div>
                <table>
                  <thead><tr><th>Judul</th><th>Author</th><th>Terakhir Diedit</th></tr></thead>
                  <tbody>
                    {draftTutorials.map((item) => (
                      <tr key={item[0]}><td>{item[0]}</td><td>{item[1]}</td><td>{item[2]}</td></tr>
                    ))}
                  </tbody>
                </table>
              </article>

              <article className="admin-tutorial-panel admin-tutorial-issues">
                <div className="admin-tutorial-panel-head">
                  <h2>Materi Bermasalah</h2>
                  <a href="/admin/tutorial/issues">Lihat semua</a>
                </div>
                {issueItems.map((item) => (
                  <p key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong></p>
                ))}
              </article>

              <article className="admin-tutorial-panel admin-tutorial-activity">
                <div className="admin-tutorial-panel-head">
                  <h2>Aktivitas Terbaru</h2>
                  <a href="/admin/tutorial/activity">Lihat semua</a>
                </div>
                {activityItems.map((item) => (
                  <p key={item[0]}>
                    <span className={`admin-tutorial-dot is-${item[2]}`} />
                    <b>{item[0]}</b>
                    <time>{item[1]}</time>
                  </p>
                ))}
              </article>
            </section>

            <section className="admin-tutorial-quick">
              <h2>Aksi Cepat</h2>
              <div>
                {['Buat Tutorial Baru', 'Export Data Tutorial', 'Cek Link Rusak', 'Publish Draft Terpilih', 'Reorder Materi Belajar'].map((item) => (
                  <button type="button" key={item}>{item}</button>
                ))}
              </div>
            </section>
          </section>

          <aside className="admin-tutorial-detail" aria-label="Detail tutorial">
            <div className="admin-tutorial-detail-head">
              <h2>Detail Tutorial</h2>
              <button type="button" aria-label="Tutup detail">x</button>
            </div>
            <div className="admin-tutorial-detail-profile">
              <span className="admin-tutorial-detail-image" />
              <div>
                <h3>Dasar Arduino untuk Pemula</h3>
                <TutorialBadge>Published</TutorialBadge>
              </div>
            </div>
            <dl>
              <dt>Kategori</dt><dd>Arduino</dd>
              <dt>Level</dt><dd>Beginner</dd>
              <dt>Author</dt><dd>Ahmad Fauzi</dd>
              <dt>Deskripsi Singkat</dt>
              <dd>Tutorial ini membahas dasar-dasar Arduino mulai dari pengenalan board, instalasi IDE, hingga upload program pertama.</dd>
            </dl>
            <section className="admin-tutorial-detail-stats">
              <article><span>Viewer</span><strong>2.845</strong></article>
              <article><span>User Selesai</span><strong>1.924</strong></article>
              <article><span>Estimasi Waktu</span><strong>45 menit</strong></article>
              <article><span>Tanggal Publish</span><strong>12 Mei 2024</strong></article>
            </section>
            <section className="admin-tutorial-history">
              <h3>Riwayat Update Terakhir</h3>
              <p>20 Mei 2024 14:25 oleh Ahmad Fauzi</p>
            </section>
            <div className="admin-tutorial-detail-actions">
              <button type="button" className="is-blue">Edit Tutorial</button>
              <button type="button">Preview</button>
              <button type="button" className="is-green">Publish / Unpublish</button>
              <button type="button" className="is-purple">Lihat Statistik</button>
              <button type="button" className="is-orange">Arsipkan Tutorial</button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
