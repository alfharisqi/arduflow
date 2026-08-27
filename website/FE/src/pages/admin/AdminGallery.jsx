import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminSidebar } from './AdminSidebar.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import { GalleryRichTextEditor } from '../../components/GalleryRichTextEditor.jsx';
import { WorkshopImageCropper } from '../../features/profile-image-crop/WorkshopImageCropper.jsx';
import { showConfirmAlert, showSuccessAlert } from '../../utils/alerts.js';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import cameraIcon from '../../assets/icons/icon-image-placeholder-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import downloadIcon from '../../assets/icons/icon-downloadsim-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import fileIcon from '../../assets/icons/icon-file-text-1.svg';
import galleryIcon from '../../assets/icons/icon-image-placeholder-1.svg';
import mapIcon from '../../assets/icons/icon-map-pin-1.svg';
import workshopMainImage from '../../assets/images/workshop-list-presentation-main.jpg';
import workshopMarketImage from '../../assets/images/workshop-list-presentation-market.jpg';
import workshopSpeakerImage from '../../assets/images/workshop-list-presentation-speaker.jpg';
import workshopGroupImage from '../../assets/images/workshop-experience-group.png';
import workshopStudentImage from '../../assets/images/workshop-experience-student.png';

const galleryImages = [
  workshopMainImage,
  workshopMarketImage,
  workshopSpeakerImage,
  workshopGroupImage,
  workshopStudentImage,
];


function getGalleryApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL?.trim()) {
    return import.meta.env.VITE_API_BASE_URL.trim();
  }

  if (typeof window === 'undefined') {
    return 'http://192.168.130.10:8000';
  }

  const { protocol, hostname } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  return isLocalhost ? 'http://192.168.130.10:8000' : `${protocol}//${hostname}:8000`;
}

const GALLERY_API_BASE_URL = getGalleryApiBaseUrl();

const GALLERY_API_URL =
  'https://arduflow.indobilliard.com/apk/uploads/web/api/gallery.php';

const GALLERY_UPLOAD_API =
  import.meta.env.VITE_GALLERY_UPLOAD_API_URL?.trim() ||
  'http://localhost/upload_api/gallery-upload.php';

const GALLERY_UPLOAD_TARGET_FOLDER = 'gallery';
const EXPECTED_GALLERY_API_VERSION = 'gallery-remote-cover-v4-20260819';
const EXPECTED_GALLERY_BUILD_ID = 'gallery-sibling-db-v9-20260819-1502';
function fileToJson(file) {
  return file
    ? { name: file.name, size: file.size, type: file.type || 'application/octet-stream' }
    : null;
}

const GALLERY_PUBLIC_BASE_URL = 'https://arduflow.indobilliard.com/apk';

const GALLERY_STORAGE_RELATIVE_DIR =
  'uploads/web/storage/gallery';

const GALLERY_STORAGE_PUBLIC_BASE_URL =
  'https://arduflow.indobilliard.com/apk/uploads/web/storage/gallery';


function isLegacyGalleryCoverPath(value) {
  if (!value) return false;

  let path = String(value)
    .trim()
    .replace(/\\/g, '/');

  try {
    if (/^https?:\/\//i.test(path)) {
      path = decodeURIComponent(new URL(path).pathname);
    }
  } catch {
    // lanjutkan sebagai path biasa
  }

  const fileName = path.split('/').pop() || '';
  return /^gallery_\d{8}_\d{6}_[a-f0-9]+\.(?:jpg|jpeg|png)$/i.test(fileName);
}

function resolveGalleryCoverUrl(coverPath) {
  if (!coverPath) return '';

  let value = String(coverPath)
    .trim()
    .replace(/\\/g, '/');

  /*
   * Jika API sudah mengembalikan URL HTTP(S), tetap normalisasi pathname-nya
   * supaya response seperti /apk/uploads/web/storage/gallery/file.png
   * dan path relatif menghasilkan URL yang sama.
   */
  try {
    if (/^https?:\/\//i.test(value)) {
      const parsedUrl = new URL(value);
      const pathname = decodeURIComponent(parsedUrl.pathname)
        .replace(/^\/+/, '')
        .replace(/^apk\//i, '');

      const storageIndex = pathname
        .toLowerCase()
        .indexOf(`${GALLERY_STORAGE_RELATIVE_DIR}/`);

      if (storageIndex >= 0) {
        const relativePath = pathname.slice(storageIndex);
        return encodeURI(`${GALLERY_PUBLIC_BASE_URL}/${relativePath}`);
      }

      /*
       * URL lama tetap dipertahankan supaya record galeri lama tidak rusak.
       */
      if (pathname.toLowerCase().includes('uploads/gallery/')) {
        return value;
      }
    }
  } catch {
    // lanjutkan sebagai path biasa
  }

  const relativePath = getGalleryRelativeCoverPath(value);

  if (!relativePath) return '';

  if (
    relativePath.toLowerCase().startsWith(
      `${GALLERY_STORAGE_RELATIVE_DIR}/`
    )
  ) {
    return encodeURI(
      `${GALLERY_PUBLIC_BASE_URL}/${relativePath}`
    );
  }

  /*
   * Kompatibilitas data lama.
   */
  if (relativePath.toLowerCase().startsWith('uploads/gallery/')) {
    return encodeURI(
      `${GALLERY_PUBLIC_BASE_URL}/${relativePath}`
    );
  }

  return '';
}

function getGalleryCoverSource(gallery) {
  if (!gallery) return '';

  const source =
    gallery.remote_cover_url ||
    gallery.remoteCoverUrl ||
    gallery.cover_url ||
    gallery.coverUrl ||
    gallery.cover_image_url ||
    gallery.coverImageUrl ||
    gallery.remote_cover_path ||
    gallery.remoteCoverPath ||
    gallery.cover_path ||
    gallery.coverPath ||
    '';

  // Nama gallery_YYYYMMDD_HHMMSS_hash.ext adalah file legacy lokal.
  // Jangan arahkan nama ini ke File Manager remote karena file remote
  // aslinya memiliki nama berbeda.
  if (isLegacyGalleryCoverPath(source)) {
    return '';
  }

  return source;
}

function getGalleryThumbnailUrl(gallery) {
  return resolveGalleryCoverUrl(getGalleryCoverSource(gallery));
}

function getGalleryRelativeCoverPath(coverUrl) {
  if (!coverUrl) return '';

  let value = String(coverUrl)
    .trim()
    .replace(/\\/g, '/');

  try {
    if (/^https?:\/\//i.test(value)) {
      value = new URL(value).pathname;
    }
  } catch {
    // Jika bukan URL valid, lanjutkan sebagai path biasa.
  }

  value = decodeURIComponent(value)
    .replace(/^\/+/, '')
    .replace(/^apk\//i, '');

  /*
   * Path final yang digunakan mulai sekarang:
   * uploads/web/storage/gallery/nama-file.ext
   */
  const storageIndex = value
    .toLowerCase()
    .indexOf(`${GALLERY_STORAGE_RELATIVE_DIR}/`);

  if (storageIndex >= 0) {
    return value.slice(storageIndex);
  }

  /*
   * Response upload dapat berupa:
   * web/storage/gallery/file.png
   */
  if (
    value.toLowerCase().startsWith('web/storage/gallery/')
  ) {
    return `uploads/${value}`;
  }

  /*
   * Beberapa upload API hanya mengembalikan:
   * uploads/file.png
   *
   * Karena target backend sudah dikunci ke web/storage/gallery,
   * path ini dinormalisasi ke folder gallery baru.
   */
  if (/^uploads\/[^/]+$/i.test(value)) {
    const fileName = value.slice('uploads/'.length);

    return `${GALLERY_STORAGE_RELATIVE_DIR}/${fileName}`;
  }

  /*
   * Jika hanya nama file yang dikembalikan.
   */
  if (!value.includes('/')) {
    return `${GALLERY_STORAGE_RELATIVE_DIR}/${value}`;
  }

  /*
   * Kompatibilitas record lama.
   */
  value = value
    .replace(/^storage\/uploads\/gallery\//i, 'uploads/gallery/')
    .replace(/^storage\/upload\/gallery\//i, 'uploads/gallery/')
    .replace(/^upload\/gallery\//i, 'uploads/gallery/')
    .replace(/^gallery\//i, 'uploads/gallery/');

  const oldGalleryIndex = value
    .toLowerCase()
    .indexOf('uploads/gallery/');

  if (oldGalleryIndex >= 0) {
    return value.slice(oldGalleryIndex);
  }

  return value;
}

function getGalleryId(gallery) {
  return gallery?.id
    ?? gallery?.galleryId
    ?? gallery?.gallery_id
    ?? gallery?.ID
    ?? gallery?.Id
    ?? null;
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

  const activeGalleryBuildId =
    response.headers.get('X-Arduflow-Gallery-Build') || '';

  console.log(
    'Gallery API Build:',
    activeGalleryBuildId || '(build header tidak ada)'
  );

  const galleryBuildId =
    response.headers.get('X-Arduflow-Gallery-Build') || '';

  console.log(
    'Gallery API Build:',
    galleryBuildId || '(header build tidak ditemukan)'
  );

  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(`Response API bukan JSON: ${responseText}`);
  }

  console.log('GET Gallery API URL:', GALLERY_API_URL);
  console.log('GET Gallery API Status:', response.status);
  console.log('GET Gallery API Response:', result);

  if (
    activeGalleryBuildId &&
    activeGalleryBuildId !== EXPECTED_GALLERY_BUILD_ID
  ) {
    console.error('SERVER MASIH MEMAKAI gallery.php LAMA', {
      expectedBuild: EXPECTED_GALLERY_BUILD_ID,
      activeBuild: activeGalleryBuildId,
      apiUrl: GALLERY_API_URL,
    });
  }

  if (!response.ok || result.success === false) {
    const errors = result?.errors || {};

    console.error('=== GALLERY API ERROR ===', {
      apiUrl: GALLERY_API_URL,
      httpStatus: response.status,
      message: result?.message,
      database: errors.database,
      databasePath: errors.database_path,
      databaseUrl: errors.database_url,
      documentRoot: errors.document_root,
      galleryApiDirectory: errors.gallery_api_directory,
      databaseCandidates: errors.database_candidates,
      databaseRejected: errors.database_rejected,
      databaseReadable: errors.database_readable,
      databaseWritable: errors.database_writable,
      databaseDirectoryWritable: errors.database_directory_writable,
      response: result,
    });

    const staleBackend =
      String(errors.database_path || errors.database || '')
        .includes('/apk/Root/web/db/');

    const details = [
      errors.database,
      errors.database_path
        ? `Path DB: ${errors.database_path}`
        : '',
      staleBackend
        ? `SERVER MASIH MEMAKAI gallery.php LAMA. Path database seharusnya /apk/uploads/web/db/arduflow.sqbpro. Upload ulang gallery.php build ${EXPECTED_GALLERY_BUILD_ID}.`
        : '',
    ]
      .filter(Boolean)
      .join(' | ');

    throw new Error(
      details
        ? `${result.message || 'Gagal mengambil data galeri.'} ${details}`
        : result.message || 'Gagal mengambil data galeri.'
    );
  }

  const rawItems = Array.isArray(result.data)
    ? result.data
    : Array.isArray(result.data?.items)
      ? result.data.items
      : [];

  return rawItems.map((item) => {
    const source =
      item.cover_url ||
      item.coverUrl ||
      item.cover_image_url ||
      item.coverImageUrl ||
      item.cover_path ||
      item.coverPath ||
      '';

    const legacyCover = isLegacyGalleryCoverPath(source);
    const publicCoverUrl = legacyCover ? '' : resolveGalleryCoverUrl(source);
    const relativeCoverPath = publicCoverUrl
      ? getGalleryRelativeCoverPath(publicCoverUrl)
      : '';


    return {
      ...item,
      id: item.id ?? item.gallery_id ?? item.galleryId ?? null,
      cover_url: publicCoverUrl,
      coverUrl: publicCoverUrl,
      cover_path: relativeCoverPath,
      coverPath: relativeCoverPath,
      needs_cover_reupload:
        item.needs_cover_reupload ?? legacyCover,
      needsCoverReupload:
        item.needsCoverReupload ?? item.needs_cover_reupload ?? legacyCover,
      coverOriginalName: item.coverOriginalName ?? item.cover_original_name ?? '',
      coverMime: item.coverMime ?? item.cover_mime ?? '',
      coverSize: item.coverSize ?? item.cover_size ?? null,
      userName: item.userName ?? item.user_name ?? '',
      eventDate: item.eventDate ?? item.event_date ?? '',
      detailLink: item.detailLink ?? item.detail_link ?? '',
      mediaType: item.mediaType ?? item.media_type ?? 'Foto',
      mediaCount: item.mediaCount ?? item.media_count ?? 1,
      viewerCount: item.viewerCount ?? item.viewer_count ?? 0,
      isFeatured: item.isFeatured ?? item.is_featured ?? false,
      createdAt: item.createdAt ?? item.created_at ?? '',
      updatedAt: item.updatedAt ?? item.updated_at ?? '',
    };
  });
}

const galleryItems = [
  ['Workshop IoT Beginner', 'Pelatihan dasar IoT untuk pemula', 'Foto', 'Workshop', '42', 'Published', '1.245', '18 Mei 2024', '20 Mei 2024', 'Ahmad Fauzi'],
  ['Program Arduflow Goes to School', 'Edukasi IoT di SMK Negeri 2', 'Foto', 'Program', '35', 'Published', '986', '15 Mei 2024', '16 Mei 2024', 'Siti Aisyah'],
  ['Partner Visit - Universitas ABC', 'Kunjungan kerjasama & diskusi', 'Foto', 'Partner', '28', 'Review', '210', '10 Mei 2024', '11 Mei 2024', 'Budi Santoso'],
  ['Komunitas IoT Meet Up #5', 'Gathering & sharing komunitas IoT', 'Video', 'Komunitas', '1', 'Published', '1.532', '8 Mei 2024', '8 Mei 2024', 'Rudi Kurniawan'],
  ['Event Arduino Day 2024', 'Perayaan Arduino Day bersama komunitas', 'Foto', 'Event', '56', 'Published', '2.845', '4 Mei 2024', '5 Mei 2024', 'Ahmad Fauzi'],
  ['Dokumentasi Kelas IDE', 'Kelas penggunaan Arduflow IDE', 'Video', 'Dokumentasi', '3', 'Draft', '0', '30 Apr 2024', '1 Mei 2024', 'Siti Aisyah'],
  ['Bootcamp IoT Advanced', 'Hari ke-1 sampai Hari ke-3', 'Album', 'Workshop', '72', 'Review', '0', '25 Apr 2024', '27 Apr 2024', 'Budi Santoso'],
  ['Expo Inovasi Teknologi', 'Pameran inovasi siswa & mahasiswa', 'Foto', 'Event', '33', 'Archived', '312', '20 Apr 2024', '22 Apr 2024', 'Rudi Kurniawan'],
];

const recentGalleries = [
  ['Dokumentasi Kelas IDE', 'Draft'],
  ['Bootcamp IoT Advanced', '27 Apr 2024'],
  ['Expo Inovasi Teknologi', '22 Apr 2024'],
  ['Gathering Komunitas IoT', '19 Apr 2024'],
];

const reviewMedia = [
  ['Partner Visit - Universitas ABC', 'Thumbnail kosong'],
  ['Video Testimonial Event', 'Video belum diproses'],
  ['Dokumentasi Kelas IDE', 'Deskripsi kosong'],
  ['Bootcamp IoT Advanced', 'File terlalu besar'],
];

const popularGalleries = [
  ['Workshop IoT Beginner', '2.845'],
  ['Event Arduino Day 2024', '2.156'],
  ['Komunitas IoT Meet Up #5', '1.532'],
  ['Program Arduflow Goes to School', '986'],
  ['Partner Visit - Universitas ABC', '720'],
];

const draftGalleries = [
  ['Dokumentasi Kelas IDE', '3 item'],
  ['Video Pembukaan Event', '1 item'],
  ['Kunjungan Industri SMK', '18 item'],
  ['Foto Hari Terakhir Bootcamp', '24 item'],
];

const activities = [
  ['Ahmad Fauzi mengupload 42 foto di "Workshop IoT Beginner"', '20 Mei 2024 14:25', 'blue'],
  ['Siti Aisyah mempublish galeri "Program Arduflow Goes to School"', '16 Mei 2024 10:12', 'blue'],
  ['Budi Santoso mengganti cover "Bootcamp IoT Advanced"', '27 Apr 2024 09:10', 'purple'],
  ['Rudi Kurniawan menghapus 2 foto di "Expo Inovasi Teknologi"', '22 Apr 2024 16:45', 'purple'],
];

const mediaProblems = [
  ['Thumbnail kosong', 12],
  ['File terlalu besar (> 100MB)', 8],
  ['Video belum diproses', 6],
  ['Deskripsi/judul kosong', 15],
  ['Link rusak', 4],
];

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

function GalleryAction({ label, children }) {
  let content = children;

  if (label.startsWith('Edit ')) {
    content = '✎';
  } else if (label.startsWith('Featured ')) {
    content = '☆';
  } else if (label.startsWith('Menu ')) {
    content = '⋮';
  }

  return (
    <button className="admin-gallery-action" type="button" aria-label={label}>
      {content}
    </button>
  );
}

function GalleryThumbnail({ index, className = 'admin-gallery-thumb' }) {
  return (
    <img
      className={`${className} is-${index % galleryImages.length}`}
      src={galleryImages[index % galleryImages.length]}
      alt=""
      aria-hidden="true"
    />
  );
}

function stripHtml(value) {
  const element = document.createElement('div');
  element.innerHTML = value || '';
  return element.textContent?.trim() || '';
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
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [coverCrop, setCoverCrop] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState(
    getGalleryCoverSource(initialGallery) ? getGalleryThumbnailUrl(initialGallery) : ''
  );

  // Path asli hasil gallery-upload.php, misalnya:
  // uploads/web/storage/gallery/Arduflow bagian belakang_1787044054.png
  const initialRemoteCoverPath = getGalleryCoverSource(initialGallery)
    ? getGalleryRelativeCoverPath(getGalleryCoverSource(initialGallery))
    : '';

  const [coverRemotePath, setCoverRemotePath] = useState(initialRemoteCoverPath);
  const coverRemotePathRef = useRef(initialRemoteCoverPath);

  useEffect(() => () => {
    if (coverCrop?.source) {
      URL.revokeObjectURL(coverCrop.source);
    }
  }, [coverCrop]);

  useEffect(() => {
    // Setelah upload berhasil, selalu gunakan URL asli dari server.
    // Dengan ini ketika gambar dibuka di tab baru, URL-nya bukan lagi blob:...
    if (coverImageUrl) {
      setCoverPreviewUrl(coverImageUrl);
      return undefined;
    }

    // Sebelum upload selesai, gunakan blob URL hanya sebagai preview sementara.
    if (formData.coverImage) {
      const temporaryPreviewUrl = URL.createObjectURL(formData.coverImage);
      setCoverPreviewUrl(temporaryPreviewUrl);

      return () => {
        URL.revokeObjectURL(temporaryPreviewUrl);
      };
    }

    setCoverPreviewUrl('');
    return undefined;
  }, [formData.coverImage, coverImageUrl]);

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


  const handleCoverFileSelect = (file) => {
    if (!file) {
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg'];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setErrors((current) => ({
        ...current,
        coverImage: 'Format gambar harus PNG, JPG, atau JPEG.',
      }));
      return;
    }

    if (file.size > maxSize) {
      setErrors((current) => ({
        ...current,
        coverImage: 'Ukuran gambar maksimal 10 MB.',
      }));
      return;
    }

    if (coverCrop?.source) {
      URL.revokeObjectURL(coverCrop.source);
    }

    const source = URL.createObjectURL(file);

    setErrors((current) => {
      if (!current.coverImage) return current;
      const nextErrors = { ...current };
      delete nextErrors.coverImage;
      return nextErrors;
    });

    setCoverCrop({
      source,
      fileName: file.name,
    });
  };

  const handleCancelCoverCrop = () => {
    setCoverCrop((current) => {
      if (current?.source) {
        URL.revokeObjectURL(current.source);
      }
      return null;
    });
  };

  const handleApplyCoverCrop = async ({ file }) => {
    const croppedFile = file;

    setCoverCrop((current) => {
      if (current?.source) {
        URL.revokeObjectURL(current.source);
      }
      return null;
    });

    if (!croppedFile) {
      setErrors((current) => ({
        ...current,
        coverImage: 'Hasil crop gambar tidak tersedia.',
      }));
      return;
    }

    await uploadCoverImage(croppedFile);
  };

  const uploadCoverImage = async (file) => {
    if (!file) {
      updateField('coverImage', null);
      setCoverUploadProgress(0);
      const existingRemotePath =
        mode === 'edit' && getGalleryCoverSource(initialGallery)
          ? getGalleryRelativeCoverPath(getGalleryCoverSource(initialGallery))
          : '';

      const existingPublicUrl =
        mode === 'edit' && getGalleryCoverSource(initialGallery)
          ? getGalleryThumbnailUrl(initialGallery)
          : '';

      coverRemotePathRef.current = existingRemotePath;
      setCoverRemotePath(existingRemotePath);
      setCoverImageUrl(existingPublicUrl);
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg'];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setErrors((current) => ({
        ...current,
        coverImage: 'Format gambar harus PNG, JPG, atau JPEG.',
      }));
      return;
    }

    if (file.size > maxSize) {
      setErrors((current) => ({
        ...current,
        coverImage: 'Ukuran gambar maksimal 10 MB.',
      }));
      return;
    }

    updateField('coverImage', file);
    setUploadingCover(true);
    setCoverUploadProgress(10);
    setMessage('Mengupload cover kegiatan...');

    try {
      const uploadData = new FormData();

      // gallery-upload.php menerima file dari frontend dengan key `file`.
      // API PHP tersebut yang akan meneruskan file sebagai `uploaded_file`
      // ke upload-auth-api.php menggunakan Bearer token di sisi server.
      uploadData.append('file', file, file.name);
      uploadData.append('target_folder', GALLERY_UPLOAD_TARGET_FOLDER);

      setCoverUploadProgress(30);

      console.log('=== DEBUG UPLOAD COVER ===');
      console.log('Upload API:', GALLERY_UPLOAD_API);
      console.log('field file:', file.name);
      console.log('target_folder:', GALLERY_UPLOAD_TARGET_FOLDER);
      console.log('Tipe file:', file.type);
      console.log('Ukuran file:', file.size);

      const response = await fetch(GALLERY_UPLOAD_API, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: uploadData,
      });

      setCoverUploadProgress(70);

      const responseText = await response.text();

      console.log('Gallery Upload API Status:', response.status);
      console.log('Gallery Upload API Response Mentah:', responseText);

      let result;

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(`Response upload bukan JSON: ${responseText}`);
      }

      console.log('Gallery Upload API Response JSON:', result);

      if (!response.ok || result.success === false) {
        const apiMessage =
          result.message ||
          result.error ||
          result.errors?.file ||
          result.data?.remote_response?.message ||
          `Upload cover gagal. HTTP ${response.status}`;

        throw new Error(apiMessage);
      }

      const uploadedUrl =
        result.data?.url ||
        result.data?.file_url ||
        result.data?.fileUrl ||
        result.data?.public_url ||
        result.data?.publicUrl ||
        result.url ||
        result.file_url ||
        result.fileUrl ||
        result.public_url ||
        result.publicUrl ||
        result.data?.file_path ||
        result.file_path ||
        result.data?.path ||
        result.path ||
        '';

      if (!uploadedUrl) {
        console.error(
          'Upload berhasil tetapi URL/path tidak ditemukan pada response:',
          result
        );

        throw new Error(
          'Upload berhasil, tetapi API tidak mengembalikan URL/path file.'
        );
      }

      if (isLegacyGalleryCoverPath(uploadedUrl)) {
        console.error('API upload mengembalikan nama legacy:', uploadedUrl, result);
        throw new Error(
          'API upload masih mengembalikan nama file gallery_.... Periksa gallery-upload.php. ' +
          'Path yang disimpan harus mengarah ke uploads/web/storage/gallery/Nama_File_123.png.'
        );
      }

      const remoteCoverPath = getGalleryRelativeCoverPath(uploadedUrl);
      const publicCoverUrl = resolveGalleryCoverUrl(remoteCoverPath);

      if (
        !remoteCoverPath ||
        !remoteCoverPath
          .toLowerCase()
          .startsWith(`${GALLERY_STORAGE_RELATIVE_DIR}/`)
      ) {
        throw new Error(
          `Path hasil upload tidak valid: ${uploadedUrl}. ` +
          `Path harus mengarah ke ${GALLERY_STORAGE_PUBLIC_BASE_URL}/nama-file.`
        );
      }

      // Simpan path secara sinkron ke ref agar tombol Submit yang ditekan
      // setelah upload selalu mendapatkan path hasil upload terbaru.
      coverRemotePathRef.current = remoteCoverPath;
      setCoverRemotePath(remoteCoverPath);
      setCoverImageUrl(publicCoverUrl);

      console.log('Path cover dari API:', uploadedUrl);
      console.log('Remote cover path tersimpan:', remoteCoverPath);
      console.log('URL cover publik:', publicCoverUrl);

      console.log('URL asli hasil upload:', uploadedUrl);
      console.log('Preview akan menggunakan URL server:', publicCoverUrl);

      setCoverUploadProgress(100);
      setMessage('Cover kegiatan berhasil diupload.');
      setFormError('');

      console.log('Upload cover berhasil:', publicCoverUrl);
    } catch (error) {
      console.error('Gagal upload cover kegiatan:', error);

      setCoverUploadProgress(0);
      const fallbackRemotePath =
        mode === 'edit' && getGalleryCoverSource(initialGallery)
          ? getGalleryRelativeCoverPath(getGalleryCoverSource(initialGallery))
          : '';

      const fallbackPublicUrl =
        mode === 'edit' && getGalleryCoverSource(initialGallery)
          ? getGalleryThumbnailUrl(initialGallery)
          : '';

      coverRemotePathRef.current = fallbackRemotePath;
      setCoverRemotePath(fallbackRemotePath);
      setCoverImageUrl(fallbackPublicUrl);

      setErrors((current) => ({
        ...current,
        coverImage:
          error?.message ||
          'Terjadi kesalahan saat upload cover.',
      }));

      setFormError(
        error?.message ||
        'Terjadi kesalahan saat upload cover.'
      );
    } finally {
      setUploadingCover(false);
    }
  };

  const validateForm = (status) => {
    const isDraft = status === 'draft';
    const nextErrors = {};

    const existingRemoteCoverPath =
      mode === 'edit' && getGalleryCoverSource(initialGallery)
        ? getGalleryRelativeCoverPath(getGalleryCoverSource(initialGallery))
        : '';

    const activeRemoteCoverPath =
      coverRemotePathRef.current ||
      coverRemotePath ||
      existingRemoteCoverPath;

    const normalizedActiveCoverPath =
      String(activeRemoteCoverPath || '').toLowerCase();

    const hasUploadedCover = Boolean(
      normalizedActiveCoverPath &&
      (
        normalizedActiveCoverPath.startsWith(
          `${GALLERY_STORAGE_RELATIVE_DIR}/`
        ) ||
        normalizedActiveCoverPath.startsWith('uploads/gallery/')
      )
    );

    if (!isDraft && !hasUploadedCover) {
      nextErrors.coverImage = 'Cover kegiatan wajib diupload dan harus berhasil tersimpan di server.';
    }
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
        coverImageUrl: coverImageUrl || null,
        coverRemotePath: coverRemotePathRef.current || coverRemotePath || null,
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
    const galleryId = getGalleryId(initialGallery);

    // Kirim mode secara eksplisit agar backend tidak menebak CREATE/UPDATE hanya dari ID.
    payload.append('mode', mode);
    payload.append('action', mode === 'edit' ? 'update' : 'create');

    if (mode === 'edit') {
      if (!galleryId) {
        throw new Error('ID galeri tidak ditemukan. Update dibatalkan.');
      }

      // Kirim ID dengan beberapa nama untuk kompatibilitas endpoint lama/baru.
      payload.append('id', String(galleryId));
      payload.append('gallery_id', String(galleryId));
      payload.append('galleryId', String(galleryId));
    }
const existingRemoteCoverPath =
      mode === 'edit' && getGalleryCoverSource(initialGallery)
        ? getGalleryRelativeCoverPath(getGalleryCoverSource(initialGallery))
        : '';

    const relativeCoverPath =
      coverRemotePathRef.current ||
      coverRemotePath ||
      existingRemoteCoverPath;

    const finalCoverUrl = relativeCoverPath
      ? resolveGalleryCoverUrl(relativeCoverPath)
      : '';

    if (relativeCoverPath) {
      // Kirim path remote secara eksplisit.
      // gallery.php TIDAK menerima file binary cover lagi.
      payload.append('remote_cover_path', relativeCoverPath);
      payload.append('cover_path', relativeCoverPath);
      payload.append('cover_url', finalCoverUrl);
      payload.append('cover_image_url', finalCoverUrl);
      payload.append('cover_uploaded', '1');

      if (formData.coverImage) {
        payload.append('cover_original_name', formData.coverImage.name);
        payload.append('cover_mime', formData.coverImage.type || '');
        payload.append('cover_size', String(formData.coverImage.size || 0));
      }

      console.log('Remote cover path dikirim:', relativeCoverPath);
      console.log('Cover URL publik dikirim:', finalCoverUrl);
    } else {
      payload.append('cover_uploaded', '0');
      console.warn('Tidak ada remote_cover_path saat submit galeri.');
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

    const galleryId = getGalleryId(initialGallery);

    if (mode === 'edit' && !galleryId) {
      setFormError('ID galeri tidak ditemukan. Data tidak dapat diedit.');
      console.error('Edit dibatalkan karena ID galeri tidak tersedia.', initialGallery);
      return;
    }

    const requestUrl = mode === 'edit'
      ? `${GALLERY_API_URL}?mode=edit&action=update&id=${encodeURIComponent(galleryId)}`
      : GALLERY_API_URL;

    try {
      setMessage(
        mode === 'edit'
          ? 'Menyimpan perubahan kegiatan...'
          : status === 'draft'
            ? 'Menyimpan draft kegiatan...'
            : 'Mengupload kegiatan...'
      );

      const requestBody = createGalleryFormData(status);

      console.log('=== DEBUG GALLERY REQUEST ===');
      console.log('Mode:', mode);
      console.log('Gallery ID:', galleryId);
      console.log('Initial Gallery:', initialGallery);
      console.log('Request URL:', requestUrl);
      console.log('Cover file tersedia:', Boolean(formData.coverImage));
      console.log('Cover URL hasil upload:', coverImageUrl || '(belum ada)');
      console.log(
        'cover_image dikirim:',
        requestBody.has('cover_image')
      );
      console.log(
        'cover_path dikirim:',
        requestBody.get('cover_path')
      );
      console.log(
        'remote_cover_path dikirim:',
        requestBody.get('remote_cover_path')
      );
      console.log(
        'cover_uploaded:',
        requestBody.get('cover_uploaded')
      );

      for (const [key, value] of requestBody.entries()) {
        console.log(`${key}:`, value);
      }

      if (!requestBody.get('remote_cover_path') && status === 'published') {
        throw new Error(
          'Submit dibatalkan: remote_cover_path kosong meskipun cover sudah dipilih. ' +
          'Upload ulang cover dan pastikan log "Remote cover path tersimpan" muncul.'
        );
      }

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: requestBody,
      });

      const responseText = await response.text();

      const galleryApiVersion =
        response.headers.get('X-Arduflow-Gallery-Version') || '';

      console.log('Gallery API Version Header:', galleryApiVersion || '(tidak ada)');

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`Response API bukan JSON: ${responseText}`);
      }

      const responseApiVersion =
        result?.api_version ||
        result?.data?.api_version ||
        galleryApiVersion ||
        '';

      console.log('SQLite Gallery API URL:', requestUrl);
      console.log('SQLite Gallery API Status:', response.status);
      console.log('SQLite Gallery API Response:', result);
      console.log('SQLite Gallery API Version:', responseApiVersion || '(tidak ada)');
      console.log('Expected Gallery API Version:', EXPECTED_GALLERY_API_VERSION);

      if (responseApiVersion !== EXPECTED_GALLERY_API_VERSION) {
        throw new Error(
          `gallery.php yang aktif BUKAN versi terbaru. ` +
          `Request dikirim ke ${requestUrl}. ` +
          `Versi yang diterima: ${responseApiVersion || 'tidak ada/version lama'}. ` +
          `Versi yang dibutuhkan: ${EXPECTED_GALLERY_API_VERSION}. ` +
          `Ganti file gallery.php pada endpoint tersebut, bukan gallery.php di folder lain.`
        );
      }

      if (!response.ok || result.success === false) {
        const validationMessage = result.errors
          ? Object.values(result.errors).join(' ')
          : result.message;

        throw new Error(validationMessage || 'Gagal menyimpan galeri.');
      }

      // Pengaman tambahan: ketika frontend sedang edit, backend harus mengaku UPDATE
      // dan mengembalikan ID yang sama. Ini membuat salah endpoint/file API cepat terlihat.
      if (mode === 'edit') {
        if (result.operation && result.operation !== 'update') {
          throw new Error(`Backend menjalankan ${result.operation}, bukan UPDATE. Periksa file gallery.php yang aktif.`);
        }

        const responseId = getGalleryId(result.data);
        if (responseId && Number(responseId) !== Number(galleryId)) {
          throw new Error(`ID response (${responseId}) berbeda dari ID yang diedit (${galleryId}).`);
        }
      }

      setJsonResult(result);
      setFormError('');
      setMessage(result.message || 'Galeri berhasil disimpan.');

      await showSuccessAlert(
        mode === 'edit' ? 'Galeri Berhasil Diedit' : 'Galeri Berhasil Diupload',
        result.message ||
          (mode === 'edit'
            ? 'Perubahan data galeri berhasil disimpan.'
            : 'Galeri baru berhasil diupload dan disimpan.')
      );

      if (typeof onSaved === 'function') {
        onSaved(result.data || galleryJson.data, result);
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

  const previewTitle = formData.title.trim() || 'Judul Kegiatan';
  const previewDescription = stripHtml(formData.description) || 'Deskripsi kegiatan akan tampil disini sebagai ringkasan singkat.';

  return (
    <section className="admin-gallery-upload-page" aria-label="Form upload kegiatan">
      <form className="admin-gallery-upload-shell" onSubmit={handleSubmit} noValidate>
        <div className="admin-gallery-upload-main">
          <h1>{mode === 'edit' ? 'Edit Kegiatan' : 'Form Upload Kegiatan'}</h1>

          <label className="admin-gallery-upload-label">Upload Cover Kegiatan</label>
          <label className={`admin-gallery-upload-cover-drop${errors.coverImage ? ' is-invalid' : ''}`}>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              disabled={uploadingCover}
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                handleCoverFileSelect(file);
                event.target.value = '';
              }}
            />
            <span className="admin-gallery-upload-cover-icon">▧</span>
            <strong>
              {uploadingCover
                ? 'Sedang mengupload...'
                : coverImageUrl
                  ? 'Cover berhasil diupload'
                  : 'Upload gambar sampul'}
            </strong>
            <small>Rekomendasi: 1280×720px (16:9)</small>
            <em>
              {uploadingCover
                ? `Uploading ${coverUploadProgress}%`
                : coverImageUrl
                  ? 'Ganti Gambar'
                  : 'Pilih Gambar'}
            </em>
          </label>
          {uploadingCover ? (
            <p className="admin-gallery-upload-message">
              Upload cover: {coverUploadProgress}%
            </p>
          ) : null}
          {coverImageUrl ? (
            <p className="admin-gallery-upload-message" style={{ wordBreak: 'break-all' }}>
              URL cover: {coverImageUrl}
            </p>
          ) : null}
          {mode === 'edit' && getGalleryCoverSource(initialGallery) && !formData.coverImage ? (
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
            <button type="submit" className="is-primary" disabled={uploadingCover}>{mode === 'edit' ? '✓ Simpan Perubahan' : '✈ Upload'}</button>
            <button type="button" onClick={handleDraft} disabled={uploadingCover}>▣ Simpan Draft</button>
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

      {coverCrop ? (
        <WorkshopImageCropper
          source={coverCrop.source}
          fileName={coverCrop.fileName}
          onCancel={handleCancelCoverCrop}
          onApply={handleApplyCoverCrop}
        />
      ) : null}

      {formError ? <p role="alert" style={{ color: '#b42318', marginTop: 16 }}>{formError}</p> : null}
      {jsonResult ? (
        <section className="admin-gallery-json-result" style={{ marginTop: 24 }}>
          <h3>Hasil JSON</h3>
          <pre style={{ overflowX: 'auto', padding: 16, borderRadius: 8, background: '#07152b', color: '#fff' }}>{JSON.stringify(jsonResult, null, 2)}</pre>
        </section>
      ) : null}
    </section>
  );
}

export function AdminGallery() {
  const hasLoadedGalleryRef = useRef(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialAdminSidebarCollapsed);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(null);
  const [isUploadFormOpen, setUploadFormOpen] = useState(false);
  const [galleryData, setGalleryData] = useState([]);
  const [isGalleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState('');
  const [editingGallery, setEditingGallery] = useState(null);
  const [busyGalleryId, setBusyGalleryId] = useState(null);
  const selectedGallery = selectedGalleryIndex !== null ? galleryData[selectedGalleryIndex] : null;

  const loadGalleryData = async () => {
    try {
      setGalleryLoading(true);
      setGalleryError('');

      const data = await getGalleryFromApi();

      console.log('=== DEBUG THUMBNAIL GALERI ===');
      data.forEach((item) => {
        console.log({
          id: item.id,
          title: item.title,
          cover_path: item.cover_path,
          coverPath: item.coverPath,
          cover_url: item.cover_url,
          coverUrl: item.coverUrl,
          thumbnail_final: getGalleryThumbnailUrl(item),
        });
      });

      setGalleryData(data);
      setSelectedGalleryIndex(null);
    } catch (error) {
      console.error('Gagal mengambil data galeri:', {
        message: error?.message,
        error,
        apiUrl: GALLERY_API_URL,
      });
      setGalleryError(error.message || 'Gagal mengambil data galeri.');
    } finally {
      setGalleryLoading(false);
    }
  };

  useEffect(() => {
    if (hasLoadedGalleryRef.current) {
      return;
    }

    hasLoadedGalleryRef.current = true;
    loadGalleryData();
  }, []);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistAdminSidebarCollapsed(nextValue);
      return nextValue;
    });
  };

  const handleSelectGallery = (index) => {
    setSelectedGalleryIndex((currentIndex) => (currentIndex === index ? null : index));
  };

  const handleOpenUploadForm = () => {
    setSelectedGalleryIndex(null);
    setEditingGallery(null);
    setUploadFormOpen(true);
  };

  const handleViewGallery = (index) => {
    setEditingGallery(null);
    setUploadFormOpen(false);
    setSelectedGalleryIndex(index);
  };

  const handleEditGallery = (gallery) => {
    setSelectedGalleryIndex(null);
    setEditingGallery(gallery);
    setUploadFormOpen(true);
  };

  const handleDeleteGallery = async (gallery) => {
    const galleryId = getGalleryId(gallery);

    if (!galleryId) {
      setGalleryError('ID galeri tidak tersedia.');
      return;
    }

    const confirmed = await showConfirmAlert({
      title: 'Hapus Galeri?',
      text: `Galeri "${gallery.title || 'Tanpa Judul'}" akan dihapus permanen.`,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      icon: 'warning',
    });

    if (!confirmed) return;

    try {
      setBusyGalleryId(galleryId);
      setGalleryError('');

      const response = await fetch(`${GALLERY_API_URL}?id=${encodeURIComponent(galleryId)}`, {
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

      setGalleryData((currentData) => currentData.filter((item) => getGalleryId(item) !== galleryId));
      setSelectedGalleryIndex(null);

      await showSuccessAlert(
        'Galeri Berhasil Dihapus',
        result.message || `Galeri "${gallery.title || 'Tanpa Judul'}" berhasil dihapus.`
      );
    } catch (error) {
      console.error('Gagal menghapus galeri:', error);
      setGalleryError(error.message || 'Gagal menghapus galeri.');
    } finally {
      setBusyGalleryId(null);
    }
  };

  const galleryStats = useMemo(() => {
    const toNumber = (...values) => {
      const rawValue = values.find((value) => value !== undefined && value !== null && value !== '');
      if (rawValue === undefined) return 0;
      if (typeof rawValue === 'number') return Number.isFinite(rawValue) ? rawValue : 0;

      const normalizedValue = String(rawValue).replace(/\./g, '').replace(',', '.');
      const parsedValue = Number(normalizedValue);
      return Number.isFinite(parsedValue) ? parsedValue : 0;
    };

    const getMediaCount = (item) => {
      const count = toNumber(item.mediaCount, item.jumlahMedia, item.totalMedia, item.media_count, item.total_media);
      return count > 0 ? count : 1;
    };

    const normalizeStatus = (item) => String(item.status || '').trim().toLowerCase();
    const normalizeType = (item) => String(item.mediaType || item.type || item.jenisMedia || item.jenis_media || 'foto').trim().toLowerCase();

    const totalGallery = galleryData.length;
    const totalMedia = galleryData.reduce((sum, item) => sum + getMediaCount(item), 0);
    const publishedItems = galleryData.filter((item) => ['published', 'publish', 'publik'].includes(normalizeStatus(item)));
    const draftItems = galleryData.filter((item) => ['draft', 'belum publish', 'unpublished'].includes(normalizeStatus(item)));
    const reviewItems = galleryData.filter((item) => ['review', 'perlu review', 'pending', 'menunggu review'].includes(normalizeStatus(item)));
    const videoPublished = publishedItems.reduce((sum, item) => (
      normalizeType(item).includes('video') ? sum + getMediaCount(item) : sum
    ), 0);
    const photoPublished = publishedItems.reduce((sum, item) => (
      normalizeType(item).includes('video') ? sum : sum + getMediaCount(item)
    ), 0);
    const totalViewer = galleryData.reduce((sum, item) => (
      sum + toNumber(item.viewer, item.viewers, item.totalViewer, item.total_viewer, item.views, item.view_count)
    ), 0);
    const percent = (value) => (totalGallery > 0 ? `${((value / totalGallery) * 100).toFixed(1)}% dari total` : '0% dari total');

    return [
      { label: 'Total Media', value: totalMedia.toLocaleString('id-ID'), note: `${totalGallery.toLocaleString('id-ID')} galeri`, icon: cameraIcon, tone: 'blue' },
      { label: 'Foto Published', value: photoPublished.toLocaleString('id-ID'), note: percent(publishedItems.length), icon: checkIcon, tone: 'green' },
      { label: 'Video Published', value: videoPublished.toLocaleString('id-ID'), note: percent(videoPublished), icon: galleryIcon, tone: 'blue' },
      { label: 'Draft / Belum Publish', value: draftItems.length.toLocaleString('id-ID'), note: percent(draftItems.length), icon: fileIcon, tone: 'orange' },
      { label: 'Perlu Review', value: reviewItems.length.toLocaleString('id-ID'), note: percent(reviewItems.length), icon: clockIcon, tone: 'purple' },
      { label: 'Total Viewer Galeri', value: totalViewer.toLocaleString('id-ID'), note: 'Sesuai data tabel', icon: eyeIcon, tone: 'blue' },
    ];
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
                <input type="search" placeholder="Cari judul kegiatan / nama file..." />
              </label>
              {['Jenis Media', 'Status', 'Kategori'].map((label) => (
                <label key={label}>
                  <span>{label}</span>
                  <select defaultValue="">
                    <option value="">
                      {label === 'Jenis Media' ? 'Semua Jenis' : label === 'Status' ? 'Semua Status' : 'Semua Kategori'}
                    </option>
                  </select>
                </label>
              ))}
              <label>
                <span>Tanggal Kegiatan</span>
                <input type="text" placeholder="Pilih rentang tanggal" />
              </label>
              <label>
                <span>Upload By</span>
                <select defaultValue=""><option value="">Semua Admin</option></select>
              </label>
              <button type="button">Reset Filter</button>
              <button type="button" className="admin-gallery-primary" onClick={handleOpenUploadForm}><img src={downloadIcon} alt="" /> Upload Media</button>
            </section>

            <section className="admin-gallery-table-card">
              <table className="admin-gallery-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Pilih semua galeri"
                        checked={false}
                        onChange={() => {}}
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
                  ) : galleryData.length === 0 ? (
                    <tr>
                      <td colSpan="12">Belum ada data galeri.</td>
                    </tr>
                  ) : (
                    galleryData.map((item, index) => (
                      <tr key={item.id || `${item.title}-${index}`}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Pilih ${item.title}`}
                            checked={selectedGalleryIndex === index}
                            onChange={() => handleSelectGallery(index)}
                          />
                        </td>
                        <td>
                          {getGalleryCoverSource(item) ? (
                            <img
                              className="admin-gallery-thumb"
                              src={getGalleryThumbnailUrl(item)}
                              alt={item.title}
                              onError={(event) => {
                                console.error(
                                  'Thumbnail gagal dimuat:',
                                  getGalleryThumbnailUrl(item),
                                  item
                                );
                                event.currentTarget.style.visibility = 'hidden';
                              }}
                            />
                          ) : item.needsCoverReupload || item.needs_cover_reupload ? (
                            <span
                              className="admin-gallery-thumb"
                              title="Cover lama harus diupload ulang"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, textAlign: 'center', padding: 4 }}
                            >
                              Upload ulang cover
                            </span>
                          ) : (
                            <GalleryThumbnail index={index} />
                          )}
                        </td>
                        <td><b>{item.title}</b><small>{stripHtml(item.description)}</small></td>
                        <td><GalleryBadge>Foto</GalleryBadge></td>
                        <td><GalleryBadge>{item.tag || 'Dokumentasi'}</GalleryBadge></td>
                        <td>1</td>
                        <td><GalleryBadge>{item.status === 'published' ? 'Published' : 'Draft'}</GalleryBadge></td>
                        <td>0</td>
                        <td>{formatGalleryDate(item.eventDate)}</td>
                        <td>{formatGalleryDate(item.createdAt)}</td>
                        <td>{item.userName || 'Admin'}</td>
                        <td>
                          <div className="admin-gallery-actions">
                            <button
                              className="admin-gallery-action admin-gallery-action--view"
                              type="button"
                              onClick={() => handleViewGallery(index)}
                              disabled={busyGalleryId === getGalleryId(item)}
                            >
                              <img src={eyeIcon} alt="" /> Lihat
                            </button>
                            <button
                              className="admin-gallery-action"
                              type="button"
                              onClick={() => handleEditGallery(item)}
                              disabled={busyGalleryId === getGalleryId(item)}
                            >
                              Edit
                            </button>
                            <button
                              className="admin-gallery-action admin-gallery-action--delete"
                              type="button"
                              onClick={() => handleDeleteGallery(item)}
                              disabled={busyGalleryId === getGalleryId(item)}
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
                <span>Menampilkan {galleryData.length} data galeri</span>
                <div>
                  <button type="button">&lt;</button>
                  <button type="button" className="is-active">1</button>
                  <button type="button">2</button>
                  <button type="button">3</button>
                  <button type="button">156</button>
                  <button type="button">&gt;</button>
                </div>
                <select defaultValue="10">
                  <option value="10">10 / halaman</option>
                </select>
              </div>
            </section>

            <section className="admin-gallery-bottom admin-gallery-bottom--top">
              <article className="admin-gallery-panel">
                <div className="admin-gallery-panel-head"><h2>Galeri Terbaru</h2><a href="/admin/gallery/recent">Lihat semua</a></div>
                {recentGalleries.map((item, index) => (
                  <p key={item[0]}><GalleryThumbnail index={index} className="admin-gallery-mini-thumb" /><b>{item[0]}</b><time>{item[1]}</time></p>
                ))}
              </article>

              <article className="admin-gallery-panel admin-gallery-review">
                <div className="admin-gallery-panel-head"><h2>Media Perlu Review</h2><a href="/admin/gallery/review">Lihat semua</a></div>
                {reviewMedia.map((item) => (
                  <p key={item[0]}><span>{item[0]}</span><GalleryBadge>{item[1]}</GalleryBadge></p>
                ))}
              </article>

              <article className="admin-gallery-panel">
                <div className="admin-gallery-panel-head"><h2>Galeri Populer</h2><a href="/admin/gallery/popular">Lihat semua</a></div>
                <table>
                  <tbody>
                    {popularGalleries.map((item, index) => (
                      <tr key={item[0]}><td>{index + 1}</td><td>{item[0]}</td><td>{item[1]}</td></tr>
                    ))}
                  </tbody>
                </table>
              </article>

              <article className="admin-gallery-panel">
                <div className="admin-gallery-panel-head"><h2>Draft Belum Publish</h2><a href="/admin/gallery/drafts">Lihat semua</a></div>
                {draftGalleries.map((item, index) => (
                  <p key={item[0]}><GalleryThumbnail index={index + 1} className="admin-gallery-mini-thumb" /><b>{item[0]}</b><time>{item[1]}</time></p>
                ))}
              </article>
            </section>

            <section className="admin-gallery-bottom admin-gallery-bottom--bottom">
              <article className="admin-gallery-panel admin-gallery-activity">
                <div className="admin-gallery-panel-head"><h2>Aktivitas Terbaru</h2><a href="/admin/gallery/activity">Lihat semua</a></div>
                {activities.map((item) => (
                  <p key={item[0]}><span className={`admin-gallery-dot is-${item[2]}`} /><b>{item[0]}</b><time>{item[1]}</time></p>
                ))}
              </article>

              <article className="admin-gallery-panel admin-gallery-problems">
                <div className="admin-gallery-panel-head"><h2>Media Bermasalah</h2><a href="/admin/gallery/problems">Lihat semua</a></div>
                {mediaProblems.map((item) => (
                  <p key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong></p>
                ))}
              </article>

              <section className="admin-gallery-quick">
                <h2>Aksi Cepat</h2>
                <div>
                  {['Upload Foto / Video', 'Buat Album Baru', 'Kompres Media Besar', 'Publish Draft Terpilih', 'Cek Link Rusak', 'Reorder Galeri Homepage'].map((item) => (
                    <button type="button" key={item}>{item}</button>
                  ))}
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
              {getGalleryCoverSource(selectedGallery) ? (
                <img
                  className="admin-gallery-detail-image"
                  src={getGalleryThumbnailUrl(selectedGallery)}
                  alt={selectedGallery.title}
                />
              ) : (
                <GalleryThumbnail index={selectedGalleryIndex} className="admin-gallery-detail-image" />
              )}
              <div className="admin-gallery-detail-title">
                <h3>{selectedGallery.title}</h3>
                <GalleryBadge>{selectedGallery.status === 'published' ? 'Published' : 'Draft'}</GalleryBadge>
                <p><span>Foto</span><span>{selectedGallery.tag || 'Dokumentasi'}</span></p>
              </div>
              <dl>
                <dt><img src={clockIcon} alt="" />Tanggal Kegiatan</dt><dd>{formatGalleryDate(selectedGallery.eventDate)}</dd>
                <dt><img src={mapIcon} alt="" />Upload By</dt><dd>{selectedGallery.userName || 'Admin'}</dd>
                <dt><img src={galleryIcon} alt="" />Jumlah Media</dt><dd>1 foto</dd>
              </dl>
              <section className="admin-gallery-description">
                <h3>Deskripsi</h3>
                <p>{stripHtml(selectedGallery.description) || 'Belum ada deskripsi.'}</p>
              </section>
              <section className="admin-gallery-preview">
                <h3>Preview Media</h3>
                <div>
                  {getGalleryCoverSource(selectedGallery) ? (
                    <img
                      className="admin-gallery-mini-thumb"
                      src={getGalleryThumbnailUrl(selectedGallery)}
                      alt={selectedGallery.title}
                    />
                  ) : (
                    <GalleryThumbnail index={selectedGalleryIndex} className="admin-gallery-mini-thumb" />
                  )}
                </div>
                <a href="/admin/gallery/media">Lihat semua media</a>
              </section>
              <div className="admin-gallery-detail-actions">
                <button type="button" className="is-blue" onClick={() => handleEditGallery(selectedGallery)}>Edit Galeri</button>
                <button type="button">Preview Galeri</button>
                <button type="button" className="is-green">Publish / Unpublish</button>
                <button type="button" className="is-purple">Atur Cover</button>
                <button type="button" className="is-orange">Tandai Featured</button>
                <button type="button" className="is-danger">Arsipkan</button>
              </div>
            </aside>
            </div>
          )}            
          </>

          )}
        </div>
      </section>
    </main>
  );
}