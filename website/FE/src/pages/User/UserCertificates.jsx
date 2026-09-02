import { useEffect, useMemo, useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import { DashboardUserSidebarIcon } from './userSidebarIcons.jsx';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import { ProfileAvatar } from '../../features/profile-image-crop/ProfileAvatar.jsx';
import { apiEndpoint, apiUrl } from '../../services/apiEndpoints.js';
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';

const menuItems = [
  { label: 'Profil', icon: 'user', href: '/dashboard' },
  { label: 'Progres Belajar', icon: 'graduation', href: '/progress-belajar' },
  { label: 'Proyek Saya', icon: 'folder', href: '/proyek-saya' },
  { label: 'Workshop / Program', icon: 'calendar', href: '/workshop-program' },
  { label: 'Lead Saya', icon: 'lead', href: '/lead-saya' },
  { label: 'Partner Saya', icon: 'partner', href: '/partner-saya' },
  { label: 'Transaksi', icon: 'transaction', href: '/transaksi' },
  { label: 'Sertifikat', icon: 'certificate', href: '/sertifikat', active: true },
  { label: 'IDE', icon: 'cpu', href: '/ide-saya' },
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

function getParticipantName(certificate) {
  return certificate.participantName
    || certificate.participant_name
    || certificate.userName
    || certificate.user_name
    || certificate.name
    || 'Nama peserta belum tersedia';
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
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedWorkshops, setExpandedWorkshops] = useState({});
  const pageSize = 5;
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

  const workshopRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filteredCertificates = certificates.filter((certificate) => {
      const status = getCertificateStatus(certificate);
      if (statusFilter !== 'Semua' && status !== statusFilter) return false;
      if (!query) return true;
      return [
        certificate.workshopTitle,
        certificate.certificateTitle,
        certificate.certificateNumber,
        getParticipantName(certificate),
        certificate.email,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });

    const grouped = filteredCertificates.reduce((groups, certificate) => {
      const workshopTitle = certificate.workshopTitle || certificate.payload?.materialTitle || 'Workshop tanpa judul';
      const workshopKey = String(certificate.workshopId || certificate.workshop_id || workshopTitle).toLowerCase();
      const existing = groups.get(workshopKey) || {
        key: workshopKey,
        title: workshopTitle,
        participants: [],
      };
      existing.participants.push(certificate);
      groups.set(workshopKey, existing);
      return groups;
    }, new Map());

    return [...grouped.values()].sort((left, right) => {
      if (sortMode === 'Terbaru') {
        const leftDate = left.participants.reduce((latest, item) => Math.max(latest, new Date(item.issuedAt || item.completedAt || 0).getTime()), 0);
        const rightDate = right.participants.reduce((latest, item) => Math.max(latest, new Date(item.issuedAt || item.completedAt || 0).getTime()), 0);
        return rightDate - leftDate;
      }
      if (sortMode === 'Status') {
        return getCertificateStatus(left.participants[0]).localeCompare(getCertificateStatus(right.participants[0]));
      }
      return (Number(right.participants[0]?.id) || 0) - (Number(left.participants[0]?.id) || 0);
    });
  }, [certificates, searchTerm, sortMode, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(workshopRows.length / pageSize));
  const paginatedWorkshops = workshopRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedWorkshops({});
  }, [searchTerm, sortMode, statusFilter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function toggleWorkshop(workshopKey) {
    setExpandedWorkshops((current) => ({ ...current, [workshopKey]: !current[workshopKey] }));
  }

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
              <DashboardUserSidebarIcon name={item.icon} />
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
                  <span className="sr-only">Cari workshop atau peserta</span>
                  <input type="search" placeholder="Cari workshop atau peserta" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
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
                  <label className="user-certificates-filter">
                    <FilterIcon />
                    <span className="sr-only">Filter status</span>
                    <select value={statusFilter} aria-label="Filter status sertifikat" onChange={(event) => setStatusFilter(event.target.value)}>
                      <option>Semua</option>
                      <option>Tersedia</option>
                      <option>Menunggu</option>
                      <option>Tidak Lulus</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div className="user-certificates-table" role="table" aria-label="Sertifikat yang didapat">
              <div className="user-certificates-table__head" role="row">
                <span>Workshop</span>
                <span>Peserta</span>
                <span>Tanggal Terbit</span>
                <span>Status</span>
                <span>Detail</span>
              </div>
              {isLoadingCertificates ? (
                <div className="user-certificates-table__row" role="row">
                  <span>Memuat sertifikat...</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                </div>
              ) : certificatesError ? (
                <div className="user-certificates-table__row" role="row">
                  <span>{certificatesError}</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                </div>
              ) : workshopRows.length === 0 ? (
                <div className="user-certificates-table__row" role="row">
                  <span>Belum ada sertifikat yang tersedia.</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                </div>
              ) : (
                paginatedWorkshops.map((workshop) => {
                  const availableCount = workshop.participants.filter((item) => getCertificateStatus(item) === 'Tersedia').length;
                  const status = availableCount === workshop.participants.length
                    ? 'Tersedia'
                    : workshop.participants.some((item) => getCertificateStatus(item) === 'Menunggu')
                      ? 'Menunggu'
                      : 'Tidak Lulus';
                  const latestCertificate = workshop.participants.reduce((latest, item) => {
                    const itemDate = new Date(item.issuedAt || item.completedAt || 0).getTime();
                    const latestDate = new Date(latest?.issuedAt || latest?.completedAt || 0).getTime();
                    return itemDate > latestDate ? item : latest;
                  }, workshop.participants[0]);
                  const isExpanded = Boolean(expandedWorkshops[workshop.key]);
                  return (
                    <div className={`user-certificates-workshop-group${isExpanded ? ' is-expanded' : ''}`} key={workshop.key}>
                      <div className="user-certificates-table__row" role="row">
                        <span className="user-certificates-workshop-name">{workshop.title}</span>
                        <span>{workshop.participants.length} peserta</span>
                        <time>{formatCertificateDate(latestCertificate?.issuedAt || latestCertificate?.completedAt)}</time>
                        <span>
                          <b className={`user-certificates-pill user-certificates-pill--${getCertificateStatusClass(status)}`}>
                            {status}
                          </b>
                        </span>
                        <button className="user-certificates-expand" type="button" aria-expanded={isExpanded} onClick={() => toggleWorkshop(workshop.key)}>
                          {isExpanded ? 'Tutup' : 'Lihat peserta'}
                        </button>
                      </div>
                      {isExpanded ? (
                        <div className="user-certificates-participants" role="region" aria-label={`Peserta ${workshop.title}`}>
                          {workshop.participants.map((certificate) => {
                            const participantStatus = getCertificateStatus(certificate);
                            const hasFile = Boolean(getCertificateFileUrl(certificate));
                            return (
                              <div className="user-certificates-participant" key={certificate.id || certificate.certificateNumber || getParticipantName(certificate)}>
                                <span><b>{getParticipantName(certificate)}</b><small>{certificate.email || certificate.participantEmail || '-'}</small></span>
                                <span>{certificate.certificateNumber || '-'}</span>
                                <span className={`user-certificates-pill user-certificates-pill--${getCertificateStatusClass(participantStatus)}`}>{participantStatus}</span>
                                <div className="user-certificates-actions">
                                  <button className="user-certificates-action user-certificates-action--download" type="button" aria-label={`Download sertifikat ${getParticipantName(certificate)}`} disabled={!hasFile} onClick={() => downloadCertificateFile(certificate)}><DownloadActionIcon /></button>
                                  <button className="user-certificates-action user-certificates-action--view" type="button" aria-label={`Lihat sertifikat ${getParticipantName(certificate)}`} disabled={!hasFile} onClick={() => openCertificateFile(certificate)}><ViewActionIcon /></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>

            <nav className="user-certificates-pagination" aria-label="Pagination sertifikat">
              <button type="button" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>&lsaquo;</button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button className={page === currentPage ? 'user-certificates-pagination__active' : ''} type="button" key={page} onClick={() => setCurrentPage(page)}>{page}</button>
              ))}
              <button type="button" aria-label="Halaman berikutnya" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>&rsaquo;</button>
            </nav>
          </section>
        </main>
      </section>
    </div>
  );
}
