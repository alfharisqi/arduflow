import { useEffect, useMemo, useState } from 'react';
import { AdminNotificationButton } from './AdminChrome.jsx';
import { AdminSidebar } from './AdminSidebar.jsx';
import { AdminActionDropdown } from './AdminActionDropdown.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import bookIcon from '../../assets/icons/icon-book-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import fileIcon from '../../assets/icons/icon-file-text-1.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import zapIcon from '../../assets/icons/icon-zap-1.svg';
import { apiEndpoint } from '../../services/apiEndpoints.js';

const TUTORIAL_API_URL = (
  apiEndpoint(import.meta.env.VITE_TUTORIAL_API_URL, '/api/')
).replace(/\/+$/, '');

const ARTICLE_API_URL = `${TUTORIAL_API_URL}/materi-api.php`;

const TUTORIAL_API_ORIGIN = (() => {
  try {
    return new URL(ARTICLE_API_URL).origin;
  } catch {
    return '';
  }
})();

const tutorialImageModules = import.meta.glob('../../assets/images/*', {
  eager: true,
  import: 'default',
  query: '?url',
});

const tutorialImageMap = Object.entries(tutorialImageModules).reduce(
  (images, [path, url]) => {
    const fileName = path.split('/').pop() || '';
    const key = fileName
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    images[key] = url;
    images[fileName.toLowerCase()] = url;

    return images;
  },
  {}
);

function AdminTutorialTopbar() {
  return (
    <header className="admin-dashboard-topbar">
      <label className="admin-dashboard-search">
        <span aria-hidden="true" />
        <input
          type="search"
          placeholder="Cari tutorial / materi"
          aria-label="Cari tutorial atau materi"
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

function TutorialBadge({ children }) {
  const slug = String(children || '-')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-');

  return (
    <span className={`admin-tutorial-badge admin-tutorial-badge--${slug}`}>
      {children || '-'}
    </span>
  );
}

function TutorialAction({ label, children, onClick, tone = '' }) {
  return (
    <button
      className={`admin-tutorial-action${
        tone ? ` admin-tutorial-action--${tone}` : ''
      }`}
      type="button"
      aria-label={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function TutorialThumbnail({ src, index = 0, large = false }) {
  const [hasError, setHasError] = useState(false);
  const fallbackClassName = large
    ? 'admin-tutorial-detail-image'
    : `admin-tutorial-thumb is-${index % 4}`;

  if (!src || hasError) {
    return <span className={fallbackClassName} />;
  }

  return (
    <img
      className={large ? 'admin-tutorial-detail-image' : 'admin-tutorial-thumb'}
      src={src}
      alt=""
      onError={() => setHasError(true)}
    />
  );
}

function normalizeStatus(value) {
  const status = String(value || 'draft').toLowerCase();

  if (status === 'published') {
    return 'Published';
  }

  if (status === 'pending_review') {
    return 'Pending Review';
  }

  if (status === 'archived') {
    return 'Archived';
  }

  return 'Draft';
}

function getTutorialKey(tutorial) {
  const key = tutorial?.id ?? tutorial?.slug ?? tutorial?.title;
  return key === undefined || key === null ? '' : String(key);
}

function toApiStatus(value) {
  const status = String(value || 'draft').trim().toLowerCase();

  if (status === 'published') {
    return 'published';
  }

  if (status === 'pending review' || status === 'pending_review') {
    return 'pending_review';
  }

  if (status === 'archived') {
    return 'archived';
  }

  return 'draft';
}

function buildTutorialUpdatePayload(tutorial, nextStatus) {
  const apiStatus = toApiStatus(nextStatus ?? tutorial.status);
  const pageSettings = tutorial.page_settings || {};
  const accessSettings = tutorial.access_settings || {};
  const cta = tutorial.cta || {};
  const slides = Array.isArray(tutorial.slides) ? tutorial.slides : [];
  const fallbackContent =
    tutorial.full_description ||
    tutorial.fullDescription ||
    tutorial.short_description ||
    tutorial.description ||
    '-';

  return {
    title: tutorial.title || 'Tanpa Judul',
    slug: tutorial.slug || `tutorial-${tutorial.id || Date.now()}`,
    category: tutorial.category && tutorial.category !== '-' ? tutorial.category : 'Umum',
    display_order: Number(tutorial.display_order || 1),
    descriptions: {
      short_description: tutorial.short_description || tutorial.description || '-',
      full_description: tutorial.full_description || tutorial.fullDescription || fallbackContent,
    },
    learning_information: {
      difficulty_level: tutorial.difficulty_level || tutorial.level || '',
      estimated_time: tutorial.estimated_time || tutorial.estimatedTime || '',
    },
    page_settings: {
      ...pageSettings,
      page_order: Number(tutorial.page_order || pageSettings.page_order || 1),
      status: apiStatus,
      active: tutorial.active ?? pageSettings.active ?? true,
      show_on_page: tutorial.show_on_page ?? pageSettings.show_on_page ?? true,
      featured: tutorial.featured ?? pageSettings.featured ?? false,
      comments: tutorial.comments ?? pageSettings.comments ?? true,
    },
    access_settings: {
      user_level: accessSettings.user_level || tutorial.user_level || 'semua_pengguna',
      access_requirement:
        accessSettings.access_requirement ?? tutorial.access_requirement ?? '',
      prerequisite: accessSettings.prerequisite ?? tutorial.prerequisite ?? '',
    },
    cta: {
      text: cta.text ?? tutorial.cta_text ?? '',
      target_link: cta.target_link ?? tutorial.cta_target_link ?? '',
      url_slug: cta.url_slug ?? tutorial.cta_url_slug ?? '',
      publish_schedule: cta.publish_schedule ?? tutorial.publish_schedule ?? '',
    },
    card_image: tutorial.card_image_name
      ? {
          file_name: tutorial.card_image_name,
          file_type: tutorial.card_image_type || null,
          file_size: tutorial.card_image_size || null,
        }
      : null,
    slides: slides.length
      ? slides.map((slide, index) => ({
          order: Number(slide.order || slide.slide_order || index + 1),
          title: slide.title || `Halaman ${index + 1}`,
          content_type: slide.content_type || 'text',
          body_text: slide.body_text ?? slide.content ?? '',
          content: slide.content ?? slide.body_text ?? '',
          estimated_time: slide.estimated_time || '',
          status: slide.status || apiStatus,
          image: slide.image || null,
          image_name: slide.image_name || slide.image?.file_name || null,
          image_type: slide.image_type || slide.image?.file_type || null,
          image_size: slide.image_size || slide.image?.file_size || null,
          video_url: slide.video_url || '',
        }))
      : [
          {
            order: 1,
            title: tutorial.title || 'Materi',
            content_type: 'text',
            body_text: fallbackContent,
            content: fallbackContent,
            estimated_time: tutorial.estimated_time || '',
            status: apiStatus,
          },
        ],
  };
}

function formatDate(value, includeTime = false) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
        }
      : {}),
  }).format(date);
}

function parseImageValue(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'object') {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeImageKey(value) {
  return String(value || '')
    .split(/[\\/]/)
    .pop()
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function resolvePublicImageUrl(value) {
  const candidate = String(value || '').trim();

  if (!candidate) {
    return '';
  }

  if (/^(data:image\/|https?:\/\/|blob:)/i.test(candidate)) {
    return candidate;
  }

  if (candidate.startsWith('/') && TUTORIAL_API_ORIGIN) {
    return `${TUTORIAL_API_ORIGIN}${candidate}`;
  }

  if (
    /^storage\/uploads\//i.test(candidate) &&
    TUTORIAL_API_ORIGIN
  ) {
    return `${TUTORIAL_API_ORIGIN}/${candidate}`;
  }

  return '';
}

function resolveTutorialImage(item) {
  const imageData = parseImageValue(
    item.card_image ||
      item.cardImage ||
      item.thumbnail ||
      item.image ||
      item.card_image_name
  );

  const candidates = [];

  if (typeof imageData === 'string') {
    candidates.push(imageData);
  }

  if (imageData && typeof imageData === 'object') {
    candidates.push(
      imageData.data_url,
      imageData.dataUrl,
      imageData.url,
      imageData.src,
      imageData.path,
      imageData.file_name,
      imageData.fileName,
      imageData.name
    );
  }

  candidates.push(
    item.card_image_url,
    item.image_url,
    item.thumbnail_url,
    item.card_image_name,
    item.title
  );

  for (const candidate of candidates.filter(Boolean)) {
    const publicUrl = resolvePublicImageUrl(candidate);

    if (publicUrl) {
      return publicUrl;
    }

    const key = normalizeImageKey(candidate);
    const fileName = String(candidate).split(/[\\/]/).pop().toLowerCase();

    if (tutorialImageMap[fileName]) {
      return tutorialImageMap[fileName];
    }

    if (tutorialImageMap[key]) {
      return tutorialImageMap[key];
    }
  }

  return '';
}


function getYoutubeEmbedUrl(value) {
  const url = String(value || '').trim();

  if (!url) {
    return '';
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname === 'youtu.be') {
      const videoId = parsedUrl.pathname.replace(/^\/+/, '');

      return videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : '';
    }

    if (parsedUrl.hostname.includes('youtube.com')) {
      const videoId = parsedUrl.searchParams.get('v');

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      if (parsedUrl.pathname.startsWith('/embed/')) {
        return url;
      }
    }
  } catch {
    return '';
  }

  return '';
}

function isDirectVideoUrl(value) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(String(value || ''));
}

function isM3u8Url(value) {
  return /\.m3u8(\?.*)?$/i.test(String(value || ''));
}

function normalizeTutorial(item) {
  const status = normalizeStatus(item.status);
  const imageSrc = resolveTutorialImage(item);

  return {
    ...item,
    id: item.id,
    title: item.title || 'Tanpa Judul',
    slug: item.slug || '',
    description: item.short_description || '-',
    fullDescription: item.full_description || '-',
    category: item.category || '-',
    level: item.difficulty_level || '-',
    estimatedTime: item.estimated_time || '-',
    status,
    author: 'Admin',
    viewer: 0,
    completed: 0,
    imageSrc,
    slides: Array.isArray(item.slides) ? item.slides : [],
    totalSlides: Number(item.total_slides || item.slides?.length || 0),
    createdAtRaw: item.created_at || null,
    updatedAtRaw: item.updated_at || item.created_at || null,
    createdAt: formatDate(item.created_at),
    publishedAt:
      status === 'Published' ? formatDate(item.created_at) : '-',
    updatedAt: formatDate(item.updated_at || item.created_at),
    updatedAtWithTime: formatDate(
      item.updated_at || item.created_at,
      true
    ),
  };
}

export function AdminTutorial() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialAdminSidebarCollapsed
  );

  const [tutorials, setTutorials] = useState([]);
  const [selectedTutorial, setSelectedTutorial] = useState(null);
  const [checkedTutorialKeys, setCheckedTutorialKeys] = useState([]);
  const [busyTutorialId, setBusyTutorialId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistAdminSidebarCollapsed(nextValue);
      return nextValue;
    });
  };

  const handleEditTutorial = (tutorial) => {
    if (!tutorial?.id) {
      return;
    }

    window.location.href = `/admin/tutorial/edit?id=${encodeURIComponent(
      tutorial.id
    )}`;
  };

  const parseApiResponse = async (response) => {
    const responseText = await response.text();
    let result = {};

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      throw new Error(
        `Response API bukan JSON yang valid. Isi response: ${responseText.slice(
          0,
          250
        )}`
      );
    }

    if (!response.ok || result.success === false) {
      throw new Error(
        result.message || `API mengembalikan HTTP ${response.status}.`
      );
    }

    return result;
  };

  const handleDeleteTutorial = async (tutorial) => {
    if (!tutorial?.id) {
      return;
    }

    const isConfirmed = window.confirm(
      `Hapus materi "${tutorial.title}"? Data yang sudah dihapus tidak bisa dikembalikan.`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${ARTICLE_API_URL}?id=${encodeURIComponent(
          tutorial.id
        )}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
          },
        }
      );

      const result = await parseApiResponse(response);

      setTutorials((current) =>
        current.filter((item) => String(item.id) !== String(tutorial.id))
      );

      setSelectedTutorial((current) =>
        current && String(current.id) === String(tutorial.id) ? null : current
      );
      setCheckedTutorialKeys((current) =>
        current.filter((key) => key !== getTutorialKey(tutorial))
      );

      setActionError('');
      setActionMessage(result.message || 'Materi berhasil dihapus.');
    } catch (error) {
      console.error('Gagal menghapus materi tutorial:', error);
      setActionMessage('');
      setActionError(error.message || 'Materi gagal dihapus dari database.');
    }
  };

  const fetchTutorials = async () => {
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
          `Response API bukan JSON yang valid. Isi response: ${responseText.slice(
            0,
            250
          )}`
        );
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || `API mengembalikan HTTP ${response.status}.`
        );
      }

      const rows = Array.isArray(result.data) ? result.data : [];
      const normalizedRows = rows.map(normalizeTutorial);

      setTutorials(normalizedRows);
      setCheckedTutorialKeys((current) => {
        const availableKeys = new Set(normalizedRows.map(getTutorialKey));
        return current.filter((key) => availableKeys.has(key));
      });

      setSelectedTutorial((current) => {
        if (!normalizedRows.length) {
          return null;
        }

        if (!current) {
          return null;
        }

        return normalizedRows.find((item) => item.id === current.id) || null;
      });

      console.group('DEBUG ADMIN TUTORIAL SQLITE');
      console.log('Method:', 'GET');
      console.log('Endpoint:', ARTICLE_API_URL);
      console.log('Response:', result);
      console.log('Data tabel:', normalizedRows);
      console.groupEnd();
    } catch (error) {
      console.error('Gagal mengambil data tutorial SQLite:', error);
      setTutorials([]);
      setSelectedTutorial(null);
      setCheckedTutorialKeys([]);
      setLoadError(
        error.message ||
          'Data tutorial tidak dapat diambil dari API SQLite.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorials();
  }, []);

  const tutorialStats = useMemo(() => {
    const total = tutorials.length;
    const published = tutorials.filter(
      (item) => item.status === 'Published'
    ).length;
    const draft = tutorials.filter(
      (item) => item.status === 'Draft'
    ).length;
    const pendingReview = tutorials.filter(
      (item) => item.status === 'Pending Review'
    ).length;

    const publishedPercent = total
      ? ((published / total) * 100).toFixed(1)
      : '0.0';

    const draftPercent = total
      ? ((draft / total) * 100).toFixed(1)
      : '0.0';

    return [
      {
        label: 'Total Tutorial',
        value: String(total),
        note: 'Data dari SQLite',
        icon: bookIcon,
        tone: 'blue',
      },
      {
        label: 'Tutorial Published',
        value: String(published),
        note: `${publishedPercent}% dari total`,
        icon: checkIcon,
        tone: 'green',
      },
      {
        label: 'Draft Belum Publish',
        value: String(draft),
        note: `${draftPercent}% dari total`,
        icon: fileIcon,
        tone: 'orange',
      },
      {
        label: 'Total Viewer / Pembaca',
        value: '0',
        note: 'Field viewer belum tersedia',
        icon: usersIcon,
        tone: 'blue',
      },
      {
        label: 'Materi Paling Populer',
        value: 'Belum tersedia',
        note: 'Butuh data viewer',
        icon: zapIcon,
        tone: 'purple',
      },
      {
        label: 'Materi Perlu Revisi',
        value: String(pendingReview),
        note: 'Status Pending Review',
        icon: clockIcon,
        tone: 'red',
      },
    ];
  }, [tutorials]);

  const categoryOptions = useMemo(() => {
    return [...new Set(tutorials.map((item) => item.category).filter(Boolean))];
  }, [tutorials]);

  const levelOptions = useMemo(() => {
    return [...new Set(tutorials.map((item) => item.level).filter(Boolean))];
  }, [tutorials]);

  const filteredTutorials = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return tutorials.filter((item) => {
      const matchesSearch =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword) ||
        item.slug.toLowerCase().includes(keyword);

      const matchesStatus =
        !statusFilter || item.status === statusFilter;

      const matchesCategory =
        !categoryFilter || item.category === categoryFilter;

      const matchesLevel = !levelFilter || item.level === levelFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesLevel
      );
    });
  }, [
    tutorials,
    searchTerm,
    statusFilter,
    categoryFilter,
    levelFilter,
  ]);

  const filteredTutorialKeys = useMemo(
    () => filteredTutorials.map(getTutorialKey).filter(Boolean),
    [filteredTutorials]
  );

  const isFilteredTutorialsChecked =
    filteredTutorialKeys.length > 0 &&
    filteredTutorialKeys.every((key) => checkedTutorialKeys.includes(key));

  const selectedTutorials = useMemo(
    () =>
      tutorials.filter((tutorial) =>
        checkedTutorialKeys.includes(getTutorialKey(tutorial))
      ),
    [tutorials, checkedTutorialKeys]
  );

  const selectedTutorialCount = selectedTutorials.length;
  const isBulkActionBusy = busyTutorialId === 'bulk';

  const latestTutorials = useMemo(() => {
    return [...tutorials]
      .sort((a, b) => {
        const dateA = new Date(a.createdAtRaw || 0).getTime();
        const dateB = new Date(b.createdAtRaw || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [tutorials]);

  const draftTutorials = useMemo(() => {
    return tutorials
      .filter((item) => item.status === 'Draft')
      .slice(0, 5);
  }, [tutorials]);

  const issueItems = useMemo(() => {
    const thumbnailEmpty = tutorials.filter(
      (item) => !item.card_image_name
    ).length;

    const categoryEmpty = tutorials.filter(
      (item) => !item.category || item.category === '-'
    ).length;

    const shortContent = tutorials.filter(
      (item) => String(item.full_description || '').trim().length < 300
    ).length;

    return [
      ['Thumbnail kosong', thumbnailEmpty],
      ['Link rusak', 0],
      ['Belum punya kategori', categoryEmpty],
      ['Konten terlalu pendek (< 300 kata)', shortContent],
      ['Belum ada quiz / praktik', 0],
    ];
  }, [tutorials]);

  const activityItems = useMemo(() => {
    return [...tutorials]
      .sort((a, b) => {
        const dateA = new Date(a.updatedAtRaw || 0).getTime();
        const dateB = new Date(b.updatedAtRaw || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5)
      .map((item) => [
        `Tutorial "${item.title}" ${
          item.status === 'Published' ? 'dipublish / diupdate' : 'disimpan'
        }`,
        item.updatedAtWithTime,
        item.status === 'Published'
          ? 'green'
          : item.status === 'Pending Review'
          ? 'purple'
          : 'orange',
      ]);
  }, [tutorials]);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCategoryFilter('');
    setLevelFilter('');
  };

  const handleToggleTutorialCheck = (tutorial) => {
    const tutorialKey = getTutorialKey(tutorial);

    if (!tutorialKey) {
      return;
    }

    setCheckedTutorialKeys((current) =>
      current.includes(tutorialKey)
        ? current.filter((key) => key !== tutorialKey)
        : [...current, tutorialKey]
    );
  };

  const handleToggleFilteredTutorialChecks = () => {
    if (!filteredTutorialKeys.length) {
      return;
    }

    setCheckedTutorialKeys((current) => {
      const currentSet = new Set(current);
      const shouldUncheck = filteredTutorialKeys.every((key) =>
        currentSet.has(key)
      );

      if (shouldUncheck) {
        return current.filter((key) => !filteredTutorialKeys.includes(key));
      }

      filteredTutorialKeys.forEach((key) => currentSet.add(key));
      return [...currentSet];
    });
  };

  const updateTutorialStatus = async (tutorial, status) => {
    if (!tutorial?.id) {
      throw new Error('ID tutorial tidak tersedia.');
    }

    const response = await fetch(
      `${ARTICLE_API_URL}?id=${encodeURIComponent(tutorial.id)}`,
      {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildTutorialUpdatePayload(tutorial, status)),
      }
    );

    const result = await parseApiResponse(response);
    return normalizeTutorial({ ...tutorial, ...(result.data || {}) });
  };

  const handleBulkStatus = async (status, successMessage) => {
    if (!selectedTutorials.length) {
      setActionError('Pilih minimal satu tutorial terlebih dahulu.');
      return;
    }

    try {
      setBusyTutorialId('bulk');
      setActionError('');
      setActionMessage('');

      const updatedTutorials = [];

      for (const tutorial of selectedTutorials) {
        updatedTutorials.push(await updateTutorialStatus(tutorial, status));
      }

      setTutorials((current) =>
        current.map(
          (tutorial) =>
            updatedTutorials.find(
              (updated) => String(updated.id) === String(tutorial.id)
            ) || tutorial
        )
      );
      setSelectedTutorial((current) =>
        current
          ? updatedTutorials.find(
              (updated) => String(updated.id) === String(current.id)
            ) || current
          : current
      );
      setCheckedTutorialKeys([]);
      setActionMessage(
        `${successMessage} (${updatedTutorials.length} tutorial).`
      );
    } catch (error) {
      console.error('Gagal menjalankan aksi cepat tutorial:', error);
      setActionMessage('');
      setActionError(
        error.message || 'Gagal menjalankan aksi cepat tutorial.'
      );
    } finally {
      setBusyTutorialId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedTutorials.length) {
      setActionError('Pilih minimal satu tutorial terlebih dahulu.');
      return;
    }

    const isConfirmed = window.confirm(
      `${selectedTutorialCount} tutorial akan dihapus permanen. Lanjutkan?`
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setBusyTutorialId('bulk');
      setActionError('');
      setActionMessage('');

      for (const tutorial of selectedTutorials) {
        const response = await fetch(
          `${ARTICLE_API_URL}?id=${encodeURIComponent(tutorial.id)}`,
          {
            method: 'DELETE',
            headers: {
              Accept: 'application/json',
            },
          }
        );
        await parseApiResponse(response);
      }

      const deletedKeys = selectedTutorials.map(getTutorialKey);
      setTutorials((current) =>
        current.filter(
          (tutorial) => !deletedKeys.includes(getTutorialKey(tutorial))
        )
      );
      setSelectedTutorial((current) =>
        current && deletedKeys.includes(getTutorialKey(current)) ? null : current
      );
      setCheckedTutorialKeys([]);
      setActionMessage(
        `Tutorial terpilih berhasil dihapus (${selectedTutorialCount} tutorial).`
      );
    } catch (error) {
      console.error('Gagal menghapus tutorial terpilih:', error);
      setActionMessage('');
      setActionError(error.message || 'Gagal menghapus tutorial terpilih.');
    } finally {
      setBusyTutorialId(null);
    }
  };

  return (
    <main
      className={`admin-dashboard-page admin-tutorial-page${
        isSidebarCollapsed ? ' admin-dashboard-page--collapsed' : ''
      }`}
    >
      <style>{`
        .admin-tutorial-detail--complete {
          width: min(900px, 94vw);
          max-width: 900px;
          padding: 0 24px 30px;
          background:
            linear-gradient(180deg, #f8fbff 0, #ffffff 180px);
        }

        .admin-tutorial-detail--complete .admin-tutorial-detail-head {
          position: sticky;
          top: 0;
          z-index: 20;
          margin: 0 -24px;
          padding: 18px 24px;
          border-bottom: 1px solid #e7edf5;
          background: rgba(255, 255, 255, .96);
          backdrop-filter: blur(12px);
        }

        .admin-tutorial-detail--complete .admin-tutorial-detail-profile {
          display: grid;
          grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
          align-items: center;
          gap: 22px;
          margin-top: 22px;
          padding: 18px;
          border: 1px solid #dbe8ff;
          border-radius: 18px;
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, .10), transparent 42%),
            #fff;
          box-shadow: 0 12px 32px rgba(16, 24, 40, .06);
        }

        .admin-tutorial-detail--complete .admin-tutorial-detail-profile h3 {
          margin: 0 0 10px;
          font-size: 22px;
          line-height: 1.3;
          color: #101828;
        }

        .admin-tutorial-detail--complete .admin-tutorial-detail-image {
          width: 100%;
          height: 145px;
          border-radius: 14px;
          object-fit: cover;
          background: #eef2f6;
        }

        .admin-tutorial-detail--complete > dl {
          display: grid;
          grid-template-columns: 160px minmax(0, 1fr);
          margin: 18px 0 0;
          overflow: hidden;
          border: 1px solid #e4e7ec;
          border-radius: 14px;
          background: #fff;
        }

        .admin-tutorial-detail--complete > dl dt,
        .admin-tutorial-detail--complete > dl dd {
          margin: 0;
          padding: 11px 14px;
          border-bottom: 1px solid #f0f2f5;
          font-size: 12px;
        }

        .admin-tutorial-detail--complete > dl dt {
          background: #f8fafc;
          color: #667085;
          font-weight: 700;
        }

        .admin-tutorial-detail--complete > dl dd {
          color: #344054;
          overflow-wrap: anywhere;
        }

        .admin-tutorial-detail-section {
          margin-top: 20px;
          overflow: hidden;
          border: 1px solid #e4e7ec;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 8px 24px rgba(16, 24, 40, .045);
        }

        .admin-tutorial-detail-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 16px 18px;
          border-bottom: 1px solid #eef2f6;
          background: linear-gradient(135deg, #f8fbff 0%, #f5f3ff 100%);
        }

        .admin-tutorial-detail-section-head h3 {
          margin: 2px 0 0;
          color: #101828;
          font-size: 16px;
        }

        .admin-tutorial-detail-kicker {
          display: block;
          color: #2563eb;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .admin-tutorial-detail-count {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 4px 10px;
          border: 1px solid #bfdbfe;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .admin-tutorial-full-description {
          padding: 18px;
          color: #344054;
          font-size: 12px;
          line-height: 1.8;
        }

        .admin-tutorial-full-description > :first-child {
          margin-top: 0;
        }

        .admin-tutorial-full-description > :last-child {
          margin-bottom: 0;
        }

        .admin-tutorial-full-description h1,
        .admin-tutorial-full-description h2,
        .admin-tutorial-full-description h3 {
          margin: 20px 0 8px;
          color: #101828;
          line-height: 1.35;
        }

        .admin-tutorial-full-description h2 {
          font-size: 17px;
        }

        .admin-tutorial-full-description h3 {
          font-size: 15px;
        }

        .admin-tutorial-full-description p {
          margin: 0 0 12px;
        }

        .admin-tutorial-full-description ul,
        .admin-tutorial-full-description ol {
          margin: 10px 0 14px;
          padding-left: 22px;
        }

        .admin-tutorial-full-description blockquote {
          margin: 14px 0;
          padding: 12px 14px;
          border-left: 3px solid #2563eb;
          border-radius: 0 10px 10px 0;
          background: #f8fbff;
          color: #475467;
        }

        .admin-tutorial-full-description pre {
          overflow-x: auto;
          padding: 13px;
          border-radius: 10px;
          background: #101828;
          color: #f8fafc;
        }

        .admin-tutorial-slides-list {
          display: grid;
          gap: 12px;
          padding: 16px;
          background: #fbfcfe;
        }

        .admin-tutorial-slide-card {
          overflow: hidden;
          border: 1px solid #e4e7ec;
          border-radius: 13px;
          background: #fff;
        }

        .admin-tutorial-slide-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-bottom: 1px solid #eef2f6;
          background: #f8fafc;
        }

        .admin-tutorial-slide-number {
          display: block;
          margin-bottom: 3px;
          color: #2563eb;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .admin-tutorial-slide-card-head strong {
          display: block;
          color: #101828;
          font-size: 13px;
        }

        .admin-tutorial-slide-type {
          color: #667085;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .admin-tutorial-slide-card-body {
          padding: 14px;
        }

        .admin-tutorial-slide-text {
          margin: 0;
          color: #344054;
          font-size: 12px;
          line-height: 1.75;
          white-space: pre-wrap;
        }

        .admin-tutorial-slide-image {
          display: block;
          width: 100%;
          max-height: 360px;
          margin-top: 12px;
          border: 1px solid #e4e7ec;
          border-radius: 10px;
          object-fit: contain;
          background: #f8fafc;
        }

        .admin-tutorial-slide-video {
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          border: 0;
          border-radius: 10px;
          background: #000;
        }

        .admin-tutorial-slide-link {
          display: inline-flex;
          margin-top: 8px;
          color: #2563eb;
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
        }

        .admin-tutorial-slide-empty {
          margin: 0;
          color: #98a2b3;
          font-size: 11px;
        }

        @media (max-width: 720px) {
          .admin-tutorial-detail--complete {
            width: 100vw;
            max-width: 100vw;
            padding-left: 16px;
            padding-right: 16px;
          }

          .admin-tutorial-detail--complete .admin-tutorial-detail-head {
            margin-left: -16px;
            margin-right: -16px;
            padding-left: 16px;
            padding-right: 16px;
          }

          .admin-tutorial-detail--complete .admin-tutorial-detail-profile {
            grid-template-columns: 1fr;
          }

          .admin-tutorial-detail--complete > dl {
            grid-template-columns: 1fr;
          }

          .admin-tutorial-detail--complete > dl dt {
            padding-bottom: 4px;
            border-bottom: 0;
          }

          .admin-tutorial-detail--complete > dl dd {
            padding-top: 4px;
          }

          .admin-tutorial-detail-section-head {
            align-items: flex-start;
          }
        }
      `}</style>

      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      <section
        className="admin-dashboard-main"
        aria-label="Tutorial dan materi admin"
      >
        <AdminTutorialTopbar />

        <div className="admin-tutorial-layout">
          <section className="admin-tutorial-content">
            <div className="admin-tutorial-heading">
              <div>
                <h1>Tutorial / Materi</h1>
                <p>
                  Dashboard <span>/</span> Tutorial / Materi
                </p>
              </div>
            </div>

            {actionMessage ? (
              <p role="status" className="admin-tutorial-feedback is-success">
                {actionMessage}
              </p>
            ) : null}

            {actionError ? (
              <p role="alert" className="admin-tutorial-feedback is-error">
                {actionError}
              </p>
            ) : null}

            {selectedTutorialCount ? (
              <section
                className="admin-tutorial-bulk-actions"
                aria-label="Aksi tutorial terpilih"
              >
                <span>{selectedTutorialCount} tutorial dipilih</span>
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      handleBulkStatus(
                        'published',
                        'Tutorial terpilih berhasil dipublish'
                      )
                    }
                    disabled={isBulkActionBusy}
                  >
                    Publish Terpilih
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleBulkStatus(
                        'draft',
                        'Tutorial terpilih berhasil dijadikan draft'
                      )
                    }
                    disabled={isBulkActionBusy}
                  >
                    Jadikan Draft
                  </button>
                  <button
                    type="button"
                    className="is-danger"
                    onClick={handleBulkDelete}
                    disabled={isBulkActionBusy}
                  >
                    Hapus
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckedTutorialKeys([])}
                    disabled={isBulkActionBusy}
                  >
                    Batal Pilih
                  </button>
                </div>
              </section>
            ) : null}

            <section
              className="admin-tutorial-stats"
              aria-label="Ringkasan tutorial"
            >
              {tutorialStats.map((item) => (
                <article className="admin-tutorial-stat" key={item.label}>
                  <span
                    className={`admin-tutorial-stat-icon is-${item.tone}`}
                  >
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

            <section
              className="admin-tutorial-filter"
              aria-label="Filter tutorial"
            >
              <label className="admin-tutorial-search">
                <input
                  type="search"
                  placeholder="Cari judul tutorial..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>

              <label>
                <span>Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">Semua Status</option>
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Archived">Archived</option>
                </select>
              </label>

              <label>
                <span>Kategori</span>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option value="">Semua Kategori</option>
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Level</span>
                <select
                  value={levelFilter}
                  onChange={(event) => setLevelFilter(event.target.value)}
                >
                  <option value="">Semua Level</option>
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Author / Admin</span>
                <select value="" disabled>
                  <option value="">Admin</option>
                </select>
              </label>

              <label>
                <span>Tanggal Publish</span>
                <input
                  type="text"
                  placeholder="Belum tersedia di filter API"
                  disabled
                />
              </label>

              <button type="button" onClick={resetFilters}>
                Reset Filter
              </button>
            </section>

            <div className="admin-tutorial-table-toolbar">
              <a
                className="admin-tutorial-primary"
                href="/admin/tutorial/tambah"
              >
                + Tambah Materi
              </a>

              {/* <button type="button" onClick={fetchTutorials}>
                {isLoading ? 'Memuat...' : 'Muat Ulang SQLite'}
              </button> */}
            </div>

            <section className="admin-tutorial-table-card">
              <table className="admin-tutorial-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Pilih semua tutorial"
                        checked={isFilteredTutorialsChecked}
                        disabled={filteredTutorials.length === 0}
                        onClick={(event) => event.stopPropagation()}
                        onChange={handleToggleFilteredTutorialChecks}
                      />
                    </th>
                    <th>Judul Tutorial</th>
                    <th>Kategori</th>
                    <th>Level</th>
                    <th>Status</th>
                    <th>Author</th>
                    <th>Viewer</th>
                    <th>Selesai</th>
                    <th>Tgl Dibuat</th>
                    <th>Tgl Publish</th>
                    <th>Update Terakhir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan="12">Memuat data dari materi</td>
                    </tr>
                  )}

                  {!isLoading && loadError && (
                    <tr>
                      <td colSpan="12">
                        <strong>Gagal mengambil data dari materi.</strong>
                        <br />
                        <small>{loadError}</small>
                        <br />
                        <small>
                          Endpoint: {ARTICLE_API_URL}
                        </small>
                      </td>
                    </tr>
                  )}

                  {!isLoading && !loadError && filteredTutorials.length === 0 && (
                    <tr>
                      <td colSpan="12">
                        Belum ada data materi yang sesuai di SQLite.
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    !loadError &&
                    filteredTutorials.map((item, index) => (
                      <tr key={item.id || item.slug || item.title}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Pilih ${item.title}`}
                            checked={checkedTutorialKeys.includes(
                              getTutorialKey(item)
                            )}
                            onClick={(event) => event.stopPropagation()}
                            onChange={() => handleToggleTutorialCheck(item)}
                          />
                        </td>

                        <td>
                          <TutorialThumbnail
                            src={item.imageSrc}
                            index={index}
                          />
                          <span>
                            <b>{item.title}</b>
                            <small>{item.description}</small>
                          </span>
                        </td>

                        <td>
                          <TutorialBadge>{item.category}</TutorialBadge>
                        </td>

                        <td>
                          <TutorialBadge>{item.level}</TutorialBadge>
                        </td>

                        <td>
                          <TutorialBadge>{item.status}</TutorialBadge>
                        </td>

                        <td>{item.author}</td>
                        <td>{item.viewer}</td>
                        <td>{item.completed}</td>
                        <td>{item.createdAt}</td>
                        <td>{item.publishedAt}</td>
                        <td>{item.updatedAt}</td>

                        <td>
                          <AdminActionDropdown
                            label={`Buka aksi untuk ${item.title}`}
                            items={[
                              {
                                label: 'Lihat',
                                icon: <img src={eyeIcon} alt="" />,
                                onSelect: () => setSelectedTutorial(item),
                              },
                              {
                                label: 'Edit',
                                onSelect: () => handleEditTutorial(item),
                              },
                              {
                                label: 'Delete',
                                tone: 'danger',
                                onSelect: () => handleDeleteTutorial(item),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <div className="admin-tutorial-pagination">
                <span>
                  Menampilkan {filteredTutorials.length ? 1 : 0} -{' '}
                  {filteredTutorials.length} dari {filteredTutorials.length}{' '}
                  data
                </span>

                <div>
                  <button type="button" disabled>
                    &lt;
                  </button>
                  <button type="button" className="is-active">
                    1
                  </button>
                  <button type="button" disabled>
                    &gt;
                  </button>
                </div>

                <select defaultValue="10">
                  <option value="10">10 / halaman</option>
                </select>
              </div>
            </section>

            <section className="admin-tutorial-bottom">
              <article className="admin-tutorial-panel">
                <div className="admin-tutorial-panel-head">
                  <h2>Materi Terbaru dari SQLite</h2>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Judul</th>
                      <th>Status</th>
                      <th>Dibuat</th>
                    </tr>
                  </thead>

                  <tbody>
                    {latestTutorials.length === 0 ? (
                      <tr>
                        <td colSpan="4">Belum ada materi.</td>
                      </tr>
                    ) : (
                      latestTutorials.map((item, index) => (
                        <tr key={item.id || item.slug}>
                          <td>{index + 1}</td>
                          <td>{item.title}</td>
                          <td>{item.status}</td>
                          <td>{item.createdAt}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </article>

              <article className="admin-tutorial-panel">
                <div className="admin-tutorial-panel-head">
                  <h2>Draft Perlu Dilanjutkan</h2>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Judul</th>
                      <th>Author</th>
                      <th>Terakhir Diedit</th>
                    </tr>
                  </thead>

                  <tbody>
                    {draftTutorials.length === 0 ? (
                      <tr>
                        <td colSpan="3">Tidak ada draft.</td>
                      </tr>
                    ) : (
                      draftTutorials.map((item) => (
                        <tr key={item.id || item.slug}>
                          <td>{item.title}</td>
                          <td>{item.author}</td>
                          <td>{item.updatedAt}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </article>

              <article className="admin-tutorial-panel admin-tutorial-issues">
                <div className="admin-tutorial-panel-head">
                  <h2>Materi Bermasalah</h2>
                </div>

                {issueItems.map((item) => (
                  <p key={item[0]}>
                    <span>{item[0]}</span>
                    <strong>{item[1]}</strong>
                  </p>
                ))}
              </article>

              <article className="admin-tutorial-panel admin-tutorial-activity">
                <div className="admin-tutorial-panel-head">
                  <h2>Aktivitas Terbaru</h2>
                </div>

                {activityItems.length === 0 ? (
                  <p>
                    <b>Belum ada aktivitas materi.</b>
                  </p>
                ) : (
                  activityItems.map((item) => (
                    <p key={`${item[0]}-${item[1]}`}>
                      <span
                        className={`admin-tutorial-dot is-${item[2]}`}
                      />
                      <b>{item[0]}</b>
                      <time>{item[1]}</time>
                    </p>
                  ))
                )}
              </article>
            </section>

            <section className="admin-tutorial-quick">
              <h2>Aksi Cepat</h2>
              <div>
                <a href="/admin/tutorial/tambah">Buat Tutorial Baru</a>
                <button type="button" onClick={fetchTutorials}>
                  Muat Ulang Data Materi
                </button>
                <button type="button">Export Data Tutorial</button>
                <button type="button">Cek Link Rusak</button>
                <button type="button">Reorder Materi Belajar</button>
              </div>
            </section>
          </section>

          {selectedTutorial ? (
            <div
              className="admin-tutorial-detail-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Detail tutorial"
            >
              <button
                type="button"
                className="admin-tutorial-detail-backdrop"
                aria-label="Tutup detail"
                onClick={() => setSelectedTutorial(null)}
              />

              <aside className="admin-tutorial-detail admin-tutorial-detail--complete">
                <div className="admin-tutorial-detail-head">
                  <h2>Detail Tutorial</h2>
                  <button
                    type="button"
                    aria-label="Tutup detail"
                    onClick={() => setSelectedTutorial(null)}
                  >
                    x
                  </button>
                </div>

                <div className="admin-tutorial-detail-profile">
                  <TutorialThumbnail
                    src={selectedTutorial.imageSrc}
                    large
                  />
                  <div>
                    <h3>{selectedTutorial.title}</h3>
                    <TutorialBadge>{selectedTutorial.status}</TutorialBadge>
                  </div>
                </div>

                <dl>
                  <dt>Kategori</dt>
                  <dd>{selectedTutorial.category}</dd>

                  <dt>Level</dt>
                  <dd>{selectedTutorial.level}</dd>

                  <dt>Author</dt>
                  <dd>{selectedTutorial.author}</dd>

                  <dt>Slug</dt>
                  <dd>{selectedTutorial.slug || '-'}</dd>

                  <dt>Deskripsi Singkat</dt>
                  <dd>{selectedTutorial.description}</dd>

                  <dt>Total Slide</dt>
                  <dd>{selectedTutorial.totalSlides}</dd>
                </dl>

                <section
                  className="admin-tutorial-detail-section"
                  aria-label="Deskripsi lengkap materi"
                >
                  <div className="admin-tutorial-detail-section-head">
                    <div>
                      <span className="admin-tutorial-detail-kicker">
                        Tentang Materi
                      </span>
                      <h3>Deskripsi Lengkap</h3>
                    </div>

                    <span className="admin-tutorial-detail-count">
                      {selectedTutorial.totalSlides} Slide
                    </span>
                  </div>

                  <div
                    className="admin-tutorial-full-description"
                    dangerouslySetInnerHTML={{
                      __html:
                        selectedTutorial.fullDescription &&
                        selectedTutorial.fullDescription !== '-'
                          ? selectedTutorial.fullDescription
                          : '<p>Deskripsi lengkap materi belum tersedia.</p>',
                    }}
                  />
                </section>

                <section
                  className="admin-tutorial-detail-section"
                  aria-label="Isi slide materi"
                >
                  <div className="admin-tutorial-detail-section-head">
                    <div>
                      <span className="admin-tutorial-detail-kicker">
                        Materi Pembelajaran
                      </span>
                      <h3>Isi Slide Materi</h3>
                    </div>

                    <span className="admin-tutorial-detail-count">
                      {selectedTutorial.totalSlides} Slide
                    </span>
                  </div>

                  {selectedTutorial.slides.length === 0 ? (
                    <div className="admin-tutorial-slides-list">
                      <p className="admin-tutorial-slide-empty">
                        Materi ini belum memiliki slide.
                      </p>
                    </div>
                  ) : (
                    <div className="admin-tutorial-slides-list">
                      {selectedTutorial.slides.map((slide, index) => {
                        const contentType = String(
                          slide.content_type || 'text'
                        ).toLowerCase();

                        const usesText = ['text', 'text_image'].includes(
                          contentType
                        );

                        const usesImage = ['image', 'text_image'].includes(
                          contentType
                        );

                        const slideText =
                          slide.body_text ?? slide.content ?? '';

                        const slideImageUrl = resolvePublicImageUrl(
                          slide.image_url ||
                            slide.image?.url ||
                            slide.image?.file_url ||
                            slide.image_path ||
                            ''
                        );

                        const videoUrl = String(
                          slide.video_url || ''
                        ).trim();

                        const youtubeEmbedUrl =
                          getYoutubeEmbedUrl(videoUrl);

                        const contentLabel =
                          contentType === 'text_image'
                            ? 'Teks + Gambar'
                            : contentType === 'text'
                              ? 'Teks'
                              : contentType === 'image'
                                ? 'Gambar'
                                : contentType === 'video'
                                  ? 'Video'
                                  : contentType;

                        return (
                          <article
                            className="admin-tutorial-slide-card"
                            key={
                              slide.id ||
                              `${selectedTutorial.id}-${index}`
                            }
                          >
                            <div className="admin-tutorial-slide-card-head">
                              <div>
                                <span className="admin-tutorial-slide-number">
                                  Slide {slide.order || slide.slide_order || index + 1}
                                </span>

                                <strong>
                                  {slide.title || `Slide ${index + 1}`}
                                </strong>
                              </div>

                              <span className="admin-tutorial-slide-type">
                                {contentLabel}
                              </span>
                            </div>

                            <div className="admin-tutorial-slide-card-body">
                              {usesText ? (
                                <p className="admin-tutorial-slide-text">
                                  {slideText || 'Belum ada isi teks.'}
                                </p>
                              ) : null}

                              {usesImage ? (
                                slideImageUrl ? (
                                  <img
                                    className="admin-tutorial-slide-image"
                                    src={slideImageUrl}
                                    alt={slide.title || `Slide ${index + 1}`}
                                    loading="lazy"
                                  />
                                ) : (
                                  <p className="admin-tutorial-slide-empty">
                                    Gambar slide belum tersedia.
                                  </p>
                                )
                              ) : null}

                              {contentType === 'video' ? (
                                videoUrl ? (
                                  youtubeEmbedUrl ? (
                                    <iframe
                                      className="admin-tutorial-slide-video"
                                      src={youtubeEmbedUrl}
                                      title={
                                        slide.title ||
                                        `Video slide ${index + 1}`
                                      }
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  ) : isDirectVideoUrl(videoUrl) ? (
                                    <video
                                      className="admin-tutorial-slide-video"
                                      src={videoUrl}
                                      controls
                                      playsInline
                                      preload="metadata"
                                    />
                                  ) : isM3u8Url(videoUrl) ? (
                                    <>
                                      <video
                                        className="admin-tutorial-slide-video"
                                        src={videoUrl}
                                        controls
                                        playsInline
                                        preload="metadata"
                                      />
                                      <a
                                        className="admin-tutorial-slide-link"
                                        href={videoUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        Buka streaming .m3u8
                                      </a>
                                    </>
                                  ) : (
                                    <a
                                      className="admin-tutorial-slide-link"
                                      href={videoUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Buka Video
                                    </a>
                                  )
                                ) : (
                                  <p className="admin-tutorial-slide-empty">
                                    Link video belum tersedia.
                                  </p>
                                )
                              ) : null}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="admin-tutorial-detail-stats">
                  <article>
                    <span>Viewer</span>
                    <strong>{selectedTutorial.viewer}</strong>
                  </article>

                  <article>
                    <span>User Selesai</span>
                    <strong>{selectedTutorial.completed}</strong>
                  </article>

                  <article>
                    <span>Estimasi Waktu</span>
                    <strong>{selectedTutorial.estimatedTime}</strong>
                  </article>

                  <article>
                    <span>Tanggal Publish</span>
                    <strong>{selectedTutorial.publishedAt}</strong>
                  </article>
                </section>

                <section className="admin-tutorial-history">
                  <h3>Riwayat Update Terakhir</h3>
                  <p>
                    {selectedTutorial.updatedAtWithTime} oleh{' '}
                    {selectedTutorial.author}
                  </p>
                </section>

                <div className="admin-tutorial-detail-actions">
                  <button
                    type="button"
                    className="is-blue"
                    onClick={() => handleEditTutorial(selectedTutorial)}
                  >
                    Edit Tutorial
                  </button>
                  {/* <button type="button">Preview</button>
                  <button type="button" className="is-green">
                    Publish / Unpublish
                  </button>
                  <button type="button" className="is-purple">
                    Lihat Statistik
                  </button>
                  <button type="button" className="is-orange">
                    Arsipkan Tutorial
                  </button> */}
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
