import { useEffect, useMemo, useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import { DashboardUserSidebarIcon } from './userSidebarIcons.jsx';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import { createTestimonial, fetchTestimonials, updateTestimonial } from '../../services/testimonialApi.js';
import { fetchTransactions } from '../../services/transactionApi.js';
import { fetchWorkshopDetail, fetchWorkshops, isPublicWorkshop } from '../../services/workshopApi.js';
import { UserDashboardTopbar } from './UserDashboardTopbar.jsx';
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';

const menuItems = [
  { label: 'Profil', icon: 'user', href: '/dashboard' },
  { label: 'Progres Belajar', icon: 'graduation', href: '/progress-belajar' },
  { label: 'Proyek Saya', icon: 'folder', href: '/proyek-saya' },
  { label: 'Workshop / Program', icon: 'calendar', href: '/workshop-program', active: true },
  { label: 'Lead Saya', icon: 'lead', href: '/lead-saya' },
  { label: 'Partner Saya', icon: 'partner', href: '/partner-saya' },
  { label: 'Transaksi', icon: 'transaction', href: '/transaksi' },
  { label: 'Sertifikat', icon: 'certificate', href: '/sertifikat' },
  { label: 'IDE', icon: 'cpu', href: '/ide-saya' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
];

function getStoredUser() {
  try {
    const raw = window.localStorage.getItem('arduflow_user');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function parseWorkshopDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatWorkshopDateTime(workshop) {
  const date = parseWorkshopDate(workshop.startsAt);
  const dateText = date
    ? new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date)
    : 'Tanggal belum diatur';
  return [dateText, workshop.timeText].filter(Boolean).join(' ');
}

function formatWorkshopDate(workshop) {
  const date = parseWorkshopDate(workshop.startsAt);
  if (!date) return 'Tanggal belum diatur';

  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatWorkshopPrice(value) {
  const number = Number(String(value ?? '').replace(/\D/g, ''));
  if (!Number.isFinite(number) || number <= 0) return 'Gratis';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number);
}

function getWorkshopStatus(workshop) {
  const rawStatus = String(workshop.status || '').toLowerCase();
  if (rawStatus.includes('selesai') || rawStatus.includes('completed')) return 'Selesai';

  const startsAt = parseWorkshopDate(workshop.startsAt);
  const endsAt = parseWorkshopDate(workshop.endsAt);
  const now = new Date();

  if (startsAt && startsAt > now) return 'Akan Datang';
  if (startsAt && (!endsAt || endsAt >= now)) return 'Sedang Berlangsung';
  if (endsAt && endsAt < now) return 'Selesai';
  if (rawStatus.includes('berlangsung') || rawStatus.includes('ongoing')) return 'Sedang Berlangsung';
  return 'Akan Datang';
}

function getWorkshopStatusClass(status) {
  if (status === 'Selesai') return 'done';
  if (status === 'Akan Datang') return 'upcoming';
  return 'live';
}

function getWorkshopMethodClass(method) {
  const value = String(method || '').toLowerCase();
  if (value.includes('offline')) return 'offline';
  if (value.includes('online')) return 'online';
  return 'online';
}

function getInitials(name) {
  return (name || 'Nama Lengkap')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const WORKSHOP_PAGE_SIZE = 8;

const WORKSHOP_FILTER_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'upcoming', label: 'Akan Datang' },
  { value: 'live', label: 'Berlangsung' },
  { value: 'done', label: 'Selesai' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
];

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function sanitizeWorkshopHtml(value) {
  return String(value || '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\s(href|src)=["']javascript:[^"']*["']/gi, '');
}

function splitDetailItems(value, fallback) {
  const items = String(value || '')
    .split(/\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length ? items : fallback;
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function testimonialKey(sourceType, sourceId) {
  return `${normalizeText(sourceType)}:${String(sourceId || '').trim()}`;
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2.2" />
      <path d="m20 20-3.8-3.8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M8 12h8M10 18h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function DetailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function UserWorkshopSchedule() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const [workshops, setWorkshops] = useState([]);
  const [isLoadingWorkshops, setIsLoadingWorkshops] = useState(true);
  const [workshopError, setWorkshopError] = useState('');
  const [workshopMessage, setWorkshopMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState('Relevance');
  const [filterMode, setFilterMode] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailMessage, setDetailMessage] = useState('');
  const [enabledNotificationIds, setEnabledNotificationIds] = useState(() => new Set());
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialTarget, setTestimonialTarget] = useState(null);
  const [testimonialForm, setTestimonialForm] = useState({ quote: '', role: '', rating: 5, consentPublic: true });
  const [testimonialError, setTestimonialError] = useState('');
  const [isSendingTestimonial, setSendingTestimonial] = useState(false);
  const user = getStoredUser();
  const fullName = user.name || user.fullName || 'Nama Lengkap';
  const greetingName = user.nickname || fullName;
  const profileImage = user.profileImage || user.avatar || '';
  const email = user.email || '';

  useEffect(() => {
    let isMounted = true;

    async function loadWorkshops() {
      setIsLoadingWorkshops(true);
      setWorkshopError('');
      try {
        const params = {};
        if (user.id || user.userId) params.userId = user.id || user.userId;
        if (user.email) params.email = user.email;

        if (!params.userId && !params.email) {
          setWorkshops([]);
          return;
        }

        const [workshopRecords, transactionRecords, testimonialPayload] = await Promise.all([
          fetchWorkshops(),
          fetchTransactions({ ...params, status: 'paid' }),
          params.email ? fetchTestimonials({ email: params.email }) : Promise.resolve({ testimonials: [] }),
        ]);
        if (isMounted) {
          const paidWorkshopTransactions = transactionRecords.filter(
            (transaction) => ['workshop', 'program', 'course'].includes(transaction.itemType) && transaction.status === 'paid'
          );
          const paidWorkshopIds = new Set(
            paidWorkshopTransactions
              .map((transaction) => String(transaction.itemId || ''))
              .filter(Boolean)
          );
          const paidWorkshopFallbacks = paidWorkshopTransactions
            .filter((transaction) => !transaction.itemId)
            .map((transaction) => ({
              id: `transaction-${transaction.id}`,
              title: transaction.itemTitle,
              method: transaction.paymentChannel || transaction.paymentMethod || 'Workshop',
              location: '',
              startsAt: transaction.paidAt || transaction.createdAt,
              timeText: '',
              status: 'Terdaftar',
            }));

          setWorkshops([
            ...workshopRecords.filter((workshop) => isPublicWorkshop(workshop) && paidWorkshopIds.has(String(workshop.id))),
            ...paidWorkshopFallbacks,
          ]);
          setTestimonials(Array.isArray(testimonialPayload?.testimonials) ? testimonialPayload.testimonials : []);
        }
      } catch (error) {
        if (isMounted) {
          setWorkshopError(error.message || 'Gagal memuat jadwal workshop.');
          setWorkshops([]);
          setTestimonials([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingWorkshops(false);
        }
      }
    }

    loadWorkshops();

    return () => {
      isMounted = false;
    };
  }, [user.email, user.id, user.userId]);

  const schedules = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filteredWorkshops = workshops.filter((workshop) => {
      const status = getWorkshopStatus(workshop);
      const methodClass = getWorkshopMethodClass(workshop.method || 'Online');
      if (filterMode === 'upcoming' && status !== 'Akan Datang') return false;
      if (filterMode === 'live' && status !== 'Sedang Berlangsung') return false;
      if (filterMode === 'done' && status !== 'Selesai') return false;
      if (filterMode === 'online' && methodClass !== 'online') return false;
      if (filterMode === 'offline' && methodClass !== 'offline') return false;
      if (!query) return true;
      return [workshop.title, workshop.category, workshop.method, workshop.location, workshop.meetingUrl]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });

    return [...filteredWorkshops].sort((left, right) => {
      if (sortMode === 'Terbaru') {
        return (parseWorkshopDate(right.startsAt)?.getTime() || 0) - (parseWorkshopDate(left.startsAt)?.getTime() || 0);
      }
      if (sortMode === 'Status') {
        return getWorkshopStatus(left).localeCompare(getWorkshopStatus(right));
      }
      return (parseWorkshopDate(left.startsAt)?.getTime() || 0) - (parseWorkshopDate(right.startsAt)?.getTime() || 0);
    });
  }, [filterMode, workshops, searchTerm, sortMode]);

  const totalPages = Math.max(1, Math.ceil(schedules.length / WORKSHOP_PAGE_SIZE));
  const visiblePages = useMemo(() => {
    const pages = [];
    const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
    const end = Math.min(totalPages, start + 2);

    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }

    return pages;
  }, [currentPage, totalPages]);

  const paginatedSchedules = useMemo(() => {
    const startIndex = (currentPage - 1) * WORKSHOP_PAGE_SIZE;
    return schedules.slice(startIndex, startIndex + WORKSHOP_PAGE_SIZE);
  }, [currentPage, schedules]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterMode, searchTerm, sortMode]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function handleLogout() {
    window.localStorage.removeItem('arduflow_user');
    window.localStorage.removeItem('arduflow_user_token');
    window.dispatchEvent(new Event('arduflow-auth-change'));
    window.location.assign('/signin');
  }

  function handleSidebarToggle() {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistSidebarCollapsed(nextValue);
      return nextValue;
    });
  }

  async function handleOpenDetail(schedule) {
    setSelectedWorkshop(schedule);
    setDetailError('');
    setDetailMessage('');
    setWorkshopMessage('');

    if (!schedule?.id || String(schedule.id).startsWith('transaction-')) return;

    setIsLoadingDetail(true);
    try {
      const detail = await fetchWorkshopDetail({ id: schedule.id });
      setSelectedWorkshop((current) => (current?.id === schedule.id ? { ...current, ...detail } : current));
    } catch (error) {
      setDetailError(error.message || 'Gagal memuat detail workshop.');
    } finally {
      setIsLoadingDetail(false);
    }
  }

  function handleCloseDetail() {
    setSelectedWorkshop(null);
    setDetailError('');
    setDetailMessage('');
    setIsLoadingDetail(false);
  }

  function openTestimonial(workshop) {
    const existingTestimonial = testimonialForWorkshop(workshop);
    setTestimonialTarget({ ...workshop, existingTestimonial });
    setTestimonialForm({
      quote: existingTestimonial?.quote || '',
      role: existingTestimonial?.role || '',
      rating: existingTestimonial?.rating || 5,
      consentPublic: existingTestimonial?.consentPublic ?? true,
    });
    setTestimonialError('');
    setWorkshopMessage('');
  }

  function closeTestimonial() {
    if (isSendingTestimonial) return;
    setTestimonialTarget(null);
    setTestimonialError('');
  }

  function updateTestimonialForm(field, value) {
    setTestimonialForm((current) => ({ ...current, [field]: value }));
  }

  function testimonialForWorkshop(workshop) {
    const key = testimonialKey('workshop', workshop?.id);
    return testimonials.find((testimonial) => testimonialKey(testimonial.sourceType, testimonial.sourceId) === key) || null;
  }

  async function handleTestimonialSubmit(event) {
    event.preventDefault();
    if (!testimonialTarget) return;

    const quote = testimonialForm.quote.trim();
    if (quote.length < 12) {
      setTestimonialError('Testimoni minimal 12 karakter.');
      return;
    }
    if (!testimonialForm.consentPublic) {
      setTestimonialError('Centang izin tampil agar testimoni bisa direview admin.');
      return;
    }

    setSendingTestimonial(true);
    setTestimonialError('');

    try {
      const existingTestimonial = testimonialTarget.existingTestimonial;
      const payload = {
        sourceType: 'workshop',
        sourceId: String(testimonialTarget.id || ''),
        userId: user.id || user.userId || '',
        name: fullName,
        email,
        role: testimonialForm.role || 'Peserta Workshop Arduflow',
        quote,
        rating: testimonialForm.rating,
        consentPublic: testimonialForm.consentPublic,
        status: 'Menunggu',
      };
      const result = existingTestimonial
        ? await updateTestimonial(existingTestimonial.id, payload)
        : await createTestimonial(payload);
      const savedTestimonial = result.testimonial || { ...payload, id: existingTestimonial?.id };
      setTestimonials((current) => {
        if (existingTestimonial) {
          return current.map((testimonial) => (testimonial.id === existingTestimonial.id ? savedTestimonial : testimonial));
        }
        return [savedTestimonial, ...current];
      });
      setTestimonialTarget(null);
      const successMessage = existingTestimonial ? 'Testimoni berhasil diperbarui dan menunggu review ulang admin.' : 'Testimoni berhasil dikirim dan menunggu review admin.';
      setDetailMessage(successMessage);
      setWorkshopMessage(successMessage);
    } catch (error) {
      setTestimonialError(error.message || 'Testimoni gagal dikirim.');
    } finally {
      setSendingTestimonial(false);
    }
  }

  function toggleNotification(scheduleId) {
    setEnabledNotificationIds((current) => {
      const next = new Set(current);
      const key = String(scheduleId || '');

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  const selectedStatus = selectedWorkshop ? getWorkshopStatus(selectedWorkshop) : '';
  const selectedMethod = selectedWorkshop?.method || 'Online';
  const selectedAboutHtml = sanitizeWorkshopHtml(selectedWorkshop?.about);
  const selectedAboutText = stripHtml(selectedAboutHtml || selectedWorkshop?.description || selectedWorkshop?.summary);
  const selectedFacilities = splitDetailItems(selectedWorkshop?.facilities, [
    'Materi praktik sesuai program workshop',
    'Pendampingan selama sesi berlangsung',
    'Sertifikat atau e-certificate jika tersedia',
  ]);
  const selectedBringItems = splitDetailItems(selectedWorkshop?.bringItems, [
    'Laptop pribadi',
    'Koneksi internet yang stabil untuk sesi online',
    'Catatan atau alat tulis untuk merangkum materi',
  ]);
  const selectedMeetingUrl = selectedWorkshop?.meetingUrl || '';

  return (
    <div className={`dashboard-user-page user-workshop-page${isSidebarCollapsed ? ' dashboard-user-page--collapsed' : ''}`}>
      <aside className="dashboard-sidebar" aria-label="Dashboard sidebar">
        <a className="dashboard-sidebar__brand" href="/" aria-label="Kembali ke beranda">
          <span>ARDU</span>
          <strong>FLOW</strong>
        </a>
        <button
          className="dashboard-sidebar__collapse"
          type="button"
          aria-expanded={!isSidebarCollapsed}
          aria-label={isSidebarCollapsed ? 'Buka sidebar' : 'Minimize sidebar'}
          onClick={handleSidebarToggle}
        >
          <img src={arrowDownIcon} alt="" aria-hidden="true" />
        </button>

        <nav className="dashboard-sidebar__nav">
          {menuItems.map((item) => (
            <a
              className={`dashboard-sidebar__item${item.active ? ' dashboard-sidebar__item--active' : ''}`}
              href={item.href}
              key={item.label}
            >
              <DashboardUserSidebarIcon name={item.icon} />
              <span>{item.label}</span>
            </a>
          ))}
          <button className="dashboard-sidebar__item dashboard-sidebar__item--logout" type="button" onClick={handleLogout}>
            <img className="dashboard-sidebar__logout-icon" src={logoutIcon} alt="" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <section className="dashboard-shell">
        <UserDashboardTopbar fullName={fullName} profileImage={profileImage} />

        <main className="dashboard-content user-workshop-content">
          <div className="dashboard-user-greeting">
            <h1>Hello {greetingName}</h1>
            <span aria-hidden="true">&#128075;&#127995;</span>
          </div>

          <section className="user-workshop-panel" aria-labelledby="workshop-schedule-title">
            <div className="user-workshop-header">
              <h2 id="workshop-schedule-title">Jadwal Workshop / Program kamu</h2>
              <div className="user-workshop-toolbar">
                <label className="user-workshop-search">
                  <span className="sr-only">Cari workshop</span>
                  <input type="search" placeholder="Cari" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
                  <SearchIcon />
                </label>

                <div className="user-workshop-controls">
                  <div className="user-workshop-sort">
                    <span>Urutkan</span>
                    <select value={sortMode} aria-label="Urutkan workshop" onChange={(event) => setSortMode(event.target.value)}>
                      <option>Relevance</option>
                      <option>Terbaru</option>
                      <option>Status</option>
                    </select>
                  </div>
                  <label className="user-workshop-filter">
                    <span className="sr-only">Filter workshop</span>
                    <FilterIcon />
                    <select value={filterMode} aria-label="Filter workshop" onChange={(event) => setFilterMode(event.target.value)}>
                      {WORKSHOP_FILTER_OPTIONS.map((option) => (
                        <option value={option.value} key={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>

            {workshopMessage ? <p className="user-workshop-message">{workshopMessage}</p> : null}

            <div className="user-workshop-table" role="table" aria-label="Jadwal Workshop dan Program kamu">
              <div className="user-workshop-table__head" role="row">
                <span>Nama Workshop</span>
                <span>Metode</span>
                <span>Lokasi Kegiatan</span>
                <span>Waktu</span>
                <span>Status</span>
                <span>Notif</span>
                <span>Aksi</span>
              </div>
              {isLoadingWorkshops ? (
                <div className="user-workshop-table__row user-workshop-table__row--state" role="row">
                  <span>Memuat jadwal workshop...</span>
                </div>
              ) : workshopError ? (
                <div className="user-workshop-table__row user-workshop-table__row--state" role="row">
                  <span>{workshopError}</span>
                </div>
              ) : schedules.length === 0 ? (
                <div className="user-workshop-table__row user-workshop-table__row--state" role="row">
                  <span>Belum ada workshop yang sudah aktif. Workshop akan muncul setelah pembayaran disetujui admin.</span>
                </div>
              ) : (
                paginatedSchedules.map((schedule) => {
                  const status = getWorkshopStatus(schedule);
                  const method = schedule.method || 'Online';
                  const notificationKey = String(schedule.id || '');
                  const isNotificationActive = enabledNotificationIds.has(notificationKey);
                  return (
                    <div className="user-workshop-table__row" role="row" key={schedule.id}>
                      <span>{schedule.title || 'Workshop tanpa judul'}</span>
                      <span>
                        <b className={`user-workshop-pill user-workshop-pill--${getWorkshopMethodClass(method)}`}>
                          {method}
                        </b>
                      </span>
                      <span>{schedule.meetingUrl || schedule.location || '-'}</span>
                      <time>{formatWorkshopDateTime(schedule)}</time>
                      <span>
                        <b className={`user-workshop-pill user-workshop-pill--${getWorkshopStatusClass(status)}`}>
                          {status}
                        </b>
                      </span>
                      <span className="user-workshop-table__action-cell">
                        <button
                          className={`user-workshop-notif${isNotificationActive ? ' user-workshop-notif--active' : ''}`}
                          type="button"
                          aria-pressed={isNotificationActive}
                          aria-label={`${isNotificationActive ? 'Matikan' : 'Aktifkan'} notifikasi ${schedule.title || 'workshop'}`}
                          onClick={() => toggleNotification(schedule.id)}
                        >
                          <img src={bellIcon} alt="" aria-hidden="true" />
                        </button>
                      </span>
                      <span className="user-workshop-table__action-cell">
                        <span className="user-workshop-row-actions">
                          <button
                            className="user-workshop-detail-button"
                            type="button"
                            aria-label={`Lihat detail ${schedule.title || 'workshop'}`}
                            onClick={() => handleOpenDetail(schedule)}
                          >
                            <DetailIcon />
                            <span>Detail</span>
                          </button>
                          <button
                            className="user-workshop-testimonial-mini"
                            type="button"
                            aria-label={`${testimonialForWorkshop(schedule) ? 'Edit' : 'Berikan'} testimoni ${schedule.title || 'workshop'}`}
                            onClick={() => openTestimonial(schedule)}
                          >
                            {testimonialForWorkshop(schedule) ? 'Edit Testimoni' : 'Testimoni'}
                          </button>
                        </span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <nav className="user-workshop-pagination" aria-label="Pagination jadwal workshop">
              <button
                type="button"
                aria-label="Halaman sebelumnya"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                &lsaquo;
              </button>
              {visiblePages.map((page) => (
                <button
                  className={page === currentPage ? 'user-workshop-pagination__active' : ''}
                  type="button"
                  aria-current={page === currentPage ? 'page' : undefined}
                  key={page}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                aria-label="Halaman berikutnya"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                &rsaquo;
              </button>
            </nav>
          </section>
        </main>
      </section>

      {selectedWorkshop && (
        <div className="user-workshop-detail-overlay" role="presentation" onClick={handleCloseDetail}>
          <aside
            className="user-workshop-detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-workshop-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="user-workshop-detail__head">
              <div>
                <span>Detail Workshop</span>
                <h2 id="user-workshop-detail-title">{selectedWorkshop.title || 'Workshop tanpa judul'}</h2>
              </div>
              <button type="button" aria-label="Tutup detail workshop" onClick={handleCloseDetail}>
                <CloseIcon />
              </button>
            </div>

            {selectedWorkshop.coverImageUrl && (
              <img className="user-workshop-detail__cover" src={selectedWorkshop.coverImageUrl} alt={selectedWorkshop.title || 'Cover workshop'} />
            )}

            {isLoadingDetail && <p className="user-workshop-detail__state">Memuat detail terbaru...</p>}
            {detailMessage && <p className="user-workshop-detail__success">{detailMessage}</p>}
            {detailError && <p className="user-workshop-detail__error">{detailError}</p>}

            <div className="user-workshop-detail__meta">
              <article>
                <small>Metode</small>
                <b className={`user-workshop-pill user-workshop-pill--${getWorkshopMethodClass(selectedMethod)}`}>{selectedMethod}</b>
              </article>
              <article>
                <small>Status</small>
                <b className={`user-workshop-pill user-workshop-pill--${getWorkshopStatusClass(selectedStatus)}`}>{selectedStatus}</b>
              </article>
              <article>
                <small>Tanggal</small>
                <strong>{formatWorkshopDate(selectedWorkshop)}</strong>
              </article>
              <article>
                <small>Waktu</small>
                <strong>{[selectedWorkshop.timeText, selectedWorkshop.timezone].filter(Boolean).join(' ') || '-'}</strong>
              </article>
              <article>
                <small>Lokasi</small>
                <strong>{selectedWorkshop.location || '-'}</strong>
              </article>
              <article>
                <small>Biaya</small>
                <strong>{formatWorkshopPrice(selectedWorkshop.registrationFee ?? selectedWorkshop.price)}</strong>
              </article>
            </div>

            {selectedMeetingUrl && (
              <a className="user-workshop-detail__meeting" href={selectedMeetingUrl} target="_blank" rel="noreferrer">
                Buka Link Meeting
              </a>
            )}

            <button className="user-workshop-testimonial-button" type="button" onClick={() => openTestimonial(selectedWorkshop)}>
              {testimonialForWorkshop(selectedWorkshop) ? 'Edit Testimoni' : 'Berikan Testimoni'}
            </button>

            <section className="user-workshop-detail__section">
              <h3>Tentang Workshop</h3>
              {selectedAboutHtml ? (
                <div className="user-workshop-detail__rich-text" dangerouslySetInnerHTML={{ __html: selectedAboutHtml }} />
              ) : (
                <p>{selectedAboutText || 'Detail deskripsi workshop belum tersedia.'}</p>
              )}
            </section>

            <section className="user-workshop-detail__grid">
              <div className="user-workshop-detail__section">
                <h3>Fasilitas</h3>
                <ul>
                  {selectedFacilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="user-workshop-detail__section">
                <h3>Yang Perlu Dibawa</h3>
                <ul>
                  {selectedBringItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
          </aside>
        </div>
      )}

      {testimonialTarget && (
        <div className="user-workshop-detail-overlay" role="presentation" onClick={closeTestimonial}>
          <aside
            className="user-workshop-detail user-workshop-testimonial"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-workshop-testimonial-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="user-workshop-detail__head">
              <div>
                <span>{testimonialTarget.existingTestimonial ? 'Edit Testimoni Workshop' : 'Testimoni Workshop'}</span>
                <h2 id="user-workshop-testimonial-title">{testimonialTarget.title || 'Workshop Arduflow'}</h2>
              </div>
              <button type="button" aria-label="Tutup form testimoni workshop" onClick={closeTestimonial}>
                <CloseIcon />
              </button>
            </div>

            {testimonialError && <p className="user-workshop-detail__error">{testimonialError}</p>}

            <form className="user-workshop-testimonial-form" onSubmit={handleTestimonialSubmit}>
              <label>
                <span>Peran / Instansi</span>
                <input
                  value={testimonialForm.role}
                  onChange={(event) => updateTestimonialForm('role', event.target.value)}
                  placeholder="Siswa, guru, mahasiswa, komunitas"
                />
              </label>
              <label>
                <span>Rating</span>
                <select
                  value={testimonialForm.rating}
                  onChange={(event) => updateTestimonialForm('rating', Number(event.target.value))}
                >
                  <option value="5">5 - Sangat puas</option>
                  <option value="4">4 - Puas</option>
                  <option value="3">3 - Cukup</option>
                  <option value="2">2 - Perlu perbaikan</option>
                  <option value="1">1 - Kurang puas</option>
                </select>
              </label>
              <label>
                <span>Isi Testimoni</span>
                <textarea
                  value={testimonialForm.quote}
                  onChange={(event) => updateTestimonialForm('quote', event.target.value)}
                  rows="6"
                  placeholder="Ceritakan pengalaman mengikuti workshop atau program"
                  required
                />
              </label>
              <label className="user-workshop-consent">
                <input
                  type="checkbox"
                  checked={testimonialForm.consentPublic}
                  onChange={(event) => updateTestimonialForm('consentPublic', event.target.checked)}
                />
                <span>Saya mengizinkan testimoni ini tampil di halaman publik Arduflow setelah disetujui admin.</span>
              </label>
              <div className="user-workshop-testimonial-actions">
                <button type="button" className="is-secondary" onClick={closeTestimonial} disabled={isSendingTestimonial}>Batal</button>
                <button type="submit" disabled={isSendingTestimonial}>
                  {isSendingTestimonial ? 'Menyimpan...' : testimonialTarget.existingTestimonial ? 'Simpan Edit Testimoni' : 'Kirim Testimoni'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
