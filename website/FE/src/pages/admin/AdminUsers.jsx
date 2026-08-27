import { useEffect, useMemo, useState } from 'react';
import { AdminPage, AdminTopbar, createSlug } from './AdminChrome.jsx';
import {
  deleteAdminUser,
  getAdminUsers,
  resendAdminUserVerification,
  updateAdminUserStatus,
  verifyAdminUserEmail,
} from '../../services/authApi.js';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import userIcon from '../../assets/icons/icon-user-2.svg';
import mailIcon from '../../assets/icons/icon-mail-1.svg';
import settingsIcon from '../../assets/icons/icon-settings-1.svg';
import { showConfirmAlert, showErrorAlert, showSuccessAlert } from '../../utils/alerts.js';

const summaryIcons = {
  total: usersIcon,
  active: userIcon,
  unverified: mailIcon,
  newUsers: usersIcon,
  inactive: settingsIcon,
};

const initialFilters = {
  search: '',
  emailStatus: '',
  occupation: '',
  dateFrom: '',
  dateTo: '',
  page: 1,
  perPage: 10,
};

function UserBadge({ children }) {
  return <span className={`admin-users-badge admin-users-badge--${createSlug(children)}`}>{children}</span>;
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Number(value) || 0);
}

function formatDate(value, withTime = false) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

function timeAgo(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return 'baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return formatDate(value);
}

function userInitials(name) {
  return String(name || '-')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '-';
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

async function copyText(value) {
  const text = String(value || '');

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error('Clipboard tidak tersedia di browser ini.');
  }
}

function exportUsersCsv(users, filename = 'arduflow-users.csv') {
  if (!users.length) {
    showErrorAlert('Tidak Ada Data', 'Tidak ada user yang bisa diexport.');
    return 0;
  }

  const headers = [
    'ID',
    'Nama',
    'Username',
    'Email',
    'WhatsApp',
    'Pekerjaan / Instansi',
    'Status Email',
    'Status Akun',
    'Tanggal Daftar',
    'Login Terakhir',
  ];
  const rows = users.map((user) => [
    user.id,
    user.name,
    user.username,
    user.email,
    user.whatsapp,
    user.workplace,
    user.emailStatus,
    user.accountStatus,
    user.registeredAt,
    user.lastLoginAt || '',
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);

  return users.length;
}

export function AdminUsers() {
  const [filters, setFilters] = useState({ ...initialFilters });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [processingUserId, setProcessingUserId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getAdminUsers(filters)
      .then((response) => {
        if (!isMounted) return;
        setData(response.data || response);
        setError('');
        setSelectedIds([]);
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setError(requestError.message || 'Gagal memuat data user.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const users = data?.users || [];
  const summary = data?.summary || [];
  const problems = data?.problems || [];
  const activities = data?.activities || [];
  const pagination = data?.pagination || { page: 1, perPage: 10, total: 0, from: 0, to: 0, lastPage: 1 };
  const allCurrentUsersSelected = users.length > 0 && selectedIds.length === users.length;
  const selectedUser = users.find((user) => user.id === selectedUserId) || null;
  const pages = useMemo(() => {
    const current = Number(pagination.page) || 1;
    const last = Number(pagination.lastPage) || 1;
    return Array.from(new Set([1, current - 1, current, current + 1, last]))
      .filter((page) => page >= 1 && page <= last)
      .sort((left, right) => left - right);
  }, [pagination.page, pagination.lastPage]);

  useEffect(() => {
    if (!isDetailOpen) {
      return undefined;
    }

    function closeWithEscape(event) {
      if (event.key === 'Escape') {
        setDetailOpen(false);
      }
    }

    document.addEventListener('keydown', closeWithEscape);

    return () => {
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, [isDetailOpen]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  }

  function resetFilters() {
    setFilters({ ...initialFilters });
  }

  function resetFiltersWithFeedback() {
    resetFilters();
    showSuccessAlert('Filter Direset', 'Filter user dikembalikan ke kondisi awal.');
  }

  function refreshUsers() {
    setFilters((current) => ({ ...current }));
  }

  function refreshUsersWithFeedback() {
    refreshUsers();
    showSuccessAlert('Data Diperbarui', 'Daftar user sedang dimuat ulang.');
  }

  function removeUserFromSelection(userId) {
    setSelectedIds((current) => current.filter((item) => item !== userId));
    if (selectedUserId === userId) {
      setSelectedUserId(null);
      setDetailOpen(false);
    }
  }

  function changePage(page) {
    setFilters((current) => ({ ...current, page }));
  }

  function toggleUser(id) {
    setSelectedIds((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ));
  }

  function toggleAllUsers() {
    setSelectedIds(allCurrentUsersSelected ? [] : users.map((user) => user.id));
  }

  function openUserDetail(user) {
    setSelectedUserId(user.id);
    setDetailOpen(true);
  }

  async function copyUser(user) {
    try {
      await copyText([
        user.name,
        user.username,
        user.email,
        user.whatsapp,
        user.workplace,
      ].join('\n'));
      showSuccessAlert('Data Disalin', `Data "${user.name}" berhasil disalin ke clipboard.`);
    } catch (copyError) {
      showErrorAlert('Gagal Menyalin', copyError.message || 'Browser tidak mengizinkan akses clipboard.');
    }
  }

  function exportSelectedUsers() {
    const selectedUsers = users.filter((user) => selectedIds.includes(user.id));
    const exported = exportUsersCsv(selectedUsers.length ? selectedUsers : users, 'arduflow-selected-users.csv');
    if (exported > 0) {
      showSuccessAlert('Export Berhasil', `${exported} user berhasil disiapkan sebagai CSV.`);
    }
  }

  function exportVisibleUsers(filename = 'arduflow-users.csv') {
    const exported = exportUsersCsv(users, filename);
    if (exported > 0) {
      showSuccessAlert('Export Berhasil', `${exported} user berhasil disiapkan sebagai CSV.`);
    }
  }

  async function toggleAccountStatus(user) {
    const nextStatus = !user.isActive;
    const actionLabel = nextStatus ? 'mengaktifkan' : 'menonaktifkan';
    const confirmed = await showConfirmAlert({
      title: nextStatus ? 'Aktifkan Akun?' : 'Nonaktifkan Akun?',
      text: `Yakin ingin ${actionLabel} akun "${user.name}"?${nextStatus ? '' : ' Sesi login aktif user akan diputus.'}`,
      confirmButtonText: nextStatus ? 'Aktifkan' : 'Nonaktifkan',
    });
    if (!confirmed) return;

    setProcessingUserId(user.id);
    setError('');
    try {
      await updateAdminUserStatus(user.id, nextStatus);
      refreshUsers();
      showSuccessAlert(
        nextStatus ? 'Akun Diaktifkan' : 'Akun Dinonaktifkan',
        `Akun "${user.name}" berhasil ${nextStatus ? 'diaktifkan' : 'dinonaktifkan'}.`
      );
    } catch (requestError) {
      setError(requestError.message || `Gagal ${actionLabel} akun user.`);
      showErrorAlert('Gagal', requestError.message || `Gagal ${actionLabel} akun user.`);
    } finally {
      setProcessingUserId(null);
    }
  }

  async function setSelectedAccountStatus(isActive) {
    const selectedUsers = users.filter((user) => selectedIds.includes(user.id));
    if (!selectedUsers.length) return;

    const confirmed = await showConfirmAlert({
      title: isActive ? 'Aktifkan User Terpilih?' : 'Nonaktifkan User Terpilih?',
      text: `${selectedUsers.length} akun akan ${isActive ? 'diaktifkan' : 'dinonaktifkan'}.`,
      confirmButtonText: isActive ? 'Aktifkan' : 'Nonaktifkan',
    });
    if (!confirmed) return;

    setProcessingUserId('bulk-status');
    setError('');
    try {
      await Promise.all(selectedUsers.map((user) => updateAdminUserStatus(user.id, isActive)));
      setSelectedIds([]);
      refreshUsers();
      showSuccessAlert('Berhasil', `${selectedUsers.length} akun berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
    } catch (requestError) {
      setError(requestError.message || 'Gagal mengubah status user terpilih.');
      showErrorAlert('Gagal', requestError.message || 'Gagal mengubah status user terpilih.');
    } finally {
      setProcessingUserId(null);
    }
  }

  async function deleteUserAccount(user) {
    const confirmed = await showConfirmAlert({
      title: 'Hapus Akun?',
      text: `Yakin ingin menghapus akun "${user.name}"? Akun ini akan terhapus dari daftar user dan sesi login akan diputus.`,
      confirmButtonText: 'Hapus',
    });
    if (!confirmed) return;

    setProcessingUserId(user.id);
    setError('');
    try {
      await deleteAdminUser(user.id);
      removeUserFromSelection(user.id);
      refreshUsers();
      showSuccessAlert('Akun Dihapus', `Akun "${user.name}" berhasil dihapus.`);
    } catch (requestError) {
      setError(requestError.message || 'Gagal menghapus akun user.');
      showErrorAlert('Gagal', requestError.message || 'Gagal menghapus akun user.');
    } finally {
      setProcessingUserId(null);
    }
  }

  async function deleteSelectedUsers() {
    const selectedUsers = users.filter((user) => selectedIds.includes(user.id));
    if (!selectedUsers.length) return;

    const confirmed = await showConfirmAlert({
      title: 'Hapus User Terpilih?',
      text: `${selectedUsers.length} akun akan dihapus dari daftar user dan sesi aktifnya diputus.`,
      confirmButtonText: 'Hapus',
    });
    if (!confirmed) return;

    setProcessingUserId('bulk-delete');
    setError('');
    try {
      await Promise.all(selectedUsers.map((user) => deleteAdminUser(user.id)));
      setSelectedIds([]);
      if (selectedUser && selectedIds.includes(selectedUser.id)) {
        setSelectedUserId(null);
        setDetailOpen(false);
      }
      refreshUsers();
      showSuccessAlert('Berhasil', `${selectedUsers.length} akun berhasil dihapus.`);
    } catch (requestError) {
      setError(requestError.message || 'Gagal menghapus user terpilih.');
      showErrorAlert('Gagal', requestError.message || 'Gagal menghapus user terpilih.');
    } finally {
      setProcessingUserId(null);
    }
  }

  async function verifyUserEmail(user) {
    const confirmed = await showConfirmAlert({
      title: 'Verifikasi Email Manual?',
      text: `Email "${user.email}" akan ditandai terverifikasi.`,
      confirmButtonText: 'Verifikasi',
      icon: 'question',
    });
    if (!confirmed) return;

    setProcessingUserId(user.id);
    setError('');
    try {
      await verifyAdminUserEmail(user.id);
      refreshUsers();
      showSuccessAlert('Email Terverifikasi', `Email "${user.email}" berhasil diverifikasi.`);
    } catch (requestError) {
      setError(requestError.message || 'Gagal memverifikasi email user.');
      showErrorAlert('Gagal', requestError.message || 'Gagal memverifikasi email user.');
    } finally {
      setProcessingUserId(null);
    }
  }

  async function resendVerificationEmail(user) {
    const confirmed = await showConfirmAlert({
      title: 'Kirim Ulang Verifikasi?',
      text: `Email verifikasi akan dikirim ulang ke "${user.email}".`,
      confirmButtonText: 'Kirim',
      icon: 'question',
    });
    if (!confirmed) return;

    setProcessingUserId(user.id);
    setError('');
    try {
      const response = await resendAdminUserVerification(user.id);
      refreshUsers();
      if (response.emailSent) {
        showSuccessAlert('Email Terkirim', `Email verifikasi berhasil dikirim ke "${user.email}".`);
      } else {
        showSuccessAlert('Token Dibuat', response.verifyUrl || 'Token verifikasi baru berhasil dibuat.');
      }
    } catch (requestError) {
      setError(requestError.message || 'Gagal mengirim ulang verifikasi.');
      showErrorAlert('Gagal', requestError.message || 'Gagal mengirim ulang verifikasi.');
    } finally {
      setProcessingUserId(null);
    }
  }

  return (
    <AdminPage pageClassName="admin-users-page" ariaLabel="Manajemen user admin">
      <AdminTopbar
        searchPlaceholder="Cari data user"
        searchLabel="Cari data user"
        searchValue={filters.search}
        onSearchChange={(value) => updateFilter('search', value)}
      />

      <div className="admin-users-layout">
        <section className="admin-users-content">
          <div className="admin-users-heading">
            <div>
              <h1>Manajemen User</h1>
              <p>Dashboard <span>/</span> Manajemen User</p>
              {error ? <small className="admin-dashboard-error">{error}</small> : null}
            </div>
            <button type="button" onClick={refreshUsersWithFeedback}>Refresh Data</button>
          </div>

          <section className="admin-users-summary" aria-label="Ringkasan user">
            {summary.length ? summary.map((item) => (
              <article className="admin-users-stat" key={item.id || item.label}>
                <span><img src={summaryIcons[item.id] || usersIcon} alt="" /></span>
                <div>
                  <p>{item.label}</p>
                  <strong>{formatNumber(item.value)}</strong>
                  <small>{item.note}</small>
                </div>
              </article>
            )) : (
              <p className="admin-empty-state admin-empty-state--wide">
                {loading ? 'Memuat ringkasan user...' : 'Belum ada ringkasan user.'}
              </p>
            )}
          </section>

          <section className="admin-users-filter" aria-label="Filter user">
            <div className="admin-users-filter-row">
              <label className="admin-users-search">
                <input
                  type="search"
                  id="admin-users-search"
                  name="admin-users-search"
                  placeholder="Search by nama, email, username, WhatsApp..."
                  value={filters.search}
                  onChange={(event) => updateFilter('search', event.target.value)}
                />
              </label>
              <button type="button" onClick={resetFiltersWithFeedback}>Reset Filter</button>
              <button type="button" onClick={refreshUsersWithFeedback}>Refresh</button>
            </div>
            <div className="admin-users-select-grid">
              <label>
                <span>Status Email</span>
                <select
                  name="admin-users-email-status"
                  value={filters.emailStatus}
                  onChange={(event) => updateFilter('emailStatus', event.target.value)}
                >
                  <option value="">Semua</option>
                  <option value="verified">Terverifikasi</option>
                  <option value="unverified">Belum Verifikasi</option>
                </select>
              </label>
              <label>
                <span>Pekerjaan / Instansi</span>
                <input
                  type="search"
                  name="admin-users-occupation"
                  placeholder="Cari pekerjaan atau instansi"
                  value={filters.occupation}
                  onChange={(event) => updateFilter('occupation', event.target.value)}
                />
              </label>
              <label>
                <span>Dari Tanggal</span>
                <input
                  type="date"
                  name="admin-users-date-from"
                  value={filters.dateFrom}
                  onChange={(event) => updateFilter('dateFrom', event.target.value)}
                />
              </label>
              <label>
                <span>Sampai Tanggal</span>
                <input
                  type="date"
                  name="admin-users-date-to"
                  value={filters.dateTo}
                  onChange={(event) => updateFilter('dateTo', event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="admin-users-toolbar">
            <span>{selectedIds.length} dipilih</span>
            <button type="button" className="admin-users-primary" disabled={!selectedIds.length} onClick={exportSelectedUsers}>Export Terpilih</button>
            <button type="button" disabled={!selectedIds.length || processingUserId === 'bulk-status'} onClick={() => setSelectedAccountStatus(true)}>Aktifkan Terpilih</button>
            <button type="button" disabled={!selectedIds.length || processingUserId === 'bulk-status'} onClick={() => setSelectedAccountStatus(false)}>Nonaktifkan Terpilih</button>
            <button type="button" className="admin-users-action-danger" disabled={!selectedIds.length || processingUserId === 'bulk-delete'} onClick={deleteSelectedUsers}>Hapus Terpilih</button>
            <button type="button" disabled={!users.length} onClick={() => exportVisibleUsers()}>Export CSV</button>
            <button type="button" onClick={refreshUsersWithFeedback}>Refresh</button>
          </section>

          <section className="admin-users-table-card">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Pilih semua user"
                      checked={allCurrentUsersSelected}
                      onChange={toggleAllUsers}
                    />
                  </th>
                  <th>Nama Lengkap</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>WhatsApp</th>
                  <th>Pekerjaan / Instansi</th>
                  <th>Status Email</th>
                  <th>Status Akun</th>
                  <th>Tgl. Daftar</th>
                  <th>Login Terakhir</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.length ? users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Pilih ${user.name}`}
                        checked={selectedIds.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                      />
                    </td>
                    <td><span className="admin-users-avatar" />{user.name}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.whatsapp}</td>
                    <td>{user.workplace}</td>
                    <td><UserBadge>{user.emailStatus}</UserBadge></td>
                    <td><UserBadge>{user.accountStatus}</UserBadge></td>
                    <td>{formatDate(user.registeredAt)}</td>
                    <td>{user.lastLoginAt ? timeAgo(user.lastLoginAt) : '-'}</td>
                    <td>
                      <div className="admin-users-actions">
                        <button type="button" aria-label={`Lihat ${user.name}`} onClick={() => openUserDetail(user)}>Detail</button>
                        <button type="button" aria-label={`Salin ${user.name}`} onClick={() => copyUser(user)}>Copy</button>
                        {user.emailStatus !== 'Terverifikasi' ? (
                          <>
                            <button
                              type="button"
                              disabled={processingUserId === user.id}
                              aria-label={`Verifikasi email ${user.name}`}
                              onClick={() => verifyUserEmail(user)}
                            >
                              Verifikasi
                            </button>
                            <button
                              type="button"
                              disabled={processingUserId === user.id}
                              aria-label={`Kirim ulang verifikasi ${user.name}`}
                              onClick={() => resendVerificationEmail(user)}
                            >
                              Kirim Ulang
                            </button>
                          </>
                        ) : null}
                        <button
                          type="button"
                          disabled={processingUserId === user.id}
                          aria-label={`${user.isActive ? 'Nonaktifkan' : 'Aktifkan'} ${user.name}`}
                          onClick={() => toggleAccountStatus(user)}
                        >
                          {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          type="button"
                          className="admin-users-action-danger"
                          disabled={processingUserId === user.id}
                          aria-label={`Hapus ${user.name}`}
                          onClick={() => deleteUserAccount(user)}
                        >
                          Hapus
                        </button>
                        <a href={`mailto:${user.email}`} aria-label={`Email ${user.name}`}>Email</a>
                        {user.whatsapp !== '-' ? (
                          <a href={`https://wa.me/${String(user.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${user.name}`}>WA</a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="11">{loading ? 'Memuat data user...' : 'Belum ada user sesuai filter.'}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="admin-users-pagination">
              <span>
                Menampilkan {pagination.from} - {pagination.to} dari {formatNumber(pagination.total)} user
              </span>
              <div>
                <button type="button" disabled={pagination.page <= 1} onClick={() => changePage(pagination.page - 1)}>{'<'}</button>
                {pages.map((page) => (
                  <button
                    type="button"
                    className={page === pagination.page ? 'is-active' : ''}
                    onClick={() => changePage(page)}
                    key={page}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={pagination.page >= pagination.lastPage}
                  onClick={() => changePage(pagination.page + 1)}
                >
                  {'>'}
                </button>
              </div>
            </div>
          </section>

          <section className="admin-users-bottom">
            <article className="admin-users-panel">
              <h2>User Bermasalah</h2>
              {problems.length ? problems.map((item) => (
                <p key={item.label}><span>{item.label}</span><strong>{formatNumber(item.count)}</strong></p>
              )) : (
                <p><span>Belum ada data masalah user.</span><strong>0</strong></p>
              )}
            </article>

            <article className="admin-users-panel">
              <h2>Aktivitas User Terbaru</h2>
              {activities.length ? activities.map((item) => (
                <p key={`${item.name}-${item.action}-${item.time}`}>
                  <span><b>{item.name}</b>{item.action}</span>
                  <time>{timeAgo(item.time)}</time>
                </p>
              )) : (
                <p><span>Belum ada aktivitas user.</span><time>-</time></p>
              )}
            </article>

            <article className="admin-users-panel">
              <h2>Aksi Cepat</h2>
              <button type="button" disabled={!selectedIds.length} onClick={exportSelectedUsers}>Export User Terpilih</button>
              <button type="button" disabled={!selectedIds.length || processingUserId === 'bulk-status'} onClick={() => setSelectedAccountStatus(true)}>Aktifkan User Terpilih</button>
              <button type="button" disabled={!selectedIds.length || processingUserId === 'bulk-status'} onClick={() => setSelectedAccountStatus(false)}>Nonaktifkan User Terpilih</button>
              <button type="button" className="admin-users-action-danger" disabled={!selectedIds.length || processingUserId === 'bulk-delete'} onClick={deleteSelectedUsers}>Hapus User Terpilih</button>
              <button type="button" disabled={!users.length} onClick={() => exportVisibleUsers()}>Export Semua User</button>
              <button type="button" onClick={refreshUsersWithFeedback}>Muat Ulang Data</button>
            </article>
          </section>
        </section>
      </div>

      {isDetailOpen && selectedUser && (
        <div
          className="admin-users-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Detail user ${selectedUser.name}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDetailOpen(false);
            }
          }}
        >
          <aside className="admin-users-detail admin-users-detail--modal">
            <div className="admin-users-detail-head">
              <h2>Detail User</h2>
              <button type="button" aria-label="Tutup detail user" onClick={() => setDetailOpen(false)}>x</button>
            </div>
            <div className="admin-users-detail-profile">
              <span className="admin-users-detail-avatar">{userInitials(selectedUser.name)}</span>
              <h3>{selectedUser.name}</h3>
              <p>{selectedUser.email}</p>
              <UserBadge>{selectedUser.accountStatus}</UserBadge>
            </div>
            <dl>
              <dt>ID User</dt><dd>{selectedUser.id}</dd>
              <dt>Username</dt><dd>{selectedUser.username}</dd>
              <dt>WhatsApp</dt><dd>{selectedUser.whatsapp}</dd>
              <dt>Pekerjaan / Instansi</dt><dd>{selectedUser.workplace}</dd>
              <dt>Status Email</dt><dd><UserBadge>{selectedUser.emailStatus}</UserBadge></dd>
              <dt>Status Akun</dt><dd><UserBadge>{selectedUser.accountStatus}</UserBadge></dd>
              <dt>Status Sesi</dt><dd>{selectedUser.sessionStatus || '-'}</dd>
              <dt>Tanggal Daftar</dt><dd>{formatDate(selectedUser.registeredAt, true)}</dd>
              <dt>Login Terakhir</dt><dd>{selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt, true) : '-'}</dd>
            </dl>
            <section className="admin-users-detail-stats">
              <span><b>Email</b>{selectedUser.email}</span>
              <span><b>WhatsApp</b>{selectedUser.whatsapp}</span>
              <span><b>Terdaftar</b>{formatDate(selectedUser.registeredAt)}</span>
              <span><b>Sesi</b>{selectedUser.sessionStatus || '-'}</span>
            </section>
            <h3>Aksi User</h3>
            <div className="admin-users-detail-actions">
              <a href={`mailto:${selectedUser.email}`}>Balas Email</a>
              {selectedUser.whatsapp !== '-' ? (
                <a href={`https://wa.me/${String(selectedUser.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer">Hubungi WhatsApp</a>
              ) : null}
              <button type="button" onClick={() => copyUser(selectedUser)}>Salin Data</button>
              {selectedUser.emailStatus !== 'Terverifikasi' ? (
                <>
                  <button
                    type="button"
                    disabled={processingUserId === selectedUser.id}
                    onClick={() => verifyUserEmail(selectedUser)}
                  >
                    Verifikasi Email
                  </button>
                  <button
                    type="button"
                    disabled={processingUserId === selectedUser.id}
                    onClick={() => resendVerificationEmail(selectedUser)}
                  >
                    Kirim Ulang Verifikasi
                  </button>
                </>
              ) : null}
              <button
                type="button"
                disabled={processingUserId === selectedUser.id}
                onClick={() => toggleAccountStatus(selectedUser)}
              >
                {selectedUser.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
              </button>
              <button
                type="button"
                className="admin-users-action-danger"
                disabled={processingUserId === selectedUser.id}
                onClick={() => deleteUserAccount(selectedUser)}
              >
                Hapus Akun
              </button>
              <button type="button" onClick={() => {
                setSelectedIds((current) => (
                  current.includes(selectedUser.id) ? current : [...current, selectedUser.id]
                ));
                showSuccessAlert('User Dipilih', `"${selectedUser.name}" masuk ke daftar pilihan.`);
              }}>
                Pilih User
              </button>
            </div>
          </aside>
        </div>
      )}
    </AdminPage>
  );
}
