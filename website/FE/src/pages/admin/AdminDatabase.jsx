import { useEffect, useMemo, useState } from 'react';
import { AdminPage, AdminTopbar } from './AdminChrome.jsx';
import { ADMIN_REALTIME_EVENT } from './AdminRealtimeBridge.jsx';
import {
  clearAdminDatabaseSyncLogs,
  createAdminDatabaseBackup,
  deleteAdminDatabaseSyncLog,
  getAdminDatabaseBackups,
  getAdminDatabaseStatus,
  retryAdminDatabaseSync,
  runAdminDatabaseSync,
} from '../../services/authApi.js';

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (bytes <= 0) return '-';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function StatusPill({ online, children }) {
  return (
    <span className={`admin-db-pill ${online ? 'is-online' : 'is-offline'}`}>
      <i />
      {children}
    </span>
  );
}

function StatCard({ label, value, note, tone = 'neutral' }) {
  return (
    <article className={`admin-db-stat admin-db-stat--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export function AdminDatabase() {
  const [status, setStatus] = useState(null);
  const [backups, setBackups] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lastRealtimeAt, setLastRealtimeAt] = useState('');

  const mysqlOnline = Boolean(status?.mysql_reachable);
  const syncEnabled = Boolean(status?.enabled);
  const schedulerInstalled = Boolean(status?.scheduler?.installed);
  const queueTotal = Number(status?.pending || 0) + Number(status?.processing || 0) + Number(status?.failed || 0);

  const backupRows = useMemo(() => backups.slice(0, 8), [backups]);
  const syncLogs = useMemo(() => (Array.isArray(status?.logs) ? status.logs : []), [status]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statusData, backupData] = await Promise.all([
        getAdminDatabaseStatus(),
        getAdminDatabaseBackups(),
      ]);
      setStatus(statusData);
      setBackups(Array.isArray(backupData.backups) ? backupData.backups : []);
    } catch (loadError) {
      setError(loadError.message || 'Gagal memuat status database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleRealtime = (event) => {
      const topic = String(event.detail?.topic || '');
      const type = String(event.detail?.payload?.type || '');
      if (!topic.endsWith('/admin/database/sync') && !type.startsWith('database.sync.')) {
        return;
      }

      setLastRealtimeAt(new Date().toISOString());
      loadData();
    };

    window.addEventListener(ADMIN_REALTIME_EVENT, handleRealtime);
    return () => window.removeEventListener(ADMIN_REALTIME_EVENT, handleRealtime);
  }, []);

  const runAction = async (name, action, successMessage) => {
    setBusyAction(name);
    setError('');
    setMessage('');
    try {
      const result = await action();
      setMessage(result.message || successMessage);
      await loadData();
    } catch (actionError) {
      setError(actionError.message || 'Aksi database gagal dijalankan.');
    } finally {
      setBusyAction('');
    }
  };

  const deleteLog = async (log) => {
    if (!log?.id || !window.confirm('Hapus log sinkronisasi ini?')) return;

    await runAction(
      `delete-log-${log.id}`,
      () => deleteAdminDatabaseSyncLog(log.id),
      'Log sinkronisasi berhasil dihapus.',
    );
  };

  const clearLogs = async () => {
    if (!syncLogs.length || !window.confirm(`Hapus ${syncLogs.length} log sinkronisasi yang tampil?`)) return;

    await runAction(
      'clear-logs',
      clearAdminDatabaseSyncLogs,
      'Log sinkronisasi berhasil dihapus.',
    );
  };

  return (
    <AdminPage pageClassName="admin-db-page" ariaLabel="Backup dan database">
      <AdminTopbar
        searchPlaceholder="Cari status database..."
        searchLabel="Cari status database"
        adminName="Admin ArduFlow"
        adminRole="Super Admin"
      >
        <button className="admin-db-top-action" type="button" onClick={loadData} disabled={isLoading || Boolean(busyAction)}>
          Refresh
        </button>
      </AdminTopbar>

      <div className="admin-db-content">
        <div className="admin-db-titlebar">
          <div>
            <h1>Backup & Database</h1>
            <p>Kelola status SQLite operasional, sinkronisasi MySQL, dan backup database ArduFlow.</p>
            {lastRealtimeAt ? <small className="admin-db-realtime">Update MQTT terakhir: {formatDate(lastRealtimeAt)}</small> : null}
          </div>
          <StatusPill online={syncEnabled}>{syncEnabled ? 'Sync Aktif' : 'Sync Nonaktif'}</StatusPill>
        </div>

        {error ? <p className="admin-db-alert admin-db-alert--error">{error}</p> : null}
        {message ? <p className="admin-db-alert admin-db-alert--success">{message}</p> : null}

        <section className="admin-db-stats" aria-label="Status database">
          <StatCard
            label="MySQL"
            value={mysqlOnline ? 'Online' : 'Offline'}
            note="Target sinkronisasi SQLite"
            tone={mysqlOnline ? 'green' : 'red'}
          />
          <StatCard
            label="SQLite Operasional"
            value={isLoading ? 'Memuat' : 'Aktif'}
            note="Sumber data utama aplikasi"
            tone="blue"
          />
          <StatCard
            label="Antrean Sync"
            value={formatNumber(queueTotal)}
            note={`${formatNumber(status?.pending)} pending, ${formatNumber(status?.failed)} failed`}
            tone={Number(status?.failed || 0) > 0 ? 'red' : 'neutral'}
          />
          <StatCard
            label="Synced Hari Ini"
            value={formatNumber(status?.synced_today)}
            note={`Terakhir sukses: ${formatDate(status?.last_success_at)}`}
            tone="green"
          />
          <StatCard
            label="Scheduler 5 Menit"
            value={schedulerInstalled ? 'Terpasang' : 'Belum Aktif'}
            note={schedulerInstalled ? `Next run: ${status?.scheduler?.next_run_at || '-'}` : status?.scheduler?.message || 'Task belum ditemukan'}
            tone={schedulerInstalled ? 'green' : 'red'}
          />
        </section>

        <section className="admin-db-grid">
          <article className="admin-db-panel">
            <header>
              <h2>Sinkronisasi SQLite ke MySQL</h2>
              <p>Worker mengirim event outbox yang pending ke endpoint internal yang dilindungi token dan HMAC.</p>
            </header>

            <div className="admin-db-sync-list">
              <div><span>Pending</span><strong>{formatNumber(status?.pending)}</strong></div>
              <div><span>Processing</span><strong>{formatNumber(status?.processing)}</strong></div>
              <div><span>Failed</span><strong>{formatNumber(status?.failed)}</strong></div>
              <div><span>Last Sync</span><strong>{formatDate(status?.last_sync_at)}</strong></div>
              <div><span>Task Status</span><strong>{status?.scheduler?.status || '-'}</strong></div>
              <div><span>Last Run</span><strong>{status?.scheduler?.last_run_at || '-'}</strong></div>
              <div><span>Last Result</span><strong>{status?.scheduler?.last_result || '-'}</strong></div>
              <div><span>Interval</span><strong>5 menit</strong></div>
            </div>

            <div className="admin-db-actions">
              <button type="button" onClick={() => runAction('sync', runAdminDatabaseSync, 'Sinkronisasi selesai.')} disabled={Boolean(busyAction)}>
                {busyAction === 'sync' ? 'Menjalankan...' : 'Jalankan Sync'}
              </button>
              <button type="button" onClick={() => runAction('retry', retryAdminDatabaseSync, 'Event gagal dikembalikan ke antrean.')} disabled={Boolean(busyAction)}>
                {busyAction === 'retry' ? 'Memproses...' : 'Retry Failed'}
              </button>
            </div>
          </article>

          <article className="admin-db-panel">
            <header>
              <h2>Backup SQLite</h2>
              <p>Backup dibuat dengan VACUUM INTO agar file SQLite konsisten saat aplikasi aktif.</p>
            </header>

            <div className="admin-db-backup-head">
              <div>
                <span>Total Backup</span>
                <strong>{formatNumber(backups.length)}</strong>
              </div>
              <button type="button" onClick={() => runAction('backup', createAdminDatabaseBackup, 'Backup berhasil dibuat.')} disabled={Boolean(busyAction)}>
                {busyAction === 'backup' ? 'Membuat...' : 'Buat Backup'}
              </button>
            </div>

            <div className="admin-db-note">
              Retention mengikuti `SQLITE_BACKUP_RETENTION_DAYS` di konfigurasi backend.
            </div>
          </article>
        </section>

        <section className="admin-db-panel admin-db-panel--wide">
          <header>
            <div>
              <h2>Log Sinkronisasi Terbaru</h2>
              <p>Riwayat worker SQLite ke MySQL, termasuk eksekusi otomatis dari scheduler.</p>
            </div>
            <button
              className="admin-db-danger-button"
              type="button"
              onClick={clearLogs}
              disabled={Boolean(busyAction) || syncLogs.length === 0}
            >
              {busyAction === 'clear-logs' ? 'Menghapus...' : 'Hapus Semua Log'}
            </button>
          </header>

          <table className="admin-db-table">
            <thead>
              <tr>
                <th>Mulai</th>
                <th>Selesai</th>
                <th>Total</th>
                <th>Sukses</th>
                <th>Gagal</th>
                <th>MySQL</th>
                <th>Durasi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {syncLogs.length ? (
                syncLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.started_at)}</td>
                    <td>{formatDate(log.finished_at)}</td>
                    <td>{formatNumber(log.total_events)}</td>
                    <td>{formatNumber(log.success_events)}</td>
                    <td>{formatNumber(log.failed_events)}</td>
                    <td>{log.mysql_status || '-'}</td>
                    <td>{log.duration_ms === null || log.duration_ms === undefined ? '-' : `${log.duration_ms} ms`}</td>
                    <td>
                      <button
                        className="admin-db-table-action admin-db-table-action--danger"
                        type="button"
                        onClick={() => deleteLog(log)}
                        disabled={Boolean(busyAction)}
                      >
                        {busyAction === `delete-log-${log.id}` ? '...' : 'Hapus'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">{isLoading ? 'Memuat log sync...' : 'Belum ada log sinkronisasi.'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="admin-db-panel admin-db-panel--wide">
          <header>
            <h2>Riwayat Backup Terbaru</h2>
            <p>Menampilkan maksimal 8 backup SQLite terbaru dari folder storage backend.</p>
          </header>

          <table className="admin-db-table">
            <thead>
              <tr>
                <th>Nama File</th>
                <th>Ukuran</th>
                <th>Dibuat</th>
                <th>Lokasi</th>
              </tr>
            </thead>
            <tbody>
              {backupRows.length ? (
                backupRows.map((backup) => (
                  <tr key={backup.path || backup.name}>
                    <td>{backup.name}</td>
                    <td>{formatBytes(backup.size)}</td>
                    <td>{formatDate(backup.created_at)}</td>
                    <td>{backup.path}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">{isLoading ? 'Memuat backup...' : 'Belum ada backup SQLite.'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </AdminPage>
  );
}
