import { useEffect, useMemo, useState } from 'react';
import tutorialDevice from '../assets/images/tutorial-device.png';
import apaItuArduflowImage from '../assets/images/apa itu arduflow.png';
import daftarAkunImage from '../assets/images/cara daftar untuk mendatkan akun.png';
import masukIdeImage from '../assets/images/cara masuk ke arduflow IDE.png';
import tokenIdeImage from '../assets/images/cara mendapatkan token IDE.png';
import belajarIotImage from '../assets/images/kenapa belajar IoT dengan visual.png';
import projectPertamaImage from '../assets/images/membuat project pertama.png';
import relayTutorialImage from '../assets/images/Kontrol Relay dengan Arduflow.jpg';
import boardTutorialImage from '../assets/images/Mengenal Board Arduino UNO.jpg';
import dhtTutorialImage from '../assets/images/Menggunakan Sensor DHT22.jpg';
import ledTutorialImage from '../assets/images/Menghubungkan LED ke Arduino.jpg';
import troubleshootingTutorialImage from '../assets/images/Troubleshooting Board Tidak Terdeteksi.jpg';
import { apiEndpoint } from '../services/apiEndpoints.js';


const TUTORIAL_API_URL = (
  apiEndpoint(import.meta.env.VITE_TUTORIAL_API_URL, '/api/')
).replace(/\/+$/, '');

const ARTICLE_API_URL =
  `${TUTORIAL_API_URL}/materi-api.php`;

function normalizeTutorialArticle(item = {}) {
  const cardImageUrl =
    item.card_image_url ||
    (item.card_image_name
      ? `${ARTICLE_API_URL}?action=image&scope=card&file=${encodeURIComponent(
          item.card_image_name
        )}`
      : '');

  return {
    id: item.id,
    title: item.title || '',
    slug: item.slug || '',
    category: item.category || '',
    displayOrder: Number(item.display_order || 0),

    shortDescription:
      item.short_description ||
      item.descriptions?.short_description ||
      '',

    fullDescription:
      item.full_description ||
      item.descriptions?.full_description ||
      '',

    cardImageUrl,

    difficulty:
      item.difficulty_level ||
      item.learning_information?.difficulty_level ||
      'Level Pemula',

    estimatedTime:
      item.estimated_time ||
      item.learning_information?.estimated_time ||
      '',

    pageOrder: Number(
      item.page_order ||
      item.page_settings?.page_order ||
      0
    ),

    status:
      item.status ||
      item.page_settings?.status ||
      'draft',

    active:
      item.active ??
      item.page_settings?.active ??
      true,

    showOnPage:
      item.show_on_page ??
      item.page_settings?.show_on_page ??
      true,

    featured:
      item.featured ??
      item.page_settings?.featured ??
      false,

    comments:
      item.comments ??
      item.page_settings?.comments ??
      true,

    accessType:
      item.access_type ||
      item.page_settings?.access_type ||
      'Gratis',

    featuredOrder:
      item.featured_order ??
      item.page_settings?.featured_order ??
      null,

    userLevel:
      item.user_level ||
      item.access_settings?.user_level ||
      'semua_pengguna',

    accessRequirement:
      item.access_requirement ||
      item.access_settings?.access_requirement ||
      '',

    prerequisite:
      item.prerequisite ||
      item.access_settings?.prerequisite ||
      '',

    ctaText:
      item.cta_text ||
      item.cta?.text ||
      '',

    targetLink:
      item.cta_target_link ||
      item.cta?.target_link ||
      '',

    urlSlug:
      item.cta_url_slug ||
      item.cta?.url_slug ||
      item.slug ||
      '',

    publishSchedule:
      item.publish_schedule ||
      item.cta?.publish_schedule ||
      null,

    slides: Array.isArray(item.slides)
      ? item.slides
      : [],

    totalSlides:
      Number(item.total_slides || item.slides?.length || 0),

    createdAt: item.created_at || '',
    updatedAt: item.updated_at || '',
  };
}

async function fetchTutorialArticles() {
  console.log('[Tutorial] GET:', ARTICLE_API_URL);

  const response = await fetch(ARTICLE_API_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const responseText = await response.text();

  console.log('[Tutorial] HTTP:', response.status);
  console.log(
    '[Tutorial] Response awal:',
    responseText.slice(0, 250)
  );

  let result;

  try {
    result = responseText
      ? JSON.parse(responseText)
      : {};
  } catch {
    throw new Error(
      `Response API bukan JSON. Endpoint: ${ARTICLE_API_URL}. Response: ${responseText.slice(
        0,
        160
      )}`
    );
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
      `API tutorial mengembalikan HTTP ${response.status}.`
    );
  }

  if (result.success === false) {
    throw new Error(
      result.message ||
      'Data materi tutorial gagal diambil.'
    );
  }

  const rows = Array.isArray(result.data)
    ? result.data
    : Array.isArray(result)
      ? result
      : [];

  return rows.map(normalizeTutorialArticle);
}

function isPublishedTutorial(tutorial) {
  const status = String(
    tutorial?.status || ''
  )
    .trim()
    .toLowerCase();

  return (
    status === 'published' &&
    tutorial?.active !== false &&
    tutorial?.showOnPage !== false
  );
}

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

const fallbackImages = [
  apaItuArduflowImage,
  belajarIotImage,
  daftarAkunImage,
  tokenIdeImage,
  masukIdeImage,
  projectPertamaImage,
  boardTutorialImage,
  ledTutorialImage,
  dhtTutorialImage,
  relayTutorialImage,
  troubleshootingTutorialImage,
];

const visualClasses = ['arduino', 'iot', 'akun', 'token', 'ide', 'project'];
const categoryIcons = ['book', 'settings', 'code', 'cpu', 'layers', 'help'];
const sortOptions = [
  { value: 'page-order', label: 'Page Order' },
  { value: 'title', label: 'Judul A-Z' },
  { value: 'latest', label: 'Terbaru' },
];

function categoryLabel(value) {
  return String(value || 'Umum')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function tutorialMeta(tutorial) {
  const access = tutorial.accessRequirement ? 'Butuh Akses' : 'Gratis';
  const timeOrSlides = tutorial.estimatedTime || `${tutorial.totalSlides || 0} slide`;

  return [timeOrSlides, tutorial.difficulty, access].filter(Boolean).join(' - ');
}

function sortTutorials(items) {
  return [...items].sort((a, b) => {
    const orderA = Number(a.pageOrder || a.displayOrder || 0);
    const orderB = Number(b.pageOrder || b.displayOrder || 0);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return String(a.title).localeCompare(String(b.title));
  });
}

function sortVisibleTutorials(items, sortMode) {
  return [...items].sort((a, b) => {
    if (sortMode === 'title') {
      return String(a.title).localeCompare(String(b.title));
    }

    if (sortMode === 'latest') {
      const dateA = Date.parse(a.updatedAt || a.createdAt || '') || 0;
      const dateB = Date.parse(b.updatedAt || b.createdAt || '') || 0;
      return dateB - dateA;
    }

    const orderA = Number(a.pageOrder || a.displayOrder || 0);
    const orderB = Number(b.pageOrder || b.displayOrder || 0);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return String(a.title).localeCompare(String(b.title));
  });
}

function tutorialImage(tutorial, index) {
  return tutorial?.cardImageUrl || fallbackImages[index % fallbackImages.length];
}

function tutorialTarget(tutorial) {
  const tutorialId = tutorial?.id || '';
  const tutorialSlug = tutorial?.slug || '';

  const params = new URLSearchParams();

  if (tutorialId) {
    params.set('id', String(tutorialId));
  }

  if (tutorialSlug) {
    params.set('slug', String(tutorialSlug));
  }

  const query = params.toString();

  return query
    ? `/tutorial/detail?${query}`
    : '/tutorial/detail';
}

export function Tutorial() {
  const [tutorials, setTutorials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLevel, setActiveLevel] = useState('all');
  const [sortMode, setSortMode] = useState('page-order');
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    let isMounted = true;

    fetchTutorialArticles()
      .then((items) => {
        if (!isMounted) {
          return;
        }

        setTutorials(sortTutorials(items.filter(isPublishedTutorial)));
        setError('');
      })
      .catch((fetchError) => {
        if (!isMounted) {
          return;
        }

        setTutorials([]);
        setError(fetchError.message || 'Gagal memuat materi tutorial.');
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

  const categoryOptions = useMemo(() => {
    const categories = Array.from(new Set(tutorials.map((tutorial) => tutorial.category).filter(Boolean)));

    return [
      { value: 'all', label: 'Semua Materi' },
      ...categories.map((category) => ({
        value: category,
        label: categoryLabel(category),
      })),
    ];
  }, [tutorials]);

  const levelOptions = useMemo(() => {
    const levels = Array.from(new Set(tutorials.map((tutorial) => tutorial.difficulty).filter(Boolean)));

    return ['Semua Level', ...levels];
  }, [tutorials]);

  const starterMaterials = useMemo(
    () =>
      tutorials.slice(0, 6).map((tutorial, index) => ({
        ...tutorial,
        image: tutorialImage(tutorial, index),
        meta: tutorialMeta(tutorial),
        visual: visualClasses[index % visualClasses.length],
      })),
    [tutorials],
  );

  const tutorialCategories = useMemo(() => {
    const counts = tutorials.reduce((summary, tutorial) => {
      const key = tutorial.category || 'Umum';
      summary.set(key, (summary.get(key) || 0) + 1);
      return summary;
    }, new Map());

    return Array.from(counts.entries()).map(([category, count], index) => ({
      icon: categoryIcons[index % categoryIcons.length],
      title: categoryLabel(category),
      count: `${count} Materi`,
      value: category,
    }));
  }, [tutorials]);

  const visibleTutorials = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    const selectedLevel = activeLevel === 'Semua Level' ? 'all' : activeLevel;

    const filtered = tutorials.filter((tutorial) => {
      const matchesCategory = activeCategory === 'all' || tutorial.category === activeCategory;
      const matchesLevel = selectedLevel === 'all' || tutorial.difficulty === selectedLevel;
      const matchesSearch =
        !keyword ||
        [tutorial.title, tutorial.shortDescription, tutorial.fullDescription, tutorial.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      return matchesCategory && matchesLevel && matchesSearch;
    });

    return sortVisibleTutorials(filtered, sortMode);
  }, [activeCategory, activeLevel, searchTerm, sortMode, tutorials]);

  return (
    <>
      <section className="tutorial-learning-hero" aria-labelledby="tutorial-learning-title">
        <div className="tutorial-learning-copy">
          <p className="tutorial-learning-eyebrow">Pusat Belajar Arduflow</p>
          <h1 id="tutorial-learning-title">
            <span>Belajar</span>
            <span>Arduflow</span>
            <span>Dari Dasar</span>
          </h1>
          <p>
            Pelajari dasar IoT, penggunaan Arduflow IDE, dan pembuatan proyek melalui panduan
            yang tersusun seperti workshop modern.
          </p>
          <form className="tutorial-search" role="search" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="tutorial-search-input">Cari materi tutorial</label>
            <input
              id="tutorial-search-input"
              name="tutorial-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari tutorial, proyek, atau panduan..."
            />
          </form>
          <div className="tutorial-learning-actions">
            <a className="tutorial-primary-action" href="#materi-tutorial">
              Mulai Belajar
            </a>
            <a className="tutorial-secondary-action" href="#materi-tutorial">
              Lihat Semua Materi
            </a>
          </div>
        </div>
        <div className="tutorial-device-scene">
          <img src={tutorialDevice} alt="Rangkaian IoT Arduflow di breadboard" />
        </div>
      </section>

      <section
        className="tutorial-path-section"
        id="pilih-jalur-belajar"
        aria-labelledby="tutorial-path-title"
      >
        <div className="tutorial-path-inner">
          <div className="tutorial-path-heading">
            <h2 id="tutorial-path-title">Pilih Jalur Belajarmu</h2>
            <p>Mulai dari materi yang sesuai dengan pengetahuan dan tujuan belajarmu.</p>
          </div>

          <div className="tutorial-path-cards">
            {learningPaths.map((path, index) => (
              <article className="tutorial-path-card" key={path.title}>
                <div className={`tutorial-path-icon ${path.icon}-icon`}>
                  <TutorialIcon type={path.icon} />
                </div>
                <h3>{path.title}</h3>
                <p>{path.text}</p>
                <a
                  href={
                    index === 0
                      ? '/tutorial/panduan-pemula'
                      : index === 1
                        ? '/tutorial/penggunaan-ide'
                        : index === 2
                          ? '/tutorial/dasar-hardware-iot'
                          : '#materi-tutorial'
                  }
                >
                  Pelajari
                </a>
              </article>
            ))}
          </div>

          <div className="tutorial-flow-heading">
            <h2>Alur Belajar yang Disarankan</h2>
            <p>
              Ikuti langkah bertahap untuk memahami Arduflow dari dasar hingga membuat Proyek
              lanjutan.
            </p>
          </div>

          <div className="tutorial-flow" aria-label="Alur belajar yang disarankan">
            {recommendedFlow.map((step, index) => (
              <div className="tutorial-flow-step" key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>

          <a className="tutorial-flow-button" href="#materi-tutorial">
            Lihat Jalur Lengkap
          </a>
        </div>
      </section>

      <section className="tutorial-material-section" id="materi-tutorial">
        <div className="tutorial-material-inner">
          <div className="tutorial-material-heading">
            <div>
              <h2>Mulai Dari Materi Ini</h2>
              <p>Rekomendasi materi penting untuk memulai belajar Arduflow.</p>
            </div>
            <a href="#semua-materi-tutorial">Lihat Semua Tutorial &gt;</a>
          </div>

          {isLoading && <p className="tutorial-data-state">Memuat materi tutorial...</p>}
          {error && <p className="tutorial-data-state">{error}</p>}
          {!isLoading && !error && starterMaterials.length === 0 && (
            <p className="tutorial-data-state">Belum ada materi tutorial yang dipublish.</p>
          )}

          <div className="starter-material-grid">
            {starterMaterials.map((material) => (
              <article className="starter-material-card" key={material.id}>
                <div className={`starter-material-visual ${material.visual}`}>
                  <img src={material.image} alt="" />
                  <span />
                </div>
                <div className="starter-material-content">
                  <h3>{material.title}</h3>
                  <p>{material.meta}</p>
                  <a href={tutorialTarget(material)}>Pelajari</a>
                </div>
              </article>
            ))}
          </div>

          <div className="tutorial-category-heading">
            <h2>Jelajahi Berdasarkan Kategori</h2>
            <p>Temukan materi sesuai kebutuhanmu.</p>
          </div>

          <div className="tutorial-category-grid">
            {tutorialCategories.map((category) => (
              <article className="tutorial-category-card" key={category.value}>
                <div className={`tutorial-category-icon ${category.icon}-icon`}>
                  <TutorialIcon type={category.icon} />
                </div>
                <div className="tutorial-category-label">
                  <h3>{category.title}</h3>
                  <p>{category.count}</p>
                </div>
                <a
                  href="#semua-materi-tutorial"
                  onClick={() => {
                    setActiveCategory(category.value);
                    setActiveLevel('Semua Level');
                  }}
                >
                  Pelajari
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="all-tutorial-section"
        id="semua-materi-tutorial"
        aria-labelledby="all-tutorial-title"
      >
        <div className="all-tutorial-inner">
          <h2 id="all-tutorial-title">Semua Materi Tutorial</h2>

          <div className="all-tutorial-controls" aria-label="Kontrol tampilan materi">
            <label className="all-tutorial-sort">
              <span>Urutkan</span>
              <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={viewMode === 'grid' ? 'is-active' : ''}
              aria-label="Tampilan grid"
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button
              type="button"
              className={viewMode === 'list' ? 'is-active' : ''}
              aria-label="Tampilan list"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>

          <aside className="tutorial-filter-panel" aria-label="Filter materi tutorial">
            <h3>Filter Materi</h3>
            <fieldset>
              <legend>Kategori</legend>
              {categoryOptions.map((option) => (
                <label key={option.value}>
                  <input
                    type="radio"
                    name="tutorial-category-filter"
                    checked={activeCategory === option.value}
                    onChange={() => setActiveCategory(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </fieldset>
            <fieldset>
              <legend>Level</legend>
              {levelOptions.map((level) => (
                <label key={level}>
                  <input
                    type="radio"
                    name="tutorial-level-filter"
                    checked={activeLevel === level}
                    onChange={() => setActiveLevel(level)}
                  />
                  <span>{level}</span>
                </label>
              ))}
            </fieldset>
          </aside>

          <div className={`all-tutorial-list is-${viewMode}`}>
            {!isLoading && !error && visibleTutorials.length === 0 && (
              <p className="tutorial-data-state">Materi tidak ditemukan.</p>
            )}

            {visibleTutorials.map((tutorial, index) => (
              <article className="all-tutorial-row" id={`materi-${tutorial.id}`} key={tutorial.id}>
                <div className={`all-tutorial-thumb ${visualClasses[index % visualClasses.length]}`}>
                  <img src={tutorialImage(tutorial, index)} alt="" />
                </div>
                <div className="all-tutorial-row-copy">
                  <p>{categoryLabel(tutorial.category)}</p>
                  <h3>{tutorial.title}</h3>
                  <span>{tutorialMeta(tutorial)}</span>
                </div>
                <a href={tutorialTarget(tutorial)}>Pelajari</a>
              </article>
            ))}
          </div>

          <button className="all-tutorial-load" type="button">
            {visibleTutorials.length} Materi Tampil
          </button>
        </div>
      </section>
    </>
  );
}
