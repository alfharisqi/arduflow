import { useEffect, useMemo, useState } from 'react';
import tutorialDevice from '../assets/images/tutorial-device.png';
import { fetchPublishedArticles } from '../services/articleApi.js';

export function TutorialIcon({ type }) {
  if (type === 'code') {
    return (
      <svg viewBox="0 0 50 22" aria-hidden="true">
        <path d="M17 5L7 11L17 17" />
        <path d="M33 5L43 11L33 17" />
        <path d="M28 3L22 19" />
      </svg>
    );
  }

  if (type === 'cpu') {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <rect x="11" y="11" width="18" height="18" rx="2" />
        <rect x="16" y="16" width="8" height="8" rx="1" />
        <path d="M16 3V8M24 3V8M16 32V37M24 32V37M3 16H8M3 24H8M32 16H37M32 24H37" />
      </svg>
    );
  }

  if (type === 'zap') {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M23 3L9 22H19L17 37L31 16H21L23 3Z" />
      </svg>
    );
  }

  if (type === 'settings') {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M20 13A7 7 0 1 0 20 27A7 7 0 0 0 20 13Z" />
        <path d="M31 21.5V18.5L35 15.5L31 8.5L26.2 10.5L23.5 9L22.8 4H14.8L14.1 9L11.4 10.5L6.6 8.5L2.6 15.5L6.6 18.5V21.5L2.6 24.5L6.6 31.5L11.4 29.5L14.1 31L14.8 36H22.8L23.5 31L26.2 29.5L31 31.5L35 24.5L31 21.5Z" />
      </svg>
    );
  }

  if (type === 'layers') {
    return (
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <path d="M20 5L35 13L20 21L5 13L20 5Z" />
        <path d="M5 21L20 29L35 21" />
        <path d="M5 28L20 36L35 28" />
      </svg>
    );
  }

  if (type === 'help') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="16" />
        <path d="M19 19A5 5 0 0 1 24 15A5 5 0 0 1 29 20C29 24 24 24 24 28" />
        <path d="M24 34H24.1" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <path d="M8 9H17A5 5 0 0 1 22 14V32A5 5 0 0 0 17 27H8V9Z" />
      <path d="M32 9H23A5 5 0 0 0 18 14V32A5 5 0 0 1 23 27H32V9Z" />
    </svg>
  );
}

const learningPaths = [
  {
    icon: 'book',
    title: 'Panduan Pemula',
    text: 'Mengenal Arduflow, dasar Arduino, dan visual programming.',
  },
  {
    icon: 'code',
    title: 'Penggunaan IDE',
    text: 'Mengenal tampilan IDE, membuat Proyek, dan manajemen node.',
  },
  {
    icon: 'cpu',
    title: 'Dasar Hardware dan IoT',
    text: 'Belajar board, sensor, actuator, dan rangkaian dasar.',
  },
  {
    icon: 'zap',
    title: 'Contoh Proyek',
    text: 'Kumpulan Proyek praktis dan level Dasar hingga Lanjut.',
  },
];

const recommendedFlow = [
  'Level 1 - Pemula',
  'Level 2 - Dasar IDE',
  'Level 3 - Dasar Hardware',
  'Level 4 - Proyek Terarah',
  'Level 5 - Proyek Lanjutan',
];

function articleTarget(article) {
  const slug = String(article?.slug || '').trim();

  if (slug) {
    return `/artikel/detail?slug=${encodeURIComponent(slug)}`;
  }

  const id = article?.id || '';

  if (id) {
    return `/artikel/detail?id=${encodeURIComponent(id)}`;
  }

  return '/artikel';
}

function formatArticleDate(value) {
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
  }).format(date);
}

export function Tutorial() {
  const [articles, setArticles] = useState([]);
  const [articleStatus, setArticleStatus] = useState('loading');
  const [articleError, setArticleError] = useState('');

  useEffect(() => {
    let isMounted = true;

    setArticleStatus('loading');
    setArticleError('');

    fetchPublishedArticles()
      .then((items) => {
        if (!isMounted) {
          return;
        }

        setArticles(Array.isArray(items) ? items : []);
        setArticleStatus('ready');
      })
      .catch((fetchError) => {
        if (!isMounted) {
          return;
        }

        setArticles([]);
        setArticleStatus('error');
        setArticleError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Artikel tidak dapat dimuat.'
        );
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const latestArticles = useMemo(
    () => articles.slice(0, 3),
    [articles]
  );

  return (
    <>
      <section
        className="tutorial-learning-hero"
        aria-labelledby="tutorial-learning-title"
      >
        <div className="tutorial-learning-copy">
          <p className="tutorial-learning-eyebrow">
            Pusat Belajar Arduflow
          </p>

          <h1 id="tutorial-learning-title">
            <span>Belajar</span>
            <span>Arduflow</span>
            <span>Dari Dasar</span>
          </h1>

          <p>
            Pelajari dasar IoT, penggunaan Arduflow IDE, dan pembuatan
            proyek melalui jalur belajar yang terarah.
          </p>

          <div className="tutorial-learning-actions">
            <a
              className="tutorial-primary-action"
              href="/materi"
            >
              Lihat Materi
            </a>

            <a
              className="tutorial-secondary-action"
              href="#artikel-terbaru"
            >
              Baca Artikel
            </a>
          </div>
        </div>

        <div className="tutorial-device-scene">
          <img
            src={tutorialDevice}
            alt="Rangkaian IoT Arduflow di breadboard"
          />
        </div>
      </section>

      <section
        className="tutorial-path-section"
        id="pilih-jalur-belajar"
        aria-labelledby="tutorial-path-title"
      >
        <div className="tutorial-path-inner">
          <div className="tutorial-path-heading">
            <h2 id="tutorial-path-title">
              Pilih Jalur Belajarmu
            </h2>

            <p>
              Pilih arah belajar yang sesuai, lalu buka seluruh materi
              melalui halaman Materi.
            </p>
          </div>

          <div className="tutorial-path-cards">
            {learningPaths.map((path) => (
              <article
                className="tutorial-path-card"
                key={path.title}
              >
                <div
                  className={`tutorial-path-icon ${path.icon}-icon`}
                >
                  <TutorialIcon type={path.icon} />
                </div>

                <h3>{path.title}</h3>
                <p>{path.text}</p>

                <a href="/materi">
                  Lihat Materi
                </a>
              </article>
            ))}
          </div>

          <div className="tutorial-flow-heading">
            <h2>Alur Belajar yang Disarankan</h2>

            <p>
              Ikuti langkah bertahap untuk memahami Arduflow dari dasar
              hingga membuat Proyek lanjutan.
            </p>
          </div>

          <div
            className="tutorial-flow"
            aria-label="Alur belajar yang disarankan"
          >
            {recommendedFlow.map((step, index) => (
              <div
                className="tutorial-flow-step"
                key={step}
              >
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>

          <a
            className="tutorial-flow-button"
            href="/materi"
          >
            Buka Semua Materi
          </a>
        </div>
      </section>

      <section
        className="tutorial-article-section"
        id="artikel-terbaru"
        aria-labelledby="tutorial-article-title"
      >
        <div className="tutorial-article-inner">
          <div className="tutorial-article-heading">
            <div>
              <span>ArduFlow Insight</span>

              <h2 id="tutorial-article-title">
                Artikel Terbaru
              </h2>

              <p>
                Baca insight, tutorial singkat, dan informasi terbaru
                seputar IoT, Arduino, ESP32, dan ArduFlow.
              </p>
            </div>

            <a href="/artikel">
              Lihat Semua Artikel
              <span aria-hidden="true"> →</span>
            </a>
          </div>

          {articleStatus === 'loading' && (
            <p className="tutorial-article-state">
              Memuat artikel terbaru...
            </p>
          )}

          {articleStatus === 'error' && (
            <p className="tutorial-article-state is-error">
              Artikel belum dapat dimuat. {articleError}
            </p>
          )}

          {articleStatus === 'ready' &&
            latestArticles.length === 0 && (
              <p className="tutorial-article-state">
                Belum ada artikel yang dipublikasikan.
              </p>
            )}

          {latestArticles.length > 0 && (
            <div className="tutorial-article-grid">
              {latestArticles.map((article) => {
                const detailUrl =
                  articleTarget(article);

                return (
                  <article
                    className="tutorial-article-card"
                    key={article.id || article.slug}
                  >
                    <a
                      className="tutorial-article-cover"
                      href={detailUrl}
                      aria-label={`Baca artikel ${article.title}`}
                    >
                      {article.coverImageUrl ? (
                        <img
                          src={article.coverImageUrl}
                          alt={article.title}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src =
                              tutorialDevice;
                          }}
                        />
                      ) : (
                        <div className="tutorial-article-placeholder">
                          <span>ARDUFLOW</span>
                          <strong>INSIGHT</strong>
                        </div>
                      )}
                    </a>

                    <div className="tutorial-article-card-body">
                      <div className="tutorial-article-meta">
                        <span>
                          {article.category || 'Umum'}
                        </span>

                        <time>
                          {formatArticleDate(
                            article.publishedAt ||
                              article.createdAt
                          )}
                        </time>
                      </div>

                      <h3>
                        <a href={detailUrl}>
                          {article.title}
                        </a>
                      </h3>

                      <p>
                        {article.excerpt ||
                          'Baca informasi dan insight terbaru dari ArduFlow.'}
                      </p>

                      <div className="tutorial-article-footer">
                        <span>
                          {article.author ||
                            'Admin ArduFlow'}
                        </span>

                        <a href={detailUrl}>
                          Baca Artikel
                          <span aria-hidden="true"> →</span>
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
