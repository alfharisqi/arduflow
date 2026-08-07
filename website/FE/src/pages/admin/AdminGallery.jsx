import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import cameraIcon from '../../assets/icons/icon-image-placeholder-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import downloadIcon from '../../assets/icons/icon-downloadsim-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import fileIcon from '../../assets/icons/icon-file-text-1.svg';
import galleryIcon from '../../assets/icons/icon-image-placeholder-1.svg';
import mapIcon from '../../assets/icons/icon-map-pin-1.svg';
import workshopMainImage from '../../assets/images/workshop-list-presentation-main.jpg';
import workshopMarketImage from '../../assets/images/workshop-list-presentation-market.jpg';
import workshopSpeakerImage from '../../assets/images/workshop-list-presentation-speaker.jpg';
import workshopGroupImage from '../../assets/images/workshop-experience-group.png';
import workshopStudentImage from '../../assets/images/workshop-experience-student.png';

const galleryImages = [
  workshopMainImage,
  workshopMarketImage,
  workshopSpeakerImage,
  workshopGroupImage,
  workshopStudentImage,
];

const galleryStats = [
  { label: 'Total Media', value: '1.248', note: 'Semua media', icon: cameraIcon, tone: 'blue' },
  { label: 'Foto Published', value: '842', note: '67.6% dari total', icon: checkIcon, tone: 'green' },
  { label: 'Video Published', value: '186', note: '14.9% dari total', icon: galleryIcon, tone: 'blue' },
  { label: 'Draft / Belum Publish', value: '126', note: '10.1% dari total', icon: fileIcon, tone: 'orange' },
  { label: 'Perlu Review', value: '74', note: '5.9% dari total', icon: clockIcon, tone: 'purple' },
  { label: 'Total Viewer Galeri', value: '24.352', note: 'Semua galeri', icon: eyeIcon, tone: 'blue' },
];

const galleryItems = [
  ['Workshop IoT Beginner', 'Pelatihan dasar IoT untuk pemula', 'Foto', 'Workshop', '42', 'Published', '1.245', '18 Mei 2024', '20 Mei 2024', 'Ahmad Fauzi'],
  ['Program Arduflow Goes to School', 'Edukasi IoT di SMK Negeri 2', 'Foto', 'Program', '35', 'Published', '986', '15 Mei 2024', '16 Mei 2024', 'Siti Aisyah'],
  ['Partner Visit - Universitas ABC', 'Kunjungan kerjasama & diskusi', 'Foto', 'Partner', '28', 'Review', '210', '10 Mei 2024', '11 Mei 2024', 'Budi Santoso'],
  ['Komunitas IoT Meet Up #5', 'Gathering & sharing komunitas IoT', 'Video', 'Komunitas', '1', 'Published', '1.532', '8 Mei 2024', '8 Mei 2024', 'Rudi Kurniawan'],
  ['Event Arduino Day 2024', 'Perayaan Arduino Day bersama komunitas', 'Foto', 'Event', '56', 'Published', '2.845', '4 Mei 2024', '5 Mei 2024', 'Ahmad Fauzi'],
  ['Dokumentasi Kelas IDE', 'Kelas penggunaan Arduflow IDE', 'Video', 'Dokumentasi', '3', 'Draft', '0', '30 Apr 2024', '1 Mei 2024', 'Siti Aisyah'],
  ['Bootcamp IoT Advanced', 'Hari ke-1 sampai Hari ke-3', 'Album', 'Workshop', '72', 'Review', '0', '25 Apr 2024', '27 Apr 2024', 'Budi Santoso'],
  ['Expo Inovasi Teknologi', 'Pameran inovasi siswa & mahasiswa', 'Foto', 'Event', '33', 'Archived', '312', '20 Apr 2024', '22 Apr 2024', 'Rudi Kurniawan'],
];

const recentGalleries = [
  ['Dokumentasi Kelas IDE', 'Draft'],
  ['Bootcamp IoT Advanced', '27 Apr 2024'],
  ['Expo Inovasi Teknologi', '22 Apr 2024'],
  ['Gathering Komunitas IoT', '19 Apr 2024'],
];

const reviewMedia = [
  ['Partner Visit - Universitas ABC', 'Thumbnail kosong'],
  ['Video Testimonial Event', 'Video belum diproses'],
  ['Dokumentasi Kelas IDE', 'Deskripsi kosong'],
  ['Bootcamp IoT Advanced', 'File terlalu besar'],
];

const popularGalleries = [
  ['Workshop IoT Beginner', '2.845'],
  ['Event Arduino Day 2024', '2.156'],
  ['Komunitas IoT Meet Up #5', '1.532'],
  ['Program Arduflow Goes to School', '986'],
  ['Partner Visit - Universitas ABC', '720'],
];

const draftGalleries = [
  ['Dokumentasi Kelas IDE', '3 item'],
  ['Video Pembukaan Event', '1 item'],
  ['Kunjungan Industri SMK', '18 item'],
  ['Foto Hari Terakhir Bootcamp', '24 item'],
];

const activities = [
  ['Ahmad Fauzi mengupload 42 foto di "Workshop IoT Beginner"', '20 Mei 2024 14:25', 'blue'],
  ['Siti Aisyah mempublish galeri "Program Arduflow Goes to School"', '16 Mei 2024 10:12', 'blue'],
  ['Budi Santoso mengganti cover "Bootcamp IoT Advanced"', '27 Apr 2024 09:10', 'purple'],
  ['Rudi Kurniawan menghapus 2 foto di "Expo Inovasi Teknologi"', '22 Apr 2024 16:45', 'purple'],
];

const mediaProblems = [
  ['Thumbnail kosong', 12],
  ['File terlalu besar (> 100MB)', 8],
  ['Video belum diproses', 6],
  ['Deskripsi/judul kosong', 15],
  ['Link rusak', 4],
];

function AdminGalleryTopbar() {
  return (
    <header className="admin-dashboard-topbar">
      <div className="admin-dashboard-topbar-spacer" />
      <div className="admin-dashboard-account">
        <button className="admin-dashboard-notif" type="button" aria-label="Notifikasi">
          <img src={bellIcon} alt="" />
          <em>5</em>
        </button>
        <span className="admin-dashboard-avatar" aria-hidden="true" />
        <span>
          <strong>Admin</strong>
          <small>Super Admin</small>
        </span>
        <b aria-hidden="true">⌄</b>
      </div>
    </header>
  );
}

function GalleryBadge({ children }) {
  const slug = String(children).toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
  return <span className={`admin-gallery-badge admin-gallery-badge--${slug}`}>{children}</span>;
}

function GalleryAction({ label, children }) {
  let content = children;

  if (label.startsWith('Edit ')) {
    content = '✎';
  } else if (label.startsWith('Featured ')) {
    content = '☆';
  } else if (label.startsWith('Menu ')) {
    content = '⋮';
  }

  return (
    <button className="admin-gallery-action" type="button" aria-label={label}>
      {content}
    </button>
  );
}

function GalleryThumbnail({ index, className = 'admin-gallery-thumb' }) {
  return (
    <img
      className={`${className} is-${index % galleryImages.length}`}
      src={galleryImages[index % galleryImages.length]}
      alt=""
      aria-hidden="true"
    />
  );
}

export function AdminGallery() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialAdminSidebarCollapsed);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(null);
  const selectedGallery = selectedGalleryIndex !== null ? galleryItems[selectedGalleryIndex] : null;

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistAdminSidebarCollapsed(nextValue);
      return nextValue;
    });
  };

  const handleSelectGallery = (index) => {
    setSelectedGalleryIndex((currentIndex) => (currentIndex === index ? null : index));
  };

  return (
    <main className={`admin-dashboard-page admin-gallery-page${isSidebarCollapsed ? ' admin-dashboard-page--collapsed' : ''}`}>
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={handleToggleSidebar} />

      <section className="admin-dashboard-main" aria-label="Galeri kegiatan admin">
        <AdminGalleryTopbar />

        <div className={`admin-gallery-layout${selectedGallery ? ' admin-gallery-layout--detail-open' : ''}`}>
          <section className="admin-gallery-content">
            <div className="admin-gallery-heading">
              <div>
                <h1>Galeri Kegiatan</h1>
                <p>Dashboard <span>/</span> Galeri Kegiatan</p>
              </div>
            </div>

            <section className="admin-gallery-stats" aria-label="Ringkasan galeri kegiatan">
              {galleryStats.map((item) => (
                <article className="admin-gallery-stat" key={item.label}>
                  <span className={`admin-gallery-stat-icon is-${item.tone}`}>
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

            <section className="admin-gallery-filter" aria-label="Filter galeri">
              <label className="admin-gallery-search">
                <input type="search" placeholder="Cari judul kegiatan / nama file..." />
              </label>
              {['Jenis Media', 'Status', 'Kategori'].map((label) => (
                <label key={label}>
                  <span>{label}</span>
                  <select defaultValue="">
                    <option value="">
                      {label === 'Jenis Media' ? 'Semua Jenis' : label === 'Status' ? 'Semua Status' : 'Semua Kategori'}
                    </option>
                  </select>
                </label>
              ))}
              <label>
                <span>Tanggal Kegiatan</span>
                <input type="text" placeholder="Pilih rentang tanggal" />
              </label>
              <label>
                <span>Upload By</span>
                <select defaultValue=""><option value="">Semua Admin</option></select>
              </label>
              <button type="button">Reset Filter</button>
              <button type="button" className="admin-gallery-primary"><img src={downloadIcon} alt="" /> Upload Media</button>
            </section>

            <section className="admin-gallery-table-card">
              <table className="admin-gallery-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Pilih semua galeri"
                        checked={selectedGalleryIndex !== null}
                        onChange={() => setSelectedGalleryIndex(selectedGalleryIndex === null ? 0 : null)}
                      />
                    </th>
                    <th>Thumbnail</th>
                    <th>Judul Kegiatan</th>
                    <th>Jenis Media</th>
                    <th>Kategori</th>
                    <th>Jumlah Media</th>
                    <th>Status</th>
                    <th>Viewer</th>
                    <th>Tgl Kegiatan</th>
                    <th>Tgl Upload</th>
                    <th>Upload By</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {galleryItems.map((item, index) => (
                    <tr key={item[0]}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Pilih ${item[0]}`}
                          checked={selectedGalleryIndex === index}
                          onChange={() => handleSelectGallery(index)}
                        />
                      </td>
                      <td><GalleryThumbnail index={index} /></td>
                      <td><b>{item[0]}</b><small>{item[1]}</small></td>
                      <td><GalleryBadge>{item[2]}</GalleryBadge></td>
                      <td><GalleryBadge>{item[3]}</GalleryBadge></td>
                      <td>{item[4]}</td>
                      <td><GalleryBadge>{item[5]}</GalleryBadge></td>
                      <td>{item[6]}</td>
                      <td>{item[7]}</td>
                      <td>{item[8]}</td>
                      <td>{item[9]}</td>
                      <td>
                        <div className="admin-gallery-actions">
                          <GalleryAction label={`Preview ${item[0]}`}><img src={eyeIcon} alt="" /></GalleryAction>
                          <GalleryAction label={`Edit ${item[0]}`}>✎</GalleryAction>
                          <GalleryAction label={`Featured ${item[0]}`}>☆</GalleryAction>
                          <GalleryAction label={`Menu ${item[0]}`}>...</GalleryAction>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="admin-gallery-pagination">
                <span>Menampilkan 1 - 8 dari 1.248 data</span>
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

            <section className="admin-gallery-bottom admin-gallery-bottom--top">
              <article className="admin-gallery-panel">
                <div className="admin-gallery-panel-head"><h2>Galeri Terbaru</h2><a href="/admin/gallery/recent">Lihat semua</a></div>
                {recentGalleries.map((item, index) => (
                  <p key={item[0]}><GalleryThumbnail index={index} className="admin-gallery-mini-thumb" /><b>{item[0]}</b><time>{item[1]}</time></p>
                ))}
              </article>

              <article className="admin-gallery-panel admin-gallery-review">
                <div className="admin-gallery-panel-head"><h2>Media Perlu Review</h2><a href="/admin/gallery/review">Lihat semua</a></div>
                {reviewMedia.map((item) => (
                  <p key={item[0]}><span>{item[0]}</span><GalleryBadge>{item[1]}</GalleryBadge></p>
                ))}
              </article>

              <article className="admin-gallery-panel">
                <div className="admin-gallery-panel-head"><h2>Galeri Populer</h2><a href="/admin/gallery/popular">Lihat semua</a></div>
                <table>
                  <tbody>
                    {popularGalleries.map((item, index) => (
                      <tr key={item[0]}><td>{index + 1}</td><td>{item[0]}</td><td>{item[1]}</td></tr>
                    ))}
                  </tbody>
                </table>
              </article>

              <article className="admin-gallery-panel">
                <div className="admin-gallery-panel-head"><h2>Draft Belum Publish</h2><a href="/admin/gallery/drafts">Lihat semua</a></div>
                {draftGalleries.map((item, index) => (
                  <p key={item[0]}><GalleryThumbnail index={index + 1} className="admin-gallery-mini-thumb" /><b>{item[0]}</b><time>{item[1]}</time></p>
                ))}
              </article>
            </section>

            <section className="admin-gallery-bottom admin-gallery-bottom--bottom">
              <article className="admin-gallery-panel admin-gallery-activity">
                <div className="admin-gallery-panel-head"><h2>Aktivitas Terbaru</h2><a href="/admin/gallery/activity">Lihat semua</a></div>
                {activities.map((item) => (
                  <p key={item[0]}><span className={`admin-gallery-dot is-${item[2]}`} /><b>{item[0]}</b><time>{item[1]}</time></p>
                ))}
              </article>

              <article className="admin-gallery-panel admin-gallery-problems">
                <div className="admin-gallery-panel-head"><h2>Media Bermasalah</h2><a href="/admin/gallery/problems">Lihat semua</a></div>
                {mediaProblems.map((item) => (
                  <p key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong></p>
                ))}
              </article>

              <section className="admin-gallery-quick">
                <h2>Aksi Cepat</h2>
                <div>
                  {['Upload Foto / Video', 'Buat Album Baru', 'Kompres Media Besar', 'Publish Draft Terpilih', 'Cek Link Rusak', 'Reorder Galeri Homepage'].map((item) => (
                    <button type="button" key={item}>{item}</button>
                  ))}
                </div>
              </section>
            </section>
          </section>

          {selectedGallery && (
            <aside className="admin-gallery-detail" aria-label="Detail galeri">
              <div className="admin-gallery-detail-head">
                <h2>Detail Galeri</h2>
                <button type="button" aria-label="Tutup detail" onClick={() => setSelectedGalleryIndex(null)}>x</button>
              </div>
              <GalleryThumbnail index={selectedGalleryIndex} className="admin-gallery-detail-image" />
              <div className="admin-gallery-detail-title">
                <h3>{selectedGallery[0]}</h3>
                <GalleryBadge>{selectedGallery[5]}</GalleryBadge>
                <p><span>{selectedGallery[2]}</span><span>{selectedGallery[3]}</span></p>
              </div>
              <dl>
                <dt><img src={clockIcon} alt="" />Tanggal Kegiatan</dt><dd>{selectedGallery[7]}</dd>
                <dt><img src={mapIcon} alt="" />Lokasi</dt><dd>Lab Arduflow, Jakarta</dd>
                <dt><img src={galleryIcon} alt="" />Jumlah Media</dt><dd>{selectedGallery[4]} {selectedGallery[2].toLowerCase()}</dd>
              </dl>
              <section className="admin-gallery-description">
                <h3>Deskripsi</h3>
                <p>Dokumentasi kegiatan workshop dasar IoT untuk pemula. Peserta belajar membuat project IoT sederhana menggunakan Arduino dan sensor.</p>
              </section>
              <section className="admin-gallery-preview">
                <h3>Preview Media</h3>
                <div>
                  <GalleryThumbnail index={0} className="admin-gallery-mini-thumb" />
                  <GalleryThumbnail index={1} className="admin-gallery-mini-thumb" />
                  <GalleryThumbnail index={2} className="admin-gallery-mini-thumb" />
                  <strong>+38</strong>
                </div>
                <a href="/admin/gallery/media">Lihat semua media</a>
              </section>
              <div className="admin-gallery-detail-actions">
                <button type="button" className="is-blue">Edit Galeri</button>
                <button type="button">Preview Galeri</button>
                <button type="button" className="is-green">Publish / Unpublish</button>
                <button type="button" className="is-purple">Atur Cover</button>
                <button type="button" className="is-orange">Tandai Featured</button>
                <button type="button" className="is-danger">Arsipkan</button>
              </div>
            </aside>
          )}
        </div>
      </section>
    </main>
  );
}
