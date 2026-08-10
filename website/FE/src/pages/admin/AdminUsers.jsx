import { AdminPage, AdminTopbar, createSlug } from './AdminChrome.jsx';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import userIcon from '../../assets/icons/icon-user-2.svg';
import mailIcon from '../../assets/icons/icon-mail-1.svg';
import settingsIcon from '../../assets/icons/icon-settings-1.svg';

const summary = [
  { label: 'Total User', value: '1.248', note: 'Semua akun terdaftar', icon: usersIcon },
  { label: 'User Aktif', value: '892', note: '71.6% dari total user', icon: userIcon },
  { label: 'Belum Verifikasi Email', value: '156', note: '12.5% dari total user', icon: mailIcon },
  { label: 'User Baru (7 Hari)', value: '85', note: 'Bergabung dalam 7 hari', icon: usersIcon },
  { label: 'Akun Diblokir / Nonaktif', value: '28', note: '2.2% dari total user', icon: settingsIcon },
];

const users = [
  ['Budi Santoso', 'budisnt', 'budi@example.com', '0812-3456-7890', 'Mahasiswa / ITB', 'Terverifikasi', 'Aktif', '20 Mei 2024', 'Hari ini 09:21'],
  ['Siti Aminah', 'sitia_23', 'siti@example.com', '0813-1111-2222', 'Guru / SMKN 1', 'Belum Verifikasi', 'Aktif', '19 Mei 2024', 'Kemarin 20:15'],
  ['Rudi Kurniawan', 'rudikrn', 'rudi@example.com', '0812-9988-7766', 'Developer / Freelance', 'Terverifikasi', 'Aktif', '18 Mei 2024', 'Hari ini 08:10'],
  ['Dewi Lestari', 'dewilst', 'dewi@example.com', '-', 'Mahasiswa / UGM', 'Belum Verifikasi', 'Nonaktif', '17 Mei 2024', '-'],
  ['Agung Setiawan', 'agungs', 'agung@example.com', '0812-1234-5678', 'Karyawan / Telkom', 'Terverifikasi', 'Diblokir', '16 Mei 2024', '3 hari lalu'],
  ['Nabila Putri', 'nabilap', 'nabila@example.com', '0813-2222-3333', 'Mahasiswa / UI', 'Terverifikasi', 'Aktif', '16 Mei 2024', 'Hari ini 10:02'],
];

const problemItems = [
  ['Email belum verifikasi > 3 hari', 42],
  ['Email verifikasi gagal', 18],
  ['Banyak percobaan login gagal', 9],
  ['WhatsApp kosong / invalid', 33],
];

const activityItems = [
  ['Ahmad Fauzi', 'Login', '10:21 WIB'],
  ['Siti Aminah', 'Update profil', '09:45 WIB'],
  ['Rudi Kurniawan', 'Upload proyek Smart Home', 'Kemarin 21:10'],
  ['Dewi Lestari', 'Daftar workshop IoT untuk Pemula', 'Kemarin 18:30'],
  ['Nabila Putri', 'Request token IDE', 'Kemarin 17:05'],
];

function UserBadge({ children }) {
  return <span className={`admin-users-badge admin-users-badge--${createSlug(children)}`}>{children}</span>;
}

export function AdminUsers() {
  return (
    <AdminPage pageClassName="admin-users-page" ariaLabel="Manajemen user admin">
        <AdminTopbar searchPlaceholder="Cari data user" searchLabel="Cari data user" />

        <div className="admin-users-layout">
          <section className="admin-users-content">
            <div className="admin-users-heading">
              <div>
                <h1>Manajemen User</h1>
                <p>Dashboard <span>/</span> Manajemen User</p>
              </div>
              <button type="button">+ Tambah User</button>
            </div>

            <section className="admin-users-summary" aria-label="Ringkasan user">
              {summary.map((item) => (
                <article className="admin-users-stat" key={item.label}>
                  <span><img src={item.icon} alt="" /></span>
                  <div>
                    <p>{item.label}</p>
                    <strong>{item.value}</strong>
                    <small>{item.note}</small>
                  </div>
                </article>
              ))}
            </section>

            <section className="admin-users-filter" aria-label="Filter user">
              <div className="admin-users-filter-row">
                <label className="admin-users-search">
                  <input type="search" placeholder="Search by nama, email, username, WhatsApp..." />
                </label>
                <button type="button">Reset Filter</button>
                <button type="button">Sembunyikan Filter</button>
              </div>
              <div className="admin-users-select-grid">
                {['Status Email', 'Role', 'Pekerjaan / Instansi', 'Status Akun', 'Tanggal Daftar'].map((label) => (
                  <label key={label}>
                    <span>{label}</span>
                    <select defaultValue="">
                      <option value="">{label === 'Tanggal Daftar' ? 'Pilih tanggal' : 'Semua'}</option>
                    </select>
                  </label>
                ))}
              </div>
            </section>

            <section className="admin-users-toolbar">
              <span>0 dipilih</span>
              <button type="button" className="admin-users-primary">Bulk Action</button>
              <button type="button">Export CSV</button>
              <button type="button">Refresh</button>
            </section>

            <section className="admin-users-table-card">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" aria-label="Pilih semua user" /></th>
                    <th>Nama Lengkap</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>WhatsApp</th>
                    <th>Pekerjaan / Instansi</th>
                    <th>Status Email</th>
                    <th>Status Akun</th>
                    <th>Tgl. Daftar</th>
                    <th>Login Terakhir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user[2]}>
                      <td><input type="checkbox" aria-label={`Pilih ${user[0]}`} /></td>
                      <td><span className="admin-users-avatar" />{user[0]}</td>
                      <td>{user[1]}</td>
                      <td>{user[2]}</td>
                      <td>{user[3]}</td>
                      <td>{user[4]}</td>
                      <td><UserBadge>{user[5]}</UserBadge></td>
                      <td><UserBadge>{user[6]}</UserBadge></td>
                      <td>{user[7]}</td>
                      <td>{user[8]}</td>
                      <td><button type="button" aria-label={`Aksi ${user[0]}`}>⋮</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="admin-users-pagination">
                <span>Menampilkan 1 - 6 dari 1.248 user</span>
                <div>
                  <button type="button">‹</button>
                  <button type="button" className="is-active">1</button>
                  <button type="button">2</button>
                  <button type="button">3</button>
                  <button type="button">208</button>
                  <button type="button">›</button>
                </div>
              </div>
            </section>

            <section className="admin-users-bottom">
              <article className="admin-users-panel">
                <h2>User Bermasalah</h2>
                {problemItems.map(([label, count]) => (
                  <p key={label}><span>{label}</span><strong>{count}</strong></p>
                ))}
                <a href="/admin/users/problems">Lihat semua →</a>
              </article>

              <article className="admin-users-panel">
                <h2>Aktivitas User Terbaru</h2>
                {activityItems.map(([name, action, time]) => (
                  <p key={`${name}-${action}`}><span><b>{name}</b>{action}</span><time>{time}</time></p>
                ))}
                <a href="/admin/users/activity">Lihat semua aktivitas →</a>
              </article>

              <article className="admin-users-panel">
                <h2>Aksi Cepat</h2>
                {['Kirim Ulang Verifikasi ke Semua User Belum Verifikasi', 'Export Semua User', 'Bersihkan User Nonaktif (> 90 hari)', 'Lihat Log Aktivitas User'].map((item) => (
                  <button type="button" key={item}>{item}</button>
                ))}
              </article>
            </section>
          </section>

          <aside className="admin-users-detail" aria-label="Detail user">
            <div className="admin-users-detail-head">
              <h2>Detail User</h2>
              <button type="button" aria-label="Tutup detail">×</button>
            </div>
            <div className="admin-users-detail-profile">
              <span className="admin-users-detail-avatar" />
              <h3>Budi Santoso</h3>
              <p>@budisnt</p>
              <UserBadge>Aktif</UserBadge>
            </div>
            <dl>
              <dt>Email</dt><dd>budi@example.com <UserBadge>Terverifikasi</UserBadge></dd>
              <dt>WhatsApp</dt><dd>0812-3456-7890</dd>
              <dt>Pekerjaan / Instansi</dt><dd>Mahasiswa / ITB</dd>
              <dt>Tanggal Daftar</dt><dd>20 Mei 2024 14:30</dd>
              <dt>Login Terakhir</dt><dd>Hari ini 09:21</dd>
            </dl>
            <div className="admin-users-detail-stats">
              {['12 Proyek', '5 Workshop', '6 Sertifikat', '3 Token IDE'].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <h3>Aktivitas Terbaru</h3>
            <ul>
              {['Login - Hari ini 09:21', 'Update Profil - Kemarin 16:40', 'Upload Proyek - 2 hari lalu', 'Daftar Workshop - 3 hari lalu', 'Request Token IDE - 5 hari lalu'].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button type="button" className="admin-users-detail-button">Lihat Profil Lengkap</button>
          </aside>
        </div>
    </AdminPage>
  );
}
