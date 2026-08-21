import { useEffect, useMemo, useState } from 'react';
import {
  fetchArticle,
  fetchPublishedArticles,
  incrementArticleView,
} from '../services/articleApi.js';
import '../styles/article.css';

function getArticleIdentifier() {
  const params = new URLSearchParams(window.location.search);

  return params.get('id') || params.get('slug') || '';
}

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

function sanitizeArticleHtml(html) {
  if (typeof window === 'undefined') {
    return String(html || '');
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(
    String(html || ''),
    'text/html'
  );

  documentNode
    .querySelectorAll(
      'script, iframe:not([src*="youtube.com"]):not([src*="youtu.be"]), object, embed'
    )
    .forEach((element) => element.remove());

  documentNode.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();

      if (name.startsWith('on')) {
        element.removeAttribute(attribute.name);
      }

      if (
        (name === 'href' || name === 'src') &&
        value.startsWith('javascript:')
      ) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return documentNode.body.innerHTML;
}

export function ArticleDetail() {
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const identifier = getArticleIdentifier();

    const load = async () => {
      if (!identifier) {
        setStatus('error');
        setError('ID atau slug artikel tidak ditemukan.');
        return;
      }

      try {
        setStatus('loading');
        setError('');

        const currentArticle = await fetchArticle(identifier, {
          publishedOnly: true,
        });

        if (!active) return;

        setArticle(currentArticle);
        setStatus('ready');

        incrementArticleView(currentArticle.id);

        fetchPublishedArticles()
          .then((rows) => {
            if (!active) return;

            setRelated(
              rows
                .filter((item) => item.id !== currentArticle.id)
                .filter(
                  (item) =>
                    item.category === currentArticle.category ||
                    currentArticle.tags.some((tag) =>
                      item.tags.includes(tag)
                    )
                )
                .slice(0, 3)
            );
          })
          .catch(() => {
            if (active) setRelated([]);
          });
      } catch (fetchError) {
        if (!active) return;

        setArticle(null);
        setStatus('error');
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Artikel tidak dapat dimuat.'
        );
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  const safeContent = useMemo(
    () => sanitizeArticleHtml(article?.content || ''),
    [article?.content]
  );

  if (status === 'loading') {
    return (
      <main className="article-detail-page">
        <div className="article-shell article-state">
          Memuat artikel...
        </div>
      </main>
    );
  }

  if (status === 'error' || !article) {
    return (
      <main className="article-detail-page">
        <div className="article-shell article-state is-error">
          <h1>Artikel Tidak Ditemukan</h1>
          <p>{error}</p>
          <a className="article-primary-link" href="/artikel">
            Kembali ke Artikel
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="article-detail-page">
      <header className="article-detail-hero">
        <div className="article-detail-narrow">
          <a className="article-detail-back" href="/artikel">
            ← Semua Artikel
          </a>

          <div className="article-detail-category">
            {article.category}
          </div>

          <h1>{article.title}</h1>

          {article.excerpt && (
            <p className="article-detail-lead">{article.excerpt}</p>
          )}

          <div className="article-detail-meta">
            <span>{article.author}</span>
            <span>•</span>
            <span>{formatDate(article.publishedAt || article.createdAt)}</span>
            <span>•</span>
            <span>{article.viewer + 1} pembaca</span>
          </div>
        </div>
      </header>

      <div className="article-detail-narrow">
        {article.coverImageUrl && (
          <figure className="article-detail-cover">
            <img src={article.coverImageUrl} alt={article.title} />
          </figure>
        )}

        <article
          className="article-rich-content"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />

        {article.tags.length > 0 && (
          <div className="article-tags">
            {article.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        )}

        {related.length > 0 && (
          <section className="article-related">
            <h2>Artikel Terkait</h2>

            <div className="article-grid">
              {related.map((item) => (
                <a
                  className="article-related-card"
                  key={item.id}
                  href={
                    item.slug
                      ? `/artikel/detail?slug=${encodeURIComponent(item.slug)}`
                      : `/artikel/detail?id=${item.id}`
                  }
                >
                  <strong>{item.title}</strong>
                  <span>{item.category}</span>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default ArticleDetail;
