import { useEffect, useMemo, useState } from 'react';
import { MaterialCard, MaterialEmptyState } from '../components/materials/MaterialCard.jsx';
import { fetchMaterial, fetchMaterials, isPublishedMaterial } from '../services/materialApi.js';
import { fetchProjectSubmissions, isPublicProject } from '../services/projectApi.js';
import fallbackTutorialImage from '../assets/images/tutorial-device.png';
import landingHeroMateriImage from '../assets/images/landing-hero-materi.png';
import projectFallbackImage from '../assets/images/project-hero-reference.png';

function getMaterialIdentifier() {
  const params = new URLSearchParams(window.location.search);
  const queryIdentifier = params.get('id') || params.get('slug');
  const segments = window.location.pathname.split('/').filter(Boolean);
  const lastSegment = segments.at(-1) || '';

  if (queryIdentifier) return queryIdentifier;
  if (lastSegment && lastSegment !== 'materi') return lastSegment;

  return '';
}

function getInitialSlideIndex() {
  const value = Number(new URLSearchParams(window.location.search).get('slide'));
  return Number.isFinite(value) && value > 0 ? value - 1 : 0;
}

function hasMaterialIdentifier() {
  return getMaterialIdentifier() !== '';
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function sanitizeHtml(value) {
  return String(value || '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
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

const topicCategories = [
  { key: 'IoT', icon: 'IoT', title: 'Dasar IoT', aliases: ['iot', 'dasar iot'] },
  { key: 'ArduFlow', icon: 'AF', title: 'ArduFlow IDE', aliases: ['arduflow', 'ide'] },
  { key: 'Arduino', icon: 'UNO', title: 'Arduino', aliases: ['arduino'] },
  { key: 'ESP32', icon: '32', title: 'ESP32', aliases: ['esp32'] },
  { key: 'Sensor', icon: 'SEN', title: 'Sensor & Aktuator', aliases: ['sensor', 'aktuator'] },
  { key: 'Visual Programming', icon: 'VP', title: 'Visual Programming', aliases: ['visual', 'programming'] },
  { key: 'MQTT', icon: 'MQ', title: 'WiFi & MQTT', aliases: ['wifi', 'mqtt'] },
  { key: 'Project', icon: 'PRJ', title: 'Project IoT', aliases: ['project', 'proyek'] },
];

const learningSteps = [
  ['01', 'Dasar IoT', 'Memahami konsep perangkat, sensor, data, dan konektivitas.', 'IoT'],
  ['02', 'Arduino & ESP32', 'Mengenal board mikrokontroler untuk eksperimen dan prototyping.', 'MCU'],
  ['03', 'Sensor & Aktuator', 'Membaca input dan mengontrol perangkat fisik secara bertahap.', 'IO'],
  ['04', 'ArduFlow', 'Menyusun logika program dengan visual programming ArduFlow.', 'AF'],
  ['05', 'WiFi & MQTT', 'Menghubungkan perangkat ke jaringan dan bertukar data IoT.', 'NET'],
  ['06', 'Project IoT', 'Menerapkan materi menjadi solusi IoT yang bisa diuji langsung.', 'PRJ'],
];

const practiceSteps = [
  ['01', 'Pelajari Konsep', 'Pelajari materi melalui teks, gambar, ilustrasi, dan video.', 'BOOK'],
  ['02', 'Susun Program', 'Bangun logika program menggunakan visual programming ArduFlow.', 'FLOW'],
  ['03', 'Praktik Hardware', 'Jalankan program pada Arduino, ESP32, sensor, dan perangkat IoT.', 'HW'],
];

const fallbackMaterials = [
  {
    id: 'fallback-iot',
    title: 'Mengenal Internet of Things',
    slug: 'mengenal-internet-of-things',
    category: 'IoT',
    difficulty: 'Pemula',
    shortDescription: 'Pelajari bagaimana perangkat fisik terhubung dan bertukar data melalui internet.',
    estimatedTime: '10 menit',
    totalSlides: 5,
    status: 'published',
    active: true,
    showOnPage: true,
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
  {
    id: 'fallback-arduflow',
    title: 'Mengenal ArduFlow',
    slug: 'mengenal-arduflow',
    category: 'ArduFlow',
    difficulty: 'Pemula',
    shortDescription: 'Kenali ArduFlow sebagai platform belajar IoT berbasis visual programming.',
    estimatedTime: '12 menit',
    totalSlides: 6,
    status: 'published',
    active: true,
    showOnPage: true,
    createdAt: '2026-08-02',
    updatedAt: '2026-08-02',
  },
  {
    id: 'fallback-arduino',
    title: 'Mengenal Board Arduino',
    slug: 'mengenal-board-arduino',
    category: 'Arduino',
    difficulty: 'Pemula',
    shortDescription: 'Pahami pin, input-output, dan cara kerja dasar board Arduino untuk project awal.',
    estimatedTime: '15 menit',
    totalSlides: 7,
    status: 'published',
    active: true,
    showOnPage: true,
    createdAt: '2026-08-03',
    updatedAt: '2026-08-03',
  },
  {
    id: 'fallback-first-program',
    title: 'Membuat Program Pertama dengan ArduFlow',
    slug: 'membuat-program-pertama-dengan-arduflow',
    category: 'Visual Programming',
    difficulty: 'Pemula',
    shortDescription: 'Susun alur program pertama dengan node visual dan pahami logika dasarnya.',
    estimatedTime: '18 menit',
    totalSlides: 8,
    status: 'published',
    active: true,
    showOnPage: true,
    createdAt: '2026-08-04',
    updatedAt: '2026-08-04',
  },
  {
    id: 'fallback-led',
    title: 'Menghubungkan LED dengan Arduino',
    slug: 'menghubungkan-led-dengan-arduino',
    category: 'Arduino',
    difficulty: 'Pemula',
    shortDescription: 'Mulai praktik output digital dengan rangkaian LED sederhana.',
    estimatedTime: '14 menit',
    totalSlides: 5,
    status: 'published',
    active: true,
    showOnPage: true,
    createdAt: '2026-08-05',
    updatedAt: '2026-08-05',
  },
  {
    id: 'fallback-dht',
    title: 'Membaca Sensor DHT11',
    slug: 'membaca-sensor-dht11',
    category: 'Sensor',
    difficulty: 'Menengah',
    shortDescription: 'Baca suhu dan kelembapan sebagai data awal untuk monitoring IoT.',
    estimatedTime: '20 menit',
    totalSlides: 6,
    status: 'published',
    active: true,
    showOnPage: true,
    createdAt: '2026-08-06',
    updatedAt: '2026-08-06',
  },
  {
    id: 'fallback-wifi',
    title: 'ESP32 Terhubung ke WiFi',
    slug: 'esp32-terhubung-ke-wifi',
    category: 'ESP32',
    difficulty: 'Menengah',
    shortDescription: 'Hubungkan ESP32 ke jaringan WiFi sebagai dasar komunikasi IoT.',
    estimatedTime: '18 menit',
    totalSlides: 6,
    status: 'published',
    active: true,
    showOnPage: true,
    createdAt: '2026-08-07',
    updatedAt: '2026-08-07',
  },
  {
    id: 'fallback-mqtt',
    title: 'Dasar MQTT untuk IoT',
    slug: 'dasar-mqtt-untuk-iot',
    category: 'MQTT',
    difficulty: 'Lanjutan',
    shortDescription: 'Pahami publish-subscribe dan pola komunikasi MQTT untuk perangkat IoT.',
    estimatedTime: '22 menit',
    totalSlides: 7,
    status: 'published',
    active: true,
    showOnPage: true,
    createdAt: '2026-08-08',
    updatedAt: '2026-08-08',
  },
];

const fallbackProjects = [
  ['Lampu Otomatis dengan LDR', 'Pemula', 'Arduino', '4 Komponen', 'Buat lampu yang menyala otomatis berdasarkan intensitas cahaya.'],
  ['Monitoring Suhu dengan DHT11', 'Pemula', 'Arduino', '5 Komponen', 'Pantau suhu dan kelembapan untuk project monitoring sederhana.'],
  ['Smart Lamp dengan ESP32', 'Menengah', 'ESP32', '4 Komponen', 'Buat sistem lampu pintar yang dapat dikontrol melalui jaringan.'],
  ['Monitoring IoT menggunakan MQTT', 'Lanjutan', 'ESP32', '6 Komponen', 'Kirim data sensor ke broker MQTT dan pantau dari dashboard.'],
  ['Sistem Penyiraman Tanaman Otomatis', 'Menengah', 'Arduino', '7 Komponen', 'Otomatisasi penyiraman tanaman berdasarkan kelembapan tanah.'],
  ['Monitoring Kelembapan Tanah', 'Pemula', 'ESP32', '4 Komponen', 'Baca kelembapan tanah dan tampilkan data untuk observasi tanaman.'],
];

function normalizeSearchText(value) {
  return String(value || '').toLowerCase();
}

function materialMatchesCategory(material, categoryKey) {
  if (categoryKey === 'all') return true;

  const category = normalizeSearchText(material.category);
  const title = normalizeSearchText(material.title);
  const description = normalizeSearchText(material.shortDescription || material.fullDescription || material.description);
  const topic = topicCategories.find((item) => item.key === categoryKey);
  const aliases = topic?.aliases || [categoryKey.toLowerCase()];

  return aliases.some((alias) => category.includes(alias) || title.includes(alias) || description.includes(alias));
}

function materialHref(material) {
  if (String(material.id || '').startsWith('fallback-')) return '/materi';
  const identifier = material?.slug || material?.id || '';

  return identifier ? `/materi/${identifier}` : '/materi';
}

function projectMetaText(value, fallback = '') {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    return String(value.name || value.title || value.label || value.specification || fallback || '').trim();
  }

  return fallback;
}

function projectComponentsLabel(project) {
  const directLabel = projectMetaText(project.tools?.[1]);
  if (directLabel) return directLabel;

  const totalTools = Array.isArray(project.tools) ? project.tools.length : 0;
  return `${totalTools || 4} Komponen`;
}

function sortMaterials(items) {
  return [...items].sort((a, b) => {
    const orderA = Number(a.pageOrder || a.displayOrder || 0);
    const orderB = Number(b.pageOrder || b.displayOrder || 0);

    if (orderA !== orderB) return orderA - orderB;

    return String(a.title).localeCompare(String(b.title));
  });
}

function sortNewest(items) {
  return [...items].sort((a, b) => {
    const dateA = Date.parse(a.updatedAt || a.createdAt || '') || 0;
    const dateB = Date.parse(b.updatedAt || b.createdAt || '') || 0;
    return dateB - dateA;
  });
}

function materialPopularityScore(material) {
  const title = normalizeSearchText(material.title);
  const topicScore = ['arduflow', 'led', 'dht', 'wifi', 'mqtt', 'esp32']
    .reduce((score, keyword, index) => score + (title.includes(keyword) ? 24 - index * 2 : 0), 0);
  const featuredScore = material.featured ? 80 : 0;
  const commentScore = Number(material.comments || 0) * 3;
  const slideScore = Math.min(Number(material.totalSlides || 0), 10);
  const orderScore = material.featuredOrder ? Math.max(24 - Number(material.featuredOrder), 0) : 0;

  return featuredScore + commentScore + slideScore + orderScore + topicScore;
}

function sortCatalog(items, sortMode) {
  if (sortMode === 'az') return [...items].sort((a, b) => String(a.title).localeCompare(String(b.title)));
  if (sortMode === 'popular') {
    return [...items].sort((a, b) => {
      const scoreDifference = materialPopularityScore(b) - materialPopularityScore(a);
      if (scoreDifference !== 0) return scoreDifference;

      return String(a.title).localeCompare(String(b.title));
    });
  }
  return sortNewest(items);
}

function MateriCatalog() {
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLevel, setActiveLevel] = useState('all');
  const [sortMode, setSortMode] = useState('newest');

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([fetchMaterials(), fetchProjectSubmissions()])
      .then(([materialResult, projectResult]) => {
        if (!isMounted) return;

        if (materialResult.status === 'fulfilled') {
          const publishedMaterials = sortMaterials(materialResult.value.filter(isPublishedMaterial));
          setMaterials(publishedMaterials.length ? publishedMaterials : fallbackMaterials);
          setError('');
        } else {
          setMaterials(fallbackMaterials);
          setError(materialResult.reason?.message || 'Gagal memuat materi dari database. Menampilkan materi contoh.');
        }

        if (projectResult.status === 'fulfilled') {
          setProjects(projectResult.value.filter(isPublicProject));
        } else {
          setProjects([]);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const levelOptions = useMemo(() => {
    const levels = Array.from(new Set(materials.map((material) => material.difficulty || material.level).filter(Boolean)));
    return ['all', ...levels];
  }, [materials]);

  const categoryCounts = useMemo(() => topicCategories.reduce((summary, category) => {
    summary[category.key] = materials.filter((material) => materialMatchesCategory(material, category.key)).length;
    return summary;
  }, {}), [materials]);

  const visibleMaterials = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    const filtered = materials.filter((material) => {
      const matchesCategory = materialMatchesCategory(material, activeCategory);
      const level = material.difficulty || material.level || '';
      const matchesLevel = activeLevel === 'all' || level === activeLevel;
      const matchesSearch =
        !keyword ||
        [material.title, material.shortDescription, material.fullDescription, material.category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));

      return matchesCategory && matchesLevel && matchesSearch;
    });

    return sortCatalog(filtered, sortMode);
  }, [activeCategory, activeLevel, materials, searchTerm, sortMode]);

  const starterMaterials = useMemo(() => {
    const preferred = ['Mengenal Internet of Things', 'Mengenal ArduFlow', 'Mengenal Board Arduino', 'Membuat Program Pertama dengan ArduFlow'];
    const selected = preferred
      .map((title) => materials.find((material) => String(material.title).toLowerCase().includes(title.toLowerCase())))
      .filter(Boolean);

    return [...selected, ...materials.filter((material) => (material.difficulty || material.level) === 'Pemula')]
      .filter((material, index, list) => list.findIndex((item) => item.id === material.id) === index)
      .slice(0, 4);
  }, [materials]);

  const popularMaterials = useMemo(() => {
    const preferredKeywords = ['arduflow ide', 'led', 'dht', 'wifi', 'mqtt'];
    const selected = preferredKeywords
      .map((keyword) => materials.find((material) => String(material.title).toLowerCase().includes(keyword)))
      .filter(Boolean);

    return [...selected, ...materials].filter((material, index, list) => (
      list.findIndex((item) => item.id === material.id) === index
    )).slice(0, 5);
  }, [materials]);

  const latestMaterials = useMemo(() => sortNewest(materials).slice(0, 3), [materials]);

  const projectCards = useMemo(() => {
    if (projects.length > 0) return projects.slice(0, 6);

    return fallbackProjects.map(([title, difficulty, board, components, description], index) => ({
      id: `fallback-project-${index + 1}`,
      title,
      difficulty,
      category: board,
      tools: [board, components],
      description,
      coverImageUrl: projectFallbackImage,
    }));
  }, [projects]);

  function chooseCategory(categoryKey) {
    setActiveCategory(categoryKey);
    document.getElementById('semua-materi')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section className="materi-page materi-catalog-page" aria-labelledby="materi-title">
      <header className="materi-landing-hero">
        <div className="materi-landing-inner">
          <div className="materi-landing-copy">
            <div className="landing-tag materi-landing-tag">LEARN. BUILD. PRACTICE.</div>
            <h1 id="materi-title">Pelajari IoT dengan Cara yang Lebih Mudah</h1>
            <p>
              Kumpulan materi IoT, Arduino, ArduFlow, sensor, visual programming, dan proyek untuk
              membantu kamu belajar dari dasar hingga praktik.
            </p>
            <div className="materi-landing-actions">
              <a className="landing-primary" href="#semua-materi">Mulai Belajar</a>
              <a className="landing-secondary" href="#semua-materi">Lihat Semua Materi</a>
            </div>
          </div>
          <div className="materi-landing-visual">
            <img src={landingHeroMateriImage} alt="Ilustrasi pembelajaran materi IoT Arduflow" />
          </div>
        </div>
      </header>

      <div className="materials-page-shell">
        <section className="materials-section" aria-labelledby="materials-topic-title">
          <div className="materials-section__head">
            <span className="materials-eyebrow">Topik Pembelajaran</span>
            <h2 id="materials-topic-title">Jelajahi Materi Berdasarkan Topik</h2>
            <p>Pilih topik yang ingin kamu pelajari dan mulai eksplorasi dunia IoT bersama ArduFlow.</p>
          </div>
          <div className="materials-category-grid">
            {topicCategories.map((category) => (
              <button
                className={activeCategory === category.key ? 'materials-category-card is-active' : 'materials-category-card'}
                type="button"
                key={category.key}
                onClick={() => chooseCategory(category.key)}
              >
                <span className="materials-category-card__icon">{category.icon}</span>
                <strong>{category.title}</strong>
                <small>{categoryCounts[category.key] || 0} Materi</small>
              </button>
            ))}
          </div>
        </section>

        <section className="materials-section materials-starter" aria-labelledby="materials-starter-title">
          <div className="materials-section__head">
            <span className="materials-eyebrow">Mulai dari Sini</span>
            <h2 id="materials-starter-title">Baru Mulai Belajar IoT?</h2>
            <p>Mulai dari materi dasar berikut dan pelajari IoT secara bertahap.</p>
          </div>
          <div className="materials-starter-grid">
            {starterMaterials.map((material) => (
              <MaterialCard className="materials-card--featured" href={materialHref(material)} material={material} key={material.id} />
            ))}
          </div>
        </section>

        <section className="materials-section materials-learning-path" aria-labelledby="materials-path-title">
          <div className="materials-section__head">
            <span className="materials-eyebrow">Roadmap</span>
            <h2 id="materials-path-title">Belajar IoT Secara Bertahap</h2>
            <p>Ikuti jalur pembelajaran dari konsep dasar hingga mampu membuat project IoT sendiri.</p>
          </div>
          <div className="materials-path-list">
            {learningSteps.map(([number, title, description, icon], index) => (
              <article className={index === 0 ? 'materials-path-node is-active' : 'materials-path-node'} key={number}>
                <span>{icon}</span>
                <strong>{number}</strong>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="materials-section materials-catalog" id="semua-materi" aria-labelledby="materials-catalog-title">
          <div className="materials-section__head materials-section__head--split">
            <div>
              <span className="materials-eyebrow">Katalog</span>
              <h2 id="materials-catalog-title">Semua Materi</h2>
              <p>Temukan materi yang sesuai dengan topik dan tingkat kemampuanmu.</p>
            </div>
            {error && <p className="materials-soft-warning">{error}</p>}
          </div>
          <div className="materials-catalog-controls">
            <label className="materials-search">
              <span>Cari materi</span>
              <input
                id="materi-search-input"
                name="materi-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari materi IoT, Arduino, ESP32, sensor..."
              />
            </label>
            <div className="materials-filter-row" aria-label="Filter kategori materi">
              <button className={activeCategory === 'all' ? 'is-active' : ''} type="button" onClick={() => setActiveCategory('all')}>Semua</button>
              {topicCategories.slice(0, 8).map((category) => (
                <button
                  className={activeCategory === category.key ? 'is-active' : ''}
                  type="button"
                  key={category.key}
                  onClick={() => setActiveCategory(category.key)}
                >
                  {category.key === 'Visual Programming' ? 'Visual' : category.key}
                </button>
              ))}
            </div>
            <div className="materials-select-row">
              <label>
                <span>Level</span>
                <select value={activeLevel} onChange={(event) => setActiveLevel(event.target.value)}>
                  {levelOptions.map((level) => (
                    <option value={level} key={level}>{level === 'all' ? 'Semua Level' : level}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Urutkan</span>
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
                  <option value="newest">Terbaru</option>
                  <option value="popular">Terpopuler</option>
                  <option value="az">A-Z</option>
                </select>
              </label>
            </div>
          </div>
          {isLoading ? (
            <p className="tutorial-data-state">Memuat materi dari database...</p>
          ) : visibleMaterials.length ? (
            <div className="materials-card-grid">
              {visibleMaterials.map((material) => (
                <MaterialCard href={materialHref(material)} material={material} key={material.id} />
              ))}
            </div>
          ) : (
            <MaterialEmptyState />
          )}
        </section>

        <section className="materials-section" aria-labelledby="materials-popular-title">
          <div className="materials-section__head">
            <span className="materials-eyebrow">Populer</span>
            <h2 id="materials-popular-title">Paling Banyak Dipelajari</h2>
            <p>Materi pilihan yang paling banyak dipelajari pengguna ArduFlow.</p>
          </div>
          <div className="materials-popular-grid">
            {popularMaterials.map((material) => (
              <MaterialCard badge="Populer" href={materialHref(material)} material={material} key={material.id} />
            ))}
          </div>
        </section>

        <section className="materials-section materials-practice" aria-labelledby="materials-practice-title">
          <div className="materials-section__head">
            <span className="materials-eyebrow">Praktik</span>
            <h2 id="materials-practice-title">Tidak Hanya Membaca, Langsung Praktik</h2>
            <p>Pelajari konsep, susun program, lalu terapkan langsung pada perangkat IoT.</p>
          </div>
          <div className="materials-practice-steps">
            {practiceSteps.map(([number, title, description, icon]) => (
              <article className="materials-practice-card" key={number}>
                <span>{icon}</span>
                <small>STEP {number}</small>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="materials-section" aria-labelledby="materials-project-title">
          <div className="materials-section__head">
            <span className="materials-eyebrow">Project IoT</span>
            <h2 id="materials-project-title">Praktikkan dengan Project IoT</h2>
            <p>Terapkan materi yang sudah kamu pelajari melalui project nyata.</p>
          </div>
          <div className="materials-project-grid">
            {projectCards.map((project) => (
              <article className="materials-project-card" key={project.id}>
                <img src={project.coverImageUrl || projectFallbackImage} alt={project.title} loading="lazy" />
                <div>
                  <span>{projectMetaText(project.difficulty, 'Pemula')}</span>
                  <h3>{project.title}</h3>
                  <small>{projectMetaText(project.category || project.tools?.[0], 'IoT')} • {projectComponentsLabel(project)}</small>
                  <p>{project.description}</p>
                  <a href={String(project.id).startsWith('fallback-project') ? '/project' : `/project/detail?id=${encodeURIComponent(project.id)}`}>
                    Lihat Project <span aria-hidden="true">-&gt;</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="materials-section" aria-labelledby="materials-latest-title">
          <div className="materials-section__head">
            <span className="materials-eyebrow">Update</span>
            <h2 id="materials-latest-title">Materi Terbaru</h2>
            <p>Materi terbaru untuk membantu kamu terus mengembangkan kemampuan IoT.</p>
          </div>
          <div className="materials-card-grid materials-card-grid--compact">
            {latestMaterials.map((material) => (
              <MaterialCard badge="NEW" href={materialHref(material)} material={material} key={material.id} />
            ))}
          </div>
        </section>

        <section className="materials-final-cta" aria-labelledby="materials-cta-title">
          <div>
            <span className="materials-eyebrow">Mulai Sekarang</span>
            <h2 id="materials-cta-title">Siap Mulai Belajar IoT?</h2>
            <p>Pelajari konsep, susun logika secara visual, dan praktikkan langsung menggunakan Arduino dan ESP32 bersama ArduFlow.</p>
          </div>
          <div className="materials-final-cta__actions">
            <a className="landing-primary" href="#semua-materi">Mulai Belajar</a>
            <a className="landing-secondary" href="/project">Jelajahi Project</a>
          </div>
        </section>
      </div>
    </section>
  );
}

export function Materi() {
  const [material, setMaterial] = useState(null);
  const [activeIndex, setActiveIndex] = useState(getInitialSlideIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const hasIdentifier = hasMaterialIdentifier();

  useEffect(() => {
    if (!hasIdentifier) {
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;
    const identifier = getMaterialIdentifier();

    setIsLoading(true);
    setError('');

    fetchMaterial(identifier)
      .then((item) => {
        if (!isMounted) return;

        if (!isPublishedMaterial(item)) {
          throw new Error('Materi belum dipublish.');
        }

        setMaterial(item);
      })
      .catch((fetchError) => {
        if (!isMounted) return;
        setMaterial(null);
        setError(fetchError.message || 'Gagal memuat materi.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [hasIdentifier]);

  if (!hasIdentifier) {
    return <MateriCatalog />;
  }

  const slides = useMemo(() => {
    if (!material) return [];

    const publishedSlides = material.slides.filter(isPublishedSlide);
    if (publishedSlides.length > 0) return publishedSlides;

    return [
      {
        id: `${material.id}-description`,
        order: 1,
        title: material.title,
        contentType: 'text',
        content: material.fullDescription || material.shortDescription,
        estimatedTime: material.estimatedTime,
        status: 'published',
        imageUrl: material.cardImageUrl,
        videoUrl: '',
      },
    ];
  }, [material]);

  const safeActiveIndex = Math.min(activeIndex, Math.max(slides.length - 1, 0));
  const activeSlide = slides[safeActiveIndex] || null;

  function changeSlide(nextIndex) {
    if (nextIndex < 0 || nextIndex >= slides.length) return;

    setActiveIndex(nextIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (isLoading || error || !material || !activeSlide) {
    return (
      <section className="materi-page" aria-labelledby="materi-title">
        <div className="materi-shell">
          <a className="materi-back" href="/materi">Kembali ke Materi</a>
          <div className="materi-state">
            <h1 id="materi-title">{isLoading ? 'Memuat Materi' : 'Materi Tidak Ditemukan'}</h1>
            <p>{isLoading ? 'Data materi sedang diambil dari materi-api.php.' : error || 'Materi tidak tersedia.'}</p>
          </div>
        </div>
      </section>
    );
  }

  const activeImage = activeSlide.imageUrl || material.cardImageUrl || fallbackTutorialImage;
  const contentHtml = sanitizeHtml(activeSlide.content);

  return (
    <section className="materi-page" aria-labelledby="materi-title">
      <div className="materi-shell">
        <a className="materi-back" href="/materi">Kembali ke Daftar Materi</a>

        <header className="materi-hero">
          <div>
            <p className="materi-eyebrow">{categoryLabel(material.category)}</p>
            <h1 id="materi-title">{material.title}</h1>
            <p>{material.shortDescription || stripHtml(material.fullDescription)}</p>
          </div>
          <img src={material.cardImageUrl || fallbackTutorialImage} alt={material.title} />
        </header>

        <article className="materi-reader">
          <aside className="materi-sidebar" aria-label="Daftar materi">
            <h2>Daftar Materi</h2>
            <div>
              {slides.map((slide, index) => (
                <button
                  className={index === safeActiveIndex ? 'is-active' : ''}
                  type="button"
                  key={slide.id}
                  onClick={() => changeSlide(index)}
                >
                  <span>{index + 1}</span>
                  <strong>{slide.title}</strong>
                </button>
              ))}
            </div>
          </aside>

          <main className="materi-content">
            <div className="materi-content-head">
              <span>{safeActiveIndex + 1}</span>
              <div>
                <h2>{activeSlide.title}</h2>
                <p>{activeSlide.estimatedTime || material.estimatedTime || 'Estimasi belum diatur'}</p>
              </div>
            </div>

            <div className="materi-content-grid">
              <div className="materi-rich-content">
                {contentHtml ? (
                  <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
                ) : (
                  <p>Konten materi belum tersedia.</p>
                )}
              </div>

              <div className="materi-media">
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

            <div className="materi-actions">
              <button
                className="materi-button secondary"
                type="button"
                disabled={safeActiveIndex === 0}
                onClick={() => changeSlide(safeActiveIndex - 1)}
              >
                Materi Sebelumnya
              </button>
              {safeActiveIndex < slides.length - 1 ? (
                <button className="materi-button" type="button" onClick={() => changeSlide(safeActiveIndex + 1)}>
                  Materi Selanjutnya
                </button>
              ) : (
                <a className="materi-button" href="/materi">Selesaikan Materi</a>
              )}
            </div>
          </main>
        </article>
      </div>
    </section>
  );
}
