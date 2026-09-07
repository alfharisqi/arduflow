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

const PAGE_SIZE = 6;


const DEPLOY_URL = (
  import.meta.env.VITE_DEPLOY_URL ||
  'https://arduflow.indobilliard.com/apk/uploads/web-arduflow-deploy-alfha/'
).replace(/\/+$/, '');

const ARTICLE_IMAGE_BASE_URL = `${DEPLOY_URL}/uploads/articles`;

function getArticleCoverUrl(article) {
  const apiUrl = String(
    article?.coverImageUrl ||
      article?.cover_image_url ||
      ''
  ).trim();

  /*
   * Jika API sudah mengirim URL gambar, gunakan URL tersebut apa adanya.
   * Ini penting untuk kompatibilitas cover lama yang masih dilayani
   * lewat article-api.php?action=image&file=...
   */
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(apiUrl)) {
    return apiUrl;
  }

  if (apiUrl.startsWith('/')) {
    try {
      return `${new URL(DEPLOY_URL).origin}${apiUrl}`;
    } catch {
      // Lanjut ke fallback nama file.
    }
  }

  const fileName = String(
    article?.coverImageName ||
      article?.cover_image_name ||
      article?.cover?.file_name ||
      article?.cover?.fileName ||
      ''
  )
    .trim()
    .replace(/\\/g, '/')
    .split('/')
    .pop();

  if (!fileName) {
    return '';
  }

  return `${ARTICLE_IMAGE_BASE_URL}/${encodeURIComponent(fileName)}`;
}

function normalizeAdminArticleImage(article) {
  return {
    ...article,
    coverImageUrl: getArticleCoverUrl(article),
  };
}


function AdminArticleTopbar({ search, onSearchChange }) {
  return (
    <header className="admin-dashboard-topbar">
      <label className="admin-dashboard-search">
        <span aria-hidden="true" />

        <input
          type="search"
          placeholder="Cari artikel"
          aria-label="Cari artikel"
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

  const [page, setPage] = useState(1);


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
      const normalizedRows = Array.isArray(rows)
        ? rows.map(normalizeAdminArticleImage)
        : [];

      setArticles(normalizedRows);

      setCheckedArticleKeys((current) =>
        current.filter((key) =>
          normalizedRows.some(
            (article) =>
              getArticleKey(article) === key
          )
        )
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Data artikel gagal dimuat.';

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
        label: 'Total Artikel',
        value: String(total),
        note: 'Data dari SQLite',
        icon: bookIcon,
        tone: 'blue',
      },
      {
        label: 'Artikel Published',
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
        note: 'Akumulasi seluruh artikel',
        icon: usersIcon,
        tone: 'blue',
      },
      {
        label: 'Artikel Paling Populer',
        value: popular?.title || 'Belum tersedia',
        note: popular
          ? `${popular.viewer} viewer`
          : 'Belum ada data',
        icon: zapIcon,
        tone: 'purple',
      },
      {
        label: 'Artikel Diarsipkan',
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
    setPage(1);
  };


  const handleDelete = async (article) => {
    const confirmed =
      await showConfirmAlert({
        title: 'Hapus Artikel?',
        text:
          `Artikel "${article.title}" akan dihapus permanen.`,
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
          'Artikel berhasil dihapus.'
      );

      await showSuccessAlert(
        'Berhasil',
        result.message ||
          'Artikel berhasil dihapus.'
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
          : 'Artikel gagal dihapus.';

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
          `Hapus ${selectedArticles.length} Artikel?`,
        text:
          'Semua artikel yang dipilih akan dihapus permanen.',
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
        `${selectedArticles.length} artikel berhasil dihapus.`
      );

      await showSuccessAlert(
        'Berhasil',
        `${selectedArticles.length} artikel berhasil dihapus.`
      );

      await fetchArticleData();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Artikel terpilih gagal dihapus.';

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



  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    statusFilter,
    categoryFilter,
    featuredFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredArticles.length / PAGE_SIZE)
  );

  useEffect(() => {
    setPage((current) =>
      Math.min(current, totalPages)
    );
  }, [totalPages]);

  const paginatedArticles = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredArticles.slice(
      start,
      start + PAGE_SIZE
    );
  }, [filteredArticles, page]);

  const firstShown = filteredArticles.length
    ? (page - 1) * PAGE_SIZE + 1
    : 0;

  const lastShown = Math.min(
    page * PAGE_SIZE,
    filteredArticles.length
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
        aria-label="Artikel admin"
      >
        <AdminArticleTopbar
          search={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <div className="admin-users-layout admin-article-layout">
          <section className="admin-users-content admin-article-content">
            <div className="admin-users-heading">
              <div>
                <h1>Artikel</h1>
                <p>
                  Dashboard <span>/</span> Artikel
                </p>
              </div>
            </div>

            {loadError ? (
              <div
                className="admin-form-message is-error"
                role="alert"
                style={{ marginBottom: 16 }}
              >
                {loadError}
              </div>
            ) : null}

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

            <section
              className="admin-users-summary"
              aria-label="Ringkasan artikel"
            >
              {articleStats.map((item) => (
                <article
                  className="admin-users-stat"
                  key={item.label}
                >
                  <span
                    className={`admin-article-stat-tone is-${item.tone}`}
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

            {selectedArticleCount ? (
              <section
                className="admin-article-bulk-actions admin-article-bulk-actions--program"
                aria-label="Aksi artikel terpilih"
              >
                <span>
                  {selectedArticleCount} artikel dipilih
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
              className="admin-users-filter"
              aria-label="Filter artikel"
            >
              <div className="admin-users-filter-row">
                <label className="admin-users-search">
                  <input
                    type="search"
                    placeholder="Cari judul artikel..."
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                  />
                </label>

                <button
                  type="button"
                  onClick={resetFilters}
                >
                  Reset Filter
                </button>

                <button
                  type="button"
                  onClick={fetchArticleData}
                >
                  {isLoading ? 'Memuat...' : 'Muat Ulang'}
                </button>

                <a
                  className="admin-users-primary"
                  href="/admin/artikel/tambah"
                >
                  + Tambah Artikel
                </a>
              </div>

              <div className="admin-users-select-grid admin-article-program-filter-grid">
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
                      Semua Artikel
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
                  <select value="" disabled>
                    <option value="">
                      Admin
                    </option>
                  </select>
                </label>
              </div>
            </section>

            <section className="admin-users-table-card">
              <div className="admin-users-table-header">
                <div>
                  <h2>Daftar Artikel</h2>
                  <p>
                    {filteredArticles.length} artikel ditemukan
                  </p>
                </div>

                <span>
                  {paginatedArticles.length} ditampilkan
                </span>
              </div>

              <div className="admin-article-table-scroll">
                <table className="admin-users-table admin-article-table admin-article-table--program">
                  <thead>
                    <tr>
                      <th>
                        <label className="admin-article-select-title">
                          <input
                            type="checkbox"
                            aria-label="Pilih semua artikel"
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
                          <span>Judul Artikel</span>
                        </label>
                      </th>
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
                    {isLoading ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: 28 }}>
                          Memuat data artikel...
                        </td>
                      </tr>
                    ) : loadError ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: 28 }}>
                          Gagal mengambil data artikel. {loadError}
                        </td>
                      </tr>
                    ) : paginatedArticles.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: 28 }}>
                          Belum ada artikel yang sesuai dengan filter.
                        </td>
                      </tr>
                    ) : (
                      paginatedArticles.map(
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
                                <div className="admin-article-program-name-cell">
                                  <input
                                    type="checkbox"
                                    aria-label={`Pilih ${item.title}`}
                                    checked={
                                      checkedArticleKeys.includes(
                                        key
                                      )
                                    }
                                    onClick={(event) =>
                                      event.stopPropagation()
                                    }
                                    onChange={() =>
                                      handleToggleArticleCheck(
                                        item
                                      )
                                    }
                                  />

                                  <button
                                    type="button"
                                    className="admin-users-name-button admin-article-program-name-button"
                                    onClick={() =>
                                      setSelectedArticle(item)
                                    }
                                  >
                                    <ArticleThumbnail
                                      src={
                                        item.coverImageUrl
                                      }
                                      index={index}
                                    />

                                    <span>
                                      <b>{item.title}</b>
                                      <small>
                                        {item.excerpt ||
                                          item.slug ||
                                          '-'}
                                      </small>
                                    </span>
                                  </button>
                                </div>
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

                              <td>{item.author}</td>
                              <td>{item.viewer}</td>

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
                                      icon: (
                                        <img
                                          src={eyeIcon}
                                          alt=""
                                        />
                                      ),
                                      onSelect: () =>
                                        setSelectedArticle(
                                          item
                                        ),
                                    },
                                    {
                                      label: 'Edit',
                                      href: `/admin/artikel/edit?id=${encodeURIComponent(
                                        item.id
                                      )}`,
                                    },
                                    {
                                      label: 'Delete',
                                      tone: 'danger',
                                      onSelect: () =>
                                        handleDelete(
                                          item
                                        ),
                                    },
                                  ]}
                                />
                              </td>
                            </tr>
                          );
                        }
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="admin-users-pagination">
                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                  disabled={page <= 1}
                >
                  Previous
                </button>

                <div>
                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  )
                    .slice(
                      Math.max(0, page - 3),
                      Math.max(0, page - 3) + 5
                    )
                    .map((pageNumber) => (
                      <button
                        type="button"
                        key={pageNumber}
                        className={
                          pageNumber === page
                            ? 'is-active'
                            : ''
                        }
                        onClick={() =>
                          setPage(pageNumber)
                        }
                      >
                        {pageNumber}
                      </button>
                    ))}
                </div>

                <span>
                  Page {page} of {totalPages}
                  <small>
                    Menampilkan {firstShown} - {lastShown} dari{' '}
                    {filteredArticles.length} artikel
                  </small>
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        totalPages,
                        current + 1
                      )
                    )
                  }
                  disabled={page >= totalPages}
                >
                  Next
                </button>
              </div>
            </section>

            <section className="admin-users-bottom admin-article-bottom-program">
              <article className="admin-users-panel">
                <h2>Artikel Terbaru</h2>

                {latestArticles.length === 0 ? (
                  <p>Belum ada artikel.</p>
                ) : (
                  latestArticles.map(
                    (item, index) => (
                      <p
                        key={
                          item.id ||
                          item.slug
                        }
                      >
                        <ArticleThumbnail
                          src={
                            item.coverImageUrl
                          }
                          index={index}
                        />
                        <b>{item.title}</b>
                        <span>{item.category}</span>
                        <span>
                          {formatDate(
                            item.createdAt
                          )}
                        </span>
                        <ArticleBadge>
                          {item.status}
                        </ArticleBadge>
                      </p>
                    )
                  )
                )}
              </article>

              <article className="admin-users-panel">
                <h2>Draft Perlu Dilanjutkan</h2>

                {draftArticles.length === 0 ? (
                  <p>Tidak ada draft.</p>
                ) : (
                  draftArticles.map((item) => (
                    <p
                      key={
                        item.id ||
                        item.slug
                      }
                    >
                      <span
                        className="admin-article-draft-dot"
                        aria-hidden="true"
                      />
                      <b>{item.title}</b>
                      <span>{item.author}</span>
                      <span>
                        {formatDate(
                          item.updatedAt
                        )}
                      </span>
                      <ArticleBadge>
                        {item.status}
                      </ArticleBadge>
                    </p>
                  ))
                )}
              </article>

              <article className="admin-users-panel admin-article-summary-panel">
                <h2>Ringkasan Artikel</h2>

                <p>
                  <span>Published</span>
                  <strong>
                    {
                      articles.filter(
                        (item) =>
                          item.status ===
                          'published'
                      ).length
                    }
                  </strong>
                </p>

                <p>
                  <span>Draft</span>
                  <strong>
                    {
                      articles.filter(
                        (item) =>
                          item.status === 'draft'
                      ).length
                    }
                  </strong>
                </p>

                <p>
                  <span>Archived</span>
                  <strong>
                    {
                      articles.filter(
                        (item) =>
                          item.status ===
                          'archived'
                      ).length
                    }
                  </strong>
                </p>

                <p>
                  <span>
                    {issueItems[0]?.[0] ||
                      'Cover kosong'}
                  </span>
                  <strong>
                    {issueItems[0]?.[1] || 0}
                  </strong>
                </p>

                <a
                  href="/admin/artikel/tambah"
                  className="admin-users-primary"
                >
                  Buat Artikel Baru
                </a>

                <button
                  type="button"
                  onClick={fetchArticleData}
                >
                  Refresh Data SQLite
                </button>
              </article>
            </section>
          </section>

          {selectedArticle ? (
            <div
              className="admin-article-detail-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Detail artikel"
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
                  <h2>Detail Artikel</h2>

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
                        Konten Artikel
                      </span>

                      <h3>
                        Isi Artikel
                      </h3>
                    </div>
                  </div>

                  <div
                    className="admin-article-full-description"
                    dangerouslySetInnerHTML={{
                      __html:
                        selectedArticle.content ||
                        '<p>Isi artikel belum tersedia.</p>',
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
                    Artikel terakhir diperbarui{' '}
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
                    Edit Artikel
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
                    Hapus Artikel
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
