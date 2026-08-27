import { useEffect, useMemo, useState } from 'react';
import { AdminSidebar } from './AdminSidebar.jsx';
import { ProjectUploadForm } from '../User/UserProjectGallery.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import fileIcon from '../../assets/icons/icon-file-text-1.svg';
import galleryIcon from '../../assets/icons/icon-image-placeholder-1.svg';
import zapIcon from '../../assets/icons/icon-zap-1.svg';
import { getProjectApiUrl } from '../../services/projectApiConfig.js';

const PROJECT_API_URL = getProjectApiUrl();

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
  return (
    <header className="admin-dashboard-topbar">
      <label className="admin-dashboard-search">
        <span aria-hidden="true" />
        <input type="search" placeholder="Cari proyek" aria-label="Cari proyek" />
      </label>
      <div className="admin-dashboard-account">
        <button className="admin-dashboard-notif" type="button" aria-label="Notifikasi">
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

export function AdminProjects() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialAdminSidebarCollapsed);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectError, setProjectError] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
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
    const mostPopularProject = projects.reduce((currentPopular, project) => {
      const currentViewer = toProjectNumber(currentPopular?.viewer ?? currentPopular?.viewers);
      const projectViewer = toProjectNumber(project.viewer ?? project.viewers);
      return projectViewer > currentViewer ? project : currentPopular;
    }, null);

    return [
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
        icon: zapIcon,
        tone: 'red',
      },
    ];
  }, [projects]);

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

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistAdminSidebarCollapsed(nextValue);
      return nextValue;
    });
  };

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
    setEditingProject(project);
  };

  const handleDeleteProject = async (project) => {
    if (!project?.id) {
      setActionError('ID proyek tidak tersedia.');
      return;
    }

    const confirmed = window.confirm(
      `Yakin ingin menghapus proyek "${project.title || 'Tanpa Judul'}"? Data yang dihapus tidak dapat dikembalikan.`
    );

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
        <AdminProjectsTopbar />

        <div className="admin-projects-layout">
          <section className="admin-projects-content">
            {editingProject ? (
              <ProjectUploadForm
                mode="edit"
                projectId={String(editingProject.id)}
                initialProject={editingProject}
                onCancel={() => setEditingProject(null)}
                onSuccess={handleEditSuccess}
              />
            ) : (
              <>
            <div className="admin-projects-heading">
              <div>
                <h1>Proyek</h1>
                <p>Dashboard <span>/</span> Proyek</p>
              </div>
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
                <input type="search" placeholder="Cari judul proyek / nama user..." />
              </label>
              {['Status', 'Kategori', 'Level', 'Author / User'].map((label) => (
                <label key={label}>
                  <span>{label}</span>
                  <select defaultValue="">
                    <option value="">
                      {label === 'Status' ? 'Semua Status' : label === 'Kategori' ? 'Semua Kategori' : label === 'Level' ? 'Semua Level' : 'Semua User'}
                    </option>
                  </select>
                </label>
              ))}
              <label>
                <span>Tanggal Upload</span>
                <input type="text" placeholder="Pilih rentang tanggal" />
              </label>
              <button type="button">Reset Filter</button>
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
                        onChange={() => {}}
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
                      const tools = getProjectArray(project, 'tools');
                      const nodes = getProjectArray(project, 'nodes');
                      const steps = getProjectArray(project, 'steps');

                      return (
                        <tr key={project.id ?? `${project.title}-${index}`}>
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Pilih ${project.title || 'proyek'}`}
                              onChange={() => {}}
                              onClick={(event) => event.stopPropagation()}
                            />
                          </td>

                          <td>
                            <div className="admin-projects-title-cell">
                              <span className={`admin-projects-thumb is-${index % 5}`} />
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
                <span>Menampilkan {projects.length} proyek</span>
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

            <section className="admin-projects-bottom">
              <article className="admin-projects-panel">
                <div className="admin-projects-panel-head">
                  <h2>Proyek Menunggu Review</h2>
                  <a href="/admin/projects/review">Lihat semua</a>
                </div>
                {reviewProjects.map((item, index) => (
                  <p key={item[0]}>
                    <span className={`admin-projects-mini-thumb is-${index}`} />
                    <b>{item[0]}</b>
                    <small>{item[1]}</small>
                    <time>{item[2]}</time>
                  </p>
                ))}
              </article>

              <article className="admin-projects-panel">
                <div className="admin-projects-panel-head">
                  <h2>Proyek Populer <small>(30 Hari Terakhir)</small></h2>
                  <a href="/admin/projects/popular">Lihat semua</a>
                </div>
                <table>
                  <thead><tr><th>#</th><th>Judul</th><th>Viewer</th><th>Like</th></tr></thead>
                  <tbody>
                    {popularProjects.map((item, index) => (
                      <tr key={item[0]}><td>{index + 1}</td><td>{item[0]}</td><td>{item[1]}</td><td>{item[2]}</td></tr>
                    ))}
                  </tbody>
                </table>
              </article>

              <article className="admin-projects-panel admin-projects-problems">
                <div className="admin-projects-panel-head">
                  <h2>Proyek Bermasalah</h2>
                  <a href="/admin/projects/problems">Lihat semua</a>
                </div>
                {problemProjects.map((item) => (
                  <p key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong></p>
                ))}
              </article>

              <article className="admin-projects-panel admin-projects-activity">
                <div className="admin-projects-panel-head">
                  <h2>Aktivitas Terbaru</h2>
                  <a href="/admin/projects/activity">Lihat semua</a>
                </div>
                {activityItems.map((item) => (
                  <p key={item[0]}>
                    <span className={`admin-projects-dot is-${item[2]}`} />
                    <b>{item[0]}</b>
                    <time>{item[1]}</time>
                  </p>
                ))}
              </article>
            </section>

            <section className="admin-projects-quick">
              <h2>Aksi Cepat</h2>
              <div>
                {['Buat Proyek Unggulan Baru', 'Export Data Proyek', 'Cek Link Rusak', 'Publish Proyek Terpilih', 'Bersihkan Draft Lama', 'Reorder Featured Project'].map((item) => (
                  <button type="button" key={item}>{item}</button>
                ))}
              </div>
            </section>
              </>
            )}
          </section>

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
            </aside>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
