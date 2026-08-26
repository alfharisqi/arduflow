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

const metricRoutes = {
  users: '/admin/users',
  activeUsers: '/admin/users',
  unverifiedUsers: '/admin/verification',
  workshopsPrograms: '/admin/program',
  projects: '/admin/projects',
  leads: '/admin/leads',
};

function goTo(path) {
  if (!path) return;
  window.location.href = path;
}

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

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
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
  const route = metricRoutes[item.id];

  return (
    <article
      className={`admin-metric-card is-${item.id}${route ? ' admin-metric-card--clickable' : ''}`}
      role={route ? 'button' : undefined}
      tabIndex={route ? 0 : undefined}
      onClick={route ? () => goTo(route) : undefined}
      onKeyDown={route ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          goTo(route);
        }
      } : undefined}
    >
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

function contentManageRoute(tabId) {
  if (tabId === 'projects') return '/admin/projects';
  return '/admin/tutorial';
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

function QuickActionsPanel({ actions }) {
  return (
    <article className="admin-panel admin-quick-actions-panel">
      <div className="admin-panel-head">
        <h2>Quick Actions</h2>
      </div>
      <div className="admin-quick-actions">
        {actions.map((action) => (
          <button
            type="button"
            className={action.kind === 'primary' ? 'is-primary' : ''}
            onClick={() => goTo(action.route)}
            key={`${action.label}-${action.route}`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </article>
  );
}

function ActionQueuePanel({ items }) {
  return (
    <article className="admin-panel admin-action-queue-panel">
      <div className="admin-panel-head">
        <h2>Antrian Perlu Tindakan</h2>
      </div>
      <div className="admin-action-queue">
        {items.map((item) => (
          <button
            type="button"
            className={`admin-action-row is-${item.priority || 'normal'}`}
            onClick={() => goTo(item.route)}
            key={`${item.label}-${item.route}`}
          >
            <strong>{item.count}</strong>
            <span>
              <b>{item.label}</b>
              <small>{item.detail}</small>
            </span>
          </button>
        ))}
      </div>
    </article>
  );
}

function TransactionSummaryPanel({ summary }) {
  const items = [
    { label: 'Pending', value: summary.pending || 0 },
    { label: 'Berhasil', value: summary.paid || 0 },
    { label: 'Ditolak', value: summary.rejected || 0 },
    { label: 'Expired', value: summary.expired || 0 },
  ];

  return (
    <article className="admin-panel admin-transaction-summary-panel">
      <div className="admin-panel-head">
        <h2>Ringkasan Transaksi</h2>
        <button type="button" onClick={() => goTo('/admin/transactions')}>Kelola</button>
      </div>
      <div className="admin-transaction-summary">
        <div className="admin-transaction-revenue">
          <span>Total pendapatan</span>
          <strong>{formatCurrency(summary.revenue)}</strong>
          <small>{summary.reviewNeeded || 0} transaksi perlu review</small>
        </div>
        <div className="admin-transaction-stats">
          {items.map((item) => (
            <span key={item.label}>
              <b>{item.value}</b>
              <small>{item.label}</small>
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

const chartMetrics = [
  { id: 'users', label: 'User', className: 'is-users' },
  { id: 'logins', label: 'Login', className: 'is-logins' },
  { id: 'leads', label: 'Lead', className: 'is-leads' },
  { id: 'transactions', label: 'Transaksi', className: 'is-transactions' },
];

function getChartPoint(item, metricId, maxValue) {
  const value = Number(item?.[metricId] || 0);
  return Math.max(0, Math.min(100, 92 - (value / maxValue) * 84));
}

function ActivityChartPanel({ chart }) {
  const [chartType, setChartType] = useState('bar');
  const [activeMetrics, setActiveMetrics] = useState(() => chartMetrics.map((metric) => metric.id));
  const [showValues, setShowValues] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const visibleMetrics = chartMetrics.filter((metric) => activeMetrics.includes(metric.id));
  const detailDay = selectedDay || chart.at(-1) || null;
  const maxValue = Math.max(
    1,
    ...chart.flatMap((item) => visibleMetrics.map((metric) => Number(item[metric.id] || 0)))
  );

  const toggleMetric = (metricId) => {
    setActiveMetrics((current) => {
      if (current.includes(metricId)) {
        return current.length === 1 ? current : current.filter((item) => item !== metricId);
      }

      return [...current, metricId];
    });
  };

  const linePoints = (metricId) => chart
    .map((item, index) => {
      const x = chart.length <= 1 ? 50 : 5 + (index / (chart.length - 1)) * 90;
      const y = getChartPoint(item, metricId, maxValue);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <article className="admin-panel admin-chart-panel admin-chart-panel--wide">
      <div className="admin-chart-visual">
        <div className="admin-chart-visual-head">
          <span>Analytics</span>
          <div className="admin-chart-controls" aria-label="Pengaturan chart">
            <div className="admin-chart-control-group" role="group" aria-label="Tipe chart">
              <button type="button" className={chartType === 'bar' ? 'is-active' : ''} onClick={() => setChartType('bar')}>Bar</button>
              <button type="button" className={chartType === 'line' ? 'is-active' : ''} onClick={() => setChartType('line')}>Line</button>
            </div>
            <label className="admin-chart-toggle">
              <input type="checkbox" checked={showValues} onChange={(event) => setShowValues(event.target.checked)} />
              <span>Nilai</span>
            </label>
          </div>
        </div>

        <div className={`admin-activity-chart is-${chartType}`}>
          {chartType === 'line' ? (
            <div className="admin-chart-line-wrap">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Grafik garis aktivitas 7 hari">
                <g className="admin-chart-grid-lines">
                  <line x1="0" y1="8" x2="100" y2="8" />
                  <line x1="0" y1="36" x2="100" y2="36" />
                  <line x1="0" y1="64" x2="100" y2="64" />
                  <line x1="0" y1="92" x2="100" y2="92" />
                </g>
                {visibleMetrics.map((metric) => (
                  <polyline
                    key={metric.id}
                    className={metric.className}
                    points={linePoints(metric.id)}
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {chart.map((item, index) => {
                  const x = chart.length <= 1 ? 50 : 5 + (index / (chart.length - 1)) * 90;
                  return visibleMetrics.map((metric) => (
                    <circle
                      key={`${item.date}-${metric.id}`}
                      className={metric.className}
                      cx={x}
                      cy={getChartPoint(item, metric.id, maxValue)}
                      r="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  ));
                })}
              </svg>
              <div className="admin-chart-hit-area">
                {chart.map((item) => (
                  <button
                    type="button"
                    key={item.date}
                    onMouseEnter={() => setSelectedDay(item)}
                    onFocus={() => setSelectedDay(item)}
                    onClick={() => setSelectedDay(item)}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            chart.map((item) => (
              <button
                type="button"
                className="admin-chart-day"
                key={item.date}
                onMouseEnter={() => setSelectedDay(item)}
                onFocus={() => setSelectedDay(item)}
                onClick={() => setSelectedDay(item)}
              >
                <div className="admin-chart-bars">
                  {visibleMetrics.map((metric) => (
                    <i
                      className={metric.className}
                      style={{ height: `${Math.max(10, ((item[metric.id] || 0) / maxValue) * 100)}%` }}
                      title={`${metric.label}: ${item[metric.id] || 0}`}
                      key={metric.id}
                    >
                      {showValues ? <b>{item[metric.id] || 0}</b> : null}
                    </i>
                  ))}
                </div>
                <span>{item.label}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="admin-chart-body">
        <div className="admin-chart-copy">
          <h2>Chart Aktivitas 7 Hari</h2>
          <p>
            {visibleMetrics.map((metric) => metric.label).join(', ')}
            {' '}aktif ditampilkan. Hover atau klik tanggal untuk melihat detail.
          </p>
          <small><span aria-hidden="true">schedule</span> diperbarui dari data dashboard real-time</small>
        </div>

        <aside className="admin-chart-settings" aria-label="Metrik chart">
          <strong>Metrik</strong>
          <div className="admin-chart-metric-list">
            {chartMetrics.map((metric) => (
              <label className={`admin-chart-metric ${metric.className}`} key={metric.id}>
                <input
                  type="checkbox"
                  checked={activeMetrics.includes(metric.id)}
                  onChange={() => toggleMetric(metric.id)}
                />
                <span>{metric.label}</span>
              </label>
            ))}
          </div>
          <div className="admin-chart-detail">
            <span>Detail hari</span>
            <strong>{detailDay?.label || '-'}</strong>
            {visibleMetrics.map((metric) => (
              <p key={metric.id}>
                <i className={metric.className} />
                <span>{metric.label}</span>
                <b>{detailDay ? detailDay[metric.id] || 0 : 0}</b>
              </p>
            ))}
          </div>
        </aside>
      </div>
    </article>
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
  const quickActions = dashboardData?.quickActions || [];
  const actionQueue = dashboardData?.actionQueue || [];
  const transactionSummary = dashboardData?.transactionSummary || {};
  const activityChart = dashboardData?.activityChart || [];
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
              <p className="admin-dashboard-breadcrumb">Pages / Dashboard</p>
              <h1>Dashboard</h1>
              {dashboardError ? <p className="admin-dashboard-error">{dashboardError}</p> : null}
            </div>
            <button type="button" onClick={() => goTo('/admin/database')}>Data real-time</button>
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

          <section className="admin-ops-grid" aria-label="Aksi dan ringkasan operasional">
            <QuickActionsPanel actions={quickActions} />
            <ActionQueuePanel items={actionQueue} />
            <TransactionSummaryPanel summary={transactionSummary} />
          </section>

          <section className="admin-chart-section" aria-label="Chart aktivitas admin">
            <ActivityChartPanel chart={activityChart} />
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
              <button className="admin-panel-button" type="button" onClick={() => goTo('/admin/users')}>Lihat semua aktivitas</button>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-head">
                <h2>Workshop / Program Mendatang</h2>
                <button type="button" onClick={() => goTo('/admin/program')}>Lihat semua</button>
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
              <button className="admin-panel-button" type="button" onClick={() => goTo('/admin/program')}>Kelola workshop / program</button>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-head">
                <h2>Verifikasi Akun</h2>
                <button type="button" onClick={() => goTo('/admin/verification')}>Lihat semua</button>
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
              <button className="admin-panel-button" type="button" onClick={() => goTo('/admin/verification')}>Kelola verifikasi akun</button>
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
                    <button type="button" onClick={() => goTo(item.route || contentManageRoute(activeContent.id))}>Lihat</button>
                  </div>
                ))
              ) : (
                <EmptyState>{activeContent.empty}</EmptyState>
              )}
              <button className="admin-panel-button" type="button" onClick={() => goTo(contentManageRoute(activeContent.id))}>Kelola konten</button>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-head">
                <h2>Lead / Kontak Terbaru</h2>
                <button type="button" onClick={() => goTo('/admin/leads')}>Lihat semua</button>
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
              <button className="admin-panel-button" type="button" onClick={() => goTo('/admin/leads')}>Kelola lead / kontak</button>
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
                <button type="button" onClick={() => goTo('/admin/database')}>Lihat semua log</button>
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
