import { useEffect, useMemo, useState } from 'react';
<<<<<<< HEAD
import { AdminSidebar } from './AdminSidebar.jsx';
import { ProjectUploadForm } from '../User/UserProjectGallery.jsx';
import {
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from '../../utils/alerts.js';
=======
import { AdminNotificationButton } from './AdminChrome.jsx';
import { AdminSidebar } from './AdminSidebar.jsx';
import { AdminActionDropdown } from './AdminActionDropdown.jsx';
import { ProjectUploadForm } from '../User/UserProjectGallery.jsx';
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import { API_BASE_URL, apiEndpoint } from '../../services/apiEndpoints.js';
import { fetchTransactions } from '../../services/transactionApi.js';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import galleryIcon from '../../assets/icons/icon-image-placeholder-1.svg';
import zapIcon from '../../assets/icons/icon-zap-1.svg';
import { showArduflowAlert, showConfirmAlert, showPromptAlert } from '../../utils/alerts.js';

<<<<<<< HEAD
const PROJECT_API_URL =
  'https://arduflow.indobilliard.com/apk/uploads/web/api/project-submit-sqlite.php';

const PROJECT_IMAGE_BASE_URL =
  'https://arduflow.indobilliard.com/apk/uploads/web/storage/project/';

console.info('[AdminProjects] PROJECT_STORAGE_THUMBNAIL_FIX aktif');

function getProjectPayload(project) {
  const rawPayload =
    project?.payload ??
    project?.payloadJson ??
    project?.payload_json ??
    {};

  if (
    rawPayload &&
    typeof rawPayload === 'object' &&
    !Array.isArray(rawPayload)
  ) {
    return rawPayload;
  }

  if (
    typeof rawPayload === 'string' &&
    rawPayload.trim()
  ) {
    try {
      const parsed = JSON.parse(rawPayload);

      return (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      )
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return {};
}

function getProjectImageFileName(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'object') {
    const candidates = [
      value.file_name,
      value.fileName,
      value.name,
      value.stored_name,
      value.storedName,
      value.file_url,
      value.fileUrl,
      value.url,
      value.src,
      value.path,
      value.file_path,
      value.filePath,
    ];

    for (const candidate of candidates) {
      const result =
        getProjectImageFileName(candidate);

      if (result) {
        return result;
      }
    }

    return '';
  }

  let clean = String(value)
    .trim()
    .replace(/\\/g, '/');

  if (!clean) {
    return '';
  }

  if (/^https?:\/\//i.test(clean)) {
    try {
      const parsedUrl = new URL(clean);
      clean = parsedUrl.pathname;
    } catch {
      // lanjut sebagai path biasa
    }
  }

  clean = clean
    .split('?')[0]
    .split('#')[0];

  let fileName = clean
    .split('/')
    .filter(Boolean)
    .pop() || '';

  try {
    fileName =
      decodeURIComponent(fileName);
  } catch {
    // biarkan nama asli
  }

  if (
    !/\.(jpg|jpeg|png|webp|gif|avif)$/i.test(
      fileName
    )
  ) {
    return '';
  }

  return fileName;
}

function buildProjectImageUrl(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    const clean = value.trim();

    /*
     * URL storage terbaru dari backend boleh dipakai langsung.
     */
    if (
      /^https?:\/\//i.test(clean) &&
      clean.includes(
        '/apk/uploads/web/storage/project/'
      )
    ) {
      return clean;
    }
  }

  const fileName =
    getProjectImageFileName(value);

  if (!fileName) {
    return '';
  }

  return (
    PROJECT_IMAGE_BASE_URL +
    encodeURIComponent(fileName)
  );
}

function getProjectThumbnailUrl(project) {
  if (!project || typeof project !== 'object') {
    return '';
  }

  const payload =
    getProjectPayload(project);

  const projectCover =
    project?.coverImage &&
    typeof project.coverImage === 'object'
      ? project.coverImage
      : {};

  const payloadCover =
    payload?.coverImage &&
    typeof payload.coverImage === 'object'
      ? payload.coverImage
      : {};

  const candidates = [
    /*
     * Response project-submit-sqlite.php terbaru.
     */
    projectCover.file_url,
    projectCover.fileUrl,
    projectCover.url,
    projectCover.src,
    projectCover.file_name,
    projectCover.fileName,
    projectCover.name,
    projectCover.file_path,
    projectCover.filePath,

    /*
     * Field langsung pada project.
     */
    project?.cover_image_url,
    project?.coverImageUrl,
    project?.cover_url,
    project?.coverUrl,
    project?.cover_image_path,
    project?.coverPath,
    project?.cover_path,
    project?.cover_image_name,
    project?.thumbnail,
    project?.thumbnailUrl,
    project?.thumbnail_url,
    project?.image,
    project?.imageUrl,
    project?.image_url,

    /*
     * Cover dari payload JSON.
     */
    payloadCover.file_url,
    payloadCover.fileUrl,
    payloadCover.url,
    payloadCover.src,
    payloadCover.file_name,
    payloadCover.fileName,
    payloadCover.name,
    payloadCover.file_path,
    payloadCover.filePath,

    payload?.cover_image_url,
    payload?.coverImageUrl,
    payload?.cover_url,
    payload?.coverUrl,
    payload?.cover_image_path,
    payload?.coverPath,
    payload?.cover_path,
    payload?.cover_image_name,
    payload?.thumbnail,
    payload?.thumbnailUrl,
    payload?.thumbnail_url,
  ];

  for (const candidate of candidates) {
    const imageUrl =
      buildProjectImageUrl(candidate);

    if (imageUrl) {
      return imageUrl;
    }
  }

  return '';
}

function ProjectThumbnail({
  project,
  index = 0,
}) {
  const imageUrl = useMemo(
    () => getProjectThumbnailUrl(project),
    [project]
  );

  const [failedUrl, setFailedUrl] =
    useState('');

  useEffect(() => {
    setFailedUrl('');
  }, [imageUrl]);

  const failed =
    Boolean(imageUrl) &&
    failedUrl === imageUrl;

  if (!imageUrl || failed) {
    return (
      <span
        className={`admin-projects-thumb is-${index % 5}`}
        title={
          failed
            ? `Thumbnail gagal dimuat: ${imageUrl}`
            : 'Thumbnail proyek tidak tersedia'
        }
        aria-label="Thumbnail tidak tersedia"
        style={{
          width: '40px',
          height: '40px',
          display: 'block',
          borderRadius: '6px',
        }}
      />
    );
  }

  return (
    <img
      className={`admin-projects-thumb is-${index % 5}`}
      src={imageUrl}
      alt={`Thumbnail ${
        project?.title ||
        'proyek'
      }`}
      loading="lazy"
      width="40"
      height="40"
      style={{
        width: '40px',
        height: '40px',
        objectFit: 'cover',
        display: 'block',
        borderRadius: '6px',
      }}
      onLoad={() => {
        console.log(
          '[AdminProjects] Thumbnail berhasil:',
          {
            projectId: project?.id,
            title: project?.title,
            imageUrl,
          }
        );
      }}
      onError={() => {
        console.error(
          '[AdminProjects] Thumbnail gagal:',
          {
            projectId: project?.id,
            title: project?.title,
            imageUrl,
            coverImage:
              project?.coverImage,
          }
        );

        setFailedUrl(imageUrl);
      }}
    />
  );
}

function toProjectNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;

  const normalized = String(value).replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatProjectCount(value) {
  return toProjectNumber(value).toLocaleString('id-ID');
}

function formatProjectPercent(part, total) {
  if (!total) return '0% dari total';
  return `${((part / total) * 100).toLocaleString('id-ID', {
    maximumFractionDigits: 1,
  })}% dari total`;
}

function isProjectStatus(project, candidates) {
  const status = String(project?.status || '').toLowerCase();
  return candidates.some((candidate) => status.includes(candidate));
}

const reviewProjects = [
  ['Penyiraman Tanaman Otomatis', 'Siti Aisyah', '20 Mei 2024'],
  ['Sistem Parkir Otomatis', 'Rina Marlina', '20 Mei 2024'],
  ['Monitoring Kolam Ikan IoT', 'Irfan Maulana', '19 Mei 2024'],
  ['Smart Trash Bin', 'Maya Indah', '18 Mei 2024'],
];

const popularProjects = [
  ['Smart Home Monitoring', '2.845', '512'],
  ['Weather Station IoT', '2.156', '398'],
  ['Energy Meter IoT', '1.890', '276'],
  ['Penyiraman Tanaman Otomatis', '1.234', '244'],
  ['Greenhouse Monitoring', '1.102', '198'],
];

const problemProjects = [
  ['Thumbnail kosong', 18],
  ['Deskripsi terlalu pendek (< 150 kata)', 23],
  ['File tidak lengkap', 15],
  ['Link rusak', 9],
  ['Belum ada kategori', 7],
];

const activityItems = [
  ['Proyek "Smart Home Monitoring" dipublish', '20 Mei 2024 14:25', 'green'],
  ['Proyek "Sistem Keamanan Pintu" diminta revisi', '19 Mei 2024 11:10', 'blue'],
  ['Proyek "Smart Traffic Light" ditolak', '19 Mei 2024 10:05', 'purple'],
  ['Proyek "Energy Meter IoT" diupdate', '17 Mei 2024 16:30', 'green'],
];

function AdminProjectsTopbar() {
=======
const PROJECT_API_URL = apiEndpoint(
  import.meta.env.VITE_PROJECT_API_URL,
  '/api/projects-api.php'
);

function AdminProjectsTopbar({ searchValue, onSearchChange }) {
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
  return (
    <header className="admin-dashboard-topbar">
      <label className="admin-dashboard-search">
        <span aria-hidden="true" />
        <input
          type="search"
          placeholder="Cari proyek"
          aria-label="Cari proyek"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      <div className="admin-dashboard-account">
        <AdminNotificationButton />
        <span className="admin-dashboard-avatar" aria-hidden="true" />
        <span>
          <strong>Admin</strong>
          <small>Super Admin</small>
        </span>
      </div>
    </header>
  );
}

function ProjectBadge({ children }) {
  const slug = String(children).toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
  return <span className={`admin-projects-badge admin-projects-badge--${slug}`}>{children}</span>;
}

function ProjectAction({ label, children, active = false, onClick, disabled = false }) {
  return (
    <button
      className={`admin-projects-action${active ? ' is-active' : ''}`}
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function formatProjectDateTime(value) {
  if (!value) {
    return { date: '-', time: '' };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { date: String(value), time: '' };
  }

  return {
    date: date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function ProjectDateTime({ value }) {
  const formatted = formatProjectDateTime(value);

  return (
    <span className="admin-projects-date">
      <b>{formatted.date}</b>
      {formatted.time ? <small>{formatted.time}</small> : null}
    </span>
  );
}

<<<<<<< HEAD
=======
function toProjectNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === undefined || value === null || value === '') return 0;

  const parsed = Number(String(value).replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatProjectNumber(value) {
  return toProjectNumber(value).toLocaleString('id-ID');
}

function stripProjectHtml(value) {
  if (!value) return '';

  if (typeof window !== 'undefined' && window.DOMParser) {
    const documentValue = new window.DOMParser().parseFromString(String(value), 'text/html');
    return documentValue.body.textContent.replace(/\s+/g, ' ').trim();
  }

  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatProjectPercent(part, total) {
  if (!total) return '0% dari total';
  return `${((part / total) * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 })}% dari total`;
}

function normalizedStatus(project) {
  return String(project?.status || project?.visibility || 'draft').trim().toLowerCase();
}

function isProjectStatus(project, candidates) {
  const status = normalizedStatus(project);
  return candidates.some((candidate) => status.includes(candidate));
}

function getProjectOwnerName(project) {
  return project?.ownerName || project?.userName || project?.user?.name || 'User';
}

function getProjectOwnerUsername(project) {
  return project?.ownerUsername || project?.username || project?.user?.username || '-';
}

function getProjectKey(project) {
  return project?.id ?? project?.title ?? '';
}

>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
function getProjectArray(project, key) {
  const value = project?.[key] ?? project?.payload?.[key];
  return Array.isArray(value) ? value : [];
}

function getProjectPayment(project) {
  return project?.payment ?? project?.payload?.payment ?? {};
}

function getProjectItemLabel(item, fallback = '-') {
  if (typeof item === 'string') return item;
  if (!item || typeof item !== 'object') return fallback;

<<<<<<< HEAD
  return (
=======
  return stripProjectHtml(
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    item.name ||
    item.title ||
    item.label ||
    item.node ||
    item.component ||
    item.tool ||
    item.description ||
    fallback
  );
}

function getProjectStepLabel(step, index) {
  if (typeof step === 'string') return step;
  if (!step || typeof step !== 'object') return `Langkah ${index + 1}`;

<<<<<<< HEAD
  return step.title || step.description || step.name || `Langkah ${step.order || index + 1}`;
=======
  return stripProjectHtml(step.title || step.description || step.name || `Langkah ${step.order || index + 1}`);
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
}

function formatProjectPrice(project) {
  const payment = getProjectPayment(project);
  const rawPrice = payment.price ?? payment.amount ?? project?.price ?? 0;
  const price = toProjectNumber(rawPrice);
  const isPaid = Boolean(
    payment.isPaid ||
      payment.paid ||
      payment.enabled ||
      project?.isPaid ||
      price > 0
  );

  if (!isPaid) return 'Gratis';
  if (!price) return 'Berbayar';

  return `IDR ${price.toLocaleString('id-ID')}`;
}

function ProjectTableSummary({ items, labelGetter = getProjectItemLabel, empty = '-' }) {
  if (!items.length) {
    return <span className="admin-projects-summary is-empty">{empty}</span>;
  }

  const labels = items.map(labelGetter).filter(Boolean);
  const firstLabel = labels[0] || empty;
  const extraCount = Math.max(items.length - 1, 0);

  return (
    <span className="admin-projects-summary">
      <b>{items.length} data</b>
      <small title={labels.join(', ')}>
        {firstLabel}
        {extraCount ? ` +${extraCount}` : ''}
      </small>
    </span>
  );
}

<<<<<<< HEAD
=======
function getProjectTimestamp(project) {
  const raw = project?.updatedAt || project?.updated_at || project?.createdAt || project?.created_at;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

function getProjectFileUrl(project) {
  const file = project?.projectFile || project?.payload?.projectFile || {};
  const rawUrl = file.file_url || file.fileUrl || file.url || file.file_path || file.filePath || '';

  if (!rawUrl) return '';
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

  const normalizedPath = String(rawUrl)
    .replace(/^\/+/, '')
    .replace(/^storage\/uploads\//i, 'uploads/');

  return `${API_BASE_URL}/${normalizedPath}`;
}

function getProjectArchiveUrl(project) {
  if (!project?.id) return '';

  const separator = PROJECT_API_URL.includes('?') ? '&' : '?';
  return `${PROJECT_API_URL}${separator}id=${encodeURIComponent(project.id)}&action=download`;
}

function resolveProjectCoverUrl(project) {
  const cover = project?.coverImage || project?.cover_image || project?.image || {};
  const payloadCover = project?.payload?.coverImage || project?.payload?.cover_image || {};
  const rawUrl = (
    project?.coverImageUrl ||
    project?.cover_image_url ||
    project?.coverUrl ||
    project?.coverPath ||
    project?.cover_image_path ||
    cover.file_url ||
    cover.fileUrl ||
    cover.url ||
    cover.src ||
    cover.file_path ||
    cover.filePath ||
    cover.path ||
    payloadCover.file_url ||
    payloadCover.fileUrl ||
    payloadCover.url ||
    payloadCover.src ||
    payloadCover.file_path ||
    payloadCover.filePath ||
    payloadCover.path ||
    ''
  );

  if (!rawUrl) return '';
  if (/^(https?:\/\/|data:|blob:)/i.test(rawUrl)) return rawUrl;

  const normalizedPath = String(rawUrl)
    .replace(/\\/g, '/')
    .replace(/^.*\/storage\/uploads\//i, 'uploads/')
    .replace(/^\/+/, '')
    .replace(/^storage\/uploads\//i, 'uploads/');

  return `${API_BASE_URL}/${normalizedPath}`;
}

function getProjectDescription(project) {
  return stripProjectHtml(
    project?.description ||
    project?.summary ||
    project?.payload?.description ||
    project?.payload?.summary ||
    'Belum ada deskripsi proyek.'
  );
}

function getProjectPlatform(project) {
  const tags = getProjectArray(project, 'tags');

  return (
    project?.platform ||
    project?.programmingLanguage ||
    project?.payload?.platform ||
    project?.payload?.programmingLanguage ||
    tags[0] ||
    '-'
  );
}

function getProjectTags(project) {
  const rawTags = [
    project?.category,
    project?.difficulty,
    ...getProjectArray(project, 'tags'),
  ];

  return [...new Set(rawTags.filter(Boolean).map((tag) => String(tag).trim()).filter(Boolean))].slice(0, 4);
}

function getProjectItemQuantity(item) {
  if (!item || typeof item !== 'object') return '';
  return item.quantity || item.qty || item.amount || item.total || '';
}

function getProjectItemDescription(item, fallback = '') {
  if (typeof item === 'string') return fallback;
  if (!item || typeof item !== 'object') return fallback;

  return stripProjectHtml(item.description || item.desc || item.note || item.function || fallback);
}

function getProjectItemImageUrl(item) {
  const image = item && typeof item === 'object' ? item.image : null;
  const rawUrl = String(item?.imageUrl || image?.file_url || image?.fileUrl || image?.url || image?.src || '').trim();

  if (!rawUrl) return '';
  if (/^(https?:\/\/|data:|blob:)/i.test(rawUrl)) return rawUrl;

  return `${API_BASE_URL}${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`;
}

function getProjectCircuitImageUrl(project) {
  const image = project?.circuitImage || project?.payload?.circuitImage || null;
  const rawUrl = String(image?.file_url || image?.fileUrl || image?.url || image?.src || '').trim();

  if (!rawUrl) return '';
  if (/^(https?:\/\/|data:|blob:)/i.test(rawUrl)) return rawUrl;

  return `${API_BASE_URL}${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`;
}

function AdminProjectImagePlaceholder() {
  return (
    <span className="admin-projects-wire-placeholder" aria-hidden="true">
      <img src={galleryIcon} alt="" />
    </span>
  );
}

function AdminProjectStatCard({ icon, label, value }) {
  return (
    <article className="admin-projects-wire-stat">
      <span aria-hidden="true">{icon}</span>
      <small>{label}</small>
      <strong>{value || '-'}</strong>
    </article>
  );
}

function AdminProjectCircuitPreview({ tools }) {
  const visibleTools = tools.slice(0, 5);

  return (
    <div className="admin-projects-wire-circuit">
      <div className="admin-projects-wire-board">
        <span>ARDUINO</span>
        <i />
      </div>
      <div className="admin-projects-wire-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="admin-projects-wire-breadboard" aria-hidden="true" />
      <ul>
        {(visibleTools.length ? visibleTools : ['Arduino Uno', 'Sensor', 'Breadboard']).map((tool, index) => (
          <li key={`${getProjectItemLabel(tool, 'komponen')}-${index}`}>
            <span />
            {getProjectItemLabel(tool, `Komponen ${index + 1}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AdminProjectStepCard({ step, index }) {
  return (
    <article className="admin-projects-wire-step">
      <b>{index + 1}</b>
      <AdminProjectImagePlaceholder />
      <strong>{getProjectStepLabel(step, index)}</strong>
      <p>{getProjectItemDescription(step, 'Ikuti urutan pengerjaan sesuai dokumentasi proyek.')}</p>
    </article>
  );
}

>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
export function AdminProjects() {
  const params = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialAdminSidebarCollapsed);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectError, setProjectError] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
<<<<<<< HEAD
  const [editingProject, setEditingProject] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyProjectId, setBusyProjectId] = useState(null);

  const projectStats = useMemo(() => {
    const totalProjects = projects.length;
    const publishedProjects = projects.filter((project) =>
      isProjectStatus(project, ['published'])
    ).length;
    const reviewProjectsCount = projects.filter((project) =>
      isProjectStatus(project, ['review', 'pending', 'menunggu'])
    ).length;
    const revisionProjects = projects.filter((project) =>
      isProjectStatus(project, ['revisi', 'revision', 'ditolak', 'rejected'])
    ).length;
    const totalViewer = projects.reduce(
      (sum, project) => sum + toProjectNumber(project.viewer ?? project.viewers),
      0
    );
=======
  const [checkedProjectKeys, setCheckedProjectKeys] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [isUploadFormOpen, setUploadFormOpen] = useState(
    params.get('create') === '1' || params.get('mode') === 'create'
  );
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyProjectId, setBusyProjectId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [projectTransactions, setProjectTransactions] = useState([]);
  const projectStats = useMemo(() => {
    const totalProjects = projects.length;
    const publishedProjects = projects.filter((project) => isProjectStatus(project, ['published', 'publish'])).length;
    const reviewProjectsCount = projects.filter((project) => isProjectStatus(project, ['review', 'pending', 'menunggu'])).length;
    const revisionProjects = projects.filter((project) => isProjectStatus(project, ['revisi', 'revision', 'ditolak', 'rejected'])).length;
    const totalViewer = projects.reduce((sum, project) => sum + toProjectNumber(project.viewer ?? project.viewers), 0);
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    const mostPopularProject = projects.reduce((currentPopular, project) => {
      const currentViewer = toProjectNumber(currentPopular?.viewer ?? currentPopular?.viewers);
      const projectViewer = toProjectNumber(project.viewer ?? project.viewers);
      return projectViewer > currentViewer ? project : currentPopular;
    }, null);

    return [
<<<<<<< HEAD
      {
        label: 'Total Proyek',
        value: formatProjectCount(totalProjects),
        note: 'Semua proyek',
        icon: galleryIcon,
        tone: 'blue',
      },
      {
        label: 'Proyek Published',
        value: formatProjectCount(publishedProjects),
        note: formatProjectPercent(publishedProjects, totalProjects),
        icon: checkIcon,
        tone: 'green',
      },
      {
        label: 'Menunggu Review',
        value: formatProjectCount(reviewProjectsCount),
        note: formatProjectPercent(reviewProjectsCount, totalProjects),
        icon: clockIcon,
        tone: 'orange',
      },
      {
        label: 'Perlu Revisi / Ditolak',
        value: formatProjectCount(revisionProjects),
        note: formatProjectPercent(revisionProjects, totalProjects),
        icon: checkIcon,
        tone: 'red',
      },
      {
        label: 'Total Viewer',
        value: formatProjectCount(totalViewer),
        note: 'Semua proyek',
        icon: eyeIcon,
        tone: 'blue',
      },
      {
        label: 'Proyek Paling Populer',
        value: mostPopularProject?.title || '-',
        note: `Viewer: ${formatProjectCount(mostPopularProject?.viewer ?? mostPopularProject?.viewers)}`,
=======
      { label: 'Total Proyek', value: formatProjectNumber(totalProjects), note: 'Semua proyek tersimpan', icon: galleryIcon, tone: 'blue' },
      { label: 'Proyek Published', value: formatProjectNumber(publishedProjects), note: formatProjectPercent(publishedProjects, totalProjects), icon: checkIcon, tone: 'green' },
      { label: 'Menunggu Review', value: formatProjectNumber(reviewProjectsCount), note: formatProjectPercent(reviewProjectsCount, totalProjects), icon: clockIcon, tone: 'orange' },
      { label: 'Perlu Revisi / Ditolak', value: formatProjectNumber(revisionProjects), note: formatProjectPercent(revisionProjects, totalProjects), icon: checkIcon, tone: 'red' },
      { label: 'Total Viewer', value: formatProjectNumber(totalViewer), note: 'Dihitung dari data proyek', icon: eyeIcon, tone: 'blue' },
      {
        label: 'Proyek Paling Populer',
        value: mostPopularProject?.title || '-',
        note: `Viewer: ${formatProjectNumber(mostPopularProject?.viewer ?? mostPopularProject?.viewers)}`,
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
        icon: zapIcon,
        tone: 'red',
      },
    ];
  }, [projects]);
<<<<<<< HEAD

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        setIsLoading(true);
        setProjectError('');

        const response = await fetch(PROJECT_API_URL, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        const responseText = await response.text();

        let result;

        try {
          result = JSON.parse(responseText);
        } catch {
          throw new Error(`Response API bukan JSON: ${responseText}`);
        }

        console.log('Admin API URL:', PROJECT_API_URL);
        console.log('Admin API Status:', response.status);
        console.log('Admin API Response:', result);

        if (!response.ok) {
          throw new Error(
            result.message || `Gagal mengambil data proyek. HTTP ${response.status}`
          );
        }

        if (isMounted) {
          const projectData = Array.isArray(result.data) ? result.data : [];
          setProjects(projectData);
          setSelectedProject(null);
        }
      } catch (error) {
        console.error('Gagal mengambil proyek:', error);

        if (isMounted) {
          setProjectError(
            error instanceof TypeError
              ? `API tidak dapat dihubungi di ${PROJECT_API_URL}. Pastikan server API aktif, atau set VITE_PROJECT_API_URL di file .env FE.`
              : error.message || 'Gagal mengambil data proyek.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);
=======
  const salesByProject = useMemo(() => {
    const grouped = new Map();
    projectTransactions
      .filter((transaction) => transaction.itemType === 'project' && transaction.status === 'paid' && transaction.itemId !== null)
      .forEach((transaction) => {
        const key = String(transaction.itemId);
        grouped.set(key, [...(grouped.get(key) || []), transaction]);
      });
    return grouped;
  }, [projectTransactions]);
  const reviewProjects = useMemo(() => (
    projects
      .filter((project) => isProjectStatus(project, ['review', 'pending', 'menunggu']))
      .sort((left, right) => getProjectTimestamp(right) - getProjectTimestamp(left))
      .slice(0, 4)
  ), [projects]);
  const popularProjects = useMemo(() => (
    [...projects]
      .sort((left, right) => (
        toProjectNumber(right.viewer ?? right.viewers) - toProjectNumber(left.viewer ?? left.viewers)
      ))
      .slice(0, 5)
  ), [projects]);
  const problemProjects = useMemo(() => {
    const problems = [
      {
        label: 'Thumbnail kosong',
        count: projects.filter((project) => !resolveProjectCoverUrl(project)).length,
      },
      {
        label: 'Deskripsi terlalu pendek',
        count: projects.filter((project) => String(project.description || '').trim().length < 150).length,
      },
      {
        label: 'File proyek kosong',
        count: projects.filter((project) => !project.projectFile && !project.payload?.projectFile).length,
      },
      {
        label: 'Belum ada kategori',
        count: projects.filter((project) => !String(project.category || '').trim()).length,
      },
    ];

    return problems.filter((item) => item.count > 0);
  }, [projects]);
  const activityItems = useMemo(() => (
    [...projects]
      .sort((left, right) => getProjectTimestamp(right) - getProjectTimestamp(left))
      .slice(0, 4)
      .map((project) => ({
        id: project.id ?? project.title,
        title: project.title || 'Tanpa Judul',
        status: project.status || 'draft',
        time: project.updatedAt || project.updated_at || project.createdAt || project.created_at,
        tone: isProjectStatus(project, ['published', 'publish'])
          ? 'green'
          : isProjectStatus(project, ['revisi', 'revision', 'ditolak', 'rejected'])
            ? 'purple'
            : 'blue',
      }))
  ), [projects]);
  const filterOptions = useMemo(() => {
    const uniqueValues = (getter) => [...new Set(
      projects
        .map((project) => String(getter(project) || '').trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'id-ID'));

    return {
      statuses: uniqueValues((project) => project.status || project.visibility),
      categories: uniqueValues((project) => project.category),
      levels: uniqueValues((project) => project.difficulty),
      owners: uniqueValues((project) => getProjectOwnerName(project)),
    };
  }, [projects]);
  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const uploadDate = dateFilter.trim().toLowerCase();

    return projects.filter((project) => {
      const ownerName = getProjectOwnerName(project);
      const ownerUsername = getProjectOwnerUsername(project);
      const status = String(project.status || project.visibility || '').trim();
      const category = String(project.category || '').trim();
      const level = String(project.difficulty || '').trim();
      const formattedDate = formatProjectDateTime(project.createdAt || project.created_at).date.toLowerCase();
      const rawDate = String(project.createdAt || project.created_at || '').toLowerCase();
      const haystack = [
        project.title,
        project.description,
        ownerName,
        ownerUsername,
        category,
        level,
        status,
        ...getProjectArray(project, 'tools').map((item) => getProjectItemLabel(item, '')),
        ...getProjectArray(project, 'nodes').map((item) => getProjectItemLabel(item, '')),
        ...getProjectArray(project, 'steps').map((item, index) => getProjectStepLabel(item, index)),
      ].join(' ').toLowerCase();

      return (
        (!query || haystack.includes(query)) &&
        (!statusFilter || status === statusFilter) &&
        (!categoryFilter || category === categoryFilter) &&
        (!levelFilter || level === levelFilter) &&
        (!ownerFilter || ownerName === ownerFilter) &&
        (!uploadDate || formattedDate.includes(uploadDate) || rawDate.includes(uploadDate))
      );
    });
  }, [projects, searchQuery, statusFilter, categoryFilter, levelFilter, ownerFilter, dateFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredProjects.slice(start, start + perPage);
  }, [filteredProjects, currentPage, perPage]);
  const paginatedProjectKeys = useMemo(
    () => paginatedProjects.map(getProjectKey).filter(Boolean),
    [paginatedProjects]
  );
  const isCurrentPageChecked = paginatedProjectKeys.length > 0 &&
    paginatedProjectKeys.every((key) => checkedProjectKeys.includes(key));
  const selectedProjects = useMemo(
    () => projects.filter((project) => checkedProjectKeys.includes(getProjectKey(project))),
    [projects, checkedProjectKeys]
  );
  const selectedProjectCount = selectedProjects.length;
  const isBulkActionBusy = busyProjectId === 'bulk';

  async function loadProjects({ keepSelection = false } = {}) {
    try {
      setIsLoading(true);
      setProjectError('');

      const response = await fetch(PROJECT_API_URL, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      const responseText = await response.text();

      let result;

      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(`Response API bukan JSON: ${responseText}`);
      }

      console.log('Admin API URL:', PROJECT_API_URL);
      console.log('Admin API Status:', response.status);
      console.log('Admin API Response:', result);

      if (!response.ok) {
        throw new Error(
          result.message || `Gagal mengambil data proyek. HTTP ${response.status}`
        );
      }

      const projectData = Array.isArray(result.data) ? result.data : [];
      setProjects(projectData);
      try {
        setProjectTransactions(await fetchTransactions());
      } catch (transactionError) {
        console.error('Gagal memuat jumlah penjualan proyek:', transactionError);
        setProjectTransactions([]);
      }
      if (!keepSelection) setSelectedProject(null);
    } catch (error) {
      console.error('Gagal mengambil proyek:', error);

      setProjectError(
        error instanceof TypeError
          ? `API tidak dapat dihubungi di ${PROJECT_API_URL}. Pastikan Apache aktif dan endpoint GET dapat diakses.`
          : error.message || 'Gagal mengambil data proyek.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, categoryFilter, levelFilter, ownerFilter, dateFilter, perPage]);
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistAdminSidebarCollapsed(nextValue);
      return nextValue;
    });
  };

<<<<<<< HEAD
  const handleEditSuccess = (savedProject) => {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        String(project.id) === String(editingProject?.id)
          ? { ...project, ...(savedProject || {}) }
          : project
      )
    );
    setEditingProject(null);
    setSelectedProject(null);
    setActionError('');
    setActionMessage('Proyek berhasil diperbarui.');
=======
  const handleSelectProject = (project) => {
    if (editingProject || isUploadFormOpen) return;

    setSelectedProject((currentProject) => {
      const currentKey = currentProject?.id ?? currentProject?.title;
      const nextKey = project?.id ?? project?.title;
      return currentKey === nextKey ? null : project;
    });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setCategoryFilter('');
    setLevelFilter('');
    setOwnerFilter('');
    setDateFilter('');
    setPage(1);
  };

  const handleToggleProjectCheck = (project) => {
    const projectKey = getProjectKey(project);
    if (!projectKey) return;

    setCheckedProjectKeys((currentKeys) =>
      currentKeys.includes(projectKey)
        ? currentKeys.filter((key) => key !== projectKey)
        : [...currentKeys, projectKey]
    );
  };

  const handleToggleCurrentPageChecks = () => {
    if (!paginatedProjectKeys.length) return;

    setCheckedProjectKeys((currentKeys) => {
      const currentKeySet = new Set(currentKeys);
      const shouldUncheckPage = paginatedProjectKeys.every((key) => currentKeySet.has(key));

      if (shouldUncheckPage) {
        return currentKeys.filter((key) => !paginatedProjectKeys.includes(key));
      }

      paginatedProjectKeys.forEach((key) => currentKeySet.add(key));
      return [...currentKeySet];
    });
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
  };


  const parseApiResponse = async (response) => {
    const responseText = await response.text();

    let result;
    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error(`Response API bukan JSON: ${responseText}`);
    }

    if (!response.ok) {
      throw new Error(result.message || `Request gagal. HTTP ${response.status}`);
    }

    return result;
  };

  const handleViewProject = async (project) => {
    if (!project?.id) {
      setActionError('ID proyek tidak tersedia.');
      return;
    }

    try {
      setBusyProjectId(project.id);
      setActionError('');
      setActionMessage('');

      const response = await fetch(`${PROJECT_API_URL}?id=${encodeURIComponent(project.id)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      const result = await parseApiResponse(response);
      setSelectedProject(result.data || project);
      setActionMessage('Detail proyek berhasil dibuka.');
    } catch (error) {
      console.error('Gagal melihat proyek:', error);
      setActionError(error.message || 'Gagal melihat detail proyek.');
    } finally {
      setBusyProjectId(null);
    }
  };

<<<<<<< HEAD
  const handleEditProject = async (project) => {
    if (!project?.id) {
      const message = 'ID proyek tidak tersedia.';
      setActionError(message);

      await showErrorAlert(
        'Gagal Membuka Edit',
        message
      );

      return;
    }

    const confirmed = await showConfirmAlert({
      title: 'Edit Proyek?',
      text: `Anda akan mengedit proyek "${project.title || 'Tanpa Judul'}".`,
      confirmButtonText: 'Edit Proyek',
      cancelButtonText: 'Batal',
      icon: 'question',
    });

    if (!confirmed) {
=======
  const handleEditProject = (project) => {
    if (!project?.id) {
      setActionError('ID proyek tidak tersedia.');
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
      return;
    }

    setActionError('');
    setActionMessage('');
    setSelectedProject(null);
<<<<<<< HEAD
    setEditingProject(project);
  };

  const handleDeleteProject = async (project) => {
    if (!project?.id) {
      const message = 'ID proyek tidak tersedia.';
      setActionError(message);

      await showErrorAlert(
        'Gagal Menghapus',
        message
      );

      return;
    }

    const confirmed = await showConfirmAlert({
      title: 'Hapus Proyek?',
      text:
        `Yakin ingin menghapus proyek "${project.title || 'Tanpa Judul'}"? ` +
        'Data yang sudah dihapus tidak dapat dikembalikan.',
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal',
      icon: 'warning',
    });

    if (!confirmed) {
=======
    setUploadFormOpen(false);
    setEditingProject(project);
  };

  const handleUploadProject = () => {
    setActionError('');
    setActionMessage('');
    setSelectedProject(null);
    setEditingProject(null);
    setUploadFormOpen(true);
  };

  const handleProjectSaved = async (message) => {
    setEditingProject(null);
    setUploadFormOpen(false);
    setActionError('');
    setActionMessage(message);
    await loadProjects();
  };

  const updateProjectFields = async (project, fields, successMessage) => {
    if (!project?.id) {
      setActionError('ID proyek tidak tersedia.');
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
      return;
    }

    try {
      setBusyProjectId(project.id);
      setActionError('');
      setActionMessage('');

<<<<<<< HEAD
      const response = await fetch(
        `${PROJECT_API_URL}?id=${encodeURIComponent(project.id)}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      const result = await parseApiResponse(response);

      setProjects((currentProjects) =>
        currentProjects.filter(
          (item) =>
            String(item.id) !== String(project.id)
        )
      );

      setSelectedProject((currentProject) =>
        String(currentProject?.id || '') === String(project.id)
          ? null
          : currentProject
      );

      const successMessage =
        result.message ||
        `Proyek "${project.title || 'Tanpa Judul'}" berhasil dihapus.`;

      setActionMessage(successMessage);

      await showSuccessAlert(
        'Berhasil Dihapus',
        successMessage
      );
    } catch (error) {
      console.error(
        'Gagal menghapus proyek:',
        error
      );

      const message =
        error?.message ||
        'Gagal menghapus proyek.';

      setActionError(message);

      await showErrorAlert(
        'Gagal Menghapus',
        message
      );
=======
      const response = await fetch(`${PROJECT_API_URL}?id=${encodeURIComponent(project.id)}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...fields,
          updatedAt: new Date().toISOString(),
        }),
      });
      const result = await parseApiResponse(response);
      const updatedProject = result.data || { ...project, ...fields };

      setProjects((currentProjects) =>
        currentProjects.map((item) => (item.id === project.id ? updatedProject : item))
      );
      setSelectedProject((currentProject) =>
        currentProject?.id === project.id ? updatedProject : currentProject
      );
      setCheckedProjectKeys((currentKeys) =>
        currentKeys.map((key) =>
          key === getProjectKey(project) ? getProjectKey(updatedProject) : key
        ).filter(Boolean)
      );
      setActionMessage(successMessage || result.message || 'Proyek berhasil diperbarui.');
    } catch (error) {
      console.error('Gagal memperbarui proyek:', error);
      setActionError(error.message || 'Gagal memperbarui proyek.');
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
    } finally {
      setBusyProjectId(null);
    }
  };

<<<<<<< HEAD
=======
  const bulkUpdateProjects = async (fieldsGetter, successMessage) => {
    if (!selectedProjects.length) {
      setActionError('Pilih minimal satu proyek terlebih dahulu.');
      return;
    }

    try {
      setBusyProjectId('bulk');
      setActionError('');
      setActionMessage('');

      const updatedProjects = [];

      for (const project of selectedProjects) {
        const fields = typeof fieldsGetter === 'function' ? fieldsGetter(project) : fieldsGetter;
        const response = await fetch(`${PROJECT_API_URL}?id=${encodeURIComponent(project.id)}`, {
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...fields,
            updatedAt: new Date().toISOString(),
          }),
        });
        const result = await parseApiResponse(response);
        updatedProjects.push(result.data || { ...project, ...fields });
      }

      setProjects((currentProjects) =>
        currentProjects.map((project) => (
          updatedProjects.find((item) => item.id === project.id) || project
        ))
      );
      setSelectedProject((currentProject) =>
        currentProject
          ? updatedProjects.find((item) => item.id === currentProject.id) || currentProject
          : currentProject
      );
      setCheckedProjectKeys([]);
      setActionMessage(`${successMessage} (${updatedProjects.length} proyek).`);
    } catch (error) {
      console.error('Gagal menjalankan aksi massal proyek:', error);
      setActionError(error.message || 'Gagal menjalankan aksi massal proyek.');
    } finally {
      setBusyProjectId(null);
    }
  };

  const handleBulkPublish = () => {
    bulkUpdateProjects(
      (project) => ({
        status: 'published',
        visibility: 'public',
        publishedAt: project.publishedAt || new Date().toISOString(),
      }),
      'Proyek terpilih berhasil dipublish'
    );
  };

  const handleBulkDraft = () => {
    bulkUpdateProjects(
      {
        status: 'draft',
        visibility: 'draft',
      },
      'Proyek terpilih berhasil dijadikan draft'
    );
  };

  const handleBulkArchive = async () => {
    const confirmed = await showConfirmAlert({
      title: 'Arsipkan Proyek Terpilih?',
      text: `${selectedProjectCount} proyek akan dipindahkan ke arsip.`,
      confirmButtonText: 'Arsipkan',
    });

    if (!confirmed) return;

    bulkUpdateProjects(
      {
        status: 'archived',
        visibility: 'archived',
      },
      'Proyek terpilih berhasil diarsipkan'
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedProjects.length) {
      setActionError('Pilih minimal satu proyek terlebih dahulu.');
      return;
    }

    const confirmed = await showConfirmAlert({
      title: 'Hapus Proyek Terpilih?',
      text: `${selectedProjectCount} proyek akan dihapus permanen dan tidak dapat dikembalikan.`,
      confirmButtonText: 'Hapus',
    });

    if (!confirmed) return;

    try {
      setBusyProjectId('bulk');
      setActionError('');
      setActionMessage('');

      for (const project of selectedProjects) {
        const response = await fetch(`${PROJECT_API_URL}?id=${encodeURIComponent(project.id)}`, {
          method: 'DELETE',
          headers: { Accept: 'application/json' },
        });
        await parseApiResponse(response);
      }

      const deletedKeys = selectedProjects.map(getProjectKey);
      setProjects((currentProjects) =>
        currentProjects.filter((project) => !deletedKeys.includes(getProjectKey(project)))
      );
      setSelectedProject((currentProject) =>
        currentProject && deletedKeys.includes(getProjectKey(currentProject)) ? null : currentProject
      );
      setCheckedProjectKeys([]);
      setActionMessage(`Proyek terpilih berhasil dihapus (${selectedProjectCount} proyek).`);
    } catch (error) {
      console.error('Gagal menghapus proyek terpilih:', error);
      setActionError(error.message || 'Gagal menghapus proyek terpilih.');
    } finally {
      setBusyProjectId(null);
    }
  };

  const handlePreviewProject = (project) => {
    const projectFileUrl = getProjectFileUrl(project);

    if (projectFileUrl) {
      window.open(getProjectArchiveUrl(project) || projectFileUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    window.open(`/project/detail?id=${encodeURIComponent(project.id)}`, '_blank', 'noopener,noreferrer');
  };

  const handleTogglePublish = (project) => {
    const isPublished = isProjectStatus(project, ['published', 'publish']);

    updateProjectFields(
      project,
      {
        status: isPublished ? 'draft' : 'published',
        visibility: isPublished ? 'draft' : 'public',
        publishedAt: isPublished ? null : (project.publishedAt || new Date().toISOString()),
      },
      isPublished ? 'Proyek berhasil di-unpublish.' : 'Proyek berhasil dipublish.'
    );
  };

  const handleRequestRevision = async (project) => {
    const note = await showPromptAlert({
      title: 'Minta Revisi',
      text: 'Catatan revisi untuk pemilik proyek.',
      inputValue: 'Mohon lengkapi detail proyek dan file pendukung.',
      confirmButtonText: 'Kirim Revisi',
    });

    if (note === null) return;

    updateProjectFields(
      project,
      {
        status: 'revision',
        visibility: 'draft',
        reviewNote: note.trim(),
      },
      'Proyek ditandai perlu revisi.'
    );
  };

  const handleToggleFeatured = (project) => {
    const nextFeatured = !Boolean(project.featured || project.isFeatured || project.payload?.featured);

    updateProjectFields(
      project,
      {
        featured: nextFeatured,
        isFeatured: nextFeatured,
      },
      nextFeatured ? 'Proyek ditandai featured.' : 'Tanda featured proyek dihapus.'
    );
  };

  const handleArchiveProject = async (project) => {
    const confirmed = await showConfirmAlert({
      title: 'Arsipkan Proyek?',
      text: `Proyek "${project.title || 'Tanpa Judul'}" akan dipindahkan ke arsip.`,
      confirmButtonText: 'Arsipkan',
    });

    if (!confirmed) return;

    updateProjectFields(
      project,
      {
        status: 'archived',
        visibility: 'archived',
      },
      'Proyek berhasil diarsipkan.'
    );
  };

  const handleDeleteProject = async (project) => {
    if (!project?.id) {
      setActionError('ID proyek tidak tersedia.');
      return;
    }

    const confirmed = await showConfirmAlert({
      title: 'Hapus Proyek?',
      text: `Yakin ingin menghapus proyek "${project.title || 'Tanpa Judul'}"? Data yang dihapus tidak dapat dikembalikan.`,
      confirmButtonText: 'Hapus',
    });

    if (!confirmed) return;

    try {
      setBusyProjectId(project.id);
      setActionError('');
      setActionMessage('');

      const response = await fetch(`${PROJECT_API_URL}?id=${encodeURIComponent(project.id)}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });

      const result = await parseApiResponse(response);

      setProjects((currentProjects) =>
        currentProjects.filter((item) => item.id !== project.id)
      );

      setSelectedProject((currentProject) =>
        currentProject?.id === project.id ? null : currentProject
      );
      setCheckedProjectKeys((currentKeys) =>
        currentKeys.filter((key) => key !== getProjectKey(project))
      );

      setActionMessage(result.message || 'Proyek berhasil dihapus.');
    } catch (error) {
      console.error('Gagal menghapus proyek:', error);
      setActionError(error.message || 'Gagal menghapus proyek.');
    } finally {
      setBusyProjectId(null);
    }
  };


>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
  return (
    <main className={`admin-dashboard-page admin-projects-page${isSidebarCollapsed ? ' admin-dashboard-page--collapsed' : ''}`}>
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={handleToggleSidebar} />

      <section className="admin-dashboard-main" aria-label="Proyek admin">
        <AdminProjectsTopbar searchValue={searchQuery} onSearchChange={setSearchQuery} />

        <div className="admin-projects-layout">
          <section className="admin-projects-content">
<<<<<<< HEAD
            {editingProject ? (
              <ProjectUploadForm
                mode="edit"
                projectId={String(editingProject.id)}
                initialProject={editingProject}
                onCancel={() => setEditingProject(null)}
                onSuccess={handleEditSuccess}
=======
            {editingProject || isUploadFormOpen ? (
              <ProjectUploadForm
                mode={editingProject ? 'edit' : 'create'}
                projectId={editingProject ? String(editingProject.id) : ''}
                initialProject={editingProject}
                onSuccess={() => handleProjectSaved(editingProject ? 'Proyek berhasil diperbarui.' : 'Proyek admin berhasil diupload.')}
                onCancel={() => {
                  setEditingProject(null);
                  setUploadFormOpen(false);
                }}
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
              />
            ) : (
              <>
            <div className="admin-projects-heading">
              <div>
                <h1>Proyek</h1>
                <p>Dashboard <span>/</span> Proyek</p>
              </div>
              <button type="button" onClick={handleUploadProject}>
                Upload Proyek
              </button>
            </div>

            {actionMessage ? (
              <p role="status" style={{ margin: '0 0 16px', color: '#15803d' }}>
                {actionMessage}
              </p>
            ) : null}

            {actionError ? (
              <p role="alert" style={{ margin: '0 0 16px', color: '#dc2626' }}>
                {actionError}
              </p>
            ) : null}

<<<<<<< HEAD
=======
            

>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
            <section className="admin-projects-stats" aria-label="Ringkasan proyek">
              {projectStats.map((item) => (
                <article className="admin-projects-stat" key={item.label}>
                  <span className={`admin-projects-stat-icon is-${item.tone}`}>
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

            <section className="admin-projects-filter" aria-label="Filter proyek">
              <label className="admin-projects-search">
                <input
                  type="search"
                  placeholder="Cari judul proyek / nama user..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>
              <label>
                <span>Status</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">Semua Status</option>
                  {filterOptions.statuses.map((status) => <option value={status} key={status}>{status}</option>)}
                </select>
              </label>
              <label>
                <span>Kategori</span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option value="">Semua Kategori</option>
                  {filterOptions.categories.map((category) => <option value={category} key={category}>{category}</option>)}
                </select>
              </label>
              <label>
                <span>Level</span>
                <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}>
                  <option value="">Semua Level</option>
                  {filterOptions.levels.map((level) => <option value={level} key={level}>{level}</option>)}
                </select>
              </label>
              <label>
                <span>Author / User</span>
                <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
                  <option value="">Semua User</option>
                  {filterOptions.owners.map((owner) => <option value={owner} key={owner}>{owner}</option>)}
                </select>
              </label>
              <label>
                <span>Tanggal Upload</span>
                <input
                  type="text"
                  placeholder="Contoh: 11 Agu atau 2026-08"
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                />
              </label>
              <button type="button" onClick={resetFilters}>Reset Filter</button>
            </section>

            {selectedProjectCount ? (
              <section className="admin-projects-bulk-actions" aria-label="Aksi proyek terpilih">
                <span>{selectedProjectCount} proyek dipilih</span>
                <div>
                  <button type="button" onClick={handleBulkPublish} disabled={isBulkActionBusy}>
                    Publish Terpilih
                  </button>
                  <button type="button" onClick={handleBulkDraft} disabled={isBulkActionBusy}>
                    Jadikan Draft
                  </button>
                  <button type="button" onClick={handleBulkArchive} disabled={isBulkActionBusy}>
                    Arsipkan
                  </button>
                  <button type="button" className="is-danger" onClick={handleBulkDelete} disabled={isBulkActionBusy}>
                    Hapus
                  </button>
                  <button type="button" onClick={() => setCheckedProjectKeys([])} disabled={isBulkActionBusy}>
                    Batal Pilih
                  </button>
                </div>
              </section>
            ) : null}

            <section className="admin-projects-table-card">
              <table className="admin-projects-table">
                <colgroup>
                  <col className="admin-projects-col-check" />
                  <col className="admin-projects-col-title" />
                  <col className="admin-projects-col-owner" />
                  <col className="admin-projects-col-category" />
                  <col className="admin-projects-col-level" />
                  <col className="admin-projects-col-summary" />
                  <col className="admin-projects-col-summary" />
                  <col className="admin-projects-col-summary" />
                  <col className="admin-projects-col-price" />
<<<<<<< HEAD
                  <col className="admin-projects-col-status" />
                  <col className="admin-projects-col-viewer" />
                  <col className="admin-projects-col-like" />
=======
                  <col className="admin-projects-col-summary" />
                  <col className="admin-projects-col-status" />
                  <col className="admin-projects-col-viewer" />
                  <col className="admin-projects-col-like" />
                  <col className="admin-projects-col-like" />
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
                  <col className="admin-projects-col-date" />
                  <col className="admin-projects-col-date" />
                  <col className="admin-projects-col-actions" />
                </colgroup>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Pilih semua proyek"
<<<<<<< HEAD
                        onChange={() => {}}
=======
                        checked={isCurrentPageChecked}
                        disabled={paginatedProjects.length === 0}
                        onClick={(event) => event.stopPropagation()}
                        onChange={handleToggleCurrentPageChecks}
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
                      />
                    </th>
                    <th>Judul Proyek</th>
                    <th>Pemilik / User</th>
                    <th>Kategori</th>
                    <th>Level</th>
                    <th>Alat / Komponen</th>
                    <th>Node</th>
                    <th>Langkah</th>
                    <th>Harga</th>
<<<<<<< HEAD
=======
                    <th>Terjual</th>
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
                    <th>Status</th>
                    <th>Viewers</th>
                    <th>Like</th>
                    <th>Save</th>
                    <th>Tgl Upload</th>
                    <th>Update Terakhir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
<<<<<<< HEAD
                      <td colSpan="15">Memuat data proyek...</td>
                    </tr>
                  ) : projectError ? (
                    <tr>
                      <td colSpan="15">{projectError}</td>
                    </tr>
                  ) : projects.length === 0 ? (
                    <tr>
                      <td colSpan="15">Belum ada proyek yang tersimpan.</td>
                    </tr>
                  ) : (
                    projects.map((project, index) => {
                      const ownerName =
                        project.ownerName ||
                        project.userName ||
                        project.user?.name ||
                        'User';

                      const ownerUsername =
                        project.ownerUsername ||
                        project.username ||
                        project.user?.username ||
                        '-';

                      const level = project.difficulty || '-';
                      const status = project.status || 'draft';
=======
                      <td colSpan="17">Memuat data proyek...</td>
                    </tr>
                  ) : projectError ? (
                    <tr>
                      <td colSpan="17">{projectError}</td>
                    </tr>
                  ) : filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan="17">Tidak ada proyek yang cocok dengan filter.</td>
                    </tr>
                  ) : (
                    paginatedProjects.map((project, index) => {
                      const ownerName =
                        getProjectOwnerName(project);

                      const ownerUsername =
                        getProjectOwnerUsername(project);

                      const level = project.difficulty || '-';
                      const status = project.status || 'draft';
                      const coverUrl = resolveProjectCoverUrl(project);
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
                      const tools = getProjectArray(project, 'tools');
                      const nodes = getProjectArray(project, 'nodes');
                      const steps = getProjectArray(project, 'steps');

                      return (
<<<<<<< HEAD
                        <tr key={project.id ?? `${project.title}-${index}`}>
=======
                        <tr
                          key={project.id ?? `${project.title}-${index}`}
                          onClick={() => handleSelectProject(project)}
                          style={{ cursor: 'pointer' }}
                        >
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Pilih ${project.title || 'proyek'}`}
<<<<<<< HEAD
                              onChange={() => {}}
=======
                              checked={checkedProjectKeys.includes(getProjectKey(project))}
                              onChange={() => handleToggleProjectCheck(project)}
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
                              onClick={(event) => event.stopPropagation()}
                            />
                          </td>

                          <td>
                            <div className="admin-projects-title-cell">
<<<<<<< HEAD
                              <ProjectThumbnail project={project} index={index} />
=======
                              {coverUrl ? (
                                <img className="admin-projects-thumb" src={coverUrl} alt={project.title || 'Cover proyek'} />
                              ) : (
                                <span className={`admin-projects-thumb is-${index % 5}`} />
                              )}
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
                              <span>
                                <b>{project.title || '-'}</b>
                                <small>{project.description || '-'}</small>
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="admin-projects-owner-cell">
<<<<<<< HEAD
                              <span className="admin-projects-avatar" />
=======
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
                              <span>
                                <b>{ownerName}</b>
                                <small>{ownerUsername}</small>
                              </span>
                            </div>
                          </td>

                          <td>
                            <ProjectBadge>{project.category || '-'}</ProjectBadge>
                          </td>

                          <td>
                            <ProjectBadge>{level}</ProjectBadge>
                          </td>

                          <td>
                            <ProjectTableSummary items={tools} />
                          </td>

                          <td>
                            <ProjectTableSummary items={nodes} />
                          </td>

                          <td>
                            <ProjectTableSummary
                              items={steps}
                              labelGetter={getProjectStepLabel}
                            />
                          </td>

                          <td>
                            <span className="admin-projects-price">
                              {formatProjectPrice(project)}
                            </span>
                          </td>

<<<<<<< HEAD
=======
                          <td>{formatProjectNumber(salesByProject.get(String(project.id))?.length || 0)}</td>

>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
                          <td>
                            <ProjectBadge>{status}</ProjectBadge>
                          </td>

<<<<<<< HEAD
                          <td>{project.viewer ?? 0}</td>

                          <td>
                            {`${project.likes ?? 0} / ${project.saves ?? 0}`}
                          </td>
=======
                          <td>{formatProjectNumber(project.viewer ?? project.viewers)}</td>

                          <td>{formatProjectNumber(project.likes)}</td>

                          <td>{formatProjectNumber(project.saves)}</td>
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6

                          <td><ProjectDateTime value={project.createdAt} /></td>
                          <td><ProjectDateTime value={project.updatedAt} /></td>

                          <td>
<<<<<<< HEAD
                            <div
                              className="admin-projects-actions"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <ProjectAction
                                label={`Lihat ${project.title}`}
                                active
                                disabled={busyProjectId === project.id}
                                onClick={() => handleViewProject(project)}
                              >
                                <img src={eyeIcon} alt="" />
                                <span>Lihat</span>
                              </ProjectAction>

                              <ProjectAction
                                label={`Edit ${project.title}`}
                                disabled={busyProjectId === project.id}
                                onClick={() => handleEditProject(project)}
                              >
                                Edit
                              </ProjectAction>

                              <ProjectAction
                                label={`Hapus ${project.title}`}
                                disabled={busyProjectId === project.id}
                                onClick={() => handleDeleteProject(project)}
                              >
                                Hapus
                              </ProjectAction>
                            </div>
=======
                            <AdminActionDropdown
                              label={`Buka aksi untuk ${project.title || 'proyek'}`}
                              items={[
                                {
                                  label: 'Lihat',
                                  icon: <img src={eyeIcon} alt="" />,
                                  disabled: busyProjectId === project.id,
                                  onSelect: () => handleViewProject(project),
                                },
                                {
                                  label: 'Edit',
                                  disabled: busyProjectId === project.id,
                                  onSelect: () => handleEditProject(project),
                                },
                                {
                                  label: 'Hapus',
                                  tone: 'danger',
                                  disabled: busyProjectId === project.id,
                                  onSelect: () => handleDeleteProject(project),
                                },
                              ]}
                            />
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="admin-projects-pagination">
<<<<<<< HEAD
                <span>Menampilkan {projects.length} proyek</span>
=======
                <span>Menampilkan {paginatedProjects.length} dari {filteredProjects.length} proyek</span>
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
                <div>
                  <button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>&lt;</button>
                  <button type="button" className="is-active">{currentPage}</button>
                  <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>&gt;</button>
                </div>
                <select value={String(perPage)} onChange={(event) => setPerPage(Number(event.target.value))}>
                  <option value="10">10 / halaman</option>
                  <option value="25">25 / halaman</option>
                  <option value="50">50 / halaman</option>
                </select>
              </div>
            </section>

            <section className="admin-projects-bottom">
              <article className="admin-projects-panel">
                <div className="admin-projects-panel-head">
                  <h2>Proyek Menunggu Review</h2>
                  <span>{formatProjectNumber(reviewProjects.length)} item</span>
                </div>
                {reviewProjects.length ? reviewProjects.map((project, index) => (
                  <p key={project.id ?? project.title}>
                    <span className={`admin-projects-mini-thumb is-${index}`} />
                    <b>{project.title || '-'}</b>
                    <small>{getProjectOwnerName(project)}</small>
                    <time>{formatProjectDateTime(project.updatedAt || project.createdAt).date}</time>
                  </p>
                )) : (
                  <p><b>Tidak ada proyek menunggu review.</b><time>-</time></p>
                )}
              </article>

              <article className="admin-projects-panel">
                <div className="admin-projects-panel-head">
                  <h2>Proyek Populer <small>(30 Hari Terakhir)</small></h2>
                  <span>{formatProjectNumber(popularProjects.length)} item</span>
                </div>
                <table>
                  <thead><tr><th>#</th><th>Judul</th><th>Viewers</th><th>Like</th><th>Save</th></tr></thead>
                  <tbody>
                    {popularProjects.length ? popularProjects.map((project, index) => (
                      <tr key={project.id ?? project.title}>
                        <td>{index + 1}</td>
                        <td>{project.title || '-'}</td>
                        <td>{formatProjectNumber(project.viewer ?? project.viewers)}</td>
                        <td>{formatProjectNumber(project.likes)}</td>
                        <td>{formatProjectNumber(project.saves)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5">Belum ada proyek.</td></tr>
                    )}
                  </tbody>
                </table>
              </article>

              <article className="admin-projects-panel admin-projects-problems">
                <div className="admin-projects-panel-head">
                  <h2>Proyek Bermasalah</h2>
                  <span>{formatProjectNumber(problemProjects.length)} kategori</span>
                </div>
                {problemProjects.length ? problemProjects.map((item) => (
                  <p key={item.label}><span>{item.label}</span><strong>{formatProjectNumber(item.count)}</strong></p>
                )) : (
                  <p><span>Tidak ada masalah terdeteksi.</span><strong>0</strong></p>
                )}
              </article>

              <article className="admin-projects-panel admin-projects-activity">
                <div className="admin-projects-panel-head">
                  <h2>Aktivitas Terbaru</h2>
                  <span>{formatProjectNumber(activityItems.length)} item</span>
                </div>
                {activityItems.length ? activityItems.map((item) => (
                  <p key={item.id}>
                    <span className={`admin-projects-dot is-${item.tone}`} />
                    <b>Proyek "{item.title}" diupdate</b>
                    <time>{formatProjectDateTime(item.time).date}</time>
                  </p>
                )) : (
                  <p><span className="admin-projects-dot" /><b>Belum ada aktivitas proyek.</b><time>-</time></p>
                )}
              </article>
            </section>

<<<<<<< HEAD
            <section className="admin-projects-quick">
              <h2>Aksi Cepat</h2>
              <div>
                {['Buat Proyek Unggulan Baru', 'Export Data Proyek', 'Cek Link Rusak', 'Publish Proyek Terpilih', 'Bersihkan Draft Lama', 'Reorder Featured Project'].map((item) => (
                  <button type="button" key={item}>{item}</button>
                ))}
              </div>
            </section>
=======
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
              </>
            )}
          </section>

<<<<<<< HEAD
          {selectedProject && !editingProject && (
            <div
              className="admin-projects-detail-modal"
              role="presentation"
              onMouseDown={() => setSelectedProject(null)}
            >
              <aside
                className="admin-projects-detail"
                role="dialog"
                aria-modal="true"
                aria-label="Detail proyek"
                onMouseDown={(event) => event.stopPropagation()}
              >
              <div className="admin-projects-detail-head">
                <h2>Detail Proyek</h2>
                <button type="button" aria-label="Tutup detail" onClick={() => setSelectedProject(null)}>x</button>
              </div>

              <>
                <div className="admin-projects-detail-profile">
                  <span className="admin-projects-detail-image" />
                  <div>
                    <h3>{selectedProject.title || '-'}</h3>
                    <ProjectBadge>{selectedProject.status || 'draft'}</ProjectBadge>
                    <p>
                      <span className="admin-projects-avatar" />
                      {selectedProject.ownerName || selectedProject.userName || selectedProject.user?.name || 'User'}
                      <br />
                      <small>
                        {selectedProject.ownerUsername ||
                          selectedProject.username ||
                          selectedProject.user?.username ||
                          '-'}
                      </small>
                    </p>
                  </div>
                </div>

                <dl>
                  <dt>Kategori</dt>
                  <dd>{selectedProject.category || '-'}</dd>

                  <dt>Level</dt>
                  <dd>{selectedProject.difficulty || '-'}</dd>

                  <dt>Tanggal Upload</dt>
                  <dd>
                    {selectedProject.createdAt
                      ? new Date(selectedProject.createdAt).toLocaleString('id-ID')
                      : '-'}
                  </dd>

                  <dt>Update Terakhir</dt>
                  <dd>
                    {selectedProject.updatedAt
                      ? new Date(selectedProject.updatedAt).toLocaleString('id-ID')
                      : '-'}
                  </dd>

                  <dt>Deskripsi Singkat</dt>
                  <dd>{selectedProject.description || '-'}</dd>

                  <dt>Harga</dt>
                  <dd>{formatProjectPrice(selectedProject)}</dd>
                </dl>

                <section className="admin-projects-components">
                  <h3>Alat dan Komponen</h3>
                  <div>
                    {getProjectArray(selectedProject, 'tools').length > 0 ? (
                      getProjectArray(selectedProject, 'tools').map((tool, index) => (
                        <span key={`${tool.name || 'tool'}-${index}`}>
                          {getProjectItemLabel(tool)}
                        </span>
                      ))
                    ) : (
                      <span>Belum ada komponen</span>
                    )}
                  </div>
                </section>

                <section className="admin-projects-components">
                  <h3>Node yang Digunakan</h3>
                  <div>
                    {getProjectArray(selectedProject, 'nodes').length > 0 ? (
                      getProjectArray(selectedProject, 'nodes').map((node, index) => (
                        <span key={`${getProjectItemLabel(node, 'node')}-${index}`}>
                          {getProjectItemLabel(node)}
                        </span>
                      ))
                    ) : (
                      <span>Belum ada node</span>
                    )}
                  </div>
                </section>

                <section className="admin-projects-history">
                  <h3>Langkah-langkah</h3>
                  {getProjectArray(selectedProject, 'steps').length > 0 ? (
                    getProjectArray(selectedProject, 'steps').map((step, index) => (
                      <p key={`${getProjectStepLabel(step, index)}-${index}`}>
                        <b>{index + 1}. {getProjectStepLabel(step, index)}</b>
                      </p>
                    ))
                  ) : (
                    <p>Belum ada langkah pengerjaan.</p>
                  )}
                </section>

                <section className="admin-projects-detail-stats">
                  <article>
                    <span>Viewer</span>
                    <strong>{selectedProject.viewer ?? 0}</strong>
                  </article>

                  <article>
                    <span>Like</span>
                    <strong>{selectedProject.likes ?? 0}</strong>
                  </article>

                  <article>
                    <span>Save</span>
                    <strong>{selectedProject.saves ?? 0}</strong>
                  </article>
                </section>

                <div className="admin-projects-detail-actions">
                  <button type="button" className="is-blue">Preview Proyek</button>
                  <button type="button" className="is-green">Publish / Unpublish</button>
                  <button type="button" className="is-purple">Minta Revisi</button>
                  <button type="button" className="is-orange">Tandai Featured</button>
                  <button type="button">Arsipkan</button>
                </div>
              </>
=======
          {selectedProject && !editingProject && !isUploadFormOpen && (
            <div className="admin-projects-detail-overlay" role="presentation" onClick={() => setSelectedProject(null)}>
            <aside className="admin-projects-detail" aria-label="Detail proyek" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
              <div className="admin-projects-detail-head">
                <span className="admin-projects-detail-icon" aria-hidden="true">
                  <img src={galleryIcon} alt="" />
                </span>
                <span>
                  <h2>Detail Proyek</h2>
                  <p>Ringkasan data, aset, dan status proyek.</p>
                </span>
                <button type="button" aria-label="Tutup detail" onClick={() => setSelectedProject(null)}>x</button>
              </div>

              <div className="admin-projects-detail-body">
                <section className="admin-projects-wire-hero">
                  <div className="admin-projects-wire-media">
                    {resolveProjectCoverUrl(selectedProject) ? (
                      <img
                        src={resolveProjectCoverUrl(selectedProject)}
                        alt={selectedProject.title || 'Cover proyek'}
                      />
                    ) : (
                      <AdminProjectImagePlaceholder />
                    )}
                  </div>

                  <div className="admin-projects-wire-summary">
                    <div className="admin-projects-wire-tags">
                      {(getProjectTags(selectedProject).length ? getProjectTags(selectedProject) : ['Draft']).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                    <h3>{selectedProject.title || '-'}</h3>
                    <p>{getProjectDescription(selectedProject)}</p>
                    <div className="admin-projects-wire-owner">
                      <span>
                        <small>Pemilik Proyek</small>
                        <b>{getProjectOwnerName(selectedProject)}</b>
                        <small>{getProjectOwnerUsername(selectedProject)}</small>
                      </span>
                      <ProjectBadge>{selectedProject.status || 'draft'}</ProjectBadge>
                    </div>
                  </div>
                </section>

                <section className="admin-projects-wire-stats" aria-label="Ringkasan proyek">
                  <AdminProjectStatCard icon="01" label="Tingkat" value={selectedProject.difficulty || '-'} />
                  <AdminProjectStatCard icon="02" label="Node" value={`${getProjectArray(selectedProject, 'nodes').length} Node`} />
                  <AdminProjectStatCard icon="03" label="Platform" value={getProjectPlatform(selectedProject)} />
                  <AdminProjectStatCard icon="04" label="Kategori" value={selectedProject.category || '-'} />
                </section>

                <section className="admin-projects-detail-meta" aria-label="Metadata proyek">
                  <p><small>Harga</small><b>{formatProjectPrice(selectedProject)}</b></p>
                  <p><small>Viewer</small><b>{formatProjectNumber(selectedProject.viewer ?? 0)}</b></p>
                  <p><small>Like / Save</small><b>{`${formatProjectNumber(selectedProject.likes ?? 0)} / ${formatProjectNumber(selectedProject.saves ?? 0)}`}</b></p>
                  <p><small>Tanggal Upload</small><b>{formatProjectDateTime(selectedProject.createdAt).date}</b></p>
                  <p><small>Update Terakhir</small><b>{formatProjectDateTime(selectedProject.updatedAt).date}</b></p>
                </section>

                <section className="admin-projects-wire-grid">
                  <article className="admin-projects-wire-card">
                    <h3>Alat dan Komponen</h3>
                    <div className="admin-projects-wire-list">
                      {(getProjectArray(selectedProject, 'tools').length ? getProjectArray(selectedProject, 'tools') : ['Belum ada komponen']).slice(0, 6).map((tool, index) => (
                        <p key={`${getProjectItemLabel(tool, 'tool')}-${index}`}>
                          {getProjectItemImageUrl(tool) ? (
                            <img src={getProjectItemImageUrl(tool)} alt="" aria-hidden="true" />
                          ) : (
                            <span aria-hidden="true" />
                          )}
                          <b>{getProjectItemLabel(tool)}</b>
                          <small>{getProjectItemQuantity(tool) || (typeof tool === 'string' ? '-' : '1 pcs')}</small>
                        </p>
                      ))}
                    </div>
                  </article>

                  <article className="admin-projects-wire-card">
                    <h3>Node ArduFlow yang Digunakan</h3>
                    <div className="admin-projects-wire-node-list">
                      {(getProjectArray(selectedProject, 'nodes').length ? getProjectArray(selectedProject, 'nodes') : ['Belum ada node']).slice(0, 5).map((node, index) => (
                        <p key={`${getProjectItemLabel(node, 'node')}-${index}`}>
                          <span aria-hidden="true"><img src={zapIcon} alt="" /></span>
                          <b>{getProjectItemLabel(node)}</b>
                          <small>{getProjectItemDescription(node, 'Node pendukung proyek ArduFlow.')}</small>
                        </p>
                      ))}
                    </div>
                  </article>
                </section>

                <section className="admin-projects-wire-card">
                  <h3>Gambar Rangkaian</h3>
                  {getProjectCircuitImageUrl(selectedProject) ? (
                    <img
                      className="admin-projects-wire-circuit-image"
                      src={getProjectCircuitImageUrl(selectedProject)}
                      alt={`Gambar rangkaian ${selectedProject.title || 'proyek'}`}
                    />
                  ) : (
                    <AdminProjectCircuitPreview tools={getProjectArray(selectedProject, 'tools')} />
                  )}
                </section>

                <section className="admin-projects-wire-card">
                  <h3>Langkah Pengerjaan</h3>
                  <div className="admin-projects-wire-steps">
                    {(getProjectArray(selectedProject, 'steps').length ? getProjectArray(selectedProject, 'steps') : ['Belum ada langkah pengerjaan']).slice(0, 5).map((step, index) => (
                      <AdminProjectStepCard key={`${getProjectStepLabel(step, index)}-${index}`} step={step} index={index} />
                    ))}
                  </div>
                  <div className="admin-projects-wire-note">
                    <img src={checkIcon} alt="" />
                    <span>
                      Harga {formatProjectPrice(selectedProject)}. Diunggah {formatProjectDateTime(selectedProject.createdAt).date}, terakhir diperbarui {formatProjectDateTime(selectedProject.updatedAt).date}.
                    </span>
                  </div>
                </section>
              </div>

                <div className="admin-projects-detail-actions" aria-label="Aksi detail proyek">
                  <button type="button" className="is-outline" onClick={() => window.open(`/project/detail?id=${encodeURIComponent(selectedProject.id)}`, '_blank', 'noopener,noreferrer')}>
                    Buka Halaman Detail
                  </button>
                  <button type="button" className="is-blue" onClick={() => handlePreviewProject(selectedProject)}>
                    {getProjectFileUrl(selectedProject) ? 'Unduh File Proyek' : 'Preview Proyek'}
                  </button>
                  <button type="button" className="is-green" disabled={busyProjectId === selectedProject.id} onClick={() => handleTogglePublish(selectedProject)}>
                    {isProjectStatus(selectedProject, ['published', 'publish']) ? 'Unpublish' : 'Publish'}
                  </button>
                  <button type="button" className="is-purple" disabled={busyProjectId === selectedProject.id} onClick={() => handleRequestRevision(selectedProject)}>
                    Minta Revisi
                  </button>
                  <button type="button" className="is-orange" disabled={busyProjectId === selectedProject.id} onClick={() => handleToggleFeatured(selectedProject)}>
                    {selectedProject.featured || selectedProject.isFeatured || selectedProject.payload?.featured ? 'Hapus Featured' : 'Tandai Featured'}
                  </button>
                  <button type="button" disabled={busyProjectId === selectedProject.id} onClick={() => handleArchiveProject(selectedProject)}>
                    Arsipkan
                  </button>
                </div>
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
            </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}