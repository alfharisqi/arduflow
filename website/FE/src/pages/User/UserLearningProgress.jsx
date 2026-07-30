import { useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import certificateIcon from '../../assets/icons/icon-downloadsim-1.svg';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import courseImage from '../../assets/images/workshop-experience-student.png';
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';

const menuItems = [
  { label: 'Profil', icon: 'user', href: '/dashboard' },
  { label: 'Progres Belajar', icon: 'graduation', href: '/progress-belajar', active: true },
  { label: 'Proyek Saya', icon: 'folder', href: '/proyek-saya' },
  { label: 'Workshop / Program', icon: 'calendar', href: '/workshop-program' },
  { label: 'Sertifikat', icon: 'certificate', href: '/sertifikat' },
  { label: 'IDE', icon: 'cpu', href: '/ide' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
];

const courses = Array.from({ length: 9 }, (_, index) => ({
  id: index + 1,
  title: 'Judul Materi',
  category: 'Kategori Materi',
  meta: 'Total Waktu, Total Halaman',
  progress: index % 3 === 1 ? 36 : 37,
}));

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

export function UserLearningProgress() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const user = getStoredUser();
  const fullName = user.name || user.fullName || 'Nama Lengkap';
  const greetingName = user.nickname || fullName;

  function handleLogout() {
    window.localStorage.removeItem('arduflow_user');
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
    <div className={`dashboard-user-page user-progress-page${isSidebarCollapsed ? ' dashboard-user-page--collapsed' : ''}`}>
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
            <div className="dashboard-mini-avatar" aria-hidden="true">{getInitials(fullName)}</div>
            <strong>{fullName}</strong>
          </div>
        </header>

        <main className="dashboard-content user-progress-content">
          <div className="dashboard-user-greeting">
            <h1>Hello {greetingName}</h1>
            <span aria-hidden="true">&#128075;&#127995;</span>
          </div>

          <section className="user-progress-panel" aria-labelledby="progress-title">
            <div className="user-progress-header">
              <h2 id="progress-title">Progres Belajar (total course)</h2>
              <div className="user-progress-toolbar">
                <label className="user-progress-search">
                  <span className="sr-only">Cari materi</span>
                  <input type="search" placeholder="Cari" />
                  <SearchIcon />
                </label>

                <div className="user-progress-controls">
                  <div className="user-progress-sort">
                    <span>Urutkan</span>
                    <select defaultValue="Relevance" aria-label="Urutkan materi">
                      <option>Relevance</option>
                      <option>Terbaru</option>
                      <option>Progress</option>
                    </select>
                  </div>
                  <button className="user-progress-filter" type="button">
                    <FilterIcon />
                    <span>Filter</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="user-progress-grid">
              {courses.map((course) => (
                <article className="user-course-card" key={course.id}>
                  <img src={courseImage} alt="" />
                  <h3>{course.title}</h3>
                  <p>{course.category}</p>
                  <div className="user-course-card__progress" aria-hidden="true">
                    <span style={{ width: `${course.progress}%` }} />
                  </div>
                  <small>{course.meta}</small>
                </article>
              ))}
            </div>

            <nav className="user-progress-pagination" aria-label="Pagination progres belajar">
              <button type="button" aria-label="Halaman sebelumnya">&lsaquo;</button>
              <button className="user-progress-pagination__active" type="button">1</button>
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
