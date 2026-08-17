import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import '../../styles/admin-tutorial-create.css';
import { TinyMCEEditor } from '../../components/TinyMCEEditor.jsx';
import { API_BASE_URL, apiEndpoint } from '../../services/apiEndpoints.js';
import {
  showConfirmAlert,
  showErrorAlert,
  showPromptAlert,
  showSuccessAlert,
} from '../../utils/alerts.js';
const TUTORIAL_API_URL = (
  import.meta.env.VITE_TUTORIAL_API_URL ||
  'http://192.168.130.11:8000/api/'
).replace(/\/+$/, '');

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
  contentTypeOptions.find(([value]) => value === contentType)?.[1] || contentType;

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

  const titleRef = useRef(null);
  const slugRef = useRef(null);
  const categoryRef = useRef(null);
  const displayOrderRef = useRef(null);
  const shortDescriptionRef = useRef(null);
  const fullDescriptionRef = useRef(null);
  const cardImageSectionRef = useRef(null);
  const cardImageInputRef = useRef(null);
  const slideImageInputRef = useRef(null);
  const slideVideoInputRef = useRef(null);
  const pageOrderRef = useRef(null);

  const fullDescriptionEditor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Underline,
    ],
    content: formData.fullDescription || '',
    editorProps: {
      attributes: {
        class: 'admin-tutorial-tiptap-content',
        'aria-label': 'Deskripsi lengkap materi',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? '' : editor.getHTML();

      setFormData((previousData) => ({
        ...previousData,
        fullDescription: html,
      }));

      setErrors((previousErrors) => {
        if (!previousErrors.fullDescription) {
          return previousErrors;
        }

        const updatedErrors = { ...previousErrors };
        delete updatedErrors.fullDescription;
        return updatedErrors;
      });

      setSubmitMessage('');
      setSubmitStatus('idle');
    },
  });

  const fullDescriptionEditorState = useEditorState({
    editor: fullDescriptionEditor,
    selector: ({ editor }) => {
      if (!editor) {
        return {
          isBold: false,
          isItalic: false,
          isUnderline: false,
          isBulletList: false,
          isOrderedList: false,
          isBlockquote: false,
          isCodeBlock: false,
          isHeading2: false,
          isHeading3: false,
          canUndo: false,
          canRedo: false,
        };
      }

      return {
        isBold: editor.isActive('bold'),
        isItalic: editor.isActive('italic'),
        isUnderline: editor.isActive('underline'),
        isBulletList: editor.isActive('bulletList'),
        isOrderedList: editor.isActive('orderedList'),
        isBlockquote: editor.isActive('blockquote'),
        isCodeBlock: editor.isActive('codeBlock'),
        isHeading2: editor.isActive('heading', { level: 2 }),
        isHeading3: editor.isActive('heading', { level: 3 }),
        canUndo: editor.can().chain().focus().undo().run(),
        canRedo: editor.can().chain().focus().redo().run(),
      };
    },
  });

  const setDescriptionFormat = (value) => {
    if (!fullDescriptionEditor) return;

    if (value === 'heading-2') {
      fullDescriptionEditor.chain().focus().toggleHeading({ level: 2 }).run();
      return;
    }

    if (value === 'heading-3') {
      fullDescriptionEditor.chain().focus().toggleHeading({ level: 3 }).run();
      return;
    }

    fullDescriptionEditor.chain().focus().setParagraph().run();
  };

  const setDescriptionLink = () => {
    if (!fullDescriptionEditor) return;

    const previousUrl =
      fullDescriptionEditor.getAttributes('link').href || '';

    const url = window.prompt(
      'Masukkan URL link:',
      previousUrl
    );

    if (url === null) return;

    const normalizedUrl = url.trim();

    if (!normalizedUrl) {
      fullDescriptionEditor
        .chain()
        .focus()
        .extendMarkRange('link')
        .unsetLink()
        .run();
      return;
    }

    const href = /^(https?:\/\/|mailto:|tel:)/i.test(normalizedUrl)
      ? normalizedUrl
      : `https://${normalizedUrl}`;

    fullDescriptionEditor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href })
      .run();
  };

  const selectedSlide =
    slides.find((slide) => slide.id === selectedSlideId) || slides[0] || null;
  const editingSlide =
    slides.find((slide) => slide.id === editingSlideId) || null;
  const selectedSlideImage = selectedSlide?.imagePreview || cardImagePreview;
  const selectedSlideVideo =
    selectedSlide?.videoSourceType === 'file'
      ? selectedSlide?.videoPreview || ''
      : selectedSlide?.videoUrl || '';

  useEffect(() => {
    if (!formData.cardImage) {
      setCardImagePreview('');
      return undefined;
    }

    const nextPreview = URL.createObjectURL(formData.cardImage);
    setCardImagePreview(nextPreview);

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
  }, [slides]);

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
      estimatedTime: '2-4 jam',
      status: 'Draft',
      bodyText: '',
      imagePreview: '',
      imageName: '',
      imageFile: null,
      videoSourceType: 'url',
      videoUrl: '',
      videoFile: null,
      videoName: '',
      videoPreview: '',
    };

    setSlides((previousSlides) => [...previousSlides, newSlide]);
    setSelectedSlideId(newSlide.id);
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

  const removeSlide = (slideId) => {
    setSlides((previousSlides) => {
      const updatedSlides = previousSlides.filter((slide) => slide.id !== slideId);

      if (selectedSlideId === slideId) {
        setSelectedSlideId(updatedSlides[0]?.id || null);
      }

      return updatedSlides;
    });
  };

  const openSlideEditor = (slideId) => {
    const slide = slides.find((item) => item.id === slideId);
    if (!slide) return;

    setSelectedSlideId(slideId);
    setEditingSlideId(slideId);
  };

  const updateSlideField = (slideId, fieldName, value) => {
    setSlides((previousSlides) =>
      previousSlides.map((item) =>
        item.id === slideId
          ? {
              ...item,
              [fieldName]: value,
            }
          : item
      )
    );
  };

  const handleSlideImageChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile || !editingSlideId) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateSlideField(
        editingSlideId,
        'imagePreview',
        typeof reader.result === 'string' ? reader.result : ''
      );
      updateSlideField(editingSlideId, 'imageName', selectedFile.name);
      updateSlideField(editingSlideId, 'imageFile', selectedFile);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSlideVideoChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile || !editingSlideId) return;

    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];

    if (!allowedTypes.includes(selectedFile.type)) {
      window.alert('Format video harus MP4, WEBM, atau OGG.');
      event.target.value = '';
      return;
    }

    const maxVideoSize = 50 * 1024 * 1024;

    if (selectedFile.size > maxVideoSize) {
      window.alert('Ukuran video maksimal 50 MB.');
      event.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(selectedFile);

    setSlides((previousSlides) =>
      previousSlides.map((slide) => {
        if (slide.id !== editingSlideId) return slide;

        if (
          slide.videoPreview &&
          String(slide.videoPreview).startsWith('blob:')
        ) {
          URL.revokeObjectURL(slide.videoPreview);
        }

        return {
          ...slide,
          videoSourceType: 'file',
          videoFile: selectedFile,
          videoName: selectedFile.name,
          videoPreview: previewUrl,
          videoUrl: '',
        };
      })
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
    const fullDescriptionText =
      fullDescriptionEditor?.getText().trim() ||
      formData.fullDescription
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();

    if (!fullDescriptionText) {
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

      if (firstInvalidField === 'fullDescription') {
        fullDescriptionEditor?.chain().focus().run();
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
    slides: slides.map((slide, index) => {
      const usesText = ['text', 'text_image'].includes(slide.contentType);
      const usesImage = ['image', 'text_image'].includes(slide.contentType);
      const usesVideo = slide.contentType === 'video';

      return {
        id: slide.id,
        order: index + 1,
        title: slide.title,
        content_type: slide.contentType,
        estimated_time: slide.estimatedTime,
        body_text: usesText ? slide.bodyText || '' : '',
        image:
          usesImage && (slide.imagePreview || slide.imageFile)
            ? {
                file_name:
                  slide.imageName || `slide-${index + 1}.png`,
                file_type: slide.imageFile?.type || null,
                file_size: slide.imageFile?.size || null,
                upload_field: slide.imageFile
                  ? `slide_image_${index}`
                  : null,
              }
            : null,
        video_url:
          usesVideo && slide.videoSourceType === 'url'
            ? slide.videoUrl?.trim() || null
            : null,
        video:
          usesVideo &&
          slide.videoSourceType === 'file' &&
          slide.videoFile
            ? {
                file_name: slide.videoFile.name,
                file_type: slide.videoFile.type,
                file_size: slide.videoFile.size,
                upload_field: `slide_video_${index}`,
              }
            : null,
        status: slide.status.toLowerCase(),
      };
    }),
    metadata: {
      source: 'admin_tutorial_create_form',
      frontend_route: window.location.pathname,
      request_method: 'POST',
      endpoint: `${TUTORIAL_API_URL}/article-api.php`,
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
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    const requestController = new AbortController();
    const requestTimeout = window.setTimeout(() => {
      requestController.abort();
    }, 60000);

    try {
      const requestFormData = new FormData();
      requestFormData.append(
        'payload',
        JSON.stringify({ ...payload, action: mode })
      );

      if (formData.cardImage) {
        requestFormData.append('card_image', formData.cardImage);
      }

      slides.forEach((slide, index) => {
        if (
          ['image', 'text_image'].includes(slide.contentType) &&
          slide.imageFile
        ) {
          requestFormData.append(
            `slide_image_${index}`,
            slide.imageFile,
            slide.imageFile.name
          );
        }

        if (
          slide.contentType === 'video' &&
          slide.videoSourceType === 'file' &&
          slide.videoFile
        ) {
          requestFormData.append(
            `slide_video_${index}`,
            slide.videoFile,
            slide.videoFile.name
          );
        }
      });

      const response = await fetch(`${TUTORIAL_API_URL}/article-api.php`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: requestFormData,
        signal: requestController.signal,
      });

      const responseText = await response.text();
      const result = responseText ? JSON.parse(responseText) : {};
      const apiResponse = { status_code: response.status, ...result };

      setResponseJson(apiResponse);

      if (!response.ok) {
        setSubmitStatus('error');
        setSubmitMessage(result.message || 'Data materi gagal disimpan.');
        return;
      }

      setSubmitStatus('success');
      setSubmitMessage(result.message || 'Materi berhasil diproses.');
    } catch (error) {
      const isTimeout = error.name === 'AbortError';
      setResponseJson({
        success: false,
        status_code: 0,
        message: isTimeout
          ? 'Request terlalu lama. Coba periksa koneksi API atau ukuran gambar.'
          : 'Tidak dapat terhubung ke API.',
        error: { type: error.name, detail: error.message },
      });
      setSubmitStatus('error');
      setSubmitMessage(
        isTimeout
          ? 'Request terlalu lama. Data belum tersimpan, coba kompres gambar atau cek server API.'
          : 'Tidak dapat terhubung ke API. Pastikan server sudah berjalan.'
      );
    } finally {
      window.clearTimeout(requestTimeout);
      setIsSubmitting(false);
    }
  };

  const copyJson = async (data) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      window.alert('JSON berhasil disalin.');
    } catch (error) {
      console.error('Gagal menyalin JSON:', error);
      window.alert('JSON gagal disalin.');
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
      <div className="admin-tutorial-create-info-layout">
        <section className="admin-tutorial-create-card admin-tutorial-create-form-card">
          <div className="admin-tutorial-create-section-heading">
            <span>Langkah 1</span>
            <h2>Informasi Utama Materi</h2>
            <p>Lengkapi informasi dasar yang akan tampil pada halaman tutorial.</p>
          </div>

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

          <div
            ref={fullDescriptionRef}
            className="admin-tutorial-tiptap-field"
          >
            <span className="admin-tutorial-label">
              Deskripsi Lengkap
              <span className="admin-tutorial-required">*</span>
            </span>

            <div
              className={`admin-tutorial-tiptap ${
                errors.fullDescription ? 'is-error' : ''
              }`}
            >
              <div
                className="admin-tutorial-tiptap-toolbar"
                role="toolbar"
                aria-label="Toolbar deskripsi lengkap"
              >
                <select
                  aria-label="Format paragraf"
                  value={
                    fullDescriptionEditorState?.isHeading2
                      ? 'heading-2'
                      : fullDescriptionEditorState?.isHeading3
                        ? 'heading-3'
                        : 'paragraph'
                  }
                  onChange={(event) =>
                    setDescriptionFormat(event.target.value)
                  }
                  disabled={!fullDescriptionEditor}
                >
                  <option value="paragraph">Normal</option>
                  <option value="heading-2">Heading 2</option>
                  <option value="heading-3">Heading 3</option>
                </select>

                <span className="admin-tutorial-tiptap-divider" />

                <button
                  type="button"
                  className={
                    fullDescriptionEditorState?.isBold
                      ? 'is-active'
                      : ''
                  }
                  onClick={() =>
                    fullDescriptionEditor
                      ?.chain()
                      .focus()
                      .toggleBold()
                      .run()
                  }
                  aria-label="Bold"
                  title="Bold"
                >
                  <b>B</b>
                </button>

                <button
                  type="button"
                  className={
                    fullDescriptionEditorState?.isItalic
                      ? 'is-active'
                      : ''
                  }
                  onClick={() =>
                    fullDescriptionEditor
                      ?.chain()
                      .focus()
                      .toggleItalic()
                      .run()
                  }
                  aria-label="Italic"
                  title="Italic"
                >
                  <i>I</i>
                </button>

                <button
                  type="button"
                  className={
                    fullDescriptionEditorState?.isUnderline
                      ? 'is-active'
                      : ''
                  }
                  onClick={() =>
                    fullDescriptionEditor
                      ?.chain()
                      .focus()
                      .toggleUnderline()
                      .run()
                  }
                  aria-label="Underline"
                  title="Underline"
                >
                  <u>U</u>
                </button>

                <span className="admin-tutorial-tiptap-divider" />

                <button
                  type="button"
                  className={
                    fullDescriptionEditorState?.isBulletList
                      ? 'is-active'
                      : ''
                  }
                  onClick={() =>
                    fullDescriptionEditor
                      ?.chain()
                      .focus()
                      .toggleBulletList()
                      .run()
                  }
                  aria-label="Bullet list"
                  title="Bullet list"
                >
                  • List
                </button>

                <button
                  type="button"
                  className={
                    fullDescriptionEditorState?.isOrderedList
                      ? 'is-active'
                      : ''
                  }
                  onClick={() =>
                    fullDescriptionEditor
                      ?.chain()
                      .focus()
                      .toggleOrderedList()
                      .run()
                  }
                  aria-label="Numbered list"
                  title="Numbered list"
                >
                  1. List
                </button>

                <button
                  type="button"
                  className={
                    fullDescriptionEditorState?.isBlockquote
                      ? 'is-active'
                      : ''
                  }
                  onClick={() =>
                    fullDescriptionEditor
                      ?.chain()
                      .focus()
                      .toggleBlockquote()
                      .run()
                  }
                  aria-label="Quote"
                  title="Quote"
                >
                  “ ”
                </button>

                <button
                  type="button"
                  className={
                    fullDescriptionEditorState?.isCodeBlock
                      ? 'is-active'
                      : ''
                  }
                  onClick={() =>
                    fullDescriptionEditor
                      ?.chain()
                      .focus()
                      .toggleCodeBlock()
                      .run()
                  }
                  aria-label="Code block"
                  title="Code block"
                >
                  &lt;/&gt;
                </button>

                <button
                  type="button"
                  className={
                    fullDescriptionEditor?.isActive('link')
                      ? 'is-active'
                      : ''
                  }
                  onClick={setDescriptionLink}
                  aria-label="Link"
                  title="Tambahkan link"
                >
                  Link
                </button>

                <span className="admin-tutorial-tiptap-divider" />

                <button
                  type="button"
                  onClick={() =>
                    fullDescriptionEditor
                      ?.chain()
                      .focus()
                      .undo()
                      .run()
                  }
                  disabled={
                    !fullDescriptionEditorState?.canUndo
                  }
                  aria-label="Undo"
                  title="Undo"
                >
                  ↶
                </button>

                <button
                  type="button"
                  onClick={() =>
                    fullDescriptionEditor
                      ?.chain()
                      .focus()
                      .redo()
                      .run()
                  }
                  disabled={
                    !fullDescriptionEditorState?.canRedo
                  }
                  aria-label="Redo"
                  title="Redo"
                >
                  ↷
                </button>
              </div>

              <EditorContent
                editor={fullDescriptionEditor}
                className="admin-tutorial-tiptap-editor"
              />
            </div>

            <div className="admin-tutorial-tiptap-footer">
              <small>
                Gunakan toolbar untuk mengatur heading, list,
                quote, link, dan format teks.
              </small>

              <small>
                {fullDescriptionEditor?.getText().length || 0}
                {' '}karakter teks
              </small>
            </div>

            {errors.fullDescription && (
              <small className="admin-tutorial-error">
                {errors.fullDescription}
              </small>
            )}
          </div>

          <div ref={cardImageSectionRef} className="admin-tutorial-image-field">
            <span className="admin-tutorial-label">
              Gambar / Icon (untuk card)<span className="admin-tutorial-required">*</span>
            </span>
            <input ref={cardImageInputRef} id="tutorial-card-image" className="admin-tutorial-file-input" type="file" accept=".jpg,.jpeg,.png,.svg" onChange={handleImageChange} aria-invalid={Boolean(errors.cardImage)} />
            <label className={`admin-tutorial-upload-box ${errors.cardImage ? 'is-error' : ''}`} htmlFor="tutorial-card-image">
              {cardImagePreview ? (
                <img src={cardImagePreview} alt="Preview gambar materi" />
              ) : (
                <span className="admin-tutorial-upload-icon" aria-hidden="true" />
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
            <h2>Ringkasan Materi</h2>
            <div className="admin-tutorial-create-summary-list">
              <p><span>Total Slide</span><strong>{slides.length}</strong></p>
              <p><span>Status</span><strong>{formData.pageSettings.status}</strong></p>
              <p><span>Level</span><strong>{formData.difficultyLevel}</strong></p>
              <p><span>Estimasi</span><strong>{formData.estimatedTime || '-'}</strong></p>
            </div>
            <h3>Preview Urutan Slide</h3>
            <div className="admin-tutorial-page-dots">
              <button type="button" disabled>&lt;</button>
              <button type="button" className="is-active">{slides.length > 0 ? 1 : 0}</button>
              {slides.length > 1 && <button type="button">2</button>}
              {slides.length > 3 && <span>...</span>}
              {slides.length > 2 && <button type="button">{slides.length - 1}</button>}
              {slides.length > 1 && <button type="button">{slides.length}</button>}
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
      <section className="admin-tutorial-create-step-heading">
        <div>
          <span>Langkah 2</span>
          <h2>Daftar Materi / Slide</h2>
          <p>
            Tambahkan slide, atur urutan, lalu pilih tipe konten untuk setiap materi.
          </p>
        </div>
        <div className="admin-tutorial-create-step-count">
          <strong>{slides.length}</strong>
          <span>Total Slide</span>
        </div>
      </section>

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
              <span aria-hidden="true" />
              <span>NO</span>
              <span>Judul Materi</span>
              <span>Tipe Konten</span>
              <span>Estimasi Waktu</span>
              <span>Status</span>
              <span>Aksi</span>
            </div>
            <div className="admin-materials-table-body">
              {filteredSlides.length > 0 ? (
                filteredSlides.map((slide, index) => (
                  <article className={selectedSlideId === slide.id ? 'is-selected' : ''} key={slide.id} onClick={() => setSelectedSlideId(slide.id)}>
                    <button type="button" className="admin-materials-row-handle" aria-label={`Pilih ${slide.title}`}>::</button>
                    <strong>{slides.findIndex((item) => item.id === slide.id) + 1}</strong>
                    <span>{slide.title}</span>
                    <span className="admin-materials-content-type">
                      <i aria-hidden="true" />
                      {toContentLabel(slide.contentType)}
                    </span>
                    <span className="admin-materials-time">{slide.estimatedTime}</span>
                    <button type="button" className={`admin-materials-status ${slide.status === 'Published' ? 'is-published' : 'is-draft'}`} onClick={(event) => {
                      event.stopPropagation();
                      toggleSlideStatus(slide.id);
                    }}>{slide.status}</button>
                    <div className="admin-materials-actions">
                      <button type="button" onClick={(event) => {
                        event.stopPropagation();
                        openSlideEditor(slide.id);
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
                ))
              ) : (
                <div className="admin-materials-empty">
                  Belum ada materi. Klik Tambah Materi untuk membuat slide pertama.
                </div>
              )}
            </div>
          </section>

          {editingSlide && (
            <section className="admin-materials-editor">
              <div className="admin-materials-editor-head">
                <div>
                  <h2>Edit Materi Slide</h2>
                  <p>
                    Input otomatis berubah mengikuti tipe konten yang dipilih.
                  </p>
                </div>
                <button type="button" onClick={() => setEditingSlideId(null)}>Selesai</button>
              </div>

              <div className="admin-tutorial-create-content-summary">
                <span>Tipe input aktif</span>
                <strong>{toContentLabel(editingSlide.contentType)}</strong>
              </div>

              <div className="admin-materials-editor-grid">
                <label>
                  Judul Materi
                  <input
                    value={editingSlide.title}
                    onChange={(event) => updateSlideField(editingSlide.id, 'title', event.target.value)}
                  />
                </label>
                <label>
                  Tipe Konten
                  <select
                    value={editingSlide.contentType}
                    onChange={(event) => updateSlideField(editingSlide.id, 'contentType', event.target.value)}
                  >
                    {contentTypeOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Estimasi Waktu
                  <input
                    value={editingSlide.estimatedTime}
                    onChange={(event) => updateSlideField(editingSlide.id, 'estimatedTime', event.target.value)}
                  />
                </label>
              </div>

              {['text', 'text_image'].includes(editingSlide.contentType) && (
                <label className="admin-materials-editor-text">
                  Teks Materi
                  <textarea
                    value={editingSlide.bodyText}
                    onChange={(event) =>
                      updateSlideField(
                        editingSlide.id,
                        'bodyText',
                        event.target.value
                      )
                    }
                    placeholder="Tulis isi materi yang akan ditampilkan pada slide ini..."
                  />
                </label>
              )}

              {['image', 'text_image'].includes(editingSlide.contentType) && (
                <div className="admin-materials-editor-upload">
                  <strong>Gambar Materi</strong>
                  <button
                    type="button"
                    onClick={() => slideImageInputRef.current?.click()}
                  >
                    Pilih Gambar
                  </button>
                  <span>
                    {editingSlide.imageName ||
                      'Belum ada gambar khusus untuk slide ini'}
                  </span>
                  <input
                    ref={slideImageInputRef}
                    className="admin-tutorial-file-input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.svg"
                    onChange={handleSlideImageChange}
                  />
                </div>
              )}

              {editingSlide.contentType === 'video' && (
                <>
                  <div className="admin-materials-editor-grid">
                    <label>
                      Sumber Video
                      <select
                        value={editingSlide.videoSourceType || 'url'}
                        onChange={(event) => {
                          const sourceType = event.target.value;

                          updateSlideField(
                            editingSlide.id,
                            'videoSourceType',
                            sourceType
                          );
                        }}
                      >
                        <option value="url">Link Video</option>
                        <option value="file">Upload File Video</option>
                      </select>
                    </label>
                  </div>

                  {(editingSlide.videoSourceType || 'url') === 'url' ? (
                    <label className="admin-materials-editor-text">
                      Link Video
                      <input
                        type="url"
                        value={editingSlide.videoUrl || ''}
                        onChange={(event) =>
                          updateSlideField(
                            editingSlide.id,
                            'videoUrl',
                            event.target.value
                          )
                        }
                        placeholder="https://youtube.com/... atau https://domain.com/video.mp4"
                      />
                    </label>
                  ) : (
                    <div className="admin-materials-editor-upload">
                      <strong>File Video</strong>
                      <button
                        type="button"
                        onClick={() => slideVideoInputRef.current?.click()}
                      >
                        Pilih Video
                      </button>
                      <span>
                        {editingSlide.videoName ||
                          'Belum ada file video dipilih'}
                      </span>
                      <input
                        ref={slideVideoInputRef}
                        className="admin-tutorial-file-input"
                        type="file"
                        accept="video/mp4,video/webm,video/ogg"
                        onChange={handleSlideVideoChange}
                      />
                    </div>
                  )}
                </>
              )}
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
            {selectedSlide?.contentType === 'video' ? (
              <div className="admin-materials-image-placeholder has-image">
                {selectedSlideVideo ? (
                  selectedSlide?.videoSourceType === 'file' ||
                  /\.(mp4|webm|ogg)(\?.*)?$/i.test(selectedSlideVideo) ? (
                    <video
                      src={selectedSlideVideo}
                      controls
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <div className="admin-materials-preview-text">
                      Link video: {selectedSlideVideo}
                    </div>
                  )
                ) : (
                  <span />
                )}
              </div>
            ) : ['image', 'text_image'].includes(
              selectedSlide?.contentType
            ) ? (
              <div
                className={`admin-materials-image-placeholder ${
                  selectedSlideImage ? 'has-image' : ''
                }`}
                aria-hidden="true"
              >
                {selectedSlideImage ? (
                  <img src={selectedSlideImage} alt="" />
                ) : (
                  <span />
                )}
              </div>
            ) : null}

            {selectedSlide?.bodyText &&
              ['text', 'text_image'].includes(selectedSlide?.contentType) && (
                <div className="admin-materials-preview-text">
                  {selectedSlide.bodyText}
                </div>
              )}
            <p>
              <span className="admin-materials-content-type">
                <i aria-hidden="true" />
                {selectedSlide ? toContentLabel(selectedSlide.contentType) : '-'}
              </span>
              <span className="admin-materials-time">{selectedSlide?.estimatedTime || '-'}</span>
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
      <section className="admin-tutorial-create-step-heading">
        <div>
          <span>Langkah 3</span>
          <h2>Pengaturan Materi</h2>
          <p>
            Atur status publikasi, visibilitas, akses, tampilan card, dan CTA.
          </p>
        </div>

        <div className="admin-tutorial-create-step-count">
          <strong>
            {formData.pageSettings.status === 'Published' ? 'ON' : '—'}
          </strong>
          <span>Status Publish</span>
        </div>
      </section>

      <div className="admin-create-settings-layout">
        <section className="admin-create-settings-main">
          <section className="admin-create-settings-card">
            <div className="admin-create-settings-card-head">
              <div>
                <h2>Status & Visibilitas</h2>
                <p>
                  Tentukan status materi dan bagaimana materi tampil untuk pengguna.
                </p>
              </div>
            </div>

            <div className="admin-create-settings-status-grid">
              <label className="admin-create-settings-field admin-create-settings-field--status">
                <span>Status Publikasi</span>

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

                <small>
                  Draft, Published, atau Pending Review.
                </small>
              </label>

              <article className="admin-create-settings-option">
                <div>
                  <strong>Aktif / Nonaktif</strong>
                  <small>
                    Nonaktifkan untuk menyembunyikan materi.
                  </small>
                </div>

                <button
                  type="button"
                  className={`admin-create-settings-switch ${
                    formData.pageSettings.active ? 'is-on' : ''
                  }`}
                  onClick={() =>
                    handleNestedChange(
                      'pageSettings',
                      'active',
                      !formData.pageSettings.active
                    )
                  }
                  aria-pressed={formData.pageSettings.active}
                >
                  <span />
                </button>
              </article>

              <article className="admin-create-settings-option">
                <div>
                  <strong>Tampilkan di Halaman</strong>
                  <small>
                    Tampilkan pada halaman pilih jalur belajar.
                  </small>
                </div>

                <button
                  type="button"
                  className={`admin-create-settings-switch ${
                    formData.pageSettings.showOnPage ? 'is-on' : ''
                  }`}
                  onClick={() =>
                    handleNestedChange(
                      'pageSettings',
                      'showOnPage',
                      !formData.pageSettings.showOnPage
                    )
                  }
                  aria-pressed={formData.pageSettings.showOnPage}
                >
                  <span />
                </button>
              </article>

              <article className="admin-create-settings-option">
                <div>
                  <strong>Featured / Unggulan</strong>
                  <small>
                    Tandai materi sebagai materi unggulan.
                  </small>
                </div>

                <button
                  type="button"
                  className={`admin-create-settings-switch ${
                    formData.pageSettings.featured ? 'is-on' : ''
                  }`}
                  onClick={() =>
                    handleNestedChange(
                      'pageSettings',
                      'featured',
                      !formData.pageSettings.featured
                    )
                  }
                  aria-pressed={formData.pageSettings.featured}
                >
                  <span />
                </button>
              </article>

              <article className="admin-create-settings-option">
                <div>
                  <strong>Komentar / Diskusi</strong>
                  <small>
                    Izinkan pengguna berdiskusi pada materi.
                  </small>
                </div>

                <button
                  type="button"
                  className={`admin-create-settings-switch ${
                    formData.pageSettings.comments ? 'is-on' : ''
                  }`}
                  onClick={() =>
                    handleNestedChange(
                      'pageSettings',
                      'comments',
                      !formData.pageSettings.comments
                    )
                  }
                  aria-pressed={formData.pageSettings.comments}
                >
                  <span />
                </button>
              </article>

              <article className="admin-create-settings-access">
                <div className="admin-create-settings-access-head">
                  <strong>Akses Materi</strong>
                  <small>
                    Pilih siapa yang dapat membuka materi.
                  </small>
                </div>

                <div className="admin-create-settings-access-options">
                  <label>
                    <input
                      type="radio"
                      checked={
                        formData.pageSettings.accessType === 'Gratis'
                      }
                      onChange={() =>
                        handleNestedChange(
                          'pageSettings',
                          'accessType',
                          'Gratis'
                        )
                      }
                    />
                    <span>
                      <b>Gratis</b>
                      <small>Bisa diakses semua orang.</small>
                    </span>
                  </label>

                  <label>
                    <input
                      type="radio"
                      checked={
                        formData.pageSettings.accessType ===
                        'Perlu login / Akun'
                      }
                      onChange={() =>
                        handleNestedChange(
                          'pageSettings',
                          'accessType',
                          'Perlu login / Akun'
                        )
                      }
                    />
                    <span>
                      <b>Perlu Login / Akun</b>
                      <small>Pengguna harus masuk terlebih dahulu.</small>
                    </span>
                  </label>
                </div>
              </article>
            </div>
          </section>

          <section className="admin-create-settings-card">
            <div className="admin-create-settings-card-head">
              <div>
                <h2>Pengelompokan & Tampilan</h2>
                <p>
                  Atur kategori, level, dan urutan materi di halaman user.
                </p>
              </div>
            </div>

            <div className="admin-create-settings-fields-grid">
              <label className="admin-create-settings-field">
                <span>Kategori / Jalur</span>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Pilih kategori</option>
                  <option value="panduan-pemula">
                    Panduan Pemula
                  </option>
                  <option value="penggunaan-ide">
                    Penggunaan IDE
                  </option>
                  <option value="dasar-hardware-iot">
                    Dasar Hardware dan IoT
                  </option>
                </select>

                <small>Pilih jalur atau kategori materi.</small>
              </label>

              <label className="admin-create-settings-field">
                <span>Level Kesulitan</span>

                <select
                  name="difficultyLevel"
                  value={formData.difficultyLevel}
                  onChange={handleChange}
                >
                  <option>Level Pemula</option>
                  <option>Level Dasar</option>
                  <option>Level Lanjutan</option>
                </select>

                <small>Tingkat kesulitan materi.</small>
              </label>

              <label className="admin-create-settings-field">
                <span>
                  Urutan Tampil di Halaman
                  <i className="admin-tutorial-required">*</i>
                </span>

                <input
                  ref={pageOrderRef}
                  className={errors.pageOrder ? 'is-error' : ''}
                  type="number"
                  min="1"
                  value={formData.pageSettings.pageOrder}
                  onChange={(event) =>
                    handleNestedChange(
                      'pageSettings',
                      'pageOrder',
                      event.target.value
                    )
                  }
                  placeholder="1"
                />

                <small>Semakin kecil, semakin di atas.</small>

                {errors.pageOrder && (
                  <small className="admin-tutorial-error">
                    {errors.pageOrder}
                  </small>
                )}
              </label>

              <label className="admin-create-settings-field">
                <span>Featured Order</span>

                <input
                  type="number"
                  min="1"
                  value={formData.pageSettings.featuredOrder}
                  onChange={(event) =>
                    handleNestedChange(
                      'pageSettings',
                      'featuredOrder',
                      event.target.value
                    )
                  }
                />

                <small>Urutan pada bagian featured.</small>
              </label>
            </div>
          </section>

          <section className="admin-create-settings-card">
            <div className="admin-create-settings-card-head">
              <div>
                <h2>Durasi & Thumbnail</h2>
                <p>
                  Lengkapi estimasi waktu dan gambar card materi.
                </p>
              </div>
            </div>

            <div className="admin-create-settings-media-grid">
              <label className="admin-create-settings-field">
                <span>Estimasi Total Durasi</span>

                <input
                  name="estimatedTime"
                  value={formData.estimatedTime}
                  onChange={handleChange}
                  placeholder="Contoh: 2-4 jam"
                />

                <small>
                  Gunakan format yang mudah dipahami pengguna.
                </small>
              </label>

              <div className="admin-create-settings-thumbnail">
                <div className="admin-create-settings-thumbnail-label">
                  <strong>Gambar / Icon Card</strong>
                  <small>JPG, PNG, SVG. Maksimal 3MB.</small>
                </div>

                <input
                  id="tutorial-card-image-settings"
                  className="admin-tutorial-file-input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.svg"
                  onChange={handleImageChange}
                />

                <label
                  className="admin-create-settings-thumbnail-box"
                  htmlFor="tutorial-card-image-settings"
                >
                  {cardImagePreview ? (
                    <img
                      src={cardImagePreview}
                      alt="Preview thumbnail materi"
                    />
                  ) : (
                    <div className="admin-create-settings-thumbnail-empty">
                      <span>+</span>
                      <strong>Pilih Thumbnail</strong>
                    </div>
                  )}
                </label>

                <div className="admin-create-settings-thumbnail-meta">
                  <span>
                    {formData.cardImage
                      ? formData.cardImage.name
                      : 'Belum ada gambar dipilih'}
                  </span>

                  <label htmlFor="tutorial-card-image-settings">
                    {formData.cardImage ? 'Ganti Gambar' : 'Upload Gambar'}
                  </label>
                </div>
              </div>
            </div>
          </section>

          <div className="admin-create-settings-pair">
            <section className="admin-create-settings-card">
              <div className="admin-create-settings-card-head">
                <div>
                  <h2>Syarat Akses</h2>
                  <p>Batasi materi jika diperlukan.</p>
                </div>
              </div>

              <div className="admin-create-settings-choice-list">
                <label>
                  <input
                    type="radio"
                    checked={
                      formData.accessSettings.userLevel ===
                      'Semua Pengguna'
                    }
                    onChange={() =>
                      handleNestedChange(
                        'accessSettings',
                        'userLevel',
                        'Semua Pengguna'
                      )
                    }
                  />
                  <span>
                    <b>Semua Pengguna</b>
                    <small>Materi dapat dibuka oleh semua user.</small>
                  </span>
                </label>

                <label>
                  <input
                    type="radio"
                    checked={
                      formData.accessSettings.userLevel !==
                      'Semua Pengguna'
                    }
                    onChange={() =>
                      handleNestedChange(
                        'accessSettings',
                        'userLevel',
                        'Level Tertentu'
                      )
                    }
                  />
                  <span>
                    <b>Level Tertentu</b>
                    <small>Batasi berdasarkan level pengguna.</small>
                  </span>
                </label>
              </div>
            </section>

            <section className="admin-create-settings-card">
              <div className="admin-create-settings-card-head">
                <div>
                  <h2>Prasyarat Belajar</h2>
                  <p>Materi yang harus selesai sebelumnya.</p>
                </div>
              </div>

              <label className="admin-create-settings-field">
                <span>Pilih Prasyarat</span>

                <select
                  value={formData.accessSettings.prerequisite}
                  onChange={(event) =>
                    handleNestedChange(
                      'accessSettings',
                      'prerequisite',
                      event.target.value
                    )
                  }
                >
                  <option>Tidak ada prasyarat</option>
                  <option>Pengantar ArduFlow</option>
                  <option>Apa itu ArduFlow?</option>
                </select>

                <small>
                  Pilih materi yang harus diselesaikan terlebih dahulu.
                </small>
              </label>
            </section>
          </div>

          <section className="admin-create-settings-card">
            <div className="admin-create-settings-card-head">
              <div>
                <h2>CTA & Publikasi</h2>
                <p>
                  Atur tombol pada card serta jadwal publikasi materi.
                </p>
              </div>
            </div>

            <div className="admin-create-settings-fields-grid">
              <label className="admin-create-settings-field">
                <span>Teks Tombol CTA</span>

                <input
                  name="ctaText"
                  value={formData.ctaText}
                  onChange={handleChange}
                  placeholder="Mulai Belajar"
                />

                <small>Teks tombol pada card materi.</small>
              </label>

              <label className="admin-create-settings-field">
                <span>Link Tujuan</span>

                <select
                  name="targetLink"
                  value={formData.targetLink}
                  onChange={handleChange}
                >
                  <option>Materi Pertama</option>
                  <option>Daftar Materi</option>
                </select>

                <small>Arahkan tombol ke tujuan yang dipilih.</small>
              </label>

              <label className="admin-create-settings-field">
                <span>URL Slug</span>

                <div className="admin-create-settings-url-input">
                  <span>/materi/</span>
                  <input
                    name="urlSlug"
                    value={formData.urlSlug}
                    onChange={handleChange}
                    placeholder="panduan-pemula"
                  />
                </div>

                <small>
                  Gunakan huruf kecil, angka, dan tanda hubung.
                </small>
              </label>

              <label className="admin-create-settings-field">
                <span>Jadwal Publikasi</span>

                <input
                  type="date"
                  name="publishSchedule"
                  value={formData.publishSchedule}
                  onChange={handleChange}
                />

                <small>
                  Kosongkan jika ingin dipublikasikan segera.
                </small>
              </label>
            </div>
          </section>
        </section>

        <aside className="admin-create-settings-side">
          <section className="admin-create-settings-preview-card">
            <div className="admin-create-settings-preview-head">
              <div>
                <span>Live Preview</span>
                <h2>Preview di Halaman User</h2>
              </div>
            </div>

            <article className="admin-create-settings-preview-content">
              <div className="admin-create-settings-preview-media">
                {cardImagePreview ? (
                  <img
                    src={cardImagePreview}
                    alt="Preview card materi"
                  />
                ) : (
                  <div className="admin-create-settings-preview-empty">
                    <span>Thumbnail</span>
                  </div>
                )}
              </div>

              <div className="admin-create-settings-preview-body">
                <div className="admin-create-settings-preview-tags">
                  <span>{formData.difficultyLevel}</span>
                  <span>
                    {formData.pageSettings.accessType || 'Gratis'}
                  </span>
                </div>

                <h3>{formData.title || 'Judul Materi'}</h3>

                <p>
                  {formData.shortDescription ||
                    'Deskripsi singkat materi akan tampil di sini.'}
                </p>

                <div className="admin-create-settings-preview-meta">
                  <span>{formData.estimatedTime || '-'}</span>
                  <span>{slides.length} slide</span>
                </div>

                <button type="button">
                  {formData.ctaText || 'Mulai Belajar'}
                </button>
              </div>
            </article>
          </section>

          <section className="admin-create-settings-summary-card">
            <div className="admin-create-settings-card-head">
              <div>
                <h2>Ringkasan Pengaturan</h2>
                <p>Data yang akan disimpan.</p>
              </div>
            </div>

            <dl>
              {[
                ['Status', formData.pageSettings.status],
                [
                  'Aktif',
                  formData.pageSettings.active ? 'Ya' : 'Tidak',
                ],
                [
                  'Tampil di halaman',
                  formData.pageSettings.showOnPage ? 'Ya' : 'Tidak',
                ],
                [
                  'Featured',
                  formData.pageSettings.featured ? 'Ya' : 'Tidak',
                ],
                ['Akses', formData.pageSettings.accessType],
                ['Kategori', formData.category || '-'],
                ['Level', formData.difficultyLevel],
                [
                  'Urutan',
                  formData.pageSettings.pageOrder || '-',
                ],
                ['Durasi', formData.estimatedTime || '-'],
                [
                  'Prasyarat',
                  formData.accessSettings.prerequisite || '-',
                ],
                ['CTA', formData.ctaText || '-'],
                [
                  'Jadwal',
                  formData.publishSchedule || 'Segera',
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>

      {submitMessage && (
        <div
          className={`admin-create-settings-message ${
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

      <div className="admin-create-settings-actions">
        <button
          type="button"
          className="is-back"
          onClick={() => goToStep(2)}
        >
          Kembali ke Daftar Materi
        </button>

        <div>
          <button
            type="button"
            className="is-draft"
            onClick={(event) => handleSubmit(event, 'draft')}
            disabled={isSubmitting}
          >
            Simpan Draft
          </button>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Publikasikan Materi'}
          </button>
        </div>
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
                  <span>
                    POST {TUTORIAL_API_URL}/article-api.php
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => copyJson(requestJson)}
                >
                  Salin JSON
                </button>
              </div>

              <pre>
                {JSON.stringify(requestJson, null, 2)}
              </pre>
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

              <pre>
                {JSON.stringify(responseJson, null, 2)}
              </pre>
            </article>
          )}
        </section>
      )}
    </>
  );

  return (
    <main className="admin-tutorial-create-page admin-tutorial-create-polished">
      <div className="admin-tutorial-create-shell">
        <section className="admin-tutorial-create-hero">
          <div>
            <div className="admin-tutorial-create-eyebrow">
              <span>Materi Baru</span>
              <span className="is-draft">{formData.pageSettings.status}</span>
            </div>

            <h1>Tambah Materi</h1>
            <p>
              {activeStep === 2
                ? 'Buat, urutkan, dan kelola slide materi dengan tipe konten yang sesuai.'
                : activeStep === 3
                  ? 'Atur bagaimana materi ditampilkan dan dipublikasikan di platform.'
                  : 'Lengkapi informasi utama materi sebelum menyusun slide pembelajaran.'}
            </p>
          </div>

          <a className="admin-tutorial-create-back" href="/admin/tutorial">
            Kembali ke Tutorial
          </a>
        </section>

        <section className="admin-tutorial-create-step-card">
          {renderSteps()}
        </section>

        <form onSubmit={(event) => handleSubmit(event, 'publish')} noValidate>
          {activeStep === 1 && renderInformationStep()}
          {activeStep === 2 && renderMaterialsStep()}
          {activeStep === 3 && renderSettingsStep()}
        </form>
      </div>
    </main>
  );
}

const ARTICLE_API_URL = apiEndpoint(
  import.meta.env.VITE_ARTICLE_API_URL,
  '/api/article-api.php'
);
const DEBUG_TUTORIAL_EDIT =
  import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true';

const emptyForm = {
  title: '',
  slug: '',
  category: '',
  displayOrder: 1,
  shortDescription: '',
  fullDescription: '',
  cardImage: null,
  cardImageDataUrl: '',
  cardImageUrl: '',
  cardImageName: '',
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

function resolveApiAssetUrl(value) {
  const assetPath = String(value || '').trim();

  if (!assetPath) return '';

  if (/^(data:image\/|https?:\/\/|blob:)/i.test(assetPath)) {
    return assetPath;
  }

  if (/^(\/?uploads\/|\/?storage\/|\/?api\/uploads\/)/i.test(assetPath)) {
    return `${API_BASE_URL}/${assetPath.replace(/^\/+/, '')}`;
  }

  return '';
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
        const response = await fetch(ARTICLE_API_URL, {
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
          cardImage: null,
          cardImageDataUrl: '',
          cardImageUrl: resolveApiAssetUrl(
            tutorial.card_image_url ||
            tutorial.card_image_path ||
            ''
          ),
          cardImageName: tutorial.card_image_name || '',
          difficultyLevel: tutorial.difficulty_level || 'Level Pemula',
          estimatedTime: tutorial.estimated_time || '',
          pageOrder: Number(tutorial.page_order || 1),
          status: normalizeStatus(tutorial.status),
          userLevel: normalizeUserLevel(tutorial.user_level),
          accessRequirement: tutorial.access_requirement || '',
        });

        if (DEBUG_TUTORIAL_EDIT) {
          console.group('DEBUG EDIT MATERI SQLITE');
          console.log('ID:', tutorialId);
          console.log('Endpoint:', ARTICLE_API_URL);
          console.log('Data materi:', tutorial);
          console.groupEnd();
        }
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

  const handleCardImageChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((previous) => ({
        ...previous,
        cardImage: selectedFile,
        cardImageDataUrl:
          typeof reader.result === 'string' ? reader.result : '',
        cardImageUrl: URL.createObjectURL(selectedFile),
        cardImageName: selectedFile.name,
      }));
    };
    reader.readAsDataURL(selectedFile);
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

  const renameSlide = async (slideIndex) => {
    const slide = slides[slideIndex];
    const currentTitle = slide?.title || `Slide ${slideIndex + 1}`;
    const nextTitle = await showPromptAlert({
      title: 'Ubah Judul Materi',
      inputValue: currentTitle,
      requiredMessage: 'Judul materi wajib diisi.',
    });

    if (!nextTitle?.trim()) {
      return;
    }

    setSlides((previousSlides) =>
      previousSlides.map((item, index) =>
        index === slideIndex ? { ...item, title: nextTitle.trim() } : item
      )
    );
  };

  const removeSlide = async (slideIndex) => {
    const slide = slides[slideIndex];
    const slideTitle = slide?.title || `Slide ${slideIndex + 1}`;
    const confirmed = await showConfirmAlert({
      title: 'Hapus Materi?',
      text: `Hapus "${slideTitle}" dari daftar materi?`,
      confirmButtonText: 'Hapus',
    });

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

      card_image: formData.cardImage
        ? {
            file_name: formData.cardImage.name,
            file_type: formData.cardImage.type,
            file_size: formData.cardImage.size,
            data_url: formData.cardImageDataUrl,
          }
        : null,

      slides: slides.map((slide, index) => ({
        id: slide.id ?? null,
        order: Number(slide.order || index + 1),
        title: slide.title || `Slide ${index + 1}`,
        content_type:
          slide.content_type || slide.contentType || 'text',
        content: slide.content ?? null,
        image_name: slide.image_name ?? null,
        image_url: slide.image_url ?? null,
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
      await showErrorAlert('Form Belum Lengkap', validationMessage);
      return;
    }

    const payload = createUpdatePayload();

    setIsSaving(true);
    setSaveStatus('idle');
    setSaveMessage('');

    if (DEBUG_TUTORIAL_EDIT) {
      console.group('DEBUG UPDATE MATERI SQLITE');
      console.log('Method:', 'PUT');
      console.log(
        'Endpoint:',
        `${ARTICLE_API_URL}?id=${tutorialId}`
      );
      console.log('Request JSON:', payload);
    }

    try {
      const response = await fetch(
        `${ARTICLE_API_URL}?id=${encodeURIComponent(
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

      if (DEBUG_TUTORIAL_EDIT) {
        console.log('Response:', result);
      }

      if (!response.ok || result.success === false) {
        setSaveStatus('error');
        setSaveMessage(
          result.message || 'Perubahan materi gagal disimpan.'
        );
        await showErrorAlert(
          'Gagal Menyimpan',
          result.message || 'Perubahan materi gagal disimpan.'
        );
        return;
      }

      setSaveStatus('success');
      setSaveMessage(
        result.message || 'Materi berhasil diperbarui.'
      );
      await showSuccessAlert(
        'Berhasil',
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

      setFormData((previous) => ({
        ...previous,
        cardImage: null,
        cardImageDataUrl: '',
        cardImageUrl: result.data?.card_image_url
          ? resolveApiAssetUrl(result.data.card_image_url)
          : previous.cardImageUrl,
        cardImageName:
          result.data?.card_image_name || previous.cardImageName,
      }));
    } catch (error) {
      console.error('Gagal memperbarui materi:', error);

      setSaveStatus('error');
      setSaveMessage(
        `Tidak dapat menyimpan perubahan: ${error.message}`
      );
      await showErrorAlert(
        'Gagal',
        `Tidak dapat menyimpan perubahan: ${error.message}`
      );
    } finally {
      setIsSaving(false);
      if (DEBUG_TUTORIAL_EDIT) {
        console.groupEnd();
      }
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
                <label htmlFor="tutorial-edit-card-image">
                  {formData.cardImageUrl ? (
                    <img src={formData.cardImageUrl} alt="Preview gambar materi" />
                  ) : (
                    <span>[]</span>
                  )}
                  <p>{formData.cardImageName || 'Klik untuk upload gambar baru'}</p>
                  <small>Jika tidak diganti, thumbnail lama tetap digunakan.</small>
                </label>
                <input
                  id="tutorial-edit-card-image"
                  className="admin-tutorial-file-input"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.svg"
                  onChange={handleCardImageChange}
                />
              </div>
              <button
                type="button"
                className="admin-settings-library"
                onClick={() =>
                  showErrorAlert(
                    'Belum Tersedia',
                    'Library gambar belum tersedia. Gunakan upload gambar dari perangkat.'
                  )
                }
              >
                Pilih dari Library
              </button>
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
              {formData.cardImageUrl ? (
                <img
                  className="admin-settings-preview-image"
                  src={formData.cardImageUrl}
                  alt=""
                />
              ) : (
                <div className="admin-settings-preview-image" aria-hidden="true" />
              )}
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
      <main className="admin-tutorial-create-page admin-tutorial-edit-page admin-tutorial-edit-loading-page">
        <section className="admin-tutorial-create-card">
          <h1>Edit Materi</h1>
          <p>Mengambil data materi dari SQLite...</p>
        </section>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="admin-tutorial-create-page admin-tutorial-edit-page admin-tutorial-edit-loading-page">
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
    <main className="admin-tutorial-create-page admin-tutorial-edit-page">
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
            <TinyMCEEditor
              value={formData.fullDescription}
              onChange={(value) =>
                setFormData((previous) => ({
                  ...previous,
                  fullDescription: value,
                }))
              }
              height={420}
              ariaLabel="Deskripsi lengkap materi"
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
