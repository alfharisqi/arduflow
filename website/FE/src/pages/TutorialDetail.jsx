import { useEffect, useMemo, useState } from 'react';
import {
  fetchTutorialArticle,
  isPublishedTutorial,
} from '../services/materiApi.js';
import fallbackTutorialImage from '../assets/images/tutorial-device.png';
import '../styles/tutorial.css';

const DEPLOY_URL = (
  import.meta.env.VITE_DEPLOY_URL ||
  'https://arduflow.indobilliard.com/apk/uploads/web-arduflow-deploy-alfha'
).replace(/\/+$/, '');

const MATERI_IMAGE_BASE_URL = `${DEPLOY_URL}/uploads/materi`;

function resolveDetailMateriImage(value, fallbackFileName = '') {
  const candidate = String(value || fallbackFileName || '').trim();

  if (!candidate) {
    return '';
  }

  if (/^(data:image\/|blob:)/i.test(candidate)) {
    return candidate;
  }

  try {
    const parsed = new URL(candidate, window.location.origin);

    const queryFile = parsed.searchParams.get('file');

    if (queryFile) {
      const fileName = String(queryFile)
        .replace(/\\/g, '/')
        .split('/')
        .pop();

      if (fileName) {
        return `${MATERI_IMAGE_BASE_URL}/${encodeURIComponent(fileName)}`;
      }
    }

    if (parsed.pathname.includes('/uploads/materi/')) {
      return candidate;
    }

    const absoluteFileName = decodeURIComponent(parsed.pathname)
      .split('/')
      .pop();

    if (
      absoluteFileName &&
      /\.(png|jpe?g|webp|gif|svg)$/i.test(absoluteFileName)
    ) {
      return `${MATERI_IMAGE_BASE_URL}/${encodeURIComponent(
        absoluteFileName
      )}`;
    }
  } catch {
    // Bukan URL valid.
    // Lanjut diperlakukan sebagai path / nama file.
  }

  const normalized = candidate.replace(/\\/g, '/');
  const fileName = normalized.split('/').pop();

  if (
    !fileName ||
    !/\.(png|jpe?g|webp|gif|svg)$/i.test(fileName)
  ) {
    return '';
  }

  return `${MATERI_IMAGE_BASE_URL}/${encodeURIComponent(fileName)}`;
}

function getTutorialIdentifier() {
  const path = window.location.pathname.replace(/\/+$/, '');

  // URL baru:
  // /materi/mengenal-arduflow-visual-programming-untuk-membangun-proyek-iot
  if (path.startsWith('/materi/')) {
    const slug = path.slice('/materi/'.length);

    if (slug) {
      return decodeURIComponent(slug);
    }
  }

  // Tetap support URL lama:
  // /tutorial/detail?id=8&slug=...
  const params = new URLSearchParams(window.location.search);

  return params.get('slug') || params.get('id') || '';
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
  return {
    __html: html || '',
  };
}

function normalizeLearningObjectives(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item || '').trim())
        .filter(Boolean);
    }
  } catch {
    // Bukan JSON.
    // Lanjut pecah berdasarkan baris / semicolon.
  }

  return trimmed
    .split(/\r?\n|;/)
    .map((item) =>
      item
        .replace(/^[-•*\d.)\s]+/, '')
        .trim()
    )
    .filter(Boolean);
}

function safeStorageKeyPart(value) {
  return String(value ?? 'unknown').replace(
    /[^a-zA-Z0-9_-]/g,
    '-'
  );
}

function progressStorageKey(tutorialId) {
  return `arduflow:tutorial-progress:${safeStorageKeyPart(
    tutorialId
  )}`;
}

function bookmarkStorageKey(tutorialId) {
  return `arduflow:tutorial-bookmark:${safeStorageKeyPart(
    tutorialId
  )}`;
}

function isPublishedSlide(slide) {
  const status = String(slide?.status || '').toLowerCase();

  return (
    status === '' ||
    status === 'published' ||
    status === 'publish'
  );
}

function normalizeSlide(slide, tutorial, index) {
  return {
    ...slide,

    id:
      slide?.id ||
      `${tutorial.id}-slide-${index + 1}`,

    order:
      slide?.order ??
      index + 1,

    title:
      slide?.title ||
      `Materi ${index + 1}`,

    content:
      slide?.content ??
      slide?.bodyText ??
      slide?.body_text ??
      '',

    contentType:
      slide?.contentType ??
      slide?.content_type ??
      'text',

    estimatedTime:
      slide?.estimatedTime ??
      slide?.estimated_time ??
      tutorial?.estimatedTime ??
      tutorial?.estimated_time ??
      '',

    imageUrl: resolveDetailMateriImage(
      slide?.imageUrl ??
        slide?.image_url ??
        slide?.image_path ??
        '',
      slide?.imageName ??
        slide?.image_name ??
        ''
    ),

    videoUrl:
      slide?.videoUrl ??
      slide?.video_url ??
      '',

    status:
      slide?.status ||
      'published',

    chapterId:
      slide?.chapterId ??
      slide?.chapter_id ??
      null,

    codeTitle:
      slide?.codeTitle ??
      slide?.code_title ??
      '',

    codeLanguage:
      slide?.codeLanguage ??
      slide?.code_language ??
      'text',

    codeContent:
      slide?.codeContent ??
      slide?.code_content ??
      '',

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
        .map((slide, index) =>
          normalizeSlide(slide, tutorial, index)
        )
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

      content:
        tutorial.fullDescription ||
        tutorial.shortDescription ||
        '',

      estimatedTime:
        tutorial.estimatedTime ??
        tutorial.estimated_time ??
        '',

      status: 'published',

      imageUrl: resolveDetailMateriImage(
        tutorial.cardImageUrl ??
          tutorial.card_image_url ??
          tutorial.card_image_path ??
          '',
        tutorial.cardImageName ??
          tutorial.card_image_name ??
          ''
      ),

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

  if (!value) {
    return '';
  }

  try {
    const parsed = new URL(value);

    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      if (parsed.pathname.includes('/embed/')) {
        return value;
      }
    }

    if (parsed.hostname === 'youtu.be') {
      const videoId = parsed.pathname.replace(
        /^\/+/,
        ''
      );

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch {
    return value;
  }

  return value;
}

function Icon({
  name,
  size = 16,
}) {
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
    bookmark: (
      <path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.8L6 21V4.8Z" />
    ),

    bookmarkFilled: (
      <path
        d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.8L6 21V4.8Z"
        fill="currentColor"
      />
    ),

    clock: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="M12 7v5l3 2" />
      </>
    ),

    chevronRight: (
      <path d="m9 18 6-6-6-6" />
    ),

    chevronLeft: (
      <path d="m15 18-6-6 6-6" />
    ),

    chevronDown: (
      <path d="m7 10 5 5 5-5" />
    ),

    chevronUp: (
      <path d="m7 14 5-5 5 5" />
    ),

    check: (
      <path d="m5 12 4 4L19 6" />
    ),

    info: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    ),
  };

  return (
    <svg {...props}>
      {icons[name]}
    </svg>
  );
}

function ProgressBar({
  value,
}) {
  const safeValue = Math.max(
    0,
    Math.min(
      100,
      Number(value) || 0
    )
  );

  return (
    <div
      className="tutorial-material-progress-track"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={safeValue}
    >
      <span
        style={{
          width: `${safeValue}%`,
        }}
      />
    </div>
  );
}

function SlideMedia({
  slide,
  fallbackImage,
}) {
  const contentType = String(
    slide?.contentType || ''
  ).toLowerCase();

  const videoUrl = toEmbedVideoUrl(
    slide?.videoUrl
  );

  const imageUrl =
    resolveDetailMateriImage(
      slide?.imageUrl ||
        slide?.image_url ||
        slide?.image_path ||
        '',
      slide?.imageName ||
        slide?.image_name ||
        ''
    ) ||
    fallbackImage;

  if (
    contentType === 'video' &&
    videoUrl
  ) {
    const directVideo =
      /\.(mp4|webm|ogg)(\?.*)?$/i.test(
        videoUrl
      );

    return (
      <div className="tutorial-material-media">
        {directVideo ? (
          <video
            src={videoUrl}
            controls
            preload="metadata"
          />
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

  if (!shouldShowImage) {
    return null;
  }

  return (
    <div className="tutorial-material-media">
      <img
        src={imageUrl}
        alt={
          slide?.title ||
          'Materi Arduflow'
        }
        loading="lazy"
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src =
            fallbackImage;
        }}
      />
    </div>
  );
}

function CodeSlide({
  slide,
}) {
  const [copied, setCopied] =
    useState(false);

  const copyCode = async () => {
    if (!slide?.codeContent) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        slide.codeContent
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch (error) {
      console.error(
        'Gagal menyalin code:',
        error
      );
    }
  };

  return (
    <section className="tutorial-code-block">
      <div className="tutorial-code-block-head">
        <div>
          <strong>
            {slide.codeTitle ||
              slide.title ||
              'Code'}
          </strong>

          <span>
            {slide.codeLanguage ||
              'text'}
          </span>
        </div>

        {slide.allowCopy !== false && (
          <button
            type="button"
            onClick={copyCode}
          >
            {copied
              ? 'Tersalin ✓'
              : 'Salin'}
          </button>
        )}
      </div>

      <pre>
        <code>
          {slide.codeContent ||
            '// Code belum tersedia'}
        </code>
      </pre>
    </section>
  );
}

function LoadingState() {
  return (
    <main className="tutorial-material-page">
      <div className="tutorial-material-shell">
        <section className="tutorial-material-state">
          <span
            className="tutorial-material-spinner"
            aria-hidden="true"
          />

          <h1>
            Memuat Tutorial
          </h1>

          <p>
            Data materi sedang diambil
            dari materi-api.php.
          </p>
        </section>
      </div>
    </main>
  );
}

function ErrorState({
  error,
}) {
  return (
    <main className="tutorial-material-page">
      <div className="tutorial-material-shell">
        <section className="tutorial-material-state">
          <h1>
            Tutorial Tidak Ditemukan
          </h1>

          <p>
            {error ||
              'Materi tutorial tidak tersedia.'}
          </p>

          <a
            className="tutorial-material-btn is-dark"
            href="/materi"
          >
            Kembali ke Materi
          </a>
        </section>
      </div>
    </main>
  );
}

export function TutorialDetail() {
  const [
    tutorial,
    setTutorial,
  ] = useState(null);

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const [
    showOverview,
    setShowOverview,
  ] = useState(true);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    isSaved,
    setIsSaved,
  ] = useState(false);

  const [
    isOutlineOpen,
    setIsOutlineOpen,
  ] = useState(true);

  const [
    completedSlideIds,
    setCompletedSlideIds,
  ] = useState([]);

  useEffect(() => {
    let isMounted = true;

    const identifier =
      getTutorialIdentifier();

    setIsLoading(true);

    fetchTutorialArticle(identifier)
      .then((item) => {
        if (!isMounted) {
          return;
        }

        if (
          !isPublishedTutorial(item)
        ) {
          throw new Error(
            'Materi tutorial belum dipublish.'
          );
        }

        setTutorial(item);
        setActiveIndex(0);
        setShowOverview(true);
        setError('');

        // Rapikan URL lama menjadi /materi/:slug
        // tanpa reload.
        const canonicalSlug =
          item.slug ||
          item.urlSlug ||
          item.url_slug ||
          '';

        if (
          canonicalSlug &&
          window.location.pathname ===
            '/tutorial/detail'
        ) {
          window.history.replaceState(
            {},
            '',
            `/materi/${encodeURIComponent(
              canonicalSlug
            )}`
          );
        }
      })
      .catch((fetchError) => {
        if (!isMounted) {
          return;
        }

        setTutorial(null);

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Gagal memuat detail tutorial.'
        );
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

    return buildSlides(tutorial);
  }, [tutorial]);

  const activeSlide =
    slides[activeIndex] ||
    slides[0] ||
    null;

  useEffect(() => {
    if (!tutorial?.id) {
      return;
    }

    try {
      const savedProgress =
        JSON.parse(
          localStorage.getItem(
            progressStorageKey(
              tutorial.id
            )
          ) || '[]'
        );

      setCompletedSlideIds(
        Array.isArray(savedProgress)
          ? savedProgress.map(
              (item) =>
                String(item)
            )
          : []
      );

      setIsSaved(
        localStorage.getItem(
          bookmarkStorageKey(
            tutorial.id
          )
        ) === '1'
      );
    } catch {
      setCompletedSlideIds([]);
    }
  }, [tutorial?.id]);

  const completedSlideSet =
    useMemo(
      () =>
        new Set(
          completedSlideIds.map(
            (item) =>
              String(item)
          )
        ),
      [completedSlideIds]
    );

  const completedCount =
    useMemo(
      () =>
        slides.filter((slide) =>
          completedSlideSet.has(
            String(slide.id)
          )
        ).length,
      [
        slides,
        completedSlideSet,
      ]
    );

  const progress = useMemo(() => {
    if (slides.length === 0) {
      return 0;
    }

    return Math.round(
      (completedCount /
        slides.length) *
        100
    );
  }, [
    completedCount,
    slides.length,
  ]);

  const relatedSlides =
    useMemo(
      () =>
        slides.slice(
          activeIndex + 1,
          activeIndex + 5
        ),
      [
        slides,
        activeIndex,
      ]
    );

  const learningObjectives =
    useMemo(
      () =>
        normalizeLearningObjectives(
          tutorial?.learningObjectives ??
            tutorial?.learning_objectives ??
            tutorial
              ?.learning_information
              ?.learning_objectives ??
            []
        ),
      [tutorial]
    );

  const chapterGroups =
    useMemo(() => {
      const sourceChapters =
        Array.isArray(
          tutorial?.chapters
        )
          ? tutorial.chapters
          : [];

      if (
        sourceChapters.length ===
        0
      ) {
        return [
          {
            id: 'default',
            title: 'Materi',
            order: 1,
            slides,
          },
        ];
      }

      const normalizedChapters =
        sourceChapters
          .map(
            (
              chapter,
              index
            ) => ({
              id:
                chapter.id ??
                chapter.chapter_id ??
                `chapter-${
                  index + 1
                }`,

              title:
                chapter.title ??
                chapter.chapter_title ??
                `Bab ${
                  index + 1
                }`,

              order: Number(
                chapter.order ??
                  chapter.chapter_order ??
                  index + 1
              ),
            })
          )
          .sort(
            (a, b) =>
              a.order -
              b.order
          );

      const groups =
        normalizedChapters.map(
          (chapter) => {
            const chapterSlides =
              slides.filter(
                (slide) => {
                  const slideChapterId =
                    slide.chapterId ??
                    slide.chapter_id ??
                    null;

                  return (
                    String(
                      slideChapterId
                    ) ===
                    String(
                      chapter.id
                    )
                  );
                }
              );

            return {
              ...chapter,
              slides:
                chapterSlides,
            };
          }
        );

      const assignedSlideIds =
        new Set(
          groups.flatMap(
            (group) =>
              group.slides.map(
                (slide) =>
                  String(
                    slide.id
                  )
              )
          )
        );

      const unassignedSlides =
        slides.filter(
          (slide) =>
            !assignedSlideIds.has(
              String(slide.id)
            )
        );

      if (
        unassignedSlides.length >
        0
      ) {
        groups.push({
          id: 'unassigned',
          title:
            'Materi Lainnya',
          order: 999,
          slides:
            unassignedSlides,
        });
      }

      return groups
        .sort(
          (
            first,
            second
          ) =>
            first.order -
            second.order
        )
        .filter(
          (group) =>
            group.slides
              .length > 0
        );
    }, [
      tutorial,
      slides,
    ]);

  const activeChapter =
    useMemo(() => {
      if (!activeSlide) {
        return null;
      }

      return (
        chapterGroups.find(
          (chapter) =>
            chapter.slides.some(
              (slide) =>
                String(
                  slide.id
                ) ===
                String(
                  activeSlide.id
                )
            )
        ) ||
        null
      );
    }, [
      chapterGroups,
      activeSlide,
    ]);

  const saveCompletedSlideIds = (
    nextIds
  ) => {
    const uniqueIds = [
      ...new Set(
        nextIds.map(
          (item) =>
            String(item)
        )
      ),
    ];

    setCompletedSlideIds(
      uniqueIds
    );

    if (tutorial?.id) {
      localStorage.setItem(
        progressStorageKey(
          tutorial.id
        ),
        JSON.stringify(
          uniqueIds
        )
      );
    }
  };

  const markSlideCompleted = (
    slideId
  ) => {
    if (
      slideId === null ||
      slideId === undefined
    ) {
      return;
    }

    const id =
      String(slideId);

    if (
      completedSlideSet.has(
        id
      )
    ) {
      return;
    }

    saveCompletedSlideIds([
      ...completedSlideIds,
      id,
    ]);
  };

  const toggleBookmark = () => {
    const nextValue =
      !isSaved;

    setIsSaved(nextValue);

    if (tutorial?.id) {
      localStorage.setItem(
        bookmarkStorageKey(
          tutorial.id
        ),
        nextValue
          ? '1'
          : '0'
      );
    }
  };

  const openOverview = () => {
    setShowOverview(true);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const changeSlide = (
    nextIndex
  ) => {
    if (
      nextIndex < 0 ||
      nextIndex >=
        slides.length
    ) {
      return;
    }

    setShowOverview(false);
    setActiveIndex(nextIndex);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const goToPreviousSlide =
    () => {
      if (
        activeIndex === 0
      ) {
        openOverview();
        return;
      }

      changeSlide(
        activeIndex - 1
      );
    };

  const goToNextSlide = () => {
    if (!activeSlide) {
      return;
    }

    markSlideCompleted(
      activeSlide.id
    );

    if (
      activeIndex <
      slides.length - 1
    ) {
      changeSlide(
        activeIndex + 1
      );
    }
  };

  /*
   * ================================
   * SELESAIKAN MATERI
   * ================================
   *
   * 1. Menandai materi terakhir selesai.
   * 2. Menyimpan progress ke localStorage.
   * 3. Kembali ke halaman /materi.
   */
  const finishTutorial = () => {
    if (activeSlide) {
      const currentId =
        String(
          activeSlide.id
        );

      const nextCompletedIds =
        completedSlideSet.has(
          currentId
        )
          ? completedSlideIds
          : [
              ...completedSlideIds,
              currentId,
            ];

      const uniqueIds = [
        ...new Set(
          nextCompletedIds.map(
            (item) =>
              String(item)
          )
        ),
      ];

      setCompletedSlideIds(
        uniqueIds
      );

      if (tutorial?.id) {
        localStorage.setItem(
          progressStorageKey(
            tutorial.id
          ),
          JSON.stringify(
            uniqueIds
          )
        );
      }
    }

    // Kembali ke halaman daftar materi.
    window.location.href =
      '/materi';
  };

  if (isLoading) {
    return (
      <LoadingState />
    );
  }

  if (
    error ||
    !tutorial ||
    !activeSlide
  ) {
    return (
      <ErrorState
        error={error}
      />
    );
  }

  const tutorialImage =
    resolveDetailMateriImage(
      tutorial.cardImageUrl ||
        tutorial.card_image_url ||
        tutorial.card_image_path ||
        '',
      tutorial.cardImageName ||
        tutorial.card_image_name ||
        ''
    ) ||
    fallbackTutorialImage;

  const difficulty =
    tutorial.difficulty ||
    tutorial.difficultyLevel ||
    tutorial.difficulty_level ||
    'Semua Level';

  const tutorialEstimatedTime =
    tutorial.estimatedTime ||
    tutorial.estimated_time ||
    tutorial
      .learning_information
      ?.estimated_time ||
    'Estimasi belum diatur';

  const duration =
    activeSlide.estimatedTime ||
    activeSlide.estimated_time ||
    tutorialEstimatedTime;

  const fullDescription =
    tutorial.fullDescription ||
    tutorial.full_description ||
    '';

  const shortDescription =
    tutorial.shortDescription ||
    tutorial.short_description ||
    tutorial.description ||
    '';

  const overviewTitle =
    tutorial.title ||
    activeSlide.title;

  const headerTitle =
    showOverview
      ? overviewTitle
      : activeChapter?.title ||
        activeSlide.title;

  return (
    <main className="tutorial-material-page">
      <div className="tutorial-material-shell">

        {/* =========================
            HEADER
        ========================== */}
        <section className="tutorial-material-header">
          <div className="tutorial-material-thumbnail">
            <img
              src={
                tutorialImage
              }
              alt={
                tutorial.title ||
                'Materi ArduFlow'
              }
              onError={(
                event
              ) => {
                event.currentTarget.onerror =
                  null;

                event.currentTarget.src =
                  fallbackTutorialImage;
              }}
            />
          </div>

          <div className="tutorial-material-identity">
            <span className="tutorial-material-eyebrow">
              {categoryLabel(
                tutorial.category
              )}
            </span>

            <h1>
              {headerTitle}
            </h1>
          </div>

          <div className="tutorial-material-header-actions">
            <div className="tutorial-material-header-progress">
              <span>
                Progress
              </span>

              <strong>
                {progress}%
              </strong>

              <ProgressBar
                value={
                  progress
                }
              />
            </div>

            <div className="tutorial-material-action-row">
              <button
                className={`tutorial-material-btn is-light ${
                  isSaved
                    ? 'is-saved'
                    : ''
                }`}
                type="button"
                onClick={
                  toggleBookmark
                }
              >
                <Icon
                  name={
                    isSaved
                      ? 'bookmarkFilled'
                      : 'bookmark'
                  }
                  size={14}
                />

                {isSaved
                  ? 'Tersimpan'
                  : 'Simpan'}
              </button>
            </div>
          </div>
        </section>

        {/* =========================
            LAYOUT
        ========================== */}
        <div className="tutorial-material-layout">

          {/* =======================
              MAIN CONTENT
          ======================== */}
          <article className="tutorial-material-main">

            {showOverview ? (
              <section className="tutorial-material-overview">

                {/* OVERVIEW HERO */}
                <header className="tutorial-material-overview-hero">
                  <span className="tutorial-material-overview-label">
                    Informasi Materi
                  </span>

                  <h2>
                    {overviewTitle}
                  </h2>

                  <p className="tutorial-material-overview-short">
                    {stripHtml(
                      shortDescription
                    ) ||
                      'Deskripsi singkat materi belum tersedia.'}
                  </p>

                  <div className="tutorial-material-overview-meta">

                    <article>
                      <span>
                        Level Materi
                      </span>

                      <strong>
                        {String(
                          difficulty
                        ).replace(
                          /^Level\s+/i,
                          ''
                        )}
                      </strong>
                    </article>

                    <article>
                      <span>
                        Estimasi Waktu
                      </span>

                      <strong>
                        {
                          tutorialEstimatedTime
                        }
                      </strong>
                    </article>

                    <article>
                      <span>
                        Total Materi
                      </span>

                      <strong>
                        {
                          slides.length
                        }{' '}
                        materi
                      </strong>
                    </article>

                  </div>
                </header>

                {/* DESKRIPSI */}
                <section className="tutorial-material-overview-section">
                  <div className="tutorial-material-overview-section-head">
                    <span>
                      01
                    </span>

                    <div>
                      <small>
                        Deskripsi
                      </small>

                      <h3>
                        Deskripsi
                        Lengkap
                      </h3>
                    </div>
                  </div>

                  {fullDescription ? (
                    <div
                      className="tutorial-material-rich tutorial-material-overview-description"
                      dangerouslySetInnerHTML={renderHtml(
                        fullDescription
                      )}
                    />
                  ) : (
                    <p className="tutorial-material-empty">
                      Deskripsi
                      lengkap
                      materi belum
                      tersedia.
                    </p>
                  )}
                </section>

                {/* TUJUAN PEMBELAJARAN */}
                <section className="tutorial-material-overview-section">
                  <div className="tutorial-material-overview-section-head">
                    <span>
                      02
                    </span>

                    <div>
                      <small>
                        Target
                        Belajar
                      </small>

                      <h3>
                        Tujuan
                        Pembelajaran
                      </h3>
                    </div>
                  </div>

                  {learningObjectives.length >
                  0 ? (
                    <ul className="tutorial-material-overview-objectives">
                      {learningObjectives.map(
                        (
                          objective,
                          index
                        ) => (
                          <li
                            key={`learning-objective-${index}`}
                          >
                            <span>
                              <Icon
                                name="check"
                                size={
                                  12
                                }
                              />
                            </span>

                            <p>
                              {
                                objective
                              }
                            </p>
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="tutorial-material-empty">
                      Tujuan
                      pembelajaran
                      belum
                      tersedia.
                    </p>
                  )}
                </section>

                {/* MULAI MATERI */}
                <div className="tutorial-material-overview-actions">
                  <button
                    className="tutorial-material-btn is-dark"
                    type="button"
                    onClick={() =>
                      changeSlide(
                        0
                      )
                    }
                  >
                    Mulai Materi

                    <Icon
                      name="chevronRight"
                      size={14}
                    />
                  </button>
                </div>

              </section>
            ) : (
              <>
                {/* =====================
                    KONTEN MATERI
                ====================== */}
                <section className="tutorial-material-content">
                  <h3>
                    {activeIndex +
                      1}
                    .{' '}
                    {
                      activeSlide.title
                    }
                  </h3>

                  {activeSlide.contentType ===
                  'code' ? (
                    <CodeSlide
                      slide={
                        activeSlide
                      }
                    />
                  ) : activeSlide.content ? (
                    <div
                      className="tutorial-material-rich"
                      dangerouslySetInnerHTML={renderHtml(
                        activeSlide.content
                      )}
                    />
                  ) : (
                    <p className="tutorial-material-empty">
                      Konten slide
                      belum
                      tersedia.
                    </p>
                  )}
                </section>

                {/* MEDIA */}
                {activeSlide.contentType !==
                  'code' && (
                  <SlideMedia
                    slide={
                      activeSlide
                    }
                    fallbackImage={
                      tutorialImage
                    }
                  />
                )}

                {/* INFO */}
                <aside className="tutorial-material-note">
                  <Icon
                    name="info"
                    size={18}
                  />

                  <div>
                    <strong>
                      Informasi
                      Materi
                    </strong>

                    <p>
                      Materi{' '}
                      {activeIndex +
                        1}{' '}
                      dari{' '}
                      {
                        slides.length
                      }
                      . Gunakan
                      daftar materi
                      di sebelah
                      kanan untuk
                      berpindah
                      materi.
                    </p>
                  </div>
                </aside>

                {/* =====================
                    NAVIGASI
                ====================== */}
                <nav
                  className="tutorial-material-navigation"
                  aria-label="Navigasi materi tutorial"
                >
                  <button
                    className="tutorial-material-btn is-light"
                    type="button"
                    onClick={
                      goToPreviousSlide
                    }
                  >
                    <Icon
                      name="chevronLeft"
                      size={14}
                    />

                    {activeIndex ===
                    0
                      ? 'Kembali ke Informasi Materi'
                      : 'Materi Sebelumnya'}
                  </button>

                  {activeIndex <
                  slides.length -
                    1 ? (
                    <button
                      className="tutorial-material-btn is-light"
                      type="button"
                      onClick={
                        goToNextSlide
                      }
                    >
                      Materi
                      Selanjutnya

                      <Icon
                        name="chevronRight"
                        size={
                          14
                        }
                      />
                    </button>
                  ) : (
                    <button
                      className="tutorial-material-btn is-dark"
                      type="button"
                      onClick={
                        finishTutorial
                      }
                    >
                      Selesaikan
                      Materi
                    </button>
                  )}
                </nav>

                {/* =====================
                    RELATED
                ====================== */}
                {relatedSlides.length >
                  0 && (
                  <section className="tutorial-material-related">
                    <h3>
                      Materi
                      Selanjutnya
                    </h3>

                    <div className="tutorial-material-related-grid">
                      {relatedSlides.map(
                        (
                          slide
                        ) => {
                          const index =
                            slides.findIndex(
                              (
                                item
                              ) =>
                                item.id ===
                                slide.id
                            );

                          return (
                            <button
                              key={
                                slide.id
                              }
                              type="button"
                              className="tutorial-material-related-card"
                              onClick={() =>
                                changeSlide(
                                  index
                                )
                              }
                            >
                              <strong>
                                {
                                  slide.title
                                }
                              </strong>

                              <span>
                                <Icon
                                  name="clock"
                                  size={
                                    12
                                  }
                                />

                                {slide.estimatedTime ||
                                  duration}
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  </section>
                )}
              </>
            )}
          </article>

          {/* =======================
              SIDEBAR
          ======================== */}
          <aside className="tutorial-material-sidebar">

            {/* PROGRESS */}
            <section className="tutorial-material-progress-card">
              <h2>
                Progress
                Belajar
              </h2>

              <strong>
                {progress}%
              </strong>

              <ProgressBar
                value={
                  progress
                }
              />

              <p>
                {completedCount}{' '}
                dari{' '}
                {slides.length}{' '}
                materi selesai
              </p>
            </section>

            {/* OUTLINE */}
            <section className="tutorial-material-outline">
              <div className="tutorial-material-outline-title">
                <h2>
                  Daftar Materi
                </h2>
              </div>

              <button
                className="tutorial-material-outline-toggle"
                type="button"
                aria-expanded={
                  isOutlineOpen
                }
                onClick={() =>
                  setIsOutlineOpen(
                    (
                      value
                    ) =>
                      !value
                  )
                }
              >
                <span>
                  {
                    tutorial.title
                  }
                </span>

                <Icon
                  name={
                    isOutlineOpen
                      ? 'chevronUp'
                      : 'chevronDown'
                  }
                  size={14}
                />
              </button>

              {isOutlineOpen && (
                <div className="tutorial-material-outline-list">

                  {/* INFORMASI MATERI */}
                  <button
                    type="button"
                    className={`tutorial-material-outline-item tutorial-material-outline-overview ${
                      showOverview
                        ? 'is-active'
                        : 'is-todo'
                    }`}
                    aria-current={
                      showOverview
                        ? 'step'
                        : undefined
                    }
                    onClick={
                      openOverview
                    }
                  >
                    <span className="tutorial-material-status-dot">
                      <Icon
                        name="info"
                        size={8}
                      />
                    </span>

                    <span>
                      Informasi
                      Materi
                    </span>
                  </button>

                  {/* BAB */}
                  {chapterGroups.map(
                    (
                      chapter,
                      chapterIndex
                    ) => (
                      <section
                        className="tutorial-material-chapter-group"
                        key={
                          chapter.id
                        }
                      >
                        <div className="tutorial-material-chapter-title">
                          <span>
                            Bab{' '}
                            {chapterIndex +
                              1}
                          </span>

                          <strong>
                            {
                              chapter.title
                            }
                          </strong>
                        </div>

                        <div className="tutorial-material-chapter-lessons">
                          {chapter.slides.map(
                            (
                              slide,
                              chapterSlideIndex
                            ) => {
                              const index =
                                slides.findIndex(
                                  (
                                    item
                                  ) =>
                                    String(
                                      item.id
                                    ) ===
                                    String(
                                      slide.id
                                    )
                                );

                              const state =
                                !showOverview &&
                                index ===
                                  activeIndex
                                  ? 'active'
                                  : completedSlideSet.has(
                                        String(
                                          slide.id
                                        )
                                      )
                                    ? 'done'
                                    : 'todo';

                              return (
                                <button
                                  key={
                                    slide.id
                                  }
                                  type="button"
                                  className={`tutorial-material-outline-item is-${state}`}
                                  aria-current={
                                    !showOverview &&
                                    index ===
                                      activeIndex
                                      ? 'step'
                                      : undefined
                                  }
                                  onClick={() =>
                                    changeSlide(
                                      index
                                    )
                                  }
                                >
                                  <span className="tutorial-material-status-dot">
                                    {state ===
                                    'done' ? (
                                      <Icon
                                        name="check"
                                        size={
                                          8
                                        }
                                      />
                                    ) : null}
                                  </span>

                                  <span>
                                    {chapterSlideIndex +
                                      1}
                                    .{' '}
                                    {
                                      slide.title
                                    }
                                  </span>
                                </button>
                              );
                            }
                          )}
                        </div>
                      </section>
                    )
                  )}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}