import { useEffect, useMemo, useState } from 'react';
import { AdminSidebar } from './AdminSidebar.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import { API_BASE_URL, apiEndpoint } from '../../services/apiEndpoints.js';

import bellIcon from '../../assets/icons/icon-bell-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import bookIcon from '../../assets/icons/icon-book-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import arrowIcon from '../../assets/icons/icon-arrow-right-1.svg';
import mapIcon from '../../assets/icons/icon-map-pin-1.svg';

const WORKSHOP_ENDPOINT =
  apiEndpoint(import.meta.env.VITE_WORKSHOP_API_URL, '/api/workshop-api.php');
const PAGE_SIZE = 6;

function normalizeWorkshop(row) {
  const payload = row?.payload && typeof row.payload === 'object' ? row.payload : {};
  const coverImage = payload.media?.coverImage ?? row?.coverImage ?? null;

  return {
    id: row?.id ?? null,
    title: payload.title || row?.title || '-',
    slug: payload.slug || row?.slug || '',
    summary: payload.summary || '-',
    level: payload.level || '-',
    duration: payload.duration || '-',
    platform: payload.platform || '-',
    category: payload.category || row?.category || '-',
    type: payload.type || '-',
    date: payload.schedule?.date || '',
    time: payload.schedule?.time || '',
    timezone: payload.schedule?.timezone || '',
    location: payload.location || '-',
    price: payload.price ?? '',
    facilities: payload.facilities ?? null,
    bringItems: payload.bringItems ?? null,
    about: payload.about || '',
    status: payload.publication?.status || row?.status || 'Draft',
    visibility: payload.publication?.visibility || 'Publik',
    homepageVisible: Boolean(payload.publication?.homepageVisible),
    coverImage,
    gallery: Array.isArray(payload.media?.gallery) ? payload.media.gallery : [],
    module: payload.attachment?.module ?? null,
    metaTitle: payload.seo?.metaTitle ?? null,
    metaDescription: payload.seo?.metaDescription ?? null,
    createdAt: row?.createdAt || row?.created_at || '',
    updatedAt: row?.updatedAt || row?.updated_at || '',
    raw: payload,
  };
}

function getWorkshopImageUrl(workshop) {
  const image = workshop?.coverImage;
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

function WorkshopImage({ workshop, className, compact = false }) {
  const imageUrl = getWorkshopImageUrl(workshop);

  const containerStyle = compact
    ? {
        width: 36,
        height: 36,
        overflow: 'hidden',
        borderRadius: 8,
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }
    : {
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      };

  return (
    <span className={className} style={containerStyle}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={workshop?.title || 'Gambar workshop'}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'cover',
          }}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            fontSize: compact ? 8 : 10,
            opacity: 0.55,
            textAlign: 'center',
          }}
        >
          No Image
        </span>
      )}
    </span>
  );
}

function formatDate(dateValue) {
  if (!dateValue) return '-';

  const parts = String(dateValue).split('-').map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return dateValue;
  }

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatSchedule(workshop) {
  const date = formatDate(workshop.date);
  const time = workshop.time || '';

  if (date === '-' && !time) return '-';
  if (!time) return date;

  return `${date} ${time}`;
}

function formatPrice(value) {
  const number = Number(String(value ?? '').replace(/\D/g, ''));

  if (!Number.isFinite(number) || number <= 0) {
    return 'Gratis / -';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number);
}

function AdminProgramTopbar({ searchTerm, onSearchChange }) {
  return (
    <header className="admin-dashboard-topbar">
      <label className="admin-dashboard-search">
        <span aria-hidden="true" />
        <input
          type="search"
          placeholder="Cari workshop / program"
          aria-label="Cari workshop atau program"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
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

function ProgramBadge({ children }) {
  const label = String(children ?? '-');
  const slug = label
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-');

  return (
    <span className={`admin-program-badge admin-program-badge--${slug}`}>
      {label}
    </span>
  );
}

function ProgramAction({ label, children, onClick, disabled = false, className = '' }) {
  return (
    <button
      className={`admin-program-action ${className}`.trim()}
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function AdminProgram() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialAdminSidebarCollapsed,
  );

  const [workshops, setWorkshops] = useState([]);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistAdminSidebarCollapsed(nextValue);
      return nextValue;
    });
  };

  async function loadWorkshops() {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await fetch(WORKSHOP_ENDPOINT, {
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
        throw new Error(
          `Response API bukan JSON. HTTP ${response.status}. Periksa URL ${WORKSHOP_ENDPOINT}.`,
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Gagal mengambil workshop. HTTP ${response.status}.`);
      }

      const rows = Array.isArray(result.data?.workshops)
        ? result.data.workshops
        : [];

      const normalized = rows.map(normalizeWorkshop);

      setWorkshops(normalized);

      setSelectedWorkshopId((currentId) => {
        if (currentId && normalized.some((item) => item.id === currentId)) {
          return currentId;
        }

        return null;
      });
    } catch (error) {
      console.error('[AdminProgram] LOAD ERROR:', error);
      setLoadError(error.message || 'Gagal mengambil data workshop.');
      setWorkshops([]);
      setSelectedWorkshopId(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadWorkshops();
  }, []);

  useEffect(() => {
    if (!isDetailModalOpen) {
      return undefined;
    }

    function closeWithEscape(event) {
      if (event.key === 'Escape') {
        setDetailModalOpen(false);
      }
    }

    document.addEventListener('keydown', closeWithEscape);

    return () => {
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, [isDetailModalOpen]);

  function handleEditWorkshop(workshop) {
    if (!workshop?.id) return;

    window.location.href = `/admin/tambah-workshop?id=${encodeURIComponent(workshop.id)}`;
  }

  async function handleDeleteWorkshop(workshop) {
    if (!workshop?.id) return;

    const confirmed = window.confirm(
      `Hapus workshop "${workshop.title}"?\n\nData yang dihapus tidak dapat dikembalikan.`,
    );

    if (!confirmed) return;

    setDeletingId(workshop.id);
    setLoadError('');

    try {
      const endpoint = `${WORKSHOP_ENDPOINT}?id=${encodeURIComponent(workshop.id)}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      });

      const rawText = await response.text();
      let result;

      try {
        result = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(
          `Response DELETE bukan JSON. HTTP ${response.status}.`,
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Gagal menghapus workshop. HTTP ${response.status}.`);
      }

      window.alert(`Workshop "${workshop.title}" berhasil dihapus.`);
      await loadWorkshops();
    } catch (error) {
      console.error('[AdminProgram] DELETE ERROR:', error);
      setLoadError(error.message || 'Gagal menghapus workshop.');
    } finally {
      setDeletingId(null);
    }
  }

  const statusOptions = useMemo(
    () => [...new Set(workshops.map((item) => item.status).filter(Boolean))],
    [workshops],
  );

  const typeOptions = useMemo(
    () => [...new Set(workshops.map((item) => item.type).filter((item) => item && item !== '-'))],
    [workshops],
  );

  const categoryOptions = useMemo(
    () => [...new Set(workshops.map((item) => item.category).filter((item) => item && item !== '-'))],
    [workshops],
  );

  const filteredWorkshops = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return workshops.filter((workshop) => {
      const searchableText = [
        workshop.title,
        workshop.slug,
        workshop.summary,
        workshop.category,
        workshop.type,
        workshop.location,
        workshop.status,
        workshop.level,
        workshop.platform,
      ]
        .join(' ')
        .toLowerCase();

      if (keyword && !searchableText.includes(keyword)) {
        return false;
      }

      if (statusFilter && workshop.status !== statusFilter) {
        return false;
      }

      if (typeFilter && workshop.type !== typeFilter) {
        return false;
      }

      if (categoryFilter && workshop.category !== categoryFilter) {
        return false;
      }

      if (dateFilter && workshop.date !== dateFilter) {
        return false;
      }

      return true;
    });
  }, [
    workshops,
    searchTerm,
    statusFilter,
    typeFilter,
    categoryFilter,
    dateFilter,
  ]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, typeFilter, categoryFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredWorkshops.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedWorkshops = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredWorkshops.slice(start, start + PAGE_SIZE);
  }, [filteredWorkshops, page]);

  const selectedWorkshop = useMemo(
    () =>
      workshops.find((item) => item.id === selectedWorkshopId) || null,
    [workshops, selectedWorkshopId],
  );

  const stats = useMemo(() => {
    const total = workshops.length;

    const active = workshops.filter((item) =>
      ['Terbit', 'Terjadwal'].includes(item.status),
    ).length;

    const draft = workshops.filter((item) => item.status === 'Draft').length;
    const finished = workshops.filter((item) => item.status === 'Selesai').length;

    return [
      {
        label: 'Total Workshop/Program',
        value: String(total),
        note: 'Data dari SQLite',
        icon: clockIcon,
        tone: 'gray',
      },
      {
        label: 'Program Aktif',
        value: String(active),
        note: 'Terbit / terjadwal',
        icon: checkIcon,
        tone: 'green',
      },
      {
        label: 'Program Draft',
        value: String(draft),
        note: 'Belum dipublish',
        icon: bookIcon,
        tone: 'orange',
      },
      {
        label: 'Peserta Terdaftar',
        value: '0',
        note: 'Belum ada data peserta',
        icon: usersIcon,
        tone: 'blue',
      },
      {
        label: 'Kuota Hampir Penuh',
        value: '0',
        note: 'Kuota belum tersedia',
        icon: clockIcon,
        tone: 'red',
      },
      {
        label: 'Program Selesai',
        value: String(finished),
        note: 'Status selesai',
        icon: checkIcon,
        tone: 'purple',
      },
    ];
  }, [workshops]);

  const upcomingPrograms = useMemo(() => {
    const today = new Date();
    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    return [...workshops]
      .filter(
        (item) =>
          item.date &&
          item.date >= todayString &&
          item.status !== 'Selesai',
      )
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [workshops]);

  function resetFilters() {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setCategoryFilter('');
    setDateFilter('');
    setPage(1);
  }

  const firstShown = filteredWorkshops.length
    ? (page - 1) * PAGE_SIZE + 1
    : 0;

  const lastShown = Math.min(
    page * PAGE_SIZE,
    filteredWorkshops.length,
  );

  return (
    <main
      className={`admin-dashboard-page admin-program-page${
        isSidebarCollapsed ? ' admin-dashboard-page--collapsed' : ''
      }`}
    >
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      <section
        className="admin-dashboard-main"
        aria-label="Workshop dan program admin"
      >
        <AdminProgramTopbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <div className="admin-program-layout">
          <section className="admin-program-content">
            <div className="admin-program-heading">
              <div>
                <h1>Workshop / Program</h1>
                <p>
                  Dashboard <span>/</span> Workshop / Program
                </p>
              </div>
            </div>

            {loadError && (
              <div
                className="admin-form-message is-error"
                role="alert"
                style={{ marginBottom: 16 }}
              >
                {loadError}
              </div>
            )}

            <section
              className="admin-program-stats"
              aria-label="Ringkasan workshop program"
            >
              {stats.map((item) => (
                <article className="admin-program-stat" key={item.label}>
                  <span className={`admin-program-stat-icon is-${item.tone}`}>
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
              className="admin-program-filter"
              aria-label="Filter workshop program"
            >
              <div className="admin-program-filter-top">
                <label className="admin-program-search">
                  <input
                    type="search"
                    placeholder="Cari nama program..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </label>

                <button type="button" onClick={resetFilters}>
                  Reset Filter
                </button>

                <button type="button" onClick={loadWorkshops}>
                  Muat Ulang
                </button>

                <a
                  href="/admin/tambah-workshop"
                  className="admin-program-primary"
                >
                  + Tambah Program
                </a>
              </div>

              <div className="admin-program-filter-grid">
                <label>
                  <span>Status</span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">Semua Status</option>
                    {statusOptions.map((status) => (
                      <option value={status} key={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Metode</span>
                  <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                  >
                    <option value="">Semua Metode</option>
                    {typeOptions.map((type) => (
                      <option value={type} key={type}>
                        {type}
                      </option>
                    ))}
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
                      <option value={category} key={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Tanggal Mulai</span>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                  />
                </label>

                <label>
                  <span>Sumber Data</span>
                  <select value="SQLite" disabled>
                    <option>SQLite</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="admin-program-table-card">
              <table className="admin-program-table">
                <thead>
                  <tr>
                    <th>Nama Workshop / Program</th>
                    <th>Kategori</th>
                    <th>Metode</th>
                    <th>Tanggal Mulai</th>
                    <th>Lokasi / Link</th>
                    <th>Kuota</th>
                    <th>Peserta</th>
                    <th>Status</th>
                    <th>Sertifikat</th>
                    <th>Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: 28 }}>
                        Mengambil data workshop dari SQLite...
                      </td>
                    </tr>
                  ) : paginatedWorkshops.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: 28 }}>
                        Belum ada workshop yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedWorkshops.map((workshop) => (
                      <tr
                        key={workshop.id ?? workshop.slug}
                        className={
                          selectedWorkshop?.id === workshop.id
                            ? 'is-selected'
                            : ''
                        }
                      >
                        <td>
                          <WorkshopImage workshop={workshop} className="admin-program-thumb" />

                          <span>
                            <b>{workshop.title}</b>
                            <small>{workshop.summary}</small>
                          </span>
                        </td>

                        <td>
                          <ProgramBadge>{workshop.category}</ProgramBadge>
                        </td>

                        <td>
                          <ProgramBadge>{workshop.type}</ProgramBadge>
                        </td>

                        <td>{formatSchedule(workshop)}</td>
                        <td>{workshop.location}</td>
                        <td>-</td>
                        <td>-</td>

                        <td>
                          <ProgramBadge>{workshop.status}</ProgramBadge>
                        </td>

                        <td>-</td>

                        <td>
                          <div className="admin-program-actions">
                            <ProgramAction
                              label={`Lihat ${workshop.title}`}
                              onClick={() => {
                                setSelectedWorkshopId(workshop.id);
                                setDetailModalOpen(true);
                              }}
                            >
                              <img src={eyeIcon} alt="" />
                            </ProgramAction>

                            <ProgramAction
                              label={`Edit ${workshop.title}`}
                              onClick={() => handleEditWorkshop(workshop)}
                            >
                              Edit
                            </ProgramAction>

                            <ProgramAction
                              label={`Hapus ${workshop.title}`}
                              onClick={() => handleDeleteWorkshop(workshop)}
                              disabled={deletingId === workshop.id}
                              className="is-danger"
                            >
                              {deletingId === workshop.id ? '...' : 'Delete'}
                            </ProgramAction>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="admin-program-pagination">
                <span>
                  Menampilkan {firstShown} - {lastShown} dari{' '}
                  {filteredWorkshops.length} program
                </span>

                <div>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1}
                  >
                    &lt;
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .slice(
                      Math.max(0, page - 3),
                      Math.max(0, page - 3) + 5,
                    )
                    .map((pageNumber) => (
                      <button
                        type="button"
                        key={pageNumber}
                        className={pageNumber === page ? 'is-active' : ''}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    ))}

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    disabled={page >= totalPages}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </section>

            <section className="admin-program-bottom">
              <article className="admin-program-panel">
                <div className="admin-program-panel-head">
                  <h2>Program Mendatang</h2>
                  <span>{upcomingPrograms.length} workshop</span>
                </div>

                {upcomingPrograms.length === 0 ? (
                  <p>Belum ada program mendatang.</p>
                ) : (
                  upcomingPrograms.map((item) => (
                    <p key={item.id ?? item.slug}>
                      <WorkshopImage workshop={item} className="admin-program-mini-thumb" compact />
                      <b>{item.title}</b>
                      <span>{formatDate(item.date)}</span>
                      <span>{item.time || '-'}</span>
                      <ProgramBadge>{item.status}</ProgramBadge>
                    </p>
                  ))
                )}
              </article>

              <article className="admin-program-panel">
                <div className="admin-program-panel-head">
                  <h2>Peserta Terbaru</h2>
                </div>

                <p>
                  Data peserta belum tersedia pada payload workshop yang
                  disimpan di SQLite.
                </p>
              </article>

              <article className="admin-program-panel admin-program-problems">
                <div className="admin-program-panel-head">
                  <h2>Ringkasan Status</h2>
                </div>

                <p>
                  <span>Draft</span>
                  <strong>
                    {workshops.filter((item) => item.status === 'Draft').length}
                  </strong>
                </p>

                <p>
                  <span>Terjadwal</span>
                  <strong>
                    {
                      workshops.filter((item) => item.status === 'Terjadwal')
                        .length
                    }
                  </strong>
                </p>

                <p>
                  <span>Terbit</span>
                  <strong>
                    {workshops.filter((item) => item.status === 'Terbit').length}
                  </strong>
                </p>

                <p>
                  <span>Selesai</span>
                  <strong>
                    {
                      workshops.filter((item) => item.status === 'Selesai')
                        .length
                    }
                  </strong>
                </p>
              </article>
            </section>

            <section className="admin-program-quick">
              <h2>Aksi Cepat</h2>

              <div>
                <a
                  href="/admin/tambah-workshop"
                  className="admin-program-primary"
                >
                  Buat Program Baru
                </a>

                <button type="button" onClick={loadWorkshops}>
                  Refresh Data SQLite
                </button>
              </div>
            </section>
          </section>
        </div>

        {isDetailModalOpen && selectedWorkshop && (
          <div
            className="admin-program-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-program-detail-title"
          >
            <button
              className="admin-program-detail-backdrop"
              type="button"
              aria-label="Tutup detail program"
              onClick={() => setDetailModalOpen(false)}
            />

            <article className="admin-program-detail" aria-label="Detail program">
              <div className="admin-program-detail-head">
                <h2 id="admin-program-detail-title">Detail Program</h2>

                <button
                  type="button"
                  aria-label="Tutup detail"
                  onClick={() => setDetailModalOpen(false)}
                >
                  x
                </button>
              </div>

              <div className="admin-program-detail-profile">
                <WorkshopImage workshop={selectedWorkshop} className="admin-program-detail-image" />

                <h3>{selectedWorkshop.title}</h3>

                <ProgramBadge>{selectedWorkshop.status}</ProgramBadge>

                <p>{selectedWorkshop.summary}</p>

                <ProgramBadge>{selectedWorkshop.category}</ProgramBadge>
              </div>

              <dl>
                <dt>
                  <img src={clockIcon} alt="" />
                  Tanggal & Waktu
                </dt>
                <dd>
                  {formatSchedule(selectedWorkshop)}
                  {selectedWorkshop.timezone
                    ? ` ${selectedWorkshop.timezone}`
                    : ''}
                </dd>

                <dt>
                  <img src={mapIcon} alt="" />
                  Metode
                </dt>
                <dd>{selectedWorkshop.type}</dd>

                <dt>
                  <img src={arrowIcon} alt="" />
                  Link / Lokasi
                </dt>
                <dd>{selectedWorkshop.location}</dd>

                <dt>
                  <img src={bookIcon} alt="" />
                  Level / Durasi
                </dt>
                <dd>
                  {selectedWorkshop.level} / {selectedWorkshop.duration}
                </dd>

                <dt>
                  <img src={bookIcon} alt="" />
                  Platform
                </dt>
                <dd>{selectedWorkshop.platform}</dd>

                <dt>
                  <img src={usersIcon} alt="" />
                  Harga
                </dt>
                <dd>{formatPrice(selectedWorkshop.price)}</dd>
              </dl>

              <section className="admin-program-description">
                <h3>Deskripsi Singkat</h3>
                <p>{selectedWorkshop.summary}</p>
              </section>

              <section className="admin-program-description">
                <h3>Tentang Workshop</h3>
                <p>{selectedWorkshop.about || '-'}</p>
              </section>

              <div className="admin-program-detail-actions">
                <button
                  type="button"
                  className="is-blue"
                  onClick={() => handleEditWorkshop(selectedWorkshop)}
                >
                  Edit Program
                </button>

                <button
                  type="button"
                  className="is-danger"
                  onClick={() => handleDeleteWorkshop(selectedWorkshop)}
                  disabled={deletingId === selectedWorkshop.id}
                >
                  {deletingId === selectedWorkshop.id ? 'Menghapus...' : 'Hapus Program'}
                </button>
              </div>
            </article>
          </div>
        )}
      </section>
    </main>
  );
}
