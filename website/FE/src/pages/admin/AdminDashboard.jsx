import { useEffect, useState } from 'react';
import LoadingAnimation from '../../components/LoadingAnimation.jsx';
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
  {
    id: 'users',
    label: 'User',
    className: 'is-users',
    color: '#7f56d9',
  },
  {
    id: 'logins',
    label: 'Login',
    className: 'is-logins',
    color: '#12b76a',
  },
  {
    id: 'leads',
    label: 'Lead',
    className: 'is-leads',
    color: '#f79009',
  },
  {
    id: 'transactions',
    label: 'Transaksi',
    className: 'is-transactions',
    color: '#2e90fa',
  },
];

function reportChartValues(chart, metricId) {
  return chart.map((item) => Number(item?.[metricId] || 0));
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);
}

function getChartScaleMax(chart) {
  const maxValue = Math.max(
    1,
    ...chart.flatMap((item) => chartMetrics.map((metric) => Number(item?.[metric.id] || 0)))
  );

  return Math.max(4, Math.ceil(maxValue / 4) * 4);
}

function getChartPoint(value, index, total, maxValue) {
  const x = total <= 1 ? 50 : 7 + (index / (total - 1)) * 88;
  const y = 100 - (Number(value || 0) / maxValue) * 100;
  return {
    x,
    y: Math.max(2, Math.min(98, y)),
  };
}

function reportLinePath(values, maxValue) {
  const points = values.map((value, index) => getChartPoint(value, index, values.length, maxValue));

  if (points.length === 0) return '';

  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  const segments = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const controlX = previous.x + (current.x - previous.x) * 0.5;

    segments.push(`C ${controlX} ${previous.y}, ${controlX} ${current.y}, ${current.x} ${current.y}`);
  }

  return segments.join(' ');
}

function UntitledActivityChart({ chart }) {
  const [chartMode, setChartMode] = useState('bar');
  const labels = chart.map((item) => item.label);
  const maxValue = getChartScaleMax(chart);
  const axisTicks = [maxValue, maxValue * 0.75, maxValue * 0.5, maxValue * 0.25, 0];
  const latest = chart.at(-1) || {};

  return (
    <article className="admin-ui-chart-card">
      <header className="admin-ui-chart-header">
        <div>
          <span>Analytics</span>
          <h2>Chart Aktivitas 7 Hari</h2>
          <p>Ringkasan user, login, lead, dan transaksi dalam satu chart.</p>
        </div>
        <div className="admin-ui-chart-switch" role="group" aria-label="Tipe chart">
          <button
            type="button"
            className={chartMode === 'bar' ? 'is-active' : ''}
            onClick={() => setChartMode('bar')}
          >
            Bar Chart
          </button>
          <button
            type="button"
            className={chartMode === 'line' ? 'is-active' : ''}
            onClick={() => setChartMode('line')}
          >
            Line Chart
          </button>
        </div>
      </header>

      <div className="admin-ui-chart-legend" aria-label="Legenda chart">
        {chartMetrics.map((metric) => (
          <span className={metric.className} key={metric.id}>
            <i aria-hidden="true" />
            {metric.label}
            <b>{latest?.[metric.id] || 0}</b>
          </span>
        ))}
      </div>

      <div className={`admin-ui-chart-area is-${chartMode}`}>
        <div className="admin-ui-chart-axis" aria-hidden="true">
          {axisTicks.map((tick) => (
            <span key={tick}>{formatCompactNumber(tick)}</span>
          ))}
        </div>

        {chartMode === 'bar' ? (
          <div className="admin-ui-bar-chart" role="img" aria-label="Bar chart aktivitas 7 hari">
            <div className="admin-ui-bar-grid" aria-hidden="true">
              {axisTicks.map((tick) => (
                <span key={tick} />
              ))}
            </div>
            {chart.map((item) => (
              <div className="admin-ui-bar-group" key={item.date}>
                <div className="admin-ui-bars">
                  {chartMetrics.map((metric) => {
                    const value = Number(item?.[metric.id] || 0);
                    const tooltip = `${item.label} - ${metric.label}: ${formatCompactNumber(value)}`;

                    return (
                      <i
                        aria-label={tooltip}
                        className={metric.className}
                        key={metric.id}
                        style={{ height: `${(value / maxValue) * 100}%` }}
                        title={tooltip}
                      >
                        <span>{tooltip}</span>
                      </i>
                    );
                  })}
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="admin-ui-line-chart">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Line chart aktivitas 7 hari">
              <g className="admin-ui-chart-grid">
                <line x1="0" y1="0" x2="100" y2="0" />
                <line x1="0" y1="25" x2="100" y2="25" />
                <line x1="0" y1="50" x2="100" y2="50" />
                <line x1="0" y1="75" x2="100" y2="75" />
                <line x1="0" y1="100" x2="100" y2="100" />
              </g>
              {chartMetrics.map((metric) => {
                const values = reportChartValues(chart, metric.id);

                return (
                  <g className={metric.className} key={metric.id}>
                    <path d={reportLinePath(values, maxValue)} />
                  </g>
                );
              })}
            </svg>
            <div className="admin-ui-line-labels" aria-hidden="true">
              {labels.map((label) => <span key={label}>{label}</span>)}
            </div>
          </div>
        )}
      </div>

      <footer className="admin-ui-chart-footer">
        <small><img src={clockIcon} alt="" aria-hidden="true" />diperbarui dari data dashboard real-time</small>
      </footer>
    </article>
  );
}

function ActivityChartPanel({ chart }) {
  return <UntitledActivityChart chart={chart} />;
}

export function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardError, setDashboardError] = useState('');
  const [isDashboardLoading, setDashboardLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(true);
  const [activeContentTab, setActiveContentTab] = useState('tutorials');

  useEffect(() => {
    let isMounted = true;
    setDashboardLoading(true);

    getAdminDashboard()
      .then((data) => {
        if (!isMounted) return;
        setDashboardData(data);
        setDashboardError('');
      })
      .catch((error) => {
        if (!isMounted) return;
        setDashboardError(error.message || 'Gagal memuat data dashboard admin.');
      })
      .finally(() => {
        if (!isMounted) return;
        setDashboardLoading(false);
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

  if (showLoading) {
    return (
      <LoadingAnimation
        isLoading={isDashboardLoading}
        onDone={() => setShowLoading(false)}
        prompt="arduflow-user"
      />
    );
  }

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

          <section className="admin-chart-section" aria-label="Chart aktivitas admin">
            <ActivityChartPanel chart={activityChart} />
          </section>

          <section className="admin-ops-grid" aria-label="Aksi dan ringkasan operasional">
            <QuickActionsPanel actions={quickActions} />
            <ActionQueuePanel items={actionQueue} />
            <TransactionSummaryPanel summary={transactionSummary} />
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
