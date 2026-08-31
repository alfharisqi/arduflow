import { useEffect, useMemo, useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import { DashboardUserSidebarIcon } from './userSidebarIcons.jsx';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import { ProfileAvatar } from '../../features/profile-image-crop/ProfileAvatar.jsx';
import { fetchTransactions } from '../../services/transactionApi.js';
import { fetchWorkshopDetail, fetchWorkshops, isPublicWorkshop } from '../../services/workshopApi.js';
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';

const menuItems = [
  { label: 'Profil', icon: 'user', href: '/dashboard' },
  { label: 'Progres Belajar', icon: 'graduation', href: '/progress-belajar' },
  { label: 'Proyek Saya', icon: 'folder', href: '/proyek-saya' },
  { label: 'Workshop / Program', icon: 'calendar', href: '/workshop-program', active: true },
  { label: 'Lead Saya', icon: 'lead', href: '/lead-saya' },
  { label: 'Partner Saya', icon: 'partner', href: '/partner-saya' },
  { label: 'Transaksi', icon: 'transaction', href: '/transaksi' },
  { label: 'Sertifikat', icon: 'certificate', href: '/sertifikat' },
  { label: 'IDE', icon: 'cpu', href: '/ide-saya' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
];

function getStoredUser() {
  try {
    const raw = window.localStorage.getItem('arduflow_user');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function parseWorkshopDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatWorkshopDateTime(workshop) {
  const date = parseWorkshopDate(workshop.startsAt);
  const dateText = date
    ? new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date)
    : 'Tanggal belum diatur';
  return [dateText, workshop.timeText].filter(Boolean).join(' ');
}

function formatWorkshopDate(workshop) {
  const date = parseWorkshopDate(workshop.startsAt);
  if (!date) return 'Tanggal belum diatur';

  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatWorkshopPrice(value) {
  const number = Number(String(value ?? '').replace(/\D/g, ''));
  if (!Number.isFinite(number) || number <= 0) return 'Gratis';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number);
}

function getWorkshopStatus(workshop) {
  const rawStatus = String(workshop.status || '').toLowerCase();
  if (rawStatus.includes('selesai') || rawStatus.includes('completed')) return 'Selesai';

  const startsAt = parseWorkshopDate(workshop.startsAt);
  const endsAt = parseWorkshopDate(workshop.endsAt);
  const now = new Date();

  if (startsAt && startsAt > now) return 'Akan Datang';
  if (startsAt && (!endsAt || endsAt >= now)) return 'Sedang Berlangsung';
  if (endsAt && endsAt < now) return 'Selesai';
  if (rawStatus.includes('berlangsung') || rawStatus.includes('ongoing')) return 'Sedang Berlangsung';
  return 'Akan Datang';
}

function getWorkshopStatusClass(status) {
  if (status === 'Selesai') return 'done';
  if (status === 'Akan Datang') return 'upcoming';
  return 'live';
}

function getWorkshopMethodClass(method) {
  const value = String(method || '').toLowerCase();
  if (value.includes('offline')) return 'offline';
  if (value.includes('online')) return 'online';
  return 'online';
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

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function sanitizeWorkshopHtml(value) {
  return String(value || '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\s(href|src)=["']javascript:[^"']*["']/gi, '');
}

function splitDetailItems(value, fallback) {
  const items = String(value || '')
    .split(/\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length ? items : fallback;
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

function DetailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function UserWorkshopSchedule() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const [workshops, setWorkshops] = useState([]);
  const [isLoadingWorkshops, setIsLoadingWorkshops] = useState(true);
  const [workshopError, setWorkshopError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState('Relevance');
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');
  const user = getStoredUser();
  const fullName = user.name || user.fullName || 'Nama Lengkap';
  const greetingName = user.nickname || fullName;
  const profileImage = user.profileImage || user.avatar || '';

  useEffect(() => {
    let isMounted = true;

    async function loadWorkshops() {
      setIsLoadingWorkshops(true);
      setWorkshopError('');
      try {
        const params = {};
        if (user.id || user.userId) params.userId = user.id || user.userId;
        if (user.email) params.email = user.email;

        if (!params.userId && !params.email) {
          setWorkshops([]);
          return;
        }

        const [workshopRecords, transactionRecords] = await Promise.all([
          fetchWorkshops(),
          fetchTransactions({ ...params, status: 'paid' }),
        ]);
        if (isMounted) {
          const paidWorkshopTransactions = transactionRecords.filter(
            (transaction) => ['workshop', 'program', 'course'].includes(transaction.itemType) && transaction.status === 'paid'
          );
          const paidWorkshopIds = new Set(
            paidWorkshopTransactions
              .map((transaction) => String(transaction.itemId || ''))
              .filter(Boolean)
          );
          const paidWorkshopFallbacks = paidWorkshopTransactions
            .filter((transaction) => !transaction.itemId)
            .map((transaction) => ({
              id: `transaction-${transaction.id}`,
              title: transaction.itemTitle,
              method: transaction.paymentChannel || transaction.paymentMethod || 'Workshop',
              location: 'Akses aktif setelah pembayaran disetujui',
              startsAt: transaction.paidAt || transaction.createdAt,
              timeText: '',
              status: 'Terdaftar',
            }));

          setWorkshops([
            ...workshopRecords.filter((workshop) => isPublicWorkshop(workshop) && paidWorkshopIds.has(String(workshop.id))),
            ...paidWorkshopFallbacks,
          ]);
        }
      } catch (error) {
        if (isMounted) {
          setWorkshopError(error.message || 'Gagal memuat jadwal workshop.');
          setWorkshops([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingWorkshops(false);
        }
      }
    }

    loadWorkshops();

    return () => {
      isMounted = false;
    };
  }, [user.email, user.id, user.userId]);

  const schedules = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filteredWorkshops = workshops.filter((workshop) => {
      if (!query) return true;
      return [workshop.title, workshop.category, workshop.method, workshop.location, workshop.meetingUrl]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });

    return [...filteredWorkshops].sort((left, right) => {
      if (sortMode === 'Terbaru') {
        return (parseWorkshopDate(right.startsAt)?.getTime() || 0) - (parseWorkshopDate(left.startsAt)?.getTime() || 0);
      }
      if (sortMode === 'Status') {
        return getWorkshopStatus(left).localeCompare(getWorkshopStatus(right));
      }
      return (parseWorkshopDate(left.startsAt)?.getTime() || 0) - (parseWorkshopDate(right.startsAt)?.getTime() || 0);
    });
  }, [workshops, searchTerm, sortMode]);

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

  async function handleOpenDetail(schedule) {
    setSelectedWorkshop(schedule);
    setDetailError('');

    if (!schedule?.id || String(schedule.id).startsWith('transaction-')) return;

    setIsLoadingDetail(true);
    try {
      const detail = await fetchWorkshopDetail({ id: schedule.id });
      setSelectedWorkshop((current) => (current?.id === schedule.id ? { ...current, ...detail } : current));
    } catch (error) {
      setDetailError(error.message || 'Gagal memuat detail workshop.');
    } finally {
      setIsLoadingDetail(false);
    }
  }

  function handleCloseDetail() {
    setSelectedWorkshop(null);
    setDetailError('');
    setIsLoadingDetail(false);
  }

  const selectedStatus = selectedWorkshop ? getWorkshopStatus(selectedWorkshop) : '';
  const selectedMethod = selectedWorkshop?.method || 'Online';
  const selectedAboutHtml = sanitizeWorkshopHtml(selectedWorkshop?.about);
  const selectedAboutText = stripHtml(selectedAboutHtml || selectedWorkshop?.description || selectedWorkshop?.summary);
  const selectedFacilities = splitDetailItems(selectedWorkshop?.facilities, [
    'Materi praktik sesuai program workshop',
    'Pendampingan selama sesi berlangsung',
    'Sertifikat atau e-certificate jika tersedia',
  ]);
  const selectedBringItems = splitDetailItems(selectedWorkshop?.bringItems, [
    'Laptop pribadi',
    'Koneksi internet yang stabil untuk sesi online',
    'Catatan atau alat tulis untuk merangkum materi',
  ]);
  const selectedMeetingUrl = selectedWorkshop?.meetingUrl || '';

  return (
    <div className={`dashboard-user-page user-workshop-page${isSidebarCollapsed ? ' dashboard-user-page--collapsed' : ''}`}>
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

        <main className="dashboard-content user-workshop-content">
          <div className="dashboard-user-greeting">
            <h1>Hello {greetingName}</h1>
            <span aria-hidden="true">&#128075;&#127995;</span>
          </div>

          <section className="user-workshop-panel" aria-labelledby="workshop-schedule-title">
            <div className="user-workshop-header">
              <h2 id="workshop-schedule-title">Jadwal Workshop / Program kamu</h2>
              <div className="user-workshop-toolbar">
                <label className="user-workshop-search">
                  <span className="sr-only">Cari workshop</span>
                  <input type="search" placeholder="Cari" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                  <SearchIcon />
                </label>

                <div className="user-workshop-controls">
                  <div className="user-workshop-sort">
                    <span>Urutkan</span>
                    <select value={sortMode} aria-label="Urutkan workshop" onChange={(event) => setSortMode(event.target.value)}>
                      <option>Relevance</option>
                      <option>Terbaru</option>
                      <option>Status</option>
                    </select>
                  </div>
                  <button className="user-workshop-filter" type="button">
                    <FilterIcon />
                    <span>Filter</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="user-workshop-table" role="table" aria-label="Jadwal Workshop dan Program kamu">
              <div className="user-workshop-table__head" role="row">
                <span>Nama Workshop</span>
                <span>Metode</span>
                <span>Lokasi Kegiatan</span>
                <span>Waktu</span>
                <span>Status</span>
                <span>Notif</span>
                <span>Detail</span>
              </div>
              {isLoadingWorkshops ? (
                <div className="user-workshop-table__row" role="row">
                  <span>Memuat jadwal workshop...</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                </div>
              ) : workshopError ? (
                <div className="user-workshop-table__row" role="row">
                  <span>{workshopError}</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                </div>
              ) : schedules.length === 0 ? (
                <div className="user-workshop-table__row" role="row">
                  <span>Belum ada workshop yang sudah aktif. Workshop akan muncul setelah pembayaran disetujui admin.</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                  <span>-</span>
                </div>
              ) : (
                schedules.map((schedule) => {
                  const status = getWorkshopStatus(schedule);
                  const method = schedule.method || 'Online';
                  return (
                    <div className="user-workshop-table__row" role="row" key={schedule.id}>
                      <span>{schedule.title || 'Workshop tanpa judul'}</span>
                      <span>
                        <b className={`user-workshop-pill user-workshop-pill--${getWorkshopMethodClass(method)}`}>
                          {method}
                        </b>
                      </span>
                      <span>{schedule.meetingUrl || schedule.location || '-'}</span>
                      <time>{formatWorkshopDateTime(schedule)}</time>
                      <span>
                        <b className={`user-workshop-pill user-workshop-pill--${getWorkshopStatusClass(status)}`}>
                          {status}
                        </b>
                      </span>
                      <button
                        className={`user-workshop-notif${status === 'Akan Datang' ? ' user-workshop-notif--active' : ''}`}
                        type="button"
                        aria-label="Notifikasi workshop"
                      >
                        <img src={bellIcon} alt="" aria-hidden="true" />
                      </button>
                      <button
                        className="user-workshop-detail-button"
                        type="button"
                        aria-label={`Lihat detail ${schedule.title || 'workshop'}`}
                        onClick={() => handleOpenDetail(schedule)}
                      >
                        <DetailIcon />
                        <span>Detail</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <nav className="user-workshop-pagination" aria-label="Pagination jadwal workshop">
              <button type="button" aria-label="Halaman sebelumnya">&lsaquo;</button>
              <button className="user-workshop-pagination__active" type="button">1</button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button" aria-label="Halaman berikutnya">&rsaquo;</button>
            </nav>
          </section>
        </main>
      </section>

      {selectedWorkshop && (
        <div className="user-workshop-detail-overlay" role="presentation" onClick={handleCloseDetail}>
          <aside
            className="user-workshop-detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-workshop-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="user-workshop-detail__head">
              <div>
                <span>Detail Workshop</span>
                <h2 id="user-workshop-detail-title">{selectedWorkshop.title || 'Workshop tanpa judul'}</h2>
              </div>
              <button type="button" aria-label="Tutup detail workshop" onClick={handleCloseDetail}>
                <CloseIcon />
              </button>
            </div>

            {selectedWorkshop.coverImageUrl && (
              <img className="user-workshop-detail__cover" src={selectedWorkshop.coverImageUrl} alt={selectedWorkshop.title || 'Cover workshop'} />
            )}

            {isLoadingDetail && <p className="user-workshop-detail__state">Memuat detail terbaru...</p>}
            {detailError && <p className="user-workshop-detail__error">{detailError}</p>}

            <div className="user-workshop-detail__meta">
              <article>
                <small>Metode</small>
                <b className={`user-workshop-pill user-workshop-pill--${getWorkshopMethodClass(selectedMethod)}`}>{selectedMethod}</b>
              </article>
              <article>
                <small>Status</small>
                <b className={`user-workshop-pill user-workshop-pill--${getWorkshopStatusClass(selectedStatus)}`}>{selectedStatus}</b>
              </article>
              <article>
                <small>Tanggal</small>
                <strong>{formatWorkshopDate(selectedWorkshop)}</strong>
              </article>
              <article>
                <small>Waktu</small>
                <strong>{[selectedWorkshop.timeText, selectedWorkshop.timezone].filter(Boolean).join(' ') || '-'}</strong>
              </article>
              <article>
                <small>Lokasi</small>
                <strong>{selectedWorkshop.location || '-'}</strong>
              </article>
              <article>
                <small>Biaya</small>
                <strong>{formatWorkshopPrice(selectedWorkshop.registrationFee ?? selectedWorkshop.price)}</strong>
              </article>
            </div>

            {selectedMeetingUrl && (
              <a className="user-workshop-detail__meeting" href={selectedMeetingUrl} target="_blank" rel="noreferrer">
                Buka Link Meeting
              </a>
            )}

            <section className="user-workshop-detail__section">
              <h3>Tentang Workshop</h3>
              {selectedAboutHtml ? (
                <div className="user-workshop-detail__rich-text" dangerouslySetInnerHTML={{ __html: selectedAboutHtml }} />
              ) : (
                <p>{selectedAboutText || 'Detail deskripsi workshop belum tersedia.'}</p>
              )}
            </section>

            <section className="user-workshop-detail__grid">
              <div className="user-workshop-detail__section">
                <h3>Fasilitas</h3>
                <ul>
                  {selectedFacilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="user-workshop-detail__section">
                <h3>Yang Perlu Dibawa</h3>
                <ul>
                  {selectedBringItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
