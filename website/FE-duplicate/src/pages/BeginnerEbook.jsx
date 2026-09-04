import { useEffect, useMemo, useState } from 'react';
import { fetchTutorialArticle, isPublishedTutorial } from '../services/materiApi.js';
import fallbackTutorialImage from '../assets/images/tutorial-device.png';

const DEFAULT_TUTORIAL_SLUG = 'panduan-pemula';

function getRequestedTutorial() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || params.get('slug') || DEFAULT_TUTORIAL_SLUG;
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, '').trim();
}

function renderHtml(value) {
  return { __html: value || '' };
}

function isPublishedSlide(slide) {
  const status = String(slide.status || '').toLowerCase();
  return status === '' || status === 'published' || status === 'publish';
}

function buildMaterials(tutorial) {
  const slides = Array.isArray(tutorial?.slides)
    ? tutorial.slides.filter(isPublishedSlide)
    : [];

  if (slides.length > 0) {
    return slides.map((slide, index) => ({
      id: slide.id || `${tutorial.id}-slide-${index + 1}`,
      number: String(index + 1),
      title: slide.title || `Materi ${index + 1}`,
      desc:
        stripHtml(slide.content).slice(0, 140) ||
        slide.estimatedTime ||
        tutorial.shortDescription ||
        '',
      body: slide.content || '',
      image: slide.imageUrl || tutorial.cardImageUrl || '',
      videoUrl: slide.videoUrl || '',
      type: slide.contentType || 'text',
    }));
  }

  return [
    {
      id: `${tutorial.id}-description`,
      number: '1',
      title: tutorial.title,
      desc: tutorial.shortDescription || '',
      body: tutorial.fullDescription || tutorial.shortDescription || '',
      image: tutorial.cardImageUrl || '',
      videoUrl: '',
      type: 'text',
    },
  ];
}

export function BeginnerEbook() {
  const [tutorial, setTutorial] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    fetchTutorialArticle(getRequestedTutorial())
      .then((item) => {
        if (cancelled) {
          return;
        }

        if (!isPublishedTutorial(item)) {
          throw new Error('Materi tutorial belum dipublish.');
        }

        setTutorial(item);
        setActiveIndex(0);
        setError('');
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        setTutorial(null);
        setError(err instanceof Error ? err.message : 'Gagal mengambil materi.');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const materials = useMemo(() => {
    if (!tutorial) {
      return [];
    }

    return buildMaterials(tutorial);
  }, [tutorial]);

  const activeMaterial = materials[activeIndex] ?? null;

  const changeMaterial = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= materials.length) {
      return;
    }

    setActiveIndex(nextIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageTitle = tutorial?.title || 'Panduan Pemula';
  const pageDescription =
    tutorial?.shortDescription ||
    stripHtml(tutorial?.fullDescription) ||
    'Pelajari materi tutorial ArduFlow dari data article-api.php.';

  if (loading) {
    return (
      <section className="beginner-ebook-section" aria-labelledby="beginner-ebook-title">
        <div className="beginner-ebook-heading">
          <h1 id="beginner-ebook-title">Panduan Pemula</h1>
          <p>Memuat materi tutorial dari article-api.php.</p>
        </div>

        <article className="beginner-ebook-panel">
          <p className="tutorial-data-state">Memuat materi...</p>
        </article>
      </section>
    );
  }

  if (error || !activeMaterial) {
    return (
      <section className="beginner-ebook-section" aria-labelledby="beginner-ebook-title">
        <div className="beginner-ebook-heading">
          <h1 id="beginner-ebook-title">Tutorial Tidak Ditemukan</h1>
          <p>{error || 'Belum ada materi yang tersedia.'}</p>
        </div>

        <article className="beginner-ebook-panel">
          <a className="beginner-ebook-button" href="/tutorial">
            Kembali ke Tutorial
          </a>
        </article>
      </section>
    );
  }

  const activeImage = activeMaterial.image || tutorial.cardImageUrl || fallbackTutorialImage;

  return (
    <section className="beginner-ebook-section" aria-labelledby="beginner-ebook-title">
      <div className="beginner-ebook-heading">
        <h1 id="beginner-ebook-title">{pageTitle}</h1>
        <p>{pageDescription}</p>
      </div>

      <article className="beginner-ebook-panel">
        <div className="beginner-ebook-panel-header">
          <span className="beginner-ebook-number">{activeMaterial.number}</span>

          <div>
            <h2>{activeMaterial.title}</h2>
            <p>{activeMaterial.desc || tutorial.estimatedTime || `${materials.length} slide`}</p>
          </div>
        </div>

        <div
          className={`beginner-ebook-body ${
            activeMaterial.type === 'video' ? 'beginner-ebook-video-body' : 'beginner-ebook-html-body'
          }`}
        >
          <div className="beginner-ebook-copy">
            {activeMaterial.body ? (
              <div className="tutorial-rich-content" dangerouslySetInnerHTML={renderHtml(activeMaterial.body)} />
            ) : (
              <p className="beginner-ebook-empty-content">Isi materi belum tersedia.</p>
            )}
          </div>

          <div className="beginner-ebook-media">
            {activeMaterial.type === 'video' && activeMaterial.videoUrl ? (
              <iframe
                src={activeMaterial.videoUrl}
                title={activeMaterial.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <img src={activeImage} alt={activeMaterial.title} loading="lazy" />
            )}
          </div>
        </div>

        {tutorial.fullDescription && materials.length > 1 && (
          <div className="beginner-ebook-note">
            <h3>Ringkasan Materi</h3>
            <div className="tutorial-rich-content" dangerouslySetInnerHTML={renderHtml(tutorial.fullDescription)} />
          </div>
        )}

        <div className="beginner-ebook-footer">
          <div className="beginner-ebook-dots" aria-label="Navigasi materi tutorial">
            {materials.map((material, index) => (
              <button
                className={index === activeIndex ? 'active' : ''}
                type="button"
                key={material.id}
                aria-label={`Buka materi ${index + 1}`}
                aria-current={index === activeIndex ? 'step' : undefined}
                onClick={() => changeMaterial(index)}
              />
            ))}
          </div>

          <div className="beginner-ebook-actions">
            {activeIndex > 0 && (
              <button
                className="beginner-ebook-button secondary"
                type="button"
                onClick={() => changeMaterial(activeIndex - 1)}
              >
                Materi Sebelumnya
              </button>
            )}

            {activeIndex < materials.length - 1 ? (
              <button className="beginner-ebook-button" type="button" onClick={() => changeMaterial(activeIndex + 1)}>
                Materi Selanjutnya
              </button>
            ) : (
              <a className="beginner-ebook-button" href="/tutorial#pilih-jalur-belajar">
                Selesaikan Materi
              </a>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
