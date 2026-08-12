import { useEffect, useMemo, useRef, useState } from 'react';
import { apiEndpoint } from '../../services/apiEndpoints.js';
import {
  showConfirmAlert,
  showErrorAlert,
  showPromptAlert,
  showSuccessAlert,
} from '../../utils/alerts.js';
import '../../styles/admin-tutorial-create.css';

const ARTICLE_API_URL = apiEndpoint(import.meta.env.VITE_ARTICLE_API_URL, '/api/article-api.php');

const initialSlides = [];

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
  ctaText: 'Mulai Belajar',
  targetLink: 'Materi Pertama',
  urlSlug: 'panduan-pemula',
  publishSchedule: '',
  pageSettings: {
    pageOrder: '',
    status: 'Draft',
    active: true,
    showOnPage: true,
    featured: false,
    comments: true,
    accessType: 'Gratis',
    featuredOrder: '1',
  },
  accessSettings: {
    userLevel: 'Semua Pengguna',
    accessRequirement: '',
    prerequisite: 'Tidak ada prasyarat',
  },
};

const steps = [
  ['1', 'Informasi Materi', 'Detail utama materi'],
  ['2', 'Daftar Materi / Slide', 'Buat dan urutkan materi'],
  ['3', 'Pengaturan', 'Status & lainnya'],
];

const contentTypeOptions = [
  ['text_image', 'Teks + Gambar'],
  ['text', 'Teks'],
  ['image', 'Gambar'],
  ['video', 'Video'],
];

const toContentLabel = (contentType) =>
  contentTypeOptions.find(([value]) => value === contentType)?.[1] ||
  String(contentType || '-');

export function AdminTutorialCreate() {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [slides, setSlides] = useState(initialSlides);
  const [selectedSlideId, setSelectedSlideId] = useState(null);
  const [editingSlideId, setEditingSlideId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState('asc');
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [requestJson, setRequestJson] = useState(null);
  const [responseJson, setResponseJson] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardImagePreview, setCardImagePreview] = useState('');
  const [cardImageDataUrl, setCardImageDataUrl] = useState('');

  const titleRef = useRef(null);
  const slugRef = useRef(null);
  const categoryRef = useRef(null);
  const displayOrderRef = useRef(null);
  const shortDescriptionRef = useRef(null);
  const fullDescriptionRef = useRef(null);
  const cardImageSectionRef = useRef(null);
  const cardImageInputRef = useRef(null);
  const slideImageInputRef = useRef(null);
  const pageOrderRef = useRef(null);

  const selectedSlide =
    slides.find((slide) => slide.id === selectedSlideId) || slides[0] || null;
  const editingSlide =
    slides.find((slide) => slide.id === editingSlideId) || null;
  const selectedSlideImage = selectedSlide?.imagePreview || cardImagePreview;

  useEffect(() => {
    if (!formData.cardImage) {
      setCardImagePreview('');
      setCardImageDataUrl('');
      return undefined;
    }

    const nextPreview = URL.createObjectURL(formData.cardImage);
    setCardImagePreview(nextPreview);

    const reader = new FileReader();
    reader.onload = () => {
      setCardImageDataUrl(
        typeof reader.result === 'string' ? reader.result : ''
      );
    };
    reader.readAsDataURL(formData.cardImage);

    return () => URL.revokeObjectURL(nextPreview);
  }, [formData.cardImage]);

  const filteredSlides = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return [...slides]
      .filter((slide) => {
        const matchesSearch = normalizedQuery
          ? slide.title.toLowerCase().includes(normalizedQuery)
          : true;
        const matchesStatus =
          statusFilter === 'Semua Status' || slide.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((firstSlide, secondSlide) =>
        sortMode === 'asc'
          ? firstSlide.id - secondSlide.id
          : secondSlide.id - firstSlide.id
      );
  }, [searchQuery, slides, sortMode, statusFilter]);

  const infoSlideStatistics = useMemo(() => {
    const textCount = slides.filter((slide) =>
      ['text', 'text_image'].includes(slide.contentType)
    ).length;
    const imageCount = slides.filter((slide) =>
      ['image', 'text_image'].includes(slide.contentType)
    ).length;
    const videoCount = slides.filter((slide) => slide.contentType === 'video').length;

    return [
      ['Total Slide', String(slides.length)],
      ['Text', String(textCount)],
      ['Gambar', String(imageCount)],
      ['Video', String(videoCount)],
    ];
  }, [slides]);

  const materialStatistics = useMemo(() => {
    const draftCount = slides.filter((slide) => slide.status === 'Draft').length;
    const publishedCount = slides.filter((slide) => slide.status === 'Published').length;

    return [
      ['Total Materi', String(slides.length)],
      ['Draft', String(draftCount)],
      ['Published', String(publishedCount)],
      ['Total Estimasi Waktu', formData.estimatedTime || '-'],
    ];
  }, [formData.estimatedTime, slides]);

  const createSlug = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const goToStep = (stepNumber) => {
    setActiveStep(stepNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      urlSlug: createSlug(value) || previousData.urlSlug,
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
    const newSlide = {
      id: Date.now(),
      title: `Slide Materi ${slides.length + 1}`,
      contentType: 'text_image',
      content: '',
      imageName: '',
      imageFile: null,
      imagePreview: '',
      videoUrl: '',
      estimatedTime: formData.estimatedTime || '2-4 jam',
      status: 'Draft',
    };

    setSlides((previousSlides) => [...previousSlides, newSlide]);
    setSelectedSlideId(newSlide.id);
    setEditingSlideId(newSlide.id);
    clearFieldError('slides');
  };

  const updateSlideField = (slideId, fieldName, value) => {
    setSlides((previousSlides) =>
      previousSlides.map((slide) =>
        slide.id === slideId ? { ...slide, [fieldName]: value } : slide
      )
    );
    clearFieldError('slides');
  };

  const duplicateSlide = (slideId) => {
    const slide = slides.find((item) => item.id === slideId);

    if (!slide) return;

    const duplicatedSlide = {
      ...slide,
      id: Date.now(),
      title: `${slide.title} Copy`,
      status: 'Draft',
    };

    setSlides((previousSlides) => [...previousSlides, duplicatedSlide]);
    setSelectedSlideId(duplicatedSlide.id);
  };

  const removeSlide = async (slideId) => {
    const slide = slides.find((item) => item.id === slideId);
    const confirmed = await showConfirmAlert({
      title: 'Hapus Materi?',
      text: `Hapus "${slide?.title || 'slide ini'}" dari daftar materi?`,
      confirmButtonText: 'Hapus',
    });

    if (!confirmed) return;

    setSlides((previousSlides) => {
      const updatedSlides = previousSlides.filter((slide) => slide.id !== slideId);

      if (selectedSlideId === slideId) {
        setSelectedSlideId(updatedSlides[0]?.id || null);
      }

      if (editingSlideId === slideId) {
        setEditingSlideId(null);
      }

      return updatedSlides;
    });
  };

  const renameSlide = async (slideId) => {
    const slide = slides.find((item) => item.id === slideId);
    if (!slide) return;

    const nextTitle = await showPromptAlert({
      title: 'Ubah Judul Materi',
      inputValue: slide.title,
      requiredMessage: 'Judul materi wajib diisi.',
    });
    if (!nextTitle?.trim()) return;

    setSlides((previousSlides) =>
      previousSlides.map((item) =>
        item.id === slideId ? { ...item, title: nextTitle.trim() } : item
      )
    );
  };

  const toggleSlideStatus = (slideId) => {
    setSlides((previousSlides) =>
      previousSlides.map((slide) =>
        slide.id === slideId
          ? { ...slide, status: slide.status === 'Published' ? 'Draft' : 'Published' }
          : slide
      )
    );
  };

  const handleSlideImageChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile || !editingSlideId) return;

    const previewUrl = URL.createObjectURL(selectedFile);

    setSlides((previousSlides) =>
      previousSlides.map((slide) =>
        slide.id === editingSlideId
          ? {
              ...slide,
              imageFile: selectedFile,
              imageName: selectedFile.name,
              imagePreview: previewUrl,
            }
          : slide
      )
    );

    event.target.value = '';
  };

  const validateForm = () => {
    const validationErrors = {};

    if (!formData.title.trim()) validationErrors.title = 'Kolom ini belum diisi.';
    if (!formData.slug.trim()) validationErrors.slug = 'Kolom ini belum diisi.';
    if (!formData.category) validationErrors.category = 'Kolom ini belum diisi.';
    if (formData.displayOrder === '' || Number(formData.displayOrder) < 1) {
      validationErrors.displayOrder = 'Kolom ini belum diisi.';
    }
    if (!formData.shortDescription.trim()) {
      validationErrors.shortDescription = 'Kolom ini belum diisi.';
    } else if (formData.shortDescription.length > 150) {
      validationErrors.shortDescription = 'Deskripsi singkat maksimal 150 karakter.';
    }
    if (!formData.fullDescription.trim()) {
      validationErrors.fullDescription = 'Kolom ini belum diisi.';
    }
    if (!formData.cardImage) {
      validationErrors.cardImage = 'Kolom ini belum diisi.';
    }
    if (!formData.pageSettings.pageOrder) {
      validationErrors.pageOrder = 'Kolom ini belum diisi.';
    }
    if (slides.length === 0) {
      validationErrors.slides = 'Daftar materi harus memiliki minimal satu slide.';
    }

    return validationErrors;
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
      'pageOrder',
    ];
    const firstInvalidField = fieldOrder.find(
      (fieldName) => validationErrors[fieldName]
    );

    if (!firstInvalidField) return;

    if (['title', 'slug', 'category', 'displayOrder', 'shortDescription', 'fullDescription', 'cardImage'].includes(firstInvalidField)) {
      goToStep(1);
    } else {
      goToStep(3);
    }

    window.setTimeout(() => {
      const targetElement = getFieldTarget(firstInvalidField);
      targetElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });

      if (firstInvalidField === 'cardImage') {
        cardImageInputRef.current?.focus();
        return;
      }

      targetElement?.focus?.();
    }, 250);
  };

  const createRequestPayload = () => ({
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
          data_url: cardImageDataUrl,
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
      status: formData.pageSettings.status.toLowerCase().replace(/\s+/g, '_'),
      active: formData.pageSettings.active,
      show_on_page: formData.pageSettings.showOnPage,
      featured: formData.pageSettings.featured,
      comments: formData.pageSettings.comments,
      access_type: formData.pageSettings.accessType,
      featured_order: formData.pageSettings.featuredOrder,
    },
    access_settings: {
      user_level: formData.accessSettings.userLevel.toLowerCase().replace(/\s+/g, '_'),
      access_requirement: formData.accessSettings.accessRequirement.trim() || null,
      prerequisite: formData.accessSettings.prerequisite,
    },
    cta: {
      text: formData.ctaText,
      target_link: formData.targetLink,
      url_slug: formData.urlSlug,
      publish_schedule: formData.publishSchedule || null,
    },
    slides: slides.map((slide, index) => ({
      id: slide.id,
      order: index + 1,
      title: slide.title,
      content_type: slide.contentType,
      content: slide.content || null,
      image_name: slide.imageName || null,
      image_url:
        slide.imagePreview && !/^blob:/i.test(slide.imagePreview)
          ? slide.imagePreview
          : null,
      video_url: slide.videoUrl || null,
      estimated_time: slide.estimatedTime,
      status: slide.status.toLowerCase(),
    })),
    metadata: {
      source: 'admin_tutorial_create_form',
      frontend_route: window.location.pathname,
      request_method: 'POST',
      endpoint: ARTICLE_API_URL,
      generated_at: new Date().toISOString(),
    },
  });

  const handleSubmit = async (event, mode = 'publish') => {
    event.preventDefault();

    const payload = createRequestPayload();
    const validationErrors = mode === 'draft' ? {} : validateForm();

    setErrors(validationErrors);
    setRequestJson({ ...payload, action: mode });
    setResponseJson(null);

    if (Object.keys(validationErrors).length > 0) {
      setSubmitStatus('error');
      setSubmitMessage('Masih ada kolom wajib yang belum diisi.');
      focusFirstInvalidField(validationErrors);
      await showErrorAlert('Form Belum Lengkap', 'Masih ada kolom wajib yang belum diisi.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    try {
      const requestFormData = new FormData();
      requestFormData.append(
        'payload',
        JSON.stringify({ ...payload, action: mode })
      );

      if (formData.cardImage) {
        requestFormData.append('card_image', formData.cardImage);
      }

      const response = await fetch(ARTICLE_API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: requestFormData,
      });

      const responseText = await response.text();
      const result = responseText ? JSON.parse(responseText) : {};
      const apiResponse = { status_code: response.status, ...result };

      setResponseJson(apiResponse);

      if (!response.ok) {
        setSubmitStatus('error');
        setSubmitMessage(result.message || 'Data materi gagal disimpan.');
        await showErrorAlert(
          'Gagal Menyimpan',
          result.message || 'Data materi gagal disimpan.'
        );
        return;
      }

      setSubmitStatus('success');
      setSubmitMessage(result.message || 'Materi berhasil diproses.');
      await showSuccessAlert(
        'Berhasil',
        result.message || 'Materi berhasil diproses.'
      );
    } catch (error) {
      setResponseJson({
        success: false,
        status_code: 0,
        message: 'Tidak dapat terhubung ke API.',
        error: { type: error.name, detail: error.message },
      });
      setSubmitStatus('error');
      setSubmitMessage('Tidak dapat terhubung ke API. Pastikan server sudah berjalan.');
      await showErrorAlert(
        'API Tidak Terhubung',
        'Tidak dapat terhubung ke API. Pastikan server sudah berjalan.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyJson = async (data) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      await showSuccessAlert('Berhasil', 'JSON berhasil disalin.');
    } catch (error) {
      console.error('Gagal menyalin JSON:', error);
      await showErrorAlert('Gagal', 'JSON gagal disalin.');
    }
  };

  const renderSteps = () => (
    <nav className="admin-tutorial-create-steps" aria-label="Tahapan tambah materi">
      {steps.map((step, index) => {
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

  const renderInformationStep = () => (
    <>
      <div className="admin-tutorial-create-grid">
        <section className="admin-tutorial-create-card admin-tutorial-create-form-card">
          <h2>Informasi Utama Materi</h2>

          <div className="admin-tutorial-create-two">
            <label>
              <span className="admin-tutorial-label">
                Judul Materi<span className="admin-tutorial-required">*</span>
              </span>
              <input ref={titleRef} className={errors.title ? 'is-error' : ''} type="text" name="title" value={formData.title} onChange={handleTitleChange} placeholder="Panduan Pemula" aria-invalid={Boolean(errors.title)} />
              {errors.title && <small className="admin-tutorial-error">{errors.title}</small>}
            </label>

            <label>
              <span className="admin-tutorial-label">
                Slug (URL)<span className="admin-tutorial-required">*</span>
              </span>
              <input ref={slugRef} className={errors.slug ? 'is-error' : ''} type="text" name="slug" value={formData.slug} onChange={handleChange} placeholder="panduan-pemula" aria-invalid={Boolean(errors.slug)} />
              <small>URL unik untuk materi ini</small>
              {errors.slug && <small className="admin-tutorial-error">{errors.slug}</small>}
            </label>
          </div>

          <div className="admin-tutorial-create-two">
            <label>
              <span className="admin-tutorial-label">
                Kategori / Jalur<span className="admin-tutorial-required">*</span>
              </span>
              <select ref={categoryRef} className={errors.category ? 'is-error' : ''} name="category" value={formData.category} onChange={handleChange} aria-invalid={Boolean(errors.category)}>
                <option value="" disabled>Pilih jalur materi</option>
                <option value="panduan-pemula">Panduan Pemula</option>
                <option value="penggunaan-ide">Penggunaan IDE</option>
                <option value="dasar-hardware-iot">Dasar Hardware dan IoT</option>
              </select>
              {errors.category && <small className="admin-tutorial-error">{errors.category}</small>}
            </label>

            <label>
              <span className="admin-tutorial-label">
                Urutan Tampil<span className="admin-tutorial-required">*</span>
              </span>
              <input ref={displayOrderRef} className={errors.displayOrder ? 'is-error' : ''} type="number" name="displayOrder" value={formData.displayOrder} onChange={handleChange} min="1" aria-invalid={Boolean(errors.displayOrder)} />
              <small>Semakin kecil angka, semakin di atas</small>
              {errors.displayOrder && <small className="admin-tutorial-error">{errors.displayOrder}</small>}
            </label>
          </div>

          <label>
            <span className="admin-tutorial-label">
              Deskripsi Singkat<span className="admin-tutorial-required">*</span>
            </span>
            <textarea ref={shortDescriptionRef} className={errors.shortDescription ? 'is-error' : ''} name="shortDescription" value={formData.shortDescription} onChange={handleChange} rows="6" maxLength="150" placeholder="Deskripsi singkat yang akan ditampilkan di card materi..." aria-invalid={Boolean(errors.shortDescription)} />
            <small>{formData.shortDescription.length}/150 karakter</small>
            {errors.shortDescription && <small className="admin-tutorial-error">{errors.shortDescription}</small>}
          </label>

          <label>
            <span className="admin-tutorial-label">
              Deskripsi Lengkap<span className="admin-tutorial-required">*</span>
            </span>
            <div className="admin-tutorial-editor-toolbar">
              <select defaultValue="Normal" aria-label="Format teks">
                <option>Normal</option>
                <option>Heading</option>
              </select>
              <button type="button">B</button>
              <button type="button">I</button>
              <button type="button">U</button>
              <button type="button">=</button>
              <button type="button">#</button>
              <button type="button">/</button>
              <button type="button">[]</button>
              <button type="button">&lt;&gt;</button>
            </div>
            <textarea ref={fullDescriptionRef} className={`admin-tutorial-create-editor ${errors.fullDescription ? 'is-error' : ''}`} name="fullDescription" value={formData.fullDescription} onChange={handleChange} rows="5" placeholder="Deskripsi lengkap materi..." aria-invalid={Boolean(errors.fullDescription)} />
            {errors.fullDescription && <small className="admin-tutorial-error">{errors.fullDescription}</small>}
          </label>

          <div ref={cardImageSectionRef} className="admin-tutorial-image-field">
            <span className="admin-tutorial-label">
              Gambar / Icon (untuk card)<span className="admin-tutorial-required">*</span>
            </span>
            <input ref={cardImageInputRef} id="tutorial-card-image" className="admin-tutorial-file-input" type="file" accept=".jpg,.jpeg,.png,.svg" onChange={handleImageChange} aria-invalid={Boolean(errors.cardImage)} />
            <label className={`admin-tutorial-upload-box ${errors.cardImage ? 'is-error' : ''}`} htmlFor="tutorial-card-image">
              {cardImagePreview ? (
                <img src={cardImagePreview} alt="Preview gambar materi" />
              ) : (
                <span aria-hidden="true">[]</span>
              )}
              {formData.cardImage ? (
                <>
                  <p>{formData.cardImage.name}</p>
                  <small>{(formData.cardImage.size / (1024 * 1024)).toFixed(2)} MB</small>
                </>
              ) : (
                <>
                  <p>Drag & drop atau klik untuk upload</p>
                  <small>Format: JPG, PNG, SVG. Maksimal 3MB</small>
                </>
              )}
            </label>
            {errors.cardImage && <small className="admin-tutorial-error">{errors.cardImage}</small>}
          </div>

          <div className="admin-tutorial-create-two">
            <label>
              Level Kesulitan
              <select name="difficultyLevel" value={formData.difficultyLevel} onChange={handleChange}>
                <option>Level Pemula</option>
                <option>Level Dasar</option>
                <option>Level Lanjutan</option>
              </select>
            </label>

            <label>
              Estimasi Waktu Belajar
              <input type="text" name="estimatedTime" value={formData.estimatedTime} onChange={handleChange} />
              <small>Contoh: 2-4 jam, 1 minggu, dan lainnya</small>
            </label>
          </div>
        </section>

        <section className={`admin-tutorial-create-card admin-tutorial-slides-card ${errors.slides ? 'is-section-error' : ''}`}>
          <div className="admin-tutorial-card-head">
            <div>
              <h2>Daftar Materi / Slide</h2>
              <p>Buat, urutkan, dan kelola slide materi. Materi akan ditampilkan berurutan kepada pengguna.</p>
            </div>
            <button type="button" onClick={handleAddSlide}>Tambah Slide</button>
          </div>

          <div className="admin-tutorial-slide-list">
            {slides.length === 0 ? (
              <p>Belum ada slide. Klik Tambah Slide untuk mulai mengisi materi.</p>
            ) : slides.map((slide, index) => (
              <article key={slide.id}>
                <span>::</span>
                <strong>{index + 1}</strong>
                <b>{slide.title}</b>
                <small>{toContentLabel(slide.contentType)}</small>
                <div aria-hidden="true">[] o x</div>
              </article>
            ))}
          </div>

          {errors.slides && <small className="admin-tutorial-error">{errors.slides}</small>}
          <p className="admin-tutorial-tip">i Tips: Drag & drop untuk mengubah urutan materi.</p>

          <div className="admin-tutorial-slide-stats">
            {infoSlideStatistics.map((item) => (
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
                Urutan Tampil di Halaman<span className="admin-tutorial-required">*</span>
              </span>
              <select ref={pageOrderRef} className={errors.pageOrder ? 'is-error' : ''} value={formData.pageSettings.pageOrder} onChange={(event) => handleNestedChange('pageSettings', 'pageOrder', event.target.value)} aria-invalid={Boolean(errors.pageOrder)}>
                <option value="" disabled>Pilih urutan</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
              {errors.pageOrder && <small className="admin-tutorial-error">{errors.pageOrder}</small>}
            </label>
            <label>
              Status
              <select value={formData.pageSettings.status} onChange={(event) => handleNestedChange('pageSettings', 'status', event.target.value)}>
                <option>Draft</option>
                <option>Published</option>
                <option>Pending Review</option>
              </select>
              <small>Draft, Published, atau Pending Review</small>
            </label>
            <h3>Pengaturan Akses (Opsional)</h3>
            <label>
              Level Pengguna
              <select value={formData.accessSettings.userLevel} onChange={(event) => handleNestedChange('accessSettings', 'userLevel', event.target.value)}>
                <option>Semua Pengguna</option>
                <option>Member</option>
                <option>Admin</option>
              </select>
            </label>
            <label>
              Syarat Akses (Opsional)
              <input type="text" value={formData.accessSettings.accessRequirement} onChange={(event) => handleNestedChange('accessSettings', 'accessRequirement', event.target.value)} placeholder="Contoh: harus login, sudah daftar, dll" />
            </label>
          </section>

          <section className="admin-tutorial-create-card admin-tutorial-preview-card">
            <h2>Preview Card (Halaman User)</h2>
            <article>
              <strong>{formData.title || 'Judul Materi'}</strong>
              <p>{formData.shortDescription || 'Deskripsi singkat materi akan tampil di sini.'}</p>
              <small>{formData.difficultyLevel}</small>
              <small>{formData.estimatedTime}</small>
            </article>
          </section>

          <section className="admin-tutorial-create-card admin-tutorial-order-preview">
            <h2>Preview Urutan Slide (Ringkasan)</h2>
            <div className="admin-tutorial-page-dots">
              <button type="button" disabled>&lt;</button>
              {slides.length === 0 ? (
                <button type="button" className="is-active">0</button>
              ) : slides.slice(0, 5).map((slide, index) => (
                <button
                  type="button"
                  className={index === 0 ? 'is-active' : ''}
                  key={slide.id}
                >
                  {index + 1}
                </button>
              ))}
              <button type="button">&gt;</button>
            </div>
            <article>
              <span aria-hidden="true">[]</span>
              <div>
                <small>Slide 1 dari {slides.length}</small>
                <strong>{slides[0]?.title || 'Belum ada slide'}</strong>
              </div>
            </article>
          </section>
        </aside>
      </div>

      <div className="admin-tutorial-create-actions">
        <a href="/admin/tutorial">Kembali</a>
        <button type="button" onClick={() => goToStep(2)}>Lanjut ke daftar materi</button>
      </div>
    </>
  );

  const renderMaterialsStep = () => (
    <>
      <div className="admin-materials-layout">
        <section className="admin-materials-main">
          <div className="admin-materials-toolbar">
            <button type="button" onClick={handleAddSlide}>+ Tambah Materi</button>
            <button type="button" onClick={() => setShowFilter((value) => !value)}>Filter</button>
            <label>
              <span aria-hidden="true">o</span>
              <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cari materi..." />
            </label>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} aria-label="Urutkan materi">
              <option value="asc">Urutkan: Urutan (Naik)</option>
              <option value="desc">Urutkan: Urutan (Turun)</option>
            </select>
          </div>

          {showFilter && (
            <div className="admin-materials-filter">
              <label>
                Status
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option>Semua Status</option>
                  <option>Published</option>
                  <option>Draft</option>
                </select>
              </label>
              <button type="button" onClick={() => {
                setSearchQuery('');
                setStatusFilter('Semua Status');
                setSortMode('asc');
              }}>Reset Filter</button>
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
              {filteredSlides.length === 0 ? (
                <article className="admin-materials-empty-row">
                  <span>Belum ada materi. Klik Tambah Materi untuk membuat slide pertama.</span>
                </article>
              ) : filteredSlides.map((slide, index) => (
                <article className={selectedSlideId === slide.id ? 'is-selected' : ''} key={slide.id} onClick={() => setSelectedSlideId(slide.id)}>
                  <button type="button" className="admin-materials-row-handle" aria-label={`Pilih ${slide.title}`}>::</button>
                  <strong>{index + 1}</strong>
                  <span>{slide.title}</span>
                  <span>[] {toContentLabel(slide.contentType)}</span>
                  <span>o {slide.estimatedTime}</span>
                  <button type="button" className={`admin-materials-status ${slide.status === 'Published' ? 'is-published' : 'is-draft'}`} onClick={(event) => {
                    event.stopPropagation();
                    toggleSlideStatus(slide.id);
                  }}>{slide.status}</button>
                  <div className="admin-materials-actions">
                    <button type="button" onClick={(event) => {
                      event.stopPropagation();
                      setSelectedSlideId(slide.id);
                      setEditingSlideId(slide.id);
                    }}>Edit</button>
                    <button type="button" onClick={(event) => {
                      event.stopPropagation();
                      duplicateSlide(slide.id);
                    }}>Copy</button>
                    <button type="button" onClick={(event) => {
                      event.stopPropagation();
                      removeSlide(slide.id);
                    }}>Hapus</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {editingSlide && (
            <section className="admin-materials-editor">
              <div className="admin-materials-editor-head">
                <div>
                  <h2>Edit Materi Terpilih</h2>
                  <p>Isi konten slide yang akan dikirim ke database.</p>
                </div>
                <button type="button" onClick={() => setEditingSlideId(null)}>
                  Selesai
                </button>
              </div>

              <div className="admin-materials-editor-grid">
                <label>
                  Judul Materi
                  <input
                    value={editingSlide.title}
                    onChange={(event) =>
                      updateSlideField(editingSlide.id, 'title', event.target.value)
                    }
                  />
                </label>

                <label>
                  Tipe Konten
                  <select
                    value={editingSlide.contentType}
                    onChange={(event) =>
                      updateSlideField(editingSlide.id, 'contentType', event.target.value)
                    }
                  >
                    {contentTypeOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Estimasi Waktu
                  <input
                    value={editingSlide.estimatedTime}
                    onChange={(event) =>
                      updateSlideField(editingSlide.id, 'estimatedTime', event.target.value)
                    }
                  />
                </label>

                <label>
                  Status
                  <select
                    value={editingSlide.status}
                    onChange={(event) =>
                      updateSlideField(editingSlide.id, 'status', event.target.value)
                    }
                  >
                    <option>Draft</option>
                    <option>Published</option>
                  </select>
                </label>
              </div>

              <label className="admin-materials-editor-wide">
                Konten Materi
                <textarea
                  rows="7"
                  value={editingSlide.content || ''}
                  onChange={(event) =>
                    updateSlideField(editingSlide.id, 'content', event.target.value)
                  }
                  placeholder="Tulis isi materi atau instruksi praktik..."
                />
              </label>

              <div className="admin-materials-editor-grid">
                <label>
                  URL Video
                  <input
                    value={editingSlide.videoUrl || ''}
                    onChange={(event) =>
                      updateSlideField(editingSlide.id, 'videoUrl', event.target.value)
                    }
                    placeholder="https://..."
                  />
                </label>

                <div className="admin-materials-editor-upload">
                  <strong>Gambar Slide</strong>
                  <button type="button" onClick={() => slideImageInputRef.current?.click()}>
                    {editingSlide.imageName || 'Upload Gambar Slide'}
                  </button>
                  <input
                    ref={slideImageInputRef}
                    className="admin-tutorial-file-input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.svg"
                    onChange={handleSlideImageChange}
                  />
                </div>
              </div>
            </section>
          )}

          <p className="admin-materials-tip">i Tips: Drag & drop pada ikon titik untuk mengubah urutan materi.</p>

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
                <article className={selectedSlideId === slide.id ? 'is-active' : ''} key={slide.id} onClick={() => setSelectedSlideId(slide.id)}>
                  <strong>{index + 1}</strong>
                  <span>{slide.title}</span>
                  <small>{slide.status}</small>
                </article>
              ))}
            </div>
            <b>Total {slides.length} Materi</b>
          </section>

          <section className="admin-materials-selected-preview">
            <h2>Preview Materi Terpilih</h2>
            <h3>#{selectedSlide ? slides.findIndex((slide) => slide.id === selectedSlide.id) + 1 : 0} {selectedSlide?.title || 'Belum ada materi'}</h3>
            <div className={`admin-materials-image-placeholder ${selectedSlideImage ? 'has-image' : ''}`} aria-hidden="true">
              {selectedSlideImage ? (
                <img src={selectedSlideImage} alt="" />
              ) : (
                <span />
              )}
            </div>
            <p>
              <span>[] {selectedSlide ? toContentLabel(selectedSlide.contentType) : '-'}</span>
              <span>o {selectedSlide?.estimatedTime || '-'}</span>
            </p>
          </section>
        </aside>
      </div>

      <div className="admin-tutorial-create-actions">
        <button type="button" className="is-secondary" onClick={() => goToStep(1)}>Kembali ke informasi</button>
        <button type="button" onClick={() => goToStep(3)}>Lanjut ke pengaturan</button>
      </div>
    </>
  );

  const renderSettingsStep = () => (
    <>
      <div className="admin-settings-layout">
        <section className="admin-settings-main">
          <section className="admin-settings-card admin-settings-visibility">
            <h2>Status & Visibilitas</h2>
            <div className="admin-settings-grid three">
              <label>
                Status Publikasi
                <select value={formData.pageSettings.status} onChange={(event) => handleNestedChange('pageSettings', 'status', event.target.value)}>
                  <option>Draft</option>
                  <option>Published</option>
                  <option>Pending Review</option>
                </select>
                <small>Draft, Published, atau Pending Review</small>
              </label>
              <div className="admin-settings-toggle-item">
                <strong>Aktif / Nonaktif</strong>
                <button type="button" className={formData.pageSettings.active ? 'is-on' : ''} onClick={() => handleNestedChange('pageSettings', 'active', !formData.pageSettings.active)}><span /></button>
                <small>Nonaktifkan akan menyembunyikan materi.</small>
              </div>
              <div className="admin-settings-toggle-item">
                <strong>Tampilkan di halaman</strong>
                <p>Pilih Jalur Belajarmu</p>
                <button type="button" className={formData.pageSettings.showOnPage ? 'is-on' : ''} onClick={() => handleNestedChange('pageSettings', 'showOnPage', !formData.pageSettings.showOnPage)}><span /></button>
                <small>Akan tampil pada halaman pilih jalur belajarmu.</small>
              </div>
              <div className="admin-settings-toggle-item">
                <strong>Featured (Unggulan)</strong>
                <button type="button" className={formData.pageSettings.featured ? 'is-on' : ''} onClick={() => handleNestedChange('pageSettings', 'featured', !formData.pageSettings.featured)}><span /></button>
                <p>{formData.pageSettings.featured ? 'Ya' : 'Tidak'}</p>
                <small>Materi akan ditandai sebagai unggulan.</small>
              </div>
              <div className="admin-settings-toggle-item">
                <strong>Izinkan Komentar / Diskusi</strong>
                <button type="button" className={formData.pageSettings.comments ? 'is-on' : ''} onClick={() => handleNestedChange('pageSettings', 'comments', !formData.pageSettings.comments)}><span /></button>
                <p>{formData.pageSettings.comments ? 'Izinkan' : 'Tutup'}</p>
                <small>Pengguna dapat berkomentar atau berdiskusi.</small>
              </div>
              <div className="admin-settings-radio-item">
                <strong>Akses Materi</strong>
                <label><input type="radio" checked={formData.pageSettings.accessType === 'Gratis'} onChange={() => handleNestedChange('pageSettings', 'accessType', 'Gratis')} /> Gratis (bisa diakses semua orang)</label>
                <label><input type="radio" checked={formData.pageSettings.accessType === 'Perlu login / Akun'} onChange={() => handleNestedChange('pageSettings', 'accessType', 'Perlu login / Akun')} /> Perlu login / Akun</label>
                <small>Pilih siapa yang dapat mengakses materi ini.</small>
              </div>
            </div>
          </section>

          <section className="admin-settings-card">
            <h2>Pengelompokan & Tampilan</h2>
            <div className="admin-settings-grid four">
              <label>
                Kategori / Jalur
                <select name="category" value={formData.category} onChange={handleChange}>
                  <option value="">Panduan Epic</option>
                  <option value="panduan-pemula">Panduan Pemula</option>
                  <option value="penggunaan-ide">Penggunaan IDE</option>
                </select>
                <small>Pilih jalur atau kategori materi.</small>
              </label>
              <label>
                Level Kesulitan
                <select name="difficultyLevel" value={formData.difficultyLevel} onChange={handleChange}>
                  <option>Level Pemula</option>
                  <option>Level Legend</option>
                  <option>Level Dasar</option>
                </select>
                <small>Tingkat kesulitan materi.</small>
              </label>
              <label>
                Urutan Tampil di Halaman
                <input ref={pageOrderRef} className={errors.pageOrder ? 'is-error' : ''} value={formData.pageSettings.pageOrder} onChange={(event) => handleNestedChange('pageSettings', 'pageOrder', event.target.value)} placeholder="1" />
                <small>Semakin kecil, semakin di atas.</small>
              </label>
              <label>
                Featured Order (opsional)
                <input value={formData.pageSettings.featuredOrder} onChange={(event) => handleNestedChange('pageSettings', 'featuredOrder', event.target.value)} />
                <small>Urutan tampil di bagian featured.</small>
              </label>
            </div>
          </section>

          <section className="admin-settings-card">
            <h2>Estimasi & Durasi</h2>
            <div className="admin-settings-grid three">
              <label>
                Estimasi Total Durasi
                <input name="estimatedTime" value={formData.estimatedTime} onChange={handleChange} />
              </label>
              <div className="admin-settings-upload">
                <strong>Gambar / Icon (untuk card) *</strong>
                <label htmlFor="tutorial-card-image-settings">
                  {cardImagePreview ? (
                    <img src={cardImagePreview} alt="Preview gambar materi" />
                  ) : (
                    <span>[]</span>
                  )}
                  <p>Drag & drop atau klik untuk upload</p>
                  <small>Format: JPG, PNG, SVG. Maksimal 3MB</small>
                </label>
                <input id="tutorial-card-image-settings" className="admin-tutorial-file-input" type="file" accept=".jpg,.jpeg,.png,.svg" onChange={handleImageChange} />
              </div>
              <button type="button" className="admin-settings-library">Pilih dari Library</button>
            </div>
          </section>

          <div className="admin-settings-split">
            <section className="admin-settings-card">
              <h2>Syarat Akses (Opsional)</h2>
              <label className="admin-settings-radio-line"><input type="radio" checked={formData.accessSettings.userLevel === 'Semua Pengguna'} onChange={() => handleNestedChange('accessSettings', 'userLevel', 'Semua Pengguna')} /> Semua Pengguna</label>
              <label className="admin-settings-radio-line"><input type="radio" checked={formData.accessSettings.userLevel !== 'Semua Pengguna'} onChange={() => handleNestedChange('accessSettings', 'userLevel', 'Level Tertentu')} /> Hanya pengguna dengan level tertentu</label>
              <small>Batasi akses materi berdasarkan level pengguna.</small>
            </section>
            <section className="admin-settings-card">
              <h2>Prasyarat Belajar (Opsional)</h2>
              <select value={formData.accessSettings.prerequisite} onChange={(event) => handleNestedChange('accessSettings', 'prerequisite', event.target.value)}>
                <option>Tidak ada prasyarat</option>
                {slides.map((slide, index) => (
                  <option key={slide.id} value={slide.title || `Slide ${index + 1}`}>
                    {slide.title || `Slide ${index + 1}`}
                  </option>
                ))}
              </select>
              <small>Pilih materi yang harus diselesaikan terlebih dahulu.</small>
            </section>
          </div>

          <section className="admin-settings-card admin-settings-bottom">
            <div>
              <label>
                Tombol CTA (Call to Action)
                <input name="ctaText" value={formData.ctaText} onChange={handleChange} />
                <small>Teks pada tombol di card materi.</small>
              </label>
              <label>
                URL Slug (Opsional)
                <span>https://arduflow.com/materi/</span>
                <input name="urlSlug" value={formData.urlSlug} onChange={handleChange} />
                <small>Gunakan huruf kecil, angka, dan tanda hubung(-).</small>
              </label>
            </div>
            <div>
              <label>
                Link Tujuan
                <select name="targetLink" value={formData.targetLink} onChange={handleChange}>
                  <option>Materi Pertama</option>
                  <option>Daftar Materi</option>
                </select>
                <small>Arahkan ke materi tertentu.</small>
              </label>
              <label>
                Jadwal Publikasi (Opsional)
                <input type="date" name="publishSchedule" value={formData.publishSchedule} onChange={handleChange} />
                <small>Kosongkan jika ingin dipublikasikan segera.</small>
              </label>
            </div>
          </section>
        </section>

        <aside className="admin-settings-side">
          <section className="admin-settings-user-preview">
            <h2>Preview di Halaman User</h2>
            <article>
              {cardImagePreview ? (
                <img
                  className="admin-settings-preview-image"
                  src={cardImagePreview}
                  alt=""
                />
              ) : (
                <div className="admin-settings-preview-image" aria-hidden="true" />
              )}
              <div>
                <small>{formData.difficultyLevel}</small>
                <strong>{formData.title || 'Judul materi'}</strong>
                <p>{formData.shortDescription || 'Deskripsi singkat materi akan tampil di sini.'}</p>
                <span>o {formData.estimatedTime || '-'}</span>
                <span>[] {slides.length} slide</span>
                <span>* Gratis</span>
              </div>
              <button type="button">{formData.ctaText}</button>
            </article>
          </section>

          <section className="admin-settings-info">
            <h2>Informasi</h2>
            {[
              ['Status Publikasi', formData.pageSettings.status],
              ['Aktif / Nonaktif', formData.pageSettings.active ? 'Aktif' : 'Nonaktif'],
              ['Tampilkan di halaman', formData.pageSettings.showOnPage ? 'Ya' : 'Tidak'],
              ['Featured', formData.pageSettings.featured ? 'Ya' : 'Tidak'],
              ['Akses Materi', formData.pageSettings.accessType],
              ['Kategori / Jalur', formData.category || '-'],
              ['Level Kesulitan', formData.difficultyLevel],
              ['Urutan Tampil', formData.pageSettings.pageOrder || '-'],
              ['Estimasi Total Durasi', formData.estimatedTime],
              ['Thumbnail / Icon', formData.cardImage ? formData.cardImage.name : 'Belum diunggah'],
              ['Syarat Akses', formData.accessSettings.userLevel],
              ['Prasyarat Belajar', formData.accessSettings.prerequisite],
              ['CTA Button', `${formData.ctaText} -> ${formData.targetLink}`],
              ['URL Slug', formData.urlSlug ? `/materi/${formData.urlSlug}` : '-'],
              ['Jadwal Publikasi', formData.publishSchedule || 'Segera'],
            ].map((item) => (
              <p key={item[0]}>
                <span>{item[0]}</span>
                <strong>{item[1]}</strong>
              </p>
            ))}
          </section>
        </aside>
      </div>

      {submitMessage && (
        <div className={`admin-tutorial-submit-message ${submitStatus === 'error' ? 'is-error' : 'is-success'}`} role="alert" aria-live="assertive">
          <strong>{submitStatus === 'error' ? 'Form belum berhasil diproses' : 'Form berhasil diproses'}</strong>
          <p>{submitMessage}</p>
        </div>
      )}

      <div className="admin-settings-actions">
        <button type="button" onClick={(event) => handleSubmit(event, 'draft')} disabled={isSubmitting}>Simpan Draft</button>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Publikasikan <> '}</button>
      </div>

      {(requestJson || responseJson) && (
        <section className="admin-tutorial-debug-section">
          <div className="admin-tutorial-debug-title">
            <h2>Debug Form Tambah Materi</h2>
            <p>Request dan response API.</p>
          </div>
          {requestJson && (
            <article className="admin-tutorial-debug-card">
              <div className="admin-tutorial-debug-header">
                <div>
                  <h3>Request JSON</h3>
                  <span>POST {ARTICLE_API_URL}</span>
                </div>
                <button type="button" onClick={() => copyJson(requestJson)}>Salin JSON</button>
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
                <button type="button" onClick={() => copyJson(responseJson)}>Salin JSON</button>
              </div>
              <pre>{JSON.stringify(responseJson, null, 2)}</pre>
            </article>
          )}
        </section>
      )}
    </>
  );

  return (
    <main className="admin-tutorial-create-page">
      <section className="admin-tutorial-create-header">
        <h1>Tambah Materi</h1>
        <p>
          {activeStep === 2
            ? 'Buat, urutkan, dan kelola sub materi (slide) untuk materi utama "Panduan Pemula".'
            : activeStep === 3
              ? 'Atur bagaimana materi ditampilkan dan dipublikasikan di platform.'
              : 'Buat materi baru untuk ditampilkan pada halaman Pilih Jalur Belajarmu.'}
        </p>
      </section>

      {renderSteps()}

      <form onSubmit={(event) => handleSubmit(event, 'publish')} noValidate>
        {activeStep === 1 && renderInformationStep()}
        {activeStep === 2 && renderMaterialsStep()}
        {activeStep === 3 && renderSettingsStep()}
      </form>
    </main>
  );
}
