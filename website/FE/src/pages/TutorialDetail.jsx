import { useEffect, useMemo, useState } from 'react';
import { fetchTutorialArticle, isPublishedTutorial } from '../services/articleApi.js';
import { TutorialIcon } from './Tutorial.jsx';
import fallbackTutorialImage from '../assets/images/tutorial-device.png';

function getTutorialIdentifier() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || params.get('slug') || '';
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, '').trim();
}

function categoryLabel(value) {
  return String(value || 'Umum')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderHtml(html) {
  return { __html: html || '' };
}

function isPublishedSlide(slide) {
  const status = String(slide.status || '').toLowerCase();
  return status === '' || status === 'published' || status === 'publish';
}

function slideDescription(slide) {
  const text = stripHtml(slide.content);
  return text || slide.estimatedTime || 'Materi tutorial dari data Arduflow.';
}

export function TutorialDetail() {
  const [tutorial, setTutorial] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const identifier = getTutorialIdentifier();

    fetchTutorialArticle(identifier)
      .then((item) => {
        if (!isMounted) {
          return;
        }

        if (!isPublishedTutorial(item)) {
          throw new Error('Materi tutorial belum dipublish.');
        }

        setTutorial(item);
        setActiveIndex(0);
        setError('');
      })
      .catch((fetchError) => {
        if (!isMounted) {
          return;
        }

        setTutorial(null);
        setError(fetchError.message || 'Gagal memuat detail tutorial.');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const slides = useMemo(() => {
    if (!tutorial) {
      return [];
    }

    const tutorialSlides = tutorial.slides.filter(isPublishedSlide);

    if (tutorialSlides.length > 0) {
      return tutorialSlides;
    }

    return [
      {
        id: `${tutorial.id}-description`,
        order: 1,
        title: tutorial.title,
        contentType: 'text',
        content: tutorial.fullDescription || tutorial.shortDescription,
        estimatedTime: tutorial.estimatedTime,
        status: 'published',
        imageUrl: tutorial.cardImageUrl,
        videoUrl: '',
      },
    ];
  }, [tutorial]);

  const activeSlide = slides[activeIndex] || slides[0] || null;

  const changeSlide = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= slides.length) {
      return;
    }

    setActiveIndex(nextIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <section className="beginner-ebook-section tutorial-detail-section" aria-labelledby="tutorial-detail-title">
        <div className="beginner-ebook-heading">
          <h1 id="tutorial-detail-title">Memuat Tutorial</h1>
          <p>Data materi sedang diambil dari article-api.php.</p>
        </div>
        <article className="beginner-ebook-panel tutorial-detail-panel">
          <p className="tutorial-data-state">Memuat detail tutorial...</p>
        </article>
      </section>
    );
  }

  if (error || !tutorial || !activeSlide) {
    return (
      <section className="beginner-ebook-section tutorial-detail-section" aria-labelledby="tutorial-detail-title">
        <div className="beginner-ebook-heading">
          <h1 id="tutorial-detail-title">Tutorial Tidak Ditemukan</h1>
          <p>{error || 'Materi tutorial tidak tersedia.'}</p>
        </div>
        <article className="beginner-ebook-panel tutorial-detail-panel">
          <a className="beginner-ebook-button" href="/tutorial">
            Kembali ke Tutorial
          </a>
        </article>
      </section>
    );
  }

  const activeImage = activeSlide.imageUrl || tutorial.cardImageUrl || fallbackTutorialImage;
  const hasHtmlContent = Boolean(activeSlide.content);

  return (
    <section className="beginner-ebook-section tutorial-detail-section" aria-labelledby="tutorial-detail-title">
      <div className="beginner-ebook-heading tutorial-detail-heading">
        <p className="tutorial-detail-eyebrow">{categoryLabel(tutorial.category)}</p>
        <h1 id="tutorial-detail-title">{tutorial.title}</h1>
        <p>{tutorial.shortDescription || stripHtml(tutorial.fullDescription)}</p>
      </div>

      <article className="beginner-ebook-panel tutorial-detail-panel">
        <div className="beginner-ebook-panel-header tutorial-detail-panel-header">
          <span className="beginner-ebook-number">{activeIndex + 1}</span>
          <div>
            <h2>{activeSlide.title}</h2>
            <p>{slideDescription(activeSlide)}</p>
          </div>
        </div>

        <div className="tutorial-detail-meta" aria-label="Informasi tutorial">
          <span>{tutorial.estimatedTime || activeSlide.estimatedTime || 'Estimasi belum diatur'}</span>
          <span>{tutorial.difficulty || 'Semua Level'}</span>
          <span>{slides.length} slide</span>
        </div>

        <div className="beginner-ebook-body tutorial-detail-body">
          <div className="beginner-ebook-copy tutorial-detail-copy">
            {hasHtmlContent ? (
              <div className="tutorial-rich-content" dangerouslySetInnerHTML={renderHtml(activeSlide.content)} />
            ) : (
              <p>Konten slide belum tersedia.</p>
            )}
          </div>

          <div className="tutorial-detail-media">
            {activeSlide.contentType === 'video' && activeSlide.videoUrl ? (
              <iframe
                src={activeSlide.videoUrl}
                title={activeSlide.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img src={activeImage} alt={activeSlide.title} loading="lazy" />
            )}
          </div>
        </div>

        {tutorial.fullDescription && (
          <div className="beginner-ebook-note tutorial-detail-note">
            <h3>Ringkasan Materi</h3>
            <div className="tutorial-rich-content" dangerouslySetInnerHTML={renderHtml(tutorial.fullDescription)} />
          </div>
        )}

        <div className="tutorial-detail-outline" aria-label="Daftar slide tutorial">
          {slides.map((slide, index) => (
            <button
              className={index === activeIndex ? 'is-active' : ''}
              type="button"
              key={slide.id}
              onClick={() => changeSlide(index)}
            >
              <span>{index + 1}</span>
              <strong>{slide.title}</strong>
            </button>
          ))}
        </div>

        <div className="beginner-ebook-footer">
          <div className="beginner-ebook-dots" aria-label="Navigasi slide tutorial">
            {slides.map((slide, index) => (
              <button
                className={index === activeIndex ? 'active' : ''}
                type="button"
                key={`${slide.id}-dot`}
                aria-label={`Buka slide ${index + 1}`}
                aria-current={index === activeIndex ? 'step' : undefined}
                onClick={() => changeSlide(index)}
              />
            ))}
          </div>

          <div className="beginner-ebook-actions">
            {activeIndex > 0 && (
              <button
                className="beginner-ebook-button secondary"
                type="button"
                onClick={() => changeSlide(activeIndex - 1)}
              >
                Materi Sebelumnya
              </button>
            )}
            {activeIndex < slides.length - 1 ? (
              <button className="beginner-ebook-button" type="button" onClick={() => changeSlide(activeIndex + 1)}>
                Materi Selanjutnya
              </button>
            ) : (
              <a className="beginner-ebook-button" href="/tutorial">
                Selesaikan Materi
              </a>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
