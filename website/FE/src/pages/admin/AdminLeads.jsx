import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import mailIcon from '../../assets/icons/icon-mail-1.svg';
import messageIcon from '../../assets/icons/icon-message-square-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import phoneIcon from '../../assets/icons/icon-phone-1.svg';

const leadStats = [
  { label: 'Total Lead Masuk', value: '1.248', note: 'Semua waktu', icon: messageIcon, tone: 'blue' },
  { label: 'Lead Baru', value: '158', note: 'Hari ini 24', icon: clockIcon, tone: 'red' },
  { label: 'Sedang Diproses', value: '412', note: '33.0% dari total', icon: mailIcon, tone: 'orange' },
  { label: 'Selesai', value: '521', note: '41.8% dari total', icon: checkIcon, tone: 'green' },
  { label: 'Lead Prioritas', value: '76', note: 'Perlu perhatian', icon: usersIcon, tone: 'red' },
  { label: 'Rata-rata Waktu Respons', value: '4j 32m', note: 'Target < 12 jam', icon: clockIcon, tone: 'purple' },
];

const leads = [
  ['Andi Pratama', 'andi@example.com', '0812-3456-7890', 'Workshop', 'Saya ingin ikut workshop IoT dasar...', 'Tinggi', 'Baru', '-', '20 Mei 2024 10:32', '-'],
  ['Dewi Lestari', 'dewi@example.com', '0813-1111-2222', 'Partner', 'Kami tertarik kerja sama pelatihan...', 'Tinggi', 'Diproses', 'Budi S.', '20 Mei 2024 09:15', '20 Mei 2024 11:20'],
  ['Rudi Kurniawan', 'rudi@example.com', '0812-9988-7766', 'IDE', 'Bagaimana cara mendapatkan token...', 'Normal', 'Menunggu Balasan', 'Siti A.', '19 Mei 2024 16:45', '19 Mei 2024 17:10'],
  ['Siti Aminah', 'siti@example.com', '0813-2222-3333', 'Proyek', 'Saya butuh bantuan untuk project...', 'Normal', 'Diproses', 'Ahmad F.', '19 Mei 2024 14:22', '19 Mei 2024 15:02'],
  ['Budi Santoso', 'budi@example.com', '0812-3456-1111', 'Bantuan', 'Aplikasi tidak bisa login, mohon...', 'Rendah', 'Selesai', 'Dewi L.', '18 Mei 2024 11:08', '18 Mei 2024 13:45'],
  ['Nabila Putri', 'nabila@example.com', '-', 'Lainnya', 'Pertanyaan umum mengenai platform...', 'Rendah', 'Ditolak', 'Budi S.', '18 Mei 2024 10:12', '18 Mei 2024 10:30'],
  ['Agung Setiawan', 'agung@example.com', '0812-7777-8888', 'Workshop', 'Kapan ada workshop advanced IoT?', 'Tinggi', 'Menunggu Balasan', 'Siti A.', '17 Mei 2024 17:55', '17 Mei 2024 18:20'],
  ['Rina Marlina', 'rina@example.com', '0813-9999-0000', 'Partner', 'Kami dari komunitas ingin...', 'Normal', 'Baru', '-', '17 Mei 2024 09:40', '-'],
];

const priorityLeads = [
  ['Dewi Lestari', 'Partner', 'Diproses', 'Batas: 21 Mei 2024 12:00'],
  ['Agung Setiawan', 'Workshop', 'Menunggu', 'Batas: 21 Mei 2024 18:00'],
  ['Rina Marlina', 'Partner', 'Baru', 'Batas: 21 Mei 2024 09:00'],
  ['Andi Pratama', 'Workshop', 'Baru', 'Batas: 21 Mei 2024 10:32'],
];

const activityItems = [
  ['Lead baru dari Andi Pratama', '20 Mei 2024 10:32', 'red'],
  ['Budi Santoso membalas lead Dewi Lestari', '20 Mei 2024 11:20', 'orange'],
  ['Status lead Rudi Kurniawan diubah menjadi Menunggu Balasan', '19 Mei 2024 17:10', 'green'],
  ['Lead Budi Santoso ditandai Selesai', '18 Mei 2024 13:45', 'green'],
];

const leadProblems = [
  ['Belum dibalas > 24 jam', 12],
  ['Email tidak valid', 8],
  ['WhatsApp kosong', 15],
  ['Terindikasi spam', 5],
  ['Tanpa topik / tidak jelas', 7],
];

const conversions = [
  ['Menjadi Peserta', '62 (41%)', 'green'],
  ['Menjadi Partner', '23 (15%)', 'blue'],
  ['Masih Proses', '48 (32%)', 'orange'],
  ['Tidak Konversi', '18 (12%)', 'gray'],
];

function AdminLeadsTopbar() {
  return (
    <header className="admin-dashboard-topbar">
      <label className="admin-dashboard-search">
        <span aria-hidden="true" />
        <input type="search" placeholder="Cari lead / kontak" aria-label="Cari lead atau kontak" />
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

function LeadBadge({ children }) {
  const slug = String(children).toLowerCase().replace(/\s+/g, '-');
  return <span className={`admin-leads-badge admin-leads-badge--${slug}`}>{children}</span>;
}

function LeadAction({ label, children }) {
  return (
    <button className="admin-leads-action" type="button" aria-label={label}>
      {children}
    </button>
  );
}

export function AdminLeads() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialAdminSidebarCollapsed);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistAdminSidebarCollapsed(nextValue);
      return nextValue;
    });
  };

  return (
    <main className={`admin-dashboard-page admin-leads-page${isSidebarCollapsed ? ' admin-dashboard-page--collapsed' : ''}`}>
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={handleToggleSidebar} />

      <section className="admin-dashboard-main" aria-label="Lead dan kontak admin">
        <AdminLeadsTopbar />

        <div className="admin-leads-layout">
          <section className="admin-leads-content">
            <div className="admin-leads-heading">
              <div>
                <h1>Lead / Kontak</h1>
                <p>Dashboard <span>/</span> Lead / Kontak</p>
              </div>
            </div>

            <section className="admin-leads-stats" aria-label="Ringkasan lead kontak">
              {leadStats.map((item) => (
                <article className="admin-leads-stat" key={item.label}>
                  <span className={`admin-leads-stat-icon is-${item.tone}`}>
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

            <section className="admin-leads-filter" aria-label="Filter lead kontak">
              <label className="admin-leads-search">
                <input type="search" placeholder="Cari nama, email, atau WhatsApp..." />
              </label>
              {['Status', 'Topik', 'Prioritas', 'Tanggal Masuk', 'PIC / Penanggung Jawab'].map((label) => (
                <label key={label}>
                  <span>{label}</span>
                  {label === 'Tanggal Masuk' ? (
                    <input type="text" placeholder="Pilih tanggal" />
                  ) : (
                    <select defaultValue="">
                      <option value="">{label === 'Status' ? 'Semua Status' : label === 'Topik' ? 'Semua Topik' : label === 'Prioritas' ? 'Semua Prioritas' : 'Semua PIC'}</option>
                    </select>
                  )}
                </label>
              ))}
              <button type="button">Reset Filter</button>
            </section>

            <section className="admin-leads-table-card">
              <table className="admin-leads-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" aria-label="Pilih semua lead" /></th>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>WhatsApp</th>
                    <th>Topik</th>
                    <th>Pesan Singkat</th>
                    <th>Prioritas</th>
                    <th>Status</th>
                    <th>PIC</th>
                    <th>Tgl Masuk</th>
                    <th>Respons Terakhir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead[1]}>
                      <td><input type="checkbox" aria-label={`Pilih ${lead[0]}`} /></td>
                      <td><span className="admin-leads-avatar" />{lead[0]}</td>
                      <td>{lead[1]}</td>
                      <td>{lead[2]}</td>
                      <td>{lead[3]}</td>
                      <td>{lead[4]}</td>
                      <td><LeadBadge>{lead[5]}</LeadBadge></td>
                      <td><LeadBadge>{lead[6]}</LeadBadge></td>
                      <td>{lead[7]}</td>
                      <td>{lead[8]}</td>
                      <td>{lead[9]}</td>
                      <td>
                        <div className="admin-leads-actions">
                          <LeadAction label={`Lihat ${lead[0]}`}><img src={eyeIcon} alt="" /></LeadAction>
                          <LeadAction label={`Salin ${lead[0]}`}>Copy</LeadAction>
                          <LeadAction label={`Edit ${lead[0]}`}>Edit</LeadAction>
                          <LeadAction label={`Menu ${lead[0]}`}>...</LeadAction>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="admin-leads-pagination">
                <span>Menampilkan 1 - 8 dari 1.248 lead</span>
                <div>
                  <button type="button">&lt;</button>
                  <button type="button" className="is-active">1</button>
                  <button type="button">2</button>
                  <button type="button">3</button>
                  <button type="button">156</button>
                  <button type="button">&gt;</button>
                </div>
              </div>
            </section>

            <section className="admin-leads-bottom">
              <article className="admin-leads-panel">
                <div className="admin-leads-panel-head">
                  <h2>Lead Prioritas</h2>
                  <a href="/admin/leads/priority">Lihat semua</a>
                </div>
                {priorityLeads.map((item) => (
                  <p key={item[0]}>
                    <span className="admin-leads-priority-dot" />
                    <b>{item[0]}</b>
                    <span>{item[1]}</span>
                    <LeadBadge>{item[2]}</LeadBadge>
                    <time>{item[3]}</time>
                  </p>
                ))}
              </article>

              <article className="admin-leads-panel">
                <div className="admin-leads-panel-head">
                  <h2>Aktivitas Terbaru</h2>
                  <a href="/admin/leads/activity">Lihat semua</a>
                </div>
                {activityItems.map((item) => (
                  <p key={item[0]} className="admin-leads-activity-row">
                    <span className={`admin-leads-dot is-${item[2]}`} />
                    <b>{item[0]}</b>
                    <time>{item[1]}</time>
                  </p>
                ))}
              </article>

              <article className="admin-leads-panel admin-leads-problems">
                <div className="admin-leads-panel-head">
                  <h2>Lead Bermasalah</h2>
                  <a href="/admin/leads/problems">Lihat semua</a>
                </div>
                {leadProblems.map((item) => (
                  <p key={item[0]}>
                    <span>{item[0]}</span>
                    <strong>{item[1]}</strong>
                  </p>
                ))}
              </article>

              <article className="admin-leads-panel admin-leads-conversion">
                <div className="admin-leads-panel-head">
                  <h2>Konversi Lead</h2>
                  <span>30 Hari Terakhir</span>
                </div>
                <div className="admin-leads-donut">
                  <strong>Total<br />151<br />Lead</strong>
                </div>
                <ul>
                  {conversions.map((item) => (
                    <li key={item[0]}><span className={`admin-leads-dot is-${item[2]}`} />{item[0]} <b>{item[1]}</b></li>
                  ))}
                </ul>
              </article>
            </section>

            <section className="admin-leads-quick">
              <h2>Aksi Cepat</h2>
              <div>
                {['Export CSV Lead', 'Tandai Semua Spam', 'Assign Lead Baru ke Admin', 'Kirim Template Balasan Workshop', 'Buat Reminder Follow-up', 'Lihat Template Pesan'].map((item) => (
                  <button type="button" key={item}>{item}</button>
                ))}
              </div>
            </section>
          </section>

          <aside className="admin-leads-detail" aria-label="Detail lead">
            <div className="admin-leads-detail-head">
              <h2>Detail Lead</h2>
              <button type="button" aria-label="Tutup detail">x</button>
            </div>
            <div className="admin-leads-detail-profile">
              <span className="admin-leads-detail-avatar">AP</span>
              <h3>Andi Pratama</h3>
              <p>andi@example.com</p>
              <p>0812-3456-7890 <img src={phoneIcon} alt="" /></p>
            </div>
            <dl>
              <dt>Topik</dt><dd><LeadBadge>Workshop</LeadBadge></dd>
              <dt>Status</dt><dd><LeadBadge>Baru</LeadBadge></dd>
              <dt>Prioritas</dt><dd><LeadBadge>Tinggi</LeadBadge></dd>
              <dt>Tanggal Masuk</dt><dd>20 Mei 2024, 10:32</dd>
              <dt>Sumber</dt><dd>Form Kontak Web</dd>
              <dt>PIC</dt><dd>Belum Assign</dd>
            </dl>
            <section className="admin-leads-message">
              <h3>Pesan Masuk</h3>
              <p>Halo Arduflow, saya ingin mendaftar workshop IoT dasar untuk pemula. Mohon informasi jadwal terdekat dan biayanya. Terima kasih.</p>
            </section>
            <section className="admin-leads-note">
              <h3>Catatan Internal</h3>
              <textarea placeholder="Tambah catatan..." />
              <p>Belum ada catatan.</p>
            </section>
            <section className="admin-leads-timeline">
              {['Lead baru masuk - 20 Mei 2024, 10:32', '-', '-'].map((item) => (
                <p key={item}>{item}</p>
              ))}
            </section>
            <div className="admin-leads-detail-actions">
              <button type="button" className="is-blue">Balas Email</button>
              <button type="button" className="is-green">Hubungi WhatsApp</button>
              <button type="button">Assign PIC</button>
              <button type="button" className="is-orange">Tandai Selesai</button>
              <button type="button" className="is-danger">Arsipkan Lead</button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
