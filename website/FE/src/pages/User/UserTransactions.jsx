import { useEffect, useMemo, useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import certificateIcon from '../../assets/icons/icon-downloadsim-1.svg';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import { ProfileAvatar } from '../../features/profile-image-crop/ProfileAvatar.jsx';
import { fetchTransactions, uploadPaymentProof } from '../../services/transactionApi.js';
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';

const menuItems = [
  { label: 'Profil', icon: 'user', href: '/dashboard' },
  { label: 'Progres Belajar', icon: 'graduation', href: '/progress-belajar' },
  { label: 'Proyek Saya', icon: 'folder', href: '/proyek-saya' },
  { label: 'Workshop / Program', icon: 'calendar', href: '/workshop-program' },
  { label: 'Transaksi', icon: 'certificate', href: '/transaksi', active: true },
  { label: 'Sertifikat', icon: 'certificate', href: '/sertifikat' },
  { label: 'IDE', icon: 'cpu', href: '/ide' },
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

function SidebarIcon({ name }) {
  const commonProps = {
    width: '18',
    height: '18',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  const paths = {
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    graduation: (
      <>
        <path d="M22 10 12 5 2 10l10 5 10-5Z" />
        <path d="M6 12v5c3 2 9 2 12 0v-5" />
      </>
    ),
    folder: (
      <>
        <path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        <path d="M3 7V5a2 2 0 0 1 2-2h4l2 4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 10h18" />
        <path d="M8 14h2v2H8zM14 14h2v2h-2z" />
      </>
    ),
    cpu: (
      <>
        <rect x="7" y="7" width="10" height="10" rx="1" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 1 1-4 0V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2.8a2 2 0 1 1 0-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V2.8a2 2 0 1 1 4 0V3a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
  };

  return <svg {...commonProps}>{paths[name]}</svg>;
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

function statusLabel(status) {
  const labels = {
    pending: 'Menunggu',
    proof_uploaded: 'Menunggu Review',
    paid: 'Lunas',
    rejected: 'Ditolak',
    failed: 'Gagal',
    cancelled: 'Dibatalkan',
    refunded: 'Refund',
    expired: 'Kedaluwarsa',
  };
  return labels[status] || status || '-';
}

export function UserTransactions() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentForms, setPaymentForms] = useState({});
  const [openPaymentFormId, setOpenPaymentFormId] = useState(null);
  const [message, setMessage] = useState('');
  const user = getStoredUser();
  const fullName = user.name || user.fullName || 'Nama Lengkap';
  const greetingName = user.nickname || fullName;
  const profileImage = user.profileImage || user.avatar || '';

  useEffect(() => {
    let isMounted = true;
    const params = {};
    if (user.id || user.userId) params.userId = user.id || user.userId;
    if (user.email) params.email = user.email;

    if (!params.userId && !params.email) {
      setTransactions([]);
      setError('Login diperlukan untuk melihat transaksi.');
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setIsLoading(true);
    fetchTransactions(params)
      .then((records) => {
        if (isMounted) {
          setTransactions(records);
          setError('');
        }
      })
      .catch((loadError) => {
        if (isMounted) {
          setTransactions([]);
          setError(loadError.message || 'Gagal memuat transaksi.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user.email, user.id, user.userId]);

  function updatePaymentForm(transactionId, field, value) {
    setPaymentForms((current) => ({
      ...current,
      [transactionId]: {
        ...(current[transactionId] || {}),
        [field]: value,
      },
    }));
  }

  async function handleUploadProof(event, transaction) {
    event.preventDefault();
    const form = paymentForms[transaction.id] || {};
    if (!form.proofFile) {
      setMessage('Pilih file bukti pembayaran terlebih dahulu.');
      return;
    }

    setMessage('Mengupload bukti pembayaran...');
    try {
      await uploadPaymentProof(transaction.id, {
        proofFile: form.proofFile,
        paymentMethod: form.paymentMethod || transaction.paymentMethod,
        paymentChannel: form.paymentChannel || transaction.paymentChannel,
        referenceNumber: form.referenceNumber || transaction.referenceNumber,
      });
      setPaymentForms((current) => ({ ...current, [transaction.id]: {} }));
      setOpenPaymentFormId(null);
      const params = {};
      if (user.id || user.userId) params.userId = user.id || user.userId;
      if (user.email) params.email = user.email;
      setTransactions(await fetchTransactions(params));
      setMessage('Bukti pembayaran berhasil diupload. Menunggu review admin.');
    } catch (uploadError) {
      setMessage(uploadError.message || 'Bukti pembayaran gagal diupload.');
    }
  }

  const displayedTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return transactions;
    return transactions.filter((transaction) =>
      [transaction.invoiceNumber, transaction.itemTitle, transaction.paymentMethod, transaction.paymentChannel, statusLabel(transaction.status)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [transactions, searchTerm]);

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
    <div className={`dashboard-user-page user-transactions-page${isSidebarCollapsed ? ' dashboard-user-page--collapsed' : ''}`}>
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
              {item.icon === 'certificate' ? (
                <img className="dashboard-sidebar__asset-icon" src={certificateIcon} alt="" aria-hidden="true" />
              ) : (
                <SidebarIcon name={item.icon} />
              )}
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

        <main className="dashboard-content user-transactions-content">
          <div className="dashboard-user-greeting">
            <h1>Hello {greetingName}</h1>
            <span aria-hidden="true">&#128075;&#127995;</span>
          </div>

          <section className="user-transactions-panel" aria-labelledby="transactions-title">
            <div className="user-transactions-header">
              <div>
                <h2 id="transactions-title">Riwayat Transaksi</h2>
                <p>Pembayaran workshop, program, atau materi yang terhubung dengan akun kamu.</p>
              </div>
              <label>
                <span className="sr-only">Cari transaksi</span>
                <input
                  type="search"
                  placeholder="Cari invoice / program"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </label>
            </div>

            <div className="user-transactions-table" role="table" aria-label="Riwayat transaksi">
              <div className="user-transactions-table__head" role="row">
                <span>Invoice</span>
                <span>Program</span>
                <span>Nominal</span>
                <span>Metode</span>
                <span>Tanggal</span>
                <span>Status</span>
                <span>Pembayaran</span>
              </div>
              {isLoading ? (
                <div className="user-transactions-table__row" role="row"><span>Memuat transaksi...</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span></div>
              ) : error ? (
                <div className="user-transactions-table__row" role="row"><span>{error}</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span></div>
              ) : displayedTransactions.length === 0 ? (
                <div className="user-transactions-table__row" role="row"><span>Belum ada transaksi.</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span></div>
              ) : (
                displayedTransactions.map((transaction) => (
                  <div className="user-transactions-table__row" role="row" key={transaction.id}>
                    <span>{transaction.invoiceNumber || '-'}</span>
                    <span>{transaction.itemTitle || '-'}</span>
                    <span>{formatCurrency(transaction.amount, transaction.currency)}</span>
                    <span>
                      {[transaction.paymentMethod, transaction.paymentChannel].filter(Boolean).join(' / ') || '-'}
                      {transaction.recipientName ? <small>Penerima: {transaction.recipientName}</small> : null}
                      {transaction.paymentCode ? <small>Kode: {transaction.paymentCode}</small> : null}
                      {transaction.qrisFile?.url ? <a className="user-transactions-qris" href={transaction.qrisFile.url} target="_blank" rel="noreferrer">Lihat QRIS</a> : null}
                    </span>
                    <time>{formatDate(transaction.paidAt || transaction.createdAt)}</time>
                    <span>
                      <b className={`user-transactions-pill user-transactions-pill--${transaction.status}`}>
                        {statusLabel(transaction.status)}
                      </b>
                      {transaction.rejectionReason ? <small>{transaction.rejectionReason}</small> : null}
                    </span>
                    <span className="user-transactions-payment-cell">
                      {transaction.status === 'paid' ? (
                        <strong>Produk aktif</strong>
                      ) : transaction.status === 'proof_uploaded' ? (
                        <strong>Bukti terkirim</strong>
                      ) : (
                        <>
                          <button
                            className="user-transactions-payment-toggle"
                            type="button"
                            onClick={() => setOpenPaymentFormId((value) => (value === transaction.id ? null : transaction.id))}
                            aria-expanded={openPaymentFormId === transaction.id}
                          >
                            {openPaymentFormId === transaction.id ? 'Tutup Form' : 'Upload Bukti'}
                          </button>
                          {openPaymentFormId === transaction.id ? (
                            <form className="user-transactions-payment" onSubmit={(event) => handleUploadProof(event, transaction)}>
                              <input
                                value={paymentForms[transaction.id]?.referenceNumber ?? transaction.referenceNumber ?? ''}
                                onChange={(event) => updatePaymentForm(transaction.id, 'referenceNumber', event.target.value)}
                                placeholder="No. referensi"
                              />
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,application/pdf"
                                onChange={(event) => updatePaymentForm(transaction.id, 'proofFile', event.target.files?.[0] || null)}
                              />
                              <button type="submit">Upload Bukti</button>
                            </form>
                          ) : null}
                        </>
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>
            {message ? <p className="user-transactions-message">{message}</p> : null}
          </section>
        </main>
      </section>
    </div>
  );
}
