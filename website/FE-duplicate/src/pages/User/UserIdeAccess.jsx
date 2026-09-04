import { useEffect, useMemo, useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import { DashboardUserSidebarIcon } from './userSidebarIcons.jsx';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import { ProfileAvatar } from '../../features/profile-image-crop/ProfileAvatar.jsx';
import { fetchIdeConfig } from '../../services/ideApi.js';
import { fetchTransactions } from '../../services/transactionApi.js';
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';

const IDE_URL = 'https://ide.arduflow.com/';

const menuItems = [
  { label: 'Profil', icon: 'user', href: '/dashboard' },
  { label: 'Progres Belajar', icon: 'graduation', href: '/progress-belajar' },
  { label: 'Proyek Saya', icon: 'folder', href: '/proyek-saya' },
  { label: 'Workshop / Program', icon: 'calendar', href: '/workshop-program' },
  { label: 'Lead Saya', icon: 'lead', href: '/lead-saya' },
  { label: 'Transaksi', icon: 'transaction', href: '/transaksi' },
  { label: 'Sertifikat', icon: 'certificate', href: '/sertifikat' },
  { label: 'IDE', icon: 'cpu', href: '/ide-saya', active: true },
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

function formatCurrency(value, currency = 'IDR') {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function makeIdeToken(transaction, user) {
  const source = transaction?.invoiceNumber || transaction?.id || user?.email || 'USER';
  return `ARDUFLOW-IDE-${String(source).replace(/[^A-Za-z0-9]/g, '').toUpperCase()}`;
}

export function UserIdeAccess() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const [transactions, setTransactions] = useState([]);
  const [config, setConfig] = useState({
    title: 'Akses ArduFlow IDE',
    price: 150000,
    currency: 'IDR',
    durationDays: 365,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  const user = getStoredUser();
  const fullName = user.name || user.fullName || user.full_name || 'Nama Lengkap';
  const greetingName = user.nickname || user.username || fullName;
  const profileImage = user.profileImage || user.profile_image || user.avatar || '';

  const ideTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.itemType === 'ide'),
    [transactions]
  );
  const paidIdeTransaction = ideTransactions.find((transaction) => transaction.status === 'paid') || null;
  const pendingIdeTransaction = ideTransactions.find((transaction) =>
    ['pending', 'proof_uploaded', 'rejected'].includes(transaction.status)
  ) || null;
  const ideToken = paidIdeTransaction ? makeIdeToken(paidIdeTransaction, user) : '';

  async function loadIdeAccess() {
    const params = {};
    if (user.id || user.userId) params.userId = user.id || user.userId;
    if (user.email) params.email = user.email;

    if (!params.userId && !params.email) {
      setMessage('Data user belum lengkap. Silakan login ulang.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const [ideConfig, records] = await Promise.all([
        fetchIdeConfig(),
        fetchTransactions(params),
      ]);

      setConfig(ideConfig);
      setTransactions(records);
    } catch (error) {
      setMessage(error.message || 'Gagal memuat akses IDE.');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadIdeAccess();
  }, [user.email, user.id, user.userId]);

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

  async function copyToken() {
    if (!ideToken) return;

    try {
      await navigator.clipboard?.writeText(ideToken);
      setMessage('Token IDE berhasil disalin.');
    } catch {
      setMessage('Token tidak bisa disalin otomatis. Silakan salin manual.');
    }
  }

  return (
    <div className={`dashboard-user-page user-ide-page${isSidebarCollapsed ? ' dashboard-user-page--collapsed' : ''}`}>
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

        <main className="dashboard-content user-ide-content">
          <div className="dashboard-user-greeting">
            <h1>IDE ArduFlow</h1>
            <span>{greetingName}</span>
          </div>

          <section className="user-ide-panel" aria-labelledby="user-ide-title">
            <div className="user-ide-panel__copy">
              <span>{paidIdeTransaction ? 'Akses Aktif' : 'Akses Belum Aktif'}</span>
              <h2 id="user-ide-title">
                {paidIdeTransaction
                  ? 'Token IDE kamu sudah tersedia.'
                  : 'Beli akses IDE untuk membuka editor ArduFlow.'}
              </h2>
              <p>
                {paidIdeTransaction
                  ? 'Gunakan token ini saat masuk ke ArduFlow IDE.'
                  : `Akses ${config.title} tersedia dengan harga ${formatCurrency(config.price, config.currency)}.`}
              </p>
            </div>

            {isLoading ? (
              <p className="user-ide-message">Memuat status akses IDE...</p>
            ) : paidIdeTransaction ? (
              <div className="user-ide-token-card">
                <span>Token IDE</span>
                <strong>{ideToken}</strong>
                <small>Aktif sejak {formatDate(paidIdeTransaction.paidAt || paidIdeTransaction.createdAt)}</small>
                <div>
                  <button type="button" onClick={copyToken}>Salin Token</button>
                  <a href={IDE_URL} target="_blank" rel="noreferrer">Buka IDE</a>
                </div>
              </div>
            ) : (
              <div className="user-ide-buy-card">
                <span>{pendingIdeTransaction ? 'Transaksi Berjalan' : 'Belum Membeli'}</span>
                <strong>{formatCurrency(config.price, config.currency)}</strong>
                <p>
                  {pendingIdeTransaction
                    ? 'Kamu sudah punya transaksi akses IDE. Selesaikan pembayaran atau tunggu review admin.'
                    : 'Setelah pembayaran disetujui admin, token IDE akan muncul di halaman ini.'}
                </p>
                <div>
                  <a href={pendingIdeTransaction ? '/transaksi' : '/akses'}>
                    {pendingIdeTransaction ? 'Lihat Transaksi' : 'Beli Akses'}
                  </a>
                  <button type="button" onClick={loadIdeAccess}>Refresh Status</button>
                </div>
              </div>
            )}

            {message ? <p className="user-ide-message">{message}</p> : null}
          </section>
        </main>
      </section>
    </div>
  );
}
