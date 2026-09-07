import { useEffect, useMemo, useState } from 'react';
import {
  fetchArticle,
  fetchPublishedArticles,
  incrementArticleView,
} from '../services/articleApi.js';
import fallbackArticleImage from '../assets/images/tutorial-device.png';
import '../styles/article-detail.css';

function getArticleIdentifier() {
  const params = new URLSearchParams(window.location.search);

  return (
    params.get('slug') ||
    params.get('id') ||
    ''
  );
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

function stripHtml(value) {
  return String(value || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function estimateReadingTime(content) {
  const text = stripHtml(content);

  if (!text) {
    return 1;
  }

  const words = text.split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 200));
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
      'script, object, embed, iframe:not([src*="youtube.com"]):not([src*="youtu.be"])'
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

    if (element.tagName === 'A') {
      const href = element.getAttribute('href') || '';

      if (/^https?:\/\//i.test(href)) {
        element.setAttribute('target', '_blank');
        element.setAttribute('rel', 'noopener noreferrer');
      }
    }
  });

  return documentNode.body.innerHTML;
}

function articleTarget(article) {
  const slug = String(article?.slug || '').trim();

  if (slug) {
    return `/artikel/detail?slug=${encodeURIComponent(slug)}`;
  }

  if (article?.id) {
    return `/artikel/detail?id=${encodeURIComponent(article.id)}`;
  }

  return '/artikel';
}

function buildRelatedArticles(rows, currentArticle) {
  const candidates = (Array.isArray(rows) ? rows : [])
    .filter((item) => item.id !== currentArticle.id);

  const currentTags = Array.isArray(currentArticle.tags)
    ? currentArticle.tags
    : [];

  const preferred = candidates.filter((item) => {
    const sameCategory =
      item.category === currentArticle.category;

    const sameTag =
      currentTags.length > 0 &&
      currentTags.some((tag) =>
        Array.isArray(item.tags)
          ? item.tags.includes(tag)
          : false
      );

    return sameCategory || sameTag;
  });

  const preferredIds = new Set(
    preferred.map((item) => String(item.id))
  );

  const fallback = candidates.filter(
    (item) => !preferredIds.has(String(item.id))
  );

  return [...preferred, ...fallback].slice(0, 3);
}

function LoadingState() {
  return (
    <main className="article-detail-v2-page">
      <section className="article-detail-v2-state">
        <span
          className="article-detail-v2-spinner"
          aria-hidden="true"
        />
        <h1>Memuat Artikel</h1>
        <p>Konten sedang disiapkan untuk Anda.</p>
      </section>
    </main>
  );
}

function ErrorState({ error }) {
  return (
    <main className="article-detail-v2-page">
      <section className="article-detail-v2-state is-error">
        <span className="article-detail-v2-error-code">404</span>
        <h1>Artikel Tidak Ditemukan</h1>
        <p>
          {error ||
            'Artikel yang Anda cari tidak tersedia.'}
        </p>

        <div className="article-detail-v2-state-actions">
          <a href="/tutorial">Kembali ke Tutorial</a>
          <a href="/artikel">Lihat Semua Artikel</a>
        </div>
      </section>
    </main>
  );
}

export function ArticleDetail() {
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const identifier = getArticleIdentifier();

    const loadArticle = async () => {
      if (!identifier) {
        setStatus('error');
        setError('ID atau slug artikel tidak ditemukan.');
        return;
      }

      try {
        setStatus('loading');
        setError('');

        const currentArticle = await fetchArticle(
          identifier,
          {
            publishedOnly: true,
          }
        );

        if (!active) return;

        setArticle(currentArticle);
        setStatus('ready');

        incrementArticleView(currentArticle.id).catch(() => {});

        fetchPublishedArticles()
          .then((rows) => {
            if (!active) return;

            setRelated(
              buildRelatedArticles(
                rows,
                currentArticle
              )
            );
          })
          .catch(() => {
            if (active) {
              setRelated([]);
            }
          });
      } catch (fetchError) {
        if (!active) return;

        setArticle(null);
        setRelated([]);
        setStatus('error');
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Artikel tidak dapat dimuat.'
        );
      }
    };

    loadArticle();

    return () => {
      active = false;
    };
  }, []);

  const safeContent = useMemo(
    () =>
      sanitizeArticleHtml(
        article?.content || ''
      ),
    [article?.content]
  );

  const readingTime = useMemo(
    () =>
      estimateReadingTime(
        article?.content || ''
      ),
    [article?.content]
  );

  const copyArticleLink = async () => {
    try {
      await navigator.clipboard.writeText(
        window.location.href
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch {
      setCopied(false);
    }
  };

  if (status === 'loading') {
    return <LoadingState />;
  }

  if (status === 'error' || !article) {
    return <ErrorState error={error} />;
  }

  const coverImage =
    article.coverImageUrl ||
    fallbackArticleImage;

  const publishedDate =
    article.publishedAt ||
    article.createdAt;

  const views =
    (Number(article.viewer) || 0) + 1;

  return (
    <main className="article-detail-v2-page">
      <header className="article-detail-v2-hero">
        <div className="article-detail-v2-shell">
          <div className="article-detail-v2-hero-grid">
            <div className="article-detail-v2-hero-copy">
              <a
                className="article-detail-v2-back"
                href="/tutorial"
              >
                <span aria-hidden="true">←</span>
                Kembali ke Tutorial
              </a>

              <span className="article-detail-v2-category">
                {article.category || 'Artikel'}
              </span>

              <h1>{article.title}</h1>

              {article.excerpt && (
                <p className="article-detail-v2-excerpt">
                  {article.excerpt}
                </p>
              )}

              <div className="article-detail-v2-meta">
                <span>
                  Oleh{' '}
                  <strong>
                    {article.author ||
                      'Admin ArduFlow'}
                  </strong>
                </span>

                <span aria-hidden="true">•</span>

                <span>
                  {formatDate(publishedDate)}
                </span>

                <span aria-hidden="true">•</span>

                <span>
                  {readingTime} menit baca
                </span>

                <span aria-hidden="true">•</span>

                <span>
                  {views.toLocaleString('id-ID')} pembaca
                </span>
              </div>
            </div>

            <figure className="article-detail-v2-hero-cover">
              <img
                src={coverImage}
                alt={article.title}
                loading="eager"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src =
                    fallbackArticleImage;
                }}
              />
            </figure>
          </div>
        </div>
      </header>

      <section
        className="article-detail-v2-content-section"
        id="isi-artikel"
      >
        <div className="article-detail-v2-shell article-detail-v2-layout">
          <article className="article-detail-v2-reader">
            <div className="article-detail-v2-reader-head">
              <span>Isi Artikel</span>
              <small>
                {readingTime} menit baca
              </small>
            </div>

            {safeContent ? (
              <div
                className="article-detail-v2-rich"
                dangerouslySetInnerHTML={{
                  __html: safeContent,
                }}
              />
            ) : (
              <div className="article-detail-v2-empty">
                Isi artikel belum tersedia.
              </div>
            )}

            <footer className="article-detail-v2-reader-footer">
              <div>
                <strong>Selesai membaca?</strong>
                <p>
                  Jelajahi artikel lain atau lanjutkan
                  belajar melalui materi ArduFlow.
                </p>
              </div>
            </footer>
          </article>


        </div>
      </section>

      {related.length > 0 && (
        <section className="article-detail-v2-related">
          <div className="article-detail-v2-shell">
            <div className="article-detail-v2-related-head">
              <div>
                <span>Rekomendasi Bacaan</span>
                <h2>Artikel Terkait</h2>
                <p>
                  Lanjutkan membaca topik yang masih
                  berhubungan dengan artikel ini.
                </p>
              </div>

              <a href="/artikel">
                Lihat Semua Artikel →
              </a>
            </div>

            <div className="article-detail-v2-related-grid">
              {related.map((item) => (
                <a
                  className="article-detail-v2-related-card"
                  href={articleTarget(item)}
                  key={item.id || item.slug}
                >
                  <div className="article-detail-v2-related-image">
                    <img
                      src={
                        item.coverImageUrl ||
                        fallbackArticleImage
                      }
                      alt={item.title}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror =
                          null;
                        event.currentTarget.src =
                          fallbackArticleImage;
                      }}
                    />
                  </div>

                  <div className="article-detail-v2-related-body">
                    <div className="article-detail-v2-related-meta">
                      <span>
                        {item.category || 'Artikel'}
                      </span>

                      <time>
                        {formatDate(
                          item.publishedAt ||
                            item.createdAt
                        )}
                      </time>
                    </div>

                    <h3>{item.title}</h3>

                    <p>
                      {item.excerpt ||
                        'Baca artikel lainnya dari ArduFlow.'}
                    </p>

                    <strong>
                      Baca Artikel →
                    </strong>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default ArticleDetail;
