import { useEffect, useMemo, useState } from 'react';
import { AdminNotificationButton } from './AdminChrome.jsx';
import { AdminSidebar } from './AdminSidebar.jsx';
import { AdminActionDropdown } from './AdminActionDropdown.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import {
  deleteArticle,
  fetchArticles,
} from '../../services/articleApi.js';
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from '../../utils/alerts.js';

import bookIcon from '../../assets/icons/icon-book-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import fileIcon from '../../assets/icons/icon-file-text-1.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import zapIcon from '../../assets/icons/icon-zap-1.svg';

import '../../styles/admin-article.css';


function AdminArticleTopbar({ search, onSearchChange }) {
  return (
    <header className="admin-dashboard-topbar">
      <label className="admin-dashboard-search">
        <span aria-hidden="true" />

        <input
          type="search"
          placeholder="Cari materi"
          aria-label="Cari materi"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <div className="admin-dashboard-account">
        <AdminNotificationButton />

        <span
          className="admin-dashboard-avatar"
          aria-hidden="true"
        />

        <span>
          <strong>Admin</strong>
          <small>Super Admin</small>
        </span>
      </div>
    </header>
  );
}


function formatDate(value, includeTime = false) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
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


function getArticleKey(article) {
  const key =
    article?.id ??
    article?.slug ??
    article?.title;

  return key === undefined || key === null
    ? ''
    : String(key);
}


function ArticleBadge({ children }) {
  const slug = String(children || '-')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-');

  return (
    <span
      className={`admin-article-badge admin-article-badge--${slug}`}
    >
      {children || '-'}
    </span>
  );
}


function ArticleThumbnail({
  src,
  index = 0,
  large = false,
}) {
  const [hasError, setHasError] = useState(false);

  const fallbackClassName = large
    ? 'admin-article-detail-image'
    : `admin-article-thumb is-${index % 4}`;

  if (!src || hasError) {
    return (
      <span className={fallbackClassName} />
    );
  }

  return (
    <img
      className={
        large
          ? 'admin-article-detail-image'
          : 'admin-article-thumb'
      }
      src={src}
      alt=""
      onError={() => setHasError(true)}
    />
  );
}


function ArticleAction({
  label,
  children,
  onClick,
  href,
  tone = '',
}) {
  const className = `admin-article-action${
    tone
      ? ` admin-article-action--${tone}`
      : ''
  }`;

  if (href) {
    return (
      <a
        className={className}
        href={href}
        aria-label={label}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      className={className}
      type="button"
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}


export function AdminArticle() {
  const [
    isSidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(
    getInitialAdminSidebarCollapsed
  );

  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] =
    useState(null);

  const [
    checkedArticleKeys,
    setCheckedArticleKeys,
  ] = useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState('');

  const [actionMessage, setActionMessage] =
    useState('');

  const [actionError, setActionError] =
    useState('');

  const [isBulkBusy, setBulkBusy] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('');

  const [categoryFilter, setCategoryFilter] =
    useState('');

  const [featuredFilter, setFeaturedFilter] =
    useState('');


  const handleToggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;

      persistAdminSidebarCollapsed(next);

      return next;
    });
  };


  const fetchArticleData = async () => {
    try {
      setIsLoading(true);
      setLoadError('');

      const rows = await fetchArticles();

      setArticles(rows);

      setCheckedArticleKeys((current) =>
        current.filter((key) =>
          rows.some(
            (article) =>
              getArticleKey(article) === key
          )
        )
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Data materi gagal dimuat.';

      setArticles([]);
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchArticleData();
  }, []);


  const articleStats = useMemo(() => {
    const total = articles.length;

    const published = articles.filter(
      (item) =>
        item.status === 'published'
    ).length;

    const draft = articles.filter(
      (item) =>
        item.status === 'draft'
    ).length;

    const archived = articles.filter(
      (item) =>
        item.status === 'archived'
    ).length;

    const viewer = articles.reduce(
      (totalViewer, item) =>
        totalViewer +
        Number(item.viewer || 0),
      0
    );

    const popular = [...articles]
      .sort(
        (first, second) =>
          Number(second.viewer || 0) -
          Number(first.viewer || 0)
      )[0];

    const publishedPercent = total
      ? ((published / total) * 100).toFixed(1)
      : '0.0';

    const draftPercent = total
      ? ((draft / total) * 100).toFixed(1)
      : '0.0';

    return [
      {
        label: 'Total Materi',
        value: String(total),
        note: 'Data dari SQLite',
        icon: bookIcon,
        tone: 'blue',
      },
      {
        label: 'Materi Published',
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
        value: String(viewer),
        note: 'Akumulasi seluruh materi',
        icon: usersIcon,
        tone: 'blue',
      },
      {
        label: 'Materi Paling Populer',
        value: popular?.title || 'Belum tersedia',
        note: popular
          ? `${popular.viewer} viewer`
          : 'Belum ada data',
        icon: zapIcon,
        tone: 'purple',
      },
      {
        label: 'Materi Diarsipkan',
        value: String(archived),
        note: 'Status Archived',
        icon: clockIcon,
        tone: 'red',
      },
    ];
  }, [articles]);


  const categoryOptions = useMemo(
    () =>
      [
        ...new Set(
          articles
            .map((item) => item.category)
            .filter(Boolean)
        ),
      ].sort((a, b) =>
        a.localeCompare(b, 'id')
      ),
    [articles]
  );


  const filteredArticles = useMemo(() => {
    const keyword = searchTerm
      .trim()
      .toLowerCase();

    return articles.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.title
          .toLowerCase()
          .includes(keyword) ||
        item.slug
          .toLowerCase()
          .includes(keyword) ||
        item.author
          .toLowerCase()
          .includes(keyword) ||
        item.excerpt
          .toLowerCase()
          .includes(keyword);

      const matchesStatus =
        !statusFilter ||
        item.status === statusFilter;

      const matchesCategory =
        !categoryFilter ||
        item.category === categoryFilter;

      const matchesFeatured =
        !featuredFilter ||
        (featuredFilter === 'featured'
          ? item.featured
          : !item.featured);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesFeatured
      );
    });
  }, [
    articles,
    searchTerm,
    statusFilter,
    categoryFilter,
    featuredFilter,
  ]);


  const filteredArticleKeys = useMemo(
    () =>
      filteredArticles
        .map(getArticleKey)
        .filter(Boolean),
    [filteredArticles]
  );


  const selectedArticles = useMemo(
    () =>
      articles.filter((article) =>
        checkedArticleKeys.includes(
          getArticleKey(article)
        )
      ),
    [articles, checkedArticleKeys]
  );


  const selectedArticleCount =
    selectedArticles.length;


  const isFilteredArticlesChecked =
    filteredArticleKeys.length > 0 &&
    filteredArticleKeys.every((key) =>
      checkedArticleKeys.includes(key)
    );


  const handleToggleArticleCheck = (
    article
  ) => {
    const key = getArticleKey(article);

    if (!key) {
      return;
    }

    setCheckedArticleKeys((current) =>
      current.includes(key)
        ? current.filter(
            (item) => item !== key
          )
        : [...current, key]
    );
  };


  const handleToggleFilteredChecks = () => {
    setCheckedArticleKeys((current) => {
      if (isFilteredArticlesChecked) {
        return current.filter(
          (key) =>
            !filteredArticleKeys.includes(key)
        );
      }

      return [
        ...new Set([
          ...current,
          ...filteredArticleKeys,
        ]),
      ];
    });
  };


  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCategoryFilter('');
    setFeaturedFilter('');
  };


  const handleDelete = async (article) => {
    const confirmed =
      await showConfirmAlert({
        title: 'Hapus Materi?',
        text:
          `Materi "${article.title}" akan dihapus permanen.`,
        confirmButtonText: 'Hapus',
      });

    if (!confirmed) {
      return;
    }

    try {
      setActionMessage('');
      setActionError('');

      const result =
        await deleteArticle(article.id);

      setActionMessage(
        result.message ||
          'Materi berhasil dihapus.'
      );

      await showSuccessAlert(
        'Berhasil',
        result.message ||
          'Materi berhasil dihapus.'
      );

      if (
        selectedArticle?.id ===
        article.id
      ) {
        setSelectedArticle(null);
      }

      await fetchArticleData();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Materi gagal dihapus.';

      setActionError(message);

      await showErrorAlert(
        'Gagal Menghapus',
        message
      );
    }
  };


  const handleBulkDelete = async () => {
    if (
      selectedArticles.length === 0 ||
      isBulkBusy
    ) {
      return;
    }

    const confirmed =
      await showConfirmAlert({
        title:
          `Hapus ${selectedArticles.length} Materi?`,
        text:
          'Semua materi yang dipilih akan dihapus permanen.',
        confirmButtonText: 'Hapus',
      });

    if (!confirmed) {
      return;
    }

    try {
      setBulkBusy(true);
      setActionMessage('');
      setActionError('');

      await Promise.all(
        selectedArticles.map((item) =>
          deleteArticle(item.id)
        )
      );

      setCheckedArticleKeys([]);

      setActionMessage(
        `${selectedArticles.length} materi berhasil dihapus.`
      );

      await showSuccessAlert(
        'Berhasil',
        `${selectedArticles.length} materi berhasil dihapus.`
      );

      await fetchArticleData();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Materi terpilih gagal dihapus.';

      setActionError(message);

      await showErrorAlert(
        'Gagal Menghapus',
        message
      );
    } finally {
      setBulkBusy(false);
    }
  };


  const latestArticles = useMemo(
    () =>
      [...articles]
        .sort((a, b) => {
          const first =
            new Date(
              a.createdAt || 0
            ).getTime();

          const second =
            new Date(
              b.createdAt || 0
            ).getTime();

          return second - first;
        })
        .slice(0, 5),
    [articles]
  );


  const draftArticles = useMemo(
    () =>
      articles
        .filter(
          (item) =>
            item.status === 'draft'
        )
        .slice(0, 5),
    [articles]
  );


  const issueItems = useMemo(() => {
    const coverEmpty =
      articles.filter(
        (item) =>
          !item.coverImageUrl
      ).length;

    const categoryEmpty =
      articles.filter(
        (item) =>
          !item.category ||
          item.category === '-'
      ).length;

    const excerptEmpty =
      articles.filter(
        (item) =>
          !String(
            item.excerpt || ''
          ).trim()
      ).length;

    const shortContent =
      articles.filter(
        (item) =>
          String(
            item.content || ''
          )
            .replace(/<[^>]*>/g, ' ')
            .trim()
            .length < 300
      ).length;

    return [
      [
        'Cover kosong',
        coverEmpty,
      ],
      [
        'Belum punya kategori',
        categoryEmpty,
      ],
      [
        'Ringkasan kosong',
        excerptEmpty,
      ],
      [
        'Konten terlalu pendek',
        shortContent,
      ],
    ];
  }, [articles]);


  const activityItems = useMemo(
    () =>
      [...articles]
        .sort((a, b) => {
          const first =
            new Date(
              a.updatedAt ||
                a.createdAt ||
                0
            ).getTime();

          const second =
            new Date(
              b.updatedAt ||
                b.createdAt ||
                0
            ).getTime();

          return second - first;
        })
        .slice(0, 5)
        .map((item) => [
          item.title,
          formatDate(
            item.updatedAt ||
              item.createdAt,
            true
          ),
          item.status === 'published'
            ? 'green'
            : item.status === 'archived'
              ? 'red'
              : 'orange',
        ]),
    [articles]
  );


  return (
    <main
      className={`admin-dashboard-page admin-article-page${
        isSidebarCollapsed
          ? ' admin-dashboard-page--collapsed'
          : ''
      }`}
    >
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      <section
        className="admin-dashboard-main"
        aria-label="Materi admin"
      >
        <AdminArticleTopbar
          search={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <div className="admin-article-layout">
          <section className="admin-article-content">
            <div className="admin-article-heading">
              <div>
                <h1>Materi</h1>

                <p>
                  Dashboard
                  <span>/</span>
                  Materi
                </p>
              </div>
            </div>

            {actionMessage ? (
              <p
                role="status"
                className="admin-article-feedback is-success"
              >
                {actionMessage}
              </p>
            ) : null}

            {actionError ? (
              <p
                role="alert"
                className="admin-article-feedback is-error"
              >
                {actionError}
              </p>
            ) : null}

            {selectedArticleCount ? (
              <section
                className="admin-article-bulk-actions"
                aria-label="Aksi materi terpilih"
              >
                <span>
                  {selectedArticleCount} materi dipilih
                </span>

                <div>
                  <button
                    type="button"
                    className="is-danger"
                    disabled={isBulkBusy}
                    onClick={handleBulkDelete}
                  >
                    {isBulkBusy
                      ? 'Menghapus...'
                      : 'Hapus Terpilih'}
                  </button>

                  <button
                    type="button"
                    disabled={isBulkBusy}
                    onClick={() =>
                      setCheckedArticleKeys([])
                    }
                  >
                    Batal Pilih
                  </button>
                </div>
              </section>
            ) : null}

            <section
              className="admin-article-stats"
                aria-label="Ringkasan materi"
            >
              {articleStats.map((item) => (
                <article
                  className="admin-article-stat"
                  key={item.label}
                >
                  <span
                    className={`admin-article-stat-icon is-${item.tone}`}
                  >
                    <img
                      src={item.icon}
                      alt=""
                    />
                  </span>

                  <div>
                    <p>{item.label}</p>
                    <strong>
                      {item.value}
                    </strong>
                    <small>
                      {item.note}
                    </small>
                  </div>
                </article>
              ))}
            </section>

            <section
              className="admin-article-filter"
                aria-label="Filter materi"
            >
              <label className="admin-article-search">
                <input
                  type="search"
                  placeholder="Cari judul materi..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                <span>Status</span>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Semua Status
                  </option>

                  <option value="published">
                    Published
                  </option>

                  <option value="draft">
                    Draft
                  </option>

                  <option value="archived">
                    Archived
                  </option>
                </select>
              </label>

              <label>
                <span>Kategori</span>

                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Semua Kategori
                  </option>

                  {categoryOptions.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                <span>Featured</span>

                <select
                  value={featuredFilter}
                  onChange={(event) =>
                    setFeaturedFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Semua
                  </option>

                  <option value="featured">
                    Featured
                  </option>

                  <option value="normal">
                    Tidak Featured
                  </option>
                </select>
              </label>

              <label>
                <span>Author / Admin</span>

                <select
                  value=""
                  disabled
                >
                  <option value="">
                    Admin
                  </option>
                </select>
              </label>

              <label>
                <span>Tanggal Publish</span>

                <input
                  type="text"
                  placeholder="Semua tanggal"
                  disabled
                />
              </label>

              <button
                type="button"
                onClick={resetFilters}
              >
                Reset Filter
              </button>
            </section>

            <div className="admin-article-table-toolbar">
              <a
                className="admin-article-primary"
                href="/admin/artikel/tambah"
              >
                  + Tambah Materi
              </a>
            </div>

            <section className="admin-article-table-card">
              <table className="admin-article-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Pilih semua materi"
                        checked={
                          isFilteredArticlesChecked
                        }
                        disabled={
                          filteredArticles.length === 0
                        }
                        onChange={
                          handleToggleFilteredChecks
                        }
                      />
                    </th>

                    <th>Judul Materi</th>
                    <th>Kategori</th>
                    <th>Status</th>
                    <th>Author</th>
                    <th>Viewer</th>
                    <th>Featured</th>
                    <th>Tgl Publish</th>
                    <th>Update Terakhir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan="10">
                        Memuat data materi...
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    loadError && (
                      <tr>
                        <td colSpan="10">
                          <strong>
                            Gagal mengambil data materi.
                          </strong>

                          <br />

                          <small>
                            {loadError}
                          </small>
                        </td>
                      </tr>
                    )}

                  {!isLoading &&
                    !loadError &&
                    filteredArticles.length ===
                      0 && (
                      <tr>
                        <td colSpan="10">
                          Belum ada materi yang sesuai.
                        </td>
                      </tr>
                    )}

                  {!isLoading &&
                    !loadError &&
                    filteredArticles.map(
                      (item, index) => {
                        const key =
                          getArticleKey(item);

                        return (
                          <tr
                            key={
                              item.id ||
                              item.slug ||
                              item.title
                            }
                          >
                            <td>
                              <input
                                type="checkbox"
                                aria-label={`Pilih ${item.title}`}
                                checked={checkedArticleKeys.includes(
                                  key
                                )}
                                onClick={(event) =>
                                  event.stopPropagation()
                                }
                                onChange={() =>
                                  handleToggleArticleCheck(
                                    item
                                  )
                                }
                              />
                            </td>

                            <td>
                              <ArticleThumbnail
                                src={
                                  item.coverImageUrl
                                }
                                index={index}
                              />

                              <span>
                                <b>
                                  {item.title}
                                </b>

                                <small>
                                  {item.excerpt ||
                                    item.slug ||
                                    '-'}
                                </small>
                              </span>
                            </td>

                            <td>
                              <ArticleBadge>
                                {item.category}
                              </ArticleBadge>
                            </td>

                            <td>
                              <ArticleBadge>
                                {item.status}
                              </ArticleBadge>
                            </td>

                            <td>
                              {item.author}
                            </td>

                            <td>
                              {item.viewer}
                            </td>

                            <td>
                              {item.featured
                                ? 'Ya'
                                : 'Tidak'}
                            </td>

                            <td>
                              {formatDate(
                                item.publishedAt
                              )}
                            </td>

                            <td>
                              {formatDate(
                                item.updatedAt ||
                                  item.createdAt
                              )}
                            </td>

                            <td>
                              <AdminActionDropdown
                                label={`Buka aksi untuk ${item.title}`}
                                items={[
                                  {
                                    label: 'Lihat',
                                    icon: <img src={eyeIcon} alt="" />,
                                    onSelect: () => setSelectedArticle(item),
                                  },
                                  {
                                    label: 'Edit',
                                    href: `/admin/artikel/edit?id=${encodeURIComponent(item.id)}`,
                                  },
                                  {
                                    label: 'Delete',
                                    tone: 'danger',
                                    onSelect: () => handleDelete(item),
                                  },
                                ]}
                              />
                            </td>
                          </tr>
                        );
                      }
                    )}
                </tbody>
              </table>

              <div className="admin-article-pagination">
                <span>
                  Menampilkan{' '}
                  {filteredArticles.length
                    ? 1
                    : 0}{' '}
                  - {filteredArticles.length}{' '}
                  dari {filteredArticles.length}{' '}
                  data
                </span>

                <div>
                  <button
                    type="button"
                    disabled
                  >
                    &lt;
                  </button>

                  <button
                    type="button"
                    className="is-active"
                  >
                    1
                  </button>

                  <button
                    type="button"
                    disabled
                  >
                    &gt;
                  </button>
                </div>

                <select defaultValue="10">
                  <option value="10">
                    10 / halaman
                  </option>
                </select>
              </div>
            </section>

            <section className="admin-article-bottom">
              <article className="admin-article-panel">
                <div className="admin-article-panel-head">
                  <h2>
                    Materi Terbaru dari SQLite
                  </h2>
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
                    {latestArticles.length === 0 ? (
                      <tr>
                        <td colSpan="4">
                          Belum ada materi.
                        </td>
                      </tr>
                    ) : (
                      latestArticles.map(
                        (item, index) => (
                          <tr
                            key={
                              item.id ||
                              item.slug
                            }
                          >
                            <td>
                              {index + 1}
                            </td>

                            <td>
                              {item.title}
                            </td>

                            <td>
                              {item.status}
                            </td>

                            <td>
                              {formatDate(
                                item.createdAt
                              )}
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </article>

              <article className="admin-article-panel">
                <div className="admin-article-panel-head">
                  <h2>
                    Draft Perlu Dilanjutkan
                  </h2>
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
                    {draftArticles.length === 0 ? (
                      <tr>
                        <td colSpan="3">
                          Tidak ada draft.
                        </td>
                      </tr>
                    ) : (
                      draftArticles.map(
                        (item) => (
                          <tr
                            key={
                              item.id ||
                              item.slug
                            }
                          >
                            <td>
                              {item.title}
                            </td>

                            <td>
                              {item.author}
                            </td>

                            <td>
                              {formatDate(
                                item.updatedAt
                              )}
                            </td>
                          </tr>
                        )
                      )
                    )}
                  </tbody>
                </table>
              </article>

              <article className="admin-article-panel admin-article-issues">
                <div className="admin-article-panel-head">
                  <h2>
                    Materi Perlu Dilengkapi
                  </h2>
                </div>

                {issueItems.map(
                  (item) => (
                    <p key={item[0]}>
                      <span>
                        {item[0]}
                      </span>

                      <strong>
                        {item[1]}
                      </strong>
                    </p>
                  )
                )}
              </article>

              <article className="admin-article-panel admin-article-activity">
                <div className="admin-article-panel-head">
                  <h2>
                    Aktivitas Terbaru
                  </h2>
                </div>

                {activityItems.length === 0 ? (
                  <p>
                    <b>
                      Belum ada aktivitas materi.
                    </b>
                  </p>
                ) : (
                  activityItems.map(
                    (item) => (
                      <p
                        key={`${item[0]}-${item[1]}`}
                      >
                        <span
                          className={`admin-article-dot is-${item[2]}`}
                        />

                        <b>
                          {item[0]}
                        </b>

                        <time>
                          {item[1]}
                        </time>
                      </p>
                    )
                  )
                )}
              </article>
            </section>

            <section className="admin-article-quick">
              <h2>Aksi Cepat</h2>

              <div>
                <a href="/admin/artikel/tambah">
                  Buat Materi Baru
                </a>

                <button
                  type="button"
                  onClick={fetchArticleData}
                >
                  Muat Ulang Data Materi
                </button>

                <a href="/artikel">
                  Lihat Halaman Materi
                </a>
              </div>
            </section>
          </section>

          {selectedArticle ? (
            <div
              className="admin-article-detail-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Detail materi"
            >
              <button
                type="button"
                className="admin-article-detail-backdrop"
                aria-label="Tutup detail"
                onClick={() =>
                  setSelectedArticle(null)
                }
              />

              <aside className="admin-article-detail admin-article-detail--complete">
                <div className="admin-article-detail-head">
                  <h2>Detail Materi</h2>

                  <button
                    type="button"
                    aria-label="Tutup detail"
                    onClick={() =>
                      setSelectedArticle(null)
                    }
                  >
                    x
                  </button>
                </div>

                <div className="admin-article-detail-profile">
                  <ArticleThumbnail
                    src={
                      selectedArticle.coverImageUrl
                    }
                    large
                  />

                  <div>
                    <h3>
                      {selectedArticle.title}
                    </h3>

                    <ArticleBadge>
                      {selectedArticle.status}
                    </ArticleBadge>
                  </div>
                </div>

                <dl>
                  <dt>Kategori</dt>
                  <dd>
                    {selectedArticle.category ||
                      '-'}
                  </dd>

                  <dt>Author</dt>
                  <dd>
                    {selectedArticle.author ||
                      '-'}
                  </dd>

                  <dt>Slug</dt>
                  <dd>
                    {selectedArticle.slug ||
                      '-'}
                  </dd>

                  <dt>Featured</dt>
                  <dd>
                    {selectedArticle.featured
                      ? 'Ya'
                      : 'Tidak'}
                  </dd>

                  <dt>Ringkasan</dt>
                  <dd>
                    {selectedArticle.excerpt ||
                      '-'}
                  </dd>

                  <dt>Tags</dt>
                  <dd>
                    {selectedArticle.tags
                      .length
                      ? selectedArticle.tags.join(
                          ', '
                        )
                      : '-'}
                  </dd>
                </dl>

                <section className="admin-article-detail-section">
                  <div className="admin-article-detail-section-head">
                    <div>
                      <span className="admin-article-detail-kicker">
                        Konten Materi
                      </span>

                      <h3>
                        Isi Materi
                      </h3>
                    </div>
                  </div>

                  <div
                    className="admin-article-full-description"
                    dangerouslySetInnerHTML={{
                      __html:
                        selectedArticle.content ||
                        '<p>Isi materi belum tersedia.</p>',
                    }}
                  />
                </section>

                <section className="admin-article-detail-stats">
                  <article>
                    <span>Viewer</span>
                    <strong>
                      {selectedArticle.viewer}
                    </strong>
                  </article>

                  <article>
                    <span>Featured</span>
                    <strong>
                      {selectedArticle.featured
                        ? 'Ya'
                        : 'Tidak'}
                    </strong>
                  </article>

                  <article>
                    <span>Publish</span>
                    <strong>
                      {formatDate(
                        selectedArticle.publishedAt
                      )}
                    </strong>
                  </article>

                  <article>
                    <span>Update</span>
                    <strong>
                      {formatDate(
                        selectedArticle.updatedAt
                      )}
                    </strong>
                  </article>
                </section>

                <section className="admin-article-history">
                  <h3>
                    Riwayat Update Terakhir
                  </h3>

                  <p>
                    Materi terakhir diperbarui{' '}
                    <strong>
                      {formatDate(
                        selectedArticle.updatedAt ||
                          selectedArticle.createdAt,
                        true
                      )}
                    </strong>
                  </p>
                </section>

                <div className="admin-article-detail-actions">
                  <a
                    href={`/admin/artikel/edit?id=${encodeURIComponent(
                      selectedArticle.id
                    )}`}
                  >
                    Edit Materi
                  </a>

                  <button
                    type="button"
                    className="is-danger"
                    onClick={() => {
                      const target =
                        selectedArticle;

                      setSelectedArticle(
                        null
                      );

                      handleDelete(
                        target
                      );
                    }}
                  >
                    Hapus Materi
                  </button>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}


export default AdminArticle;
