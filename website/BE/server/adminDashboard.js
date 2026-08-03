import fs from 'node:fs';
import { config } from './config.js';
import { getSyncStatus, operationalDatabaseWritable } from './database.js';
import { mysqlReachable } from './mysql.js';
import { sqliteConnection, sqliteNow } from './sqlite.js';

function count(db, sql, params = []) {
  return Number(db.prepare(sql).get(...params)?.total || 0);
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function sqliteSizeLabel() {
  try {
    const bytes = fs.statSync(config.database.sqlitePath).size;
    return `Size: ${(bytes / 1024 / 1024).toFixed(2)} MB`;
  } catch {
    return 'Size: -';
  }
}

async function mysqlReachableWithTimeout(timeoutMs = 1500) {
  return Promise.race([
    mysqlReachable(),
    new Promise((resolve) => {
      setTimeout(() => resolve(false), timeoutMs);
    }),
  ]);
}

function latestActivities(db) {
  const rows = db.prepare(
    `SELECT title, detail, created_at
     FROM (
       SELECT
         CASE event
           WHEN 'register_success' THEN 'User baru mendaftar'
           WHEN 'login_success' THEN 'User login terakhir'
           WHEN 'login_failed' THEN 'Percobaan login gagal'
           WHEN 'email_verified' THEN 'Email berhasil diverifikasi'
           WHEN 'profile_updated' THEN 'Update profile user'
           ELSE event
         END AS title,
         COALESCE(email, '-') AS detail,
         created_at
       FROM auth_logs
       UNION ALL
       SELECT
         'Lead baru dari form kontak' AS title,
         name || ' - ' || email AS detail,
         created_at
       FROM leads
       WHERE deleted_at IS NULL
     )
     ORDER BY created_at DESC
     LIMIT 7`,
  ).all();

  return rows.map((row) => ({
    title: row.title,
    detail: row.detail,
    time: row.created_at,
  }));
}

function latestVerificationRows(db) {
  return db.prepare(
    `SELECT id, name, email, created_at, verification_sent_at
     FROM users
     WHERE deleted_at IS NULL AND email_verified_at IS NULL
     ORDER BY created_at DESC
     LIMIT 5`,
  ).all().map((row, index) => ({
    no: String(index + 1),
    name: row.name,
    email: row.email,
    date: formatDate(row.created_at),
    status: row.verification_sent_at ? 'Terkirim' : 'Menunggu',
  }));
}

function upcomingWorkshops(db) {
  return db.prepare(
    `SELECT title, method, starts_at, capacity, status
     FROM workshops
     WHERE deleted_at IS NULL
     ORDER BY
       CASE WHEN starts_at IS NULL THEN 1 ELSE 0 END,
       starts_at ASC,
       created_at DESC
     LIMIT 5`,
  ).all().map((row) => ({
    program: row.title,
    date: formatDate(row.starts_at),
    participants: `0 / ${row.capacity || 0}`,
    status: row.method || row.status || '-',
  }));
}

function latestLeads(db) {
  return db.prepare(
    `SELECT name, email, interest, created_at
     FROM leads
     WHERE deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT 5`,
  ).all().map((row) => ({
    name: row.name,
    email: row.email,
    topic: row.interest || '-',
    date: formatDate(row.created_at),
    status: 'Baru',
  }));
}

function latestContent(db) {
  const tutorials = db.prepare(
    `SELECT title, created_at
     FROM tutorials
     WHERE deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT 3`,
  ).all().map((row) => ({
    title: row.title,
    date: formatDate(row.created_at),
  }));

  const projects = db.prepare(
    `SELECT title, created_at
     FROM projects
     WHERE deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT 3`,
  ).all().map((row) => ({
    title: row.title,
    date: formatDate(row.created_at),
  }));

  return { tutorials, projects };
}

function latestLogs(db) {
  const rows = db.prepare(
    `SELECT level, message, created_at
     FROM (
       SELECT
         CASE WHEN status = 'failed' THEN 'ERROR' ELSE 'WARNING' END AS level,
         COALESCE(last_error, 'Event sinkronisasi belum berhasil.') AS message,
         updated_at AS created_at
       FROM sync_outbox
       WHERE last_error IS NOT NULL
       UNION ALL
       SELECT
         CASE WHEN mysql_status = 'unreachable' THEN 'ERROR' ELSE 'WARNING' END AS level,
         COALESCE(error_message, 'Sinkronisasi selesai dengan catatan.') AS message,
         COALESCE(finished_at, started_at) AS created_at
       FROM sync_logs
       WHERE error_message IS NOT NULL
     )
     ORDER BY created_at DESC
     LIMIT 3`,
  ).all();

  return rows.map((row) => ({
    level: row.level,
    message: row.message,
    time: row.created_at,
  }));
}

export async function adminDashboard(request, response) {
  const db = sqliteConnection();
  const now = sqliteNow();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const sync = getSyncStatus();
  const mysqlOnline = await mysqlReachableWithTimeout();

  const totalUsers = count(db, 'SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL');
  const newUsers = count(db, 'SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL AND created_at >= ?', [weekAgo]);
  const activeUsers = count(
    db,
    `SELECT COUNT(DISTINCT user_id) AS total
     FROM user_sessions
     WHERE expires_at > ?`,
    [now],
  );
  const unverifiedUsers = count(
    db,
    'SELECT COUNT(*) AS total FROM users WHERE deleted_at IS NULL AND email_verified_at IS NULL',
  );
  const workshops = count(db, 'SELECT COUNT(*) AS total FROM workshops WHERE deleted_at IS NULL');
  const programs = count(db, 'SELECT COUNT(*) AS total FROM programs WHERE deleted_at IS NULL');
  const projects = count(db, 'SELECT COUNT(*) AS total FROM projects WHERE deleted_at IS NULL');
  const leads = count(db, 'SELECT COUNT(*) AS total FROM leads WHERE deleted_at IS NULL');

  response.json({
    admin: request.admin,
    metrics: [
      { id: 'users', label: 'Total User', value: totalUsers, trend: `${newUsers} user baru 7 hari terakhir`, positive: true },
      { id: 'activeUsers', label: 'User Aktif', value: activeUsers, trend: 'Sesi login aktif saat ini', positive: true },
      { id: 'unverifiedUsers', label: 'Belum Verifikasi Email', value: unverifiedUsers, trend: 'Perlu tindak lanjut', positive: false },
      { id: 'workshopsPrograms', label: 'Total Workshop/Program', value: workshops + programs, trend: `${workshops} workshop / ${programs} program`, positive: true },
      { id: 'projects', label: 'Total Proyek User', value: projects, trend: 'Data dari SQLite', positive: true },
      { id: 'leads', label: 'Lead / Kontak Masuk', value: leads, trend: 'Semua lead tersimpan', positive: true },
      { id: 'certificates', label: 'Sertifikat', value: '0 / 0', trend: 'Tabel sertifikat belum tersedia' },
    ],
    activities: latestActivities(db),
    verificationRows: latestVerificationRows(db),
    workshopRows: upcomingWorkshops(db),
    leads: latestLeads(db),
    content: latestContent(db),
    logs: latestLogs(db),
    system: [
      {
        title: 'MySQL',
        status: mysqlOnline ? 'Online' : 'Offline',
        detail: mysqlOnline ? 'Sinkronisasi tersedia' : 'Tidak wajib untuk request user',
      },
      {
        title: 'SQLite (Operasional)',
        status: operationalDatabaseWritable() ? 'Online' : 'Read only',
        detail: sqliteSizeLabel(),
      },
      {
        title: 'SMTP / Mailpit',
        status: 'Online',
        detail: `${config.mail.host}:${config.mail.port}`,
      },
    ],
    sync: {
      pending: sync.pending,
      processing: sync.processing,
      failed: sync.failed,
      syncedToday: sync.syncedToday,
      lastSyncAt: sync.lastSyncAt,
      lastSuccessAt: sync.lastSuccessAt,
    },
  });
}
