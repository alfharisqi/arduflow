import { useEffect, useMemo, useState } from 'react';
import { fetchPublishedArticles } from '../services/articleApi.js';
import fallbackArticleImage from '../assets/images/tutorial-device.png';
import '../styles/article.css';

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

function articleTarget(article) {
  if (article?.slug) {
    return `/artikel/detail?slug=${encodeURIComponent(article.slug)}`;
  }

  if (article?.id) {
    return `/artikel/detail?id=${encodeURIComponent(article.id)}`;
  }

  return '/artikel';
}

function ArticleCard({ article }) {
  const detailUrl = articleTarget(article);

  return (
    <article className="article-card">
      <a
        className="article-card-cover"
        href={detailUrl}
        aria-label={`Baca artikel ${article.title}`}
      >
        <img
          src={article.coverImageUrl || fallbackArticleImage}
          alt={article.title}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = fallbackArticleImage;
          }}
        />

        <span className="article-card-category">
          {article.category || 'Artikel'}
        </span>
      </a>

      <div className="article-card-body">
        <div className="article-card-meta">
          <time>
            {formatDate(article.publishedAt || article.createdAt)}
          </time>

          <span>
            {Number(article.viewer || 0).toLocaleString('id-ID')} pembaca
          </span>
        </div>

        <h2>
          <a href={detailUrl}>{article.title}</a>
        </h2>

        <p>
          {article.excerpt ||
            'Baca artikel terbaru seputar IoT, Arduino, ESP32, dan ArduFlow.'}
        </p>

        <div className="article-card-footer">
          <span>{article.author || 'Admin ArduFlow'}</span>

          <a href={detailUrl}>
            Baca Artikel <span aria-hidden="true"></span>
          </a>
        </div>
      </div>
    </article>
  );
}

export function Article() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadArticles = async () => {
      try {
        setStatus('loading');
        setError('');

        const rows = await fetchPublishedArticles();

        if (!active) return;

        setArticles(Array.isArray(rows) ? rows : []);
        setStatus('ready');
      } catch (fetchError) {
        if (!active) return;

        setArticles([]);
        setStatus('error');
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Artikel tidak dapat dimuat.'
        );
      }
    };

    loadArticles();

    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          articles
            .map((article) => article.category)
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b, 'id')),
    [articles]
  );

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return articles.filter((article) => {
      const tags = Array.isArray(article.tags) ? article.tags : [];

      const matchesSearch =
        !query ||
        String(article.title || '').toLowerCase().includes(query) ||
        String(article.excerpt || '').toLowerCase().includes(query) ||
        tags.some((tag) =>
          String(tag).toLowerCase().includes(query)
        );

      const matchesCategory =
        !category || article.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [articles, category, search]);

  const featuredArticle =
    filteredArticles.find((article) => article.featured) ||
    filteredArticles[0] ||
    null;

  const regularArticles = featuredArticle
    ? filteredArticles.filter(
        (article) => article.id !== featuredArticle.id
      )
    : filteredArticles;

  const featuredUrl = featuredArticle
    ? articleTarget(featuredArticle)
    : '/artikel';

  return (
    <main className="article-page">
      <section className="article-hero">
        <div className="article-shell">
          <span className="article-kicker">ArduFlow Insight</span>

          <h1>Artikel IoT, Arduino, dan Teknologi</h1>

          <p>
            Temukan artikel praktis, inspirasi project, tutorial, serta
            insight pembelajaran Internet of Things dari ArduFlow.
          </p>

          <div className="article-filter">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari artikel..."
              aria-label="Cari artikel"
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter kategori artikel"
            >
              <option value="">Semua Kategori</option>

              {categories.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="article-content">
        <div className="article-shell">
          {status === 'loading' && (
            <div className="article-state">
              <strong>Memuat artikel...</strong>
            </div>
          )}

          {status === 'error' && (
            <div className="article-state is-error">
              <strong>Artikel gagal dimuat</strong>
              <p>{error}</p>
            </div>
          )}

          {status === 'ready' && filteredArticles.length === 0 && (
            <div className="article-state">
              <strong>Artikel tidak ditemukan</strong>
              <p>Coba gunakan kata kunci atau kategori lainnya.</p>
            </div>
          )}

          {status === 'ready' && featuredArticle && (
            <>
              <div className="article-section-heading">
                <div>
                  <span>Pilihan Terbaru</span>
                  <h2>Artikel Pilihan</h2>
                </div>

                <span>{filteredArticles.length} artikel</span>
              </div>

              <section className="article-featured">
                <a
                  className="article-featured-cover"
                  href={featuredUrl}
                  aria-label={`Baca ${featuredArticle.title}`}
                >
                  <img
                    src={
                      featuredArticle.coverImageUrl ||
                      fallbackArticleImage
                    }
                    alt={featuredArticle.title}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = fallbackArticleImage;
                    }}
                  />

                  <span className="article-featured-badge">
                    {featuredArticle.featured
                      ? 'Artikel Pilihan'
                      : 'Artikel Terbaru'}
                  </span>
                </a>

                <div className="article-featured-copy">
                  <span className="article-featured-category">
                    {featuredArticle.category || 'Artikel'}
                  </span>

                  <h2>
                      {featuredArticle.title}
                  </h2>

                  <p>
                    {featuredArticle.excerpt ||
                      'Baca informasi lengkap pada artikel ini.'}
                  </p>

                  <div className="article-featured-meta">
                    <span>
                      {featuredArticle.author || 'Admin ArduFlow'}
                    </span>
                    <span>•</span>
                    <span>
                      {formatDate(
                        featuredArticle.publishedAt ||
                          featuredArticle.createdAt
                      )}
                    </span>
                    <span>•</span>
                    <span>
                      {Number(
                        featuredArticle.viewer || 0
                      ).toLocaleString('id-ID')}{' '}
                      pembaca
                    </span>
                  </div>

                  <a
                    className="article-primary-link"
                    href={featuredUrl}
                  >
                    Baca Selengkapnya
                  </a>
                </div>
              </section>

              {regularArticles.length > 0 && (
                <section className="article-list-section">
                  <div className="article-section-heading">
                    <div>
                      <span>Jelajahi Insight</span>
                      <h2>Artikel Lainnya</h2>
                    </div>
                  </div>

                  <div className="article-grid">
                    {regularArticles.map((article) => (
                      <ArticleCard
                        article={article}
                        key={article.id || article.slug}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default Article;
