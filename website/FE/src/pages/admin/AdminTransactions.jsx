import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminPage, AdminTopbar } from './AdminChrome.jsx';
import settingsIcon from '../../assets/icons/icon-settings-1.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import workshopIcon from '../../assets/icons/icon-workshop-1.svg';
import projectIcon from '../../assets/icons/icon-proyek.svg';
import ideIcon from '../../assets/icons/icon-workflow-1.svg';
import revenueIcon from '../../assets/icons/icon-dollar-1.svg';
import {
  approveTransaction,
  createTransaction,
  createPaymentMethod,
  deletePaymentMethod,
  deleteTransaction,
  fetchPaymentMethods,
  fetchTransactions,
  rejectTransaction,
  updatePaymentMethod,
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

const initialPaymentMethodForm = {
  id: null,
  name: '',
  methodType: 'Transfer Bank',
  channel: '',
  recipientName: '',
  paymentCode: '',
  isActive: true,
  imageFile: null,
};

const TRANSACTIONS_PER_PAGE = 10;

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

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function exportTransactionsCsv(transactions, filename = 'arduflow-transactions.csv') {
  const headers = [
    'Order ID',
    'Tanggal',
    'Produk',
    'Judul Item',
    'Pelanggan',
    'Email',
    'Metode Pembayaran',
    'Jumlah',
    'Status',
    'Referensi',
  ];
  const rows = transactions.map((transaction) => [
    transaction.invoiceNumber,
    transaction.paidAt || transaction.createdAt,
    itemTypeLabel(transaction.itemType),
    transaction.itemTitle,
    transaction.userName,
    transaction.email,
    getPaymentMethodLabel(transaction),
    transaction.amount,
    statusLabel(transaction.status),
    transaction.referenceNumber || transaction.paymentCode,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function itemTypeLabel(type) {
  const labels = {
    workshop: 'Workshop',
    program: 'Workshop',
    course: 'Workshop',
    project: 'Proyek',
    ide: 'ArduFlow IDE',
    certificate: 'Sertifikat',
  };
  return labels[type] || type || 'Produk';
}

function getPaymentMethodLabel(transaction) {
  return [transaction.paymentChannel, transaction.paymentMethod].filter(Boolean).join(' ') || '-';
}

function PaymentMethodMark({ method }) {
  if (method.image?.url) {
    return <img className="admin-payment-methods-image" src={method.image.url} alt="" />;
  }

  if (method.methodType === 'QRIS' || method.name.toLowerCase().includes('qris')) {
    return (
      <span className="admin-payment-methods-qr" aria-label="QRIS">
        <i /><i /><i /><i /><i /><i /><i /><i /><i />
      </span>
    );
  }

  return <span className="admin-payment-methods-bank">{method.channel || method.name.slice(0, 8)}</span>;
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Number(value) || 0);
}

function PaymentMethodsModal({
  methods,
  form,
  isSaving,
  message,
  searchTerm,
  onSearchChange,
  onClose,
  onEdit,
  onDelete,
  onSubmit,
  onFormChange,
  onResetForm,
}) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredMethods = methods.filter((method) =>
    [method.name, method.methodType, method.channel, method.recipientName, method.paymentCode].some((value) =>
      String(value || '').toLowerCase().includes(normalizedSearch)
    )
  );

  return (
    <div className="admin-payment-methods-backdrop" role="presentation">
      <section className="admin-payment-methods-modal" role="dialog" aria-modal="true" aria-labelledby="payment-methods-title">
        <header className="admin-payment-methods-head">
          <div>
            <h2 id="payment-methods-title">Kelola Metode Pembayaran</h2>
            <p>Atur metode pembayaran yang tersedia untuk produk Arduflow.</p>
          </div>
          <button type="button" className="admin-payment-methods-close" onClick={onClose} aria-label="Tutup popup">x</button>
        </header>

        <div className="admin-payment-methods-toolbar">
          <label className="admin-payment-methods-search">
            <input
              type="search"
              placeholder="Cari metode pembayaran..."
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          <button type="button" className="admin-payment-methods-add" onClick={onResetForm}>
            <span aria-hidden="true">+</span>
            Tambah Metode Pembayaran
          </button>
        </div>

        <div className="admin-payment-methods-body">
          <form id="admin-payment-methods-form" className="admin-payment-methods-form" onSubmit={onSubmit}>
            <label>Nama Metode
              <input value={form.name} onChange={(event) => onFormChange('name', event.target.value)} placeholder="BCA Transfer" required />
            </label>
            <label>Jenis
              <select value={form.methodType} onChange={(event) => onFormChange('methodType', event.target.value)}>
                <option>Transfer Bank</option>
                <option>Virtual Account</option>
                <option>QRIS</option>
                <option>E-Wallet</option>
              </select>
            </label>
            <label>Channel / Bank
              <input value={form.channel} onChange={(event) => onFormChange('channel', event.target.value)} placeholder="BCA / Mandiri / QRIS" />
            </label>
            <label>No. Pembayaran
              <input value={form.paymentCode} onChange={(event) => onFormChange('paymentCode', event.target.value)} placeholder="No rekening / NMID / VA" required />
            </label>
            <label>Nama Penerima
              <input value={form.recipientName} onChange={(event) => onFormChange('recipientName', event.target.value)} placeholder="a.n. Arduflow Indonesia" />
            </label>
            <label>Gambar
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onFormChange('imageFile', event.target.files?.[0] || null)} />
            </label>
            <label className="admin-payment-methods-check">
              <input type="checkbox" checked={form.isActive} onChange={(event) => onFormChange('isActive', event.target.checked)} />
              Aktif
            </label>
            <div className="admin-payment-methods-form-actions">
              <button type="submit" disabled={isSaving}>{isSaving ? 'Menyimpan...' : form.id ? 'Update Metode' : 'Simpan Metode'}</button>
              {form.id ? <button type="button" onClick={onResetForm}>Batal Edit</button> : null}
            </div>
          </form>

          {message ? <p className="admin-payment-methods-message">{message}</p> : null}

          <div className="admin-payment-methods-table" role="table" aria-label="Metode pembayaran">
            <div className="admin-payment-methods-row admin-payment-methods-row--head" role="row">
              <span>Nama Metode</span>
              <span>No. Pembayaran / Detail</span>
              <span>Gambar</span>
              <span>Status</span>
              <span>Aksi</span>
            </div>
            {filteredMethods.map((method) => (
              <div className="admin-payment-methods-row" role="row" key={method.id || method.name}>
                <strong>{method.name}</strong>
                <span>{method.paymentCode}<small>{method.recipientName || method.channel || '-'}</small></span>
                <PaymentMethodMark method={method} />
                <span className="admin-payment-methods-status">{method.isActive ? 'Aktif' : 'Nonaktif'}</span>
                <span className="admin-payment-methods-actions">
                  <button type="button" onClick={() => onEdit(method)}>Edit</button>
                  <button type="button" className="danger" onClick={() => onDelete(method)}>Hapus</button>
                </span>
              </div>
            ))}
            {filteredMethods.length === 0 ? (
              <div className="admin-payment-methods-row" role="row">
                <strong>Belum ada metode</strong>
                <span>-</span>
                <span>-</span>
                <span>-</span>
                <span>-</span>
              </div>
            ) : null}
          </div>

          <button type="button" className="admin-payment-methods-new" onClick={onResetForm}>
            <span>+</span>
            <b>Tambah metode pembayaran baru</b>
            <small>Tambah rekening, e-wallet, atau metode pembayaran lainnya.</small>
            <i aria-hidden="true">&gt;</i>
          </button>
        </div>

        <footer className="admin-payment-methods-footer">
          <button type="button" onClick={onClose}>Tutup</button>
          <button type="submit" form="admin-payment-methods-form" disabled={isSaving}>Simpan Perubahan</button>
        </footer>
      </section>
    </div>
  );
}

export function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState(initialForm);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodForm, setPaymentMethodForm] = useState(initialPaymentMethodForm);
  const [paymentMethodMessage, setPaymentMethodMessage] = useState('');
  const [isPaymentMethodSaving, setPaymentMethodSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [openActionTransactionId, setOpenActionTransactionId] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });
  const actionButtonRefs = useRef(new Map());

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

  function resetFilters() {
    setSearchTerm('');
    setStatusFilter('');
    setItemTypeFilter('');
    setMethodFilter('');
    setPage(1);
  }

  function exportCurrentTransactions() {
    exportTransactionsCsv(displayedTransactions, 'arduflow-transactions-filtered.csv');
  }

  async function loadPaymentMethods() {
    try {
      const records = await fetchPaymentMethods();
      setPaymentMethods(records);
    } catch (error) {
      setPaymentMethods([]);
      setPaymentMethodMessage(error.message || 'Gagal memuat metode pembayaran.');
    }
  }

  useEffect(() => {
    loadTransactions();
  }, [statusFilter]);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const summary = useMemo(() => {
    const paidTotal = transactions
      .filter((transaction) => transaction.status === 'paid')
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
    return {
      total: transactions.length,
      workshop: transactions.filter((transaction) => ['workshop', 'program', 'course'].includes(transaction.itemType)).length,
      project: transactions.filter((transaction) => transaction.itemType === 'project').length,
      ide: transactions.filter((transaction) => transaction.itemType === 'ide').length,
      revenue: paidTotal,
    };
  }, [transactions]);

  const displayedTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return transactions.filter((transaction) => {
      if (itemTypeFilter === 'workshop' && !['workshop', 'program', 'course'].includes(transaction.itemType)) return false;
      if (itemTypeFilter === 'project' && transaction.itemType !== 'project') return false;
      if (itemTypeFilter === 'ide' && transaction.itemType !== 'ide') return false;
      if (methodFilter && !getPaymentMethodLabel(transaction).toLowerCase().includes(methodFilter.toLowerCase())) return false;
      if (!query) return true;

      return [transaction.invoiceNumber, transaction.userName, transaction.email, transaction.itemTitle, transaction.referenceNumber]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [itemTypeFilter, methodFilter, transactions, searchTerm]);

  const pagination = useMemo(() => {
    const total = displayedTransactions.length;
    const lastPage = Math.max(1, Math.ceil(total / TRANSACTIONS_PER_PAGE));
    const currentPage = Math.min(page, lastPage);
    const from = total ? (currentPage - 1) * TRANSACTIONS_PER_PAGE + 1 : 0;
    const to = Math.min(currentPage * TRANSACTIONS_PER_PAGE, total);

    return {
      page: currentPage,
      perPage: TRANSACTIONS_PER_PAGE,
      total,
      from,
      to,
      lastPage,
    };
  }, [displayedTransactions.length, page]);

  const paginatedTransactions = useMemo(() => {
    const start = (pagination.page - 1) * pagination.perPage;
    return displayedTransactions.slice(start, start + pagination.perPage);
  }, [displayedTransactions, pagination.page, pagination.perPage]);

  const pages = useMemo(() => {
    const current = Number(pagination.page) || 1;
    const last = Number(pagination.lastPage) || 1;
    return Array.from(new Set([1, current - 1, current, current + 1, last]))
      .filter((pageNumber) => pageNumber >= 1 && pageNumber <= last)
      .sort((left, right) => left - right);
  }, [pagination.page, pagination.lastPage]);

  const openActionTransaction = displayedTransactions.find((transaction) => transaction.id === openActionTransactionId) || null;

  const uniquePaymentMethods = useMemo(
    () => {
      const fromTransactions = transactions.map(getPaymentMethodLabel).filter((value) => value && value !== '-');
      const fromMethods = paymentMethods.map((method) => [method.channel, method.methodType].filter(Boolean).join(' '));
      return [...new Set([...fromMethods, ...fromTransactions].filter(Boolean))];
    },
    [paymentMethods, transactions]
  );

  useEffect(() => {
    setPage(1);
    setOpenActionTransactionId(null);
  }, [searchTerm, itemTypeFilter, statusFilter, methodFilter]);

  useEffect(() => {
    if (page > pagination.lastPage) {
      setPage(pagination.lastPage);
    }
  }, [page, pagination.lastPage]);

  useEffect(() => {
    if (openActionTransactionId === null) {
      return undefined;
    }

    function closeActions(event) {
      if (
        !event.target.closest?.('.admin-transactions-action-menu')
        && !event.target.closest?.('.admin-transactions-action-popover')
      ) {
        setOpenActionTransactionId(null);
      }
    }

    function closeWithEscape(event) {
      if (event.key === 'Escape') {
        setOpenActionTransactionId(null);
      }
    }

    document.addEventListener('mousedown', closeActions);
    document.addEventListener('keydown', closeWithEscape);

    return () => {
      document.removeEventListener('mousedown', closeActions);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, [openActionTransactionId]);

  useEffect(() => {
    if (openActionTransactionId === null) {
      return undefined;
    }

    function updateActionMenuPosition() {
      const button = actionButtonRefs.current.get(openActionTransactionId);
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const menuWidth = 190;
      const gap = 8;
      const left = Math.max(12, Math.min(window.innerWidth - menuWidth - 12, rect.right - menuWidth));
      const top = Math.max(12, Math.min(window.innerHeight - 12, rect.bottom + gap));
      setActionMenuPosition({ top, left });
    }

    updateActionMenuPosition();
    window.addEventListener('resize', updateActionMenuPosition);
    window.addEventListener('scroll', updateActionMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateActionMenuPosition);
      window.removeEventListener('scroll', updateActionMenuPosition, true);
    };
  }, [openActionTransactionId]);

  function updateFormField(name, value) {
    setFormData((current) => ({ ...current, [name]: value }));
  }

  function applyPaymentMethodToForm(methodName) {
    const selected = paymentMethods.find((method) => method.name === methodName);
    updateFormField('paymentMethod', methodName);
    if (selected) {
      setFormData((current) => ({
        ...current,
        paymentMethod: selected.name,
        paymentChannel: selected.channel || selected.methodType,
        paymentCode: selected.paymentCode,
        recipientName: selected.recipientName,
      }));
    }
  }

  function updatePaymentMethodFormField(name, value) {
    setPaymentMethodForm((current) => ({ ...current, [name]: value }));
  }

  function resetPaymentMethodForm({ clearMessage = true } = {}) {
    setPaymentMethodForm(initialPaymentMethodForm);
    if (clearMessage) {
      setPaymentMethodMessage('');
    }
  }

  function editPaymentMethod(method) {
    setPaymentMethodForm({
      id: method.id,
      name: method.name,
      methodType: method.methodType,
      channel: method.channel,
      recipientName: method.recipientName,
      paymentCode: method.paymentCode,
      isActive: method.isActive,
      imageFile: null,
    });
  }

  async function handlePaymentMethodSubmit(event) {
    event.preventDefault();
    setPaymentMethodSaving(true);
    setPaymentMethodMessage('Menyimpan metode pembayaran...');

    try {
      const payload = {
        name: paymentMethodForm.name,
        methodType: paymentMethodForm.methodType,
        channel: paymentMethodForm.channel,
        recipientName: paymentMethodForm.recipientName,
        paymentCode: paymentMethodForm.paymentCode,
        isActive: paymentMethodForm.isActive,
        imageFile: paymentMethodForm.imageFile,
      };

      if (paymentMethodForm.id) {
        await updatePaymentMethod(paymentMethodForm.id, payload);
        setPaymentMethodMessage('Metode pembayaran berhasil diperbarui.');
      } else {
        await createPaymentMethod(payload);
        setPaymentMethodMessage('Metode pembayaran berhasil ditambahkan.');
      }

      resetPaymentMethodForm({ clearMessage: false });
      await loadPaymentMethods();
    } catch (error) {
      setPaymentMethodMessage(error.message || 'Metode pembayaran gagal disimpan.');
    } finally {
      setPaymentMethodSaving(false);
    }
  }

  async function handlePaymentMethodDelete(method) {
    const confirmed = window.confirm(`Hapus metode pembayaran ${method.name}?`);
    if (!confirmed) return;

    setPaymentMethodSaving(true);
    setPaymentMethodMessage('Menghapus metode pembayaran...');

    try {
      await deletePaymentMethod(method.id);
      await loadPaymentMethods();
      setPaymentMethodMessage('Metode pembayaran berhasil dihapus.');
      if (paymentMethodForm.id === method.id) {
        resetPaymentMethodForm();
      }
    } catch (error) {
      setPaymentMethodMessage(error.message || 'Metode pembayaran gagal dihapus.');
    } finally {
      setPaymentMethodSaving(false);
    }
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
    setOpenActionTransactionId(null);
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
    setOpenActionTransactionId(null);
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
    setOpenActionTransactionId(null);
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

  function changePage(nextPage) {
    setPage(Math.max(1, Math.min(nextPage, pagination.lastPage)));
    setOpenActionTransactionId(null);
  }

  function openProof(transaction) {
    setOpenActionTransactionId(null);
    if (transaction.proofFile?.url) {
      window.open(transaction.proofFile.url, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <AdminPage pageClassName="admin-transactions-page" ariaLabel="Manajemen transaksi">
      <AdminTopbar
        searchPlaceholder="Cari nama, email, produk, order ID..."
        searchLabel="Cari transaksi"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <section className="admin-transactions-heading">
        <div>
          <h1>Transaksi</h1>
          <p>Dashboard <span>/</span> Transaksi</p>
        </div>
        <div className="admin-transactions-hero-actions">
          <button className="admin-transactions-manage" type="button" onClick={() => setIsCreateOpen((value) => !value)}>
            <span>{isCreateOpen ? 'Tutup Form Transaksi' : 'Tambah Transaksi'}</span>
          </button>
          <button className="admin-transactions-manage" type="button" onClick={() => setPaymentModalOpen(true)}>
            <img src={settingsIcon} alt="" />
            <span>Kelola Metode Pembayaran</span>
          </button>
        </div>
      </section>

      <nav className="admin-transactions-tabs" aria-label="Kategori transaksi">
        <button className={itemTypeFilter === '' ? 'is-active' : ''} type="button" onClick={() => setItemTypeFilter('')}>Semua Transaksi</button>
        <button className={itemTypeFilter === 'workshop' ? 'is-active' : ''} type="button" onClick={() => setItemTypeFilter('workshop')}>Workshop / Program</button>
        <button className={itemTypeFilter === 'project' ? 'is-active' : ''} type="button" onClick={() => setItemTypeFilter('project')}>Proyek</button>
        <button className={itemTypeFilter === 'ide' ? 'is-active' : ''} type="button" onClick={() => setItemTypeFilter('ide')}>ArduFlow IDE</button>
      </nav>

      <section className="admin-transactions-summary" aria-label="Ringkasan transaksi">
        <article>
          <span><img src={usersIcon} alt="" /></span>
          <div><p>Total Transaksi</p><strong>{formatNumber(summary.total)}</strong><small>Semua waktu</small></div>
        </article>
        <article>
          <span><img src={workshopIcon} alt="" /></span>
          <div><p>Workshop / Program</p><strong>{formatNumber(summary.workshop)}</strong><small>Semua waktu</small></div>
        </article>
        <article>
          <span><img src={projectIcon} alt="" /></span>
          <div><p>Proyek</p><strong>{formatNumber(summary.project)}</strong><small>Semua waktu</small></div>
        </article>
        <article>
          <span><img src={ideIcon} alt="" /></span>
          <div><p>ArduFlow IDE</p><strong>{formatNumber(summary.ide)}</strong><small>Semua waktu</small></div>
        </article>
        <article>
          <span><img src={revenueIcon} alt="" /></span>
          <div><p>Total Pendapatan</p><strong>{formatCurrency(summary.revenue)}</strong><small>Semua waktu</small></div>
        </article>
      </section>

      <section className="admin-transactions-create">
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
                <option value="ide">ArduFlow IDE</option>
                <option value="certificate">Sertifikat</option>
              </select>
            </label>
            <label>Nama Item<input required value={formData.itemTitle} onChange={(event) => updateFormField('itemTitle', event.target.value)} /></label>
            <label>Nominal<input type="number" min="0" value={formData.amount} onChange={(event) => updateFormField('amount', event.target.value)} /></label>
            <label>Metode Pembayaran
              <select value={formData.paymentMethod} onChange={(event) => applyPaymentMethodToForm(event.target.value)}>
                <option value="">Pilih metode</option>
                {paymentMethods.filter((method) => method.isActive).map((method) => (
                  <option value={method.name} key={method.id}>{method.name}</option>
                ))}
                <option value="Transfer Bank">Transfer Bank Manual</option>
                <option value="QRIS">QRIS Manual</option>
                <option value="E-Wallet">E-Wallet Manual</option>
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
        <section className="admin-transactions-panel" aria-label="Daftar transaksi">
          <div className="admin-transactions-table-header">
            <div>
              <h2>Daftar Transaksi</h2>
              <p>{formatNumber(displayedTransactions.length)} transaksi ditampilkan</p>
            </div>
            <span>{statusFilter ? statusLabel(statusFilter) : 'Semua Status'}</span>
          </div>
          <div className="admin-transactions-toolbar">
            <label className="admin-transactions-search">
              <input
                type="search"
                placeholder="Cari nama, email, produk, order ID..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <select value={itemTypeFilter} onChange={(event) => setItemTypeFilter(event.target.value)} aria-label="Filter produk">
              <option value="">Semua Produk</option>
              <option value="workshop">Workshop / Program</option>
              <option value="project">Proyek</option>
              <option value="ide">ArduFlow IDE</option>
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter status transaksi">
              <option value="">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="proof_uploaded">Menunggu Review</option>
              <option value="paid">Selesai</option>
              <option value="rejected">Ditolak</option>
              <option value="failed">Gagal</option>
              <option value="cancelled">Dibatalkan</option>
              <option value="refunded">Refund</option>
              <option value="expired">Kedaluwarsa</option>
            </select>
            <select value={methodFilter} onChange={(event) => setMethodFilter(event.target.value)} aria-label="Filter metode pembayaran">
              <option value="">Semua Metode</option>
                {uniquePaymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
              </select>
            <button type="button" onClick={resetFilters}>Reset</button>
            <button type="button" className="admin-transactions-export" disabled={!displayedTransactions.length} onClick={exportCurrentTransactions}>Export CSV</button>
          </div>
          <div className="admin-transactions-table-wrap">
            <table className="admin-transactions-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Tanggal</th>
                  <th>Produk</th>
                  <th>Pelanggan</th>
                  <th>Metode</th>
                  <th>Jumlah</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="8">Memuat transaksi...</td>
                  </tr>
                ) : displayedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="8">Belum ada transaksi sesuai filter.</td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td><strong>{transaction.invoiceNumber}</strong></td>
                      <td>{formatDate(transaction.paidAt || transaction.createdAt)}</td>
                      <td>
                        <span className="admin-transactions-product">
                          <b>{itemTypeLabel(transaction.itemType)}</b>
                          <small>{transaction.itemTitle || '-'}</small>
                        </span>
                      </td>
                      <td>{transaction.userName || '-'}<small>{transaction.email || '-'}</small></td>
                      <td>{getPaymentMethodLabel(transaction)}<small>{transaction.paymentCode || transaction.referenceNumber || '-'}</small></td>
                      <td>{formatCurrency(transaction.amount, transaction.currency)}</td>
                      <td>
                        <select className={`admin-transactions-status admin-transactions-status--${transaction.status}`} value={transaction.status} onChange={(event) => handleStatusChange(transaction, event.target.value)}>
                          <option value="pending">Menunggu</option>
                          <option value="proof_uploaded">Menunggu Review</option>
                          <option value="paid">Selesai</option>
                          <option value="rejected">Ditolak</option>
                          <option value="failed">Gagal</option>
                          <option value="cancelled">Dibatalkan</option>
                          <option value="refunded">Refund</option>
                          <option value="expired">Kedaluwarsa</option>
                        </select>
                      </td>
                      <td>
                        <div className="admin-transactions-actions admin-transactions-action-menu">
                          <button
                            type="button"
                            className="admin-transactions-action-trigger"
                            ref={(node) => {
                              if (node) {
                                actionButtonRefs.current.set(transaction.id, node);
                              } else {
                                actionButtonRefs.current.delete(transaction.id);
                              }
                            }}
                            aria-label={`Buka aksi untuk ${transaction.invoiceNumber}`}
                            aria-expanded={openActionTransactionId === transaction.id}
                            onClick={() => setOpenActionTransactionId((current) => (current === transaction.id ? null : transaction.id))}
                          >
                            ...
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-transactions-pagination">
            <button type="button" disabled={pagination.page <= 1} onClick={() => changePage(pagination.page - 1)}>
              Previous
            </button>
            <div>
              {pages.map((pageNumber) => (
                <button
                  type="button"
                  className={pageNumber === pagination.page ? 'is-active' : ''}
                  onClick={() => changePage(pageNumber)}
                  key={pageNumber}
                >
                  {pageNumber}
                </button>
              ))}
            </div>
            <span>
              Page {pagination.page} of {pagination.lastPage}
              <small>Menampilkan {pagination.from} - {pagination.to} dari {formatNumber(pagination.total)} transaksi</small>
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.lastPage}
              onClick={() => changePage(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </section>
      </section>
      {openActionTransaction ? (
        <div
          className="admin-transactions-action-popover"
          role="menu"
          style={{
            top: `${actionMenuPosition.top}px`,
            left: `${actionMenuPosition.left}px`,
          }}
        >
          <button
            type="button"
            role="menuitem"
            disabled={!openActionTransaction.proofFile?.url}
            onClick={() => openProof(openActionTransaction)}
          >
            Bukti
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!openActionTransaction.proofFile?.url || openActionTransaction.status === 'paid'}
            onClick={() => handleApprove(openActionTransaction)}
          >
            Setujui
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!openActionTransaction.proofFile?.url || openActionTransaction.status === 'paid'}
            onClick={() => handleReject(openActionTransaction)}
          >
            Tolak
          </button>
          <button
            type="button"
            role="menuitem"
            className="admin-transactions-action-danger"
            onClick={() => handleDelete(openActionTransaction)}
          >
            Hapus
          </button>
        </div>
      ) : null}
      {isPaymentModalOpen ? (
        <PaymentMethodsModal
          methods={paymentMethods}
          form={paymentMethodForm}
          isSaving={isPaymentMethodSaving}
          message={paymentMethodMessage}
          searchTerm={paymentSearchTerm}
          onSearchChange={setPaymentSearchTerm}
          onClose={() => setPaymentModalOpen(false)}
          onEdit={editPaymentMethod}
          onDelete={handlePaymentMethodDelete}
          onSubmit={handlePaymentMethodSubmit}
          onFormChange={updatePaymentMethodFormField}
          onResetForm={resetPaymentMethodForm}
        />
      ) : null}
    </AdminPage>
  );
}
