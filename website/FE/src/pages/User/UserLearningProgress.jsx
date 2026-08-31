import { useEffect, useMemo, useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import { DashboardUserSidebarIcon } from './userSidebarIcons.jsx';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import courseImage from '../../assets/images/workshop-experience-student.png';
import { ProfileAvatar } from '../../features/profile-image-crop/ProfileAvatar.jsx';
import { fetchTutorialArticles, isPublishedTutorial } from '../../services/materiApi.js';
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';

const menuItems = [
  { label: 'Profil', icon: 'user', href: '/dashboard' },
  { label: 'Progres Belajar', icon: 'graduation', href: '/progress-belajar', active: true },
  { label: 'Proyek Saya', icon: 'folder', href: '/proyek-saya' },
  { label: 'Workshop / Program', icon: 'calendar', href: '/workshop-program' },
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

function getCourseProgress(course) {
  const progress = Number(course.progress ?? course.completedProgress ?? course.completion ?? 0);
  return Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : 0;
}

function getCourseMeta(course) {
  const slideCount = Number(course.totalSlides || course.slides?.length || 0);
  const duration = course.estimatedTime || 'Durasi belum diatur';
  const pages = slideCount > 0 ? `${slideCount} halaman` : 'Halaman belum diatur';
  return `${duration}, ${pages}`;
}

function getCourseOrder(course) {
  return Number(course.pageOrder ?? course.displayOrder ?? course.id ?? 0) || 0;
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
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState('Relevance');
  const user = getStoredUser();
  const fullName = user.name || user.fullName || 'Nama Lengkap';
  const greetingName = user.nickname || fullName;
  const profileImage = user.profileImage || user.avatar || '';

  useEffect(() => {
    let isMounted = true;

    async function loadCourses() {
      setIsLoadingCourses(true);
      setCoursesError('');
      try {
        const records = await fetchTutorialArticles();
        const publishedRecords = records.filter(isPublishedTutorial);
        const visibleRecords = publishedRecords.length > 0 ? publishedRecords : records;
        if (isMounted) {
          setCourses([...visibleRecords].sort((left, right) => getCourseOrder(left) - getCourseOrder(right)));
        }
      } catch (error) {
        if (isMounted) {
          setCoursesError(error.message || 'Gagal memuat progres belajar.');
          setCourses([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCourses(false);
        }
      }
    }

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayedCourses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filteredCourses = courses.filter((course) => {
      if (!query) return true;
      return [course.title, course.category, course.shortDescription, course.difficulty]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });

    return [...filteredCourses].sort((left, right) => {
      if (sortMode === 'Terbaru') {
        return new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0);
      }
      if (sortMode === 'Progress') {
        return getCourseProgress(right) - getCourseProgress(left);
      }
      return getCourseOrder(left) - getCourseOrder(right);
    });
  }, [courses, searchTerm, sortMode]);

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
                  <input type="search" placeholder="Cari" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                  <SearchIcon />
                </label>

                <div className="user-progress-controls">
                  <div className="user-progress-sort">
                    <span>Urutkan</span>
                    <select value={sortMode} aria-label="Urutkan materi" onChange={(event) => setSortMode(event.target.value)}>
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
              {isLoadingCourses ? (
                <p>Memuat data materi...</p>
              ) : coursesError ? (
                <p>{coursesError}</p>
              ) : displayedCourses.length === 0 ? (
                <p>Belum ada materi yang tersedia.</p>
              ) : (
                displayedCourses.map((course) => {
                  const progress = getCourseProgress(course);
                  return (
                    <article className="user-course-card" key={course.id || course.slug}>
                      <img src={courseImage} alt="" />
                      <h3>{course.title || 'Materi tanpa judul'}</h3>
                      <p>{course.category || 'Tanpa kategori'}</p>
                      <div className="user-course-card__progress" aria-hidden="true">
                        <span style={{ width: `${progress}%` }} />
                      </div>
                      <small>{getCourseMeta(course)}</small>
                    </article>
                  );
                })
              )}
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
