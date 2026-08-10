import { AdminPage, AdminTopbar, createSlug } from './AdminChrome.jsx';
import bookIcon from '../../assets/icons/icon-book-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import downloadIcon from '../../assets/icons/icon-downloadsim-1.svg';
import mailIcon from '../../assets/icons/icon-mail-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import fileIcon from '../../assets/icons/icon-file-text-1.svg';

const certificateStats = [
  { label: 'Total Sertifikat', value: '1.248', note: 'Semua waktu', icon: fileIcon, tone: 'blue' },
  { label: 'Sertifikat Tersedia', value: '932', note: '74.7% dari total', icon: checkIcon, tone: 'green' },
  { label: 'Menunggu Penerbitan', value: '156', note: '12.5% dari total', icon: clockIcon, tone: 'orange' },
  { label: 'Tidak Lulus', value: '68', note: '5.4% dari total', icon: checkIcon, tone: 'red' },
  { label: 'Sertifikat Diunduh', value: '785', note: '63.0% dari tersedia', icon: downloadIcon, tone: 'blue' },
  { label: 'Error / Gagal Generate', value: '12', note: '1.0% dari total', icon: clockIcon, tone: 'red' },
];

const certificates = [
  ['Dewi Lestari', 'dewi@example.com', 'Sertifikat Workshop IoT Dasar', 'Workshop', 'IoT Dasar dengan Arduino', '18 Mei 2024', '20 Mei 2024', 'AFW-WS-2024-000123', 'Tersedia', '3'],
  ['Rudi Kurniawan', 'rudi@example.com', 'Sertifikat Course Arduino Intermediate', 'Course', 'Arduino Intermediate', '16 Mei 2024', '-', '-', 'Menunggu', '0'],
  ['Siti Aminah', 'siti@example.com', 'Sertifikat Workshop Python for IoT', 'Workshop', 'Python for IoT', '19 Mei 2024', '20 Mei 2024', 'AFW-WS-2024-000124', 'Tersedia', '1'],
  ['Budi Santoso', 'budi@example.com', 'Sertifikat Program Smart Home', 'Program', 'Smart Home System', '10 Mei 2024', '12 Mei 2024', 'AFW-PG-2024-000098', 'Tersedia', '5'],
  ['Nabila Putri', 'nabila@example.com', 'Sertifikat Course Web IoT Dashboard', 'Course', 'Web IoT Dashboard', '17 Mei 2024', '-', '-', 'Tidak Lulus', '0'],
  ['Agung Setiawan', 'agung@example.com', 'Sertifikat Workshop Sensor & Actuator', 'Workshop', 'Sensor & Actuator', '15 Mei 2024', '16 Mei 2024', 'AFW-WS-2024-000121', 'Error', '0'],
  ['Rina Marlina', 'rina@example.com', 'Sertifikat Program IoT Advanced', 'Program', 'IoT Advanced', '12 Mei 2024', '-', '-', 'Menunggu', '0'],
  ['Ahmad Fauzi', 'ahmad@example.com', 'Sertifikat Workshop Cloud IoT', 'Workshop', 'Cloud IoT', '11 Mei 2024', '13 Mei 2024', 'AFW-WS-2024-000120', 'Tersedia', '2'],
];

const pendingItems = [
  ['Rudi Kurniawan', 'Arduino Intermediate', 'Menunggu konfirmasi mentor'],
  ['Rina Marlina', 'IoT Advanced', 'Nilai belum final'],
  ['Nabila Putri', 'Web IoT Dashboard', 'Verifikasi kehadiran'],
  ['Ahmad Fauzi', 'Cloud IoT', 'Menunggu pembayaran'],
];

const problemItems = [
  ['Gagal generate (Error)', 12],
  ['Nomor sertifikat duplikat', 6],
  ['Data user tidak lengkap', 18],
  ['File PDF tidak ditemukan', 9],
];

const activityItems = [
  ['Sertifikat diterbitkan untuk Dewi Lestari', '20 Mei 2024 10:30', 'green'],
  ['Dewi Lestari mengunduh sertifikat', '20 Mei 2024 14:32', 'blue'],
  ['Sertifikat dikirim email ke Siti Aminah', '20 Mei 2024 10:28', 'green'],
  ['Sertifikat dibatalkan untuk Agung Setiawan', '19 Mei 2024 16:20', 'red'],
];

const distributionItems = [
  ['Tersedia', '932 (74.7%)', 'green'],
  ['Menunggu', '156 (12.5%)', 'gray'],
  ['Tidak Lulus', '68 (5.4%)', 'red'],
  ['Error', '12 (1.0%)', 'orange'],
  ['Expired', '80 (6.4%)', 'blue'],
];

function CertificateBadge({ children }) {
  return <span className={`admin-certificates-badge admin-certificates-badge--${createSlug(children)}`}>{children}</span>;
}

function CertificateAction({ label, children }) {
  return (
    <button className="admin-certificates-action" type="button" aria-label={label}>
      {children}
    </button>
  );
}

export function AdminCertificates() {
  return (
    <AdminPage pageClassName="admin-certificates-page" ariaLabel="Sertifikat admin">
        <AdminTopbar searchPlaceholder="Cari sertifikat" searchLabel="Cari sertifikat" />

        <div className="admin-certificates-layout">
          <section className="admin-certificates-content">
            <div className="admin-certificates-heading">
              <div>
                <h1>Sertifikat</h1>
                <p>Dashboard <span>/</span> Sertifikat</p>
              </div>
            </div>

            <section className="admin-certificates-stats" aria-label="Ringkasan sertifikat">
              {certificateStats.map((item) => (
                <article className="admin-certificates-stat" key={item.label}>
                  <span className={`admin-certificates-stat-icon is-${item.tone}`}>
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

            <section className="admin-certificates-filter" aria-label="Filter sertifikat">
              <label className="admin-certificates-search">
                <input type="search" placeholder="Cari nama user, email, atau nomor sertifikat..." />
              </label>
              {['Jenis', 'Status', 'Materi / Program', 'Batch / Kelas'].map((label) => (
                <label key={label}>
                  <span>{label}</span>
                  <select defaultValue="">
                    <option value="">{label === 'Jenis' ? 'Semua Jenis' : label === 'Status' ? 'Semua Status' : label === 'Materi / Program' ? 'Semua Materi' : 'Semua Batch'}</option>
                  </select>
                </label>
              ))}
              <label>
                <span>Tanggal Terbit</span>
                <input type="text" placeholder="Pilih rentang tanggal" />
              </label>
              <label>
                <span>Tanggal Selesai</span>
                <input type="text" placeholder="Pilih rentang tanggal" />
              </label>
              <button type="button">Reset Filter</button>
              <button type="button" className="admin-certificates-primary">Export CSV</button>
            </section>

            <section className="admin-certificates-table-card">
              <table className="admin-certificates-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" aria-label="Pilih semua sertifikat" /></th>
                    <th>Nama User</th>
                    <th>Email</th>
                    <th>Nama Sertifikat</th>
                    <th>Jenis</th>
                    <th>Materi / Program</th>
                    <th>Tgl Selesai</th>
                    <th>Tgl Terbit</th>
                    <th>No. Sertifikat</th>
                    <th>Status</th>
                    <th>Download</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((item) => (
                    <tr key={`${item[1]}-${item[2]}`}>
                      <td><input type="checkbox" aria-label={`Pilih ${item[0]}`} /></td>
                      <td><span className="admin-certificates-avatar" />{item[0]}</td>
                      <td>{item[1]}</td>
                      <td>{item[2]}</td>
                      <td><CertificateBadge>{item[3]}</CertificateBadge></td>
                      <td>{item[4]}</td>
                      <td>{item[5]}</td>
                      <td>{item[6]}</td>
                      <td>{item[7]}</td>
                      <td><CertificateBadge>{item[8]}</CertificateBadge></td>
                      <td>{item[9]}</td>
                      <td>
                        <div className="admin-certificates-actions">
                          <CertificateAction label={`Preview ${item[2]}`}><img src={eyeIcon} alt="" /></CertificateAction>
                          <CertificateAction label={`Download ${item[2]}`}><img src={downloadIcon} alt="" /></CertificateAction>
                          <CertificateAction label={`Kirim email ${item[2]}`}><img src={mailIcon} alt="" /></CertificateAction>
                          <CertificateAction label={`Menu ${item[2]}`}>...</CertificateAction>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="admin-certificates-pagination">
                <span>Menampilkan 1 - 8 dari 1.248 data</span>
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

            <section className="admin-certificates-bottom">
              <article className="admin-certificates-panel">
                <div className="admin-certificates-panel-head">
                  <h2>Menunggu Penerbitan</h2>
                  <a href="/admin/certificates/pending">Lihat semua</a>
                </div>
                <table>
                  <thead><tr><th>User</th><th>Program / Materi</th><th>Alasan</th><th>Aksi</th></tr></thead>
                  <tbody>
                    {pendingItems.map((item) => (
                      <tr key={item[0]}><td>{item[0]}</td><td>{item[1]}</td><td>{item[2]}</td><td><button type="button">Generate</button></td></tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" className="admin-certificates-wide-button">Lihat semua (156)</button>
              </article>

              <article className="admin-certificates-panel admin-certificates-problems">
                <div className="admin-certificates-panel-head">
                  <h2>Sertifikat Bermasalah</h2>
                  <a href="/admin/certificates/problems">Lihat semua</a>
                </div>
                {problemItems.map((item) => (
                  <p key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong></p>
                ))}
                <button type="button" className="admin-certificates-wide-button">Lihat semua (45)</button>
              </article>

              <article className="admin-certificates-panel">
                <div className="admin-certificates-panel-head">
                  <h2>Aktivitas Terbaru</h2>
                  <a href="/admin/certificates/activity">Lihat semua</a>
                </div>
                <div className="admin-certificates-activity">
                  {activityItems.map((item) => (
                    <p key={item[0]}>
                      <span className={`admin-certificates-dot is-${item[2]}`} />
                      <b>{item[0]}</b>
                      <time>{item[1]}</time>
                    </p>
                  ))}
                </div>
                <button type="button" className="admin-certificates-wide-button">Lihat semua aktivitas</button>
              </article>

              <article className="admin-certificates-panel admin-certificates-distribution">
                <div className="admin-certificates-panel-head">
                  <h2>Distribusi Sertifikat</h2>
                </div>
                <div className="admin-certificates-donut"><strong>Total<br />1.248<br />Sertifikat</strong></div>
                <ul>
                  {distributionItems.map((item) => (
                    <li key={item[0]}><span className={`admin-certificates-dot is-${item[2]}`} />{item[0]} <b>{item[1]}</b></li>
                  ))}
                </ul>
              </article>
            </section>

            <section className="admin-certificates-quick">
              <h2>Aksi Cepat</h2>
              <div>
                {['Generate Semua Menunggu', 'Kirim Ulang Email Sertifikat', 'Export Data Sertifikat', 'Cek Nomor Duplikat', 'Bersihkan File Error'].map((item) => (
                  <button type="button" key={item}>{item}</button>
                ))}
              </div>
            </section>
          </section>

          <aside className="admin-certificates-detail" aria-label="Detail sertifikat">
            <div className="admin-certificates-detail-head">
              <h2>Detail Sertifikat</h2>
              <button type="button" aria-label="Tutup detail">x</button>
            </div>
            <div className="admin-certificates-detail-profile">
              <span className="admin-certificates-detail-avatar" />
              <h3>Dewi Lestari</h3>
              <p>dewi@example.com</p>
              <CertificateBadge>Tersedia</CertificateBadge>
            </div>
            <dl>
              <dt>Program / Materi</dt><dd>IoT Dasar dengan Arduino</dd>
              <dt>Jenis</dt><dd>Workshop</dd>
              <dt>Status Kelulusan</dt><dd><CertificateBadge>Lulus</CertificateBadge></dd>
              <dt>Nilai / Progress</dt><dd>92 / 100</dd>
              <dt>Nomor Sertifikat</dt><dd>AFW-WS-2024-000123</dd>
              <dt>Tanggal Selesai</dt><dd>18 Mei 2024</dd>
              <dt>Tanggal Terbit</dt><dd>20 Mei 2024 10:30</dd>
            </dl>
            <section className="admin-certificates-history">
              <h3>Riwayat Download</h3>
              <p><span>20 Mei 2024 14:32</span><b>IP: 103.23.10.5</b></p>
              <p><span>25 Mei 2024 09:11</span><b>IP: 36.81.23.18</b></p>
              <p><span>28 Mei 2024 16:45</span><b>IP: 114.4.21.90</b></p>
              <a href="/admin/certificates/download-history">Lihat semua (3)</a>
            </section>
            <section className="admin-certificates-history">
              <h3>Riwayat Email</h3>
              <p><span>20 Mei 2024 10:31</span><b>Sertifikat dikirim</b></p>
              <p><span>25 Mei 2024 09:12</span><b>Kirim ulang</b></p>
              <a href="/admin/certificates/email-history">Lihat semua (2)</a>
            </section>
            <div className="admin-certificates-detail-actions">
              <button type="button" className="is-blue">Preview Sertifikat</button>
              <button type="button">Download PDF</button>
              <button type="button">Kirim via Email</button>
              <button type="button">Generate Ulang</button>
              <button type="button" className="is-danger">Revoke / Batalkan Sertifikat</button>
            </div>
          </aside>
        </div>
    </AdminPage>
  );
}
