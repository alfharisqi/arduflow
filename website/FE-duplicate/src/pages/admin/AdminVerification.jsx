import { useEffect, useMemo, useState } from 'react';
import { AdminPage, AdminTopbar, createSlug } from './AdminChrome.jsx';
import {
  clearAdminVerificationTokens,
  getAdminUsers,
  resendAdminUserVerification,
  updateAdminUserStatus,
  verifyAdminUserEmail,
} from '../../services/authApi.js';
import {
  showArduflowAlert,
  showConfirmAlert,
  showErrorAlert,
  showSuccessAlert,
} from '../../utils/alerts.js';
import mailIcon from '../../assets/icons/icon-mail-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import arrowIcon from '../../assets/icons/icon-arrow-right-1.svg';

const initialFilters = {
  search: '',
  emailStatus: '',
  dateFrom: '',
  role: '',
  page: 1,
  perPage: 10,
};

function VerificationBadge({ children }) {
  return <span className={`admin-verification-badge admin-verification-badge--${createSlug(children)}`}>{children}</span>;
}

function ActionButton({ label, children, onClick, disabled = false }) {
  return (
    <button className="admin-verification-action" type="button" aria-label={label} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Number(value) || 0);
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getTokenStatus(user) {
  if (user.emailStatus === 'Terverifikasi') return 'Terverifikasi';
  if (!user.hasVerificationToken && !user.verificationSentAt) return 'Belum Terkirim';
  if (!user.hasVerificationToken) return 'Token Kosong';
  return 'Aktif';
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

function exportUsersCsv(users) {
  const rows = [
    ['ID', 'Nama', 'Username', 'Email', 'WhatsApp', 'Status Email', 'Status Akun', 'Tanggal Daftar', 'Kirim Terakhir'],
    ...users.map((user) => [
      user.id,
      user.name,
      user.username,
      user.email,
      user.whatsapp,
      user.emailStatus,
      user.accountStatus,
      user.registeredAt,
      user.verificationSentAt || '',
    ]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'arduflow-verification-users.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminVerification() {
  const [filters, setFilters] = useState(initialFilters);
  const [data, setData] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const users = data?.users || [];
  const summary = data?.summary || [];
  const problems = data?.problems || [];
  const activities = data?.activities || [];
  const pagination = data?.pagination || { page: 1, perPage: 10, total: 0, from: 0, to: 0, lastPage: 1 };
  const selectedAll = users.length > 0 && selectedIds.length === users.length;

  const stats = useMemo(() => {
    const totalSummary = summary.find((item) => item.id === 'total');
    const unverifiedSummary = summary.find((item) => item.id === 'unverified');
    const inactiveSummary = summary.find((item) => item.id === 'inactive');
    const sentCount = users.filter((user) => user.verificationSentAt && user.emailStatus !== 'Terverifikasi').length;
    const verifiedCount = users.filter((user) => user.emailStatus === 'Terverifikasi').length;

    return [
      {
        label: 'Total Belum Verifikasi',
        value: unverifiedSummary?.value ?? 0,
        note: unverifiedSummary?.note || 'Data user asli',
        icon: mailIcon,
        tone: 'orange',
      },
      { label: 'Email Terkirim', value: sentCount, note: 'Di halaman ini', icon: arrowIcon, tone: 'blue' },
      { label: 'Token Kosong', value: users.filter((user) => !user.hasVerificationToken && user.emailStatus !== 'Terverifikasi').length, note: 'Perlu generate token', icon: clockIcon, tone: 'purple' },
      { label: 'Terverifikasi', value: verifiedCount, note: 'Di halaman ini', icon: checkIcon, tone: 'green' },
      { label: 'Total User', value: totalSummary?.value ?? users.length, note: inactiveSummary?.note || 'Semua akun', icon: usersIcon, tone: 'blue' },
    ];
  }, [summary, users]);

  const pages = useMemo(() => {
    const current = Number(pagination.page) || 1;
    const last = Number(pagination.lastPage) || 1;
    return Array.from(new Set([1, current - 1, current, current + 1, last]))
      .filter((page) => page >= 1 && page <= last)
      .sort((left, right) => left - right);
  }, [pagination.page, pagination.lastPage]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getAdminUsers({
      search: filters.search,
      emailStatus: filters.emailStatus,
      dateFrom: filters.dateFrom,
      page: filters.page,
      perPage: filters.perPage,
    })
      .then((response) => {
        if (!mounted) return;
        setData(response.data || response);
        setSelectedIds([]);
        setError('');
      })
      .catch((requestError) => {
        if (!mounted) return;
        setError(requestError.message || 'Gagal memuat data verifikasi akun.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [filters]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? value : 1 }));
  }

  function refreshData() {
    setFilters((current) => ({ ...current }));
  }

  function toggleUser(userId) {
    setSelectedIds((current) => (
      current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId]
    ));
  }

  function toggleAll() {
    setSelectedIds(selectedAll ? [] : users.map((user) => user.id));
  }

  async function handleResend(user) {
    if (!user?.id) return;

    setProcessingId(user.id);
    try {
      const result = await resendAdminUserVerification(user.id);
      await navigator.clipboard?.writeText(result.verifyUrl || result.token || '');
      await showSuccessAlert(
        result.emailSent ? 'Email Terkirim' : 'Token Dibuat',
        result.emailSent
          ? 'Email verifikasi berhasil dikirim ulang. Link juga disalin ke clipboard.'
          : 'Email tidak terkirim. Link verifikasi sudah disalin ke clipboard untuk dikirim manual.'
      );
      refreshData();
    } catch (requestError) {
      await showErrorAlert('Gagal', requestError.message || 'Gagal membuat token verifikasi.');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCopyToken(user) {
    if (!user?.hasVerificationToken) {
      await showArduflowAlert({
        icon: 'info',
        title: 'Token Tidak Tersedia',
        text: 'Generate token baru terlebih dahulu agar link bisa disalin.',
      });
      return;
    }

    await handleResend(user);
  }

  async function handleManualVerify(user) {
    const confirmed = await showConfirmAlert({
      title: 'Verifikasi Manual?',
      text: `Email "${user.email}" akan ditandai terverifikasi.`,
      confirmButtonText: 'Verifikasi',
    });
    if (!confirmed) return;

    setProcessingId(user.id);
    try {
      await verifyAdminUserEmail(user.id);
      await showSuccessAlert('Terverifikasi', 'Email user berhasil diverifikasi manual.');
      setSelectedUser((current) => (current?.id === user.id ? { ...current, emailStatus: 'Terverifikasi' } : current));
      refreshData();
    } catch (requestError) {
      await showErrorAlert('Gagal', requestError.message || 'Gagal verifikasi manual.');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleToggleActive(user) {
    const nextStatus = !user.isActive;
    const confirmed = await showConfirmAlert({
      title: nextStatus ? 'Aktifkan Akun?' : 'Nonaktifkan Akun?',
      text: `Akun "${user.name}" akan ${nextStatus ? 'diaktifkan' : 'dinonaktifkan'}.`,
      confirmButtonText: nextStatus ? 'Aktifkan' : 'Nonaktifkan',
    });
    if (!confirmed) return;

    setProcessingId(user.id);
    try {
      await updateAdminUserStatus(user.id, nextStatus);
      await showSuccessAlert('Berhasil', nextStatus ? 'Akun berhasil diaktifkan.' : 'Akun berhasil dinonaktifkan.');
      setSelectedUser(null);
      refreshData();
    } catch (requestError) {
      await showErrorAlert('Gagal', requestError.message || 'Gagal mengubah status akun.');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleClearTokens() {
    const confirmed = await showConfirmAlert({
      title: 'Bersihkan Token?',
      text: 'Semua token verifikasi user yang belum terverifikasi akan dikosongkan.',
      confirmButtonText: 'Bersihkan',
    });
    if (!confirmed) return;

    try {
      const result = await clearAdminVerificationTokens();
      await showSuccessAlert('Token Dibersihkan', `${formatNumber(result.count || 0)} token dibersihkan.`);
      refreshData();
    } catch (requestError) {
      await showErrorAlert('Gagal', requestError.message || 'Gagal membersihkan token.');
    }
  }

  async function handleResendSelected() {
    const targets = users.filter((user) => selectedIds.includes(user.id) && user.emailStatus !== 'Terverifikasi');
    if (targets.length === 0) {
      await showArduflowAlert({ icon: 'info', title: 'Tidak Ada User', text: 'Pilih minimal satu user belum verifikasi.' });
      return;
    }

    const confirmed = await showConfirmAlert({
      title: 'Kirim Ulang Token?',
      text: `${formatNumber(targets.length)} user akan dibuatkan token verifikasi baru.`,
      confirmButtonText: 'Kirim',
    });
    if (!confirmed) return;

    for (const user of targets) {
      await resendAdminUserVerification(user.id);
    }
    await showSuccessAlert('Selesai', `${formatNumber(targets.length)} token verifikasi berhasil dibuat.`);
    refreshData();
  }

  return (
    <AdminPage pageClassName="admin-verification-page" ariaLabel="Verifikasi akun admin">
      <AdminTopbar searchPlaceholder="Cari verifikasi akun" searchLabel="Cari verifikasi akun" />

      <div className="admin-verification-layout">
        <section className="admin-verification-content">
          <div className="admin-verification-heading">
            <div>
              <h1>Verifikasi Akun</h1>
              <p>Dashboard <span>/</span> Verifikasi Akun</p>
              {error ? <small className="admin-dashboard-error">{error}</small> : null}
            </div>
            <button type="button" onClick={refreshData}>Refresh Data</button>
          </div>

          <section className="admin-verification-stats" aria-label="Ringkasan verifikasi">
            {stats.map((item) => (
              <article className="admin-verification-stat" key={item.label}>
                <span className={`admin-verification-stat-icon is-${item.tone}`}>
                  <img src={item.icon} alt="" />
                </span>
                <div>
                  <p>{item.label}</p>
                  <strong>{formatNumber(item.value)}</strong>
                  <small>{item.note}</small>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-verification-filter" aria-label="Filter verifikasi akun">
            <label className="admin-verification-search">
              <input type="search" placeholder="Cari nama atau email..." value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} />
            </label>
            <label>
              <span>Status Email</span>
              <select value={filters.emailStatus} onChange={(event) => updateFilter('emailStatus', event.target.value)}>
                <option value="">Semua Status</option>
                <option value="unverified">Belum Verifikasi</option>
                <option value="verified">Terverifikasi</option>
              </select>
            </label>
            <label>
              <span>Tanggal Daftar</span>
              <input type="date" value={filters.dateFrom} onChange={(event) => updateFilter('dateFrom', event.target.value)} />
            </label>
            <label>
              <span>Role User</span>
              <select value={filters.role} onChange={(event) => updateFilter('role', event.target.value)}>
                <option value="">Semua Role</option>
                <option value="User">User</option>
              </select>
            </label>
            <button type="button" onClick={() => setFilters(initialFilters)}>Reset Filter</button>
          </section>

          <section className="admin-verification-table-card">
            <div className="admin-verification-card-head">
              <h2>Daftar Akun dan Status Verifikasi</h2>
            </div>
            <table className="admin-verification-table">
              <thead>
                <tr>
                  <th><input type="checkbox" aria-label="Pilih semua akun" checked={selectedAll} onChange={toggleAll} /></th>
                  <th>Nama User</th>
                  <th>Email</th>
                  <th>WhatsApp</th>
                  <th>Tanggal Daftar</th>
                  <th>Status Email</th>
                  <th>Token Status</th>
                  <th>Waktu Kirim Terakhir</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="9">Memuat data verifikasi...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan="9">Tidak ada data user.</td></tr>
                ) : users.map((user) => (
                  <tr key={user.id}>
                    <td><input type="checkbox" aria-label={`Pilih ${user.name}`} checked={selectedIds.includes(user.id)} onChange={() => toggleUser(user.id)} /></td>
                    <td><span className="admin-verification-avatar">{userInitials(user.name)}</span><span><b>{user.name || '-'}</b><small>{user.username || '-'}</small></span></td>
                    <td>{user.email || '-'}</td>
                    <td>{user.whatsapp || '-'}</td>
                    <td>{formatDateTime(user.registeredAt)}</td>
                    <td><VerificationBadge>{user.emailStatus || '-'}</VerificationBadge></td>
                    <td><VerificationBadge>{getTokenStatus(user)}</VerificationBadge></td>
                    <td>{formatDateTime(user.verificationSentAt)}</td>
                    <td>
                      <div className="admin-verification-actions">
                        <ActionButton label={`Kirim ulang verifikasi ${user.name}`} disabled={processingId === user.id} onClick={() => handleResend(user)}>Kirim</ActionButton>
                        <ActionButton label={`Salin token ${user.name}`} disabled={processingId === user.id} onClick={() => handleCopyToken(user)}>Copy</ActionButton>
                        <ActionButton label={`Verifikasi manual ${user.name}`} disabled={processingId === user.id || user.emailStatus === 'Terverifikasi'} onClick={() => handleManualVerify(user)}>OK</ActionButton>
                        <ActionButton label={`Generate token baru ${user.name}`} disabled={processingId === user.id} onClick={() => handleResend(user)}>Token</ActionButton>
                        <ActionButton label={`Lihat detail ${user.name}`} onClick={() => setSelectedUser(user)}>
                          <img src={eyeIcon} alt="" />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="admin-verification-pagination">
              <span>Menampilkan {pagination.from} - {pagination.to} dari {formatNumber(pagination.total)} akun</span>
              <div>
                <button type="button" disabled={pagination.page <= 1} onClick={() => updateFilter('page', pagination.page - 1)}>&lt;</button>
                {pages.map((page) => (
                  <button type="button" className={page === pagination.page ? 'is-active' : ''} key={page} onClick={() => updateFilter('page', page)}>{page}</button>
                ))}
                <button type="button" disabled={pagination.page >= pagination.lastPage} onClick={() => updateFilter('page', pagination.page + 1)}>&gt;</button>
              </div>
            </div>
          </section>

          <section className="admin-verification-bottom">
            <article className="admin-verification-panel">
              <div className="admin-verification-panel-head">
                <h2>Masalah Verifikasi</h2>
                <button type="button" onClick={() => updateFilter('emailStatus', 'unverified')}>Lihat belum verifikasi</button>
              </div>
              <table>
                <thead><tr><th>Masalah</th><th>Jumlah</th><th>Aksi</th></tr></thead>
                <tbody>
                  {problems.length ? problems.map((item) => (
                    <tr key={item.label}>
                      <td>{item.label}</td>
                      <td>{formatNumber(item.count)}</td>
                      <td><button type="button" onClick={() => updateFilter('emailStatus', 'unverified')}>Cek</button></td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3">Tidak ada masalah terdeteksi.</td></tr>
                  )}
                </tbody>
              </table>
            </article>

            <article className="admin-verification-panel">
              <div className="admin-verification-panel-head">
                <h2>Aktivitas Terbaru</h2>
                <button type="button" onClick={refreshData}>Refresh</button>
              </div>
              <div className="admin-verification-activity">
                {activities.length ? activities.map((item, index) => (
                  <p key={`${item.action}-${item.time}-${index}`}>
                    <span className={`admin-verification-dot is-${item.action === 'Verifikasi email' ? 'green' : 'blue'}`} />
                    <span><b>{item.action}</b><small>{item.name}</small></span>
                    <time>{formatDateTime(item.time)}</time>
                  </p>
                )) : (
                  <p><span className="admin-verification-dot is-blue" /><span><b>Belum ada aktivitas</b><small>-</small></span><time>-</time></p>
                )}
              </div>
            </article>

            <article className="admin-verification-panel admin-verification-quick">
              <h2>Aksi Cepat</h2>
              <button type="button" className="is-blue" onClick={handleResendSelected}>
                <b>Kirim Ulang ke User Terpilih</b>
                <span>Buat token verifikasi baru untuk user yang dipilih</span>
              </button>
              <button type="button" className="is-orange" onClick={handleClearTokens}>
                <b>Bersihkan Token Belum Terpakai</b>
                <span>Kosongkan token user yang belum terverifikasi</span>
              </button>
              <button type="button" className="is-green" onClick={() => exportUsersCsv(users)}>
                <b>Export CSV Halaman Ini</b>
                <span>Export data verifikasi yang sedang tampil</span>
              </button>
            </article>
          </section>
        </section>

        {selectedUser ? (
          <div className="admin-verification-detail-overlay" role="presentation" onClick={() => setSelectedUser(null)}>
            <aside className="admin-verification-detail" aria-label="Detail user verifikasi" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
              <div className="admin-verification-detail-head">
                <h2>Detail User</h2>
                <button type="button" aria-label="Tutup detail" onClick={() => setSelectedUser(null)}>x</button>
              </div>
              <div className="admin-verification-detail-profile">
                <span className="admin-verification-detail-avatar">{userInitials(selectedUser.name)}</span>
                <h3>{selectedUser.name || '-'}</h3>
                <p>@{selectedUser.username || '-'}</p>
                <VerificationBadge>{selectedUser.emailStatus || '-'}</VerificationBadge>
              </div>
              <dl>
                <dt>Email</dt>
                <dd>{selectedUser.email || '-'} <VerificationBadge>{selectedUser.emailStatus || '-'}</VerificationBadge></dd>
                <dt>WhatsApp</dt>
                <dd>{selectedUser.whatsapp || '-'}</dd>
                <dt>Role</dt>
                <dd>User</dd>
                <dt>Status Akun</dt>
                <dd>{selectedUser.accountStatus || '-'}</dd>
                <dt>Tanggal Daftar</dt>
                <dd>{formatDateTime(selectedUser.registeredAt)}</dd>
                <dt>Login Terakhir</dt>
                <dd>{formatDateTime(selectedUser.lastLoginAt)}</dd>
              </dl>
              <section className="admin-verification-token">
                <h3>Informasi Verifikasi</h3>
                <p><span>Token tersedia</span><b>{selectedUser.hasVerificationToken ? 'Ya' : 'Tidak'}</b></p>
                <p><span>Email dikirim pada</span><b>{formatDateTime(selectedUser.verificationSentAt)}</b></p>
                <p><span>Email verified pada</span><b>{formatDateTime(selectedUser.emailVerifiedAt)}</b></p>
              </section>
              <section className="admin-verification-history">
                <h3>Riwayat Verifikasi</h3>
                <p>
                  <span className={`admin-verification-dot is-${selectedUser.emailStatus === 'Terverifikasi' ? 'green' : 'blue'}`} />
                  <span><b>{selectedUser.emailStatus}</b><small>{selectedUser.emailVerifiedAt ? formatDateTime(selectedUser.emailVerifiedAt) : 'Belum selesai'}</small></span>
                </p>
                <p>
                  <span className="admin-verification-dot is-blue" />
                  <span><b>Token terakhir</b><small>{formatDateTime(selectedUser.verificationSentAt)}</small></span>
                </p>
              </section>
              <div className="admin-verification-detail-actions">
                <button type="button" className="is-blue" disabled={processingId === selectedUser.id} onClick={() => handleResend(selectedUser)}>Kirim Ulang Verifikasi</button>
                <button type="button" disabled={processingId === selectedUser.id || selectedUser.emailStatus === 'Terverifikasi'} onClick={() => handleManualVerify(selectedUser)}>Verifikasi Manual</button>
                <button type="button" className="is-danger" disabled={processingId === selectedUser.id} onClick={() => handleToggleActive(selectedUser)}>
                  {selectedUser.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                </button>
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </AdminPage>
  );
}
