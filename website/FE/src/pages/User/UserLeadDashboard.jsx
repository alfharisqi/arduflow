import { useEffect, useMemo, useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import { DashboardUserSidebarIcon } from './userSidebarIcons.jsx';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import { ProfileAvatar } from '../../features/profile-image-crop/ProfileAvatar.jsx';
import { fetchUserLeadHistory } from '../../features/leads/leadApi.js';
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';

const menuItems = [
  { label: 'Profil', icon: 'user', href: '/dashboard' },
  { label: 'Progres Belajar', icon: 'graduation', href: '/progress-belajar' },
  { label: 'Proyek Saya', icon: 'folder', href: '/proyek-saya' },
  { label: 'Workshop / Program', icon: 'calendar', href: '/workshop-program' },
  { label: 'Lead Saya', icon: 'lead', href: '/lead-saya', active: true },
  { label: 'Partner Saya', icon: 'partner', href: '/partner-saya' },
  { label: 'Transaksi', icon: 'transaction', href: '/transaksi' },
  { label: 'Sertifikat', icon: 'certificate', href: '/sertifikat' },
  { label: 'IDE', icon: 'cpu', href: '/ide-saya' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
];

const categoryLabels = {
  lead: 'Kontak',
  collaboration: 'Kolaborasi',
  workshop: 'Workshop',
};

function getStoredUser() {
  try {
    const raw = window.localStorage.getItem('arduflow_user');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function formatHistoryDate(value, fallback) {
  if (fallback && fallback !== '-') {
    return fallback;
  }

  const date = new Date(value || '');

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatMetaLabel(key) {
  const labels = {
    institution_name: 'Institusi',
    institution_type: 'Jenis Institusi',
    participant_estimate: 'Estimasi Peserta',
    demo_schedule: 'Jadwal Demo',
    description: 'Deskripsi',
    proposal_file_name: 'Proposal',
    workshop_id: 'ID Workshop',
    transaction_id: 'ID Transaksi',
    workshop_choice: 'Pilihan Workshop',
    member_names: 'Nama Peserta',
  };

  return labels[key] || key.replace(/_/g, ' ');
}

function visibleMetaEntries(meta = {}) {
  return Object.entries(meta).filter(([key, value]) => {
    if (key.endsWith('_url') || key.endsWith('_type') || key.endsWith('_size')) {
      return false;
    }

    return value !== null && value !== undefined && String(value).trim() !== '';
  });
}

export function UserLeadDashboard() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const [leads, setLeads] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    formTypeCounts: {},
    statusCounts: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);

  const user = getStoredUser();
  const fullName = user.name || user.fullName || user.full_name || 'Nama Lengkap';
  const greetingName = user.nickname || user.username || fullName;
  const email = user.email || '';
  const profileImage = user.profileImage || user.profile_image || user.avatar || '';

  async function loadHistory() {
    if (!email) {
      setLeads([]);
      setSummary({
        total: 0,
        formTypeCounts: {},
        statusCounts: {},
      });
      setError('Email akun belum tersedia. Lengkapi profil terlebih dahulu.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await fetchUserLeadHistory(email);
      setLeads(Array.isArray(data.leads) ? data.leads : []);
      setSummary({
        total: Number(data.total || 0),
        formTypeCounts: data.form_type_counts || {},
        statusCounts: data.status_counts || {},
      });
    } catch (loadError) {
      setLeads([]);
      setError(loadError.message || 'History lead gagal dimuat.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, [email]);

  const latestLead = leads[0] || null;

  const displayedLeads = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filteredByType = filterType === 'all'
      ? leads
      : leads.filter((lead) => lead.form_type === filterType);

    if (!query) return filteredByType;

    return filteredByType.filter((lead) => {
      const metaText = visibleMetaEntries(lead.meta)
        .map(([key, value]) => `${formatMetaLabel(key)} ${value}`)
        .join(' ');

      return [
        categoryLabels[lead.form_type],
        lead.form_type,
        lead.topic,
        lead.message_short,
        lead.message,
        lead.status,
        lead.name,
        lead.email,
        lead.whatsapp,
        formatHistoryDate(lead.created_at, lead.created_at_label),
        metaText,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [filterType, leads, searchTerm]);

  const statusText = Object.entries(summary.statusCounts || {})
    .map(([status, count]) => `${status}: ${count}`)
    .join(', ');

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

  return (
    <div className={`dashboard-user-page user-leads-page${isSidebarCollapsed ? ' dashboard-user-page--collapsed' : ''}`}>
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
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__user">
            <button className="dashboard-notification" type="button" aria-label="Notifikasi">
              <img src={bellIcon} alt="" aria-hidden="true" />
            </button>
            <ProfileAvatar className="dashboard-mini-avatar" image={profileImage} name={fullName} />
            <strong>{fullName}</strong>
          </div>
        </header>

        <main className="dashboard-content user-leads-content">
          <div className="dashboard-user-greeting">
            <h1>Lead Saya</h1>
            <span>{greetingName}</span>
          </div>

          <section className="user-leads-hero" aria-labelledby="user-leads-title">
            <div>
              <span>Dashboard Lead</span>
              <h2 id="user-leads-title">History kontak, kolaborasi, dan workshop yang kamu kirim</h2>
              <p>{email || 'Email user belum tersedia'}</p>
            </div>
            <button type="button" onClick={loadHistory} disabled={isLoading}>
              {isLoading ? 'Memuat...' : 'Refresh'}
            </button>
          </section>

          <section className="user-leads-stats" aria-label="Ringkasan lead user">
            <article>
              <span>Total Lead</span>
              <strong>{summary.total}</strong>
              <small>{statusText || 'Belum ada status'}</small>
            </article>
            <article>
              <span>Kontak</span>
              <strong>{summary.formTypeCounts?.lead || 0}</strong>
              <small>Form lead umum</small>
            </article>
            <article>
              <span>Kolaborasi</span>
              <strong>{summary.formTypeCounts?.collaboration || 0}</strong>
              <small>Partner dan demo</small>
            </article>
            <article>
              <span>Workshop</span>
              <strong>{summary.formTypeCounts?.workshop || 0}</strong>
              <small>Pendaftaran program</small>
            </article>
          </section>

          <section className="user-leads-history" aria-labelledby="user-leads-history-title">
            <div className="user-leads-section-head">
              <div>
                <h2 id="user-leads-history-title">History Lead Terkirim</h2>
                <p>
                  {latestLead
                    ? `Terakhir dikirim: ${formatHistoryDate(latestLead.created_at, latestLead.created_at_label)}`
                    : 'Belum ada lead yang tercatat untuk email ini.'}
                </p>
              </div>

              <div className="user-leads-table-controls">
                <label className="user-leads-search">
                  <span className="sr-only">Cari history lead</span>
                  <input
                    type="search"
                    placeholder="Cari lead"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </label>

                <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
                  <option value="all">Semua kategori</option>
                  <option value="lead">Kontak</option>
                  <option value="collaboration">Kolaborasi</option>
                  <option value="workshop">Workshop</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <p className="user-leads-empty">Memuat history lead...</p>
            ) : error ? (
              <p className="user-leads-empty">{error}</p>
            ) : displayedLeads.length === 0 ? (
              <p className="user-leads-empty">Belum ada lead pada kategori ini.</p>
            ) : (
              <div className="user-leads-table" role="table" aria-label="History lead user">
                <div className="user-leads-table__head" role="row">
                  <span>Kategori</span>
                  <span>Topik</span>
                  <span>Pesan</span>
                  <span>Status</span>
                  <span>Tanggal</span>
                  <span>Aksi</span>
                </div>

                {displayedLeads.map((lead) => (
                  <div className="user-leads-table__row" role="row" key={lead.id}>
                    <span>
                      <b className={`user-leads-pill user-leads-pill--${lead.form_type}`}>
                        {categoryLabels[lead.form_type] || lead.form_type || '-'}
                      </b>
                    </span>
                    <strong>{lead.topic || '-'}</strong>
                    <p>{lead.message_short || lead.message || '-'}</p>
                    <span>{lead.status || '-'}</span>
                    <time>{formatHistoryDate(lead.created_at, lead.created_at_label)}</time>
                    <button type="button" onClick={() => setSelectedLead(lead)}>
                      Detail
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </section>

      {selectedLead ? (
        <div
          className="user-leads-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-leads-detail-title"
          onClick={() => setSelectedLead(null)}
        >
          <aside className="user-leads-detail" onClick={(event) => event.stopPropagation()}>
            <header className="user-leads-detail__head">
              <div>
                <span>{categoryLabels[selectedLead.form_type] || selectedLead.form_type || 'Lead'}</span>
                <h2 id="user-leads-detail-title">{selectedLead.topic || 'Detail Lead'}</h2>
                <p>{formatHistoryDate(selectedLead.created_at, selectedLead.created_at_label)}</p>
              </div>
              <button type="button" aria-label="Tutup detail lead" onClick={() => setSelectedLead(null)}>
                &times;
              </button>
            </header>

            <section className="user-leads-detail__summary">
              <article>
                <span>Status</span>
                <strong>{selectedLead.status || '-'}</strong>
              </article>
              <article>
                <span>Nama</span>
                <strong>{selectedLead.name || '-'}</strong>
              </article>
              <article>
                <span>Email</span>
                <strong>{selectedLead.email || '-'}</strong>
              </article>
              <article>
                <span>WhatsApp</span>
                <strong>{selectedLead.whatsapp || '-'}</strong>
              </article>
            </section>

            <section className="user-leads-detail__section">
              <h3>Pesan</h3>
              <p>{selectedLead.message || '-'}</p>
            </section>

            <section className="user-leads-detail__section">
              <h3>Detail Tambahan</h3>
              {visibleMetaEntries(selectedLead.meta).length > 0 ? (
                <dl className="user-leads-detail__meta">
                  {visibleMetaEntries(selectedLead.meta).map(([key, value]) => (
                    <div key={key}>
                      <dt>{formatMetaLabel(key)}</dt>
                      <dd>{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p>Belum ada detail tambahan.</p>
              )}
            </section>

            {selectedLead.meta?.proposal_file_url ? (
              <a
                className="user-leads-detail__proposal"
                href={selectedLead.meta.proposal_file_url}
                target="_blank"
                rel="noreferrer"
              >
                Lihat Proposal PDF
              </a>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
