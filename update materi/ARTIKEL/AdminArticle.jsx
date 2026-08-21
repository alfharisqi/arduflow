import { useEffect, useMemo, useState } from 'react';
import { AdminSidebar } from './AdminSidebar.jsx';
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
import '../../styles/admin-article.css';

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function StatusBadge({ status }) {
  return (
    <span className={`admin-article-badge is-${status}`}>
      {status === 'published'
        ? 'Published'
        : status === 'archived'
          ? 'Archived'
          : 'Draft'}
    </span>
  );
}

export function AdminArticle() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialAdminSidebarCollapsed
  );

  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const handleToggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      persistAdminSidebarCollapsed(next);
      return next;
    });
  };

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      setLoadError('');

      const rows = await fetchArticles();
      setArticles(rows);
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
    loadArticles();
  }, []);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(articles.map((article) => article.category).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, 'id')),
    [articles]
  );

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesSearch =
        !query ||
        article.title.toLowerCase().includes(query) ||
        article.slug.toLowerCase().includes(query) ||
        article.author.toLowerCase().includes(query);

      const matchesStatus =
        !statusFilter || article.status === statusFilter;

      const matchesCategory =
        !categoryFilter || article.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [articles, categoryFilter, search, statusFilter]);

  const stats = useMemo(() => {
    const total = articles.length;
    const published = articles.filter(
      (article) => article.status === 'published'
    ).length;
    const draft = articles.filter(
      (article) => article.status === 'draft'
    ).length;
    const viewer = articles.reduce(
      (sum, article) => sum + article.viewer,
      0
    );

    return { total, published, draft, viewer };
  }, [articles]);

  const handleDelete = async (article) => {
    const confirmed = await showConfirmAlert({
      title: 'Hapus Artikel?',
      text: `Artikel "${article.title}" akan dihapus permanen.`,
      confirmButtonText: 'Hapus',
    });

    if (!confirmed) return;

    try {
      const result = await deleteArticle(article.id);

      await showSuccessAlert(
        'Berhasil',
        result.message || 'Artikel berhasil dihapus.'
      );

      await loadArticles();
    } catch (error) {
      await showErrorAlert(
        'Gagal Menghapus',
        error instanceof Error
          ? error.message
          : 'Artikel gagal dihapus.'
      );
    }
  };

  return (
    <main
      className={`admin-dashboard-page admin-article-page${
        isSidebarCollapsed ? ' admin-dashboard-page--collapsed' : ''
      }`}
    >
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      <section className="admin-dashboard-main">
        <header className="admin-article-topbar">
          <div>
            <h1>Artikel</h1>
            <p>
              Dashboard <span>/</span> Artikel
            </p>
          </div>

          <div className="admin-article-top-actions">
            <a
              className="admin-article-secondary"
              href="/admin/tutorial"
            >
              Tutorial / Materi
            </a>

            <a
              className="admin-article-primary"
              href="/admin/artikel/tambah"
            >
              + Tambah Artikel
            </a>
          </div>
        </header>

        <section className="admin-article-stats">
          <article>
            <span>Total Artikel</span>
            <strong>{stats.total}</strong>
          </article>

          <article>
            <span>Published</span>
            <strong>{stats.published}</strong>
          </article>

          <article>
            <span>Draft</span>
            <strong>{stats.draft}</strong>
          </article>

          <article>
            <span>Total Viewer</span>
            <strong>{stats.viewer}</strong>
          </article>
        </section>

        <section className="admin-article-filter">
          <input
            type="search"
            placeholder="Cari judul, slug, atau author..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
          >
            <option value="">Semua Kategori</option>
            {categories.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>

          <button type="button" onClick={loadArticles}>
            {isLoading ? 'Memuat...' : 'Muat Ulang'}
          </button>
        </section>

        {loadError && (
          <div className="admin-article-alert">{loadError}</div>
        )}

        <section className="admin-article-table-card">
          <table>
            <thead>
              <tr>
                <th>Artikel</th>
                <th>Kategori</th>
                <th>Author</th>
                <th>Status</th>
                <th>Viewer</th>
                <th>Publish</th>
                <th>Update</th>
                <th>Aksi</th>
              </tr>
            </thead>

            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8}>Memuat data artikel...</td>
                </tr>
              )}

              {!isLoading && filteredArticles.length === 0 && (
                <tr>
                  <td colSpan={8}>Belum ada artikel.</td>
                </tr>
              )}

              {!isLoading &&
                filteredArticles.map((article) => (
                  <tr key={article.id}>
                    <td>
                      <div className="admin-article-title-cell">
                        <span className="admin-article-thumb">
                          {article.coverImageUrl ? (
                            <img
                              src={article.coverImageUrl}
                              alt={article.title}
                            />
                          ) : (
                            'A'
                          )}
                        </span>

                        <div>
                          <strong>{article.title}</strong>
                          <small>{article.slug}</small>
                        </div>
                      </div>
                    </td>

                    <td>{article.category}</td>
                    <td>{article.author}</td>
                    <td>
                      <StatusBadge status={article.status} />
                    </td>
                    <td>{article.viewer}</td>
                    <td>
                      {formatDate(
                        article.publishedAt || article.createdAt
                      )}
                    </td>
                    <td>{formatDate(article.updatedAt)}</td>
                    <td>
                      <div className="admin-article-actions">
                        {article.status === 'published' && (
                          <a
                            href={
                              article.slug
                                ? `/artikel/detail?slug=${encodeURIComponent(
                                    article.slug
                                  )}`
                                : `/artikel/detail?id=${article.id}`
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            Lihat
                          </a>
                        )}

                        <a
                          href={`/admin/artikel/edit?id=${encodeURIComponent(
                            article.id
                          )}`}
                        >
                          Edit
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDelete(article)}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      </section>
    </main>
  );
}

export default AdminArticle;
