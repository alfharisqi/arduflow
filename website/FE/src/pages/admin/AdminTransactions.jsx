import { useEffect, useMemo, useState } from 'react';
import { AdminPage, AdminTopbar } from './AdminChrome.jsx';
import {
  approveTransaction,
  createTransaction,
  deleteTransaction,
  fetchTransactions,
  rejectTransaction,
  updateTransaction,
} from '../../services/transactionApi.js';

const initialForm = {
  userName: '',
  email: '',
  itemType: 'workshop',
  itemTitle: '',
  amount: '',
  paymentMethod: '',
  paymentChannel: '',
  paymentCode: '',
  recipientName: '',
  qrisFile: null,
  status: 'pending',
  referenceNumber: '',
  dueAt: '',
  notes: '',
};

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

export function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState(initialForm);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function loadTransactions() {
    setIsLoading(true);
    try {
      const records = await fetchTransactions(statusFilter ? { status: statusFilter } : {});
      setTransactions(records);
      setMessage('');
    } catch (error) {
      setTransactions([]);
      setMessage(error.message || 'Gagal memuat transaksi.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, [statusFilter]);

  const summary = useMemo(() => {
    const paidTotal = transactions
      .filter((transaction) => transaction.status === 'paid')
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
    return {
      total: transactions.length,
      pending: transactions.filter((transaction) => transaction.status === 'pending').length,
      review: transactions.filter((transaction) => transaction.status === 'proof_uploaded').length,
      paid: transactions.filter((transaction) => transaction.status === 'paid').length,
      revenue: paidTotal,
    };
  }, [transactions]);

  const displayedTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return transactions;
    return transactions.filter((transaction) =>
      [transaction.invoiceNumber, transaction.userName, transaction.email, transaction.itemTitle, transaction.referenceNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [transactions, searchTerm]);

  function updateFormField(name, value) {
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('Menyimpan transaksi...');
    try {
      await createTransaction({
        ...formData,
        amount: Number(formData.amount || 0),
      });
      setFormData(initialForm);
      setIsCreateOpen(false);
      await loadTransactions();
      setMessage('Transaksi berhasil ditambahkan.');
    } catch (error) {
      setMessage(error.message || 'Transaksi gagal disimpan.');
    }
  }

  async function handleStatusChange(transaction, status) {
    if (status === 'paid') {
      await handleApprove(transaction);
      return;
    }

    setMessage('Memperbarui status transaksi...');
    try {
      await updateTransaction(transaction.id, {
        ...transaction,
        status,
        paidAt: status === 'paid' ? transaction.paidAt || new Date().toISOString() : transaction.paidAt,
      });
      await loadTransactions();
      setMessage('Status transaksi berhasil diperbarui.');
    } catch (error) {
      setMessage(error.message || 'Status transaksi gagal diperbarui.');
    }
  }

  async function handleApprove(transaction) {
    setMessage('Menyetujui transaksi dan memberikan produk...');
    try {
      await approveTransaction(transaction.id);
      await loadTransactions();
      setMessage('Transaksi disetujui. Produk sudah aktif untuk user.');
    } catch (error) {
      setMessage(error.message || 'Transaksi gagal disetujui.');
    }
  }

  async function handleReject(transaction) {
    const reason = window.prompt('Alasan penolakan bukti pembayaran:', transaction.rejectionReason || '');
    if (reason === null) return;
    setMessage('Menolak transaksi...');
    try {
      await rejectTransaction(transaction.id, reason || 'Bukti pembayaran belum valid.');
      await loadTransactions();
      setMessage('Transaksi ditolak. User dapat upload ulang bukti.');
    } catch (error) {
      setMessage(error.message || 'Transaksi gagal ditolak.');
    }
  }

  async function handleDelete(transaction) {
    const confirmed = window.confirm(`Hapus transaksi ${transaction.invoiceNumber}?`);
    if (!confirmed) return;
    setMessage('Menghapus transaksi...');
    try {
      await deleteTransaction(transaction.id);
      await loadTransactions();
      setMessage('Transaksi berhasil dihapus.');
    } catch (error) {
      setMessage(error.message || 'Transaksi gagal dihapus.');
    }
  }

  return (
    <AdminPage pageClassName="admin-transactions-page" ariaLabel="Manajemen transaksi">
      <AdminTopbar
        searchPlaceholder="Cari invoice, user, atau program"
        searchLabel="Cari transaksi"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <section className="admin-transactions-hero">
        <div>
          <span>Payment Operations</span>
          <h1>Transaksi</h1>
          <p>Kelola pembayaran workshop, program, course, dan invoice user.</p>
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter status transaksi">
          <option value="">Semua status</option>
          <option value="pending">Menunggu</option>
          <option value="proof_uploaded">Menunggu Review</option>
          <option value="paid">Lunas</option>
          <option value="rejected">Ditolak</option>
          <option value="failed">Gagal</option>
          <option value="cancelled">Dibatalkan</option>
          <option value="refunded">Refund</option>
          <option value="expired">Kedaluwarsa</option>
        </select>
      </section>

      <section className="admin-transactions-summary" aria-label="Ringkasan transaksi">
        <article><span>Total Transaksi</span><strong>{summary.total}</strong></article>
        <article><span>Menunggu</span><strong>{summary.pending}</strong></article>
        <article><span>Perlu Review</span><strong>{summary.review}</strong></article>
        <article><span>Lunas</span><strong>{summary.paid}</strong></article>
        <article><span>Pendapatan Lunas</span><strong>{formatCurrency(summary.revenue)}</strong></article>
      </section>

      <section className="admin-transactions-create">
        <button type="button" onClick={() => setIsCreateOpen((value) => !value)} aria-expanded={isCreateOpen}>
          {isCreateOpen ? 'Tutup Form Tambah' : 'Tambah Transaksi'}
        </button>
        {message ? <p>{message}</p> : null}
      </section>

      <section className={`admin-transactions-layout${isCreateOpen ? ' admin-transactions-layout--with-form' : ''}`}>
        {isCreateOpen ? (
          <form className="admin-transactions-form" onSubmit={handleSubmit}>
            <h2>Tambah Transaksi</h2>
            <label>Nama User<input value={formData.userName} onChange={(event) => updateFormField('userName', event.target.value)} /></label>
            <label>Email<input type="email" value={formData.email} onChange={(event) => updateFormField('email', event.target.value)} /></label>
            <label>Jenis Item
              <select value={formData.itemType} onChange={(event) => updateFormField('itemType', event.target.value)}>
                <option value="workshop">Workshop</option>
                <option value="program">Program</option>
                <option value="course">Course</option>
                <option value="certificate">Sertifikat</option>
              </select>
            </label>
            <label>Nama Item<input required value={formData.itemTitle} onChange={(event) => updateFormField('itemTitle', event.target.value)} /></label>
            <label>Nominal<input type="number" min="0" value={formData.amount} onChange={(event) => updateFormField('amount', event.target.value)} /></label>
            <label>Metode Pembayaran
              <select value={formData.paymentMethod} onChange={(event) => updateFormField('paymentMethod', event.target.value)}>
                <option value="">Pilih metode</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
                <option value="E-Wallet">E-Wallet</option>
              </select>
            </label>
            <label>Channel / Bank<input value={formData.paymentChannel} onChange={(event) => updateFormField('paymentChannel', event.target.value)} placeholder="BCA / Mandiri / QRIS" /></label>
            <label>Nama Penerima<input value={formData.recipientName} onChange={(event) => updateFormField('recipientName', event.target.value)} placeholder="PT Arduflow / Nama penerima" /></label>
            <label>Kode Pembayaran<input value={formData.paymentCode} onChange={(event) => updateFormField('paymentCode', event.target.value)} placeholder="No. rekening / kode merchant / VA" /></label>
            <label>Foto QRIS<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => updateFormField('qrisFile', event.target.files?.[0] || null)} /></label>
            <label>Status
              <select value={formData.status} onChange={(event) => updateFormField('status', event.target.value)}>
                <option value="pending">Menunggu</option>
                <option value="proof_uploaded">Menunggu Review</option>
                <option value="paid">Lunas</option>
                <option value="rejected">Ditolak</option>
                <option value="failed">Gagal</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </label>
            <label>Referensi<input value={formData.referenceNumber} onChange={(event) => updateFormField('referenceNumber', event.target.value)} /></label>
            <label>Jatuh Tempo<input type="date" value={formData.dueAt} onChange={(event) => updateFormField('dueAt', event.target.value)} /></label>
            <label className="admin-transactions-form__full">Catatan<textarea value={formData.notes} onChange={(event) => updateFormField('notes', event.target.value)} /></label>
            <button type="submit">Simpan Transaksi</button>
          </form>
        ) : null}
        <div className="admin-transactions-table" role="table" aria-label="Daftar transaksi">
          <div className="admin-transactions-table__head" role="row">
            <span>Invoice</span>
            <span>User</span>
            <span>Item</span>
            <span>Nominal</span>
            <span>Status</span>
            <span>Bukti</span>
            <span>Tanggal</span>
            <span>Aksi</span>
          </div>
          {isLoading ? (
            <div className="admin-transactions-table__row" role="row"><span>Memuat transaksi...</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span></div>
          ) : displayedTransactions.length === 0 ? (
            <div className="admin-transactions-table__row" role="row"><span>Belum ada transaksi.</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span><span>-</span></div>
          ) : (
            displayedTransactions.map((transaction) => (
              <div className="admin-transactions-table__row" role="row" key={transaction.id}>
                <span>{transaction.invoiceNumber}</span>
                <span>{transaction.userName || transaction.email || '-'}</span>
                <span>{transaction.itemTitle}</span>
                <span>{formatCurrency(transaction.amount, transaction.currency)}</span>
                <span>
                  <select value={transaction.status} onChange={(event) => handleStatusChange(transaction, event.target.value)}>
                    <option value="pending">Menunggu</option>
                    <option value="proof_uploaded">Menunggu Review</option>
                    <option value="paid">Lunas</option>
                    <option value="rejected">Ditolak</option>
                    <option value="failed">Gagal</option>
                    <option value="cancelled">Dibatalkan</option>
                    <option value="refunded">Refund</option>
                    <option value="expired">Kedaluwarsa</option>
                  </select>
                </span>
                <span>
                  {transaction.proofFile?.url ? (
                    <a href={transaction.proofFile.url} target="_blank" rel="noreferrer">Lihat bukti</a>
                  ) : '-'}
                  {transaction.rejectionReason ? <small>{transaction.rejectionReason}</small> : null}
                </span>
                <time>{formatDate(transaction.paidAt || transaction.createdAt)}</time>
                <span className="admin-transactions-actions">
                  <button type="button" onClick={() => handleApprove(transaction)} disabled={!transaction.proofFile?.url || transaction.status === 'paid'}>Setujui</button>
                  <button type="button" onClick={() => handleReject(transaction)} disabled={!transaction.proofFile?.url || transaction.status === 'paid'}>Tolak</button>
                  <button type="button" onClick={() => handleDelete(transaction)}>Hapus</button>
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </AdminPage>
  );
}
