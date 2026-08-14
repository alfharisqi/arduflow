import { useEffect, useMemo, useState } from 'react';
import { AdminSidebar } from './AdminSidebar.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import bookIcon from '../../assets/icons/icon-book-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import fileIcon from '../../assets/icons/icon-file-text-1.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import zapIcon from '../../assets/icons/icon-zap-1.svg';
import { apiEndpoint } from '../../services/apiEndpoints.js';

const ARTICLE_API_URL = apiEndpoint(
  import.meta.env.VITE_ARTICLE_API_URL,
  '/api/article-api.php'
);

const TUTORIAL_API_ORIGIN = (() => {
  try {
    return new URL(ARTICLE_API_URL).origin;
  } catch {
    return '';
  }
})();

const tutorialImageModules = import.meta.glob('../../assets/images/*', {
  eager: true,
  import: 'default',
  query: '?url',
});

const tutorialImageMap = Object.entries(tutorialImageModules).reduce(
  (images, [path, url]) => {
    const fileName = path.split('/').pop() || '';
    const key = fileName
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    images[key] = url;
    images[fileName.toLowerCase()] = url;

    return images;
  },
  {}
);

function AdminTutorialTopbar() {
  return (
    <header className="admin-dashboard-topbar">
      <label className="admin-dashboard-search">
        <span aria-hidden="true" />
        <input
          type="search"
          placeholder="Cari tutorial / materi"
          aria-label="Cari tutorial atau materi"
        />
      </label>

      <div className="admin-dashboard-account">
        <button
          className="admin-dashboard-notif"
          type="button"
          aria-label="Notifikasi"
        >
          <img src={bellIcon} alt="" />
        </button>

        <span className="admin-dashboard-avatar" aria-hidden="true" />

        <span>
          <strong>Admin</strong>
          <small>Super Admin</small>
        </span>
      </div>
    </header>
  );
}

function TutorialBadge({ children }) {
  const slug = String(children || '-')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-');

  return (
    <span className={`admin-tutorial-badge admin-tutorial-badge--${slug}`}>
      {children || '-'}
    </span>
  );
}

function TutorialAction({ label, children, onClick, tone = '' }) {
  return (
    <button
      className={`admin-tutorial-action${
        tone ? ` admin-tutorial-action--${tone}` : ''
      }`}
      type="button"
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function TutorialThumbnail({ src, index = 0, large = false }) {
  const [hasError, setHasError] = useState(false);
  const fallbackClassName = large
    ? 'admin-tutorial-detail-image'
    : `admin-tutorial-thumb is-${index % 4}`;

  if (!src || hasError) {
    return <span className={fallbackClassName} />;
  }

  return (
    <img
      className={large ? 'admin-tutorial-detail-image' : 'admin-tutorial-thumb'}
      src={src}
      alt=""
      onError={() => setHasError(true)}
    />
  );
}

function normalizeStatus(value) {
  const status = String(value || 'draft').toLowerCase();

  if (status === 'published') {
    return 'Published';
  }

  if (status === 'pending_review') {
    return 'Pending Review';
  }

  if (status === 'archived') {
    return 'Archived';
  }

  return 'Draft';
}

function formatDate(value, includeTime = false) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
        }
      : {}),
  }).format(date);
}

function parseImageValue(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeImageKey(value) {
  return String(value || '')
    .split(/[\\/]/)
    .pop()
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function resolvePublicImageUrl(value) {
  const candidate = String(value || '').trim();

  if (!candidate) {
    return '';
  }

  if (/^(data:image\/|https?:\/\/|blob:)/i.test(candidate)) {
    return candidate;
  }

  if (candidate.startsWith('/') && TUTORIAL_API_ORIGIN) {
    return `${TUTORIAL_API_ORIGIN}${candidate}`;
  }

  if (
    /^storage\/uploads\//i.test(candidate) &&
    TUTORIAL_API_ORIGIN
  ) {
    return `${TUTORIAL_API_ORIGIN}/${candidate}`;
  }

  return '';
}

function resolveTutorialImage(item) {
  const imageData = parseImageValue(
    item.card_image ||
      item.cardImage ||
      item.thumbnail ||
      item.image ||
      item.card_image_name
  );

  const candidates = [];

  if (typeof imageData === 'string') {
    candidates.push(imageData);
  }

  if (imageData && typeof imageData === 'object') {
    candidates.push(
      imageData.data_url,
      imageData.dataUrl,
      imageData.url,
      imageData.src,
      imageData.path,
      imageData.file_name,
      imageData.fileName,
      imageData.name
    );
  }

  candidates.push(
    item.card_image_url,
    item.image_url,
    item.thumbnail_url,
    item.card_image_name,
    item.title
  );

  for (const candidate of candidates.filter(Boolean)) {
    const publicUrl = resolvePublicImageUrl(candidate);

    if (publicUrl) {
      return publicUrl;
    }

    const key = normalizeImageKey(candidate);
    const fileName = String(candidate).split(/[\\/]/).pop().toLowerCase();

    if (tutorialImageMap[fileName]) {
      return tutorialImageMap[fileName];
    }

    if (tutorialImageMap[key]) {
      return tutorialImageMap[key];
    }
  }

  return '';
}

function normalizeTutorial(item) {
  const status = normalizeStatus(item.status);
  const imageSrc = resolveTutorialImage(item);

  return {
    ...item,
    id: item.id,
    title: item.title || 'Tanpa Judul',
    slug: item.slug || '',
    description: item.short_description || '-',
    fullDescription: item.full_description || '-',
    category: item.category || '-',
    level: item.difficulty_level || '-',
    estimatedTime: item.estimated_time || '-',
    status,
    author: 'Admin',
    viewer: 0,
    completed: 0,
    imageSrc,
    totalSlides: Number(item.total_slides || item.slides?.length || 0),
    createdAtRaw: item.created_at || null,
    updatedAtRaw: item.updated_at || item.created_at || null,
    createdAt: formatDate(item.created_at),
    publishedAt:
      status === 'Published' ? formatDate(item.created_at) : '-',
    updatedAt: formatDate(item.updated_at || item.created_at),
    updatedAtWithTime: formatDate(
      item.updated_at || item.created_at,
      true
    ),
  };
}

export function AdminTutorial() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialAdminSidebarCollapsed
  );

  const [tutorials, setTutorials] = useState([]);
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistAdminSidebarCollapsed(nextValue);
      return nextValue;
    });
  };

  const handleEditTutorial = (tutorial) => {
    if (!tutorial?.id) {
      return;
    }

    window.location.href = `/admin/tutorial/edit?id=${encodeURIComponent(
      tutorial.id
    )}`;
  };

  const handleDeleteTutorial = async (tutorial) => {
    if (!tutorial?.id) {
      return;
    }

    const isConfirmed = window.confirm(
      `Hapus materi "${tutorial.title}"? Data yang sudah dihapus tidak bisa dikembalikan.`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${ARTICLE_API_URL}?id=${encodeURIComponent(
          tutorial.id
        )}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      const responseText = await response.text();
      let result = {};

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Response API bukan JSON yang valid. Isi response: ${responseText.slice(
            0,
            250
          )}`
        );
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || `API mengembalikan HTTP ${response.status}.`
        );
      }

      setTutorials((current) =>
        current.filter((item) => String(item.id) !== String(tutorial.id))
      );

      setSelectedTutorial((current) =>
        current && String(current.id) === String(tutorial.id) ? null : current
      );

      window.alert(result.message || 'Materi berhasil dihapus.');
    } catch (error) {
      console.error('Gagal menghapus materi tutorial:', error);
      window.alert(
        error.message || 'Materi gagal dihapus dari database.'
      );
    }
  };

  const fetchTutorials = async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await fetch(ARTICLE_API_URL, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const responseText = await response.text();

      let result;

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Response API bukan JSON yang valid. Isi response: ${responseText.slice(
            0,
            250
          )}`
        );
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || `API mengembalikan HTTP ${response.status}.`
        );
      }

      const rows = Array.isArray(result.data) ? result.data : [];
      const normalizedRows = rows.map(normalizeTutorial);

      setTutorials(normalizedRows);

      setSelectedTutorial((current) => {
        if (!normalizedRows.length) {
          return null;
        }

        if (!current) {
          return null;
        }

        return normalizedRows.find((item) => item.id === current.id) || null;
      });

      console.group('DEBUG ADMIN TUTORIAL SQLITE');
      console.log('Method:', 'GET');
      console.log('Endpoint:', ARTICLE_API_URL);
      console.log('Response:', result);
      console.log('Data tabel:', normalizedRows);
      console.groupEnd();
    } catch (error) {
      console.error('Gagal mengambil data tutorial SQLite:', error);
      setTutorials([]);
      setSelectedTutorial(null);
      setLoadError(
        error.message ||
          'Data tutorial tidak dapat diambil dari API SQLite.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorials();
  }, []);

  const tutorialStats = useMemo(() => {
    const total = tutorials.length;
    const published = tutorials.filter(
      (item) => item.status === 'Published'
    ).length;
    const draft = tutorials.filter(
      (item) => item.status === 'Draft'
    ).length;
    const pendingReview = tutorials.filter(
      (item) => item.status === 'Pending Review'
    ).length;

    const publishedPercent = total
      ? ((published / total) * 100).toFixed(1)
      : '0.0';

    const draftPercent = total
      ? ((draft / total) * 100).toFixed(1)
      : '0.0';

    return [
      {
        label: 'Total Tutorial',
        value: String(total),
        note: 'Data dari SQLite',
        icon: bookIcon,
        tone: 'blue',
      },
      {
        label: 'Tutorial Published',
        value: String(published),
        note: `${publishedPercent}% dari total`,
        icon: checkIcon,
        tone: 'green',
      },
      {
        label: 'Draft Belum Publish',
        value: String(draft),
        note: `${draftPercent}% dari total`,
        icon: fileIcon,
        tone: 'orange',
      },
      {
        label: 'Total Viewer / Pembaca',
        value: '0',
        note: 'Field viewer belum tersedia',
        icon: usersIcon,
        tone: 'blue',
      },
      {
        label: 'Materi Paling Populer',
        value: 'Belum tersedia',
        note: 'Butuh data viewer',
        icon: zapIcon,
        tone: 'purple',
      },
      {
        label: 'Materi Perlu Revisi',
        value: String(pendingReview),
        note: 'Status Pending Review',
        icon: clockIcon,
        tone: 'red',
      },
    ];
  }, [tutorials]);

  const categoryOptions = useMemo(() => {
    return [...new Set(tutorials.map((item) => item.category).filter(Boolean))];
  }, [tutorials]);

  const levelOptions = useMemo(() => {
    return [...new Set(tutorials.map((item) => item.level).filter(Boolean))];
  }, [tutorials]);

  const filteredTutorials = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return tutorials.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword) ||
        item.slug.toLowerCase().includes(keyword);

      const matchesStatus =
        !statusFilter || item.status === statusFilter;

      const matchesCategory =
        !categoryFilter || item.category === categoryFilter;

      const matchesLevel = !levelFilter || item.level === levelFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesLevel
      );
    });
  }, [
    tutorials,
    searchTerm,
    statusFilter,
    categoryFilter,
    levelFilter,
  ]);

  const latestTutorials = useMemo(() => {
    return [...tutorials]
      .sort((a, b) => {
        const dateA = new Date(a.createdAtRaw || 0).getTime();
        const dateB = new Date(b.createdAtRaw || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [tutorials]);

  const draftTutorials = useMemo(() => {
    return tutorials
      .filter((item) => item.status === 'Draft')
      .slice(0, 5);
  }, [tutorials]);

  const issueItems = useMemo(() => {
    const thumbnailEmpty = tutorials.filter(
      (item) => !item.card_image_name
    ).length;

    const categoryEmpty = tutorials.filter(
      (item) => !item.category || item.category === '-'
    ).length;

    const shortContent = tutorials.filter(
      (item) => String(item.full_description || '').trim().length < 300
    ).length;

    return [
      ['Thumbnail kosong', thumbnailEmpty],
      ['Link rusak', 0],
      ['Belum punya kategori', categoryEmpty],
      ['Konten terlalu pendek (< 300 kata)', shortContent],
      ['Belum ada quiz / praktik', 0],
    ];
  }, [tutorials]);

  const activityItems = useMemo(() => {
    return [...tutorials]
      .sort((a, b) => {
        const dateA = new Date(a.updatedAtRaw || 0).getTime();
        const dateB = new Date(b.updatedAtRaw || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5)
      .map((item) => [
        `Tutorial "${item.title}" ${
          item.status === 'Published' ? 'dipublish / diupdate' : 'disimpan'
        }`,
        item.updatedAtWithTime,
        item.status === 'Published'
          ? 'green'
          : item.status === 'Pending Review'
          ? 'purple'
          : 'orange',
      ]);
  }, [tutorials]);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCategoryFilter('');
    setLevelFilter('');
  };

  return (
    <main
      className={`admin-dashboard-page admin-tutorial-page${
        isSidebarCollapsed ? ' admin-dashboard-page--collapsed' : ''
      }`}
    >
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      <section
        className="admin-dashboard-main"
        aria-label="Tutorial dan materi admin"
      >
        <AdminTutorialTopbar />

        <div className="admin-tutorial-layout">
          <section className="admin-tutorial-content">
            <div className="admin-tutorial-heading">
              <div>
                <h1>Tutorial / Materi</h1>
                <p>
                  Dashboard <span>/</span> Tutorial / Materi
                </p>
              </div>
            </div>

            <section
              className="admin-tutorial-stats"
              aria-label="Ringkasan tutorial"
            >
              {tutorialStats.map((item) => (
                <article className="admin-tutorial-stat" key={item.label}>
                  <span
                    className={`admin-tutorial-stat-icon is-${item.tone}`}
                  >
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

            <section
              className="admin-tutorial-filter"
              aria-label="Filter tutorial"
            >
              <label className="admin-tutorial-search">
                <input
                  type="search"
                  placeholder="Cari judul tutorial..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>

              <label>
                <span>Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">Semua Status</option>
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Archived">Archived</option>
                </select>
              </label>

              <label>
                <span>Kategori</span>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option value="">Semua Kategori</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Level</span>
                <select
                  value={levelFilter}
                  onChange={(event) => setLevelFilter(event.target.value)}
                >
                  <option value="">Semua Level</option>
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Author / Admin</span>
                <select value="" disabled>
                  <option value="">Admin</option>
                </select>
              </label>

              <label>
                <span>Tanggal Publish</span>
                <input
                  type="text"
                  placeholder="Belum tersedia di filter API"
                  disabled
                />
              </label>

              <button type="button" onClick={resetFilters}>
                Reset Filter
              </button>
            </section>

            <div className="admin-tutorial-table-toolbar">
              <a
                className="admin-tutorial-primary"
                href="/admin/tutorial/tambah"
              >
                + Tambah Materi
              </a>

              <button type="button" onClick={fetchTutorials}>
                {isLoading ? 'Memuat...' : 'Muat Ulang SQLite'}
              </button>
            </div>

            <section className="admin-tutorial-table-card">
              <table className="admin-tutorial-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Pilih semua tutorial"
                      />
                    </th>
                    <th>Judul Tutorial</th>
                    <th>Kategori</th>
                    <th>Level</th>
                    <th>Status</th>
                    <th>Author</th>
                    <th>Viewer</th>
                    <th>Selesai</th>
                    <th>Tgl Dibuat</th>
                    <th>Tgl Publish</th>
                    <th>Update Terakhir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan="12">Memuat data tutorial dari SQLite...</td>
                    </tr>
                  )}

                  {!isLoading && loadError && (
                    <tr>
                      <td colSpan="12">
                        <strong>Gagal mengambil data SQLite.</strong>
                        <br />
                        <small>{loadError}</small>
                        <br />
                        <small>
                          Endpoint: {ARTICLE_API_URL}
                        </small>
                      </td>
                    </tr>
                  )}

                  {!isLoading && !loadError && filteredTutorials.length === 0 && (
                    <tr>
                      <td colSpan="12">
                        Belum ada data materi yang sesuai di SQLite.
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    !loadError &&
                    filteredTutorials.map((item, index) => (
                      <tr key={item.id || item.slug || item.title}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Pilih ${item.title}`}
                          />
                        </td>

                        <td>
                          <TutorialThumbnail
                            src={item.imageSrc}
                            index={index}
                          />
                          <span>
                            <b>{item.title}</b>
                            <small>{item.description}</small>
                          </span>
                        </td>

                        <td>
                          <TutorialBadge>{item.category}</TutorialBadge>
                        </td>

                        <td>
                          <TutorialBadge>{item.level}</TutorialBadge>
                        </td>

                        <td>
                          <TutorialBadge>{item.status}</TutorialBadge>
                        </td>

                        <td>{item.author}</td>
                        <td>{item.viewer}</td>
                        <td>{item.completed}</td>
                        <td>{item.createdAt}</td>
                        <td>{item.publishedAt}</td>
                        <td>{item.updatedAt}</td>

                        <td>
                          <div className="admin-tutorial-actions">
                            <TutorialAction
                              label={`Lihat ${item.title}`}
                              onClick={() => setSelectedTutorial(item)}
                            >
                              <img src={eyeIcon} alt="" />
                            </TutorialAction>

                            <TutorialAction
                              label={`Edit ${item.title}`}
                              onClick={() => handleEditTutorial(item)}
                            >
                              Edit
                            </TutorialAction>

                            <TutorialAction
                              label={`Delete ${item.title}`}
                              onClick={() => handleDeleteTutorial(item)}
                              tone="danger"
                            >
                              Delete
                            </TutorialAction>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <div className="admin-tutorial-pagination">
                <span>
                  Menampilkan {filteredTutorials.length ? 1 : 0} -{' '}
                  {filteredTutorials.length} dari {filteredTutorials.length}{' '}
                  data
                </span>

                <div>
                  <button type="button" disabled>
                    &lt;
                  </button>
                  <button type="button" className="is-active">
                    1
                  </button>
                  <button type="button" disabled>
                    &gt;
                  </button>
                </div>

                <select defaultValue="10">
                  <option value="10">10 / halaman</option>
                </select>
              </div>
            </section>

            <section className="admin-tutorial-bottom">
              <article className="admin-tutorial-panel">
                <div className="admin-tutorial-panel-head">
                  <h2>Materi Terbaru dari SQLite</h2>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Judul</th>
                      <th>Status</th>
                      <th>Dibuat</th>
                    </tr>
                  </thead>

                  <tbody>
                    {latestTutorials.length === 0 ? (
                      <tr>
                        <td colSpan="4">Belum ada materi.</td>
                      </tr>
                    ) : (
                      latestTutorials.map((item, index) => (
                        <tr key={item.id || item.slug}>
                          <td>{index + 1}</td>
                          <td>{item.title}</td>
                          <td>{item.status}</td>
                          <td>{item.createdAt}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </article>

              <article className="admin-tutorial-panel">
                <div className="admin-tutorial-panel-head">
                  <h2>Draft Perlu Dilanjutkan</h2>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Judul</th>
                      <th>Author</th>
                      <th>Terakhir Diedit</th>
                    </tr>
                  </thead>

                  <tbody>
                    {draftTutorials.length === 0 ? (
                      <tr>
                        <td colSpan="3">Tidak ada draft.</td>
                      </tr>
                    ) : (
                      draftTutorials.map((item) => (
                        <tr key={item.id || item.slug}>
                          <td>{item.title}</td>
                          <td>{item.author}</td>
                          <td>{item.updatedAt}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </article>

              <article className="admin-tutorial-panel admin-tutorial-issues">
                <div className="admin-tutorial-panel-head">
                  <h2>Materi Bermasalah</h2>
                </div>

                {issueItems.map((item) => (
                  <p key={item[0]}>
                    <span>{item[0]}</span>
                    <strong>{item[1]}</strong>
                  </p>
                ))}
              </article>

              <article className="admin-tutorial-panel admin-tutorial-activity">
                <div className="admin-tutorial-panel-head">
                  <h2>Aktivitas Terbaru</h2>
                </div>

                {activityItems.length === 0 ? (
                  <p>
                    <b>Belum ada aktivitas materi.</b>
                  </p>
                ) : (
                  activityItems.map((item) => (
                    <p key={`${item[0]}-${item[1]}`}>
                      <span
                        className={`admin-tutorial-dot is-${item[2]}`}
                      />
                      <b>{item[0]}</b>
                      <time>{item[1]}</time>
                    </p>
                  ))
                )}
              </article>
            </section>

            <section className="admin-tutorial-quick">
              <h2>Aksi Cepat</h2>
              <div>
                <a href="/admin/tutorial/tambah">Buat Tutorial Baru</a>
                <button type="button" onClick={fetchTutorials}>
                  Muat Ulang Data SQLite
                </button>
                <button type="button">Export Data Tutorial</button>
                <button type="button">Cek Link Rusak</button>
                <button type="button">Reorder Materi Belajar</button>
              </div>
            </section>
          </section>

          {selectedTutorial ? (
            <div
              className="admin-tutorial-detail-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Detail tutorial"
            >
              <button
                type="button"
                className="admin-tutorial-detail-backdrop"
                aria-label="Tutup detail"
                onClick={() => setSelectedTutorial(null)}
              />

              <aside className="admin-tutorial-detail">
                <div className="admin-tutorial-detail-head">
                  <h2>Detail Tutorial</h2>
                  <button
                    type="button"
                    aria-label="Tutup detail"
                    onClick={() => setSelectedTutorial(null)}
                  >
                    x
                  </button>
                </div>

                <div className="admin-tutorial-detail-profile">
                  <TutorialThumbnail
                    src={selectedTutorial.imageSrc}
                    large
                  />
                  <div>
                    <h3>{selectedTutorial.title}</h3>
                    <TutorialBadge>{selectedTutorial.status}</TutorialBadge>
                  </div>
                </div>

                <dl>
                  <dt>Kategori</dt>
                  <dd>{selectedTutorial.category}</dd>

                  <dt>Level</dt>
                  <dd>{selectedTutorial.level}</dd>

                  <dt>Author</dt>
                  <dd>{selectedTutorial.author}</dd>

                  <dt>Slug</dt>
                  <dd>{selectedTutorial.slug || '-'}</dd>

                  <dt>Deskripsi Singkat</dt>
                  <dd>{selectedTutorial.description}</dd>

                  <dt>Total Slide</dt>
                  <dd>{selectedTutorial.totalSlides}</dd>
                </dl>

                <section className="admin-tutorial-detail-stats">
                  <article>
                    <span>Viewer</span>
                    <strong>{selectedTutorial.viewer}</strong>
                  </article>

                  <article>
                    <span>User Selesai</span>
                    <strong>{selectedTutorial.completed}</strong>
                  </article>

                  <article>
                    <span>Estimasi Waktu</span>
                    <strong>{selectedTutorial.estimatedTime}</strong>
                  </article>

                  <article>
                    <span>Tanggal Publish</span>
                    <strong>{selectedTutorial.publishedAt}</strong>
                  </article>
                </section>

                <section className="admin-tutorial-history">
                  <h3>Riwayat Update Terakhir</h3>
                  <p>
                    {selectedTutorial.updatedAtWithTime} oleh{' '}
                    {selectedTutorial.author}
                  </p>
                </section>

                <div className="admin-tutorial-detail-actions">
                  <button
                    type="button"
                    className="is-blue"
                    onClick={() => handleEditTutorial(selectedTutorial)}
                  >
                    Edit Tutorial
                  </button>
                  {/* <button type="button">Preview</button>
                  <button type="button" className="is-green">
                    Publish / Unpublish
                  </button>
                  <button type="button" className="is-purple">
                    Lihat Statistik
                  </button>
                  <button type="button" className="is-orange">
                    Arsipkan Tutorial
                  </button> */}
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
