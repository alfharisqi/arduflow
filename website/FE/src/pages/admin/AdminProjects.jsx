import { useEffect, useMemo, useState } from 'react';
import { AdminSidebar } from './AdminSidebar.jsx';
import { ProjectUploadForm } from '../User/UserProjectGallery.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import { API_BASE_URL, apiEndpoint } from '../../services/apiEndpoints.js';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import galleryIcon from '../../assets/icons/icon-image-placeholder-1.svg';
import zapIcon from '../../assets/icons/icon-zap-1.svg';
import { showArduflowAlert, showConfirmAlert, showPromptAlert } from '../../utils/alerts.js';

const PROJECT_API_URL = apiEndpoint(
  import.meta.env.VITE_PROJECT_API_URL,
  '/api/projects-api.php'
);

function AdminProjectsTopbar({ searchValue, onSearchChange }) {
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
        <button
          className="admin-dashboard-notif"
          type="button"
          aria-label="Notifikasi"
          onClick={() => showArduflowAlert({
            icon: 'info',
            title: 'Notifikasi',
            text: 'Belum ada notifikasi proyek baru.',
          })}
        >
          <img src={bellIcon} alt="" />
        </button>
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

function toProjectNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === undefined || value === null || value === '') return 0;

  const parsed = Number(String(value).replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatProjectNumber(value) {
  return toProjectNumber(value).toLocaleString('id-ID');
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

  return (
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

  return step.title || step.description || step.name || `Langkah ${step.order || index + 1}`;
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

function resolveProjectCoverUrl(project) {
  const cover = project?.coverImage || {};
  const rawUrl = (
    project?.coverUrl ||
    project?.coverPath ||
    cover.file_url ||
    cover.fileUrl ||
    cover.url ||
    cover.file_path ||
    cover.filePath ||
    ''
  );

  if (!rawUrl) return '';
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(rawUrl)) return rawUrl;

  const normalizedPath = String(rawUrl)
    .replace(/^\/+/, '')
    .replace(/^storage\/uploads\//i, 'uploads/');

  return `${API_BASE_URL}/${normalizedPath}`;
}

export function AdminProjects() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialAdminSidebarCollapsed);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectError, setProjectError] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [checkedProjectKeys, setCheckedProjectKeys] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [isUploadFormOpen, setUploadFormOpen] = useState(false);
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
  const projectStats = useMemo(() => {
    const totalProjects = projects.length;
    const publishedProjects = projects.filter((project) => isProjectStatus(project, ['published', 'publish'])).length;
    const reviewProjectsCount = projects.filter((project) => isProjectStatus(project, ['review', 'pending', 'menunggu'])).length;
    const revisionProjects = projects.filter((project) => isProjectStatus(project, ['revisi', 'revision', 'ditolak', 'rejected'])).length;
    const totalViewer = projects.reduce((sum, project) => sum + toProjectNumber(project.viewer ?? project.viewers), 0);
    const mostPopularProject = projects.reduce((currentPopular, project) => {
      const currentViewer = toProjectNumber(currentPopular?.viewer ?? currentPopular?.viewers);
      const projectViewer = toProjectNumber(project.viewer ?? project.viewers);
      return projectViewer > currentViewer ? project : currentPopular;
    }, null);

    return [
      { label: 'Total Proyek', value: formatProjectNumber(totalProjects), note: 'Semua proyek tersimpan', icon: galleryIcon, tone: 'blue' },
      { label: 'Proyek Published', value: formatProjectNumber(publishedProjects), note: formatProjectPercent(publishedProjects, totalProjects), icon: checkIcon, tone: 'green' },
      { label: 'Menunggu Review', value: formatProjectNumber(reviewProjectsCount), note: formatProjectPercent(reviewProjectsCount, totalProjects), icon: clockIcon, tone: 'orange' },
      { label: 'Perlu Revisi / Ditolak', value: formatProjectNumber(revisionProjects), note: formatProjectPercent(revisionProjects, totalProjects), icon: checkIcon, tone: 'red' },
      { label: 'Total Viewer', value: formatProjectNumber(totalViewer), note: 'Dihitung dari data proyek', icon: eyeIcon, tone: 'blue' },
      {
        label: 'Proyek Paling Populer',
        value: mostPopularProject?.title || '-',
        note: `Viewer: ${formatProjectNumber(mostPopularProject?.viewer ?? mostPopularProject?.viewers)}`,
        icon: zapIcon,
        tone: 'red',
      },
    ];
  }, [projects]);
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

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistAdminSidebarCollapsed(nextValue);
      return nextValue;
    });
  };

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

  const handleEditProject = (project) => {
    if (!project?.id) {
      setActionError('ID proyek tidak tersedia.');
      return;
    }

    setActionError('');
    setActionMessage('');
    setSelectedProject(null);
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
      return;
    }

    try {
      setBusyProjectId(project.id);
      setActionError('');
      setActionMessage('');

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
    } finally {
      setBusyProjectId(null);
    }
  };

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
      window.open(projectFileUrl, '_blank', 'noopener,noreferrer');
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

  return (
    <main className={`admin-dashboard-page admin-projects-page${isSidebarCollapsed ? ' admin-dashboard-page--collapsed' : ''}`}>
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={handleToggleSidebar} />

      <section className="admin-dashboard-main" aria-label="Proyek admin">
        <AdminProjectsTopbar searchValue={searchQuery} onSearchChange={setSearchQuery} />

        <div className="admin-projects-layout">
          <section className="admin-projects-content">
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
                  <col className="admin-projects-col-status" />
                  <col className="admin-projects-col-viewer" />
                  <col className="admin-projects-col-like" />
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
                        checked={isCurrentPageChecked}
                        disabled={paginatedProjects.length === 0}
                        onClick={(event) => event.stopPropagation()}
                        onChange={handleToggleCurrentPageChecks}
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
                    <th>Status</th>
                    <th>Viewer</th>
                    <th>Like / Save</th>
                    <th>Tgl Upload</th>
                    <th>Update Terakhir</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="15">Memuat data proyek...</td>
                    </tr>
                  ) : projectError ? (
                    <tr>
                      <td colSpan="15">{projectError}</td>
                    </tr>
                  ) : filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan="15">Tidak ada proyek yang cocok dengan filter.</td>
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
                      const tools = getProjectArray(project, 'tools');
                      const nodes = getProjectArray(project, 'nodes');
                      const steps = getProjectArray(project, 'steps');

                      return (
                        <tr
                          key={project.id ?? `${project.title}-${index}`}
                          onClick={() => handleSelectProject(project)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Pilih ${project.title || 'proyek'}`}
                              checked={checkedProjectKeys.includes(getProjectKey(project))}
                              onChange={() => handleToggleProjectCheck(project)}
                              onClick={(event) => event.stopPropagation()}
                            />
                          </td>

                          <td>
                            <div className="admin-projects-title-cell">
                              {coverUrl ? (
                                <img className="admin-projects-thumb" src={coverUrl} alt={project.title || 'Cover proyek'} />
                              ) : (
                                <span className={`admin-projects-thumb is-${index % 5}`} />
                              )}
                              <span>
                                <b>{project.title || '-'}</b>
                                <small>{project.description || '-'}</small>
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="admin-projects-owner-cell">
                              <span className="admin-projects-avatar" />
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

                          <td>
                            <ProjectBadge>{status}</ProjectBadge>
                          </td>

                          <td>{project.viewer ?? 0}</td>

                          <td>
                            {`${project.likes ?? 0} / ${project.saves ?? 0}`}
                          </td>

                          <td><ProjectDateTime value={project.createdAt} /></td>
                          <td><ProjectDateTime value={project.updatedAt} /></td>

                          <td>
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
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div className="admin-projects-pagination">
                <span>Menampilkan {paginatedProjects.length} dari {filteredProjects.length} proyek</span>
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
                  <thead><tr><th>#</th><th>Judul</th><th>Viewer</th><th>Like</th></tr></thead>
                  <tbody>
                    {popularProjects.length ? popularProjects.map((project, index) => (
                      <tr key={project.id ?? project.title}>
                        <td>{index + 1}</td>
                        <td>{project.title || '-'}</td>
                        <td>{formatProjectNumber(project.viewer ?? project.viewers)}</td>
                        <td>{formatProjectNumber(project.likes)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4">Belum ada proyek.</td></tr>
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

              </>
            )}
          </section>

          {selectedProject && !editingProject && !isUploadFormOpen && (
            <div className="admin-projects-detail-overlay" role="presentation" onClick={() => setSelectedProject(null)}>
            <aside className="admin-projects-detail" aria-label="Detail proyek" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
              <div className="admin-projects-detail-head">
                <h2>Detail Proyek</h2>
                <button type="button" aria-label="Tutup detail" onClick={() => setSelectedProject(null)}>x</button>
              </div>

              <>
                <div className="admin-projects-detail-profile">
                  {resolveProjectCoverUrl(selectedProject) ? (
                    <img
                      className="admin-projects-detail-image"
                      src={resolveProjectCoverUrl(selectedProject)}
                      alt={selectedProject.title || 'Cover proyek'}
                    />
                  ) : (
                    <span className="admin-projects-detail-image" />
                  )}
                  <div>
                    <h3>{selectedProject.title || '-'}</h3>
                    <ProjectBadge>{selectedProject.status || 'draft'}</ProjectBadge>
                    <p>
                      <span className="admin-projects-avatar" />
                      {getProjectOwnerName(selectedProject)}
                      <br />
                      <small>
                        {getProjectOwnerUsername(selectedProject)}
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
                  <button type="button" className="is-blue" onClick={() => handlePreviewProject(selectedProject)}>
                    Preview Proyek
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
              </>
            </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
