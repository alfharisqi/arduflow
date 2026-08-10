import { useMemo, useRef, useState } from 'react';
import '../../styles/admin-tutorial-create.css';

const ARTICLE_API_URL = (
  import.meta.env.VITE_ARTICLE_API_URL ||
  'http://127.0.0.1:8000/api/article-api.php'
).trim();

const initialSlides = [
  { id: 1, title: 'Pengantar ArduFlow', contentType: 'text_image' },
  { id: 2, title: 'Apa yang dipelajari', contentType: 'text_image' },
  { id: 3, title: 'Contoh penggunaan', contentType: 'text_image' },
];

const initialFormData = {
  title: '',
  slug: '',
  category: '',
  displayOrder: 1,
  shortDescription: '',
  fullDescription: '',
  cardImage: null,
  difficultyLevel: 'Level Pemula',
  estimatedTime: '2-4 jam',
  pageSettings: {
    pageOrder: '',
    status: 'Draft',
  },
  accessSettings: {
    userLevel: 'Semua Pengguna',
    accessRequirement: '',
  },
};

export function AdminTutorialCreate() {
  const [formData, setFormData] = useState(initialFormData);
  const [slides, setSlides] = useState(initialSlides);
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [requestJson, setRequestJson] = useState(null);
  const [responseJson, setResponseJson] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleRef = useRef(null);
  const slugRef = useRef(null);
  const categoryRef = useRef(null);
  const displayOrderRef = useRef(null);
  const shortDescriptionRef = useRef(null);
  const fullDescriptionRef = useRef(null);
  const cardImageSectionRef = useRef(null);
  const cardImageInputRef = useRef(null);
  const pageOrderRef = useRef(null);
  const slideSectionRef = useRef(null);

  const createSlug = (value) => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const clearFieldError = (fieldName) => {
    setErrors((previousErrors) => {
      if (!previousErrors[fieldName]) {
        return previousErrors;
      }

      const updatedErrors = { ...previousErrors };
      delete updatedErrors[fieldName];
      return updatedErrors;
    });

    setSubmitMessage('');
    setSubmitStatus('idle');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    clearFieldError(name);
  };

  const handleTitleChange = (event) => {
    const value = event.target.value;

    setFormData((previousData) => ({
      ...previousData,
      title: value,
      slug: createSlug(value),
    }));

    setErrors((previousErrors) => {
      const updatedErrors = { ...previousErrors };
      delete updatedErrors.title;
      delete updatedErrors.slug;
      return updatedErrors;
    });

    setSubmitMessage('');
    setSubmitStatus('idle');
  };

  const handleNestedChange = (section, field, value) => {
    setFormData((previousData) => ({
      ...previousData,
      [section]: {
        ...previousData[section],
        [field]: value,
      },
    }));

    clearFieldError(field);
  };

  const handleImageChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;

    setFormData((previousData) => ({
      ...previousData,
      cardImage: selectedFile,
    }));

    clearFieldError('cardImage');
  };

  const handleAddSlide = () => {
    const newSlideNumber = slides.length + 1;

    setSlides((previousSlides) => [
      ...previousSlides,
      {
        id: Date.now(),
        title: `Slide Materi ${newSlideNumber}`,
        contentType: 'text',
      },
    ]);

    clearFieldError('slides');
  };

  const slideStatistics = useMemo(() => {
    const textCount = slides.filter((slide) =>
      ['text', 'text_image'].includes(slide.contentType)
    ).length;

    const imageCount = slides.filter((slide) =>
      ['image', 'text_image'].includes(slide.contentType)
    ).length;

    const videoCount = slides.filter(
      (slide) => slide.contentType === 'video'
    ).length;

    return [
      ['Total Slide', String(slides.length)],
      ['Text', String(textCount)],
      ['Gambar', String(imageCount)],
      ['Video', String(videoCount)],
    ];
  }, [slides]);

  const validateForm = () => {
    const validationErrors = {};

    if (!formData.title.trim()) {
      validationErrors.title = 'Kolom ini belum diisi.';
    }

    if (!formData.slug.trim()) {
      validationErrors.slug = 'Kolom ini belum diisi.';
    }

    if (!formData.category) {
      validationErrors.category = 'Kolom ini belum diisi.';
    }

    if (
      formData.displayOrder === '' ||
      Number(formData.displayOrder) < 1
    ) {
      validationErrors.displayOrder = 'Kolom ini belum diisi.';
    }

    if (!formData.shortDescription.trim()) {
      validationErrors.shortDescription = 'Kolom ini belum diisi.';
    } else if (formData.shortDescription.length > 150) {
      validationErrors.shortDescription =
        'Deskripsi singkat maksimal 150 karakter.';
    }

    if (!formData.fullDescription.trim()) {
      validationErrors.fullDescription = 'Kolom ini belum diisi.';
    }

    if (!formData.cardImage) {
      validationErrors.cardImage = 'Kolom ini belum diisi.';
    } else {
      const allowedFileTypes = [
        'image/jpeg',
        'image/png',
        'image/svg+xml',
      ];

      const maximumFileSize = 3 * 1024 * 1024;

      if (!allowedFileTypes.includes(formData.cardImage.type)) {
        validationErrors.cardImage =
          'Format gambar harus JPG, PNG, atau SVG.';
      } else if (formData.cardImage.size > maximumFileSize) {
        validationErrors.cardImage = 'Ukuran gambar maksimal 3 MB.';
      }
    }

    if (!formData.pageSettings.pageOrder) {
      validationErrors.pageOrder = 'Kolom ini belum diisi.';
    }

    if (slides.length === 0) {
      validationErrors.slides =
        'Daftar materi harus memiliki minimal satu slide.';
    }

    return validationErrors;
  };

  const mapBackendErrors = (backendErrors = {}) => {
    const fieldMap = {
      title: 'title',
      slug: 'slug',
      category: 'category',
      display_order: 'displayOrder',
      short_description: 'shortDescription',
      full_description: 'fullDescription',
      card_image: 'cardImage',
      page_order: 'pageOrder',
      slides: 'slides',
    };

    return Object.entries(backendErrors).reduce(
      (mappedErrors, [backendField, message]) => {
        const frontendField = fieldMap[backendField] || backendField;

        mappedErrors[frontendField] = Array.isArray(message)
          ? message[0]
          : message;

        return mappedErrors;
      },
      {}
    );
  };

  const getFieldTarget = (fieldName) => {
    const targets = {
      title: titleRef.current,
      slug: slugRef.current,
      category: categoryRef.current,
      displayOrder: displayOrderRef.current,
      shortDescription: shortDescriptionRef.current,
      fullDescription: fullDescriptionRef.current,
      cardImage: cardImageSectionRef.current,
      slides: slideSectionRef.current,
      pageOrder: pageOrderRef.current,
    };

    return targets[fieldName] || null;
  };

  const focusFirstInvalidField = (validationErrors) => {
    const fieldOrder = [
      'title',
      'slug',
      'category',
      'displayOrder',
      'shortDescription',
      'fullDescription',
      'cardImage',
      'slides',
      'pageOrder',
    ];

    const firstInvalidField = fieldOrder.find(
      (fieldName) => validationErrors[fieldName]
    );

    if (!firstInvalidField) {
      return;
    }

    const targetElement = getFieldTarget(firstInvalidField);

    if (!targetElement) {
      return;
    }

    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    window.setTimeout(() => {
      if (firstInvalidField === 'cardImage') {
        cardImageInputRef.current?.focus();
        return;
      }

      targetElement.focus?.();
    }, 500);
  };

  const createRequestPayload = () => {
    return {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      category: formData.category,
      display_order: Number(formData.displayOrder),

      descriptions: {
        short_description: formData.shortDescription.trim(),
        full_description: formData.fullDescription.trim(),
      },

      card_image: formData.cardImage
        ? {
            file_name: formData.cardImage.name,
            file_type: formData.cardImage.type,
            file_size: formData.cardImage.size,
            file_size_mb: Number(
              (formData.cardImage.size / (1024 * 1024)).toFixed(2)
            ),
          }
        : null,

      learning_information: {
        difficulty_level: formData.difficultyLevel,
        estimated_time: formData.estimatedTime.trim(),
      },

      page_settings: {
        page_order: formData.pageSettings.pageOrder
          ? Number(formData.pageSettings.pageOrder)
          : null,
        status: formData.pageSettings.status
          .toLowerCase()
          .replace(/\s+/g, '_'),
      },

      access_settings: {
        user_level: formData.accessSettings.userLevel
          .toLowerCase()
          .replace(/\s+/g, '_'),
        access_requirement:
          formData.accessSettings.accessRequirement.trim() || null,
      },

      slides: slides.map((slide, index) => ({
        id: slide.id,
        order: index + 1,
        title: slide.title,
        content_type: slide.contentType,
      })),

      metadata: {
        source: 'admin_tutorial_create_form',
        frontend_route: window.location.pathname,
        request_method: 'POST',
        endpoint: ARTICLE_API_URL,
        generated_at: new Date().toISOString(),
      },
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm();
    const payload = createRequestPayload();

    setErrors(validationErrors);
    setRequestJson(payload);
    setResponseJson(null);

    console.group('DEBUG FORM TAMBAH MATERI');
    console.log('Method:', 'POST');
    console.log('Endpoint:', ARTICLE_API_URL);
    console.log('Request JSON:', payload);

    if (Object.keys(validationErrors).length > 0) {
      const totalErrors = Object.keys(validationErrors).length;

      const errorResponse = {
        success: false,
        status_code: 422,
        message: 'Data materi belum lengkap.',
        errors: validationErrors,
        data: null,
        metadata: {
          endpoint: ARTICLE_API_URL,
          method: 'POST',
          timestamp: new Date().toISOString(),
        },
      };

      setSubmitStatus('error');
      setSubmitMessage(
        `Masih ada ${totalErrors} kolom wajib yang belum diisi atau belum sesuai. Silakan lengkapi kolom yang ditandai merah.`
      );
      setResponseJson(errorResponse);

      console.error('Validasi frontend gagal:', validationErrors);
      console.log('Response JSON:', errorResponse);
      console.groupEnd();

      window.setTimeout(() => {
        focusFirstInvalidField(validationErrors);
      }, 100);

      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    try {
      const response = await fetch(
        ARTICLE_API_URL,
        {
          method: 'POST',
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
          `Response API bukan JSON yang valid. Isi response: ${responseText.slice(
            0,
            300
          )}`
        );
      }

      const apiResponse = {
        status_code: response.status,
        ...result,
      };

      setResponseJson(apiResponse);
      console.log('Response API:', apiResponse);

      if (!response.ok) {
        const backendErrors = mapBackendErrors(result.errors || {});

        setSubmitStatus('error');
        setSubmitMessage(
          result.message ||
            'Data materi gagal disimpan ke database SQLite.'
        );

        if (Object.keys(backendErrors).length > 0) {
          setErrors(backendErrors);

          window.setTimeout(() => {
            focusFirstInvalidField(backendErrors);
          }, 100);
        }

        return;
      }

      setErrors({});
      setSubmitStatus('success');
      setSubmitMessage(
        result.message ||
          'Materi berhasil disimpan ke database SQLite.'
      );
    } catch (error) {
      const serverErrorResponse = {
        success: false,
        status_code: 0,
        message: 'Tidak dapat terhubung ke article-api.php.',
        error: {
          type: error.name,
          detail: error.message,
        },
        metadata: {
          endpoint: ARTICLE_API_URL,
          method: 'POST',
          timestamp: new Date().toISOString(),
        },
      };

      setResponseJson(serverErrorResponse);
      setSubmitStatus('error');
      setSubmitMessage(
        'Tidak dapat terhubung ke API. Pastikan server PHP berjalan pada port 8000.'
      );

      console.error('Kesalahan koneksi API:', error);
    } finally {
      setIsSubmitting(false);
      console.groupEnd();
    }
  };

  const copyJson = async (data) => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(data, null, 2)
      );

      window.alert('JSON berhasil disalin.');
    } catch (error) {
      console.error('Gagal menyalin JSON:', error);
      window.alert('JSON gagal disalin.');
    }
  };

  return (
    <main className="admin-tutorial-create-page">
      <section className="admin-tutorial-create-header">
        <h1>Tambah Materi</h1>
        <p>
          Buat materi baru untuk ditampilkan pada halaman Pilih Jalur
          Belajarmu.
        </p>
      </section>

      <nav
        className="admin-tutorial-create-steps"
        aria-label="Tahapan tambah materi"
      >
        {[
          ['1', 'Informasi Materi', 'Detail utama materi'],
          ['2', 'Daftar Materi / Slide', 'Buat dan urutkan materi'],
          ['3', 'Pengaturan', 'Status & lainnya'],
        ].map((step, index) => (
          <article
            className={index === 0 ? 'is-active' : ''}
            key={step[1]}
          >
            <span>{step[0]}</span>
            <div>
              <strong>{step[1]}</strong>
              <small>{step[2]}</small>
            </div>
          </article>
        ))}
      </nav>

      <form onSubmit={handleSubmit} noValidate>
        <div className="admin-tutorial-create-grid">
          <section className="admin-tutorial-create-card admin-tutorial-create-form-card">
            <h2>Informasi Utama Materi</h2>

            <div className="admin-tutorial-create-two">
              <label>
                <span className="admin-tutorial-label">
                  Judul Materi
                  <span className="admin-tutorial-required">*</span>
                </span>

                <input
                  ref={titleRef}
                  className={errors.title ? 'is-error' : ''}
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="Panduan Pemula"
                  aria-invalid={Boolean(errors.title)}
                />

                {errors.title && (
                  <small className="admin-tutorial-error">
                    {errors.title}
                  </small>
                )}
              </label>

              <label>
                <span className="admin-tutorial-label">
                  Slug (URL)
                  <span className="admin-tutorial-required">*</span>
                </span>

                <input
                  ref={slugRef}
                  className={errors.slug ? 'is-error' : ''}
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="panduan-pemula"
                  aria-invalid={Boolean(errors.slug)}
                />

                <small>URL unik untuk materi ini</small>

                {errors.slug && (
                  <small className="admin-tutorial-error">
                    {errors.slug}
                  </small>
                )}
              </label>
            </div>

            <div className="admin-tutorial-create-two">
              <label>
                <span className="admin-tutorial-label">
                  Kategori / Jalur
                  <span className="admin-tutorial-required">*</span>
                </span>

                <select
                  ref={categoryRef}
                  className={errors.category ? 'is-error' : ''}
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.category)}
                >
                  <option value="" disabled>
                    Pilih jalur materi
                  </option>
                  <option value="panduan-pemula">Panduan Pemula</option>
                  <option value="penggunaan-ide">Penggunaan IDE</option>
                  <option value="dasar-hardware-iot">
                    Dasar Hardware dan IoT
                  </option>
                </select>

                {errors.category && (
                  <small className="admin-tutorial-error">
                    {errors.category}
                  </small>
                )}
              </label>

              <label>
                <span className="admin-tutorial-label">
                  Urutan Tampil
                  <span className="admin-tutorial-required">*</span>
                </span>

                <input
                  ref={displayOrderRef}
                  className={errors.displayOrder ? 'is-error' : ''}
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleChange}
                  min="1"
                  aria-invalid={Boolean(errors.displayOrder)}
                />

                <small>Semakin kecil angka, semakin di atas</small>

                {errors.displayOrder && (
                  <small className="admin-tutorial-error">
                    {errors.displayOrder}
                  </small>
                )}
              </label>
            </div>

            <label>
              <span className="admin-tutorial-label">
                Deskripsi Singkat
                <span className="admin-tutorial-required">*</span>
              </span>

              <textarea
                ref={shortDescriptionRef}
                className={errors.shortDescription ? 'is-error' : ''}
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                rows="6"
                maxLength="150"
                placeholder="Deskripsi singkat yang akan ditampilkan di card materi..."
                aria-invalid={Boolean(errors.shortDescription)}
              />

              <small>
                {formData.shortDescription.length}/150 karakter
              </small>

              {errors.shortDescription && (
                <small className="admin-tutorial-error">
                  {errors.shortDescription}
                </small>
              )}
            </label>

            <label>
              <span className="admin-tutorial-label">
                Deskripsi Lengkap
                <span className="admin-tutorial-required">*</span>
              </span>

              <div className="admin-tutorial-editor-toolbar">
                <select defaultValue="Normal" aria-label="Format teks">
                  <option>Normal</option>
                  <option>Heading</option>
                </select>
                <button type="button">B</button>
                <button type="button">I</button>
                <button type="button">U</button>
                <button type="button">≡</button>
                <button type="button">☷</button>
                <button type="button">↗</button>
                <button type="button">▧</button>
                <button type="button">&lt;&gt;</button>
              </div>

              <textarea
                ref={fullDescriptionRef}
                className={`admin-tutorial-create-editor ${
                  errors.fullDescription ? 'is-error' : ''
                }`}
                name="fullDescription"
                value={formData.fullDescription}
                onChange={handleChange}
                rows="5"
                placeholder="Deskripsi lengkap materi..."
                aria-invalid={Boolean(errors.fullDescription)}
              />

              {errors.fullDescription && (
                <small className="admin-tutorial-error">
                  {errors.fullDescription}
                </small>
              )}
            </label>

            <div
              ref={cardImageSectionRef}
              className="admin-tutorial-image-field"
            >
              <span className="admin-tutorial-label">
                Gambar / Icon (untuk card)
                <span className="admin-tutorial-required">*</span>
              </span>

              <input
                ref={cardImageInputRef}
                id="tutorial-card-image"
                className="admin-tutorial-file-input"
                type="file"
                accept=".jpg,.jpeg,.png,.svg"
                onChange={handleImageChange}
                aria-invalid={Boolean(errors.cardImage)}
              />

              <label
                className={`admin-tutorial-upload-box ${
                  errors.cardImage ? 'is-error' : ''
                }`}
                htmlFor="tutorial-card-image"
              >
                <span aria-hidden="true">▧</span>

                {formData.cardImage ? (
                  <>
                    <p>{formData.cardImage.name}</p>
                    <small>
                      {(
                        formData.cardImage.size /
                        (1024 * 1024)
                      ).toFixed(2)}{' '}
                      MB
                    </small>
                  </>
                ) : (
                  <>
                    <p>Drag & drop atau klik untuk upload</p>
                    <small>
                      Format: JPG, PNG, SVG. Maksimal 3MB
                    </small>
                  </>
                )}
              </label>

              {errors.cardImage && (
                <small className="admin-tutorial-error">
                  {errors.cardImage}
                </small>
              )}
            </div>

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
                <small>Contoh: 2-4 jam, 1 minggu, dan lainnya</small>
              </label>
            </div>
          </section>

          <section
            ref={slideSectionRef}
            className={`admin-tutorial-create-card admin-tutorial-slides-card ${
              errors.slides ? 'is-section-error' : ''
            }`}
          >
            <div className="admin-tutorial-card-head">
              <div>
                <h2>Daftar Materi / Slide</h2>
                <p>
                  Buat, urutkan, dan kelola slide materi. Materi akan
                  ditampilkan berurutan kepada pengguna.
                </p>
              </div>

              <button type="button" onClick={handleAddSlide}>
                Tambah Slide
              </button>
            </div>

            <div className="admin-tutorial-slide-list">
              {slides.map((slide, index) => (
                <article key={slide.id}>
                  <span>⋮</span>
                  <strong>{index + 1}</strong>
                  <b>{slide.title}</b>
                  <small>
                    {slide.contentType === 'text_image'
                      ? 'Teks + Gambar'
                      : slide.contentType}
                  </small>
                  <div aria-hidden="true">⌕ ⎘ ⟳</div>
                </article>
              ))}
            </div>

            {errors.slides && (
              <small className="admin-tutorial-error">
                {errors.slides}
              </small>
            )}

            <p className="admin-tutorial-tip">
              ⓘ Tips: Drag & drop untuk mengubah urutan materi.
            </p>

            <div className="admin-tutorial-slide-stats">
              {slideStatistics.map((item) => (
                <article key={item[0]}>
                  <span>{item[0]}</span>
                  <strong>{item[1]}</strong>
                </article>
              ))}
            </div>
          </section>

          <aside className="admin-tutorial-create-side">
            <section className="admin-tutorial-create-card">
              <h2>Pengaturan Tampil</h2>

              <label>
                <span className="admin-tutorial-label">
                  Urutan Tampil di Halaman
                  <span className="admin-tutorial-required">*</span>
                </span>

                <select
                  ref={pageOrderRef}
                  className={errors.pageOrder ? 'is-error' : ''}
                  value={formData.pageSettings.pageOrder}
                  onChange={(event) =>
                    handleNestedChange(
                      'pageSettings',
                      'pageOrder',
                      event.target.value
                    )
                  }
                  aria-invalid={Boolean(errors.pageOrder)}
                >
                  <option value="" disabled>
                    Pilih urutan
                  </option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>

                {errors.pageOrder && (
                  <small className="admin-tutorial-error">
                    {errors.pageOrder}
                  </small>
                )}
              </label>

              <label>
                Status
                <select
                  value={formData.pageSettings.status}
                  onChange={(event) =>
                    handleNestedChange(
                      'pageSettings',
                      'status',
                      event.target.value
                    )
                  }
                >
                  <option>Draft</option>
                  <option>Published</option>
                  <option>Pending Review</option>
                </select>
                <small>Draft, Published, atau Pending Review</small>
              </label>

              <h3>Pengaturan Akses (Opsional)</h3>

              <label>
                Level Pengguna
                <select
                  value={formData.accessSettings.userLevel}
                  onChange={(event) =>
                    handleNestedChange(
                      'accessSettings',
                      'userLevel',
                      event.target.value
                    )
                  }
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
                  value={formData.accessSettings.accessRequirement}
                  onChange={(event) =>
                    handleNestedChange(
                      'accessSettings',
                      'accessRequirement',
                      event.target.value
                    )
                  }
                  placeholder="Contoh: harus login, sudah daftar, dll"
                />
              </label>
            </section>

            <section className="admin-tutorial-create-card admin-tutorial-preview-card">
              <h2>Preview Card (Halaman User)</h2>
              <article>
                <strong>{formData.title || 'Judul Materi'}</strong>
                <p>
                  {formData.shortDescription ||
                    'Deskripsi singkat materi akan tampil di sini.'}
                </p>
                <small>{formData.difficultyLevel}</small>
                <small>{formData.estimatedTime}</small>
              </article>
            </section>

            <section className="admin-tutorial-create-card admin-tutorial-order-preview">
              <h2>Preview Urutan Slide (Ringkasan)</h2>
              <div className="admin-tutorial-page-dots">
                <button type="button" disabled>
                  ‹
                </button>
                <button type="button" className="is-active">
                  1
                </button>
                <button type="button">2</button>
                <span>...</span>
                <button type="button">
                  {Math.max(slides.length - 1, 1)}
                </button>
                <button type="button">
                  {Math.max(slides.length, 1)}
                </button>
                <button type="button">›</button>
              </div>

              <article>
                <span aria-hidden="true">▧</span>
                <div>
                  <small>Slide 1 dari {slides.length}</small>
                  <strong>
                    {slides[0]?.title || 'Belum ada slide'}
                  </strong>
                </div>
              </article>
            </section>
          </aside>
        </div>

        {submitMessage && (
          <div
            className={`admin-tutorial-submit-message ${
              submitStatus === 'error' ? 'is-error' : 'is-success'
            }`}
            role="alert"
            aria-live="assertive"
          >
            <strong>
              {submitStatus === 'error'
                ? 'Form belum berhasil diproses'
                : 'Form berhasil diproses'}
            </strong>
            <p>{submitMessage}</p>
          </div>
        )}

        <div className="admin-tutorial-create-actions">
          <a href="/admin/tutorial">Kembali</a>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Menyimpan Data...'
              : 'Lanjut ke daftar materi'}
          </button>
        </div>
      </form>

      {(requestJson || responseJson) && (
        <section className="admin-tutorial-debug-section">
          <div className="admin-tutorial-debug-title">
            <h2>Debug Form Tambah Materi</h2>
            <p>Request dan response API SQLite.</p>
          </div>

          {requestJson && (
            <article className="admin-tutorial-debug-card">
              <div className="admin-tutorial-debug-header">
                <div>
                  <h3>Request JSON</h3>
                  <span>
                    POST {ARTICLE_API_URL}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => copyJson(requestJson)}
                >
                  Salin JSON
                </button>
              </div>

              <pre>{JSON.stringify(requestJson, null, 2)}</pre>
            </article>
          )}

          {responseJson && (
            <article className="admin-tutorial-debug-card">
              <div className="admin-tutorial-debug-header">
                <div>
                  <h3>Response JSON</h3>
                  <span>HTTP {responseJson.status_code}</span>
                </div>

                <button
                  type="button"
                  onClick={() => copyJson(responseJson)}
                >
                  Salin JSON
                </button>
              </div>

              <pre>{JSON.stringify(responseJson, null, 2)}</pre>
            </article>
          )}
        </section>
      )}
    </main>
  );
}