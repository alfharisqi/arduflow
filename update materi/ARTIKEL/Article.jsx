import { useEffect, useMemo, useState } from 'react';
import { fetchPublishedArticles } from '../services/articleApi.js';
import '../styles/article.css';

function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function ArticleCard({ article }) {
  const detailUrl = article.slug
    ? `/artikel/detail?slug=${encodeURIComponent(article.slug)}`
    : `/artikel/detail?id=${encodeURIComponent(article.id)}`;

  return (
    <article className="article-card">
      <a className="article-card-cover" href={detailUrl}>
        {article.coverImageUrl ? (
          <img src={article.coverImageUrl} alt={article.title} />
        ) : (
          <span className="article-card-placeholder">ArduFlow</span>
        )}
      </a>

      <div className="article-card-body">
        <div className="article-card-meta">
          <span>{article.category}</span>
          <time>{formatDate(article.publishedAt || article.createdAt)}</time>
        </div>

        <h2>
          <a href={detailUrl}>{article.title}</a>
        </h2>

        <p>
          {article.excerpt ||
            'Baca artikel terbaru seputar IoT, Arduino, dan ArduFlow.'}
        </p>

        <div className="article-card-footer">
          <span>{article.author}</span>
          <a href={detailUrl}>Baca Artikel →</a>
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

        setArticles(rows);
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
        article.excerpt.toLowerCase().includes(query) ||
        article.tags.some((tag) => tag.toLowerCase().includes(query));

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
    ? filteredArticles.filter((article) => article.id !== featuredArticle.id)
    : filteredArticles;

  return (
    <main className="article-page">
      <section className="article-hero">
        <div className="article-shell">
          <span className="article-kicker">ArduFlow Insight</span>
          <h1>Artikel IoT, Arduino, dan Teknologi</h1>
          <p>
            Temukan artikel praktis, inspirasi project, serta insight
            pembelajaran Internet of Things dari ArduFlow.
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

      <section className="article-shell article-content">
        {status === 'loading' && (
          <div className="article-state">Memuat artikel...</div>
        )}

        {status === 'error' && (
          <div className="article-state is-error">{error}</div>
        )}

        {status === 'ready' && filteredArticles.length === 0 && (
          <div className="article-state">
            Belum ada artikel yang sesuai dengan pencarian.
          </div>
        )}

        {status === 'ready' && featuredArticle && (
          <>
            <section className="article-featured">
              <div className="article-featured-cover">
                {featuredArticle.coverImageUrl ? (
                  <img
                    src={featuredArticle.coverImageUrl}
                    alt={featuredArticle.title}
                  />
                ) : (
                  <span>ArduFlow</span>
                )}
              </div>

              <div className="article-featured-copy">
                <span className="article-kicker">
                  {featuredArticle.featured
                    ? 'Artikel Pilihan'
                    : 'Artikel Terbaru'}
                </span>

                <h2>{featuredArticle.title}</h2>

                <p>
                  {featuredArticle.excerpt ||
                    'Baca informasi lengkap pada artikel ini.'}
                </p>

                <div className="article-featured-meta">
                  <span>{featuredArticle.author}</span>
                  <span>•</span>
                  <span>
                    {formatDate(
                      featuredArticle.publishedAt ||
                        featuredArticle.createdAt
                    )}
                  </span>
                  <span>•</span>
                  <span>{featuredArticle.viewer} pembaca</span>
                </div>

                <a
                  className="article-primary-link"
                  href={
                    featuredArticle.slug
                      ? `/artikel/detail?slug=${encodeURIComponent(
                          featuredArticle.slug
                        )}`
                      : `/artikel/detail?id=${featuredArticle.id}`
                  }
                >
                  Baca Selengkapnya
                </a>
              </div>
            </section>

            {regularArticles.length > 0 && (
              <div className="article-grid">
                {regularArticles.map((article) => (
                  <ArticleCard article={article} key={article.id} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default Article;
