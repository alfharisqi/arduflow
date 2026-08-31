import { useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/admin-tutorial-create.css';
import { TinyMCEEditor } from '../../components/TinyMCEEditor.jsx';
import {
  showConfirmAlert,
  showErrorAlert,
  showPromptAlert,
  showSuccessAlert,
} from '../../utils/alerts.js';
const DEPLOY_URL = (
  import.meta.env.VITE_DEPLOY_URL ||
  'https://arduflow.indobilliard.com/apk/uploads/web-arduflow-deploy-alfha/'
).replace(/\/+$/, '');

const MATERI_API_URL = `${DEPLOY_URL}/api/materi-api.php`;
const MATERI_IMAGE_BASE_URL = `${DEPLOY_URL}/uploads/materi`;
const initialSlides = [];

const createDefaultChapter = () => ({
  id: `chapter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: 'Bab 1',
  order: 1,
});

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
  learningObjectives: [''],
  pageSettings: {
    pageOrder: '1',
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
  ['1', 'Add Cover', 'Cover dan identitas tutorial'],
  ['2', 'Add Halaman Materi', 'Buat dan urutkan materi'],
  ['3', 'Pengaturan', 'Status & lainnya'],
];

const contentTypeOptions = [
  ['text_image', 'Teks + Gambar'],
  ['text', 'Teks'],
  ['image', 'Gambar'],
  ['video', 'Video'],
  ['code', 'Code Block'],
];

const toContentLabel = (contentType) =>
  contentTypeOptions.find(([value]) => value === contentType)?.[1] || contentType;

const htmlToPlainText = (html = '') =>
  String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

function AdminTutorialForm({ mode = 'create' }) {
  // Mode edit otomatis aktif jika URL memiliki ?id=...
  // Jadi route /admin/tutorial/tambah?id=123 tetap memuat data lama
  // meskipun parent component tidak mengirim prop mode="edit".
  const tutorialId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }, []);

  const isEdit = mode === 'edit' || Boolean(tutorialId);
  const [isLoadingTutorial, setIsLoadingTutorial] = useState(isEdit);
  const [loadError, setLoadError] = useState('');

  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [slides, setSlides] = useState(initialSlides);
  const [chapters, setChapters] = useState(() => [createDefaultChapter()]);
  const [persistedTutorialId, setPersistedTutorialId] = useState(tutorialId);
  const effectiveTutorialId = persistedTutorialId || tutorialId || null;
  const [activeChapterId, setActiveChapterId] = useState(null);
  const [dirtyChapterIds, setDirtyChapterIds] = useState([]);
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
    if (chapters.length === 0) {
      setActiveChapterId(null);
      return;
    }

    const stillExists = chapters.some(
      (chapter) => String(chapter.id) === String(activeChapterId)
    );

    if (!stillExists) {
      setActiveChapterId(chapters[0].id);
    }
  }, [chapters, activeChapterId]);

  useEffect(() => {
    if (!formData.cardImage) {
      return undefined;
    }

    const nextPreview = URL.createObjectURL(formData.cardImage);
    setCardImagePreview(nextPreview);

    return () => URL.revokeObjectURL(nextPreview);
  }, [formData.cardImage]);


  useEffect(() => {
    if (!isEdit) return undefined;

    let cancelled = false;

    const loadTutorial = async () => {
      if (!tutorialId) {
        setLoadError('ID materi tidak ditemukan pada URL.');
        setIsLoadingTutorial(false);
        return;
      }

      setIsLoadingTutorial(true);
      setLoadError('');

      try {
        const response = await fetch(MATERI_API_URL, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-store',
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

        if (cancelled) return;

        setFormData({
          title: tutorial.title || '',
          slug: tutorial.slug || '',
          category: tutorial.category || '',
          displayOrder: Number(tutorial.display_order || 1),
          shortDescription: tutorial.short_description || '',
          fullDescription: tutorial.full_description || '',
          cardImage: null,
          difficultyLevel: tutorial.difficulty_level || 'Level Pemula',
          estimatedTime: tutorial.estimated_time || '',
          ctaText: tutorial.cta_text || 'Mulai Belajar',
          targetLink: tutorial.cta_target_link || 'Materi Pertama',
          urlSlug: tutorial.cta_url_slug || tutorial.slug || '',
          publishSchedule: tutorial.publish_schedule || '',
          learningObjectives:
            Array.isArray(tutorial.learning_objectives) &&
            tutorial.learning_objectives.length > 0
              ? tutorial.learning_objectives
              : [''],
          pageSettings: {
            pageOrder: String(tutorial.page_order || 1),
            status:
              String(tutorial.status || '').toLowerCase() === 'published'
                ? 'Published'
                : String(tutorial.status || '').toLowerCase() === 'pending_review'
                  ? 'Pending Review'
                  : 'Draft',
            active: Boolean(tutorial.active),
            showOnPage: Boolean(tutorial.show_on_page),
            featured: Boolean(tutorial.featured),
            comments: tutorial.comments !== false,
            accessType: tutorial.access_type || 'Gratis',
            featuredOrder: String(tutorial.featured_order || 1),
          },
          accessSettings: {
            userLevel:
              String(tutorial.user_level || '')
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (letter) => letter.toUpperCase()) ||
              'Semua Pengguna',
            accessRequirement: tutorial.access_requirement || '',
            prerequisite: tutorial.prerequisite || 'Tidak ada prasyarat',
          },
        });

        const existingCardImageUrl =
          tutorial.card_image_name
            ? `${MATERI_IMAGE_BASE_URL}/${encodeURIComponent(
                tutorial.card_image_name
              )}`
            : tutorial.card_image_url || '';

        setCardImagePreview(existingCardImageUrl);

        const normalizedChapters =
          Array.isArray(tutorial.chapters) && tutorial.chapters.length > 0
            ? tutorial.chapters
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
                .sort((a, b) => a.order - b.order)
            : [createDefaultChapter()];

        setChapters(normalizedChapters);
        setPersistedTutorialId(tutorialId);
        setActiveChapterId(normalizedChapters[0]?.id ?? null);
        setDirtyChapterIds([]);

        const normalizedSlides = Array.isArray(tutorial.slides)
          ? tutorial.slides.map((slide, index) => {
              const contentType =
                slide.content_type || slide.contentType || 'text';
              const bodyText =
                slide.body_text ?? slide.content ?? '';

              const embeddedImageMatch = String(bodyText).match(
                /<img[^>]+src=["']([^"']+)["']/i
              );

              const imagePreview =
                (slide.image_name
                  ? `${MATERI_IMAGE_BASE_URL}/${encodeURIComponent(
                      slide.image_name
                    )}`
                  : '') ||
                slide.image_url ||
                embeddedImageMatch?.[1] ||
                '';

              return {
                id: slide.id ?? `slide-${index + 1}-${Date.now()}`,
                title: slide.title || `Slide Materi ${index + 1}`,
                contentType,
                estimatedTime:
                  slide.estimated_time ||
                  tutorial.estimated_time ||
                  '2-4 jam',
                status:
                  String(slide.status || '').toLowerCase() === 'published'
                    ? 'Published'
                    : 'Draft',
                bodyText,
                imagePreview,
                imageName:
                  slide.image_name ||
                  slide.image?.file_name ||
                  '',
                imageType:
                  slide.image_type ||
                  slide.image?.file_type ||
                  null,
                imageSize:
                  slide.image_size ||
                  slide.image?.file_size ||
                  null,
                imageFile: null,
                videoSourceType: slide.video_url ? 'url' : 'url',
                videoUrl: slide.video_url || '',
                videoFile: null,
                videoName: '',
                videoPreview: '',
                chapterId:
                  slide.chapter_id ??
                  slide.chapterId ??
                  normalizedChapters[0]?.id ??
                  null,
                codeTitle:
                  slide.code_title ??
                  slide.codeTitle ??
                  '',
                codeLanguage:
                  slide.code_language ??
                  slide.codeLanguage ??
                  'cpp',
                codeContent:
                  slide.code_content ??
                  slide.codeContent ??
                  '',
                allowCopy:
                  slide.allow_copy === undefined
                    ? slide.allowCopy !== false
                    : Boolean(slide.allow_copy),
              };
            })
          : [];

        setSlides(normalizedSlides);
        setSelectedSlideId(normalizedSlides[0]?.id || null);
      } catch (error) {
        if (!cancelled) {
          console.error('Gagal memuat materi untuk edit:', error);
          setLoadError(
            error.message || 'Data materi gagal dimuat.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTutorial(false);
        }
      }
    };

    loadTutorial();

    return () => {
      cancelled = true;
    };
  }, [MATERI_API_URL, isEdit, tutorialId]);

  const filteredSlides = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return [...slides]
      .filter((slide) => {
        const matchesSearch = normalizedQuery
          ? slide.title.toLowerCase().includes(normalizedQuery)
          : true;
        const matchesStatus =
          statusFilter === 'Semua Status' || slide.status === statusFilter;
        const matchesChapter =
          !activeChapterId ||
          String(slide.chapterId) === String(activeChapterId);

        return matchesSearch && matchesStatus && matchesChapter;
      })
      .sort((firstSlide, secondSlide) =>
        sortMode === 'asc'
          ? firstSlide.id - secondSlide.id
          : secondSlide.id - firstSlide.id
      );
  }, [activeChapterId, searchQuery, slides, sortMode, statusFilter]);

  const infoSlideStatistics = useMemo(() => {
    const textCount = slides.filter((slide) =>
      ['text', 'text_image'].includes(slide.contentType)
    ).length;
    const imageCount = slides.filter((slide) =>
      ['image', 'text_image'].includes(slide.contentType)
    ).length;
    const videoCount = slides.filter((slide) => slide.contentType === 'video').length;
    const codeCount = slides.filter((slide) => slide.contentType === 'code').length;

    return [
      ['Total Slide', String(slides.length)],
      ['Text', String(textCount)],
      ['Gambar', String(imageCount)],
      ['Video', String(videoCount)],
      ['Code', String(codeCount)],
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

  const markChapterDirty = (chapterId) => {
    if (chapterId === null || chapterId === undefined || chapterId === '') return;

    const normalizedId = String(chapterId);

    setDirtyChapterIds((previousIds) =>
      previousIds.includes(normalizedId)
        ? previousIds
        : [...previousIds, normalizedId]
    );
  };

  const activeChapter =
    chapters.find(
      (chapter) => String(chapter.id) === String(activeChapterId)
    ) || chapters[0] || null;

  const activeChapterSlides = activeChapter
    ? slides.filter(
        (slide) => String(slide.chapterId) === String(activeChapter.id)
      )
    : [];

  const getChapterSlides = (chapterId) =>
    slides.filter(
      (slide) => String(slide.chapterId) === String(chapterId)
    );

  const getChapterSlideNumber = (slide) => {
    if (!slide) return 0;

    const chapterSlides = getChapterSlides(slide.chapterId);
    const index = chapterSlides.findIndex(
      (item) => String(item.id) === String(slide.id)
    );

    return index >= 0 ? index + 1 : 0;
  };

  const isActiveChapterDirty =
    activeChapter && dirtyChapterIds.includes(String(activeChapter.id));

  const addLearningObjective = () => {
    setFormData((previousData) => ({
      ...previousData,
      learningObjectives: [...previousData.learningObjectives, ''],
    }));
  };

  const updateLearningObjective = (index, value) => {
    setFormData((previousData) => ({
      ...previousData,
      learningObjectives: previousData.learningObjectives.map((item, itemIndex) =>
        itemIndex === index ? value : item
      ),
    }));
  };

  const removeLearningObjective = (index) => {
    setFormData((previousData) => ({
      ...previousData,
      learningObjectives:
        previousData.learningObjectives.length <= 1
          ? ['']
          : previousData.learningObjectives.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleAddChapter = () => {
    if (activeChapter && isActiveChapterDirty) {
      window.alert(
        `Simpan "${activeChapter.title || 'bab aktif'}" terlebih dahulu sebelum menambah bab baru.`
      );
      return;
    }

    const nextOrder = chapters.length + 1;
    const newChapter = {
      id: `chapter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: `Bab ${nextOrder}`,
      order: nextOrder,
    };

    setChapters((previousChapters) => [...previousChapters, newChapter]);
    setActiveChapterId(newChapter.id);
    setEditingSlideId(null);
    setSelectedSlideId(null);
    markChapterDirty(newChapter.id);
  };

  const updateChapterTitle = (chapterId, title) => {
    setChapters((previousChapters) =>
      previousChapters.map((chapter) =>
        String(chapter.id) === String(chapterId)
          ? { ...chapter, title }
          : chapter
      )
    );
    markChapterDirty(chapterId);
  };

  const removeChapter = (chapterId) => {
    if (chapters.length <= 1) {
      window.alert('Minimal harus ada satu bab.');
      return;
    }

    const fallbackChapter = chapters.find(
      (chapter) => String(chapter.id) !== String(chapterId)
    );

    setChapters((previousChapters) =>
      previousChapters
        .filter((chapter) => String(chapter.id) !== String(chapterId))
        .map((chapter, index) => ({ ...chapter, order: index + 1 }))
    );

    setSlides((previousSlides) =>
      previousSlides.map((slide) =>
        String(slide.chapterId) === String(chapterId)
          ? { ...slide, chapterId: fallbackChapter?.id ?? null }
          : slide
      )
    );

    setActiveChapterId(fallbackChapter?.id ?? null);
    if (fallbackChapter?.id) {
      markChapterDirty(fallbackChapter.id);
    }
  };

  const handleAddSlide = (chapterId = activeChapterId || chapters[0]?.id) => {
    const targetChapterId = chapterId ?? chapters[0]?.id ?? null;

    const chapterSlideCount = slides.filter(
      (slide) => String(slide.chapterId) === String(targetChapterId)
    ).length;

    const newSlide = {
      id: Date.now(),
      title: `Slide Materi ${chapterSlideCount + 1}`,
      contentType: 'text_image',
      estimatedTime: '2-4 jam',
      status: 'Draft',
      bodyText: '',
      imagePreview: '',
      imageName: '',
      imageType: null,
      imageSize: null,
      imageFile: null,
      videoSourceType: 'url',
      videoUrl: '',
      videoFile: null,
      videoName: '',
      videoPreview: '',
      chapterId: targetChapterId,
      codeTitle: 'Contoh Kode',
      codeLanguage: 'cpp',
      codeContent: '',
      allowCopy: true,
    };

    setSlides((previousSlides) => [...previousSlides, newSlide]);
    setActiveChapterId(newSlide.chapterId);
    setSelectedSlideId(newSlide.id);
    setEditingSlideId(newSlide.id);
    markChapterDirty(newSlide.chapterId);
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
    setActiveChapterId(duplicatedSlide.chapterId);
    setSelectedSlideId(duplicatedSlide.id);
    markChapterDirty(duplicatedSlide.chapterId);
  };

  const removeSlide = (slideId) => {
    const slideToRemove = slides.find((slide) => slide.id === slideId);

    setSlides((previousSlides) => {
      const updatedSlides = previousSlides.filter((slide) => slide.id !== slideId);

      if (selectedSlideId === slideId) {
        setSelectedSlideId(updatedSlides[0]?.id || null);
      }

      return updatedSlides;
    });

    if (slideToRemove?.chapterId) {
      markChapterDirty(slideToRemove.chapterId);
    }
  };

  const openSlideEditor = (slideId) => {
    const slide = slides.find((item) => item.id === slideId);
    if (!slide) return;

    setActiveChapterId(slide.chapterId || activeChapterId);
    setSelectedSlideId(slideId);
    setEditingSlideId(slideId);
  };

  const updateSlideField = (slideId, fieldName, value) => {
    const currentSlide = slides.find((item) => item.id === slideId);
    const previousChapterId = currentSlide?.chapterId;

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

    if (fieldName === 'chapterId') {
      markChapterDirty(previousChapterId);
      markChapterDirty(value);
      setActiveChapterId(value);
    } else {
      markChapterDirty(previousChapterId);
    }
  };

  const handleSlideImageChange = (event) => {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile || !editingSlideId) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      window.alert('Format gambar harus JPG, JPEG, PNG, WEBP, atau SVG.');
      event.target.value = '';
      return;
    }

    const maxImageSize = 3 * 1024 * 1024;

    if (selectedFile.size > maxImageSize) {
      window.alert('Ukuran gambar maksimal 3 MB.');
      event.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    const targetSlide = slides.find((slide) => slide.id === editingSlideId);

    setSlides((previousSlides) =>
      previousSlides.map((slide) => {
        if (slide.id !== editingSlideId) return slide;

        if (
          slide.imagePreview &&
          String(slide.imagePreview).startsWith('blob:')
        ) {
          URL.revokeObjectURL(slide.imagePreview);
        }

        return {
          ...slide,
          imageFile: selectedFile,
          imageName: selectedFile.name,
          imagePreview: previewUrl,
        };
      })
    );

    if (targetSlide?.chapterId) {
      markChapterDirty(targetSlide.chapterId);
    }
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
    const targetSlide = slides.find((slide) => slide.id === slideId);

    setSlides((previousSlides) =>
      previousSlides.map((slide) =>
        slide.id === slideId
          ? { ...slide, status: slide.status === 'Published' ? 'Draft' : 'Published' }
          : slide
      )
    );

    if (targetSlide?.chapterId) {
      markChapterDirty(targetSlide.chapterId);
    }
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
    const fullDescriptionText = htmlToPlainText(formData.fullDescription);

    if (!fullDescriptionText) {
      validationErrors.fullDescription = 'Kolom ini belum diisi.';
    }
    if (!formData.cardImage && !cardImagePreview) {
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
        fullDescriptionRef.current
          ?.querySelector('[contenteditable="true"]')
          ?.focus();
        return;
      }

      targetElement?.focus?.();
    }, 250);
  };

  const createRequestPayload = (mode = 'save') => {
    const normalizedMode = String(mode || 'save').trim().toLowerCase();

    /*
     * Tombol "Publikasikan Materi" harus BENAR-BENAR mengirim
     * status tutorial = published.
     *
     * Mode draft/save tidak memaksa tutorial menjadi draft;
     * status yang dipilih admin tetap dipertahankan.
     */
    const tutorialStatus =
      normalizedMode === 'publish'
        ? 'published'
        : String(formData.pageSettings.status || 'Draft')
            .toLowerCase()
            .replace(/\s+/g, '_');

    return ({
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
      learning_objectives: formData.learningObjectives
        .map((item) => item.trim())
        .filter(Boolean),
    },
    chapters: chapters.map((chapter, index) => ({
      id: chapter.id,
      order: index + 1,
      title: chapter.title.trim() || `Bab ${index + 1}`,
    })),
    page_settings: {
      page_order: formData.pageSettings.pageOrder
        ? Number(formData.pageSettings.pageOrder)
        : null,
      status: tutorialStatus,
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
      const usesTextEditor = ['text', 'text_image', 'image'].includes(slide.contentType);
      const usesVideo = slide.contentType === 'video';
      const usesCode = slide.contentType === 'code';

      return {
        id: slide.id,
        order: index + 1,
        chapter_id: slide.chapterId || chapters[0]?.id || null,
        title: slide.title,
        content_type: slide.contentType,
        estimated_time: slide.estimatedTime,
        body_text: usesTextEditor ? slide.bodyText || '' : '',
        content: usesTextEditor ? slide.bodyText || '' : '',
        code_title: usesCode ? slide.codeTitle?.trim() || null : null,
        code_language: usesCode ? slide.codeLanguage || 'cpp' : null,
        code_content: usesCode ? slide.codeContent || '' : '',
        allow_copy: usesCode ? slide.allowCopy !== false : false,
        image: slide.imageFile
          ? {
              file_name: slide.imageFile.name,
              file_type: slide.imageFile.type,
              file_size: slide.imageFile.size,
              upload_field: `slide_image_${index}`,
            }
          : slide.imageName
            ? {
                file_name: slide.imageName,
                file_type: slide.imageType || null,
                file_size: slide.imageSize || null,
              }
            : null,
        image_name: slide.imageName || null,
        image_type: slide.imageType || null,
        image_size: slide.imageSize || null,
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
      source: isEdit
        ? 'admin_tutorial_edit_form'
        : 'admin_tutorial_create_form',
      frontend_route: window.location.pathname,
      request_method: isEdit ? 'POST_UPDATE' : 'POST_CREATE',
      endpoint: effectiveTutorialId
        ? `${MATERI_API_URL}?id=${encodeURIComponent(effectiveTutorialId)}`
        : MATERI_API_URL,
      generated_at: new Date().toISOString(),
    },
  });
  };

  const handleSubmit = async (event, mode = 'publish', options = {}) => {
    event?.preventDefault?.();

    const normalizedMode = String(mode || 'save').trim().toLowerCase();
    const payload = createRequestPayload(normalizedMode);

    // Simpan Bab / Simpan Materi tidak boleh tertahan validasi Step 3.
    // Validasi lengkap hanya dijalankan saat tombol Publikasikan Materi ditekan.
    const validationErrors =
      normalizedMode === 'publish'
        ? validateForm()
        : {};

    setErrors(validationErrors);
    setRequestJson({ ...payload, action: normalizedMode });
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
        JSON.stringify({ ...payload, action: normalizedMode })
      );

      if (formData.cardImage) {
        requestFormData.append('card_image', formData.cardImage);
      }

      slides.forEach((slide, index) => {
        if (slide.imageFile) {
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

      const requestUrl =
        effectiveTutorialId
          ? `${MATERI_API_URL}?id=${encodeURIComponent(effectiveTutorialId)}`
          : MATERI_API_URL;

      console.info('[ArduFlow Materi] POST endpoint:', requestUrl);
      console.info('[ArduFlow Materi] method: POST');
      console.info(
        '[ArduFlow Materi] file fields:',
        Array.from(requestFormData.entries())
          .filter(([, value]) => value instanceof File)
          .map(([key, value]) => ({ key, name: value.name, size: value.size }))
      );

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: requestFormData,
        signal: requestController.signal,
        cache: 'no-store',
      });

      const responseText = await response.text();
      const result = responseText ? JSON.parse(responseText) : {};
      const apiResponse = { status_code: response.status, ...result };

      setResponseJson(apiResponse);

      if (!response.ok) {
        const apiErrors =
          result?.errors && typeof result.errors === 'object'
            ? Object.values(result.errors).filter(Boolean)
            : [];

        const detailMessage =
          apiErrors.length > 0
            ? apiErrors.join(' ')
            : '';

        setSubmitStatus('error');

        const endpointInfo =
          ` [POST ${requestUrl} | HTTP ${response.status}]`;

        setSubmitMessage(
          (
            detailMessage ||
            result.message ||
            'Data materi gagal disimpan.'
          ) + endpointInfo
        );

        return { success: false, result };
      }

      const savedTutorialId =
        result?.data?.id ?? effectiveTutorialId ?? null;

      if (savedTutorialId) {
        setPersistedTutorialId(String(savedTutorialId));

        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set('id', String(savedTutorialId));
        window.history.replaceState({}, '', nextUrl);
      }

      if (normalizedMode === 'publish') {
        setDirtyChapterIds([]);
      }

      if (normalizedMode === 'publish') {
        setFormData((previousData) => ({
          ...previousData,
          pageSettings: {
            ...previousData.pageSettings,
            status: 'Published',
          },
        }));
      }

      setSubmitStatus('success');
      setSubmitMessage(
        options.successMessage ||
          result.message ||
          (effectiveTutorialId
            ? 'Perubahan materi berhasil disimpan.'
            : 'Materi berhasil diproses.')
      );

      return {
        success: true,
        result,
        tutorialId: savedTutorialId,
      };
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

      return { success: false, error };
    } finally {
      window.clearTimeout(requestTimeout);
      setIsSubmitting(false);
    }
  };

  const saveCurrentChapter = async () => {
    if (!activeChapter) {
      window.alert('Pilih bab yang ingin disimpan.');
      return;
    }

    const chapterTitle = String(activeChapter.title || '').trim();

    if (!chapterTitle) {
      window.alert('Judul bab wajib diisi.');
      return;
    }

    if (activeChapterSlides.length === 0) {
      window.alert(
        `Tambahkan minimal satu materi ke "${chapterTitle}" sebelum menyimpan bab.`
      );
      return;
    }

    // Simpan struktur Bab + seluruh materi tanpa memaksa tutorial menjadi Draft/Published.
    // Status tutorial tetap mengikuti pilihan pada Pengaturan.
    const saveResult = await handleSubmit(null, 'save', {
      successMessage:
        `Bab "${chapterTitle}" beserta ${activeChapterSlides.length} materi berhasil disimpan.`,
    });

    if (saveResult?.success) {
      setEditingSlideId(null);

      // Hanya Bab aktif yang dianggap sudah bersih.
      setDirtyChapterIds((previousIds) =>
        previousIds.filter(
          (id) => String(id) !== String(activeChapter.id)
        )
      );
    }
  };

  const saveCurrentMaterial = async () => {
    if (!editingSlide) {
      window.alert('Tidak ada materi yang sedang diedit.');
      return;
    }

    const materialTitle = String(editingSlide.title || '').trim();

    if (!materialTitle) {
      window.alert('Judul materi wajib diisi.');
      return;
    }

    if (!editingSlide.chapterId) {
      window.alert('Pilih Bab untuk materi ini terlebih dahulu.');
      return;
    }

    const chapterExists = chapters.some(
      (chapter) =>
        String(chapter.id) === String(editingSlide.chapterId)
    );

    if (!chapterExists) {
      window.alert(
        'Bab yang dipilih untuk materi ini tidak ditemukan. Pilih Bab kembali.'
      );
      return;
    }

    const saveResult = await handleSubmit(null, 'save', {
      successMessage:
        `Materi "${materialTitle}" berhasil disimpan ke "${activeChapter?.title || 'Bab'}".`,
    });

    if (saveResult?.success) {
      setEditingSlideId(null);
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

          <div ref={fullDescriptionRef} className="admin-tutorial-rich-field">
            <span className="admin-tutorial-label">
              Deskripsi Lengkap
              <span className="admin-tutorial-required">*</span>
            </span>
            <TinyMCEEditor
              value={formData.fullDescription}
              onChange={(value) => {
                setFormData((previousData) => ({
                  ...previousData,
                  fullDescription: value,
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
              }}
              ariaLabel="Deskripsi lengkap materi"
              height={360}
            />
            {errors.fullDescription && (
              <small className="admin-tutorial-error">
                {errors.fullDescription}
              </small>
            )}
          </div>


          <section className="admin-learning-objectives-card">
            <div className="admin-learning-objectives-head">
              <div>
                <span className="admin-tutorial-label">Tujuan Pembelajaran</span>
                <small>
                  Tujuan yang akan dilihat user sebelum memulai isi materi.
                </small>
              </div>
              <button type="button" onClick={addLearningObjective}>
                + Tambah Tujuan
              </button>
            </div>

            <div className="admin-learning-objectives-list">
              {formData.learningObjectives.map((objective, index) => (
                <div className="admin-learning-objective-row" key={`objective-${index}`}>
                  <span>{index + 1}</span>
                  <input
                    type="text"
                    value={objective}
                    onChange={(event) =>
                      updateLearningObjective(index, event.target.value)
                    }
                    placeholder="Contoh: Memahami fungsi dan spesifikasi Arduino UNO"
                  />
                  <button
                    type="button"
                    onClick={() => removeLearningObjective(index)}
                    aria-label={`Hapus tujuan pembelajaran ${index + 1}`}
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div ref={cardImageSectionRef} className="admin-tutorial-image-field">
            <span className="admin-tutorial-label">
              Gambar / Icon (untuk card)<span className="admin-tutorial-required">*</span>
            </span>
            <input ref={cardImageInputRef} id="tutorial-card-image" className="admin-tutorial-file-input" type="file" accept=".jpg,.jpeg,.png,.webp,.svg" onChange={handleImageChange} aria-invalid={Boolean(errors.cardImage)} />
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
          <h2>Add Halaman Materi</h2>
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
            <button
              type="button"
              onClick={() => handleAddSlide(activeChapterId || chapters[0]?.id)}
            >
              + Tambah Materi di {activeChapter?.title || 'Bab Aktif'}
            </button>
            <button
              type="button"
              className="is-save-chapter"
              onClick={saveCurrentChapter}
              disabled={isSubmitting || !activeChapter}
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Bab & Materi'}
            </button>
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


          <section className="admin-chapter-manager">
            <div className="admin-chapter-manager-head">
              <div>
                <h2>Bab / Chapter</h2>
                <p>Kelompokkan materi ke dalam bab agar alur belajar lebih terstruktur.</p>
              </div>
              <button
                type="button"
                onClick={handleAddChapter}
                title={
                  isActiveChapterDirty
                    ? 'Simpan bab aktif terlebih dahulu'
                    : 'Tambah bab baru'
                }
              >
                + Tambah Bab
              </button>
            </div>

            <div className="admin-chapter-list">
              {chapters.map((chapter, index) => (
                <article
                  className={`admin-chapter-item ${
                    String(activeChapterId) === String(chapter.id)
                      ? 'is-active'
                      : ''
                  }`}
                  key={chapter.id}
                  onClick={() => setActiveChapterId(chapter.id)}
                >
                  <strong>{index + 1}</strong>
                  <input
                    type="text"
                    value={chapter.title}
                    onChange={(event) =>
                      updateChapterTitle(chapter.id, event.target.value)
                    }
                    placeholder={`Bab ${index + 1}`}
                  />
                  <span>
                    {
                      slides.filter(
                        (slide) => String(slide.chapterId) === String(chapter.id)
                      ).length
                    } materi · {
                      dirtyChapterIds.includes(String(chapter.id))
                        ? 'Belum disimpan'
                        : 'Tersimpan'
                    }
                  </span>
                  <div className="admin-chapter-item-actions">
                    <button
                      type="button"
                      className="is-select"
                      onClick={(event) => {
                        event.stopPropagation();
                        setActiveChapterId(chapter.id);
                      }}
                    >
                      Pilih
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeChapter(chapter.id);
                      }}
                      disabled={chapters.length <= 1}
                    >
                      Hapus
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

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
                    <strong>{getChapterSlideNumber(slide)}</strong>
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
                  Belum ada materi pada {activeChapter?.title || 'bab aktif'}.
                  Klik Tambah Materi untuk membuat materi pertama.
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
                <div className="admin-materials-editor-head-actions">
                  <button
                    type="button"
                    className="is-secondary"
                    onClick={() => setEditingSlideId(null)}
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    className="is-save"
                    onClick={saveCurrentMaterial}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Materi'}
                  </button>
                </div>
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
                  Bab / Chapter
                  <select
                    value={editingSlide.chapterId || chapters[0]?.id || ''}
                    onChange={(event) =>
                      updateSlideField(
                        editingSlide.id,
                        'chapterId',
                        event.target.value
                      )
                    }
                  >
                    {chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.title}
                      </option>
                    ))}
                  </select>
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

              {['text', 'text_image', 'image'].includes(editingSlide.contentType) && (
                <label className="admin-materials-editor-text">
                  Isi Materi
                  <TinyMCEEditor
                    value={editingSlide.bodyText}
                    onChange={(value) =>
                      updateSlideField(
                        editingSlide.id,
                        'bodyText',
                        value
                      )
                    }
                    ariaLabel={`Teks materi ${editingSlide.title}`}
                    height={320}
                  />
                </label>
              )}


              {['text_image', 'image'].includes(editingSlide.contentType) && (
                <div className="admin-materials-editor-video-upload">
                  <strong>Gambar Slide</strong>
                  <button
                    type="button"
                    onClick={() => slideImageInputRef.current?.click()}
                  >
                    Pilih Gambar
                  </button>
                  <span>
                    {editingSlide.imageName || 'Belum ada gambar dipilih'}
                  </span>
                  {editingSlide.imagePreview && (
                    <img
                      src={editingSlide.imagePreview}
                      alt={`Preview ${editingSlide.title}`}
                      style={{
                        width: '100%',
                        maxWidth: 420,
                        maxHeight: 240,
                        objectFit: 'contain',
                        borderRadius: 10,
                      }}
                    />
                  )}
                  <input
                    ref={slideImageInputRef}
                    className="admin-tutorial-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    onChange={handleSlideImageChange}
                  />
                </div>
              )}


              {editingSlide.contentType === 'code' && (
                <section className="admin-code-editor">
                  <div className="admin-materials-editor-grid">
                    <label>
                      Judul Code
                      <input
                        value={editingSlide.codeTitle || ''}
                        onChange={(event) =>
                          updateSlideField(
                            editingSlide.id,
                            'codeTitle',
                            event.target.value
                          )
                        }
                        placeholder="Contoh Kode: Blink LED"
                      />
                    </label>

                    <label>
                      Bahasa
                      <select
                        value={editingSlide.codeLanguage || 'cpp'}
                        onChange={(event) =>
                          updateSlideField(
                            editingSlide.id,
                            'codeLanguage',
                            event.target.value
                          )
                        }
                      >
                        <option value="cpp">Arduino / C++</option>
                        <option value="c">C</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="json">JSON</option>
                        <option value="bash">Bash</option>
                        <option value="text">Plain Text</option>
                      </select>
                    </label>
                  </div>

                  <label className="admin-materials-editor-text">
                    Isi Code
                    <textarea
                      className="admin-code-editor-textarea"
                      value={editingSlide.codeContent || ''}
                      onChange={(event) =>
                        updateSlideField(
                          editingSlide.id,
                          'codeContent',
                          event.target.value
                        )
                      }
                      rows="14"
                      spellCheck="false"
                      placeholder={'void setup() {\n  pinMode(13, OUTPUT);\n}'}
                    />
                  </label>

                  <label className="admin-code-copy-option">
                    <input
                      type="checkbox"
                      checked={editingSlide.allowCopy !== false}
                      onChange={(event) =>
                        updateSlideField(
                          editingSlide.id,
                          'allowCopy',
                          event.target.checked
                        )
                      }
                    />
                    <span>Tampilkan tombol Salin pada halaman user</span>
                  </label>
                </section>
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
                    <div className="admin-materials-editor-video-upload">
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
            <p>
              Bab aktif: <strong>{activeChapter?.title || '-'}</strong>.
              Simpan bab sebelum membuat bab berikutnya.
            </p>
            <div>
              {slides.map((slide, index) => (
                <article className={selectedSlideId === slide.id ? 'is-active' : ''} key={slide.id} onClick={() => setSelectedSlideId(slide.id)}>
                  <strong>{getChapterSlideNumber(slide)}</strong>
                  <span>
                    {chapters.find(
                      (chapter) => String(chapter.id) === String(slide.chapterId)
                    )?.title || 'Tanpa Bab'} · {slide.title}
                  </span>
                  <small>{slide.status}</small>
                </article>
              ))}
            </div>
            <b>Total {slides.length} Materi</b>
          </section>

          <section className="admin-materials-selected-preview">
            <h2>Preview Materi Terpilih</h2>
            <h3>
              #{selectedSlide ? getChapterSlideNumber(selectedSlide) : 0}{' '}
              {selectedSlide?.title || 'Belum ada materi'}
            </h3>
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

            {selectedSlide?.contentType === 'code' && (
              <div className="admin-code-preview">
                <div>
                  <strong>{selectedSlide.codeTitle || 'Code'}</strong>
                  <span>{selectedSlide.codeLanguage || 'text'}</span>
                </div>
                <pre>{selectedSlide.codeContent || '// Belum ada code'}</pre>
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
                  accept=".jpg,.jpeg,.png,.webp,.svg"
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
              ? 'Gagal menyimpan materi'
              : 'Materi berhasil disimpan'}
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
            onClick={(event) => handleSubmit(event, 'save')}
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
            <h2>{isEdit ? 'Debug Form Edit Materi' : 'Debug Form Tambah Materi'}</h2>
            <p>Request dan response API.</p>
          </div>

          {requestJson && (
            <article className="admin-tutorial-debug-card">
              <div className="admin-tutorial-debug-header">
                <div>
                  <h3>Request JSON</h3>
                  <span>
                    {isEdit ? 'POST UPDATE' : 'POST'}{' '}
                    {isEdit && tutorialId
                      ? `${MATERI_API_URL}?id=${tutorialId}`
                      : MATERI_API_URL}
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

  if (isEdit && isLoadingTutorial) {
    return (
      <main className="admin-tutorial-create-page admin-tutorial-create-polished">
        <div className="admin-tutorial-create-shell">
          <section className="admin-tutorial-create-card">
            <h2>Memuat Materi...</h2>
            <p>Data materi sedang diambil dari API.</p>
          </section>
        </div>
      </main>
    );
  }

  if (isEdit && loadError) {
    return (
      <main className="admin-tutorial-create-page admin-tutorial-create-polished">
        <div className="admin-tutorial-create-shell">
          <section className="admin-tutorial-create-card">
            <h2>Data materi gagal dimuat</h2>
            <p>{loadError}</p>
            <a className="admin-tutorial-create-back" href="/admin/tutorial">
              Kembali ke Tutorial
            </a>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-tutorial-create-page admin-tutorial-create-polished">
      <div className="admin-tutorial-create-shell">
        <section className="admin-tutorial-create-hero">
          <div>
            <div className="admin-tutorial-create-eyebrow">
              <span>{isEdit ? 'Edit Materi' : 'Materi Baru'}</span>
              <span className="is-draft">{formData.pageSettings.status}</span>
            </div>

            <h1>{isEdit ? 'Edit Materi' : 'Tambah Materi'}</h1>
            <p>
              {activeStep === 2
                ? 'Buat, urutkan, dan kelola halaman materi dengan editor TipTap.'
                : activeStep === 3
                  ? 'Atur bagaimana materi ditampilkan dan dipublikasikan di platform.'
                  : 'Lengkapi cover dan informasi utama sebelum menyusun halaman pembelajaran.'}
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


export function AdminTutorialCreate() {
  return <AdminTutorialForm mode="create" />;
}

export function AdminTutorialEdit() {
  return <AdminTutorialForm mode="edit" />;
}
