import { useEffect, useState } from 'react';
import { AdminPage, AdminTopbar, createSlug } from './AdminChrome.jsx';
import { getAdminDashboard } from '../../services/authApi.js';
import { apiUrl } from '../../services/apiEndpoints.js';
import userIcon from '../../assets/icons/icon-user-2.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import mailIcon from '../../assets/icons/icon-mail-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import cpuIcon from '../../assets/icons/icon-cpu-1.svg';
import messageIcon from '../../assets/icons/icon-message-square-1.svg';
import databaseIcon from '../../assets/icons/icons-database-1.svg';

const metricIcons = {
  users: usersIcon,
  activeUsers: userIcon,
  unverifiedUsers: mailIcon,
  workshopsPrograms: clockIcon,
  projects: cpuIcon,
  leads: messageIcon,
};

function getStoredAdmin() {
  try {
    return JSON.parse(window.localStorage.getItem('arduflow_admin') || 'null');
  } catch {
    return null;
  }
}

function formatMetricValue(value) {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('id-ID').format(value);
  }
  return value || '0';
}

function timeAgo(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return 'baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function AdminMetricCard({ item }) {
  return (
    <article className="admin-metric-card">
      <div className="admin-metric-head">
        <span className="admin-metric-icon">
          <img src={item.icon} alt="" />
        </span>
        <span>{item.label}</span>
      </div>
      <strong>{item.value}</strong>
      <p className={item.positive === false ? 'is-down' : 'is-up'}>
        {item.positive === false ? '↓' : item.positive ? '↑' : ''}
        {item.positive === undefined ? item.trend : ` ${item.trend}`}
      </p>
    </article>
  );
}

function StatusBadge({ children }) {
  return <span className={`admin-badge admin-badge--${createSlug(children)}`}>{children}</span>;
}

function isSystemOnline(item) {
  if (typeof item.online === 'boolean') {
    return item.online;
  }
  return String(item.status || '').toLowerCase() === 'online';
}

function EmptyState({ children }) {
  return <p className="admin-empty-state">{children}</p>;
}

function resolveMediaUrl(value) {
  const url = String(value || '').trim();

  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;

  return apiUrl(url);
}

function ContentThumbnail({ item }) {
  const imageUrl = resolveMediaUrl(item.imageUrl);

  if (!imageUrl) {
    return <span className="admin-image-placeholder" aria-hidden="true" />;
  }

  return (
    <span className="admin-content-thumb">
      <img src={imageUrl} alt={item.title ? `Gambar ${item.title}` : ''} loading="lazy" />
    </span>
  );
}

function getInitials(value) {
  const words = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return 'NA';

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || '')
    .join('');
}

function ActivityAvatar({ item }) {
  const avatarUrl = resolveMediaUrl(item.avatarUrl);
  const label = item.actorName || item.detail || item.title;

  if (avatarUrl) {
    return (
      <span className="admin-activity-avatar">
        <img src={avatarUrl} alt="" loading="lazy" />
      </span>
    );
  }

  return (
    <span className="admin-activity-avatar admin-activity-avatar--initials" aria-hidden="true">
      {getInitials(label)}
    </span>
  );
}

export function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardError, setDashboardError] = useState('');
  const [activeContentTab, setActiveContentTab] = useState('tutorials');

  useEffect(() => {
    let isMounted = true;

    getAdminDashboard()
      .then((data) => {
        if (!isMounted) return;
        setDashboardData(data);
        setDashboardError('');
      })
      .catch((error) => {
        if (!isMounted) return;
        setDashboardError(error.message || 'Gagal memuat data dashboard admin.');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const storedAdmin = getStoredAdmin();
  const admin = dashboardData?.admin || storedAdmin || {};
  const metricItems = (dashboardData?.metrics || []).map((item) => ({
    ...item,
    value: formatMetricValue(item.value),
    icon: metricIcons[item.id] || usersIcon,
  }));
  const activityItems = dashboardData?.activities || [];
  const verificationItems = dashboardData?.verificationRows || [];
  const workshopItems = dashboardData?.workshopRows || [];
  const leadItems = dashboardData?.leads || [];
  const contentTabs = [
    { id: 'tutorials', label: 'Tutorial Terbaru', empty: 'Belum ada tutorial tersimpan.' },
    { id: 'projects', label: 'Proyek Terbaru', empty: 'Belum ada proyek tersimpan.' },
    { id: 'drafts', label: 'Draft Belum Publish', empty: 'Belum ada draft yang belum dipublish.' },
  ];
  const activeContent = contentTabs.find((tab) => tab.id === activeContentTab) || contentTabs[0];
  const contentItems = dashboardData?.content?.[activeContent.id] || [];
  const systemItems = dashboardData?.system || [];
  const logItems = dashboardData?.logs || [];

  return (
    <AdminPage ariaLabel="Admin dashboard">
        <AdminTopbar
          searchPlaceholder="Cari data admin"
          searchLabel="Cari data admin"
          adminName={admin.name || 'Admin'}
          adminRole={admin.role || 'Super Admin'}
        />

        <div className="admin-dashboard-content">
          <div className="admin-dashboard-titlebar">
            <div>
              <h1>Dashboard</h1>
              {dashboardError ? <p className="admin-dashboard-error">{dashboardError}</p> : null}
            </div>
            <button type="button">Data real-time</button>
          </div>

          <section className="admin-metrics" aria-label="Ringkasan dashboard">
            {metricItems.length ? (
              metricItems.map((item) => (
                <AdminMetricCard item={item} key={item.label} />
              ))
            ) : (
              <p className="admin-empty-state admin-empty-state--wide">Memuat ringkasan dashboard...</p>
            )}
          </section>

          <section className="admin-dashboard-grid">
            <article className="admin-panel admin-panel--activity">
              <div className="admin-panel-head">
                <h2>Aktivitas Terbaru</h2>
              </div>
              <div className="admin-activity-list">
                {activityItems.length ? (
                  activityItems.map((item) => (
                    <div className="admin-activity-item" key={`${item.title}-${item.detail}-${item.time}`}>
                      <ActivityAvatar item={item} />
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                      </span>
                      <time>{timeAgo(item.time)}</time>
                    </div>
                  ))
                ) : (
                  <EmptyState>Belum ada aktivitas terbaru.</EmptyState>
                )}
              </div>
              <button className="admin-panel-button" type="button">Lihat semua aktivitas</button>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-head">
                <h2>Workshop / Program Mendatang</h2>
                <button type="button">Lihat semua</button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr><th>Program</th><th>Tanggal</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {workshopItems.length ? (
                    workshopItems.map((row) => (
                      <tr key={`${row.program}-${row.date}`}>
                        <td>{row.program}</td>
                        <td>{row.date}</td>
                        <td><StatusBadge>{row.status}</StatusBadge></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3">Belum ada workshop atau program mendatang.</td></tr>
                  )}
                </tbody>
              </table>
              <button className="admin-panel-button" type="button">Kelola workshop / program</button>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-head">
                <h2>Verifikasi Akun</h2>
                <button type="button">Lihat semua</button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr><th>Email</th><th>Tanggal</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {verificationItems.length ? (
                    verificationItems.map((row) => (
                      <tr key={`${row.no}-${row.email}`}>
                        {/* <td>{row.name}</td> */}
                        <td>{row.email}</td>
                        <td>{row.date}</td>
                        <td><StatusBadge>{row.status}</StatusBadge></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5">Tidak ada akun yang menunggu verifikasi.</td></tr>
                  )}
                </tbody>
              </table>
              <button className="admin-panel-button" type="button">Kelola verifikasi akun</button>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-head">
                <h2>Konten</h2>
              </div>
              <div className="admin-content-tabs">
                {contentTabs.map((tab) => (
                  <button
                    type="button"
                    className={tab.id === activeContent.id ? 'is-active' : ''}
                    onClick={() => setActiveContentTab(tab.id)}
                    key={tab.id}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {contentItems.length ? (
                contentItems.map((item) => (
                  <div className="admin-content-item" key={`${item.type}-${item.title}-${item.createdAt || item.date}`}>
                    <ContentThumbnail item={item} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>
                        {item.type ? `${item.type} - ` : ''}
                        {item.statusLabel ? `${item.statusLabel} - ` : ''}
                        {item.date}
                      </small>
                    </span>
                    <button type="button">Lihat</button>
                  </div>
                ))
              ) : (
                <EmptyState>{activeContent.empty}</EmptyState>
              )}
              <button className="admin-panel-button" type="button">Kelola konten</button>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-head">
                <h2>Lead / Kontak Terbaru</h2>
                <button type="button">Lihat semua</button>
              </div>
              <table className="admin-table">
                <thead>
                  <tr><th>Nama</th><th>Topik</th><th>Tanggal</th></tr>
                </thead>
                <tbody>
                  {leadItems.length ? (
                    leadItems.map((row, index) => (
                      <tr key={`${row.email}-${row.topic}-${row.date}-${index}`}>
                        <td>{row.name}</td>
                        <td>{row.topic}</td>
                        <td>{row.date}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4">Belum ada lead atau kontak masuk.</td></tr>
                  )}
                </tbody>
              </table>
              <button className="admin-panel-button" type="button">Kelola lead / kontak</button>
            </article>
          </section>

          <section className="admin-bottom-grid">
            <article className="admin-panel admin-system-panel">
              <div className="admin-panel-head">
                <h2>Sistem</h2>
              </div>
              <div className="admin-system-cards">
                {systemItems.length ? (
                  systemItems.map((item) => (
                    <div className="admin-system-card" key={item.title}>
                      <img src={item.title.includes('SMTP') ? mailIcon : databaseIcon} alt="" />
                      <strong>{item.title}</strong>
                      <span><i className={isSystemOnline(item) ? '' : 'is-offline'} /> {item.status}</span>
                      <small>{item.detail}</small>
                    </div>
                  ))
                ) : (
                  <EmptyState>Memuat status sistem...</EmptyState>
                )}
              </div>
            </article>

            <article className="admin-panel admin-log-panel">
              <div className="admin-panel-head">
                <h2>Log Error Terbaru</h2>
                <button type="button">Lihat semua log</button>
              </div>
              {logItems.length ? (
                logItems.map((item) => (
                  <div className="admin-log-row" key={`${item.level}-${item.message}-${item.time}`}>
                    <strong className={item.level === 'WARNING' ? 'is-warning' : ''}>{item.level}</strong>
                    <span>{item.message}</span>
                    <time>{timeAgo(item.time)}</time>
                  </div>
                ))
              ) : (
                <EmptyState>Belum ada log error terbaru.</EmptyState>
              )}
            </article>
          </section>
        </div>
    </AdminPage>
  );
}
