import { useEffect, useMemo, useState } from 'react';
import { fetchTutorialArticle, isPublishedTutorial } from '../services/articleApi.js';
import fallbackTutorialImage from '../assets/images/tutorial-device.png';

function getTutorialIdentifier() {
  const params = new URLSearchParams(window.location.search);
  const segments = window.location.pathname.split('/').filter(Boolean);
  const lastSegment = segments.at(-1) || '';

  return params.get('id') || params.get('slug') || (!['tutorial', 'detail'].includes(lastSegment) ? lastSegment : '');
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function sanitizeHtml(value) {
  return String(value || '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\s(href|src)=["']javascript:[^"']*["']/gi, '');
}

function categoryLabel(value) {
  return String(value || 'Umum')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isPublishedSlide(slide) {
  const status = String(slide.status || '').toLowerCase();
  return status === '' || status === 'published' || status === 'publish';
}

function materialHref(tutorial, slideIndex = 0) {
  const identifier = tutorial?.slug || tutorial?.id || '';
  const params = new URLSearchParams();

  if (identifier) {
    params.set(/^\d+$/.test(String(identifier)) ? 'id' : 'slug', String(identifier));
  }

  if (slideIndex > 0) {
    params.set('slide', String(slideIndex + 1));
  }

  return params.toString() ? `/materi?${params.toString()}` : '/materi';
}

export function TutorialDetail() {
  const [tutorial, setTutorial] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const identifier = getTutorialIdentifier();

    setIsLoading(true);
    setError('');

    fetchTutorialArticle(identifier)
      .then((item) => {
        if (!isMounted) return;

        if (!isPublishedTutorial(item)) {
          throw new Error('Tutorial belum dipublish.');
        }

        setTutorial(item);
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setTutorial(null);
        setError(fetchError.message || 'Gagal memuat detail tutorial.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const slides = useMemo(() => {
    if (!tutorial) return [];
    return tutorial.slides.filter(isPublishedSlide);
  }, [tutorial]);

  if (isLoading || error || !tutorial) {
    return (
      <section className="tutorial-overview-page" aria-labelledby="tutorial-overview-title">
        <div className="tutorial-overview-shell">
          <a className="tutorial-overview-back" href="/tutorial">Kembali ke Tutorial</a>
          <div className="tutorial-overview-state">
            <h1 id="tutorial-overview-title">{isLoading ? 'Memuat Tutorial' : 'Tutorial Tidak Ditemukan'}</h1>
            <p>{isLoading ? 'Data tutorial sedang diambil dari article-api.php.' : error || 'Tutorial tidak tersedia.'}</p>
          </div>
        </div>
      </section>
    );
  }

  const heroImage = tutorial.cardImageUrl || fallbackTutorialImage;
  const summaryHtml = sanitizeHtml(tutorial.fullDescription);

  return (
    <section className="tutorial-overview-page" aria-labelledby="tutorial-overview-title">
      <div className="tutorial-overview-shell">
        <a className="tutorial-overview-back" href="/tutorial">Kembali ke Tutorial</a>

        <header className="tutorial-overview-hero">
          <div className="tutorial-overview-copy">
            <p className="tutorial-overview-eyebrow">{categoryLabel(tutorial.category)}</p>
            <h1 id="tutorial-overview-title">{tutorial.title}</h1>
            <p>{tutorial.shortDescription || stripHtml(tutorial.fullDescription) || 'Ringkasan tutorial Arduflow.'}</p>
            <div className="tutorial-overview-actions">
              <a className="tutorial-primary-action" href={materialHref(tutorial)}>Mulai Materi</a>
              <a className="tutorial-secondary-action" href="#daftar-materi">Lihat Daftar</a>
            </div>
          </div>
          <div className="tutorial-overview-media">
            <img src={heroImage} alt={tutorial.title} />
          </div>
        </header>

        <section className="tutorial-overview-meta" aria-label="Informasi tutorial">
          <article>
            <span>Estimasi</span>
            <strong>{tutorial.estimatedTime || 'Belum diatur'}</strong>
          </article>
          <article>
            <span>Level</span>
            <strong>{tutorial.difficulty || 'Semua Level'}</strong>
          </article>
          <article>
            <span>Total Materi</span>
            <strong>{slides.length || tutorial.totalSlides || 0} slide</strong>
          </article>
        </section>

        <section className="tutorial-overview-content" aria-labelledby="tutorial-overview-summary-title">
          <h2 id="tutorial-overview-summary-title">Tentang Tutorial</h2>
          {summaryHtml ? (
            <div className="tutorial-rich-content" dangerouslySetInnerHTML={{ __html: summaryHtml }} />
          ) : (
            <p>{tutorial.shortDescription || 'Deskripsi lengkap tutorial belum tersedia.'}</p>
          )}
        </section>

        <section className="tutorial-overview-outline" id="daftar-materi" aria-labelledby="tutorial-overview-outline-title">
          <div>
            <p className="tutorial-overview-eyebrow">Materi</p>
            <h2 id="tutorial-overview-outline-title">Daftar Materi</h2>
          </div>

          {slides.length === 0 ? (
            <p className="tutorial-data-state">Belum ada materi yang dipublish.</p>
          ) : (
            <div className="tutorial-overview-outline-grid">
              {slides.map((slide, index) => (
                <article className="tutorial-overview-outline-card" key={slide.id}>
                  <span>{index + 1}</span>
                  <div>
                    <h3>{slide.title}</h3>
                    <p>{stripHtml(slide.content) || slide.estimatedTime || 'Materi tutorial dari Arduflow.'}</p>
                  </div>
                  <a href={materialHref(tutorial, index)}>Buka Materi</a>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
