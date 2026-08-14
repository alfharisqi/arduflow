import { useEffect, useMemo, useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import certificateIcon from '../../assets/icons/icon-downloadsim-1.svg';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import { ProfileAvatar } from '../../features/profile-image-crop/ProfileAvatar.jsx';
import { fetchWorkshops, isPublicWorkshop } from '../../services/workshopApi.js';
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';

const menuItems = [
  { label: 'Profil', icon: 'user', href: '/dashboard' },
  { label: 'Progres Belajar', icon: 'graduation', href: '/progress-belajar' },
  { label: 'Proyek Saya', icon: 'folder', href: '/proyek-saya' },
  { label: 'Workshop / Program', icon: 'calendar', href: '/workshop-program', active: true },
  { label: 'Transaksi', icon: 'certificate', href: '/transaksi' },
  { label: 'Sertifikat', icon: 'certificate', href: '/sertifikat' },
  { label: 'IDE', icon: 'cpu', href: '/ide' },
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

export function UserWorkshopSchedule() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const [workshops, setWorkshops] = useState([]);
  const [isLoadingWorkshops, setIsLoadingWorkshops] = useState(true);
  const [workshopError, setWorkshopError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState('Relevance');
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
        const records = await fetchWorkshops();
        if (isMounted) {
          setWorkshops(records.filter(isPublicWorkshop));
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
  }, []);

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
              </div>
              {isLoadingWorkshops ? (
                <div className="user-workshop-table__row" role="row">
                  <span>Memuat jadwal workshop...</span>
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
                </div>
              ) : schedules.length === 0 ? (
                <div className="user-workshop-table__row" role="row">
                  <span>Belum ada workshop atau program yang tersedia.</span>
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
    </div>
  );
}
