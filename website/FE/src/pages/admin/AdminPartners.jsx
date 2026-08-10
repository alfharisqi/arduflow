import { AdminPage, AdminTopbar, createSlug } from './AdminChrome.jsx';
import calendarIcon from '../../assets/icons/icon-clock-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import globeIcon from '../../assets/icons/icons-globe-1.svg';
import mailIcon from '../../assets/icons/icon-mail-1.svg';
import mapIcon from '../../assets/icons/icon-map-pin-1.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';

const partnerStats = [
  { label: 'Total Partner', value: '128', note: 'Semua partner', icon: usersIcon, tone: 'blue' },
  { label: 'Partner Aktif', value: '76', note: '59.4% dari total', icon: checkIcon, tone: 'green' },
  { label: 'Menunggu Konfirmasi', value: '18', note: '14.1% dari total', icon: calendarIcon, tone: 'orange' },
  { label: 'Kerja Sama Selesai', value: '20', note: '15.6% dari total', icon: calendarIcon, tone: 'gray' },
  { label: 'Tampil di Homepage', value: '24', note: '18.8% dari total', icon: globeIcon, tone: 'blue' },
  { label: 'Lead Kerja Sama Baru', value: '12', note: '30 hari terakhir', icon: usersIcon, tone: 'purple' },
];

const partners = [
  ['SMK Negeri 2 Jakarta', 'Sekolah', 'Budi Santoso', 'Kepala Hubungan', 'budi@smkn2jkt.sch.id', '0812-1234-5678', 'Jakarta', 'Aktif', true, '12 Jun 2024', '20 Mei 2024'],
  ['Universitas Indonesia', 'Universitas', 'Rina Marlina', 'Koordinator Kemitraan', 'rina.martina@ui.ac.id', '0813-9876-5432', 'Depok', 'Aktif', true, '5 Feb 2024', '18 Mei 2024'],
  ['Komunitas IoT Indonesia', 'Komunitas', 'Agung Setiawan', 'Ketua Komunitas', 'agung@iotindonesia.id', '0812-2223-4444', 'Bandung', 'Menunggu', false, '-', '19 Mei 2024'],
  ['PT Tech Partner Solusi', 'Partner IT', 'Dewi Lestari', 'Marketing Manager', 'dewi@techpartner.co.id', '0856-1111-2222', 'Surabaya', 'Aktif', true, '28 Des 2023', '17 Mei 2024'],
  ['Institut Teknologi Bandung', 'Institusi', 'Yoga Pratama', 'Kerja Sama', 'yoga.pratama@itb.ac.id', '0812-5555-6666', 'Bandung', 'Draft', false, '-', '10 Mei 2024'],
  ['Maker Indonesia', 'Komunitas', 'Nabila Putri', 'Admin', 'nabila@makerid.com', '0821-7777-8888', 'Yogyakarta', 'Inactive', false, '11 Mei 2022', '2 Jan 2024'],
  ['SMP Muhammadiyah 1', 'Sekolah', 'Ahmad Fauzi', 'Wakasek', 'ahmad@smpm1.sch.id', '0813-3333-9999', 'Yogyakarta', 'Menunggu', false, '-', '21 Mei 2024'],
  ['EduTech Indonesia', 'Partner IT', 'Rizky Pratama', 'Business Dev', 'rizky@edutech.id', '0822-4444-1212', 'Jakarta', 'Archived', false, '15 Mar 2022', '3 Okt 2023'],
];

const newPartners = [
  ['EduTech Nusantara', '21 Mei 2024'],
  ['Komunitas AI Indonesia', '20 Mei 2024'],
  ['SMK Teknologi Bandung', '19 Mei 2024'],
  ['IoT Makers Jakarta', '18 Mei 2024'],
  ['Politeknik Elektronika Negeri', '17 Mei 2024'],
];

const activePartners = [
  ['PT Tech Partner Solusi', '17 Mei 2024'],
  ['Universitas Gadjah Mada', '15 Mei 2024'],
  ['Komunitas IoT Indonesia', '12 Mei 2024'],
  ['SMK Negeri 2 Jakarta', '12 Mei 2024'],
  ['SMP Kreatif Bandung', '8 Mei 2024'],
];

const followUpPartners = [
  ['Komunitas IoT Indonesia', 'Belum balas email'],
  ['Institut Teknologi Bandung', 'Logo belum dikirim'],
  ['SMP Muhammadiyah 1', 'Data PIC kosong'],
  ['Sekolah Cerdas Indonesia', 'Kontrak belum lengkap'],
  ['Maker Indonesia', 'Follow-up lebih dari 7 hari'],
];

const homepagePartners = [
  ['Universitas Indonesia', 'Featured', '1.2K'],
  ['SMK Negeri 2 Jakarta', 'Featured', '986'],
  ['PT Tech Partner Solusi', '', '720'],
  ['Institut Teknologi Bandung', '', '650'],
  ['Komunitas IoT Indonesia', '', '580'],
];

const draftPartners = [
  ['EduTech Indonesia', 'Draft'],
  ['Politeknik Elektronika Negeri', 'Draft'],
  ['Sekolah Kreatif Digital', 'Draft'],
];

const activities = [
  ['Logo partner "SMK Negeri 2 Jakarta" diubah oleh Ahmad Fauzi', '20 Mei 2024 14:25', 'blue'],
  ['Partner "PT Tech Partner Solusi" status diubah menjadi Aktif', '18 Mei 2024 10:12', 'green'],
  ['Partner "Komunitas IoT Indonesia" ditambahkan oleh Siti Aisyah', '17 Mei 2024 16:30', 'purple'],
  ['Partner "EduTech Indonesia" dipublish di homepage oleh Ahmad Fauzi', '16 Mei 2024 09:45', 'purple'],
];

function PartnerBadge({ children }) {
  const slug = createSlug(children);
  return <span className={`admin-partners-badge admin-partners-badge--${slug}`}>{children}</span>;
}

function PartnerLogo({ index = 0 }) {
  return <span className={`admin-partners-logo is-${index % 6}`} />;
}

function PartnerAction({ label, children }) {
  return (
    <button className="admin-partners-action" type="button" aria-label={label}>
      {children}
    </button>
  );
}

export function AdminPartners() {
  return (
    <AdminPage pageClassName="admin-partners-page" ariaLabel="Partner dan kolaborator admin">
        <AdminTopbar
          searchPlaceholder="Cari partner / kolaborator"
          searchLabel="Cari partner atau kolaborator"
        />

        <div className="admin-partners-layout">
          <section className="admin-partners-content">
            <div className="admin-partners-heading">
              <div>
                <h1>Partner / Kolaborator</h1>
                <p>Dashboard <span>/</span> Partner / Kolaborator</p>
              </div>
            </div>

            <section className="admin-partners-stats" aria-label="Ringkasan partner">
              {partnerStats.map((item) => (
                <article className="admin-partners-stat" key={item.label}>
                  <span className={`admin-partners-stat-icon is-${item.tone}`}>
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

            <section className="admin-partners-filter" aria-label="Filter partner">
              <label className="admin-partners-search">
                <input type="search" placeholder="Cari nama partner / PIC..." />
              </label>
              {['Tipe Partner', 'Status', 'Kota / Lokasi', 'PIC Internal'].map((label) => (
                <label key={label}>
                  <span>{label}</span>
                  <select defaultValue="">
                    <option value="">
                      {label === 'Tipe Partner' ? 'Semua Tipe' : label === 'Status' ? 'Semua Status' : label === 'Kota / Lokasi' ? 'Semua Kota' : 'Semua PIC'}
                    </option>
                  </select>
                </label>
              ))}
              <label>
                <span>Tanggal Mulai Kerja Sama</span>
                <input type="text" placeholder="Pilih rentang tanggal" />
              </label>
              <button type="button">Reset Filter</button>
              <button type="button" className="admin-partners-primary">+ Tambah Partner</button>
            </section>

            <section className="admin-partners-table-card">
              <table className="admin-partners-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" aria-label="Pilih semua partner" /></th>
                    <th>Logo</th>
                    <th>Nama Partner</th>
                    <th>Tipe Partner</th>
                    <th>PIC Partner</th>
                    <th>Kontak / Email</th>
                    <th>Kota</th>
                    <th>Status Kerja Sama</th>
                    <th>Tampil Homepage</th>
                    <th>Tgl Mulai</th>
                    <th>Update Terakhir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((item, index) => (
                    <tr key={item[0]}>
                      <td><input type="checkbox" aria-label={`Pilih ${item[0]}`} /></td>
                      <td><PartnerLogo index={index} /></td>
                      <td>{item[0]}</td>
                      <td>{item[1]}</td>
                      <td><b>{item[2]}</b><small>{item[3]}</small></td>
                      <td><b>{item[4]}</b><small>{item[5]}</small></td>
                      <td>{item[6]}</td>
                      <td><PartnerBadge>{item[7]}</PartnerBadge></td>
                      <td><span className={`admin-partners-homepage${item[8] ? ' is-active' : ''}`}>{item[8] ? 'check' : 'x'}</span></td>
                      <td>{item[9]}</td>
                      <td>{item[10]}</td>
                      <td>
                        <div className="admin-partners-actions">
                          <PartnerAction label={`Preview ${item[0]}`}><img src={eyeIcon} alt="" /></PartnerAction>
                          <PartnerAction label={`Edit ${item[0]}`}>Edit</PartnerAction>
                          <PartnerAction label={`Email ${item[0]}`}><img src={mailIcon} alt="" /></PartnerAction>
                          <PartnerAction label={`Menu ${item[0]}`}>...</PartnerAction>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="admin-partners-pagination">
                <span>Menampilkan 1 - 8 dari 128 partner</span>
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

            <section className="admin-partners-panels">
              <article className="admin-partners-panel">
                <div className="admin-partners-panel-head"><h2>Partner Baru Masuk</h2><a href="/admin/partners/new">Lihat semua</a></div>
                {newPartners.map((item, index) => <p key={item[0]}><PartnerLogo index={index} /><b>{item[0]}</b><time>{item[1]}</time></p>)}
              </article>
              <article className="admin-partners-panel">
                <div className="admin-partners-panel-head"><h2>Partner Aktif Terbaru</h2><a href="/admin/partners/active">Lihat semua</a></div>
                {activePartners.map((item, index) => <p key={item[0]}><span className="admin-partners-dot is-green" /><b>{item[0]}</b><time>{item[1]}</time></p>)}
              </article>
              <article className="admin-partners-panel admin-partners-followup">
                <div className="admin-partners-panel-head"><h2>Partner Perlu Follow-up</h2><a href="/admin/partners/followup">Lihat semua</a></div>
                {followUpPartners.map((item) => <p key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong></p>)}
              </article>
              <article className="admin-partners-panel">
                <div className="admin-partners-panel-head"><h2>Partner Homepage / Featured</h2><a href="/admin/partners/homepage">Lihat semua</a></div>
                {homepagePartners.map((item, index) => <p key={item[0]}><PartnerLogo index={index + 1} /><b>{item[0]}</b><span>{item[1]}</span><time>{item[2]}</time></p>)}
              </article>
              <article className="admin-partners-panel">
                <div className="admin-partners-panel-head"><h2>Draft Belum Publish</h2><a href="/admin/partners/drafts">Lihat semua</a></div>
                {draftPartners.map((item, index) => <p key={item[0]}><span className={`admin-partners-mini-logo is-${index}`} /><b>{item[0]}</b><PartnerBadge>{item[1]}</PartnerBadge></p>)}
                <button type="button">Lihat semua draft</button>
              </article>
            </section>

            <section className="admin-partners-bottom">
              <article className="admin-partners-panel admin-partners-activity">
                <div className="admin-partners-panel-head"><h2>Aktivitas Terbaru</h2><a href="/admin/partners/activity">Lihat semua</a></div>
                {activities.map((item) => <p key={item[0]}><span className={`admin-partners-dot is-${item[2]}`} /><b>{item[0]}</b><time>{item[1]}</time></p>)}
              </article>

              <section className="admin-partners-quick">
                <h2>Aksi Cepat</h2>
                <div>
                  {['Tambah Partner Baru', 'Export Data Partner', 'Kirim Follow-up Massal', 'Cek Data Partner Kosong', 'Reorder Logo Homepage', 'Cek Partner Inactive', 'Cek Kontrak Expired', 'Kompres Semua Logo', 'Template Email Partner', 'Import Data Partner'].map((item) => (
                    <button type="button" key={item}>{item}</button>
                  ))}
                </div>
              </section>
            </section>
          </section>

          <aside className="admin-partners-detail" aria-label="Detail partner">
            <div className="admin-partners-detail-head">
              <h2>Detail Partner</h2>
              <button type="button" aria-label="Tutup detail">x</button>
            </div>
            <div className="admin-partners-detail-profile">
              <PartnerLogo index={0} />
              <div>
                <h3>SMK Negeri 2 Jakarta</h3>
                <PartnerBadge>Aktif</PartnerBadge>
                <p>Sekolah</p>
              </div>
            </div>
            <dl>
              <dt><img src={usersIcon} alt="" />PIC Partner</dt><dd>Budi Santoso<br /><small>Kepala Hubungan</small></dd>
              <dt><img src={mailIcon} alt="" />Email</dt><dd>budi@smkn2jkt.sch.id</dd>
              <dt>WhatsApp</dt><dd>0812-1234-5678</dd>
              <dt><img src={mapIcon} alt="" />Lokasi</dt><dd>Jakarta, DKI Jakarta</dd>
              <dt><img src={globeIcon} alt="" />Website</dt><dd>www.smkn2jkt.sch.id</dd>
              <dt>Sosial Media</dt><dd>Instagram / Facebook / YouTube</dd>
            </dl>
            <section className="admin-partners-description">
              <h3>Deskripsi Kerja Sama</h3>
              <p>Kerja sama dalam pelatihan IoT, workshop Arduino, dan pengetesan siswa di bidang teknologi.</p>
            </section>
            <section className="admin-partners-programs">
              <h3>Program Terkait</h3>
              <div>
                {['Workshop IoT 2024', 'Arduino for School', 'Pelatihan Guru IoT', '+2 lainnya'].map((item) => <span key={item}>{item}</span>)}
              </div>
            </section>
            <section className="admin-partners-history">
              <h3>Riwayat Komunikasi</h3>
              <p><span className="admin-partners-dot is-green" />20 Mei 2024 <b>Email dikirim oleh Admin</b></p>
              <p><span className="admin-partners-dot is-gray" />18 Mei 2024 <b>Meeting online via Zoom</b></p>
              <p><span className="admin-partners-dot is-gray" />10 Mei 2024 <b>Proposal kerja sama dikirim</b></p>
              <a href="/admin/partners/history">Lihat semua riwayat</a>
            </section>
            <div className="admin-partners-detail-actions">
              <button type="button" className="is-blue">Edit Partner</button>
              <button type="button">Ganti Logo</button>
              <button type="button" className="is-green">Tampilkan di Homepage</button>
              <button type="button" className="is-purple">Kirim Email</button>
              <button type="button" className="is-orange">Tandai Featured</button>
              <button type="button" className="is-danger">Arsipkan Partner</button>
            </div>
          </aside>
        </div>
    </AdminPage>
  );
}
