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

const DEPLOY_URL = (
  import.meta.env.VITE_DEPLOY_URL ||
  'https://arduflow.indobilliard.com/apk/uploads/web-arduflow-deploy-alfha/'
).replace(/\/+$/, '');

const MATERI_API_URL =
  `${DEPLOY_URL}/api/materi-api.php`;

const MATERI_IMAGE_BASE_URL =
  `${DEPLOY_URL}/uploads/materi`;

function extractMateriImageFileName(value) {
  const candidate = String(value || '').trim();

  if (!candidate) {
    return '';
  }

  try {
    const parsed = new URL(
      candidate,
      window.location.origin
    );

    const queryFile =
      parsed.searchParams.get('file');

    if (queryFile) {
      return (
        String(queryFile)
          .split(/[\\/]/)
          .pop() || ''
      );
    }

    const path = decodeURIComponent(
      parsed.pathname || ''
    );

    if (
      /\/uploads\/materi\//i.test(path) ||
      /\/storage\/materi\//i.test(path)
    ) {
      return path.split('/').pop() || '';
    }
  } catch {
    // Bukan URL, lanjutkan sebagai nama file.
  }

  if (
    /^[^/\\]+\.(jpe?g|png|webp|gif|svg)$/i.test(
      candidate
    )
  ) {
    return candidate;
  }

  if (
    /(?:uploads|storage)\/materi\//i.test(
      candidate
    )
  ) {
    return (
      candidate
        .split(/[\\/]/)
        .pop() || ''
    );
  }

  return '';
}

function resolveMateriImageUrl(
  value,
  fallbackFileName = ''
) {
  const candidate = String(value || '').trim();

  if (
    /^(data:image\/|blob:)/i.test(
      candidate
    )
  ) {
    return candidate;
  }

  const fileName =
    extractMateriImageFileName(candidate) ||
    extractMateriImageFileName(fallbackFileName);

  if (fileName) {
    return (
      `${MATERI_IMAGE_BASE_URL}/` +
      encodeURIComponent(fileName)
    );
  }

  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }

  return '';
}

function getMateriImageProxyUrl(fileName) {
  const safeFileName =
    extractMateriImageFileName(fileName);

  if (!safeFileName) {
    return '';
  }

  return (
    `${MATERI_API_URL}?action=image&scope=card&file=` +
    encodeURIComponent(safeFileName)
  );
}

function handleMateriImageError(event, fileName) {
  const image = event.currentTarget;

  if (
    image.dataset.fallbackApplied === '1'
  ) {
    image.style.display = 'none';
    return;
  }

  const proxyUrl =
    getMateriImageProxyUrl(fileName);

  if (!proxyUrl) {
    image.style.display = 'none';
    return;
  }

  image.dataset.fallbackApplied = '1';
  image.src = proxyUrl;
}

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

function TutorialAction({
  label,
  children,
  onClick,
  variant = 'default',
  disabled = false,
}) {
  const variantStyle = {
    view: {
      color: '#2563eb',
      background: '#eff6ff',
      borderColor: '#bfdbfe',
    },
    edit: {
      color: '#d97706',
      background: '#fffbeb',
      borderColor: '#fde68a',
    },
    delete: {
      color: '#dc2626',
      background: '#fef2f2',
      borderColor: '#fecaca',
    },
    default: {},
  }[variant] || {};

  return (
    <button
      className={`admin-tutorial-action admin-tutorial-action--${variant}`}
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 34,
        height: 34,
        minWidth: 34,
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        ...variantStyle,
      }}
    >
      {children}
    </button>
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

function htmlToPlainText(value = '') {
  return String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function getSlideSummary(slide) {
  const source =
    slide?.body_text ??
    slide?.content ??
    slide?.code_content ??
    '';

  const plainText = htmlToPlainText(source);

  if (!plainText) {
    return '';
  }

  return plainText.length > 180
    ? `${plainText.slice(0, 180)}…`
    : plainText;
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

function normalizeTutorial(item) {
  const status = normalizeStatus(item.status);

  const cardImageName = String(
    item.card_image_name ||
    item.cardImageName ||
    ''
  ).trim();

  const cardImageUrl =
    resolveMateriImageUrl(
      item.card_image_url ||
      item.cardImageUrl ||
      '',
      cardImageName
    );

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
    cardImageName,
    cardImageUrl,
    status,
    author: item.author || 'Admin',
    viewer: Number(item.viewer || 0),
    completed: Number(item.completed || 0),
    totalSlides: Number(item.total_slides || item.slides?.length || 0),
    createdAtRaw: item.created_at || null,
    updatedAtRaw: item.updated_at || item.created_at || null,
    createdAt: formatDate(item.created_at),
    publishedAt:
      status === 'Published'
        ? formatDate(item.published_at || item.created_at)
        : '-',
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
  const [deletingId, setDeletingId] = useState(null);

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

  const fetchTutorials = async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await fetch(MATERI_API_URL, {
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

      // Jangan membuka detail otomatis saat halaman Tutorial dibuka.
      // Popup detail hanya boleh muncul setelah tombol mata diklik.
      setSelectedTutorial((current) => {
        if (!current) {
          return null;
        }

        return (
          normalizedRows.find(
            (item) => String(item.id) === String(current.id)
          ) || null
        );
      });

      console.group('DEBUG ADMIN TUTORIAL SQLITE');
      console.log('Method:', 'GET');
      console.log('Endpoint:', MATERI_API_URL);
      console.log('Response:', result);
      console.log('Data tabel:', normalizedRows);
      console.groupEnd();
    } catch (error) {
      console.error('Gagal mengambil data materi:', error);
      setTutorials([]);
      setSelectedTutorial(null);
      setLoadError(
        error.message ||
          'Data materi tidak dapat diambil dari API deploy.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTutorial = (item) => {
    setSelectedTutorial(item);
  };

  const handleEditTutorial = (item) => {
    if (!item?.id) {
      return;
    }

    window.location.href =
      `/admin/tutorial/tambah?id=${encodeURIComponent(item.id)}`;
  };

  const handleDeleteTutorial = async (item) => {
    if (!item?.id || deletingId !== null) {
      return;
    }

    const confirmed = window.confirm(
      `Hapus materi "${item.title}"? Data materi dan file gambar terkait akan dihapus.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);

    try {
      const response = await fetch(
        `${MATERI_API_URL}?id=${encodeURIComponent(item.id)}`,
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
          `Response hapus bukan JSON yang valid. HTTP ${response.status}.`
        );
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || `Gagal menghapus materi. HTTP ${response.status}.`
        );
      }

      setSelectedTutorial((current) =>
        current?.id === item.id ? null : current
      );

      await fetchTutorials();
    } catch (error) {
      console.error('Gagal menghapus materi:', error);
      window.alert(
        error.message || 'Materi gagal dihapus dari server.'
      );
    } finally {
      setDeletingId(null);
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
        note: 'Data dari API',
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
                      <td colSpan="12">Memuat data materi dari API deploy...</td>
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
                          Endpoint: {MATERI_API_URL}
                        </small>
                      </td>
                    </tr>
                  )}

                  {!isLoading && !loadError && filteredTutorials.length === 0 && (
                    <tr>
                      <td colSpan="12">
                        Belum ada data materi yang sesuai di server.
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
                          {item.cardImageUrl ? (
                            <img
                              className={`admin-tutorial-thumb is-${index % 4}`}
                              src={item.cardImageUrl}
                              alt={`Thumbnail ${item.title}`}
                              loading="lazy"
                              onError={(event) =>
                                handleMateriImageError(
                                  event,
                                  item.cardImageName
                                )
                              }
                              style={{
                                display: 'block',
                                width: 56,
                                height: 42,
                                minWidth: 56,
                                objectFit: 'cover',
                                borderRadius: 8,
                                background: '#eef2f7',
                              }}
                            />
                          ) : (
                            <span
                              className={`admin-tutorial-thumb is-${index % 4}`}
                              aria-hidden="true"
                            />
                          )}
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
                          <div
                            className="admin-tutorial-actions"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              flexWrap: 'nowrap',
                              minWidth: 176,
                            }}
                          >
                            <TutorialAction
                              label={`Lihat detail ${item.title}`}
                              variant="view"
                              onClick={() => handleViewTutorial(item)}
                            >
                              <img
                                src={eyeIcon}
                                alt=""
                                style={{ width: 17, height: 17 }}
                              />
                            </TutorialAction>

                            <a
                              className="admin-article-action"
                              href={`/admin/tutorial/tambah?id=${encodeURIComponent(
                                item.id
                              )}`}
                              aria-label={`Edit ${item.title}`}
                            >
                              Edit
                            </a>

                            <button
                              className="admin-article-action"
                              type="button"
                              aria-label={`Delete ${item.title}`}
                              disabled={deletingId === item.id}
                              onClick={() => handleDeleteTutorial(item)}
                            >
                              {deletingId === item.id ? 'Menghapus...' : 'Delete'}
                            </button>
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
                  <h2>Materi Terbaru</h2>
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
                <button type="button">Export Data Tutorial</button>
                <button type="button">Cek Link Rusak</button>
                <button type="button">Reorder Materi Belajar</button>
              </div>
            </section>
          </section>

          <style>{`
            .admin-tutorial-modal-backdrop {
              position: fixed;
              inset: 0;
              z-index: 10000;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
              background: rgba(15, 23, 42, 0.22);
              backdrop-filter: blur(1px);
            }

            .admin-tutorial-modal {
              width: min(760px, calc(100vw - 32px));
              max-height: calc(100vh - 48px);
              overflow: hidden;
              border: 1px solid #e2e8f0;
              border-radius: 18px;
              background: #fff;
              box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
            }

            .admin-tutorial-modal .admin-tutorial-detail-head {
              position: sticky;
              top: 0;
              z-index: 2;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 18px 22px;
              border-bottom: 1px solid #e5e7eb;
              background: #fff;
            }

            .admin-tutorial-modal .admin-tutorial-detail-head h2 {
              margin: 0;
              font-size: 18px;
            }

            .admin-tutorial-modal .admin-tutorial-detail-head button {
              width: 36px;
              height: 36px;
              border: 0;
              border-radius: 10px;
              background: #f1f5f9;
              font-size: 24px;
              line-height: 1;
              cursor: pointer;
            }

            .admin-tutorial-modal-body {
              max-height: calc(100vh - 132px);
              overflow-y: auto;
              padding: 22px;
            }

            .admin-tutorial-modal .admin-tutorial-detail-profile {
              display: flex;
              align-items: center;
              gap: 16px;
              padding-bottom: 20px;
              border-bottom: 1px solid #eef2f7;
            }

            .admin-tutorial-modal .admin-tutorial-detail-image {
              width: 108px;
              height: 80px;
              min-width: 108px;
              object-fit: cover;
              border-radius: 12px;
              background: #eef2f7;
            }

            .admin-tutorial-modal .admin-tutorial-detail-profile h3 {
              margin: 0 0 10px;
              font-size: 21px;
            }

            .admin-tutorial-detail-list {
              display: grid;
              grid-template-columns: 150px minmax(0, 1fr);
              gap: 12px 18px;
              margin: 22px 0;
            }

            .admin-tutorial-detail-list dt {
              font-weight: 700;
              color: #475569;
            }

            .admin-tutorial-detail-list dd {
              margin: 0;
              color: #1e293b;
              overflow-wrap: anywhere;
            }

            .admin-tutorial-modal-section {
              margin-top: 20px;
              padding-top: 18px;
              border-top: 1px solid #e2e8f0;
            }

            .admin-tutorial-modal-section > h3 {
              margin: 0 0 10px;
              font-size: 15px;
              color: #0f172a;
            }

            .admin-tutorial-modal-section > p {
              margin: 0;
              color: #475569;
              line-height: 1.65;
              white-space: pre-wrap;
            }

            .admin-tutorial-chapter-list {
              display: grid;
              gap: 12px;
            }

            .admin-tutorial-chapter-card {
              padding: 14px;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              background: #f8fafc;
            }

            .admin-tutorial-chapter-card > header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              margin-bottom: 10px;
            }

            .admin-tutorial-chapter-card > header strong {
              color: #0f172a;
            }

            .admin-tutorial-chapter-card > header small {
              color: #64748b;
            }

            .admin-tutorial-material-list {
              display: grid;
              gap: 8px;
            }

            .admin-tutorial-material-item {
              padding: 11px 12px;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              background: #fff;
            }

            .admin-tutorial-material-item strong {
              display: block;
              margin-bottom: 4px;
              color: #1e293b;
              font-size: 14px;
            }

            .admin-tutorial-material-item small {
              display: block;
              color: #64748b;
              line-height: 1.5;
            }

            .admin-tutorial-modal .admin-tutorial-detail-stats {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px;
              margin-top: 20px;
            }

            .admin-tutorial-modal .admin-tutorial-detail-stats article {
              padding: 16px;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              background: #fff;
            }

            .admin-tutorial-modal .admin-tutorial-detail-stats article span,
            .admin-tutorial-modal .admin-tutorial-detail-stats article strong {
              display: block;
            }

            .admin-tutorial-modal .admin-tutorial-detail-stats article span {
              margin-bottom: 8px;
              color: #64748b;
              font-size: 13px;
            }

            .admin-tutorial-modal .admin-tutorial-history {
              margin-top: 18px;
              padding-top: 18px;
              border-top: 1px solid #e2e8f0;
            }

            .admin-tutorial-modal .admin-tutorial-history h3 {
              margin: 0 0 8px;
              font-size: 15px;
            }

            .admin-tutorial-modal .admin-tutorial-history p {
              margin: 0;
              color: #64748b;
            }

            @media (max-width: 640px) {
              .admin-tutorial-modal-backdrop {
                padding: 12px;
              }

              .admin-tutorial-modal {
                width: 100%;
                max-height: calc(100vh - 24px);
                border-radius: 14px;
              }

              .admin-tutorial-modal-body {
                padding: 16px;
              }

              .admin-tutorial-detail-list {
                grid-template-columns: 1fr;
                gap: 5px;
              }

              .admin-tutorial-detail-list dd {
                margin-bottom: 10px;
              }

              .admin-tutorial-modal .admin-tutorial-detail-stats {
                grid-template-columns: 1fr;
              }
            }
          `}</style>
          {selectedTutorial && (
            <div
              className="admin-tutorial-modal-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setSelectedTutorial(null);
                }
              }}
            >
              <section
                className="admin-tutorial-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-tutorial-detail-title"
              >
                <div className="admin-tutorial-detail-head">
                  <h2 id="admin-tutorial-detail-title">Detail Materi</h2>
                  <button
                    type="button"
                    aria-label="Tutup detail"
                    onClick={() => setSelectedTutorial(null)}
                  >
                    ×
                  </button>
                </div>

                <div className="admin-tutorial-modal-body">
                  <div className="admin-tutorial-detail-profile">
                    {selectedTutorial.cardImageUrl ? (
                      <img
                        className="admin-tutorial-detail-image"
                        src={selectedTutorial.cardImageUrl}
                        alt={`Thumbnail ${selectedTutorial.title}`}
                        onError={(event) =>
                          handleMateriImageError(
                            event,
                            selectedTutorial.cardImageName
                          )
                        }
                      />
                    ) : (
                      <span
                        className="admin-tutorial-detail-image"
                        aria-hidden="true"
                      />
                    )}

                    <div>
                      <h3>{selectedTutorial.title}</h3>
                      <TutorialBadge>
                        {selectedTutorial.status}
                      </TutorialBadge>
                    </div>
                  </div>

                  <dl className="admin-tutorial-detail-list">
                    <dt>Kategori</dt>
                    <dd>{selectedTutorial.category}</dd>

                    <dt>Level</dt>
                    <dd>{selectedTutorial.level}</dd>

                    <dt>Author</dt>
                    <dd>{selectedTutorial.author}</dd>

                    <dt>Slug</dt>
                    <dd>{selectedTutorial.slug || '-'}</dd>

                    <dt>Total Bab</dt>
                    <dd>
                      {Array.isArray(selectedTutorial.chapters)
                        ? selectedTutorial.chapters.length
                        : 0}
                    </dd>

                    <dt>Total Materi</dt>
                    <dd>{selectedTutorial.totalSlides}</dd>
                  </dl>

                  <section className="admin-tutorial-modal-section">
                    <h3>Deskripsi Singkat</h3>
                    <p>{selectedTutorial.description || '-'}</p>
                  </section>

                  <section className="admin-tutorial-modal-section">
                    <h3>Deskripsi Lengkap</h3>
                    <p>
                      {htmlToPlainText(selectedTutorial.fullDescription) || '-'}
                    </p>
                  </section>

                  <section className="admin-tutorial-modal-section">
                    <h3>Bab & Materi</h3>

                    {Array.isArray(selectedTutorial.chapters) &&
                    selectedTutorial.chapters.length > 0 ? (
                      <div className="admin-tutorial-chapter-list">
                        {selectedTutorial.chapters.map(
                          (chapter, chapterIndex) => {
                            const chapterSlides = Array.isArray(
                              selectedTutorial.slides
                            )
                              ? selectedTutorial.slides.filter(
                                  (slide) =>
                                    String(slide.chapter_id ?? '') ===
                                    String(chapter.id ?? '')
                                )
                              : [];

                            return (
                              <article
                                className="admin-tutorial-chapter-card"
                                key={
                                  chapter.id ??
                                  `detail-chapter-${chapterIndex}`
                                }
                              >
                                <header>
                                  <strong>
                                    {chapter.title ||
                                      `Bab ${chapterIndex + 1}`}
                                  </strong>
                                  <small>
                                    {chapterSlides.length} materi
                                  </small>
                                </header>

                                {chapterSlides.length > 0 ? (
                                  <div className="admin-tutorial-material-list">
                                    {chapterSlides.map(
                                      (slide, slideIndex) => (
                                        <div
                                          className="admin-tutorial-material-item"
                                          key={
                                            slide.id ??
                                            `detail-slide-${chapterIndex}-${slideIndex}`
                                          }
                                        >
                                          <strong>
                                            {slide.title ||
                                              `Materi ${slideIndex + 1}`}
                                          </strong>
                                          <small>
                                            {getSlideSummary(slide) ||
                                              `Jenis: ${
                                                slide.content_type ||
                                                'materi'
                                              }`}
                                          </small>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <small>Belum ada materi pada bab ini.</small>
                                )}
                              </article>
                            );
                          }
                        )}
                      </div>
                    ) : Array.isArray(selectedTutorial.slides) &&
                      selectedTutorial.slides.length > 0 ? (
                      <div className="admin-tutorial-material-list">
                        {selectedTutorial.slides.map(
                          (slide, slideIndex) => (
                            <div
                              className="admin-tutorial-material-item"
                              key={
                                slide.id ??
                                `detail-slide-${slideIndex}`
                              }
                            >
                              <strong>
                                {slide.title ||
                                  `Materi ${slideIndex + 1}`}
                              </strong>
                              <small>
                                {getSlideSummary(slide) ||
                                  `Jenis: ${
                                    slide.content_type || 'materi'
                                  }`}
                              </small>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p>Belum ada bab atau materi.</p>
                    )}
                  </section>

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
                </div>
              </section>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
