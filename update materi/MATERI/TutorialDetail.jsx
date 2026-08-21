import { useEffect, useMemo, useState } from 'react';
import { fetchTutorialArticle, isPublishedTutorial } from '../services/materiApi.js';
import fallbackTutorialImage from '../assets/images/tutorial-device.png';
import '../styles/tutorial-detail.css';

function getTutorialIdentifier() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id') || params.get('slug') || '';
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function categoryLabel(value) {
  return String(value || 'Umum')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderHtml(html) {
  return { __html: html || '' };
}

function safeStorageKeyPart(value) {
  return String(value ?? 'unknown').replace(/[^a-zA-Z0-9_-]/g, '-');
}

function progressStorageKey(tutorialId) {
  return `arduflow:tutorial-progress:${safeStorageKeyPart(tutorialId)}`;
}

function bookmarkStorageKey(tutorialId) {
  return `arduflow:tutorial-bookmark:${safeStorageKeyPart(tutorialId)}`;
}

function isPublishedSlide(slide) {
  const status = String(slide?.status || '').toLowerCase();
  return status === '' || status === 'published' || status === 'publish';
}

function normalizeSlide(slide, tutorial, index) {
  return {
    ...slide,
    id: slide?.id || `${tutorial.id}-slide-${index + 1}`,
    order: slide?.order ?? index + 1,
    title: slide?.title || `Materi ${index + 1}`,
    content: slide?.content ?? slide?.bodyText ?? slide?.body_text ?? '',
    contentType: slide?.contentType ?? slide?.content_type ?? 'text',
    estimatedTime:
      slide?.estimatedTime ??
      slide?.estimated_time ??
      tutorial?.estimatedTime ??
      tutorial?.estimated_time ??
      '',
    imageUrl: slide?.imageUrl ?? slide?.image_url ?? '',
    videoUrl: slide?.videoUrl ?? slide?.video_url ?? '',
    status: slide?.status || 'published',
    chapterId: slide?.chapterId ?? slide?.chapter_id ?? null,
    codeTitle: slide?.codeTitle ?? slide?.code_title ?? '',
    codeLanguage: slide?.codeLanguage ?? slide?.code_language ?? 'text',
    codeContent: slide?.codeContent ?? slide?.code_content ?? '',
    allowCopy:
      slide?.allowCopy === undefined
        ? slide?.allow_copy !== false
        : slide.allowCopy !== false,
  };
}

function buildSlides(tutorial) {
  const tutorialSlides = Array.isArray(tutorial?.slides)
    ? tutorial.slides
        .filter(isPublishedSlide)
        .map((slide, index) => normalizeSlide(slide, tutorial, index))
    : [];

  if (tutorialSlides.length > 0) {
    return tutorialSlides;
  }

  return [
    {
      id: `${tutorial.id}-description`,
      order: 1,
      title: tutorial.title,
      contentType: 'text',
      content: tutorial.fullDescription || tutorial.shortDescription || '',
      estimatedTime: tutorial.estimatedTime ?? tutorial.estimated_time ?? '',
      status: 'published',
      imageUrl: tutorial.cardImageUrl ?? tutorial.card_image_url ?? '',
      videoUrl: '',
      chapterId: null,
      codeTitle: '',
      codeLanguage: 'text',
      codeContent: '',
      allowCopy: true,
    },
  ];
}

function slideDescription(slide, tutorial) {
  const text = stripHtml(slide?.content);
  return (
    text.slice(0, 180) ||
    slide?.estimatedTime ||
    tutorial?.shortDescription ||
    'Materi tutorial dari data Arduflow.'
  );
}

function toEmbedVideoUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';

  try {
    const parsed = new URL(value);

    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      if (parsed.pathname.includes('/embed/')) return value;
    }

    if (parsed.hostname === 'youtu.be') {
      const videoId = parsed.pathname.replace(/^\/+/, '');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch {
    return value;
  }

  return value;
}

function Icon({ name, size = 16 }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  const icons = {
    bookmark: <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.8L6 21V4.8Z" />,
    bookmarkFilled: (
      <path
        d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.8L6 21V4.8Z"
        fill="currentColor"
      />
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    chevronRight: <path d="m9 18 6-6-6-6" />,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronDown: <path d="m7 10 5 5 5-5" />,
    chevronUp: <path d="m7 14 5-5 5 5" />,
    check: <path d="m5 12 4 4L19 6" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    ),
  };

  return <svg {...props}>{icons[name]}</svg>;
}

function ProgressBar({ value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div
      className="tutorial-material-progress-track"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={safeValue}
    >
      <span style={{ width: `${safeValue}%` }} />
    </div>
  );
}

function SlideMedia({ slide, fallbackImage }) {
  const contentType = String(slide?.contentType || '').toLowerCase();
  const videoUrl = toEmbedVideoUrl(slide?.videoUrl);
  const imageUrl = slide?.imageUrl || fallbackImage;

  if (contentType === 'video' && videoUrl) {
    const directVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl);

    return (
      <div className="tutorial-material-media">
        {directVideo ? (
          <video src={videoUrl} controls preload="metadata" />
        ) : (
          <iframe
            src={videoUrl}
            title={slide.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    );
  }

  const shouldShowImage =
    Boolean(slide?.imageUrl) ||
    contentType === 'image' ||
    contentType === 'text_image';

  if (!shouldShowImage) return null;

  return (
    <div className="tutorial-material-media">
      <img src={imageUrl} alt={slide?.title || 'Materi Arduflow'} loading="lazy" />
    </div>
  );
}


function CodeSlide({ slide }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    if (!slide?.codeContent) return;

    try {
      await navigator.clipboard.writeText(slide.codeContent);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error('Gagal menyalin code:', error);
    }
  };

  return (
    <section className="tutorial-code-block">
      <div className="tutorial-code-block-head">
        <div>
          <strong>{slide.codeTitle || slide.title || 'Code'}</strong>
          <span>{slide.codeLanguage || 'text'}</span>
        </div>

        {slide.allowCopy !== false && (
          <button type="button" onClick={copyCode}>
            {copied ? 'Tersalin ✓' : 'Salin'}
          </button>
        )}
      </div>

      <pre>
        <code>{slide.codeContent || '// Code belum tersedia'}</code>
      </pre>
    </section>
  );
}

function LoadingState() {
  return (
    <main className="tutorial-material-page">
      <div className="tutorial-material-shell">
        <section className="tutorial-material-state">
          <span className="tutorial-material-spinner" aria-hidden="true" />
          <h1>Memuat Tutorial</h1>
          <p>Data materi sedang diambil dari materi-api.php.</p>
        </section>
      </div>
    </main>
  );
}

function ErrorState({ error }) {
  return (
    <main className="tutorial-material-page">
      <div className="tutorial-material-shell">
        <section className="tutorial-material-state">
          <h1>Tutorial Tidak Ditemukan</h1>
          <p>{error || 'Materi tutorial tidak tersedia.'}</p>
          <a className="tutorial-material-btn is-dark" href="/tutorial">
            Kembali ke Tutorial
          </a>
        </section>
      </div>
    </main>
  );
}

export function TutorialDetail() {
  const [tutorial, setTutorial] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  const [completedSlideIds, setCompletedSlideIds] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const identifier = getTutorialIdentifier();

    setIsLoading(true);

    fetchTutorialArticle(identifier)
      .then((item) => {
        if (!isMounted) return;

        if (!isPublishedTutorial(item)) {
          throw new Error('Materi tutorial belum dipublish.');
        }

        setTutorial(item);
        setActiveIndex(0);
        setError('');
      })
      .catch((fetchError) => {
        if (!isMounted) return;

        setTutorial(null);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Gagal memuat detail tutorial.'
        );
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
    return buildSlides(tutorial);
  }, [tutorial]);

  const activeSlide = slides[activeIndex] || slides[0] || null;

  useEffect(() => {
    if (!tutorial?.id) return;

    try {
      const savedProgress = JSON.parse(
        localStorage.getItem(progressStorageKey(tutorial.id)) || '[]'
      );

      setCompletedSlideIds(
        Array.isArray(savedProgress)
          ? savedProgress.map((item) => String(item))
          : []
      );

      setIsSaved(
        localStorage.getItem(bookmarkStorageKey(tutorial.id)) === '1'
      );
    } catch {
      setCompletedSlideIds([]);
    }
  }, [tutorial?.id]);

  const completedSlideSet = useMemo(
    () => new Set(completedSlideIds.map((item) => String(item))),
    [completedSlideIds]
  );

  const completedCount = useMemo(
    () =>
      slides.filter((slide) =>
        completedSlideSet.has(String(slide.id))
      ).length,
    [slides, completedSlideSet]
  );

  const progress = useMemo(() => {
    if (slides.length === 0) return 0;
    return Math.round((completedCount / slides.length) * 100);
  }, [completedCount, slides.length]);

  const relatedSlides = useMemo(
    () => slides.slice(activeIndex + 1, activeIndex + 5),
    [slides, activeIndex]
  );

  const learningObjectives =
    tutorial?.learningObjectives ??
    tutorial?.learning_objectives ??
    tutorial?.learning_information?.learning_objectives ??
    [];

  const chapterGroups = useMemo(() => {

    const sourceChapters = Array.isArray(tutorial?.chapters)
      ? tutorial.chapters
      : [];

    if (sourceChapters.length === 0) {

      return [
        {
          id: 'default',
          title: 'Materi',
          order: 1,
          slides,
        },
      ];
    }

    const normalizedChapters = sourceChapters
      .map((chapter, index) => ({
        id:
          chapter.id ??
          chapter.chapter_id ??
          `chapter-${index + 1}`,

        title:
          chapter.title ??
          chapter.chapter_title ??
          `Bab ${index + 1}`,

        order: Number(
          chapter.order ??
          chapter.chapter_order ??
          index + 1
        ),
      }))
      .sort((a, b) => a.order - b.order);

    const groups = normalizedChapters.map((chapter) => {
      const chapterSlides = slides.filter((slide) => {
        const slideChapterId =
          slide.chapterId ??
          slide.chapter_id ??
          null;

        return (
          String(slideChapterId) ===
          String(chapter.id)
        );
      });

      return {
        ...chapter,
        slides: chapterSlides,
      };
    });

    const assignedSlideIds = new Set(
      groups.flatMap((group) =>
        group.slides.map((slide) =>
          String(slide.id)
        )
      )
    );

    const unassignedSlides = slides.filter(
      (slide) =>
        !assignedSlideIds.has(
          String(slide.id)
        )
    );

    if (unassignedSlides.length > 0) {
      groups.push({
        id: 'unassigned',
        title: 'Materi Lainnya',
        order: 999,
        slides: unassignedSlides,
      });
    }

    return groups
      .sort((first, second) => first.order - second.order)
      .filter((group) => group.slides.length > 0);
  }, [tutorial, slides]);

  const saveCompletedSlideIds = (nextIds) => {
    const uniqueIds = [...new Set(nextIds.map((item) => String(item)))];
    setCompletedSlideIds(uniqueIds);

    if (tutorial?.id) {
      localStorage.setItem(
        progressStorageKey(tutorial.id),
        JSON.stringify(uniqueIds)
      );
    }
  };

  const markSlideCompleted = (slideId) => {
    if (slideId === null || slideId === undefined) return;

    const id = String(slideId);

    if (completedSlideSet.has(id)) return;

    saveCompletedSlideIds([...completedSlideIds, id]);
  };

  const toggleBookmark = () => {
    const nextValue = !isSaved;
    setIsSaved(nextValue);

    if (tutorial?.id) {
      localStorage.setItem(
        bookmarkStorageKey(tutorial.id),
        nextValue ? '1' : '0'
      );
    }
  };

  const changeSlide = (nextIndex) => {
    if (nextIndex < 0 || nextIndex >= slides.length) return;

    setActiveIndex(nextIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToNextSlide = () => {
    if (!activeSlide) return;

    markSlideCompleted(activeSlide.id);

    if (activeIndex < slides.length - 1) {
      changeSlide(activeIndex + 1);
    }
  };

  const finishTutorial = () => {
    if (activeSlide) {
      markSlideCompleted(activeSlide.id);
    }

    window.location.href = '/tutorial';
  };

  if (isLoading) return <LoadingState />;

  if (error || !tutorial || !activeSlide) {
    return <ErrorState error={error} />;
  }

  const tutorialImage =
    tutorial.cardImageUrl ||
    tutorial.card_image_url ||
    fallbackTutorialImage;

  const difficulty =
    tutorial.difficulty ||
    tutorial.difficultyLevel ||
    tutorial.difficulty_level ||
    'Semua Level';

  const duration =
    activeSlide.estimatedTime ||
    tutorial.estimatedTime ||
    tutorial.estimated_time ||
    'Estimasi belum diatur';

  const fullDescription =
    tutorial.fullDescription ||
    tutorial.full_description ||
    '';

  return (
    <main className="tutorial-material-page">
      <div className="tutorial-material-shell">
        <section className="tutorial-material-header">
          <div className="tutorial-material-thumbnail">
            <img src={tutorialImage} alt="" />
          </div>

          <div className="tutorial-material-identity">
            <span className="tutorial-material-eyebrow">
              {categoryLabel(tutorial.category)}
            </span>

            <h1>{activeSlide.title}</h1>

            <div className="tutorial-material-meta">
              <span>{String(difficulty).replace(/^Level\s+/i, '')}</span>
              <span>
                <Icon name="clock" size={12} />
                {duration}
              </span>
            </div>
          </div>

          <div className="tutorial-material-header-actions">
            <div className="tutorial-material-header-progress">
              <span>Progress</span>
              <strong>{progress}%</strong>
              <ProgressBar value={progress} />
            </div>

            <div className="tutorial-material-action-row">
              <button
                className={`tutorial-material-btn is-light ${isSaved ? 'is-saved' : ''}`}
                type="button"
                onClick={toggleBookmark}
              >
                <Icon name={isSaved ? 'bookmarkFilled' : 'bookmark'} size={14} />
                {isSaved ? 'Tersimpan' : 'Simpan'}
              </button>

              <button
                className="tutorial-material-btn is-dark"
                type="button"
                disabled={activeIndex >= slides.length - 1}
                onClick={goToNextSlide}
              >
                Lanjut
                <Icon name="chevronRight" size={14} />
              </button>
            </div>
          </div>
        </section>

        <div className="tutorial-material-layout">
          <article className="tutorial-material-main">
            <header className="tutorial-material-intro">
              <h2>{activeSlide.title}</h2>
              <p>{slideDescription(activeSlide, tutorial)}</p>
            </header>


            {Array.isArray(learningObjectives) && learningObjectives.length > 0 && (
              <section className="tutorial-learning-objectives">
                <div className="tutorial-learning-objectives-head">
                  <span>◎</span>
                  <h3>Tujuan Pembelajaran</h3>
                </div>

                <ul>
                  {learningObjectives
                    .filter((objective) => String(objective || '').trim())
                    .map((objective, index) => (
                      <li key={`learning-objective-${index}`}>
                        <span>✓</span>
                        <p>{objective}</p>
                      </li>
                    ))}
                </ul>
              </section>
            )}

            {activeIndex === 0 && fullDescription && (
              <section className="tutorial-material-summary">
                <h3>◎ Ringkasan Materi</h3>
                <div
                  className="tutorial-material-rich"
                  dangerouslySetInnerHTML={renderHtml(fullDescription)}
                />
              </section>
            )}

            <section className="tutorial-material-content">
              <h3>
                {activeIndex + 1}. {activeSlide.title}
              </h3>

              {activeSlide.contentType === 'code' ? (
                <CodeSlide slide={activeSlide} />
              ) : activeSlide.content ? (
                <div
                  className="tutorial-material-rich"
                  dangerouslySetInnerHTML={renderHtml(activeSlide.content)}
                />
              ) : (
                <p className="tutorial-material-empty">
                  Konten slide belum tersedia.
                </p>
              )}
            </section>

            {activeSlide.contentType !== 'code' && (
              <SlideMedia slide={activeSlide} fallbackImage={tutorialImage} />
            )}

            <aside className="tutorial-material-note">
              <Icon name="info" size={18} />
              <div>
                <strong>Informasi Materi</strong>
                <p>
                  Materi {activeIndex + 1} dari {slides.length}. Gunakan daftar
                  materi di sebelah kanan untuk berpindah materi.
                </p>
              </div>
            </aside>

            <nav
              className="tutorial-material-navigation"
              aria-label="Navigasi materi tutorial"
            >
              <button
                className="tutorial-material-btn is-light"
                type="button"
                disabled={activeIndex === 0}
                onClick={() => changeSlide(activeIndex - 1)}
              >
                <Icon name="chevronLeft" size={14} />
                Materi Sebelumnya
              </button>

              {activeIndex < slides.length - 1 ? (
                <button
                  className="tutorial-material-btn is-light"
                  type="button"
                  onClick={goToNextSlide}
                >
                  Materi Selanjutnya
                  <Icon name="chevronRight" size={14} />
                </button>
              ) : (
                <button
                  className="tutorial-material-btn is-dark"
                  type="button"
                  onClick={finishTutorial}
                >
                  Selesaikan Materi
                </button>
              )}
            </nav>

            {relatedSlides.length > 0 && (
              <section className="tutorial-material-related">
                <h3>Materi Selanjutnya</h3>

                <div className="tutorial-material-related-grid">
                  {relatedSlides.map((slide) => {
                    const index = slides.findIndex((item) => item.id === slide.id);

                    return (
                      <button
                        key={slide.id}
                        type="button"
                        className="tutorial-material-related-card"
                        onClick={() => changeSlide(index)}
                      >
                        <strong>{slide.title}</strong>
                        <span>
                          <Icon name="clock" size={12} />
                          {slide.estimatedTime || duration}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </article>

          <aside className="tutorial-material-sidebar">
            <section className="tutorial-material-progress-card">
              <h2>Progress Belajar</h2>
              <strong>{progress}%</strong>
              <ProgressBar value={progress} />
              <p>
                {completedCount} dari {slides.length} materi selesai
              </p>
            </section>

            <section className="tutorial-material-outline">
              <div className="tutorial-material-outline-title">
                <h2>Daftar Materi</h2>
              </div>

              <button
                className="tutorial-material-outline-toggle"
                type="button"
                aria-expanded={isOutlineOpen}
                onClick={() => setIsOutlineOpen((value) => !value)}
              >
                <span>{tutorial.title}</span>
                <Icon
                  name={isOutlineOpen ? 'chevronUp' : 'chevronDown'}
                  size={14}
                />
              </button>

              {isOutlineOpen && (
                <div className="tutorial-material-outline-list">
                  {chapterGroups.map((chapter, chapterIndex) => (
                    <section
                      className="tutorial-material-chapter-group"
                      key={chapter.id}
                    >
                      <div className="tutorial-material-chapter-title">
                        <span>Bab {chapterIndex + 1}</span>
                        <strong>{chapter.title}</strong>
                      </div>

                      <div className="tutorial-material-chapter-lessons">
                        {chapter.slides.map((slide, chapterSlideIndex) => {
                          const index = slides.findIndex(
                            (item) => String(item.id) === String(slide.id)
                          );

                          const state =
                            index === activeIndex
                              ? 'active'
                              : completedSlideSet.has(String(slide.id))
                                ? 'done'
                                : 'todo';

                          return (
                            <button
                              key={slide.id}
                              type="button"
                              className={`tutorial-material-outline-item is-${state}`}
                              aria-current={index === activeIndex ? 'step' : undefined}
                              onClick={() => changeSlide(index)}
                            >
                              <span className="tutorial-material-status-dot">
                                {state === 'done' ? (
                                  <Icon name="check" size={8} />
                                ) : null}
                              </span>

                              <span>
                                {chapterSlideIndex + 1}. {slide.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </section>

            <section className="tutorial-material-continue">
              <h2>Lanjut Belajar</h2>
              <p>Teruskan perjalanan belajar Anda</p>

              {activeIndex < slides.length - 1 ? (
                <button
                  className="tutorial-material-btn is-dark is-full"
                  type="button"
                  onClick={goToNextSlide}
                >
                  Lanjutkan ke Materi Selanjutnya
                  <Icon name="chevronRight" size={14} />
                </button>
              ) : (
                <button
                  className="tutorial-material-btn is-dark is-full"
                  type="button"
                  onClick={finishTutorial}
                >
                  Selesaikan Materi
                </button>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}