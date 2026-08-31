import { useEffect, useMemo, useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import { DashboardUserSidebarIcon } from './userSidebarIcons.jsx';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import { ProfileAvatar } from '../../features/profile-image-crop/ProfileAvatar.jsx';
import { fetchTransactions, uploadPaymentProof } from '../../services/transactionApi.js';
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';

const menuItems = [
  { label: 'Profil', icon: 'user', href: '/dashboard' },
  { label: 'Progres Belajar', icon: 'graduation', href: '/progress-belajar' },
  { label: 'Proyek Saya', icon: 'folder', href: '/proyek-saya' },
  { label: 'Workshop / Program', icon: 'calendar', href: '/workshop-program' },
  { label: 'Lead Saya', icon: 'lead', href: '/lead-saya' },
  { label: 'Partner Saya', icon: 'partner', href: '/partner-saya' },
  { label: 'Transaksi', icon: 'transaction', href: '/transaksi', active: true },
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
    pending: 'Menunggu Pembayaran',
    proof_uploaded: 'Bukti Terkirim, Menunggu Review Admin',
    paid: 'Lunas, Akses Aktif',
    rejected: 'Ditolak, Upload Bukti Baru',
    failed: 'Gagal',
    cancelled: 'Dibatalkan',
    refunded: 'Refund',
    expired: 'Kedaluwarsa',
  };
  return labels[status] || status || '-';
}

function canUploadProof(status) {
  return ['pending', 'rejected'].includes(status);
}

function paymentMethodLabel(transaction) {
  return [transaction.paymentMethod, transaction.paymentChannel].filter(Boolean).join(' / ') || '-';
}

function transactionTime(transaction) {
  const date = new Date(transaction.createdAt || transaction.paidAt || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
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
      setMessage('Bukti pembayaran berhasil dikirim. Admin akan memverifikasi pembayaran. Akses aktif setelah disetujui.');
    } catch (uploadError) {
      setMessage(uploadError.message || 'Bukti pembayaran gagal diupload.');
    }
  }

  async function copyPaymentCode(transaction) {
    const code = transaction.paymentCode || '';
    if (!code) {
      setMessage('Nomor rekening atau kode pembayaran belum tersedia.');
      return;
    }

    try {
      await navigator.clipboard?.writeText(code);
      setMessage('Nomor rekening / kode pembayaran berhasil disalin.');
    } catch {
      setMessage('Gagal menyalin nomor rekening. Silakan salin manual dari detail pembayaran.');
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

  const actionTransactions = useMemo(
    () => [...transactions]
      .filter((transaction) => canUploadProof(transaction.status))
      .sort((left, right) => transactionTime(right) - transactionTime(left)),
    [transactions]
  );

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

        <main className="dashboard-content user-transactions-content">
          <div className="dashboard-user-greeting">
            <h1>Hello {greetingName}</h1>
            <span aria-hidden="true">&#128075;&#127995;</span>
          </div>

          <section className="user-payment-instructions" aria-labelledby="payment-instructions-title">
            <div className="user-payment-instructions__head">
              <div>
                <h2 id="payment-instructions-title">Butuh Aksi Kamu</h2>
                <p>Selesaikan pembayaran dan upload bukti agar akses item bisa diaktifkan.</p>
              </div>
            </div>

            {isLoading ? (
              <p className="user-payment-empty">Memuat instruksi pembayaran...</p>
            ) : error ? (
              <p className="user-payment-empty">{error}</p>
            ) : actionTransactions.length === 0 ? (
              <p className="user-payment-empty">Tidak ada transaksi yang perlu dibayar saat ini.</p>
            ) : (
              <div className="user-payment-card-list">
                {actionTransactions.map((transaction, index) => (
                  <article className="user-payment-card" key={transaction.id}>
                    <header className="user-payment-card__header">
                      <div>
                        <span>{index === 0 ? 'Transaksi Terbaru' : 'Menunggu Pembayaran'}</span>
                        <h3>{transaction.itemTitle || 'Pembayaran Arduflow'}</h3>
                      </div>
                      <b className={`user-transactions-pill user-transactions-pill--${transaction.status}`}>
                        {statusLabel(transaction.status)}
                      </b>
                    </header>

                    {transaction.rejectionReason ? (
                      <p className="user-payment-rejection">{transaction.rejectionReason}</p>
                    ) : null}

                    <dl className="user-payment-details">
                      <div>
                        <dt>Invoice</dt>
                        <dd>{transaction.invoiceNumber || '-'}</dd>
                      </div>
                      <div>
                        <dt>Total Bayar</dt>
                        <dd>{formatCurrency(transaction.amount, transaction.currency)}</dd>
                      </div>
                      <div>
                        <dt>Batas Pembayaran</dt>
                        <dd>{formatDate(transaction.dueAt)}</dd>
                      </div>
                      <div>
                        <dt>Metode Pembayaran</dt>
                        <dd>{paymentMethodLabel(transaction)}</dd>
                      </div>
                      <div>
                        <dt>Nama Penerima</dt>
                        <dd>{transaction.recipientName || '-'}</dd>
                      </div>
                      <div>
                        <dt>Nomor Rekening / Kode</dt>
                        <dd>{transaction.paymentCode || '-'}</dd>
                      </div>
                    </dl>

                    <div className="user-payment-actions">
                      <button type="button" onClick={() => copyPaymentCode(transaction)} disabled={!transaction.paymentCode}>
                        Salin Nomor Rekening
                      </button>
                      <button
                        type="button"
                        className="user-transactions-payment-toggle"
                        onClick={() => setOpenPaymentFormId((value) => (value === transaction.id ? null : transaction.id))}
                        aria-expanded={openPaymentFormId === transaction.id}
                      >
                        {openPaymentFormId === transaction.id ? 'Tutup Upload' : 'Upload Bukti Pembayaran'}
                      </button>
                    </div>

                    <div className="user-payment-body">
                      {transaction.qrisFile?.url ? (
                        <figure className="user-payment-qris">
                          <img src={transaction.qrisFile.url} alt={`QRIS pembayaran ${transaction.invoiceNumber || transaction.itemTitle || ''}`} />
                          <figcaption>Scan QRIS ini, lalu upload bukti pembayaran.</figcaption>
                        </figure>
                      ) : null}

                      {openPaymentFormId === transaction.id ? (
                        <form className="user-transactions-payment user-transactions-payment--card" onSubmit={(event) => handleUploadProof(event, transaction)}>
                          <label>
                            <span>No. referensi pembayaran</span>
                            <input
                              value={paymentForms[transaction.id]?.referenceNumber ?? transaction.referenceNumber ?? ''}
                              onChange={(event) => updatePaymentForm(transaction.id, 'referenceNumber', event.target.value)}
                              placeholder="Contoh: nomor mutasi / referensi transfer"
                            />
                          </label>
                          <label>
                            <span>File bukti pembayaran</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,application/pdf"
                              onChange={(event) => updatePaymentForm(transaction.id, 'proofFile', event.target.files?.[0] || null)}
                            />
                          </label>
                          <button type="submit">Kirim Bukti Pembayaran</button>
                        </form>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {message ? <p className="user-transactions-message user-transactions-message--instructions">{message}</p> : null}
          </section>

          <section className="user-transactions-panel" aria-labelledby="transactions-title">
            <div className="user-transactions-header">
              <div>
                <h2 id="transactions-title">Riwayat Transaksi</h2>
                <p>Pembayaran workshop, program, proyek, atau materi yang terhubung dengan akun kamu.</p>
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
                      {paymentMethodLabel(transaction)}
                      {transaction.recipientName ? <small>Penerima: {transaction.recipientName}</small> : null}
                      {transaction.paymentCode ? <small>Kode: {transaction.paymentCode}</small> : null}
                      {transaction.qrisFile?.url ? <small>QRIS tersedia di instruksi pembayaran.</small> : null}
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
                        <strong>Akses aktif</strong>
                      ) : transaction.status === 'proof_uploaded' ? (
                        <strong>Menunggu review</strong>
                      ) : canUploadProof(transaction.status) ? (
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
                      ) : (
                        <strong>Tidak dapat upload</strong>
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </section>
    </div>
  );
}
