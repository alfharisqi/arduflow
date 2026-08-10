import { AdminPage, AdminTopbar, createSlug } from './AdminChrome.jsx';
import mailIcon from '../../assets/icons/icon-mail-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import arrowIcon from '../../assets/icons/icon-arrow-right-1.svg';

const verificationStats = [
  { label: 'Total Belum Verifikasi', value: '156', note: '12.5% dari total user', icon: mailIcon, tone: 'orange' },
  { label: 'Email Terkirim', value: '342', note: 'Hari ini: 28', icon: arrowIcon, tone: 'blue' },
  { label: 'Email Gagal', value: '18', note: 'Hari ini: 3', icon: mailIcon, tone: 'red' },
  { label: 'Token Expired', value: '26', note: 'Perlu tindakan', icon: clockIcon, tone: 'purple' },
  { label: 'Verifikasi Hari Ini', value: '32', note: '+ 8.1% vs kemarin', icon: checkIcon, tone: 'green' },
];

const verificationUsers = [
  ['Dewi Lestari', 'dewilst', 'dewi@example.com', '0812-3456-7890', '20 Mei 2024 14:30', 'Belum Verifikasi', 'Aktif', '20 Mei 2024 14:35'],
  ['Rudi Kurniawan', 'rudikrn', 'rudi@example.com', '0812-9988-7766', '19 Mei 2024 09:12', 'Terkirim', 'Aktif', '19 Mei 2024 09:15'],
  ['Siti Aminah', 'sitia_23', 'siti@example.com', '0813-1111-2222', '19 Mei 2024 08:45', 'Gagal', 'Aktif', '19 Mei 2024 08:46'],
  ['Agung Setiawan', 'agungs', 'agung@example.com', '-', '18 Mei 2024 21:10', 'Gagal', 'Expired', '18 Mei 2024 21:12'],
  ['Nabila Putri', 'nabilap', 'nabila@example.com', '0813-2222-3333', '18 Mei 2024 18:00', 'Belum Verifikasi', 'Expired', '17 Mei 2024 18:02'],
  ['Budi Santoso', 'budisnt', 'budi@example.com', '0812-3456-7890', '18 Mei 2024 15:20', 'Belum Verifikasi', 'Aktif', '-'],
];

const failedEmails = [
  ['siti@example.com', 'SMTP connection failed', '19 Mei 2024 08:46'],
  ['agung@example.com', 'Invalid recipient address', '18 Mei 2024 21:12'],
  ['budi99@example.com', 'Mailbox unavailable', '18 Mei 2024 15:22'],
  ['riani@example.com', 'Timeout connection', '17 Mei 2024 11:09'],
];

const activityItems = [
  ['User baru mendaftar', 'Dewi Lestari (dewi@example.com)', '20 Mei 2024 14:30', 'green'],
  ['Email verifikasi dikirim', 'Dewi Lestari (dewi@example.com)', '20 Mei 2024 14:35', 'blue'],
  ['Email verifikasi gagal', 'Siti Aminah (siti@example.com)', '19 Mei 2024 08:46', 'red'],
  ['User berhasil verifikasi', 'Ahmad Fauzi (ahmad@example.com)', '19 Mei 2024 07:20', 'green'],
  ['User baru mendaftar', 'Rudi Kurniawan (rudi@example.com)', '18 Mei 2024 21:10', 'green'],
];

const detailHistory = [
  ['Email verifikasi terkirim', '20 Mei 2024 14:35', 'blue'],
  ['Email verifikasi terkirim', '20 Mei 2024 14:33', 'blue'],
  ['Email verifikasi gagal', '20 Mei 2024 14:32 - SMTP connection failed', 'red'],
];

function VerificationBadge({ children }) {
  return <span className={`admin-verification-badge admin-verification-badge--${createSlug(children)}`}>{children}</span>;
}

function ActionButton({ label, children }) {
  return (
    <button className="admin-verification-action" type="button" aria-label={label}>
      {children}
    </button>
  );
}

export function AdminVerification() {
  return (
    <AdminPage pageClassName="admin-verification-page" ariaLabel="Verifikasi akun admin">
        <AdminTopbar searchPlaceholder="Cari verifikasi akun" searchLabel="Cari verifikasi akun" />

        <div className="admin-verification-layout">
          <section className="admin-verification-content">
            <div className="admin-verification-heading">
              <div>
                <h1>Verifikasi Akun</h1>
                <p>Dashboard <span>/</span> Verifikasi Akun</p>
              </div>
            </div>

            <section className="admin-verification-stats" aria-label="Ringkasan verifikasi">
              {verificationStats.map((item) => (
                <article className="admin-verification-stat" key={item.label}>
                  <span className={`admin-verification-stat-icon is-${item.tone}`}>
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

            <section className="admin-verification-filter" aria-label="Filter verifikasi akun">
              <label className="admin-verification-search">
                <input type="search" placeholder="Cari nama atau email..." />
              </label>
              <label>
                <span>Status Email</span>
                <select defaultValue="">
                  <option value="">Semua Status</option>
                  <option>Belum Verifikasi</option>
                  <option>Terkirim</option>
                  <option>Gagal</option>
                </select>
              </label>
              <label>
                <span>Tanggal Daftar</span>
                <input type="text" placeholder="Pilih tanggal" />
              </label>
              <label>
                <span>Role User</span>
                <select defaultValue="">
                  <option value="">Semua Role</option>
                  <option>User</option>
                  <option>Admin</option>
                </select>
              </label>
              <button type="button">Reset Filter</button>
            </section>

            <section className="admin-verification-table-card">
              <div className="admin-verification-card-head">
                <h2>Daftar Akun Belum / Menunggu Verifikasi</h2>
              </div>
              <table className="admin-verification-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" aria-label="Pilih semua akun" /></th>
                    <th>Nama User</th>
                    <th>Email</th>
                    <th>WhatsApp</th>
                    <th>Tanggal Daftar</th>
                    <th>Status Email</th>
                    <th>Token Status</th>
                    <th>Waktu Kirim Terakhir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {verificationUsers.map((user) => (
                    <tr key={user[2]}>
                      <td><input type="checkbox" aria-label={`Pilih ${user[0]}`} /></td>
                      <td><span className="admin-verification-avatar" /><span><b>{user[0]}</b><small>{user[1]}</small></span></td>
                      <td>{user[2]}</td>
                      <td>{user[3]}</td>
                      <td>{user[4]}</td>
                      <td><VerificationBadge>{user[5]}</VerificationBadge></td>
                      <td><VerificationBadge>{user[6]}</VerificationBadge></td>
                      <td>{user[7]}</td>
                      <td>
                        <div className="admin-verification-actions">
                          <ActionButton label={`Kirim ulang verifikasi ${user[0]}`}>Kirim</ActionButton>
                          <ActionButton label={`Salin token ${user[0]}`}>Copy</ActionButton>
                          <ActionButton label={`Verifikasi manual ${user[0]}`}>OK</ActionButton>
                          <ActionButton label={`Generate token baru ${user[0]}`}>Token</ActionButton>
                          <ActionButton label={`Lihat detail ${user[0]}`}>
                            <img src={eyeIcon} alt="" />
                          </ActionButton>
                          <ActionButton label={`Menu aksi ${user[0]}`}>...</ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="admin-verification-pagination">
                <span>Menampilkan 1 - 6 dari 156 akun</span>
                <div>
                  <button type="button">&lt;</button>
                  <button type="button" className="is-active">1</button>
                  <button type="button">2</button>
                  <button type="button">3</button>
                  <button type="button">26</button>
                  <button type="button">&gt;</button>
                </div>
              </div>
            </section>

            <section className="admin-verification-bottom">
              <article className="admin-verification-panel">
                <div className="admin-verification-panel-head">
                  <h2>Email Gagal Terkirim</h2>
                  <a href="/admin/verification/failed">Lihat semua</a>
                </div>
                <table>
                  <thead>
                    <tr><th>Email User</th><th>Alasan Error</th><th>Waktu Error</th><th>Aksi</th></tr>
                  </thead>
                  <tbody>
                    {failedEmails.map((item) => (
                      <tr key={item[0]}>
                        <td>{item[0]}</td>
                        <td>{item[1]}</td>
                        <td>{item[2]}</td>
                        <td><button type="button">Retry</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" className="admin-verification-wide-button">Lihat semua email gagal</button>
              </article>

              <article className="admin-verification-panel">
                <div className="admin-verification-panel-head">
                  <h2>Aktivitas Terbaru</h2>
                  <a href="/admin/verification/activity">Lihat semua</a>
                </div>
                <div className="admin-verification-activity">
                  {activityItems.map((item) => (
                    <p key={`${item[0]}-${item[2]}`}>
                      <span className={`admin-verification-dot is-${item[3]}`} />
                      <span><b>{item[0]}</b><small>{item[1]}</small></span>
                      <time>{item[2]}</time>
                    </p>
                  ))}
                </div>
                <button type="button" className="admin-verification-wide-button">Lihat semua aktivitas</button>
              </article>

              <article className="admin-verification-panel admin-verification-quick">
                <h2>Aksi Cepat</h2>
                <button type="button" className="is-blue">
                  <b>Kirim Ulang ke Semua Belum Verifikasi</b>
                  <span>Kirim ulang email verifikasi ke 156 user</span>
                </button>
                <button type="button" className="is-orange">
                  <b>Bersihkan Token Expired</b>
                  <span>Hapus token expired sebanyak 26</span>
                </button>
                <button type="button" className="is-green">
                  <b>Export CSV User Belum Verifikasi</b>
                  <span>Export 156 user ke file CSV</span>
                </button>
              </article>
            </section>
          </section>

          <aside className="admin-verification-detail" aria-label="Detail user verifikasi">
            <div className="admin-verification-detail-head">
              <h2>Detail User</h2>
              <button type="button" aria-label="Tutup detail">x</button>
            </div>
            <div className="admin-verification-detail-profile">
              <span className="admin-verification-detail-avatar" />
              <h3>Dewi Lestari</h3>
              <p>@dewilst</p>
              <VerificationBadge>Belum Verifikasi</VerificationBadge>
            </div>
            <dl>
              <dt>Email</dt>
              <dd>dewi@example.com <VerificationBadge>Belum Verifikasi</VerificationBadge></dd>
              <dt>WhatsApp</dt>
              <dd>0812-3456-7890</dd>
              <dt>Role</dt>
              <dd>User</dd>
              <dt>Tanggal Daftar</dt>
              <dd>20 Mei 2024 14:30</dd>
              <dt>Login Terakhir</dt>
              <dd>-</dd>
            </dl>
            <section className="admin-verification-token">
              <h3>Informasi Verifikasi</h3>
              <p><span>Token Dibuat Pada</span><b>20 Mei 2024 14:31</b></p>
              <p><span>Token Expired Pada</span><b>27 Mei 2024 14:31</b></p>
              <p><span>Jumlah Resend</span><b>2 kali</b></p>
            </section>
            <section className="admin-verification-history">
              <h3>Riwayat Email Verifikasi</h3>
              {detailHistory.map((item) => (
                <p key={`${item[0]}-${item[1]}`}>
                  <span className={`admin-verification-dot is-${item[2]}`} />
                  <span><b>{item[0]}</b><small>{item[1]}</small></span>
                </p>
              ))}
            </section>
            <div className="admin-verification-detail-actions">
              <button type="button" className="is-blue">Kirim Ulang Verifikasi</button>
              <button type="button">Verifikasi Manual</button>
              <button type="button" className="is-danger">Nonaktifkan Akun</button>
            </div>
          </aside>
        </div>
    </AdminPage>
  );
}
