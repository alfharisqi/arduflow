import { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL, apiEndpoint } from '../../services/apiEndpoints.js';
import { WorkshopImageCropper } from '../../features/profile-image-crop/WorkshopImageCropper.jsx';
import { GalleryRichTextEditor } from '../../components/GalleryRichTextEditor.jsx';
import { AdminNotificationButton } from './AdminChrome.jsx';
import { AdminSidebar } from './AdminSidebar.jsx';
import { AdminActionDropdown } from './AdminActionDropdown.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import { showConfirmAlert, showPromptAlert, showSuccessAlert } from '../../utils/alerts.js';
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

const GALLERY_FORM_TABS = [
  { id: 'basic', label: 'Info Dasar' },
  { id: 'media', label: 'Media' },
  { id: 'publish', label: 'Publish' },
];

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
        <AdminNotificationButton />
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

function GalleryUploadField({ label, hint, error, children }) {
  return (
    <label className={`project-upload-field admin-gallery-form-field${error ? ' has-error' : ''}`}>
      <span>{label}</span>
      {children}
      {error ? <em className="project-upload-error">{error}</em> : hint ? <small>{hint}</small> : null}
    </label>
  );
}

function GalleryImageIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.5" cy="8.5" r="1.7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m5 17 4.3-4.3a1.4 1.4 0 0 1 2 0L13 14.4l2.3-2.3a1.4 1.4 0 0 1 2 0L21 15.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GalleryPublishIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m21 3-8.8 18-3-7.8L1.5 10 21 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function GallerySaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 3h12l2 2v16H5V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 3v6h8V3M8 21v-7h8v7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
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
  const [activeSection, setActiveSection] = useState('basic');

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

  const descriptionText = stripHtml(formData.description).trim();
  const completionItems = [
    { label: 'Info dasar', done: Boolean(formData.title.trim() && formData.tag && descriptionText) },
    { label: 'Cover kegiatan', done: Boolean(formData.coverImage || coverPreviewUrl) },
    { label: 'Uploader', done: Boolean(formData.userName.trim() && formData.eventDate) },
    { label: 'Publish', done: Boolean(formData.title.trim() && formData.tag && descriptionText && formData.userName.trim() && formData.eventDate) },
  ];

  return (
    <>
    <section className="project-upload-page admin-gallery-upload-page" aria-labelledby="admin-gallery-upload-title">
      <h2 id="admin-gallery-upload-title">{mode === 'edit' ? 'Edit Galeri' : 'Upload Galeri Baru'}</h2>

      {mode === 'edit' ? (
        <p className="project-upload-edit-notice">
          Mode edit galeri aktif{initialGallery?.id ? ` untuk ID galeri ${initialGallery.id}` : ''}. Sesuaikan data dokumentasi melalui form ini.
        </p>
      ) : null}

      <section className="project-upload-actions project-upload-actions--top admin-gallery-upload-actions-top" aria-label="Aksi form galeri">
        <button className="project-upload-publish" type="submit" form="admin-gallery-upload-form"><GalleryPublishIcon /> Simpan Galeri</button>
        <button className="project-upload-draft" type="button" onClick={handleDraft}><GallerySaveIcon /> Simpan Draft</button>
        <button className="project-upload-cancel" type="button" onClick={onCancel}>Batal</button>
      </section>

      <nav className="project-upload-tabs admin-gallery-upload-tabs" aria-label="Navigasi form galeri">
        {GALLERY_FORM_TABS.map((tab) => (
          <button
            type="button"
            className={activeSection === tab.id ? 'is-active' : ''}
            onClick={() => setActiveSection(tab.id)}
            key={tab.id}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="project-upload-layout admin-gallery-upload-layout">
        <form className="project-upload-main admin-gallery-upload-main" id="admin-gallery-upload-form" onSubmit={handleSubmit} noValidate>
          <section className={`project-upload-form-section${activeSection === 'basic' ? ' is-active' : ''}`}>
            <GalleryUploadField label="Judul Kegiatan *" hint="Gunakan judul yang jelas untuk halaman galeri" error={errors.title}>
              <input
                type="text"
                placeholder="Masukkan judul kegiatan"
                value={formData.title}
                onChange={(event) => updateField('title', event.target.value)}
                aria-invalid={Boolean(errors.title)}
              />
            </GalleryUploadField>

            <GalleryUploadField label="Tag Kegiatan *" hint="Pilih kategori dokumentasi yang paling sesuai" error={errors.tag}>
              <select
                value={formData.tag}
                onChange={(event) => updateField('tag', event.target.value)}
                aria-invalid={Boolean(errors.tag)}
              >
                <option value="">Pilih tag galeri</option>
                <option value="Workshop">Workshop</option>
                <option value="Program">Program</option>
                <option value="Komunitas">Komunitas</option>
                <option value="Partner">Partner</option>
                <option value="Event">Event</option>
                <option value="Dokumentasi">Dokumentasi</option>
              </select>
            </GalleryUploadField>

            <div className={`project-upload-field admin-gallery-form-field${errors.description ? ' has-error' : ''}`}>
              <span>Deskripsi Kegiatan *</span>
              <GalleryRichTextEditor
                value={formData.description}
                hasError={Boolean(errors.description)}
                onChange={(value) => updateField('description', value)}
              />
              {errors.description ? <em className="project-upload-error">{errors.description}</em> : <small>Tulis dokumentasi, highlight kegiatan, dan informasi penting.</small>}
            </div>

            <div className="project-upload-inline-grid admin-gallery-upload-inline-grid">
              <section className="project-upload-card admin-gallery-upload-card admin-gallery-upload-extra">
                <h3>Informasi Uploader</h3>
                <GalleryUploadField label="Nama User *" error={errors.userName}>
                  <input
                    type="text"
                    placeholder="Masukkan nama user"
                    value={formData.userName}
                    onChange={(event) => updateField('userName', event.target.value)}
                    aria-invalid={Boolean(errors.userName)}
                  />
                </GalleryUploadField>
                <GalleryUploadField label="Tanggal Kegiatan *" error={errors.eventDate}>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(event) => updateField('eventDate', event.target.value)}
                    aria-invalid={Boolean(errors.eventDate)}
                  />
                </GalleryUploadField>
              </section>

              <section className="project-upload-card admin-gallery-upload-card admin-gallery-upload-extra">
                <h3>Detail Tambahan</h3>
                <GalleryUploadField label="Link / Detail" hint="Opsional, gunakan URL lengkap jika ada">
                  <input
                    type="url"
                    placeholder="Contoh: https://..."
                    value={formData.detailLink}
                    onChange={(event) => updateField('detailLink', event.target.value)}
                  />
                </GalleryUploadField>
                <GalleryUploadField label="Catatan">
                  <textarea
                    placeholder="Tulis catatan tambahan..."
                    value={formData.note}
                    onChange={(event) => updateField('note', event.target.value)}
                  />
                </GalleryUploadField>
              </section>
            </div>
          </section>

          <section className={`project-upload-file-section project-upload-form-section${activeSection === 'media' ? ' is-active' : ''}`}>
            <div className="admin-gallery-upload-media-single">
              <section className="project-upload-card project-upload-cover admin-gallery-upload-cover">
                <h3>Gambar Cover Kegiatan *</h3>
                <label className={`project-upload-cover-box admin-gallery-upload-cover-box${errors.coverImage ? ' has-error' : ''}`}>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleCoverImageChange}
                  />
                  {coverPreviewUrl ? (
                    <img className="project-upload-cover-preview admin-gallery-upload-cover-preview" src={coverPreviewUrl} alt="Preview cover kegiatan" />
                  ) : (
                    <GalleryImageIcon />
                  )}
                  <span>{formData.coverImage?.name || (mode === 'edit' && initialGallery?.coverPath ? 'Cover lama tetap digunakan' : 'Upload gambar cover')}</span>
                  <small>{mode === 'edit' && initialGallery?.coverPath && !formData.coverImage ? 'Pilih gambar baru jika ingin mengganti cover' : 'PNG, JPG rekomendasi 1280x720px'}</small>
                  <strong>Pilih Gambar</strong>
                </label>
                {errors.coverImage ? <em className="project-upload-error">{errors.coverImage}</em> : null}
              </section>
            </div>
          </section>

          <section className={`project-upload-form-section${activeSection === 'publish' ? ' is-active' : ''}`}>
            <div className="project-upload-inline-grid admin-gallery-upload-inline-grid">
              <section className="project-upload-card project-upload-visibility admin-gallery-upload-status">
                <h3>Pengaturan Publikasi</h3>
                <label>
                  <input type="radio" checked readOnly />
                  <span><strong>Published</strong><small>Galeri tampil di halaman publik setelah disimpan.</small></span>
                </label>
                <label>
                  <input type="radio" readOnly />
                  <span><strong>Draft</strong><small>Gunakan tombol Simpan Draft untuk menyimpan tanpa publish.</small></span>
                </label>
              </section>

              <section className="project-upload-card admin-gallery-upload-card project-upload-preview-card">
                <h3>Kelengkapan Data</h3>
                <dl>
                  <div><dt>Cover</dt><dd>{formData.coverImage || coverPreviewUrl ? 1 : 0}</dd></div>
                  <div><dt>Tag</dt><dd>{formData.tag ? 1 : 0}</dd></div>
                  <div><dt>User</dt><dd>{formData.userName.trim() ? 1 : 0}</dd></div>
                  <div><dt>Tanggal</dt><dd>{formData.eventDate ? 1 : 0}</dd></div>
                </dl>
                <ul>
                  {completionItems.map((item) => (
                    <li className={item.done ? 'is-done' : ''} key={item.label}>
                      <span aria-hidden="true" />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </section>
        </form>
      </div>

      {message && <p className="admin-gallery-upload-message">{message}</p>}

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
                {galleryError ? <small className="admin-dashboard-error">{galleryError}</small> : null}
              </div>
              <button type="button" onClick={loadGalleryData}>Refresh Data</button>
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
              <div className="admin-gallery-filter-row">
                <label className="admin-gallery-search">
                  <input
                    type="search"
                    placeholder="Search by judul kegiatan, tag, uploader..."
                    value={filters.search}
                    onChange={(event) => updateFilter('search', event.target.value)}
                  />
                </label>
                <button type="button" onClick={resetFilters}>Reset Filter</button>
                <button type="button" onClick={loadGalleryData}>Refresh</button>
                <button type="button" className="admin-gallery-primary" onClick={handleOpenUploadForm}><img src={downloadIcon} alt="" /> Upload Media</button>
              </div>
              <div className="admin-gallery-select-grid">
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
              </div>
            </section>

            <section className="admin-gallery-bulk-actions" aria-label="Aksi galeri terpilih">
              <span>{selectedGalleries.length} dipilih</span>
              <button
                type="button"
                className="admin-gallery-primary"
                onClick={() => handleBulkStatus('published')}
                disabled={selectedGalleries.length === 0 || busyGalleryId === 'bulk'}
              >
                Publish Terpilih
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatus('draft')}
                disabled={selectedGalleries.length === 0 || busyGalleryId === 'bulk'}
              >
                Jadikan Draft
              </button>
              <button
                type="button"
                className="is-danger"
                onClick={handleBulkDelete}
                disabled={selectedGalleries.length === 0 || busyGalleryId === 'bulk'}
              >
                Hapus Terpilih
              </button>
              <button
                type="button"
                className="is-plain"
                onClick={clearGallerySelection}
                disabled={selectedGalleries.length === 0 || busyGalleryId === 'bulk'}
              >
                Batal Pilih
              </button>
              <button type="button" onClick={loadGalleryData}>Refresh</button>
            </section>

            <section className="admin-gallery-table-card">
              <div className="admin-gallery-table-header">
                <div>
                  <h2>Daftar Galeri</h2>
                  <p>{galleryData.length.toLocaleString('id-ID')} galeri tersimpan</p>
                </div>
                <span>{selectedGalleries.length} dipilih</span>
              </div>
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
                          <AdminActionDropdown
                            label={`Buka aksi untuk ${item.title}`}
                            items={[
                              {
                                label: 'Lihat',
                                icon: <img src={eyeIcon} alt="" />,
                                disabled: busyGalleryId === item.id,
                                onSelect: () => handleViewGallery(item),
                              },
                              {
                                label: 'Edit',
                                disabled: busyGalleryId === item.id,
                                onSelect: () => handleEditGallery(item),
                              },
                              {
                                label: 'Hapus',
                                tone: 'danger',
                                disabled: busyGalleryId === item.id,
                                onSelect: () => handleDeleteGallery(item),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="admin-gallery-pagination">
                <button type="button" disabled>Previous</button>
                <div>
                  <button type="button" className="is-active">1</button>
                </div>
                <span>
                  Page 1 of 1
                  <small>Menampilkan {filteredGalleryData.length} dari {galleryData.length} data galeri</small>
                </span>
                <button type="button" disabled>Next</button>
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
