import { useEffect, useMemo, useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import { DashboardUserSidebarIcon } from './userSidebarIcons.jsx';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import courseImage from '../../assets/images/workshop-experience-student.png';
import { fetchTutorialArticles, isPublishedTutorial } from '../../services/materiApi.js';
import { UserDashboardTopbar } from './UserDashboardTopbar.jsx';
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';
import {
  LEARNING_PROGRESS_EVENT,
  calculateTutorialProgress,
  readTutorialProgress,
} from '../../utils/learningProgress.js';


const DEPLOY_URL = (
  import.meta.env.VITE_DEPLOY_URL ||
  'https://arduflow.indobilliard.com/apk/uploads/web-arduflow-deploy-alfha'
).replace(/\/+$/, '');

const MATERI_IMAGE_BASE_URL =
  `${DEPLOY_URL}/uploads/materi`;

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


function resolveMateriImage(
  value,
  fallbackFileName = ''
) {
  const candidate = String(
    value ||
    fallbackFileName ||
    ''
  ).trim();

  if (!candidate) {
    return '';
  }

  if (
    /^(data:image\/|blob:)/i.test(
      candidate
    )
  ) {
    return candidate;
  }

  try {
    const parsed = new URL(
      candidate,
      window.location.origin
    );

    const queryFile =
      parsed.searchParams.get('file');

    if (queryFile) {
      const fileName = String(
        queryFile
      )
        .replace(/\\/g, '/')
        .split('/')
        .pop();

      if (fileName) {
        return `${MATERI_IMAGE_BASE_URL}/${encodeURIComponent(
          fileName
        )}`;
      }
    }

    if (
      parsed.pathname.includes(
        '/uploads/materi/'
      )
    ) {
      /*
       * URL absolut production boleh langsung dipakai.
       * Jika path relatif dari localhost, bangun ulang
       * memakai folder uploads/materi production.
       */
      if (
        /^https?:\/\//i.test(candidate)
      ) {
        return candidate;
      }

      const fileName =
        decodeURIComponent(
          parsed.pathname
        )
          .split('/')
          .pop();

      if (fileName) {
        return `${MATERI_IMAGE_BASE_URL}/${encodeURIComponent(
          fileName
        )}`;
      }
    }

    const absoluteFileName =
      decodeURIComponent(
        parsed.pathname
      )
        .split('/')
        .pop();

    if (
      absoluteFileName &&
      /\.(png|jpe?g|webp|gif|svg)$/i.test(
        absoluteFileName
      )
    ) {
      return `${MATERI_IMAGE_BASE_URL}/${encodeURIComponent(
        absoluteFileName
      )}`;
    }
  } catch {
    // Lanjut sebagai nama/path file.
  }

  const normalized =
    candidate.replace(/\\/g, '/');

  const fileName =
    normalized.split('/').pop();

  if (
    !fileName ||
    !/\.(png|jpe?g|webp|gif|svg)$/i.test(
      fileName
    )
  ) {
    return '';
  }

  return `${MATERI_IMAGE_BASE_URL}/${encodeURIComponent(
    fileName
  )}`;
}


function getCourseImage(course) {
  return (
    resolveMateriImage(
      course?.cardImageUrl ||
      course?.card_image_url ||
      course?.cardImagePath ||
      course?.card_image_path ||
      course?.imageUrl ||
      course?.image_url ||
      '',
      course?.cardImageName ||
      course?.card_image_name ||
      course?.imageName ||
      course?.image_name ||
      ''
    ) ||
    courseImage
  );
}


function getCourseHref(course) {
  const slug = String(
    course?.slug ||
    course?.urlSlug ||
    course?.url_slug ||
    ''
  ).trim();

  if (slug) {
    return `/materi/${encodeURIComponent(
      slug
    )}`;
  }

  if (course?.id) {
    return `/tutorial/detail?id=${encodeURIComponent(
      course.id
    )}`;
  }

  return '/materi';
}


function getCourseStoredProgress(course) {
  if (!course?.id) {
    return {
      completedSlideIds: [],
      completedCount: 0,
      totalSlides: 0,
      progress: 0,
      updatedAt: '',
    };
  }

  return readTutorialProgress(
    course.id
  );
}


/*
 * Materi hanya masuk halaman Progres Belajar
 * setelah pernah dibuka oleh user.
 *
 * TutorialDetail versi terbaru menulis summary
 * progress saat halaman materi pertama kali dibuka,
 * walaupun progress masih 0%.
 */
function hasCourseHistory(course) {
  const stored =
    getCourseStoredProgress(course);

  return Boolean(
    stored.updatedAt ||
    stored.completedSlideIds.length > 0 ||
    stored.progress > 0
  );
}


function getCourseLastOpenedTime(course) {
  const stored =
    getCourseStoredProgress(course);

  const timestamp =
    new Date(
      stored.updatedAt || 0
    ).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : 0;
}

function getCourseProgressData(course) {
  const stored =
    getCourseStoredProgress(
      course
    );

  const apiSlideCount = Number(
    course?.totalSlides ||
    course?.total_slides ||
    course?.slides?.length ||
    0
  );

  const totalSlides =
    stored.totalSlides > 0
      ? stored.totalSlides
      : Math.max(
          0,
          apiSlideCount
        );

  if (
    totalSlides > 0 ||
    stored.completedSlideIds.length > 0
  ) {
    const completedCount =
      Math.min(
        totalSlides,
        stored
          .completedSlideIds
          .length
      );

    return {
      progress:
        calculateTutorialProgress(
          totalSlides,
          stored
            .completedSlideIds
        ),
      completedCount,
      totalSlides,
    };
  }

  /*
   * Fallback untuk data lama jika API
   * pernah mengirim progress langsung.
   */
  const apiProgress = Number(
    course?.progress ??
    course?.completedProgress ??
    course?.completion ??
    0
  );

  return {
    progress:
      Number.isFinite(apiProgress)
        ? Math.max(
            0,
            Math.min(
              100,
              apiProgress
            )
          )
        : 0,
    completedCount: 0,
    totalSlides,
  };
}

function getCourseProgress(course) {
  return getCourseProgressData(
    course
  ).progress;
}

function getCourseMeta(
  course,
  progressData
) {
  const slideCount = Number(
    progressData?.totalSlides ||
    course?.totalSlides ||
    course?.total_slides ||
    course?.slides?.length ||
    0
  );

  const duration =
    course?.estimatedTime ||
    course?.estimated_time ||
    'Durasi belum diatur';

  const pages =
    slideCount > 0
      ? `${slideCount} materi`
      : 'Jumlah materi belum diatur';

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
  const [sortMode, setSortMode] = useState('Terakhir Dibuka');
  const [progressVersion, setProgressVersion] = useState(0);
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

  useEffect(() => {
    const refreshProgress = () => {
      setProgressVersion(
        (value) => value + 1
      );
    };

    window.addEventListener(
      LEARNING_PROGRESS_EVENT,
      refreshProgress
    );

    window.addEventListener(
      'storage',
      refreshProgress
    );

    return () => {
      window.removeEventListener(
        LEARNING_PROGRESS_EVENT,
        refreshProgress
      );

      window.removeEventListener(
        'storage',
        refreshProgress
      );
    };
  }, []);

  /*
   * Halaman Progres Belajar diperlakukan seperti histori.
   * Materi yang baru dipublish TIDAK langsung muncul.
   * Materi baru masuk setelah user pernah membuka detailnya.
   */
  const historyCourses =
    useMemo(
      () =>
        courses.filter(
          hasCourseHistory
        ),
      [
        courses,
        progressVersion,
      ]
    );


  const displayedCourses = useMemo(() => {
    const query =
      searchTerm
        .trim()
        .toLowerCase();

    const filteredCourses =
      historyCourses.filter(
        (course) => {
          if (!query) {
            return true;
          }

          return [
            course.title,
            course.category,
            course.shortDescription,
            course.short_description,
            course.difficulty,
            course.difficultyLevel,
            course.difficulty_level,
          ]
            .filter(Boolean)
            .some(
              (value) =>
                String(value)
                  .toLowerCase()
                  .includes(query)
            );
        }
      );

    return [
      ...filteredCourses,
    ].sort((left, right) => {
      if (
        sortMode ===
        'Terakhir Dibuka'
      ) {
        return (
          getCourseLastOpenedTime(
            right
          ) -
          getCourseLastOpenedTime(
            left
          )
        );
      }

      if (sortMode === 'Terbaru') {
        return (
          new Date(
            right.updatedAt ||
            right.updated_at ||
            right.createdAt ||
            right.created_at ||
            0
          ) -
          new Date(
            left.updatedAt ||
            left.updated_at ||
            left.createdAt ||
            left.created_at ||
            0
          )
        );
      }

      if (
        sortMode === 'Progress'
      ) {
        return (
          getCourseProgress(right) -
          getCourseProgress(left)
        );
      }

      return (
        getCourseOrder(left) -
        getCourseOrder(right)
      );
    });
  }, [
    historyCourses,
    searchTerm,
    sortMode,
  ]);

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
        <UserDashboardTopbar fullName={fullName} profileImage={profileImage} />

        <main className="dashboard-content user-progress-content">
          <div className="dashboard-user-greeting">
            <h1>Hello {greetingName}</h1>
            <span aria-hidden="true">&#128075;&#127995;</span>
          </div>

          <section className="user-progress-panel" aria-labelledby="progress-title">
            <div className="user-progress-header">
              <h2 id="progress-title">Progres Belajar ({historyCourses.length} materi)</h2>
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
                      <option>Terakhir Dibuka</option>
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
                <p>
                  Belum ada riwayat materi. Buka salah satu materi terlebih dahulu,
                  lalu materi tersebut akan muncul di halaman ini.
                </p>
              ) : (
                displayedCourses.map((course) => {
                  const progressData =
                    getCourseProgressData(
                      course
                    );

                  const progress =
                    progressData.progress;

                  const imageUrl =
                    getCourseImage(
                      course
                    );

                  const detailUrl =
                    getCourseHref(
                      course
                    );

                  const openCourse = () => {
                    window.location.href =
                      detailUrl;
                  };

                  return (
                    <article
                      className="user-course-card"
                      key={
                        course.id ||
                        course.slug
                      }
                      role="link"
                      tabIndex={0}
                      aria-label={`Buka materi ${
                        course.title ||
                        'Materi'
                      }`}
                      title="Buka materi"
                      onClick={openCourse}
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                            'Enter' ||
                          event.key ===
                            ' '
                        ) {
                          event.preventDefault();
                          openCourse();
                        }
                      }}
                      style={{
                        cursor: 'pointer',
                      }}
                    >
                      <img
                        src={imageUrl}
                        alt={
                          course.title ||
                          'Cover materi'
                        }
                        loading="lazy"
                        onError={(
                          event
                        ) => {
                          event.currentTarget.onerror =
                            null;

                          event.currentTarget.src =
                            courseImage;
                        }}
                      />

                      <h3>
                        {course.title ||
                          'Materi tanpa judul'}
                      </h3>

                      <p>
                        {course.category ||
                          'Tanpa kategori'}
                      </p>

                      <div
                        className="user-course-card__progress"
                        role="progressbar"
                        aria-label={`Progress ${progress}%`}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={
                          progress
                        }
                      >
                        <span
                          style={{
                            width:
                              `${progress}%`,
                          }}
                        />
                      </div>

                      <small>
                        {progress}% selesai

                        {progressData.totalSlides >
                        0
                          ? ` · ${progressData.completedCount}/${progressData.totalSlides} materi`
                          : ''}

                        {' · '}

                        {getCourseMeta(
                          course,
                          progressData
                        )}
                      </small>
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
