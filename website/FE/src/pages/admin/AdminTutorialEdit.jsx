import { useEffect, useMemo, useState } from 'react';
import '../../styles/admin-tutorial-create.css';

const TUTORIAL_API_URL = (
  import.meta.env.VITE_TUTORIAL_API_URL ||
  'http://192.168.130.10:8000/api/'
).replace(/\/+$/, '');

const emptyForm = {
  title: '',
  slug: '',
  category: '',
  displayOrder: 1,
  shortDescription: '',
  fullDescription: '',
  difficultyLevel: 'Level Pemula',
  estimatedTime: '',
  pageOrder: 1,
  status: 'Draft',
  userLevel: 'Semua Pengguna',
  accessRequirement: '',
};

function normalizeStatus(value) {
  const status = String(value || '').toLowerCase();

  if (status === 'published') return 'Published';
  if (status === 'pending_review' || status === 'pending review') {
    return 'Pending Review';
  }

  return 'Draft';
}

function normalizeUserLevel(value) {
  const level = String(value || '').toLowerCase();

  if (level === 'member') return 'Member';
  if (level === 'admin') return 'Admin';

  return 'Semua Pengguna';
}

export function AdminTutorialEdit() {
  const tutorialId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }, []);

  const [formData, setFormData] = useState(emptyForm);
  const [slides, setSlides] = useState([]);
  const [tutorialRaw, setTutorialRaw] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  const [selectedSlideId, setSelectedSlideId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('asc');
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Semua Status');

  useEffect(() => {
    const loadTutorial = async () => {
      if (!tutorialId) {
        setLoadError('ID materi tidak ditemukan pada URL.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError('');

      try {
        const response = await fetch(`${TUTORIAL_API_URL}/article-api.php`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        const responseText = await response.text();

        let result;

        try {
          result = responseText ? JSON.parse(responseText) : {};
        } catch {
          throw new Error(
            `Response API bukan JSON yang valid: ${responseText.slice(0, 250)}`
          );
        }

        if (!response.ok || result.success === false) {
          throw new Error(
            result.message || `API mengembalikan HTTP ${response.status}.`
          );
        }

        const rows = Array.isArray(result.data) ? result.data : [];
        const tutorial = rows.find(
          (item) => String(item.id) === String(tutorialId)
        );

        if (!tutorial) {
          throw new Error(`Materi dengan ID ${tutorialId} tidak ditemukan.`);
        }

        setTutorialRaw(tutorial);
        const tutorialSlides = Array.isArray(tutorial.slides)
          ? tutorial.slides
          : [];
        setSlides(tutorialSlides);
        setSelectedSlideId(tutorialSlides[0]?.id || null);

        setFormData({
          title: tutorial.title || '',
          slug: tutorial.slug || '',
          category: tutorial.category || '',
          displayOrder: Number(tutorial.display_order || 1),
          shortDescription: tutorial.short_description || '',
          fullDescription: tutorial.full_description || '',
          difficultyLevel: tutorial.difficulty_level || 'Level Pemula',
          estimatedTime: tutorial.estimated_time || '',
          pageOrder: Number(tutorial.page_order || 1),
          status: normalizeStatus(tutorial.status),
          userLevel: normalizeUserLevel(tutorial.user_level),
          accessRequirement: tutorial.access_requirement || '',
        });

        console.group('DEBUG EDIT MATERI SQLITE');
        console.log('ID:', tutorialId);
        console.log('Endpoint:', `${TUTORIAL_API_URL}/article-api.php`);
        console.log('Data materi:', tutorial);
        console.groupEnd();
      } catch (error) {
        console.error('Gagal memuat materi untuk edit:', error);
        setLoadError(
          error.message || 'Data materi tidak dapat diambil dari SQLite.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadTutorial();
  }, [tutorialId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const selectedSlide =
    slides.find((slide) => String(slide.id) === String(selectedSlideId)) ||
    slides[0] ||
    null;

  const filteredSlides = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return [...slides]
      .filter((slide) => {
        const title = String(slide.title || '').toLowerCase();
        const status = normalizeStatus(slide.status);
        const matchesSearch = normalizedQuery
          ? title.includes(normalizedQuery)
          : true;
        const matchesStatus =
          statusFilter === 'Semua Status' || status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((firstSlide, secondSlide) => {
        const firstOrder = Number(firstSlide.order || 0);
        const secondOrder = Number(secondSlide.order || 0);
        return sortMode === 'asc'
          ? firstOrder - secondOrder
          : secondOrder - firstOrder;
      });
  }, [searchQuery, slides, sortMode, statusFilter]);

  const materialStatistics = useMemo(() => {
    const draftCount = slides.filter(
      (slide) => normalizeStatus(slide.status) === 'Draft'
    ).length;
    const publishedCount = slides.filter(
      (slide) => normalizeStatus(slide.status) === 'Published'
    ).length;

    return [
      ['Total Materi', String(slides.length)],
      ['Draft', String(draftCount)],
      ['Published', String(publishedCount)],
      ['Total Estimasi Waktu', formData.estimatedTime || '-'],
    ];
  }, [formData.estimatedTime, slides]);

  const goToStep = (stepNumber) => {
    setActiveStep(stepNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addSlide = () => {
    const newSlide = {
      id: `new-${Date.now()}`,
      order: slides.length + 1,
      title: `Slide ${slides.length + 1}`,
      content_type: 'text_image',
      content: '',
      image_name: null,
      video_url: null,
      status: 'draft',
    };

    setSlides((previousSlides) => [
      ...previousSlides,
      newSlide,
    ]);
    setSelectedSlideId(newSlide.id);
  };

  const renameSlide = (slideIndex) => {
    const slide = slides[slideIndex];
    const currentTitle = slide?.title || `Slide ${slideIndex + 1}`;
    const nextTitle = window.prompt('Ubah judul materi:', currentTitle);

    if (!nextTitle?.trim()) {
      return;
    }

    setSlides((previousSlides) =>
      previousSlides.map((item, index) =>
        index === slideIndex ? { ...item, title: nextTitle.trim() } : item
      )
    );
  };

  const removeSlide = (slideIndex) => {
    const slide = slides[slideIndex];
    const slideTitle = slide?.title || `Slide ${slideIndex + 1}`;
    const confirmed = window.confirm(`Hapus "${slideTitle}" dari daftar materi?`);

    if (!confirmed) {
      return;
    }

    setSlides((previousSlides) => {
      const updatedSlides = previousSlides
        .filter((_, index) => index !== slideIndex)
        .map((item, index) => ({ ...item, order: index + 1 }));

      setSelectedSlideId((current) => {
        if (current && String(current) !== String(slide?.id)) {
          return current;
        }

        return updatedSlides[0]?.id || null;
      });

      return updatedSlides;
    });
  };

  const createUpdatePayload = () => {
    return {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      category: formData.category,
      display_order: Number(formData.displayOrder),

      descriptions: {
        short_description: formData.shortDescription.trim(),
        full_description: formData.fullDescription.trim(),
      },

      learning_information: {
        difficulty_level: formData.difficultyLevel,
        estimated_time: formData.estimatedTime.trim(),
      },

      page_settings: {
        page_order: Number(formData.pageOrder),
        status: formData.status
          .toLowerCase()
          .replace(/\s+/g, '_'),
      },

      access_settings: {
        user_level: formData.userLevel
          .toLowerCase()
          .replace(/\s+/g, '_'),
        access_requirement:
          formData.accessRequirement.trim() || null,
      },

      slides: slides.map((slide, index) => ({
        id: slide.id ?? null,
        order: Number(slide.order || index + 1),
        title: slide.title || `Slide ${index + 1}`,
        content_type:
          slide.content_type || slide.contentType || 'text',
        content: slide.content ?? null,
        image_name: slide.image_name ?? null,
        video_url: slide.video_url ?? null,
      })),
    };
  };

  const validateEditForm = () => {
    if (!formData.title.trim()) return 'Judul materi wajib diisi.';
    if (!formData.slug.trim()) return 'Slug wajib diisi.';
    if (!formData.category) return 'Kategori wajib dipilih.';
    if (Number(formData.displayOrder) < 1) {
      return 'Urutan tampil minimal 1.';
    }
    if (!formData.shortDescription.trim()) {
      return 'Deskripsi singkat wajib diisi.';
    }
    if (!formData.fullDescription.trim()) {
      return 'Deskripsi lengkap wajib diisi.';
    }
    if (Number(formData.pageOrder) < 1) {
      return 'Urutan tampil di halaman minimal 1.';
    }
    if (slides.length === 0) {
      return 'Materi harus memiliki minimal satu slide.';
    }

    return '';
  };

  const handleSave = async () => {
    const validationMessage = validateEditForm();

    if (validationMessage) {
      setSaveStatus('error');
      setSaveMessage(validationMessage);
      return;
    }

    const payload = createUpdatePayload();

    setIsSaving(true);
    setSaveStatus('idle');
    setSaveMessage('');

    console.group('DEBUG UPDATE MATERI SQLITE');
    console.log('Method:', 'PUT');
    console.log(
      'Endpoint:',
      `${TUTORIAL_API_URL}/article-api.php?id=${tutorialId}`
    );
    console.log('Request JSON:', payload);

    try {
      const response = await fetch(
        `${TUTORIAL_API_URL}/article-api.php?id=${encodeURIComponent(
          tutorialId
        )}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text();

      let result;

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Response API bukan JSON yang valid: ${responseText.slice(
            0,
            250
          )}`
        );
      }

      console.log('Response:', result);

      if (!response.ok || result.success === false) {
        setSaveStatus('error');
        setSaveMessage(
          result.message || 'Perubahan materi gagal disimpan.'
        );
        return;
      }

      setSaveStatus('success');
      setSaveMessage(
        result.message || 'Materi berhasil diperbarui.'
      );

      setTutorialRaw((previous) => ({
        ...(previous || {}),
        ...result.data,
        title: payload.title,
        slug: payload.slug,
        category: payload.category,
        display_order: payload.display_order,
        short_description:
          payload.descriptions.short_description,
        full_description:
          payload.descriptions.full_description,
        difficulty_level:
          payload.learning_information.difficulty_level,
        estimated_time:
          payload.learning_information.estimated_time,
        page_order: payload.page_settings.page_order,
        status: payload.page_settings.status,
        user_level: payload.access_settings.user_level,
        access_requirement:
          payload.access_settings.access_requirement,
        slides: payload.slides,
      }));
    } catch (error) {
      console.error('Gagal memperbarui materi:', error);

      setSaveStatus('error');
      setSaveMessage(
        `Tidak dapat menyimpan perubahan: ${error.message}`
      );
    } finally {
      setIsSaving(false);
      console.groupEnd();
    }
  };

  const handleBack = () => {
    window.location.href = '/admin/tutorial';
  };

  const renderSteps = () => (
    <nav className="admin-tutorial-create-steps" aria-label="Tahapan edit materi">
      {[
        ['1', 'Informasi Materi', 'Detail utama materi'],
        ['2', 'Daftar Materi / Slide', 'Edit urutan materi'],
        ['3', 'Pengaturan', 'Status & akses'],
      ].map((step, index) => {
        const stepNumber = index + 1;

        return (
          <button
            className={activeStep === stepNumber ? 'is-active' : ''}
            key={step[1]}
            type="button"
            onClick={() => goToStep(stepNumber)}
          >
            <span>{step[0]}</span>
            <div>
              <strong>{step[1]}</strong>
              <small>{step[2]}</small>
            </div>
          </button>
        );
      })}
    </nav>
  );

  const renderMaterialsStep = () => (
    <section className="admin-tutorial-edit-wide">
      <div className="admin-materials-layout">
        <section className="admin-materials-main">
          <div className="admin-materials-toolbar">
            <button type="button" onClick={addSlide}>+ Tambah Materi</button>
            <button type="button" onClick={() => setShowFilter((value) => !value)}>
              Filter
            </button>
            <label>
              <span aria-hidden="true">o</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari materi..."
              />
            </label>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
              aria-label="Urutkan materi"
            >
              <option value="asc">Urutkan: Urutan (Naik)</option>
              <option value="desc">Urutkan: Urutan (Turun)</option>
            </select>
          </div>

          {showFilter && (
            <div className="admin-materials-filter">
              <label>
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option>Semua Status</option>
                  <option>Published</option>
                  <option>Draft</option>
                  <option>Pending Review</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('Semua Status');
                  setSortMode('asc');
                }}
              >
                Reset Filter
              </button>
            </div>
          )}

          <section className="admin-materials-table-card">
            <div className="admin-materials-table-head">
              <span>NO</span>
              <span>Judul Materi</span>
              <span>Tipe Konten</span>
              <span>Estimasi Waktu</span>
              <span>Status</span>
              <span>Aksi</span>
            </div>
            <div className="admin-materials-table-body">
              {filteredSlides.map((slide, index) => (
                <article
                  className={
                    String(selectedSlide?.id) === String(slide.id)
                      ? 'is-selected'
                      : ''
                  }
                  key={slide.id || `${tutorialId}-${index}`}
                  onClick={() => setSelectedSlideId(slide.id)}
                >
                  <button
                    type="button"
                    className="admin-materials-row-handle"
                    aria-label={`Pilih ${slide.title || `Slide ${index + 1}`}`}
                  >
                    ::
                  </button>
                  <strong>{slide.order || index + 1}</strong>
                  <span>{slide.title || `Slide ${index + 1}`}</span>
                  <span>[] {slide.content_type || slide.contentType || 'text'}</span>
                  <span>o {formData.estimatedTime || '-'}</span>
                  <button
                    type="button"
                    className={`admin-materials-status ${
                      normalizeStatus(slide.status) === 'Published'
                        ? 'is-published'
                        : 'is-draft'
                    }`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {normalizeStatus(slide.status)}
                  </button>
                  <div className="admin-materials-actions">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        renameSlide(
                          slides.findIndex(
                            (item) => String(item.id) === String(slide.id)
                          )
                        );
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        const clone = {
                          ...slide,
                          id: `copy-${Date.now()}`,
                          title: `${slide.title || `Slide ${index + 1}`} Copy`,
                          order: slides.length + 1,
                          status: 'draft',
                        };
                        setSlides((previousSlides) => [...previousSlides, clone]);
                        setSelectedSlideId(clone.id);
                      }}
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeSlide(
                          slides.findIndex(
                            (item) => String(item.id) === String(slide.id)
                          )
                        );
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <p className="admin-materials-tip">
            i Tips: Drag & drop pada ikon titik untuk mengubah urutan materi.
          </p>

          <div className="admin-materials-stats">
            {materialStatistics.map((item) => (
              <article key={item[0]}>
                <span>{item[0]}</span>
                <strong>{item[1]}</strong>
              </article>
            ))}
          </div>
        </section>

        <aside className="admin-materials-side">
          <section className="admin-materials-preview-order">
            <h2>Preview Urutan Pembelajaran</h2>
            <p>Urutan materi yang akan dilihat oleh pembelajar.</p>
            <div>
              {slides.map((slide, index) => (
                <article
                  className={
                    String(selectedSlide?.id) === String(slide.id)
                      ? 'is-active'
                      : ''
                  }
                  key={slide.id || `${tutorialId}-preview-${index}`}
                  onClick={() => setSelectedSlideId(slide.id)}
                >
                  <strong>{index + 1}</strong>
                  <span>{slide.title || `Slide ${index + 1}`}</span>
                  <small>{normalizeStatus(slide.status)}</small>
                </article>
              ))}
            </div>
            <b>Total {slides.length} Materi</b>
          </section>

          <section className="admin-materials-selected-preview">
            <h2>Preview Materi Terpilih</h2>
            <h3>
              #{selectedSlide ? slides.findIndex((slide) => slide.id === selectedSlide.id) + 1 : 0}{' '}
              {selectedSlide?.title || 'Belum ada materi'}
            </h3>
            <div className="admin-materials-image-placeholder" aria-hidden="true"><span /></div>
            <p>
              <span>[] {selectedSlide?.content_type || selectedSlide?.contentType || '-'}</span>
              <span>o {formData.estimatedTime || '-'}</span>
            </p>
          </section>
        </aside>
      </div>
    </section>
  );

  const renderSettingsStep = () => (
    <section className="admin-tutorial-edit-wide">
      <div className="admin-settings-layout">
        <section className="admin-settings-main">
          <section className="admin-settings-card admin-settings-visibility">
            <h2>Status & Visibilitas</h2>
            <div className="admin-settings-grid three">
              <label>
                Status Publikasi
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option>Draft</option>
                  <option>Published</option>
                  <option>Pending Review</option>
                </select>
                <small>Draft, Published, atau Pending Review</small>
              </label>
              <div className="admin-settings-toggle-item">
                <strong>Aktif / Nonaktif</strong>
                <button type="button" className="is-on"><span /></button>
                <small>Nonaktifkan akan menyembunyikan materi.</small>
              </div>
              <div className="admin-settings-toggle-item">
                <strong>Tampilkan di halaman</strong>
                <p>Pilih Jalur Belajarmu</p>
                <button type="button" className="is-on"><span /></button>
                <small>Akan tampil pada halaman pilih jalur belajarmu.</small>
              </div>
              <div className="admin-settings-toggle-item">
                <strong>Featured (Unggulan)</strong>
                <button type="button"><span /></button>
                <p>Tidak</p>
              </div>
              <div className="admin-settings-toggle-item">
                <strong>Izinkan Komentar / Diskusi</strong>
                <button type="button" className="is-on"><span /></button>
                <p>Izinkan</p>
              </div>
              <div className="admin-settings-radio-item">
                <strong>Akses Materi</strong>
                <label><input type="radio" defaultChecked /> Gratis</label>
                <label><input type="radio" /> Perlu login / Akun</label>
              </div>
            </div>
          </section>

          <section className="admin-settings-card">
            <h2>Pengelompokan & Tampilan</h2>
            <div className="admin-settings-grid four">
              <label>
                Kategori / Jalur
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="">Pilih jalur materi</option>
                  <option value="panduan-pemula">Panduan Pemula</option>
                  <option value="penggunaan-ide">Penggunaan IDE</option>
                  <option value="dasar-hardware-iot">Dasar Hardware dan IoT</option>
                </select>
              </label>
              <label>
                Level Kesulitan
                <select name="difficultyLevel" value={formData.difficultyLevel} onChange={handleChange}>
                  <option>Level Pemula</option>
                  <option>Level Dasar</option>
                  <option>Level Lanjutan</option>
                </select>
              </label>
              <label>
                Urutan Tampil di Halaman
                <input
                  type="number"
                  min="1"
                  name="pageOrder"
                  value={formData.pageOrder}
                  onChange={handleChange}
                />
              </label>
              <label>
                Featured Order (opsional)
                <input defaultValue="1" />
              </label>
            </div>
          </section>

          <section className="admin-settings-card">
            <h2>Estimasi & Durasi</h2>
            <div className="admin-settings-grid three">
              <label>
                Estimasi Total Durasi
                <input
                  name="estimatedTime"
                  value={formData.estimatedTime}
                  onChange={handleChange}
                />
              </label>
              <div className="admin-settings-upload">
                <strong>Gambar / Icon (untuk card)</strong>
                <label>
                  <span>[]</span>
                  <p>Thumbnail mengikuti data materi saat ini</p>
                  <small>Upload gambar baru bisa ditambahkan setelah backend mendukung file update.</small>
                </label>
              </div>
              <button type="button" className="admin-settings-library">Pilih dari Library</button>
            </div>
          </section>

          <div className="admin-settings-split">
            <section className="admin-settings-card">
              <h2>Syarat Akses (Opsional)</h2>
              <label className="admin-settings-radio-line">
                <input
                  type="radio"
                  checked={formData.userLevel === 'Semua Pengguna'}
                  onChange={() =>
                    setFormData((previous) => ({
                      ...previous,
                      userLevel: 'Semua Pengguna',
                    }))
                  }
                />{' '}
                Semua Pengguna
              </label>
              <label className="admin-settings-radio-line">
                <input
                  type="radio"
                  checked={formData.userLevel !== 'Semua Pengguna'}
                  onChange={() =>
                    setFormData((previous) => ({
                      ...previous,
                      userLevel: 'Member',
                    }))
                  }
                />{' '}
                Hanya pengguna dengan level tertentu
              </label>
            </section>
            <section className="admin-settings-card">
              <h2>Prasyarat Belajar (Opsional)</h2>
              <select defaultValue="Tidak ada prasyarat">
                <option>Tidak ada prasyarat</option>
                {slides.map((slide, index) => (
                  <option key={slide.id || index}>{slide.title || `Slide ${index + 1}`}</option>
                ))}
              </select>
            </section>
          </div>

          <section className="admin-settings-card admin-settings-bottom">
            <div>
              <label>
                Tombol CTA (Call to Action)
                <input defaultValue="Mulai Belajar" />
              </label>
              <label>
                URL Slug (Opsional)
                <span>https://arduflow.com/materi/</span>
                <input name="slug" value={formData.slug} onChange={handleChange} />
              </label>
            </div>
            <div>
              <label>
                Link Tujuan
                <select defaultValue="Materi Pertama">
                  <option>Materi Pertama</option>
                  <option>Daftar Materi</option>
                </select>
              </label>
              <label>
                Jadwal Publikasi (Opsional)
                <input type="date" />
              </label>
            </div>
          </section>
        </section>

        <aside className="admin-settings-side">
          <section className="admin-settings-user-preview">
            <h2>Preview di Halaman User</h2>
            <article>
              <div className="admin-settings-preview-image" aria-hidden="true" />
              <div>
                <small>{formData.difficultyLevel}</small>
                <strong>{formData.title || 'Judul Materi'}</strong>
                <p>{formData.shortDescription || 'Deskripsi singkat materi.'}</p>
                <span>o {formData.estimatedTime || '-'}</span>
                <span>[] {slides.length} slide</span>
                <span>* Gratis</span>
              </div>
              <button type="button">Mulai Belajar</button>
            </article>
          </section>

          <section className="admin-settings-info">
            <h2>Informasi</h2>
            {[
              ['Status Publikasi', formData.status],
              ['Kategori / Jalur', formData.category || '-'],
              ['Level Kesulitan', formData.difficultyLevel],
              ['Urutan Tampil', formData.pageOrder],
              ['Estimasi Total Durasi', formData.estimatedTime || '-'],
              ['Total Slide', slides.length],
              ['Syarat Akses', formData.userLevel],
              ['URL Slug', `/materi/${formData.slug || '-'}`],
            ].map((item) => (
              <p key={item[0]}>
                <span>{item[0]}</span>
                <strong>{item[1]}</strong>
              </p>
            ))}
          </section>
        </aside>
      </div>
    </section>
  );

  if (isLoading) {
    return (
      <main className="admin-tutorial-create-page">
        <section className="admin-tutorial-create-card">
          <h1>Edit Materi</h1>
          <p>Mengambil data materi dari SQLite...</p>
        </section>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="admin-tutorial-create-page">
        <section className="admin-tutorial-create-card">
          <h1>Edit Materi</h1>
          <div
            className="admin-tutorial-submit-message is-error"
            role="alert"
          >
            <strong>Data materi gagal dimuat</strong>
            <p>{loadError}</p>
          </div>

          <div className="admin-tutorial-create-actions">
            <button type="button" onClick={handleBack}>
              Kembali ke Tutorial
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-tutorial-create-page">
      <section className="admin-tutorial-create-header">
        <h1>Edit Materi</h1>
        <p>
          Edit data materi ID #{tutorialId} yang tersimpan pada SQLite.
        </p>
      </section>

      {renderSteps()}

      <div className="admin-tutorial-create-grid">
        <section className={`admin-tutorial-create-card admin-tutorial-create-form-card ${activeStep === 1 ? '' : 'is-step-hidden'}`}>
          <h2>Informasi Utama Materi</h2>

          <div className="admin-tutorial-create-two">
            <label>
              <span className="admin-tutorial-label">
                Judul Materi
                <span className="admin-tutorial-required">*</span>
              </span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
              />
            </label>

            <label>
              <span className="admin-tutorial-label">
                Slug (URL)
                <span className="admin-tutorial-required">*</span>
              </span>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
              />
              <small>URL unik untuk materi ini</small>
            </label>
          </div>

          <div className="admin-tutorial-create-two">
            <label>
              <span className="admin-tutorial-label">
                Kategori / Jalur
                <span className="admin-tutorial-required">*</span>
              </span>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Pilih jalur materi</option>
                <option value="panduan-pemula">Panduan Pemula</option>
                <option value="penggunaan-ide">Penggunaan IDE</option>
                <option value="dasar-hardware-iot">
                  Dasar Hardware dan IoT
                </option>
                {![
                  '',
                  'panduan-pemula',
                  'penggunaan-ide',
                  'dasar-hardware-iot',
                ].includes(formData.category) && (
                  <option value={formData.category}>
                    {formData.category}
                  </option>
                )}
              </select>
            </label>

            <label>
              <span className="admin-tutorial-label">
                Urutan Tampil
                <span className="admin-tutorial-required">*</span>
              </span>
              <input
                type="number"
                min="1"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleChange}
              />
            </label>
          </div>

          <label>
            <span className="admin-tutorial-label">
              Deskripsi Singkat
              <span className="admin-tutorial-required">*</span>
            </span>
            <textarea
              rows="5"
              maxLength="150"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
            />
            <small>{formData.shortDescription.length}/150 karakter</small>
          </label>

          <label>
            <span className="admin-tutorial-label">
              Deskripsi Lengkap
              <span className="admin-tutorial-required">*</span>
            </span>
            <textarea
              className="admin-tutorial-create-editor"
              rows="8"
              name="fullDescription"
              value={formData.fullDescription}
              onChange={handleChange}
            />
          </label>

          <div className="admin-tutorial-create-two">
            <label>
              Level Kesulitan
              <select
                name="difficultyLevel"
                value={formData.difficultyLevel}
                onChange={handleChange}
              >
                <option>Level Pemula</option>
                <option>Level Dasar</option>
                <option>Level Lanjutan</option>
                {![
                  'Level Pemula',
                  'Level Dasar',
                  'Level Lanjutan',
                ].includes(formData.difficultyLevel) && (
                  <option value={formData.difficultyLevel}>
                    {formData.difficultyLevel}
                  </option>
                )}
              </select>
            </label>

            <label>
              Estimasi Waktu Belajar
              <input
                type="text"
                name="estimatedTime"
                value={formData.estimatedTime}
                onChange={handleChange}
              />
            </label>
          </div>
        </section>

        {activeStep === 2 ? renderMaterialsStep() : null}
        {activeStep === 3 ? renderSettingsStep() : null}

        <section className="admin-tutorial-create-card admin-tutorial-slides-card is-step-hidden">
          <div className="admin-tutorial-card-head">
            <div>
              <h2>Daftar Materi / Slide</h2>
              <p>
                Slide berikut diambil dari materi yang tersimpan di SQLite.
              </p>
            </div>
            <button type="button" onClick={addSlide}>Tambah Slide</button>
          </div>

          <div className="admin-tutorial-slide-list">
            {slides.length ? (
              slides.map((slide, index) => (
                <article key={slide.id || `${tutorialId}-${index}`}>
                  <span>⋮</span>
                  <strong>{index + 1}</strong>
                  <b>{slide.title || `Slide ${index + 1}`}</b>
                  <small>
                    {slide.content_type || slide.contentType || 'text'}
                  </small>
                  <div className="admin-tutorial-slide-actions">
                    <button type="button" onClick={() => renameSlide(index)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => removeSlide(index)}>
                      Hapus
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p>Belum ada slide pada materi ini.</p>
            )}
          </div>
        </section>

        <aside className="admin-tutorial-create-side is-step-hidden">
          <section className="admin-tutorial-create-card">
            <h2>Pengaturan Tampil</h2>

            <label>
              <span className="admin-tutorial-label">
                Urutan Tampil di Halaman
                <span className="admin-tutorial-required">*</span>
              </span>
              <input
                type="number"
                min="1"
                name="pageOrder"
                value={formData.pageOrder}
                onChange={handleChange}
              />
            </label>

            <label>
              Status
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option>Draft</option>
                <option>Published</option>
                <option>Pending Review</option>
              </select>
            </label>

            <h3>Pengaturan Akses (Opsional)</h3>

            <label>
              Level Pengguna
              <select
                name="userLevel"
                value={formData.userLevel}
                onChange={handleChange}
              >
                <option>Semua Pengguna</option>
                <option>Member</option>
                <option>Admin</option>
              </select>
            </label>

            <label>
              Syarat Akses (Opsional)
              <input
                type="text"
                name="accessRequirement"
                value={formData.accessRequirement}
                onChange={handleChange}
              />
            </label>
          </section>

          <section className="admin-tutorial-create-card admin-tutorial-preview-card">
            <h2>Preview Data</h2>
            <article>
              <strong>{formData.title || 'Judul Materi'}</strong>
              <p>
                {formData.shortDescription ||
                  'Deskripsi singkat materi akan tampil di sini.'}
              </p>
              <small>{formData.difficultyLevel}</small>
              <small>{formData.estimatedTime || '-'}</small>
            </article>
          </section>

          <section className="admin-tutorial-create-card">
            <h2>Debug SQLite</h2>
            <p>
              <strong>ID:</strong> {tutorialId}
            </p>
            <p>
              <strong>Total Slide:</strong> {slides.length}
            </p>
            <details>
              <summary>Lihat data asli SQLite</summary>
              <pre
                style={{
                  maxHeight: 280,
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: 11,
                }}
              >
                {JSON.stringify(tutorialRaw, null, 2)}
              </pre>
            </details>
          </section>
        </aside>
      </div>

      {saveMessage && (
        <div
          className={`admin-tutorial-submit-message ${
            saveStatus === 'error' ? 'is-error' : 'is-success'
          }`}
          role="alert"
        >
          <strong>
            {saveStatus === 'error'
              ? 'Perubahan belum tersimpan'
              : 'Perubahan berhasil disimpan'}
          </strong>
          <p>{saveMessage}</p>
        </div>
      )}

      <div className="admin-tutorial-create-actions">
        <button type="button" onClick={handleBack}>
          Kembali
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </main>
  );
}
