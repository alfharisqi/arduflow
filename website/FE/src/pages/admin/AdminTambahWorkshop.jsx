import { useEffect, useMemo, useRef, useState } from 'react';
import { WorkshopImageCropper } from '../../features/profile-image-crop/WorkshopImageCropper.jsx';
import { API_BASE_URL, apiEndpoint } from '../../services/apiEndpoints.js';

const levels = ['Pemula', 'Menengah', 'Lanjutan'];
const categories = ['Arduino', 'IoT', 'Visual Programming', 'Sekolah'];
const timezones = ['WIB (GMT+7)', 'WITA (GMT+8)', 'WIT (GMT+9)'];
const workshopTypes = ['Online', 'Offline', 'Hybrid'];

const WORKSHOP_ENDPOINT =
  apiEndpoint(import.meta.env.VITE_WORKSHOP_API_URL, '/api/workshop-api.php');
const DEBUG_WORKSHOP_FORM =
  import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true';

const WORKSHOP_IMAGE_UPLOAD_ENDPOINT = `${WORKSHOP_ENDPOINT}${
  WORKSHOP_ENDPOINT.includes('?') ? '&' : '?'
}action=upload-image`;
const IMAGE_UPLOAD_TIMEOUT_MS = 60000;

const requiredFields = [
  ['title', 'Judul Workshop'],
  ['slug', 'Slug'],
  ['summary', 'Deskripsi Singkat'],
  ['level', 'Level'],
  ['duration', 'Durasi'],
  ['platform', 'Platform / Tempat'],
  ['category', 'Kategori'],
  ['type', 'Tipe Workshop'],
  ['workshopDate', 'Tanggal'],
  ['time', 'Waktu'],
  ['location', 'Lokasi'],
  ['price', 'Harga'],
  ['about', 'Tentang Workshop'],
  ['coverImage', 'Gambar Sampul'],
];

const initialFormData = {
  title: '',
  slug: '',
  summary: '',
  level: '',
  duration: '',
  platform: '',
  category: '',
  type: 'Online',
  workshopDate: '',
  time: '',
  timezone: 'WIB (GMT+7)',
  location: '',
  price: '',
  facilities: '',
  bringItems: '',
  about: '',
  status: 'Draft',
  visibility: 'Publik',
  isHomepageVisible: false,
  metaTitle: '',
  metaDescription: '',
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatFileMetadata(file) {
  if (!file) return null;

  return {
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    sizeKB: Number((file.size / 1024).toFixed(2)),
    lastModified: file.lastModified,
    lastModifiedISO: new Date(file.lastModified).toISOString(),
  };
}

async function uploadImageFile(file) {
  const uploadData = new FormData();
  uploadData.append('image', file);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    IMAGE_UPLOAD_TIMEOUT_MS,
  );

  let response;

  try {
    response = await fetch(WORKSHOP_IMAGE_UPLOAD_ENDPOINT, {
      method: 'POST',
      body: uploadData,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Upload gambar terlalu lama. Periksa koneksi VPN gate atau kecilkan ukuran gambar.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  const rawText = await response.text();
  let result;

  try {
    result = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(
      `Response upload gambar bukan JSON. HTTP ${response.status}.`,
    );
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || `Upload gambar gagal. HTTP ${response.status}.`,
    );
  }

  const uploaded = result.data || {};
  const size = Number(uploaded.size ?? file.size ?? 0);

  return {
    name: uploaded.originalName || file.name,
    storedName: uploaded.name || '',
    originalName: uploaded.originalName || file.name,
    type: uploaded.type || file.type || 'application/octet-stream',
    size,
    sizeKB: Number((size / 1024).toFixed(2)),
    url: uploaded.url || '',
  };
}

function formatPrice(value) {
  const number = Number(String(value || '').replace(/\D/g, ''));
  if (!number) return 'Gratis / Belum diisi';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number);
}

function resolveImageUrl(image) {
  const url = image?.url || image?.file_url || image?.relativeUrl || image?.relative_url || '';
  const cleanUrl = typeof url === 'string' ? url.trim() : '';

  if (!cleanUrl) {
    return '';
  }

  if (/^https?:\/\//i.test(cleanUrl) || cleanUrl.startsWith('data:')) {
    return cleanUrl;
  }

  return `${API_BASE_URL}/${cleanUrl.replace(/^\/+/, '')}`;
}

function SectionTitle({ number, title }) {
  return (
    <div className="admin-section-title">
      <span>{number}</span>
      <h2>{title}</h2>
    </div>
  );
}

function Field({ label, required, counter, children, className = '', error }) {
  return (
    <div className={`admin-field ${className} ${error ? 'admin-field--error' : ''}`}>
      <span className="admin-field-head">
        <span>
          {label}
          {required && <b> *</b>}
        </span>
        {counter && <em>{counter}</em>}
      </span>
      {children}
      {error && <small className="admin-field-error">{error}</small>}
    </div>
  );
}

function SidebarCard({ title, children, className = '' }) {
  return (
    <aside className={`admin-side-card ${className}`}>
      <h3>{title}</h3>
      {children}
    </aside>
  );
}

function UploadBox({
  title,
  note,
  buttonLabel,
  compact = false,
  accept,
  multiple = false,
  onChange,
  inputRef,
  selectedText,
}) {
  return (
    <label className={`admin-upload-box ${compact ? 'compact' : ''}`}>
      <input
        ref={inputRef}
        className="admin-upload-input"
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onChange}
      />
      <span className="admin-upload-icon" aria-hidden="true" />
      <strong>{selectedText || title}</strong>
      <small>{note}</small>
      {buttonLabel && <span className="admin-muted-button admin-upload-button">{buttonLabel}</span>}
    </label>
  );
}

export function AdminTambahWorkshop() {
  const editorRef = useRef(null);
  const fieldRefs = useRef({});

  const [formData, setFormData] = useState(initialFormData);
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [moduleFile, setModuleFile] = useState(null);
  const [coverCrop, setCoverCrop] = useState(null);
  const [errors, setErrors] = useState({});
  const [formMessage, setFormMessage] = useState('');
  const [debugMode, setDebugMode] = useState('live');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const editingId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get('id'));

    return Number.isInteger(id) && id > 0 ? id : null;
  }, []);

  const isEditMode = editingId !== null;
  const [isLoadingEdit, setIsLoadingEdit] = useState(isEditMode);

  useEffect(
    () => () => {
      if (coverCrop?.source) {
        URL.revokeObjectURL(coverCrop.source);
      }
    },
    [coverCrop],
  );


  const requestPayload = useMemo(
    () => ({
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      summary: formData.summary.trim(),
      level: formData.level,
      duration: formData.duration.trim(),
      platform: formData.platform.trim(),
      category: formData.category,
      type: formData.type,
      schedule: {
        date: formData.workshopDate,
        time: formData.time.trim(),
        timezone: formData.timezone,
      },
      location: formData.location.trim(),
      price: formData.price.trim(),
      facilities: formData.facilities.trim() || null,
      bringItems: formData.bringItems.trim() || null,
      about: formData.about.trim(),
      publication: {
        status: formData.status,
        visibility: formData.visibility,
        homepageVisible: formData.isHomepageVisible,
      },
      media: {
        coverImage,
        gallery: galleryImages,
      },
      attachment: {
        module: moduleFile,
      },
      seo: {
        metaTitle: formData.metaTitle.trim() || null,
        metaDescription: formData.metaDescription.trim() || null,
      },
    }),
    [formData, coverImage, galleryImages, moduleFile],
  );

  useEffect(() => {
    if (!editingId) {
      setIsLoadingEdit(false);
      return undefined;
    }

    let isActive = true;

    async function loadWorkshopForEdit() {
      setIsLoadingEdit(true);
      setFormMessage('Mengambil data workshop untuk diedit...');
      setDebugMode('live');

      try {
        const endpoint = `${WORKSHOP_ENDPOINT}?id=${encodeURIComponent(editingId)}`;

        if (DEBUG_WORKSHOP_FORM) {
          console.group('[AdminTambahWorkshop] LOAD EDIT DATA');
          console.log('Endpoint:', endpoint);
          console.groupEnd();
        }

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        const rawText = await response.text();
        let result;

        try {
          result = rawText ? JSON.parse(rawText) : {};
        } catch {
          throw new Error(`Response API bukan JSON. HTTP ${response.status}.`);
        }

        if (!response.ok || !result.success) {
          throw new Error(result.message || `Gagal mengambil workshop. HTTP ${response.status}.`);
        }

        const workshop = result.data?.workshop;
        const payload = workshop?.payload && typeof workshop.payload === 'object'
          ? workshop.payload
          : {};

        if (!workshop) {
          throw new Error('Data workshop tidak ditemukan pada response API.');
        }

        if (!isActive) return;

        setFormData({
          ...initialFormData,
          title: payload.title || workshop.title || '',
          slug: payload.slug || workshop.slug || '',
          summary: payload.summary || '',
          level: payload.level || '',
          duration: payload.duration || '',
          platform: payload.platform || '',
          category: payload.category || workshop.category || '',
          type: payload.type || 'Online',
          workshopDate: payload.schedule?.date || '',
          time: payload.schedule?.time || '',
          timezone: payload.schedule?.timezone || 'WIB (GMT+7)',
          location: payload.location || '',
          price: String(payload.price ?? ''),
          facilities: payload.facilities || '',
          bringItems: payload.bringItems || '',
          about: payload.about || '',
          status: payload.publication?.status || workshop.status || 'Draft',
          visibility: payload.publication?.visibility || 'Publik',
          isHomepageVisible: Boolean(payload.publication?.homepageVisible),
          metaTitle: payload.seo?.metaTitle || '',
          metaDescription: payload.seo?.metaDescription || '',
        });

        const existingCoverImage = payload.media?.coverImage ?? null;
        setCoverImage(existingCoverImage);
        setCoverPreview(resolveImageUrl(existingCoverImage));
        setGalleryImages(
          Array.isArray(payload.media?.gallery) ? payload.media.gallery : [],
        );
        setModuleFile(payload.attachment?.module ?? null);
        setErrors({});
        setFormMessage(`Mode edit aktif. Workshop ID ${editingId} berhasil dimuat.`);
        setDebugMode('success');
      } catch (error) {
        if (!isActive) return;

        console.error('[AdminTambahWorkshop] LOAD EDIT ERROR:', error);
        setFormMessage(`Gagal memuat workshop untuk diedit: ${error.message}`);
        setDebugMode('error');
      } finally {
        if (isActive) setIsLoadingEdit(false);
      }
    }

    loadWorkshopForEdit();

    return () => {
      isActive = false;
    };
  }, [editingId]);

  async function sendWorkshopToApi(payload) {
    const endpoint = isEditMode
      ? `${WORKSHOP_ENDPOINT}?id=${encodeURIComponent(editingId)}`
      : WORKSHOP_ENDPOINT;

    const method = isEditMode ? 'PUT' : 'POST';

    try {
      if (DEBUG_WORKSHOP_FORM) {
        console.group('[AdminTambahWorkshop] REQUEST API');
        console.log('Mode:', isEditMode ? 'EDIT' : 'CREATE');
        console.log('Method:', method);
        console.log('Endpoint:', endpoint);
        console.log('Payload:', payload);
        console.log('JSON:', JSON.stringify(payload, null, 2));
        console.groupEnd();
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();
      let result;

      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(
          `Response API bukan JSON. HTTP ${response.status}. Pastikan workshop-api.php tidak menghasilkan warning/error HTML.`,
        );
      }

      if (DEBUG_WORKSHOP_FORM) {
        console.group('[AdminTambahWorkshop] RESPONSE API');
        console.log('HTTP Status:', response.status);
        console.log('Response:', result);
        console.groupEnd();
      }

      if (!response.ok || !result.success) {
        const apiError = new Error(result.message || 'Gagal menyimpan workshop.');
        apiError.status = response.status;
        apiError.response = result;
        throw apiError;
      }

      return result;
    } catch (error) {
      console.error('[AdminTambahWorkshop] API ERROR:', error);
      throw error;
    }
  }

  function registerFieldRef(name) {
    return (node) => {
      if (node) fieldRefs.current[name] = node;
    };
  }

  function clearFieldError(name) {
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function updateField(name, value) {
    setFormData((current) => ({ ...current, [name]: value }));
    clearFieldError(name);
    setFormMessage('');
    setDebugMode('live');

    if (DEBUG_WORKSHOP_FORM) {
      console.log(`[AdminTambahWorkshop] ${name}:`, value);
    }
  }

  function handleTitleChange(event) {
    const nextTitle = event.target.value;

    setFormData((current) => {
      const currentGeneratedSlug = slugify(current.title);
      const shouldUpdateSlug = !current.slug || current.slug === currentGeneratedSlug;

      return {
        ...current,
        title: nextTitle,
        slug: shouldUpdateSlug ? slugify(nextTitle) : current.slug,
      };
    });

    clearFieldError('title');
    clearFieldError('slug');
    setFormMessage('');
    setDebugMode('live');
    if (DEBUG_WORKSHOP_FORM) {
      console.log('[AdminTambahWorkshop] title:', nextTitle);
    }
  }

  function handleSlugChange(event) {
    updateField('slug', slugify(event.target.value));
  }

  function handlePriceChange(event) {
    updateField('price', event.target.value.replace(/\D/g, ''));
  }

  async function uploadCroppedCover(file, previewUrl) {
    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        coverImage: 'Hasil crop masih lebih dari 5 MB. Gunakan gambar yang lebih kecil.',
      }));
      setFormMessage('Hasil crop terlalu besar untuk diupload.');
      setDebugMode('error');
      return;
    }

    setIsUploadingCover(true);
    setFormMessage('Mengupload gambar sampul hasil crop ke server...');
    setDebugMode('live');
    setCoverPreview(previewUrl);

    try {
      const uploadedImage = await uploadImageFile(file);

      if (!uploadedImage.url) {
        throw new Error('Server tidak mengembalikan URL gambar.');
      }

      setCoverImage(uploadedImage);
      setCoverPreview(uploadedImage.url);
      clearFieldError('coverImage');
      setFormMessage('Gambar sampul berhasil dicrop dan diupload.');
      setDebugMode('success');

      if (DEBUG_WORKSHOP_FORM) {
        console.log(
          '[AdminTambahWorkshop] cropped cover image uploaded:',
          uploadedImage,
        );
      }
    } catch (error) {
      console.error('[AdminTambahWorkshop] COVER UPLOAD ERROR:', error);

      setErrors((current) => ({
        ...current,
        coverImage: error.message || 'Upload gambar sampul gagal.',
      }));
      setFormMessage(
        `Upload gambar sampul gagal: ${error.message || 'Terjadi kesalahan.'}`,
      );
      setDebugMode('error');
    } finally {
      setIsUploadingCover(false);
    }
  }

  function handleCoverChange(event) {
    const file = event.target.files?.[0] || null;
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors((current) => ({
        ...current,
        coverImage: 'Gambar sampul harus berupa file gambar.',
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        coverImage: 'Ukuran gambar sampul maksimal 5 MB.',
      }));
      return;
    }

    clearFieldError('coverImage');
    setFormMessage('Atur crop gambar sampul sebelum upload.');
    setDebugMode('live');
    setCoverCrop({
      source: URL.createObjectURL(file),
      fileName: file.name,
    });
  }

  async function handleGalleryChange(event) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      setGalleryImages([]);
      return;
    }

    const invalidFile = files.find((file) => !file.type.startsWith('image/'));

    if (invalidFile) {
      setFormMessage(`File ${invalidFile.name} bukan gambar.`);
      setDebugMode('error');
      event.target.value = '';
      return;
    }

    const oversizedFile = files.find((file) => file.size > 5 * 1024 * 1024);

    if (oversizedFile) {
      setFormMessage(`Ukuran ${oversizedFile.name} melebihi 5 MB.`);
      setDebugMode('error');
      event.target.value = '';
      return;
    }

    setIsUploadingGallery(true);
    setFormMessage(`Mengupload ${files.length} gambar galeri...`);
    setDebugMode('live');

    try {
      const uploadedImages = await Promise.all(
        files.map((file) => uploadImageFile(file)),
      );

      setGalleryImages(uploadedImages);
      setFormMessage(`${uploadedImages.length} gambar galeri berhasil diupload.`);
      setDebugMode('success');

      if (DEBUG_WORKSHOP_FORM) {
        console.log(
          '[AdminTambahWorkshop] gallery images uploaded:',
          uploadedImages,
        );
      }
    } catch (error) {
      console.error('[AdminTambahWorkshop] GALLERY UPLOAD ERROR:', error);
      setGalleryImages([]);
      setFormMessage(
        `Upload galeri gagal: ${error.message || 'Terjadi kesalahan.'}`,
      );
      setDebugMode('error');
    } finally {
      setIsUploadingGallery(false);
    }
  }

  function handleModuleChange(event) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setModuleFile(null);
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setModuleFile(null);
      setFormMessage('File modul harus berupa PDF.');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setModuleFile(null);
      setFormMessage('Ukuran file modul maksimal 10 MB.');
      event.target.value = '';
      return;
    }

    const metadata = formatFileMetadata(file);
    setModuleFile(metadata);
    setDebugMode('live');
    if (DEBUG_WORKSHOP_FORM) {
      console.log('[AdminTambahWorkshop] module metadata:', metadata);
    }
  }

  function validateForm() {
    const nextErrors = {};

    requiredFields.forEach(([field, label]) => {
      let value;

      if (field === 'coverImage') {
        value = coverImage;
      } else {
        value = formData[field];
      }

      const isEmpty = value === null || value === undefined || (typeof value === 'string' && !value.trim());

      if (isEmpty) {
        nextErrors[field] = `${label} wajib diisi.`;
      }
    });

    return nextErrors;
  }

  function focusFirstInvalidField(nextErrors) {
    const firstInvalidField = requiredFields.find(([field]) => nextErrors[field])?.[0];
    if (!firstInvalidField) return;

    requestAnimationFrame(() => {
      const target = fieldRefs.current[firstInvalidField];
      if (!target) return;

      target.scrollIntoView({ behavior: 'smooth', block: 'center' });

      window.setTimeout(() => {
        target.focus?.({ preventScroll: true });
      }, 350);
    });
  }

  async function handlePublish(event) {
    event.preventDefault();

    const nextErrors = validateForm();
    const missingFields = requiredFields
      .filter(([field]) => nextErrors[field])
      .map(([, label]) => label);

    if (DEBUG_WORKSHOP_FORM) {
      console.group('[AdminTambahWorkshop] DEBUG PUBLISH');
      console.log('Request JSON:', requestPayload);
      console.log('Request JSON string:', JSON.stringify(requestPayload, null, 2));
      console.log('Validation errors:', nextErrors);
      console.groupEnd();
    }

    if (missingFields.length > 0) {
      setErrors(nextErrors);
      setFormMessage(
        `Masih ada ${missingFields.length} kolom wajib yang belum diisi: ${missingFields.join(', ')}.`,
      );
      setDebugMode('error');
      focusFirstInvalidField(nextErrors);
      return;
    }

    setErrors({});
    setFormMessage(isEditMode ? 'Menyimpan perubahan workshop...' : 'Mengirim data workshop ke server...');
    setDebugMode('live');
    setIsSaving(true);

    if (DEBUG_WORKSHOP_FORM) {
      console.info('[AdminTambahWorkshop] VALIDASI BERHASIL. Mengirim payload ke backend...');
    }

    try {
      const result = await sendWorkshopToApi(requestPayload);

      setFormMessage(
        isEditMode
          ? `Workshop berhasil diperbarui. ID Workshop: ${result.data?.id ?? editingId ?? '-'}.`
          : `Workshop berhasil disimpan ke SQLite. ID Workshop: ${result.data?.id ?? '-'}.`,
      );
      setDebugMode('success');

      if (DEBUG_WORKSHOP_FORM) {
        console.info('[AdminTambahWorkshop] WORKSHOP BERHASIL DISIMPAN:', result);
      }

      window.alert(
        isEditMode
          ? `Workshop berhasil diperbarui!\nID: ${result.data?.id ?? editingId ?? '-'}`
          : `Workshop berhasil disimpan!\nID: ${result.data?.id ?? '-'}`,
      );

      if (isEditMode) {
        window.location.href = '/admin/program';
      }
    } catch (error) {
      const backendErrors = error.response?.errors;

      if (backendErrors && typeof backendErrors === 'object') {
        const fieldMap = {
          title: 'title',
          slug: 'slug',
          summary: 'summary',
          level: 'level',
          duration: 'duration',
          platform: 'platform',
          category: 'category',
          type: 'type',
          'schedule.date': 'workshopDate',
          'schedule.time': 'time',
          location: 'location',
          price: 'price',
          about: 'about',
          'media.coverImage': 'coverImage',
          'media.coverImage.name': 'coverImage',
          'media.coverImage.type': 'coverImage',
          'media.coverImage.size': 'coverImage',
        };

        const mappedErrors = {};

        Object.entries(backendErrors).forEach(([apiField, message]) => {
          const formField = fieldMap[apiField];
          if (formField) mappedErrors[formField] = message;
        });

        if (Object.keys(mappedErrors).length > 0) {
          setErrors(mappedErrors);
          focusFirstInvalidField(mappedErrors);
        }
      }

      setFormMessage(`Gagal menyimpan workshop: ${error.message}`);
      setDebugMode('error');

      console.error('[AdminTambahWorkshop] GAGAL MENYIMPAN:', error);
    } finally {
      setIsSaving(false);
    }
  }

  function handleSaveDraft() {
    const draftPayload = {
      ...requestPayload,
      publication: {
        ...requestPayload.publication,
        status: 'Draft',
      },
    };

    setFormData((current) => ({ ...current, status: 'Draft' }));
    setFormMessage('Draft debug berhasil dibuat. Draft boleh disimpan meskipun field wajib belum lengkap.');
    setDebugMode('draft');

    if (DEBUG_WORKSHOP_FORM) {
      console.group('[AdminTambahWorkshop] DEBUG SAVE DRAFT');
      console.log('Draft JSON:', draftPayload);
      console.log('Draft JSON string:', JSON.stringify(draftPayload, null, 2));
      console.groupEnd();
    }
  }

  function restoreEditorSelection(start, end) {
    requestAnimationFrame(() => {
      if (!editorRef.current) return;
      editorRef.current.focus();
      editorRef.current.setSelectionRange(start, end);
    });
  }

  function replaceEditorSelection(nextText, selectionStart, selectionEnd) {
    const input = editorRef.current;
    const start = input?.selectionStart ?? formData.about.length;
    const end = input?.selectionEnd ?? formData.about.length;
    const nextValue = `${formData.about.slice(0, start)}${nextText}${formData.about.slice(end)}`;

    updateField('about', nextValue);
    restoreEditorSelection(start + selectionStart, start + selectionEnd);
  }

  function wrapEditorSelection(prefix, suffix, fallback) {
    const input = editorRef.current;
    const start = input?.selectionStart ?? formData.about.length;
    const end = input?.selectionEnd ?? formData.about.length;
    const selectedText = formData.about.slice(start, end) || fallback;
    const nextText = `${prefix}${selectedText}${suffix}`;

    replaceEditorSelection(nextText, prefix.length, prefix.length + selectedText.length);
  }

  function transformSelectedLines(transformLine) {
    const input = editorRef.current;
    const selectionStart = input?.selectionStart ?? formData.about.length;
    const selectionEnd = input?.selectionEnd ?? formData.about.length;
    const lineStart = formData.about.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
    const nextBreak = formData.about.indexOf('\n', selectionEnd);
    const lineEnd = nextBreak === -1 ? formData.about.length : nextBreak;
    const block = formData.about.slice(lineStart, lineEnd) || '';
    const nextBlock = block.split('\n').map(transformLine).join('\n');
    const nextValue = `${formData.about.slice(0, lineStart)}${nextBlock}${formData.about.slice(lineEnd)}`;

    updateField('about', nextValue);
    restoreEditorSelection(lineStart, lineStart + nextBlock.length);
  }

  function stripLinePrefix(line) {
    return line.replace(/^(\s*)(#{1,6}\s+|>\s+|[-*]\s+|\d+\.\s+)/, '$1');
  }

  function applyEditorFormat(format) {
    if (format === 'Heading') {
      transformSelectedLines(
        (line) => `${line.match(/^\s*/)?.[0] ?? ''}## ${stripLinePrefix(line).trimStart()}`,
      );
      return;
    }

    if (format === 'Quote') {
      transformSelectedLines(
        (line) => `${line.match(/^\s*/)?.[0] ?? ''}> ${stripLinePrefix(line).trimStart()}`,
      );
      return;
    }

    transformSelectedLines((line) => stripLinePrefix(line));
  }

  function openDatePicker(event) {
    try {
      event.currentTarget.showPicker?.();
    } catch {
      // Some browsers only allow opening the picker from direct pointer actions.
    }
  }

  return (
    <>
    <main className="admin-workshop-page">
      <header className="admin-workshop-header">
        <a
          className="admin-workshop-back"
          href="/admin/program"
          aria-label="Kembali ke halaman Workshop Program"
        >
          <span aria-hidden="true">&lt;</span>
          Kembali
        </a>

        <h1>{isEditMode ? 'Edit Workshop' : 'Tambah Workshop'}</h1>
        <p>
          {isEditMode
            ? `Perbarui data workshop ID ${editingId}. Perubahan akan disimpan ke SQLite.`
            : 'Buat workshop baru yang akan ditampilkan di halaman daftar dan detail workshop.'}
        </p>
      </header>

      {formMessage && (
        <div
          className={`admin-form-message ${
            debugMode === 'error'
              ? 'is-error'
              : debugMode === 'success'
                ? 'is-success'
                : 'is-info'
          }`}
          role="alert"
        >
          {formMessage}
        </div>
      )}

      <form className="admin-workshop-layout" onSubmit={handlePublish} noValidate>
        <div className="admin-workshop-form">
          <section className="admin-form-section">
            <SectionTitle number="1" title="Informasi Dasar" />
            <div className="admin-grid two">
              <Field label="Judul Workshop" required error={errors.title}>
                <input
                  ref={registerFieldRef('title')}
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="Masukkan judul workshop"
                  aria-invalid={Boolean(errors.title)}
                />
              </Field>

              <Field label="Slug (URL)" required error={errors.slug}>
                <input
                  ref={registerFieldRef('slug')}
                  type="text"
                  value={formData.slug}
                  onChange={handleSlugChange}
                  placeholder="judul-workshop"
                  aria-invalid={Boolean(errors.slug)}
                />
              </Field>
            </div>

            <Field
              label="Deskripsi Singkat"
              required
              counter={`${formData.summary.length}/150`}
              error={errors.summary}
            >
              <input
                ref={registerFieldRef('summary')}
                type="text"
                maxLength={150}
                value={formData.summary}
                onChange={(event) => updateField('summary', event.target.value)}
                placeholder="Tuliskan deskripsi singkat workshop (akan tampil di kartu daftar workshop)..."
                aria-invalid={Boolean(errors.summary)}
              />
            </Field>
          </section>

          <section className="admin-form-section">
            <SectionTitle number="2" title="Detail Workshop" />
            <div className="admin-grid three">
              <Field label="Tingkat / Level" required error={errors.level}>
                <select
                  ref={registerFieldRef('level')}
                  value={formData.level}
                  onChange={(event) => updateField('level', event.target.value)}
                  aria-invalid={Boolean(errors.level)}
                >
                  <option value="" disabled>
                    Pilih tingkat
                  </option>
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Durasi" required error={errors.duration}>
                <input
                  ref={registerFieldRef('duration')}
                  type="text"
                  value={formData.duration}
                  onChange={(event) => updateField('duration', event.target.value)}
                  placeholder="Contoh: 3 Jam"
                  aria-invalid={Boolean(errors.duration)}
                />
              </Field>

              <Field label="Platform / Tempat" required error={errors.platform}>
                <input
                  ref={registerFieldRef('platform')}
                  type="text"
                  value={formData.platform}
                  onChange={(event) => updateField('platform', event.target.value)}
                  placeholder="Contoh: Arduflow IDE"
                  aria-invalid={Boolean(errors.platform)}
                />
              </Field>

              <Field label="Kategori" required error={errors.category}>
                <select
                  ref={registerFieldRef('category')}
                  value={formData.category}
                  onChange={(event) => updateField('category', event.target.value)}
                  aria-invalid={Boolean(errors.category)}
                >
                  <option value="" disabled>
                    Pilih kategori
                  </option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Tipe Workshop"
                required
                className="admin-type-field"
                error={errors.type}
              >
                <div className="admin-radio-group">
                  {workshopTypes.map((item, index) => (
                    <label key={item}>
                      <input
                        ref={index === 0 ? registerFieldRef('type') : undefined}
                        type="radio"
                        name="workshop-type"
                        value={item}
                        checked={formData.type === item}
                        onChange={() => updateField('type', item)}
                      />
                      <span />
                      {item}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          </section>

          <section className="admin-form-section">
            <SectionTitle number="3" title="Jadwal & Lokasi" />
            <div className="admin-grid three">
              <Field label="Tanggal" required error={errors.workshopDate}>
                <span
                  className={`admin-icon-field calendar ${formData.workshopDate ? 'has-value' : ''}`}
                  data-placeholder="Pilih tanggal"
                >
                  <input
                    ref={registerFieldRef('workshopDate')}
                    type="date"
                    value={formData.workshopDate}
                    onChange={(event) => updateField('workshopDate', event.target.value)}
                    onClick={openDatePicker}
                    onFocus={openDatePicker}
                    aria-label="Pilih tanggal workshop"
                    aria-invalid={Boolean(errors.workshopDate)}
                  />
                </span>
              </Field>

              <Field label="Waktu" required error={errors.time}>
                <span className="admin-icon-field clock">
                  <input
                    ref={registerFieldRef('time')}
                    type="text"
                    value={formData.time}
                    onChange={(event) => updateField('time', event.target.value)}
                    placeholder="Contoh: 09.00 - 12.00"
                    aria-invalid={Boolean(errors.time)}
                  />
                </span>
              </Field>

              <Field label="Zona Waktu">
                <select
                  value={formData.timezone}
                  onChange={(event) => updateField('timezone', event.target.value)}
                >
                  {timezones.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Lokasi / Tempat" required className="wide" error={errors.location}>
                <input
                  ref={registerFieldRef('location')}
                  type="text"
                  value={formData.location}
                  onChange={(event) => updateField('location', event.target.value)}
                  placeholder="Contoh: Smart Home System, Perum Permata Regency Blok. 32 atau Online (Zoom/Meet)"
                  aria-invalid={Boolean(errors.location)}
                />
              </Field>
            </div>
          </section>

          <section className="admin-form-section">
            <SectionTitle number="4" title="Harga & Fasilitas" />
            <Field label="Harga" required className="admin-price-field" error={errors.price}>
              <span>
                <input
                  ref={registerFieldRef('price')}
                  type="text"
                  inputMode="numeric"
                  value={formData.price}
                  onChange={handlePriceChange}
                  placeholder="Contoh: 50000"
                  aria-invalid={Boolean(errors.price)}
                />
                <strong>IDR</strong>
              </span>
            </Field>

            <div className="admin-grid two">
              <Field label="Fasilitas / Termasuk">
                <textarea
                  value={formData.facilities}
                  onChange={(event) => updateField('facilities', event.target.value)}
                  placeholder="Contoh: Modul, Sertifikat, E-certificate, Akses Materi..."
                />
              </Field>

              <Field label="Yang Harus Dibawa (Opsional)">
                <textarea
                  value={formData.bringItems}
                  onChange={(event) => updateField('bringItems', event.target.value)}
                  placeholder="Contoh: Laptop, Arduino Uno, Kabel USB..."
                />
              </Field>
            </div>
          </section>

          <section className="admin-form-section">
            <SectionTitle number="5" title="Konten Lengkap" />
            <Field label="Tentang Workshop" required error={errors.about}>
              <div className="admin-editor">
                <div className="admin-editor-toolbar" aria-label="Toolbar editor">
                  <select
                    defaultValue="Normal"
                    aria-label="Format teks"
                    onChange={(event) => {
                      applyEditorFormat(event.target.value);
                      event.currentTarget.value = 'Normal';
                    }}
                  >
                    <option>Normal</option>
                    <option>Heading</option>
                    <option>Quote</option>
                  </select>

                  <button type="button" aria-label="Bold" onClick={() => wrapEditorSelection('**', '**', 'teks tebal')}>
                    B
                  </button>
                  <button type="button" aria-label="Italic" onClick={() => wrapEditorSelection('*', '*', 'teks miring')}>
                    I
                  </button>
                  <button type="button" aria-label="Underline" onClick={() => wrapEditorSelection('<u>', '</u>', 'teks garis bawah')}>
                    U
                  </button>
                  <i />
                  <button
                    type="button"
                    aria-label="Daftar bullet"
                    onClick={() =>
                      transformSelectedLines(
                        (line) => `${line.match(/^\s*/)?.[0] ?? ''}- ${stripLinePrefix(line).trimStart() || 'Item daftar'}`,
                      )
                    }
                  >
                    =
                  </button>
                  <button
                    type="button"
                    aria-label="Daftar nomor"
                    onClick={() => {
                      let number = 0;
                      transformSelectedLines((line) => {
                        number += 1;
                        return `${line.match(/^\s*/)?.[0] ?? ''}${number}. ${stripLinePrefix(line).trimStart() || 'Item daftar'}`;
                      });
                    }}
                  >
                    #
                  </button>
                  <i />
                  <button type="button" aria-label="Tautan" onClick={() => wrapEditorSelection('[', '](https://)', 'teks tautan')}>
                    @
                  </button>
                  <button type="button" aria-label="Gambar" onClick={() => replaceEditorSelection('![Alt gambar](url-gambar)', 2, 12)}>
                    []
                  </button>
                  <button type="button" aria-label="Kode" onClick={() => wrapEditorSelection('`', '`', 'kode')}>
                    &lt;&gt;
                  </button>
                </div>

                <textarea
                  ref={(node) => {
                    editorRef.current = node;
                    if (node) fieldRefs.current.about = node;
                  }}
                  value={formData.about}
                  onChange={(event) => updateField('about', event.target.value)}
                  placeholder="Jelaskan detail tentang workshop, tujuan, materi yang akan dipelajari, dan hal lainnya..."
                  aria-invalid={Boolean(errors.about)}
                />
              </div>
            </Field>
          </section>

          <section className="admin-form-section admin-debug-section">
            <SectionTitle number="6" title="Debug Request JSON" />
            <p className="admin-debug-note">
              JSON ini mengikuti input form secara langsung. Field opsional yang kosong dikirim sebagai null.
            </p>
            <pre className={`admin-debug-json is-${debugMode}`}>
              {JSON.stringify(requestPayload, null, 2)}
            </pre>
          </section>
        </div>

        <div className="admin-workshop-sidebar">
          <SidebarCard title={isEditMode ? "Perbarui" : "Terbitkan"}>
            <Field label="Status">
              <select
                value={formData.status}
                onChange={(event) => updateField('status', event.target.value)}
              >
                <option>Draft</option>
                <option>Terjadwal</option>
                <option>Terbit</option>
                <option>Selesai</option>
              </select>
            </Field>

            <Field label="Visibilitas">
              <select
                value={formData.visibility}
                onChange={(event) => updateField('visibility', event.target.value)}
              >
                <option>Publik</option>
                <option>Privat</option>
              </select>
            </Field>

            <label className="admin-switch-row">
              <span>Tampilkan di Beranda</span>
              <input
                type="checkbox"
                checked={formData.isHomepageVisible}
                onChange={(event) => updateField('isHomepageVisible', event.target.checked)}
              />
              <i />
            </label>

            <div className="admin-side-actions">
              <button className="admin-muted-button" type="button" onClick={handleSaveDraft}>
                Simpan Draft
              </button>
              <button
                className="admin-primary-button"
                type="submit"
                disabled={isLoadingEdit || isSaving || isUploadingCover || isUploadingGallery}
              >
                {isSaving
                  ? 'Menyimpan...'
                  : isEditMode
                    ? 'Simpan Perubahan'
                    : 'Terbitkan'}
              </button>
            </div>
          </SidebarCard>

          <SidebarCard title="Media Workshop">
            <Field label="Gambar Sampul" required error={errors.coverImage}>
              <UploadBox
                inputRef={registerFieldRef('coverImage')}
                title="Upload gambar sampul"
                selectedText={isUploadingCover ? 'Mengupload gambar...' : coverImage?.originalName || coverImage?.name}
                note="Crop 16:9, otomatis dikompresi, maksimal 5 MB"
                buttonLabel="Pilih Gambar"
                accept="image/*"
                onChange={handleCoverChange}
              />
            </Field>

            <Field label="Galeri (Opsional)">
              <UploadBox
                title="Tambah gambar galeri"
                selectedText={isUploadingGallery ? 'Mengupload galeri...' : galleryImages.length ? `${galleryImages.length} gambar tersimpan` : ''}
                note="Boleh dikosongkan. Maksimal 5 MB per gambar."
                buttonLabel="Pilih Gambar"
                accept="image/*"
                multiple
                compact
                onChange={handleGalleryChange}
              />
            </Field>
          </SidebarCard>

          <SidebarCard title="Lampiran">
            <Field label="Modul / File (PDF)">
              <UploadBox
                title="Upload file"
                selectedText={moduleFile?.name}
                note="Opsional. Maks. 10MB (PDF)"
                buttonLabel="Pilih File"
                compact
                accept="application/pdf,.pdf"
                onChange={handleModuleChange}
              />
            </Field>
          </SidebarCard>

          <SidebarCard title="SEO (Opsional)">
            <Field label="Meta Title">
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(event) => updateField('metaTitle', event.target.value)}
                placeholder="Masukkan meta title..."
              />
            </Field>

            <Field label="Meta Description" counter={`${formData.metaDescription.length}/160`}>
              <textarea
                maxLength={160}
                value={formData.metaDescription}
                onChange={(event) => updateField('metaDescription', event.target.value)}
                placeholder="Masukkan meta description..."
              />
            </Field>
          </SidebarCard>

          <SidebarCard title="Preview Kartu Workshop" className="admin-preview-side-card">
            <article className="admin-workshop-preview-card">
              <div className="admin-workshop-preview-image">
                {coverPreview ? (
                  <img src={coverPreview} alt="Preview sampul workshop" />
                ) : (
                  <span>Preview Gambar Sampul</span>
                )}
              </div>

              <div className="admin-workshop-preview-body">
                <div className="admin-workshop-preview-tags">
                  <span>{formData.category || 'Kategori'}</span>
                  <span>{formData.level || 'Level'}</span>
                </div>
                <h4>{formData.title || 'Judul Workshop'}</h4>
                <p>{formData.summary || 'Deskripsi singkat workshop akan tampil di sini.'}</p>
                <small>
                  {formData.workshopDate || 'Tanggal'} · {formData.time || 'Waktu'}
                </small>
                <small>{formData.location || 'Lokasi workshop'}</small>
                <strong>{formatPrice(formData.price)}</strong>
              </div>
            </article>
          </SidebarCard>
        </div>

        <div className="admin-bottom-bar">
          <button
            className="admin-text-button"
            type="button"
            onClick={() => {
              window.location.href = '/admin/program';
            }}
          >
            Batal
          </button>
          <button className="admin-muted-button save" type="button" onClick={handleSaveDraft}>
            <span className="admin-action-icon draft-icon" aria-hidden="true" /> Simpan Draft
          </button>
          <button
            className="admin-primary-button publish"
            type="submit"
            disabled={isLoadingEdit || isSaving}
          >
            <span className="admin-action-icon send-icon" aria-hidden="true" />{' '}
            {isUploadingCover || isUploadingGallery
              ? 'Menunggu Upload...'
              : isSaving
                ? 'Menyimpan...'
                : isEditMode
                  ? 'Simpan Perubahan'
                  : 'Terbitkan'}
          </button>
        </div>
      </form>
    </main>

    <WorkshopImageCropper
      source={coverCrop?.source || ''}
      fileName={coverCrop?.fileName || 'workshop-cover.png'}
      onCancel={() => {
        setCoverCrop(null);
        setFormMessage('');
      }}
      onApply={({ file, dataUrl }) => {
        setCoverCrop(null);
        uploadCroppedCover(file, dataUrl);
      }}
    />
    </>
  );
}
