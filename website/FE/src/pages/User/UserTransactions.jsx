import { useEffect, useMemo, useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import { DashboardUserSidebarIcon } from './userSidebarIcons.jsx';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import { fetchTransactions, uploadPaymentProof } from '../../services/transactionApi.js';
import { UserDashboardTopbar } from './UserDashboardTopbar.jsx';
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

function itemTypeLabel(itemType) {
  const labels = {
    workshop: 'Workshop',
    program: 'Program',
    project: 'Proyek',
    materi: 'Materi',
    material: 'Materi',
    ide: 'IDE',
  };
  return labels[String(itemType || '').toLowerCase()] || itemType || 'Lainnya';
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
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [typeFilter, setTypeFilter] = useState('Semua');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentForms, setPaymentForms] = useState({});
  const [openPaymentFormId, setOpenPaymentFormId] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
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

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const transactionDate = transactionTime(transaction);
      const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : 0;
      const toDate = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
      if (transactionDate < fromDate || transactionDate > toDate) return false;
      if (statusFilter !== 'Semua' && transaction.status !== statusFilter) return false;
      if (typeFilter !== 'Semua' && String(transaction.itemType || '').toLowerCase() !== typeFilter) return false;
      if (!query) return true;
      return [transaction.invoiceNumber, transaction.itemTitle, transaction.paymentMethod, transaction.paymentChannel, statusLabel(transaction.status), itemTypeLabel(transaction.itemType)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    }).sort((left, right) => transactionTime(right) - transactionTime(left));
  }, [transactions, searchTerm, statusFilter, typeFilter, dateFrom, dateTo]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const displayedTransactions = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

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

  function resetTransactionFilters() {
    setSearchTerm('');
    setStatusFilter('Semua');
    setTypeFilter('Semua');
    setDateFrom('');
    setDateTo('');
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
        <UserDashboardTopbar fullName={fullName} profileImage={profileImage} />

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
              <div className="user-transactions-filters">
                <label>
                  <span className="sr-only">Filter jenis transaksi</span>
                  <select value={typeFilter} aria-label="Filter jenis transaksi" onChange={(event) => setTypeFilter(event.target.value)}>
                    <option value="Semua">Semua Jenis</option>
                    <option value="workshop">Workshop</option>
                    <option value="program">Program</option>
                    <option value="project">Proyek</option>
                    <option value="materi">Materi</option>
                    <option value="ide">IDE</option>
                  </select>
                </label>
                <label>
                  <span className="sr-only">Filter status transaksi</span>
                  <select value={statusFilter} aria-label="Filter status transaksi" onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="Semua">Semua Status</option>
                    <option value="pending">Menunggu Pembayaran</option>
                    <option value="proof_uploaded">Menunggu Review</option>
                    <option value="paid">Lunas</option>
                    <option value="rejected">Ditolak</option>
                    <option value="failed">Gagal</option>
                    <option value="cancelled">Dibatalkan</option>
                    <option value="refunded">Refund</option>
                  </select>
                </label>
                <label>
                  <span className="sr-only">Tanggal mulai</span>
                  <input type="date" value={dateFrom} max={dateTo || undefined} aria-label="Tanggal mulai transaksi" onChange={(event) => setDateFrom(event.target.value)} />
                </label>
                <label>
                  <span className="sr-only">Tanggal akhir</span>
                  <input type="date" value={dateTo} min={dateFrom || undefined} aria-label="Tanggal akhir transaksi" onChange={(event) => setDateTo(event.target.value)} />
                </label>
                <button type="button" className="user-transactions-filter-reset" onClick={resetTransactionFilters}>Reset</button>
              </div>
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
                    <span><b>{transaction.itemTitle || '-'}</b><small>{itemTypeLabel(transaction.itemType)}</small></span>
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
                      <button className="user-transactions-detail-button" type="button" onClick={() => setSelectedTransaction(transaction)}>
                        Lihat Detail
                      </button>
                    </span>
                  </div>
                ))
              )}
            </div>
            <nav className="user-transactions-pagination" aria-label="Pagination transaksi">
              <span>Menampilkan {filteredTransactions.length ? ((currentPage - 1) * pageSize) + 1 : 0}-{Math.min(currentPage * pageSize, filteredTransactions.length)} dari {filteredTransactions.length}</span>
              <div>
                <button type="button" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>&lsaquo;</button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button className={page === currentPage ? 'is-active' : ''} type="button" key={page} onClick={() => setCurrentPage(page)}>{page}</button>
                ))}
                <button type="button" aria-label="Halaman berikutnya" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>&rsaquo;</button>
              </div>
            </nav>
          </section>
        </main>
      </section>

      {selectedTransaction ? (
        <div className="user-transactions-modal-backdrop" role="presentation" onClick={() => setSelectedTransaction(null)}>
          <section className="user-transactions-modal" role="dialog" aria-modal="true" aria-labelledby="transaction-detail-title" onClick={(event) => event.stopPropagation()}>
            <header className="user-transactions-modal__header">
              <div>
                <span>Detail transaksi</span>
                <h2 id="transaction-detail-title">{selectedTransaction.itemTitle || 'Transaksi Arduflow'}</h2>
                <p>{selectedTransaction.invoiceNumber || 'Invoice belum tersedia'}</p>
              </div>
              <button type="button" aria-label="Tutup detail transaksi" onClick={() => setSelectedTransaction(null)}>&times;</button>
            </header>
            <div className="user-transactions-modal__status">
              <span>Status pembayaran</span>
              <b className={`user-transactions-pill user-transactions-pill--${selectedTransaction.status}`}>
                {statusLabel(selectedTransaction.status)}
              </b>
            </div>
            <dl className="user-transactions-modal__details">
              <div><dt>Jenis item</dt><dd>{itemTypeLabel(selectedTransaction.itemType)}</dd></div>
              <div><dt>Total pembayaran</dt><dd>{formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}</dd></div>
              <div><dt>Tanggal transaksi</dt><dd>{formatDate(selectedTransaction.createdAt)}</dd></div>
              <div><dt>Tanggal lunas</dt><dd>{formatDate(selectedTransaction.paidAt)}</dd></div>
              <div><dt>Metode pembayaran</dt><dd>{paymentMethodLabel(selectedTransaction)}</dd></div>
              <div><dt>Penerima</dt><dd>{selectedTransaction.recipientName || '-'}</dd></div>
              <div><dt>Nomor referensi</dt><dd>{selectedTransaction.referenceNumber || '-'}</dd></div>
              <div><dt>Kode pembayaran</dt><dd>{selectedTransaction.paymentCode || '-'}</dd></div>
            </dl>
            {selectedTransaction.rejectionReason ? (
              <p className="user-transactions-modal__rejection"><strong>Catatan admin:</strong> {selectedTransaction.rejectionReason}</p>
            ) : null}
            <footer className="user-transactions-modal__footer">
              <button type="button" onClick={() => setSelectedTransaction(null)}>Tutup</button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
