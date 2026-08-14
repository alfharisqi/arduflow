import { useEffect, useMemo, useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import certificateIcon from '../../assets/icons/icon-downloadsim-1.svg';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import { ProfileAvatar } from '../../features/profile-image-crop/ProfileAvatar.jsx';
import { apiEndpoint, apiUrl } from '../../services/apiEndpoints.js';
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';

const menuItems = [
  { label: 'Profil', icon: 'user', href: '/dashboard' },
  { label: 'Progres Belajar', icon: 'graduation', href: '/progress-belajar' },
  { label: 'Proyek Saya', icon: 'folder', href: '/proyek-saya' },
  { label: 'Workshop / Program', icon: 'calendar', href: '/workshop-program' },
  { label: 'Transaksi', icon: 'certificate', href: '/transaksi' },
  { label: 'Sertifikat', icon: 'certificate', href: '/sertifikat', active: true },
  { label: 'IDE', icon: 'cpu', href: '/ide' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
];

const CERTIFICATE_API_URL = apiEndpoint(import.meta.env.VITE_CERTIFICATE_API_URL, '/api/certificate-api.php');

function getStoredUser() {
  try {
    const raw = window.localStorage.getItem('arduflow_user');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getInitials(name) {
  return (name || 'Nama Lengkap')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

async function fetchCertificates() {
  const response = await fetch(CERTIFICATE_API_URL, {
    headers: {
      Accept: 'application/json',
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Gagal memuat sertifikat (${response.status}).`);
  }

  const records = payload?.data?.certificates || payload?.certificates || payload?.data || [];
  return Array.isArray(records) ? records : [];
}

function formatCertificateDate(value) {
  if (!value) return 'Tanggal belum diatur';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tanggal belum diatur';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getCertificateStatus(certificate) {
  const status = String(certificate.status || '').toLowerCase();
  if (status.includes('tidak') || status.includes('gagal') || status.includes('failed')) return 'Tidak Lulus';
  if (status.includes('menunggu') || status.includes('pending') || status.includes('draft')) return 'Menunggu';
  if (certificate.file?.url || certificate.file?.relativeUrl) return 'Tersedia';
  return certificate.status || 'Menunggu';
}

function getCertificateStatusClass(status) {
  if (status === 'Tersedia') return 'available';
  if (status === 'Tidak Lulus') return 'failed';
  return 'waiting';
}

function getCertificateFileUrl(certificate) {
  const url = certificate.file?.url || certificate.file?.relativeUrl || certificate.file?.relative_url || '';
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return apiUrl(url);
}

function isCurrentUserCertificate(certificate, user) {
  const currentUserId = user.id ?? user.userId;
  const certificateUserId = certificate.userId ?? certificate.user_id;
  if (currentUserId != null && certificateUserId != null) {
    return String(currentUserId) === String(certificateUserId);
  }

  const currentEmail = String(user.email || '').trim().toLowerCase();
  const certificateEmail = String(certificate.email || '').trim().toLowerCase();
  if (currentEmail && certificateEmail) {
    return currentEmail === certificateEmail;
  }

  return true;
}

function openCertificateFile(certificate) {
  const fileUrl = getCertificateFileUrl(certificate);
  if (fileUrl) {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  }
}

function downloadCertificateFile(certificate) {
  const fileUrl = getCertificateFileUrl(certificate);
  if (!fileUrl) return;
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = certificate.file?.name || certificate.certificateNumber || '';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function SidebarIcon({ name }) {
  const commonProps = {
    width: '18',
    height: '18',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  const paths = {
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    graduation: (
      <>
        <path d="M22 10 12 5 2 10l10 5 10-5Z" />
        <path d="M6 12v5c3 2 9 2 12 0v-5" />
      </>
    ),
    folder: (
      <>
        <path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        <path d="M3 7V5a2 2 0 0 1 2-2h4l2 4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 10h18" />
        <path d="M8 14h2v2H8zM14 14h2v2h-2z" />
      </>
    ),
    cpu: (
      <>
        <rect x="7" y="7" width="10" height="10" rx="1" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 1 1-4 0V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2.8a2 2 0 1 1 0-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V2.8a2 2 0 1 1 4 0V3a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
  };

  return <svg {...commonProps}>{paths[name]}</svg>;
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.2" />
      <path d="m20 20-3.8-3.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M8 12h8M10 18h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function DownloadActionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 3h9l3 3v15H6V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M15 3v4h4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 10v6m0 0-2.5-2.5M12 16l2.5-2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ViewActionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function UserCertificates() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const [certificates, setCertificates] = useState([]);
  const [isLoadingCertificates, setIsLoadingCertificates] = useState(true);
  const [certificatesError, setCertificatesError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState('Relevance');
  const user = getStoredUser();
  const fullName = user.name || user.fullName || 'Nama Lengkap';
  const greetingName = user.nickname || fullName;
  const profileImage = user.profileImage || user.avatar || '';

  useEffect(() => {
    let isMounted = true;

    async function loadCertificates() {
      setIsLoadingCertificates(true);
      setCertificatesError('');
      try {
        const records = await fetchCertificates();
        if (isMounted) {
          setCertificates(records.filter((certificate) => isCurrentUserCertificate(certificate, user)));
        }
      } catch (error) {
        if (isMounted) {
          setCertificatesError(error.message || 'Gagal memuat sertifikat.');
          setCertificates([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCertificates(false);
        }
      }
    }

    loadCertificates();

    return () => {
      isMounted = false;
    };
  }, [user.email, user.id, user.userId]);

  const displayedCertificates = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filteredCertificates = certificates.filter((certificate) => {
      if (!query) return true;
      return [
        certificate.certificateTitle,
        certificate.type,
        certificate.workshopTitle,
        certificate.certificateNumber,
        certificate.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });

    return [...filteredCertificates].sort((left, right) => {
      if (sortMode === 'Terbaru') {
        return new Date(right.issuedAt || right.completedAt || 0) - new Date(left.issuedAt || left.completedAt || 0);
      }
      if (sortMode === 'Status') {
        return getCertificateStatus(left).localeCompare(getCertificateStatus(right));
      }
      return (Number(right.id) || 0) - (Number(left.id) || 0);
    });
  }, [certificates, searchTerm, sortMode]);

  function handleLogout() {
    window.localStorage.removeItem('arduflow_user');
    window.localStorage.removeItem('arduflow_user_token');
    window.dispatchEvent(new Event('arduflow-auth-change'));
    window.location.assign('/signin');
  }

  function handleSidebarToggle() {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistSidebarCollapsed(nextValue);
      return nextValue;
    });
  }

  return (
    <div className={`dashboard-user-page user-certificates-page${isSidebarCollapsed ? ' dashboard-user-page--collapsed' : ''}`}>
      <aside className="dashboard-sidebar" aria-label="Dashboard sidebar">
        <a className="dashboard-sidebar__brand" href="/" aria-label="Kembali ke beranda">
          <span>ARDU</span>
          <strong>FLOW</strong>
        </a>
        <button
          className="dashboard-sidebar__collapse"
          type="button"
          aria-expanded={!isSidebarCollapsed}
          aria-label={isSidebarCollapsed ? 'Buka sidebar' : 'Minimize sidebar'}
          onClick={handleSidebarToggle}
        >
          <img src={arrowDownIcon} alt="" aria-hidden="true" />
        </button>

        <nav className="dashboard-sidebar__nav">
          {menuItems.map((item) => (
            <a
              className={`dashboard-sidebar__item${item.active ? ' dashboard-sidebar__item--active' : ''}`}
              href={item.href}
              key={item.label}
            >
              {item.icon === 'certificate' ? (
                <img className="dashboard-sidebar__asset-icon" src={certificateIcon} alt="" aria-hidden="true" />
              ) : (
                <SidebarIcon name={item.icon} />
              )}
              <span>{item.label}</span>
            </a>
          ))}
          <button className="dashboard-sidebar__item dashboard-sidebar__item--logout" type="button" onClick={handleLogout}>
            <img className="dashboard-sidebar__logout-icon" src={logoutIcon} alt="" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__user">
            <button className="dashboard-notification" type="button" aria-label="Notifikasi">
              <img src={bellIcon} alt="" aria-hidden="true" />
            </button>
            <ProfileAvatar className="dashboard-mini-avatar" image={profileImage} name={fullName} />
            <strong>{fullName}</strong>
          </div>
        </header>

        <main className="dashboard-content user-certificates-content">
          <div className="dashboard-user-greeting">
            <h1>Hello {greetingName}</h1>
            <span aria-hidden="true">&#128075;&#127995;</span>
          </div>

          <section className="user-certificates-panel" aria-labelledby="certificates-title">
            <div className="user-certificates-header">
              <h2 id="certificates-title">Sertifikat yang didapat</h2>
              <div className="user-certificates-toolbar">
                <label className="user-certificates-search">
                  <span className="sr-only">Cari sertifikat</span>
                  <input type="search" placeholder="Cari" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                  <SearchIcon />
                </label>

                <div className="user-certificates-controls">
                  <div className="user-certificates-sort">
                    <span>Urutkan</span>
                    <select value={sortMode} aria-label="Urutkan sertifikat" onChange={(event) => setSortMode(event.target.value)}>
                      <option>Relevance</option>
                      <option>Terbaru</option>
                      <option>Status</option>
                    </select>
                  </div>
                  <button className="user-certificates-filter" type="button">
                    <FilterIcon />
                    <span>Filter</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="user-certificates-table" role="table" aria-label="Sertifikat yang didapat">
              <div className="user-certificates-table__head" role="row">
                <span>Nama Sertifikat</span>
                <span>Jenis</span>
                <span>Materi / Program</span>
                <span>Tanggal Terbit</span>
                <span>Nomor Sertifikat</span>
                <span>Status</span>
                <span>Action</span>
              </div>
              {isLoadingCertificates ? (
                <div className="user-certificates-table__row" role="row">
                  <span>Memuat sertifikat...</span>
                  <span>-</span>
                  <span>-</span>
                  <time>-</time>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                </div>
              ) : certificatesError ? (
                <div className="user-certificates-table__row" role="row">
                  <span>{certificatesError}</span>
                  <span>-</span>
                  <span>-</span>
                  <time>-</time>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                </div>
              ) : displayedCertificates.length === 0 ? (
                <div className="user-certificates-table__row" role="row">
                  <span>Belum ada sertifikat yang tersedia.</span>
                  <span>-</span>
                  <span>-</span>
                  <time>-</time>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                </div>
              ) : (
                displayedCertificates.map((certificate) => {
                  const status = getCertificateStatus(certificate);
                  const hasFile = Boolean(getCertificateFileUrl(certificate));
                  return (
                    <div className="user-certificates-table__row" role="row" key={certificate.id || certificate.certificateNumber}>
                      <span>{certificate.certificateTitle || 'Sertifikat tanpa judul'}</span>
                      <span>{certificate.type || '-'}</span>
                      <span>{certificate.workshopTitle || certificate.payload?.materialTitle || '-'}</span>
                      <time>{formatCertificateDate(certificate.issuedAt || certificate.completedAt)}</time>
                      <span>{certificate.certificateNumber || '-'}</span>
                      <span>
                        <b className={`user-certificates-pill user-certificates-pill--${getCertificateStatusClass(status)}`}>
                          {status}
                        </b>
                      </span>
                      <div className="user-certificates-actions">
                        <button
                          className="user-certificates-action user-certificates-action--download"
                          type="button"
                          aria-label="Download sertifikat"
                          disabled={!hasFile}
                          onClick={() => downloadCertificateFile(certificate)}
                        >
                          <DownloadActionIcon />
                        </button>
                        <button
                          className="user-certificates-action user-certificates-action--view"
                          type="button"
                          aria-label="Lihat sertifikat"
                          disabled={!hasFile}
                          onClick={() => openCertificateFile(certificate)}
                        >
                          <ViewActionIcon />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <nav className="user-certificates-pagination" aria-label="Pagination sertifikat">
              <button type="button" aria-label="Halaman sebelumnya">&lsaquo;</button>
              <button className="user-certificates-pagination__active" type="button">1</button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button" aria-label="Halaman berikutnya">&rsaquo;</button>
            </nav>
          </section>
        </main>
      </section>
    </div>
  );
}
