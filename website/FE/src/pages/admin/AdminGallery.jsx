import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL, apiEndpoint } from '../../services/apiEndpoints.js';
import { WorkshopImageCropper } from '../../features/profile-image-crop/WorkshopImageCropper.jsx';
import { GalleryRichTextEditor } from '../../components/GalleryRichTextEditor.jsx';
import { AdminSidebar } from './AdminSidebar.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import { showConfirmAlert, showPromptAlert, showSuccessAlert } from '../../utils/alerts.js';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import cameraIcon from '../../assets/icons/icon-image-placeholder-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import downloadIcon from '../../assets/icons/icon-downloadsim-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import fileIcon from '../../assets/icons/icon-file-text-1.svg';
import galleryIcon from '../../assets/icons/icon-image-placeholder-1.svg';
import mapIcon from '../../assets/icons/icon-map-pin-1.svg';

const GALLERY_API_URL = apiEndpoint(
  import.meta.env.VITE_GALLERY_API_URL,
  '/api/galery-api.php',
);
function fileToJson(file) {
  return file
    ? { name: file.name, size: file.size, type: file.type || 'application/octet-stream' }
    : null;
}

function resolveGalleryCoverUrl(coverPath, coverUrl = '') {
  const rawUrl = coverUrl || coverPath;

  if (!rawUrl) return '';
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(rawUrl)) return rawUrl;

  const normalizedPath = String(rawUrl)
    .replace(/^\/+/, '')
    .replace(/^storage\/uploads\//i, 'uploads/');

  return `${API_BASE_URL}/${normalizedPath}`;
}

function formatGalleryDate(value) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function getGalleryFromApi() {
  const response = await fetch(GALLERY_API_URL, {
    method: 'GET',
  });

  const responseText = await response.text();

  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(`Response API bukan JSON: ${responseText}`);
  }

  console.log('GET Gallery API URL:', GALLERY_API_URL);
  console.log('GET Gallery API Status:', response.status);
  console.log('GET Gallery API Response:', result);

  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'Gagal mengambil data galeri.');
  }

  return Array.isArray(result.data) ? result.data : [];
}

function AdminGalleryTopbar() {
  return (
    <header className="admin-dashboard-topbar">
      <div className="admin-dashboard-topbar-spacer" />
      <div className="admin-dashboard-account">
        <button className="admin-dashboard-notif" type="button" aria-label="Notifikasi">
          <img src={bellIcon} alt="" />
          <em>5</em>
        </button>
        <span className="admin-dashboard-avatar" aria-hidden="true" />
        <span>
          <strong>Admin</strong>
          <small>Super Admin</small>
        </span>
        <b aria-hidden="true">⌄</b>
      </div>
    </header>
  );
}

function GalleryBadge({ children }) {
  const slug = String(children).toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
  return <span className={`admin-gallery-badge admin-gallery-badge--${slug}`}>{children}</span>;
}

function GalleryThumbnail({ item, className = 'admin-gallery-thumb' }) {
  const coverUrl = item ? resolveGalleryCoverUrl(item.coverPath, item.coverUrl) : '';

  if (!coverUrl) {
    return (
      <span className={`${className} admin-gallery-thumb-placeholder`} aria-hidden="true">
        <img src={galleryIcon} alt="" />
      </span>
    );
  }

  return (
    <img
      className={className}
      src={coverUrl}
      alt={item?.title || 'Thumbnail galeri'}
    />
  );
}

function stripHtml(value) {
  const element = document.createElement('div');
  element.innerHTML = value || '';
  return element.textContent?.trim() || '';
}

function compactText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function toNumber(...values) {
  const rawValue = values.find((value) => value !== undefined && value !== null && value !== '');
  if (rawValue === undefined) return 0;
  if (typeof rawValue === 'number') return Number.isFinite(rawValue) ? rawValue : 0;

  const normalizedValue = String(rawValue).replace(/\./g, '').replace(',', '.');
  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function getMediaCount(item) {
  const count = toNumber(item?.mediaCount, item?.jumlahMedia, item?.totalMedia, item?.media_count, item?.total_media);
  return count > 0 ? count : 1;
}

function normalizeGalleryStatus(item) {
  return String(item?.status || '').trim().toLowerCase();
}

function getStatusLabel(item) {
  return normalizeGalleryStatus(item) === 'published' ? 'Published' : 'Draft';
}

function getMediaType(item) {
  const type = String(item?.mediaType || item?.type || item?.jenisMedia || item?.jenis_media || '').trim();
  return type || 'Foto';
}

function getViewerCount(item) {
  return toNumber(item?.viewer, item?.viewers, item?.totalViewer, item?.total_viewer, item?.views, item?.view_count);
}

function getGalleryTimestamp(item) {
  const timestamp = Date.parse(item?.updatedAt || item?.updated_at || item?.createdAt || item?.created_at || item?.eventDate || item?.event_date || '');
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getGallerySummary(item, maxLength = 120) {
  const summary = compactText(stripHtml(item?.description || ''));
  if (summary.length <= maxLength) return summary;

  const clipped = summary.slice(0, maxLength + 1);
  const lastSpace = clipped.lastIndexOf(' ');
  const safeText = lastSpace > Math.floor(maxLength * 0.65)
    ? clipped.slice(0, lastSpace)
    : summary.slice(0, maxLength);

  return `${safeText.trim()}...`;
}

function getGalleryIssues(item) {
  const issues = [];

  if (!compactText(item?.title)) issues.push('Judul kosong');
  if (!compactText(stripHtml(item?.description))) issues.push('Deskripsi kosong');
  if (!resolveGalleryCoverUrl(item?.coverPath, item?.coverUrl)) issues.push('Cover kosong');
  if (!compactText(item?.eventDate)) issues.push('Tanggal kosong');
  if (!compactText(item?.userName)) issues.push('Uploader kosong');

  return issues;
}

function AdminGalleryUploadForm({ onCancel, onSaved, mode = 'create', initialGallery = null }) {
  const [formData, setFormData] = useState({
    coverImage: null,
    tag: initialGallery?.tag || '',
    title: initialGallery?.title || '',
    description: initialGallery?.description || '',
    userName: initialGallery?.userName || '',
    eventDate: initialGallery?.eventDate || '',
    detailLink: initialGallery?.detailLink || '',
    note: initialGallery?.note || '',
  });
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [jsonResult, setJsonResult] = useState(null);
  const [coverCrop, setCoverCrop] = useState(null);

  useEffect(() => {
    if (!formData.coverImage) {
      setCoverPreviewUrl(
        mode === 'edit'
          ? resolveGalleryCoverUrl(initialGallery?.coverPath, initialGallery?.coverUrl)
          : ''
      );
      return undefined;
    }

    const nextUrl = URL.createObjectURL(formData.coverImage);
    setCoverPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [formData.coverImage, initialGallery?.coverPath, initialGallery?.coverUrl, mode]);

  useEffect(() => () => {
    if (coverCrop?.source) {
      URL.revokeObjectURL(coverCrop.source);
    }
  }, [coverCrop]);

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
    setMessage('');
    setFormError('');
  };

  const validateForm = (status) => {
    const isDraft = status === 'draft';
    const nextErrors = {};

    if (!isDraft && mode !== 'edit' && !formData.coverImage) nextErrors.coverImage = 'Cover kegiatan wajib diupload.';
    if (!isDraft && !formData.tag) nextErrors.tag = 'Tag kegiatan wajib dipilih.';
    if (!isDraft && !formData.title.trim()) nextErrors.title = 'Judul kegiatan wajib diisi.';
    if (!isDraft && !stripHtml(formData.description)) nextErrors.description = 'Deskripsi kegiatan wajib diisi.';
    if (!isDraft && !formData.userName.trim()) nextErrors.userName = 'Nama user wajib diisi.';
    if (!isDraft && !formData.eventDate) nextErrors.eventDate = 'Tanggal kegiatan wajib dipilih.';

    setErrors(nextErrors);
    return nextErrors;
  };

  const createGalleryJson = (status) => {
    const isDraft = status === 'draft';
    const nextErrors = validateForm(status);

    if (Object.keys(nextErrors).length > 0) {
      setFormError('Lengkapi kolom wajib yang masih kosong sebelum upload galeri.');
      return null;
    }

    const now = new Date().toISOString();
    const result = {
      success: true,
      message: isDraft ? 'Draft galeri siap dikirim ke API.' : 'Galeri siap diupload ke API.',
      data: {
        title: formData.title.trim(),
        tag: formData.tag,
        description: formData.description.trim(),
        userName: formData.userName.trim(),
        eventDate: formData.eventDate,
        detailLink: formData.detailLink.trim(),
        note: formData.note.trim(),
        coverImage: fileToJson(formData.coverImage),
        status: isDraft ? 'draft' : 'published',
        createdAt: now,
      },
    };

    setFormError('');
    setJsonResult(result);
    console.log('JSON galeri:', JSON.stringify(result, null, 2));
    return result;
  };

  const createGalleryFormData = (status) => {
    const payload = new FormData();

    if (formData.coverImage) {
      payload.append('cover_image', formData.coverImage);
    }

    if (mode === 'edit' && initialGallery?.id) {
      payload.append('id', String(initialGallery.id));
      payload.append('_method', 'PUT');
    }

    payload.append('tag', formData.tag);
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('user_name', formData.userName);
    payload.append('event_date', formData.eventDate);
    payload.append('detail_link', formData.detailLink || '');
    payload.append('note', formData.note || '');
    payload.append('status', status);

    return payload;
  };

  const sendGalleryToApi = async (status) => {
    const galleryJson = createGalleryJson(status);
    if (!galleryJson) return;

    try {
      setMessage(
        mode === 'edit'
          ? 'Menyimpan perubahan kegiatan...'
          : status === 'draft'
            ? 'Menyimpan draft kegiatan...'
            : 'Mengupload kegiatan...'
      );

      const response = await fetch(GALLERY_API_URL, {
        method: 'POST',
        body: createGalleryFormData(status),
      });

      const responseText = await response.text();

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`Response API bukan JSON: ${responseText}`);
      }

      console.log('SQLite Gallery API URL:', GALLERY_API_URL);
      console.log('SQLite Gallery API Status:', response.status);
      console.log('SQLite Gallery API Response:', result);

      if (!response.ok || result.success === false) {
        const validationMessage = result.errors
          ? Object.values(result.errors).join(' ')
          : result.message;

        throw new Error(validationMessage || 'Gagal menyimpan galeri.');
      }

      setJsonResult(result);
      setFormError('');
      setMessage(result.message || 'Galeri berhasil disimpan.');
      await showSuccessAlert('Berhasil', result.message || 'Galeri berhasil disimpan.');

      if (typeof onSaved === 'function') {
        onSaved();
      }
    } catch (error) {
      console.error('Gagal mengirim galeri ke API:', error);
      setFormError(
        error instanceof TypeError
          ? `API tidak dapat dihubungi di ${GALLERY_API_URL}. Pastikan Apache XAMPP aktif dan endpoint dapat dibuka.`
          : error.message
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendGalleryToApi('published');
  };

  const handleDraft = async () => {
    await sendGalleryToApi('draft');
  };

  const handleCoverImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((current) => ({
        ...current,
        coverImage: 'Cover kegiatan harus berupa file gambar.',
      }));
      return;
    }

    setErrors((current) => {
      if (!current.coverImage) return current;
      const nextErrors = { ...current };
      delete nextErrors.coverImage;
      return nextErrors;
    });
    setMessage('Atur crop gambar sampul sebelum upload.');
    setFormError('');

    const source = URL.createObjectURL(file);
    setCoverCrop((current) => {
      if (current?.source) {
        URL.revokeObjectURL(current.source);
      }
      return {
        source,
        fileName: file.name,
      };
    });
  };

  const handleApplyCoverCrop = ({ file }) => {
    if (!file) return;

    setCoverCrop((current) => {
      if (current?.source) {
        URL.revokeObjectURL(current.source);
      }
      return null;
    });
    updateField('coverImage', file);
    setMessage('Gambar sampul berhasil dicrop. Lanjutkan upload galeri.');
  };

  const handleCancelCoverCrop = () => {
    setCoverCrop((current) => {
      if (current?.source) {
        URL.revokeObjectURL(current.source);
      }
      return null;
    });
    setMessage('');
  };

  const previewTitle = formData.title.trim() || 'Judul Kegiatan';
  const previewDescription = stripHtml(formData.description) || 'Deskripsi kegiatan akan tampil disini sebagai ringkasan singkat.';

  return (
    <>
    <section className="admin-gallery-upload-page" aria-label="Form upload kegiatan">
      <form className="admin-gallery-upload-shell" onSubmit={handleSubmit} noValidate>
        <div className="admin-gallery-upload-main">
          <h1>{mode === 'edit' ? 'Edit Kegiatan' : 'Form Upload Kegiatan'}</h1>

          <label className="admin-gallery-upload-label">Upload Cover Kegiatan</label>
          <label className={`admin-gallery-upload-cover-drop${errors.coverImage ? ' is-invalid' : ''}`}>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleCoverImageChange}
            />
            <span className="admin-gallery-upload-cover-icon">▧</span>
            <strong>Upload gambar sampul</strong>
            <small>Rekomendasi: 1280×720px (16:9)</small>
            <em>Pilih Gambar</em>
          </label>
          {mode === 'edit' && initialGallery?.coverPath && !formData.coverImage ? (
            <p className="admin-gallery-upload-message">Cover lama tetap digunakan jika tidak memilih gambar baru.</p>
          ) : null}
          {errors.coverImage && <p className="admin-gallery-upload-error">{errors.coverImage}</p>}

          <label className="admin-gallery-upload-field">
            <span>Tag Kegiatan <b>*</b></span>
            <select
              className={errors.tag ? 'is-invalid' : ''}
              value={formData.tag}
              onChange={(event) => updateField('tag', event.target.value)}
            >
              <option value="">Pilih atau ketik tag</option>
              <option value="Workshop">Workshop</option>
              <option value="Program">Program</option>
              <option value="Komunitas">Komunitas</option>
              <option value="Partner">Partner</option>
              <option value="Event">Event</option>
              <option value="Dokumentasi">Dokumentasi</option>
            </select>
            {errors.tag && <small>{errors.tag}</small>}
          </label>

          <label className="admin-gallery-upload-field">
            <span>Judul Kegiatan <b>*</b></span>
            <input
              className={errors.title ? 'is-invalid' : ''}
              type="text"
              placeholder="Masukkan judul kegiatan"
              value={formData.title}
              onChange={(event) => updateField('title', event.target.value)}
            />
            {errors.title && <small>{errors.title}</small>}
          </label>

          <div className="admin-gallery-upload-field">
            <span>Deskripsi Kegiatan <b>*</b></span>
            <GalleryRichTextEditor
              value={formData.description}
              hasError={Boolean(errors.description)}
              onChange={(value) => updateField('description', value)}
            />
            {errors.description && <small>{errors.description}</small>}
          </div>

          <label className="admin-gallery-upload-field">
            <span>Nama User <b>*</b></span>
            <input
              className={errors.userName ? 'is-invalid' : ''}
              type="text"
              placeholder="Masukkan nama user"
              value={formData.userName}
              onChange={(event) => updateField('userName', event.target.value)}
            />
            {errors.userName && <small>{errors.userName}</small>}
          </label>

          <label className="admin-gallery-upload-field">
            <span>Tanggal Kegiatan <b>*</b></span>
            <input
              className={errors.eventDate ? 'is-invalid' : ''}
              type="date"
              value={formData.eventDate}
              onChange={(event) => updateField('eventDate', event.target.value)}
            />
            {errors.eventDate && <small>{errors.eventDate}</small>}
          </label>

          <label className="admin-gallery-upload-field">
            <span>Link / Detail <em>(Opsional)</em></span>
            <input
              type="url"
              placeholder="Contoh: https://..."
              value={formData.detailLink}
              onChange={(event) => updateField('detailLink', event.target.value)}
            />
          </label>

          <label className="admin-gallery-upload-field">
            <span>Catatan <em>(Opsional)</em></span>
            <textarea
              placeholder="Tulis catatan tambahan..."
              value={formData.note}
              onChange={(event) => updateField('note', event.target.value)}
            />
          </label>

          {message && <p className="admin-gallery-upload-message">{message}</p>}

          <div className="admin-gallery-upload-actions">
            <button type="submit" className="is-primary">✈ Upload</button>
            <button type="button" onClick={handleDraft}>▣ Simpan Draft</button>
            <button type="button" className="is-plain" onClick={onCancel}>Batal</button>
          </div>
        </div>

        <aside className="admin-gallery-upload-preview-card" aria-label="Preview kartu kegiatan">
          <h2>Preview Kartu</h2>
          <p>Pratnjau tampilan kartu berdasarkan data yang diisi.</p>
          <article className="admin-gallery-upload-card-preview">
            <div className="admin-gallery-upload-card-image">
              {coverPreviewUrl ? (
                <img src={coverPreviewUrl} alt="Preview cover kegiatan" />
              ) : (
                <strong>arduflow<br /><span>community</span></strong>
              )}
            </div>
            <div className="admin-gallery-upload-card-body">
              <span className="admin-gallery-upload-preview-tag">{formData.tag || 'Tag'}</span>
              <h3>{previewTitle}</h3>
              <p>{previewDescription}</p>
              <hr />
              <div className="admin-gallery-upload-author">
                <span aria-hidden="true">▧</span>
                <div>
                  <strong>{formData.userName.trim() || 'Nama Lengkap'}</strong>
                  <small>{formData.eventDate || 'mail@mail.com'}</small>
                </div>
              </div>
            </div>
          </article>
        </aside>
      </form>

      {formError ? <p role="alert" style={{ color: '#b42318', marginTop: 16 }}>{formError}</p> : null}
      {jsonResult ? (
        <section className="admin-gallery-json-result" style={{ marginTop: 24 }}>
          <h3>Hasil JSON</h3>
          <pre style={{ overflowX: 'auto', padding: 16, borderRadius: 8, background: '#07152b', color: '#fff' }}>{JSON.stringify(jsonResult, null, 2)}</pre>
        </section>
      ) : null}
    </section>
    <WorkshopImageCropper
      source={coverCrop?.source || ''}
      fileName={coverCrop?.fileName || 'gallery-cover.png'}
      onCancel={handleCancelCoverCrop}
      onApply={handleApplyCoverCrop}
    />
    </>
  );
}

export function AdminGallery() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialAdminSidebarCollapsed);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(null);
  const [selectedGalleryIds, setSelectedGalleryIds] = useState(() => new Set());
  const [isUploadFormOpen, setUploadFormOpen] = useState(false);
  const [galleryData, setGalleryData] = useState([]);
  const [isGalleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState('');
  const [editingGallery, setEditingGallery] = useState(null);
  const [busyGalleryId, setBusyGalleryId] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    mediaType: '',
    status: '',
    tag: '',
    eventDate: '',
    userName: '',
  });
  const selectedGallery = selectedGalleryIndex !== null ? galleryData[selectedGalleryIndex] : null;

  const loadGalleryData = async () => {
    try {
      setGalleryLoading(true);
      setGalleryError('');

      const data = await getGalleryFromApi();
      setGalleryData(data);
      setSelectedGalleryIndex(null);
      setSelectedGalleryIds(new Set());
    } catch (error) {
      console.error('Gagal mengambil data galeri:', error);
      setGalleryError(error.message || 'Gagal mengambil data galeri.');
    } finally {
      setGalleryLoading(false);
    }
  };

  useEffect(() => {
    loadGalleryData();
  }, []);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistAdminSidebarCollapsed(nextValue);
      return nextValue;
    });
  };

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setSelectedGalleryIndex(null);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      mediaType: '',
      status: '',
      tag: '',
      eventDate: '',
      userName: '',
    });
    setSelectedGalleryIndex(null);
  };

  const filterOptions = useMemo(() => ({
    mediaTypes: Array.from(new Set(galleryData.map(getMediaType).filter(Boolean))).sort(),
    statuses: Array.from(new Set(galleryData.map(getStatusLabel).filter(Boolean))).sort(),
    tags: Array.from(new Set(galleryData.map((item) => item.tag || 'Dokumentasi').filter(Boolean))).sort(),
    users: Array.from(new Set(galleryData.map((item) => item.userName || 'Admin').filter(Boolean))).sort(),
  }), [galleryData]);

  const filteredGalleryData = useMemo(() => {
    const search = compactText(filters.search).toLowerCase();

    return galleryData.filter((item) => {
      const haystack = [
        item.title,
        item.tag,
        item.userName,
        item.eventDate,
        item.createdAt,
        getMediaType(item),
        getStatusLabel(item),
        stripHtml(item.description),
      ].join(' ').toLowerCase();

      if (search && !haystack.includes(search)) return false;
      if (filters.mediaType && getMediaType(item) !== filters.mediaType) return false;
      if (filters.status && getStatusLabel(item) !== filters.status) return false;
      if (filters.tag && (item.tag || 'Dokumentasi') !== filters.tag) return false;
      if (filters.eventDate && item.eventDate !== filters.eventDate) return false;
      if (filters.userName && (item.userName || 'Admin') !== filters.userName) return false;

      return true;
    });
  }, [filters, galleryData]);

  const getGallerySelectionKey = (gallery, index) => String(gallery?.id || `row-${index}`);

  const allGallerySelected =
    filteredGalleryData.length > 0 &&
    filteredGalleryData.every((gallery, index) =>
      selectedGalleryIds.has(getGallerySelectionKey(gallery, index))
    );

  const handleToggleAllGalleries = (checked) => {
    setSelectedGalleryIds(
      checked
        ? new Set(filteredGalleryData.map((gallery, index) => getGallerySelectionKey(gallery, index)))
        : new Set()
    );
  };

  const handleToggleGallerySelection = (gallery, index, checked) => {
    const key = getGallerySelectionKey(gallery, index);

    setSelectedGalleryIds((current) => {
      const next = new Set(current);

      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }

      return next;
    });
  };

  const selectedGalleries = filteredGalleryData.filter((gallery, index) =>
    selectedGalleryIds.has(getGallerySelectionKey(gallery, index))
  );

  const clearGallerySelection = () => {
    setSelectedGalleryIds(new Set());
  };

  const createGalleryStatusPayload = (gallery, status) => {
    const payload = new FormData();
    payload.append('id', String(gallery.id));
    payload.append('_method', 'PUT');
    payload.append('tag', gallery.tag || 'Dokumentasi');
    payload.append('title', gallery.title || 'Draft Galeri');
    payload.append('description', gallery.description || 'Draft galeri belum memiliki deskripsi.');
    payload.append('user_name', gallery.userName || 'Admin');
    payload.append('event_date', gallery.eventDate || new Date().toISOString().slice(0, 10));
    payload.append('detail_link', gallery.detailLink || '');
    payload.append('note', gallery.note || '');
    payload.append('status', status);
    return payload;
  };

  const handleBulkStatus = async (status) => {
    if (selectedGalleries.length === 0) return;

    const statusLabel = status === 'published' ? 'publish' : 'draft';
    const confirmed = await showConfirmAlert({
      title: `Ubah Status ${selectedGalleries.length} Galeri?`,
      text: `Galeri terpilih akan diubah menjadi ${statusLabel}.`,
      confirmButtonText: 'Lanjutkan',
    });
    if (!confirmed) return;

    try {
      setBusyGalleryId('bulk');
      setGalleryError('');

      await Promise.all(selectedGalleries.map(async (gallery) => {
        const response = await fetch(GALLERY_API_URL, {
          method: 'POST',
          body: createGalleryStatusPayload(gallery, status),
        });
        const responseText = await response.text();
        const result = responseText ? JSON.parse(responseText) : {};

        if (!response.ok || result.success === false) {
          throw new Error(result.message || `Gagal mengubah status ${gallery.title}.`);
        }
      }));

      await showSuccessAlert('Berhasil', `${selectedGalleries.length} galeri berhasil diubah.`);
      await loadGalleryData();
    } catch (error) {
      console.error('Gagal mengubah status galeri:', error);
      setGalleryError(error.message || 'Gagal mengubah status galeri terpilih.');
    } finally {
      setBusyGalleryId(null);
    }
  };

  const handleUpdateGalleryStatus = async (gallery, status) => {
    if (!gallery?.id) {
      setGalleryError('ID galeri tidak tersedia.');
      return;
    }

    try {
      setBusyGalleryId(gallery.id);
      setGalleryError('');

      const response = await fetch(GALLERY_API_URL, {
        method: 'POST',
        body: createGalleryStatusPayload(gallery, status),
      });
      const responseText = await response.text();
      const result = responseText ? JSON.parse(responseText) : {};

      if (!response.ok || result.success === false) {
        throw new Error(result.message || `Gagal mengubah status ${gallery.title}.`);
      }

      await showSuccessAlert('Berhasil', result.message || 'Status galeri berhasil diubah.');
      await loadGalleryData();
    } catch (error) {
      console.error('Gagal mengubah status galeri:', error);
      setGalleryError(error.message || 'Gagal mengubah status galeri.');
    } finally {
      setBusyGalleryId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedGalleries.length === 0) return;

    const confirmed = await showConfirmAlert({
      title: `Hapus ${selectedGalleries.length} Galeri?`,
      text: 'Semua galeri yang dichecklist akan dihapus.',
      confirmButtonText: 'Hapus',
    });
    if (!confirmed) return;

    try {
      setBusyGalleryId('bulk');
      setGalleryError('');

      await Promise.all(selectedGalleries.map(async (gallery) => {
        const response = await fetch(`${GALLERY_API_URL}?id=${encodeURIComponent(gallery.id)}`, {
          method: 'DELETE',
          headers: { Accept: 'application/json' },
        });
        const responseText = await response.text();
        const result = responseText ? JSON.parse(responseText) : {};

        if (!response.ok || result.success === false) {
          throw new Error(result.message || `Gagal menghapus ${gallery.title}.`);
        }
      }));

      await showSuccessAlert('Berhasil', `${selectedGalleries.length} galeri berhasil dihapus.`);
      await loadGalleryData();
    } catch (error) {
      console.error('Gagal menghapus galeri terpilih:', error);
      setGalleryError(error.message || 'Gagal menghapus galeri terpilih.');
    } finally {
      setBusyGalleryId(null);
    }
  };

  const handleOpenUploadForm = () => {
    setSelectedGalleryIndex(null);
    setEditingGallery(null);
    setUploadFormOpen(true);
  };

  const handleViewGallery = (gallery) => {
    setEditingGallery(null);
    setUploadFormOpen(false);
    const nextIndex = galleryData.findIndex((item) => String(item.id) === String(gallery?.id));
    setSelectedGalleryIndex(nextIndex >= 0 ? nextIndex : null);
  };

  const handleEditGallery = (gallery) => {
    setSelectedGalleryIndex(null);
    setEditingGallery(gallery);
    setUploadFormOpen(true);
  };

  const handleDeleteGallery = async (gallery) => {
    if (!gallery?.id) {
      setGalleryError('ID galeri tidak tersedia.');
      return;
    }

    const confirmed = await showConfirmAlert({
      title: 'Hapus Galeri?',
      text: `Yakin ingin menghapus galeri "${gallery.title || 'Tanpa Judul'}"?`,
      confirmButtonText: 'Hapus',
    });
    if (!confirmed) return;

    try {
      setBusyGalleryId(gallery.id);
      setGalleryError('');

      const response = await fetch(`${GALLERY_API_URL}?id=${encodeURIComponent(gallery.id)}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      const responseText = await response.text();
      let result;

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(`Response API bukan JSON: ${responseText}`);
      }

      if (!response.ok || result.success === false) {
        throw new Error(result.message || `Gagal menghapus galeri. HTTP ${response.status}`);
      }

      setGalleryData((currentData) => currentData.filter((item) => item.id !== gallery.id));
      setSelectedGalleryIndex(null);
    } catch (error) {
      console.error('Gagal menghapus galeri:', error);
      setGalleryError(error.message || 'Gagal menghapus galeri.');
    } finally {
      setBusyGalleryId(null);
    }
  };

  const galleryStats = useMemo(() => {
    const totalGallery = galleryData.length;
    const totalMedia = galleryData.reduce((sum, item) => sum + getMediaCount(item), 0);
    const publishedItems = galleryData.filter((item) => normalizeGalleryStatus(item) === 'published');
    const draftItems = galleryData.filter((item) => normalizeGalleryStatus(item) === 'draft');
    const issueItems = galleryData.filter((item) => getGalleryIssues(item).length > 0);
    const videoPublished = publishedItems.reduce((sum, item) => (
      getMediaType(item).toLowerCase().includes('video') ? sum + getMediaCount(item) : sum
    ), 0);
    const photoPublished = publishedItems.reduce((sum, item) => (
      getMediaType(item).toLowerCase().includes('video') ? sum : sum + getMediaCount(item)
    ), 0);
    const totalViewer = galleryData.reduce((sum, item) => sum + getViewerCount(item), 0);
    const percent = (value) => (totalGallery > 0 ? `${((value / totalGallery) * 100).toFixed(1)}% dari total` : '0% dari total');

    return [
      { label: 'Total Media', value: totalMedia.toLocaleString('id-ID'), note: `${totalGallery.toLocaleString('id-ID')} galeri`, icon: cameraIcon, tone: 'blue' },
      { label: 'Foto Published', value: photoPublished.toLocaleString('id-ID'), note: percent(publishedItems.length), icon: checkIcon, tone: 'green' },
      { label: 'Video Published', value: videoPublished.toLocaleString('id-ID'), note: percent(videoPublished), icon: galleryIcon, tone: 'blue' },
      { label: 'Draft / Belum Publish', value: draftItems.length.toLocaleString('id-ID'), note: percent(draftItems.length), icon: fileIcon, tone: 'orange' },
      { label: 'Data Perlu Dilengkapi', value: issueItems.length.toLocaleString('id-ID'), note: percent(issueItems.length), icon: clockIcon, tone: 'purple' },
      { label: 'Total Viewer Galeri', value: totalViewer.toLocaleString('id-ID'), note: 'Sesuai data tabel', icon: eyeIcon, tone: 'blue' },
    ];
  }, [galleryData]);

  const recentGalleries = useMemo(
    () => [...galleryData].sort((a, b) => getGalleryTimestamp(b) - getGalleryTimestamp(a)).slice(0, 4),
    [galleryData]
  );

  const issueGalleries = useMemo(
    () => galleryData
      .map((item) => ({ item, issues: getGalleryIssues(item) }))
      .filter(({ issues }) => issues.length > 0)
      .slice(0, 4),
    [galleryData]
  );

  const publishedGalleries = useMemo(
    () => galleryData
      .filter((item) => normalizeGalleryStatus(item) === 'published')
      .sort((a, b) => getGalleryTimestamp(b) - getGalleryTimestamp(a))
      .slice(0, 4),
    [galleryData]
  );

  const draftGalleries = useMemo(
    () => galleryData
      .filter((item) => normalizeGalleryStatus(item) === 'draft')
      .sort((a, b) => getGalleryTimestamp(b) - getGalleryTimestamp(a))
      .slice(0, 4),
    [galleryData]
  );

  const activities = useMemo(
    () => [...galleryData]
      .sort((a, b) => getGalleryTimestamp(b) - getGalleryTimestamp(a))
      .slice(0, 5)
      .map((item) => ({
        text: `${item.userName || 'Admin'} ${normalizeGalleryStatus(item) === 'published' ? 'mempublish' : 'menyimpan draft'} galeri "${item.title || 'Tanpa Judul'}"`,
        time: formatGalleryDate(item.updatedAt || item.createdAt || item.eventDate),
        tone: normalizeGalleryStatus(item) === 'published' ? 'blue' : 'purple',
      })),
    [galleryData]
  );

  const mediaProblems = useMemo(() => {
    const counts = galleryData.reduce((result, item) => {
      getGalleryIssues(item).forEach((issue) => {
        result[issue] = (result[issue] || 0) + 1;
      });
      return result;
    }, {});

    return Object.entries(counts);
  }, [galleryData]);

  return (
    <main className={`admin-dashboard-page admin-gallery-page${isSidebarCollapsed ? ' admin-dashboard-page--collapsed' : ''}`}>
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={handleToggleSidebar} />

      <section className="admin-dashboard-main" aria-label="Galeri kegiatan admin">
        <AdminGalleryTopbar />

        <div className="admin-gallery-layout">
          {isUploadFormOpen ? (
            <AdminGalleryUploadForm
              mode={editingGallery ? 'edit' : 'create'}
              initialGallery={editingGallery}
              onCancel={() => {
                setUploadFormOpen(false);
                setEditingGallery(null);
              }}
              onSaved={() => {
                setUploadFormOpen(false);
                setEditingGallery(null);
                loadGalleryData();
              }}
            />
          ) : (
            <>
          <section className="admin-gallery-content">
            <div className="admin-gallery-heading">
              <div>
                <h1>Galeri Kegiatan</h1>
                <p>Dashboard <span>/</span> Galeri Kegiatan</p>
              </div>
            </div>

            <section className="admin-gallery-stats" aria-label="Ringkasan galeri kegiatan">
              {galleryStats.map((item) => (
                <article className="admin-gallery-stat" key={item.label}>
                  <span className={`admin-gallery-stat-icon is-${item.tone}`}>
                    <img src={item.icon} alt="" />
                  </span>
                  <div>
                    <p>{item.label}</p>
                    <strong>{item.value}</strong>
                    <small>{item.note}</small>
                  </div>
                </article>
              ))}
            </section>

            <section className="admin-gallery-filter" aria-label="Filter galeri">
              <label className="admin-gallery-search">
                <input
                  type="search"
                  placeholder="Cari judul kegiatan / nama file..."
                  value={filters.search}
                  onChange={(event) => updateFilter('search', event.target.value)}
                />
              </label>
              <label>
                <span>Jenis Media</span>
                <select value={filters.mediaType} onChange={(event) => updateFilter('mediaType', event.target.value)}>
                  <option value="">Semua Jenis</option>
                  {filterOptions.mediaTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
                  <option value="">Semua Status</option>
                  {filterOptions.statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Kategori</span>
                <select value={filters.tag} onChange={(event) => updateFilter('tag', event.target.value)}>
                  <option value="">Semua Kategori</option>
                  {filterOptions.tags.map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Tanggal Kegiatan</span>
                <input
                  type="date"
                  value={filters.eventDate}
                  onChange={(event) => updateFilter('eventDate', event.target.value)}
                />
              </label>
              <label>
                <span>Upload By</span>
                <select value={filters.userName} onChange={(event) => updateFilter('userName', event.target.value)}>
                  <option value="">Semua Admin</option>
                  {filterOptions.users.map((userName) => (
                    <option key={userName} value={userName}>{userName}</option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={resetFilters}>Reset Filter</button>
              <button type="button" className="admin-gallery-primary" onClick={handleOpenUploadForm}><img src={downloadIcon} alt="" /> Upload Media</button>
            </section>

            {selectedGalleries.length > 0 && (
              <section className="admin-gallery-bulk-actions" aria-label="Aksi galeri terpilih">
                <strong>{selectedGalleries.length} galeri dipilih</strong>
                <button
                  type="button"
                  onClick={() => handleBulkStatus('published')}
                  disabled={busyGalleryId === 'bulk'}
                >
                  Publish
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatus('draft')}
                  disabled={busyGalleryId === 'bulk'}
                >
                  Jadikan Draft
                </button>
                <button
                  type="button"
                  className="is-danger"
                  onClick={handleBulkDelete}
                  disabled={busyGalleryId === 'bulk'}
                >
                  Hapus
                </button>
                <button
                  type="button"
                  className="is-plain"
                  onClick={clearGallerySelection}
                  disabled={busyGalleryId === 'bulk'}
                >
                  Batal Pilih
                </button>
              </section>
            )}

            <section className="admin-gallery-table-card">
              <table className="admin-gallery-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Pilih semua galeri"
                        checked={allGallerySelected}
                        onChange={(event) => handleToggleAllGalleries(event.target.checked)}
                      />
                    </th>
                    <th>Thumbnail</th>
                    <th>Judul Kegiatan</th>
                    <th>Jenis Media</th>
                    <th>Kategori</th>
                    <th>Jumlah Media</th>
                    <th>Status</th>
                    <th>Viewer</th>
                    <th>Tgl Kegiatan</th>
                    <th>Tgl Upload</th>
                    <th>Upload By</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {isGalleryLoading ? (
                    <tr>
                      <td colSpan="12">Memuat data galeri...</td>
                    </tr>
                  ) : galleryError ? (
                    <tr>
                      <td colSpan="12" style={{ color: '#b42318' }}>
                        {galleryError}
                      </td>
                    </tr>
                  ) : filteredGalleryData.length === 0 ? (
                    <tr>
                      <td colSpan="12">{galleryData.length === 0 ? 'Belum ada data galeri.' : 'Tidak ada galeri yang sesuai filter.'}</td>
                    </tr>
                  ) : (
                    filteredGalleryData.map((item, index) => (
                      <tr key={item.id || `${item.title}-${index}`}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Pilih ${item.title}`}
                            checked={selectedGalleryIds.has(getGallerySelectionKey(item, index))}
                            onChange={(event) =>
                              handleToggleGallerySelection(item, index, event.target.checked)
                            }
                          />
                        </td>
                        <td>
                          <GalleryThumbnail item={item} />
                        </td>
                        <td><b>{item.title}</b><small>{getGallerySummary(item)}</small></td>
                        <td><GalleryBadge>{getMediaType(item)}</GalleryBadge></td>
                        <td><GalleryBadge>{item.tag || 'Dokumentasi'}</GalleryBadge></td>
                        <td>{getMediaCount(item)}</td>
                        <td><GalleryBadge>{getStatusLabel(item)}</GalleryBadge></td>
                        <td>{getViewerCount(item).toLocaleString('id-ID')}</td>
                        <td>{formatGalleryDate(item.eventDate)}</td>
                        <td>{formatGalleryDate(item.createdAt)}</td>
                        <td>{item.userName || 'Admin'}</td>
                        <td>
                          <div className="admin-gallery-actions">
                            <button
                              className="admin-gallery-action admin-gallery-action--view"
                              type="button"
                              onClick={() => handleViewGallery(item)}
                              disabled={busyGalleryId === item.id}
                            >
                              <img src={eyeIcon} alt="" /> Lihat
                            </button>
                            <button
                              className="admin-gallery-action"
                              type="button"
                              onClick={() => handleEditGallery(item)}
                              disabled={busyGalleryId === item.id}
                            >
                              Edit
                            </button>
                            <button
                              className="admin-gallery-action admin-gallery-action--delete"
                              type="button"
                              onClick={() => handleDeleteGallery(item)}
                              disabled={busyGalleryId === item.id}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="admin-gallery-pagination">
                <span>Menampilkan {filteredGalleryData.length} dari {galleryData.length} data galeri</span>
                <div>
                  <button type="button" disabled>&lt;</button>
                  <button type="button" className="is-active">1</button>
                  <button type="button" disabled>&gt;</button>
                </div>
                <select defaultValue="10">
                  <option value="10">10 / halaman</option>
                </select>
              </div>
            </section>

            <section className="admin-gallery-bottom admin-gallery-bottom--top">
              <article className="admin-gallery-panel">
                <div className="admin-gallery-panel-head"><h2>Galeri Terbaru</h2><button type="button" onClick={loadGalleryData}>Refresh</button></div>
                {recentGalleries.length === 0 ? (
                  <p><span>Belum ada data galeri.</span></p>
                ) : recentGalleries.map((item) => (
                  <p key={item.id || item.title}>
                    <GalleryThumbnail item={item} className="admin-gallery-mini-thumb" />
                    <b>{item.title || 'Tanpa Judul'}</b>
                    <time>{formatGalleryDate(item.updatedAt || item.createdAt || item.eventDate)}</time>
                  </p>
                ))}
              </article>

              <article className="admin-gallery-panel admin-gallery-review">
                <div className="admin-gallery-panel-head"><h2>Data Perlu Dilengkapi</h2><button type="button" onClick={() => updateFilter('status', '')}>Lihat semua</button></div>
                {issueGalleries.length === 0 ? (
                  <p><span>Tidak ada masalah data dari endpoint.</span></p>
                ) : issueGalleries.map(({ item, issues }) => (
                  <p key={item.id || item.title}><span>{item.title || 'Tanpa Judul'}</span><GalleryBadge>{issues[0]}</GalleryBadge></p>
                ))}
              </article>

              <article className="admin-gallery-panel">
                <div className="admin-gallery-panel-head"><h2>Published Terbaru</h2><button type="button" onClick={() => updateFilter('status', 'Published')}>Filter</button></div>
                <table>
                  <tbody>
                    {publishedGalleries.length === 0 ? (
                      <tr><td colSpan="3">Belum ada galeri published.</td></tr>
                    ) : publishedGalleries.map((item, index) => (
                      <tr key={item.id || item.title}>
                        <td>{index + 1}</td>
                        <td>{item.title || 'Tanpa Judul'}</td>
                        <td>{formatGalleryDate(item.updatedAt || item.createdAt || item.eventDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>

              <article className="admin-gallery-panel">
                <div className="admin-gallery-panel-head"><h2>Draft Belum Publish</h2><button type="button" onClick={() => updateFilter('status', 'Draft')}>Filter</button></div>
                {draftGalleries.length === 0 ? (
                  <p><span>Belum ada draft galeri.</span></p>
                ) : draftGalleries.map((item) => (
                  <p key={item.id || item.title}>
                    <GalleryThumbnail item={item} className="admin-gallery-mini-thumb" />
                    <b>{item.title || 'Tanpa Judul'}</b>
                    <time>{formatGalleryDate(item.updatedAt || item.createdAt || item.eventDate)}</time>
                  </p>
                ))}
              </article>
            </section>

            <section className="admin-gallery-bottom admin-gallery-bottom--bottom">
              <article className="admin-gallery-panel admin-gallery-activity">
                <div className="admin-gallery-panel-head"><h2>Aktivitas Terbaru</h2><button type="button" onClick={loadGalleryData}>Refresh</button></div>
                {activities.length === 0 ? (
                  <p><span className="admin-gallery-dot is-purple" /><b>Belum ada aktivitas galeri.</b></p>
                ) : activities.map((item) => (
                  <p key={`${item.text}-${item.time}`}><span className={`admin-gallery-dot is-${item.tone}`} /><b>{item.text}</b><time>{item.time}</time></p>
                ))}
              </article>

              <article className="admin-gallery-panel admin-gallery-problems">
                <div className="admin-gallery-panel-head"><h2>Masalah Data</h2><button type="button" onClick={loadGalleryData}>Refresh</button></div>
                {mediaProblems.length === 0 ? (
                  <p><span>Tidak ada masalah data.</span><strong>0</strong></p>
                ) : mediaProblems.map(([label, count]) => (
                  <p key={label}><span>{label}</span><strong>{count}</strong></p>
                ))}
              </article>

              <section className="admin-gallery-quick">
                <h2>Aksi Cepat</h2>
                <div>
                  <button type="button" onClick={handleOpenUploadForm}>Upload Media</button>
                  <button type="button" onClick={loadGalleryData}>Refresh Data</button>
                  <button type="button" onClick={() => handleBulkStatus('published')} disabled={selectedGalleries.length === 0 || busyGalleryId === 'bulk'}>Publish Terpilih</button>
                  <button type="button" onClick={() => handleBulkStatus('draft')} disabled={selectedGalleries.length === 0 || busyGalleryId === 'bulk'}>Jadikan Draft</button>
                  <button type="button" onClick={handleBulkDelete} disabled={selectedGalleries.length === 0 || busyGalleryId === 'bulk'}>Hapus Terpilih</button>
                  <button type="button" onClick={resetFilters}>Reset Filter</button>
                </div>
              </section>
            </section>
          </section>

          {selectedGallery && !isUploadFormOpen && (
            <div
              className="admin-gallery-detail-modal"
              role="presentation"
              onMouseDown={() => setSelectedGalleryIndex(null)}
            >
            <aside
              className="admin-gallery-detail"
              role="dialog"
              aria-modal="true"
              aria-label="Detail galeri"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="admin-gallery-detail-head">
                <h2>Detail Galeri</h2>
                <button type="button" aria-label="Tutup detail" onClick={() => setSelectedGalleryIndex(null)}>x</button>
              </div>
              <GalleryThumbnail item={selectedGallery} className="admin-gallery-detail-image" />
              <div className="admin-gallery-detail-title">
                <h3>{selectedGallery.title}</h3>
                <GalleryBadge>{getStatusLabel(selectedGallery)}</GalleryBadge>
                <p><span>{getMediaType(selectedGallery)}</span><span>{selectedGallery.tag || 'Dokumentasi'}</span></p>
              </div>
              <dl>
                <dt><img src={clockIcon} alt="" />Tanggal Kegiatan</dt><dd>{formatGalleryDate(selectedGallery.eventDate)}</dd>
                <dt><img src={mapIcon} alt="" />Upload By</dt><dd>{selectedGallery.userName || 'Admin'}</dd>
                <dt><img src={galleryIcon} alt="" />Jumlah Media</dt><dd>{getMediaCount(selectedGallery)} {getMediaType(selectedGallery).toLowerCase()}</dd>
              </dl>
              <section className="admin-gallery-description">
                <h3>Deskripsi</h3>
                <p>{getGallerySummary(selectedGallery, 220) || 'Belum ada deskripsi.'}</p>
              </section>
              <section className="admin-gallery-preview">
                <h3>Preview Media</h3>
                <div>
                  <GalleryThumbnail item={selectedGallery} className="admin-gallery-mini-thumb" />
                </div>
                <a href={`/galeri/detail?id=${encodeURIComponent(selectedGallery.id)}`} target="_blank" rel="noreferrer">Preview halaman publik</a>
              </section>
              <div className="admin-gallery-detail-actions">
                <button type="button" className="is-blue" onClick={() => handleEditGallery(selectedGallery)}>Edit Galeri</button>
                <button type="button" onClick={() => window.open(`/galeri/detail?id=${encodeURIComponent(selectedGallery.id)}`, '_blank', 'noopener,noreferrer')}>Preview Galeri</button>
                <button
                  type="button"
                  className="is-green"
                  onClick={() => handleUpdateGalleryStatus(selectedGallery, normalizeGalleryStatus(selectedGallery) === 'published' ? 'draft' : 'published')}
                  disabled={busyGalleryId === selectedGallery.id}
                >
                  {normalizeGalleryStatus(selectedGallery) === 'published' ? 'Jadikan Draft' : 'Publish'}
                </button>
                <button type="button" className="is-danger" onClick={() => handleDeleteGallery(selectedGallery)} disabled={busyGalleryId === selectedGallery.id}>Hapus</button>
              </div>
            </aside>
            </div>
          )}            </>
          )}
        </div>
      </section>
    </main>
  );
}
