import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminSidebar } from './AdminSidebar.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import bookIcon from '../../assets/icons/icon-book-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import downloadIcon from '../../assets/icons/icon-downloadsim-1.svg';
import mailIcon from '../../assets/icons/icon-mail-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import fileIcon from '../../assets/icons/icon-file-text-1.svg';
import { CertificateGeneratorPreview } from '../../features/certificates/CertificateGenerator.jsx';
import {
  createCertificateNumber,
  createCertificatePdfFile,
  createVerificationUrl,
} from '../../features/certificates/certificateGenerator.js';
import {
  ARDUFLOW_CERTIFICATE_TEMPLATE_ID,
  certificateTemplateOptions,
} from '../../features/certificates/certificateTemplate.js';
const CERTIFICATE_ENDPOINT = 'http://127.0.0.1:8000/api/certificate-api.php';

if (import.meta.env.DEV) {
  console.log('[AdminCertificates] CERTIFICATE_ENDPOINT:', CERTIFICATE_ENDPOINT);
}

const BULK_BATCH_SIZE = 5;

const initialBulkProgress = {
  isOpen: false,
  isRunning: false,
  isDone: false,
  isCancelled: false,
  workshopId: '',
  workshopTitle: '',
  totalParticipants: 0,
  totalToProcess: 0,
  skipped: 0,
  processed: 0,
  success: 0,
  failed: [],
  currentName: '',
};

const initialCertificateForm = {
  templateId: ARDUFLOW_CERTIFICATE_TEMPLATE_ID,
  registrationId: '',
  userId: '',
  userName: '',
  email: '',
  description: 'Atas partisipasinya dan keberhasilan mengikuti kegiatan Workshop Arduflow IDE serta mempelajari visual programming untuk pengembangan proyek IoT.',
  certificateTitle: 'Sertifikat Workshop Arduflow IDE',
  type: 'Workshop',
  workshopId: '',
  workshopTitle: 'Workshop Arduflow IDE',
  completedAt: '',
  issuedAt: '',
  instructor: '',
  authorizedRole: 'Instruktur Arduflow IDE',
  organizer: 'Arduflow',
  verificationUrl: '',
  status: 'Tersedia',
  certificateNumber: '',
};

function buildCertificateEndpoint(params = {}) {
  const url = new URL(CERTIFICATE_ENDPOINT, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== '') {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

function resolveBackendAssetUrl(value) {
  if (!value) {
    return '';
  }

  const rawValue = String(value);

  if (/^(https?:)?\/\//i.test(rawValue) || rawValue.startsWith('blob:') || rawValue.startsWith('data:')) {
    return rawValue;
  }

  try {
    const endpointUrl = new URL(CERTIFICATE_ENDPOINT, window.location.origin);
    const basePath = endpointUrl.pathname.replace(/\/api\/[^/]*$/i, '');
    const normalizedPath = rawValue.startsWith('/') ? rawValue : `/${rawValue}`;

    return `${endpointUrl.origin}${basePath}${normalizedPath}`;
  } catch (error) {
    return rawValue;
  }
}

function getCertificateFileUrl(file) {
  if (!file) {
    return '';
  }

  if (typeof file === 'string') {
    return resolveBackendAssetUrl(file);
  }

  return resolveBackendAssetUrl(file.url || file.file_url || file.relativeUrl || file.relative_url || '');
}

function safeText(value, fallback = '-') {
  const text = value === null || value === undefined ? '' : String(value).trim();

  return text || fallback;
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function normalizeCertificate(row) {
  const payload = row?.payload || {};
  const file = row?.file || payload.file || payload.certificateFile || null;
  const userName = row?.userName || row?.user_name || payload.userName || payload.user?.name || '';
  const email = row?.email || payload.email || payload.user?.email || '';
  const workshopTitle =
    row?.workshopTitle ||
    row?.workshop_title ||
    row?.programTitle ||
    payload.workshopTitle ||
    payload.programTitle ||
    payload.workshop?.title ||
    '';

  return {
    id: row?.id,
    registrationId: row?.registrationId || row?.registration_id || payload.registrationId || '',
    userId: row?.userId || row?.user_id || payload.userId || '',
    userName,
    email,
    certificateTitle:
      row?.certificateTitle ||
      row?.certificate_title ||
      payload.certificateTitle ||
      `Sertifikat ${workshopTitle || 'Workshop'}`,
    type: row?.type || row?.certificate_type || payload.type || 'Workshop',
    workshopId: row?.workshopId || row?.workshop_id || payload.workshopId || '',
    workshopTitle,
    completedAt: row?.completedAt || row?.completed_at || payload.completedAt || '',
    issuedAt: row?.issuedAt || row?.issued_at || payload.issuedAt || '',
    certificateNumber:
      row?.certificateNumber ||
      row?.certificate_number ||
      payload.certificateNumber ||
      '-',
    description: payload.description || payload.certificateDescription || '',
    instructor: payload.instructor || payload.instructorName || '',
    authorizedRole: payload.authorizedRole || payload.authorized_role || 'Instruktur Arduflow IDE',
    organizer: payload.organizer || 'Arduflow',
    verificationUrl: payload.verificationUrl || payload.verification_url || '',
    templateId: payload.templateId || ARDUFLOW_CERTIFICATE_TEMPLATE_ID,
    status: row?.status || payload.status || 'Menunggu',
    downloads: Number(row?.downloads ?? payload.downloads ?? 0),
    file,
    createdAt: row?.createdAt || row?.created_at || '',
    updatedAt: row?.updatedAt || row?.updated_at || '',
  };
}

function normalizeWorkshopOption(row) {
  const payload = row?.payload || {};

  return {
    id: row?.id,
    title: row?.title || payload.title || 'Workshop tanpa judul',
    category: row?.category || payload.category || 'Workshop',
  };
}

function normalizeParticipantOption(row) {
  return {
    id: row?.registrationId || row?.registration_id || row?.id || '',
    registrationId: row?.registrationId || row?.registration_id || row?.id || '',
    userId: row?.userId || row?.user_id || '',
    workshopId: row?.workshopId || row?.workshop_id || '',
    workshopChoice: row?.workshopChoice || row?.workshop_choice || '-',
    participantName: row?.participantName || row?.participant_name || row?.name || '-',
    participantEmail: row?.participantEmail || row?.participant_email || row?.email || '',
    status: row?.status || 'Baru',
    createdAt: row?.createdAt || row?.created_at || '',
  };
}

function CertificateBadge({ children }) {
  const slug = String(children || '').toLowerCase().replace(/\s+/g, '-');

  return <span className={`admin-certificates-badge admin-certificates-badge--${slug}`}>{children}</span>;
}

function CertificateAction({ label, className = '', children, ...props }) {
  return (
    <button className={`admin-certificates-action ${className}`.trim()} type="button" aria-label={label} {...props}>
      {children}
    </button>
  );
}

function AdminCertificatesTopbar({ query, onQueryChange }) {
  return (
    <header className="admin-dashboard-topbar">
      <label className="admin-dashboard-search">
        <span aria-hidden="true" />
        <input
          type="search"
          placeholder="Cari sertifikat"
          aria-label="Cari sertifikat"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      <div className="admin-dashboard-account">
        <button className="admin-dashboard-notif" type="button" aria-label="Notifikasi">
          <img src={bellIcon} alt="" />
        </button>
        <span className="admin-dashboard-avatar" aria-hidden="true" />
        <span>
          <strong>Admin</strong>
          <small>Super Admin</small>
        </span>
      </div>
    </header>
  );
}

function CertificateFormModal({
  form,
  workshops,
  participants,
  certificates,
  onChange,
  onClose,
  onSubmit,
  onSubmitAll,
  isSaving,
}) {
  const selectedWorkshop = workshops.find(
    (workshop) => String(workshop.id) === String(form.workshopId),
  );

  const workshopParticipants = useMemo(
    () =>
      participants.filter(
        (participant) =>
          String(participant.workshopId) === String(form.workshopId),
      ),
    [participants, form.workshopId],
  );

  const usableCertificateRegistrationIds = useMemo(() => {
    const ids = new Set();

    certificates
      .filter(
        (certificate) =>
          String(certificate.workshopId) === String(form.workshopId) &&
          getCertificateFileUrl(certificate.file),
      )
      .forEach((certificate) => {
        if (certificate.registrationId) {
          ids.add(String(certificate.registrationId));
        }
      });

    return ids;
  }, [certificates, form.workshopId]);

  const participantsNeedingCertificate = workshopParticipants.filter(
    (participant) =>
      !usableCertificateRegistrationIds.has(String(participant.registrationId)),
  );

  const selectedParticipant = workshopParticipants.find(
    (participant) =>
      String(participant.registrationId) === String(form.registrationId),
  );

  const handleWorkshopChange = (event) => {
    const value = event.target.value;
    const nextWorkshop = workshops.find(
      (workshop) => String(workshop.id) === value,
    );

    onChange({
      ...form,
      workshopId: value,
      workshopTitle: nextWorkshop?.title || '',
      certificateTitle: nextWorkshop?.title
        ? `Sertifikat ${nextWorkshop.title}`
        : 'Sertifikat Workshop Arduflow IDE',
      registrationId: '',
      userId: '',
      userName: '',
      email: '',
    });
  };

  const handleParticipantChange = (event) => {
    const registrationId = event.target.value;
    const participant = workshopParticipants.find(
      (item) => String(item.registrationId) === registrationId,
    );

    onChange({
      ...form,
      registrationId,
      userId: participant?.userId || '',
      userName: participant?.participantName || '',
      email: participant?.participantEmail || '',
    });
  };

  return (
    <div className="admin-certificates-modal-backdrop" role="presentation">
      <section
        className="admin-certificates-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="certificate-form-title"
      >
        <div className="admin-certificates-modal-head">
          <h2 id="certificate-form-title">Generate Sertifikat Peserta Workshop</h2>
          <button type="button" onClick={onClose} aria-label="Tutup form">
            x
          </button>
        </div>

        <div className="admin-certificates-form-grid">
          <label className="admin-certificates-form-wide">
            <span>Template Sertifikat</span>
            <select
              value={form.templateId}
              onChange={(event) =>
                onChange({ ...form, templateId: event.target.value })
              }
            >
              {certificateTemplateOptions.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-certificates-form-wide">
            <span>Workshop / Program</span>
            <select value={form.workshopId} onChange={handleWorkshopChange} required>
              <option value="">Pilih workshop dari SQLite</option>
              {workshops.map((workshop) => (
                <option key={workshop.id} value={workshop.id}>
                  {workshop.title}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-certificates-form-wide">
            <span>Peserta yang Mendaftar</span>
            <select
              value={form.registrationId}
              onChange={handleParticipantChange}
              disabled={!form.workshopId}
              required
            >
              <option value="">
                {!form.workshopId
                  ? 'Pilih workshop terlebih dahulu'
                  : workshopParticipants.length === 0
                    ? 'Belum ada peserta untuk workshop ini'
                    : 'Pilih peserta workshop'}
              </option>
              {workshopParticipants.map((participant) => (
                <option
                  key={participant.registrationId}
                  value={participant.registrationId}
                >
                  {participant.participantName} — {participant.participantEmail || 'tanpa email'} — {participant.status}
                </option>
              ))}
            </select>
            {form.workshopId ? (
              <small style={{ display: 'block', marginTop: 6 }}>
                {workshopParticipants.length} pendaftaran ditemukan untuk {selectedWorkshop?.title || 'workshop ini'}.
              </small>
            ) : null}
          </label>

          <label>
            <span>Nama Peserta</span>
            <input
              type="text"
              value={form.userName}
              readOnly
              placeholder="Otomatis dari data pendaftaran"
            />
          </label>

          <label>
            <span>Email Peserta</span>
            <input
              type="email"
              value={form.email}
              readOnly
              placeholder="Otomatis dari data pendaftaran"
            />
          </label>

          <label>
            <span>Status Pendaftaran</span>
            <input
              type="text"
              value={selectedParticipant?.status || ''}
              readOnly
              placeholder="-"
            />
          </label>

          <label>
            <span>ID Pendaftaran</span>
            <input
              type="text"
              value={form.registrationId}
              readOnly
              placeholder="-"
            />
          </label>

          <label>
            <span>Instruktur</span>
            <input
              type="text"
              value={form.instructor}
              onChange={(event) =>
                onChange({ ...form, instructor: event.target.value })
              }
              placeholder="Nama instruktur"
              required
            />
          </label>

          <label>
            <span>Jabatan Instruktur</span>
            <input
              type="text"
              value={form.authorizedRole}
              onChange={(event) =>
                onChange({ ...form, authorizedRole: event.target.value })
              }
              placeholder="Instruktur Arduflow IDE"
            />
          </label>

          <label>
            <span>Tanggal</span>
            <input
              type="date"
              value={form.issuedAt}
              onChange={(event) =>
                onChange({
                  ...form,
                  issuedAt: event.target.value,
                  completedAt: event.target.value,
                })
              }
              required
            />
          </label>

          <label>
            <span>Penyelenggara</span>
            <input
              type="text"
              value={form.organizer}
              onChange={(event) =>
                onChange({ ...form, organizer: event.target.value })
              }
              placeholder="Arduflow"
              required
            />
          </label>

          <label className="admin-certificates-form-wide">
            <span>No. Sertifikat</span>
            <input
              type="text"
              value={form.certificateNumber}
              onChange={(event) =>
                onChange({ ...form, certificateNumber: event.target.value })
              }
              placeholder="Otomatis jika dikosongkan"
            />
            <small style={{ display: 'block', marginTop: 6 }}>
              Untuk Generate Semua Peserta, nomor sertifikat dibuat otomatis dan unik untuk setiap peserta.
            </small>
          </label>

          <label className="admin-certificates-form-wide">
            <span>URL Verifikasi</span>
            <input
              type="url"
              value={form.verificationUrl}
              onChange={(event) =>
                onChange({ ...form, verificationUrl: event.target.value })
              }
              placeholder="Otomatis jika dikosongkan"
            />
          </label>

          <label className="admin-certificates-form-wide">
            <span>Deskripsi Sertifikat</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                onChange({ ...form, description: event.target.value })
              }
              placeholder="Atas partisipasinya dan keberhasilan mengikuti kegiatan Workshop..."
              rows="4"
              required
            />
          </label>

          <div className="admin-certificates-form-wide">
            <span className="admin-certificates-preview-label">
              Preview Template
            </span>
            <CertificateGeneratorPreview data={form} />
          </div>
        </div>

        {form.workshopId ? (
          <div
            style={{
              marginTop: 8,
              marginBottom: 14,
              padding: 12,
              border: '1px solid #dbe4f0',
              borderRadius: 10,
              background: '#f8fbff',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            <div>
              <small style={{ display: 'block', color: '#64748b' }}>Total peserta</small>
              <strong>{workshopParticipants.length}</strong>
            </div>
            <div>
              <small style={{ display: 'block', color: '#64748b' }}>Sudah punya PDF</small>
              <strong>{workshopParticipants.length - participantsNeedingCertificate.length}</strong>
            </div>
            <div>
              <small style={{ display: 'block', color: '#64748b' }}>Akan diproses</small>
              <strong>{participantsNeedingCertificate.length}</strong>
            </div>
          </div>
        ) : null}

        <div className="admin-certificates-modal-actions">
          <button type="button" onClick={onClose} disabled={isSaving}>
            Batal
          </button>
          <button
            type="button"
            onClick={onSubmitAll}
            disabled={
              isSaving ||
              !form.workshopId ||
              participantsNeedingCertificate.length === 0
            }
          >
            {isSaving
              ? 'Memproses...'
              : `Generate Semua Belum Dibuat (${participantsNeedingCertificate.length})`}
          </button>
          <button
            type="button"
            className="admin-certificates-primary"
            onClick={onSubmit}
            disabled={isSaving || !form.registrationId}
          >
            {isSaving ? 'Membuat PDF...' : 'Generate PDF Sertifikat'}
          </button>
        </div>
      </section>
    </div>
  );
}

function CertificateDetailModal({ certificate, onClose }) {
  if (!certificate) {
    return null;
  }

  const fileUrl = getCertificateFileUrl(certificate.file);

  return (
    <div className="admin-certificates-modal-backdrop" role="presentation">
      <section className="admin-certificates-modal detail" role="dialog" aria-modal="true" aria-labelledby="certificate-detail-title">
        <div className="admin-certificates-modal-head">
          <h2 id="certificate-detail-title">Detail Sertifikat</h2>
          <button type="button" onClick={onClose} aria-label="Tutup detail">x</button>
        </div>

        <div className="admin-certificates-detail-profile">
          <span className="admin-certificates-detail-avatar" />
          <h3>{safeText(certificate.userName)}</h3>
          <p>{safeText(certificate.email)}</p>
          <CertificateBadge>{certificate.status}</CertificateBadge>
        </div>

        <dl className="admin-certificates-detail-list">
          <dt>ID Pendaftaran</dt><dd>{safeText(certificate.registrationId)}</dd>
          <dt>Nama Sertifikat</dt><dd>{safeText(certificate.certificateTitle)}</dd>
          <dt>Workshop / Program</dt><dd>{safeText(certificate.workshopTitle)}</dd>
          <dt>Jenis</dt><dd>{safeText(certificate.type)}</dd>
          <dt>Nomor Sertifikat</dt><dd>{safeText(certificate.certificateNumber)}</dd>
          <dt>Tanggal Selesai</dt><dd>{formatDate(certificate.completedAt)}</dd>
          <dt>Tanggal Terbit</dt><dd>{formatDate(certificate.issuedAt)}</dd>
          <dt>File Sertifikat</dt><dd>{fileUrl ? <a href={fileUrl} target="_blank" rel="noreferrer">Buka file</a> : 'Belum diupload'}</dd>
        </dl>
      </section>
    </div>
  );
}


function BulkProgressModal({
  progress,
  onCancel,
  onClose,
  onRetryFailed,
}) {
  if (!progress.isOpen) {
    return null;
  }

  const denominator = Math.max(progress.totalToProcess, 1);
  const percentage = Math.min(
    100,
    Math.round((progress.processed / denominator) * 100),
  );

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.56)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-certificate-progress-title"
        style={{
          width: 'min(680px, 100%)',
          maxHeight: '88vh',
          overflowY: 'auto',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(15, 23, 42, 0.28)',
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <div>
            <h2 id="bulk-certificate-progress-title" style={{ margin: 0 }}>
              Generate Sertifikat Massal
            </h2>
            <p style={{ margin: '8px 0 0', color: '#64748b' }}>
              {progress.workshopTitle || 'Workshop'}
            </p>
          </div>

          {!progress.isRunning ? (
            <button type="button" onClick={onClose} aria-label="Tutup">
              x
            </button>
          ) : null}
        </div>

        <div
          style={{
            marginTop: 20,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 10,
          }}
        >
          {[
            ['Akan diproses', progress.totalToProcess],
            ['Berhasil', progress.success],
            ['Gagal', progress.failed.length],
            ['Dilewati', progress.skipped],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 12,
                background: '#f8fafc',
              }}
            >
              <small style={{ color: '#64748b' }}>{label}</small>
              <strong style={{ display: 'block', marginTop: 4, fontSize: 20 }}>
                {value}
              </strong>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 8,
              fontSize: 14,
            }}
          >
            <strong>{percentage}%</strong>
            <span>
              {progress.processed} / {progress.totalToProcess}
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: 12,
              overflow: 'hidden',
              borderRadius: 999,
              background: '#e2e8f0',
            }}
          >
            <div
              style={{
                width: `${percentage}%`,
                height: '100%',
                borderRadius: 999,
                background: progress.failed.length > 0 ? '#2563eb' : '#16a34a',
                transition: 'width 180ms ease',
              }}
            />
          </div>

          <p style={{ margin: '10px 0 0', color: '#475569' }}>
            {progress.isCancelled
              ? 'Proses dibatalkan. Batch yang sudah berjalan tetap diselesaikan.'
              : progress.isRunning
                ? `Sedang memproses: ${progress.currentName || 'menyiapkan batch...'}`
                : progress.isDone
                  ? 'Proses selesai.'
                  : 'Menyiapkan proses...'}
          </p>
        </div>

        {progress.failed.length > 0 ? (
          <div
            style={{
              marginTop: 20,
              border: '1px solid #fecaca',
              background: '#fff7f7',
              borderRadius: 12,
              padding: 14,
            }}
          >
            <strong>Peserta gagal ({progress.failed.length})</strong>
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {progress.failed.slice(0, 20).map((item) => (
                <div key={`${item.participant.registrationId}-${item.participant.participantEmail}`}>
                  <b>{item.participant.participantName}</b>
                  <small style={{ display: 'block', color: '#b91c1c' }}>
                    {item.message}
                  </small>
                </div>
              ))}
              {progress.failed.length > 20 ? (
                <small>+ {progress.failed.length - 20} peserta gagal lainnya.</small>
              ) : null}
            </div>
          </div>
        ) : null}

        <div
          style={{
            marginTop: 22,
            display: 'flex',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {progress.isRunning ? (
            <button type="button" onClick={onCancel}>
              Batalkan Setelah Batch Ini
            </button>
          ) : null}

          {!progress.isRunning && progress.failed.length > 0 ? (
            <button type="button" onClick={onRetryFailed}>
              Coba Lagi yang Gagal ({progress.failed.length})
            </button>
          ) : null}

          {!progress.isRunning ? (
            <button type="button" className="admin-certificates-primary" onClick={onClose}>
              Selesai
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export function AdminCertificates() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialAdminSidebarCollapsed);
  const [certificates, setCertificates] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    workshopTitle: '',
    issuedAt: '',
    completedAt: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialCertificateForm);
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [bulkProgress, setBulkProgress] = useState(initialBulkProgress);
  const bulkCancelRef = useRef(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistAdminSidebarCollapsed(nextValue);
      return nextValue;
    });
  };

  const loadCertificates = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(CERTIFICATE_ENDPOINT, {
        headers: { Accept: 'application/json' },
      });

      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json') ? await response.json() : null;

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Endpoint sertifikat belum siap. HTTP ${response.status}`);
      }

      const payload = result.data || {};
      const rows = Array.isArray(payload.certificates) ? payload.certificates : [];
      const workshopRows =
        Array.isArray(payload.workshops)
          ? payload.workshops
          : Array.isArray(payload.options?.workshops)
            ? payload.options.workshops
            : [];
      const participantRows =
        Array.isArray(payload.participants)
          ? payload.participants
          : Array.isArray(payload.options?.participants)
            ? payload.options.participants
            : [];

      setCertificates(rows.map(normalizeCertificate));
      setWorkshops(workshopRows.map(normalizeWorkshopOption));
      setParticipants(participantRows.map(normalizeParticipantOption));
    } catch (requestError) {
      setCertificates([]);
      setWorkshops([]);
      setParticipants([]);
      setError(requestError.message || 'Gagal mengambil data sertifikat.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
  }, []);

  const filteredCertificates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return certificates.filter((certificate) => {
      const haystack = [
        certificate.userName,
        certificate.email,
        certificate.certificateTitle,
        certificate.workshopTitle,
        certificate.certificateNumber,
      ].join(' ').toLowerCase();

      if (normalizedQuery && !haystack.includes(normalizedQuery)) {
        return false;
      }

      if (filters.type && certificate.type !== filters.type) {
        return false;
      }

      if (filters.status && certificate.status !== filters.status) {
        return false;
      }

      if (filters.workshopTitle && certificate.workshopTitle !== filters.workshopTitle) {
        return false;
      }

      if (filters.issuedAt && certificate.issuedAt !== filters.issuedAt) {
        return false;
      }

      if (filters.completedAt && certificate.completedAt !== filters.completedAt) {
        return false;
      }

      return true;
    });
  }, [certificates, filters, query]);

  const stats = useMemo(() => {
    const total = certificates.length;
    const available = certificates.filter((item) => item.status === 'Tersedia').length;
    const pending = certificates.filter((item) => item.status === 'Menunggu').length;
    const failed = certificates.filter((item) => item.status === 'Tidak Lulus').length;
    const errorCount = certificates.filter((item) => item.status === 'Error').length;
    const downloaded = certificates.reduce((sum, item) => sum + item.downloads, 0);

    const percentage = (value) => (total > 0 ? `${Math.round((value / total) * 100)}% dari total` : 'Belum ada data');

    return [
      { label: 'Total Sertifikat', value: total, note: 'Data dari SQLite', icon: fileIcon, tone: 'blue' },
      { label: 'Sertifikat Tersedia', value: available, note: percentage(available), icon: checkIcon, tone: 'green' },
      { label: 'Menunggu Penerbitan', value: pending, note: percentage(pending), icon: clockIcon, tone: 'orange' },
      { label: 'Tidak Lulus', value: failed, note: percentage(failed), icon: checkIcon, tone: 'red' },
      { label: 'Sertifikat Diunduh', value: downloaded, note: `${downloaded} total download`, icon: downloadIcon, tone: 'blue' },
      { label: 'Error / Gagal Upload', value: errorCount, note: percentage(errorCount), icon: clockIcon, tone: 'red' },
    ];
  }, [certificates]);

  const uniqueTypes = useMemo(() => [...new Set(certificates.map((item) => item.type).filter(Boolean))], [certificates]);
  const uniqueStatuses = useMemo(() => [...new Set(certificates.map((item) => item.status).filter(Boolean))], [certificates]);
  const uniquePrograms = useMemo(() => [...new Set(certificates.map((item) => item.workshopTitle).filter(Boolean))], [certificates]);
  const pendingItems = certificates.filter((item) => item.status === 'Menunggu').slice(0, 4);
  const problemItems = [
    ['Gagal upload / generate', certificates.filter((item) => item.status === 'Error').length],
    ['Tidak lulus', certificates.filter((item) => item.status === 'Tidak Lulus').length],
    ['Belum punya file', certificates.filter((item) => !getCertificateFileUrl(item.file)).length],
  ];
  const activityItems = certificates.slice(0, 4);

  const createCertificateForParticipant = async (
    participant,
    selectedWorkshop,
    options = {},
  ) => {
    if (!participant?.registrationId) {
      throw new Error('Data pendaftaran peserta tidak valid.');
    }

    if (!selectedWorkshop?.id) {
      throw new Error('Workshop wajib dipilih.');
    }

    const issuedAt = form.issuedAt || new Date().toISOString().slice(0, 10);
    const certificateNumber = options.forceAutoNumber
      ? createCertificateNumber()
      : form.certificateNumber || createCertificateNumber();
    const verificationUrl = options.forceAutoNumber
      ? createVerificationUrl(certificateNumber)
      : form.verificationUrl || createVerificationUrl(certificateNumber);

    const payload = {
      ...form,
      registrationId: participant.registrationId,
      userId: participant.userId || '',
      userName: participant.participantName,
      email: participant.participantEmail,
      workshopId: selectedWorkshop.id,
      workshopTitle: selectedWorkshop.title,
      certificateTitle:
        form.certificateTitle || `Sertifikat ${selectedWorkshop.title}`,
      completedAt: form.completedAt || issuedAt,
      issuedAt,
      certificateNumber,
      verificationUrl,
      authorizedRole: form.authorizedRole || 'Instruktur Arduflow IDE',
      status: 'Tersedia',
    };

    const requiredFields = [
      ['registrationId', 'Peserta workshop wajib dipilih dari data pendaftaran.'],
      ['userName', 'Nama peserta dari pendaftaran tidak tersedia.'],
      ['email', 'Email peserta dari pendaftaran tidak tersedia.'],
      ['workshopId', 'Workshop wajib dipilih.'],
      ['description', 'Deskripsi sertifikat wajib diisi.'],
      ['issuedAt', 'Tanggal wajib diisi.'],
      ['instructor', 'Instruktur wajib diisi.'],
      ['organizer', 'Penyelenggara wajib diisi.'],
    ];

    const validationMessage = requiredFields
      .map(([key, message]) =>
        String(payload[key] || '').trim() ? '' : message,
      )
      .filter(Boolean)
      .join(' ');

    if (validationMessage) {
      throw new Error(validationMessage);
    }

    const response = await fetch(CERTIFICATE_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    let result;

    try {
      result = rawText ? JSON.parse(rawText) : {};
    } catch {
      throw new Error(
        `Response API sertifikat bukan JSON. HTTP ${response.status}.`,
      );
    }

    let certificate;

    if (response.status === 409 && result?.data?.certificate) {
      // Sertifikat pernah dibuat tetapi PDF/upload bisa saja belum selesai.
      // Gunakan record yang sudah ada lalu generate/upload ulang file-nya.
      certificate = normalizeCertificate(result.data.certificate);
    } else {
      if (!response.ok || !result?.success) {
        const apiErrors = result?.errors
          ? Object.values(result.errors).join(' ')
          : '';
        throw new Error(
          apiErrors || result?.message || 'Sertifikat gagal disimpan.',
        );
      }

      certificate = normalizeCertificate(result.data?.certificate || {});
    }
    const pdfFile = await createCertificatePdfFile({
      ...payload,
      ...certificate,
      participantName: certificate.userName || payload.userName,
      programName: certificate.workshopTitle || payload.workshopTitle,
      issueDate: certificate.issuedAt || payload.issuedAt,
      certificateNumber:
        certificate.certificateNumber || payload.certificateNumber,
      authorizedBy: certificate.instructor || payload.instructor,
      authorizedRole: certificate.authorizedRole || payload.authorizedRole,
      organizationName: certificate.organizer || payload.organizer,
      organizerName: certificate.organizer || payload.organizer,
      verificationUrl:
        certificate.verificationUrl || payload.verificationUrl,
    });

    await handleUploadCertificate(certificate, pdfFile, { silent: true });

    return certificate;
  };

  const handleCreateCertificate = async () => {
    setIsSaving(true);
    setError('');

    try {
      const selectedWorkshop = workshops.find(
        (workshop) => String(workshop.id) === String(form.workshopId),
      );
      const participant = participants.find(
        (item) =>
          String(item.registrationId) === String(form.registrationId) &&
          String(item.workshopId) === String(form.workshopId),
      );

      if (!selectedWorkshop) {
        throw new Error('Pilih workshop terlebih dahulu.');
      }

      if (!participant) {
        throw new Error(
          'Pilih peserta dari daftar pendaftaran workshop. Nama peserta tidak dapat diisi manual.',
        );
      }

      await createCertificateForParticipant(participant, selectedWorkshop);

      setForm(initialCertificateForm);
      setFormOpen(false);
      await loadCertificates();
    } catch (submitError) {
      setError(submitError.message || 'Sertifikat gagal disimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const getBulkCandidates = (selectedWorkshop) => {
    const workshopParticipants = participants.filter(
      (participant) =>
        String(participant.workshopId) === String(selectedWorkshop.id),
    );

    const existingByRegistrationId = new Map(
      certificates
        .filter(
          (certificate) =>
            String(certificate.workshopId) === String(selectedWorkshop.id) &&
            certificate.registrationId,
        )
        .map((certificate) => [
          String(certificate.registrationId),
          certificate,
        ]),
    );

    const candidates = workshopParticipants.filter((participant) => {
      const existing = existingByRegistrationId.get(
        String(participant.registrationId),
      );

      if (!existing) {
        return true;
      }

      // Record DB sudah ada tetapi file belum ada / status error -> perbaiki lagi.
      return !getCertificateFileUrl(existing.file) || existing.status === 'Error';
    });

    return {
      workshopParticipants,
      candidates,
      skipped: workshopParticipants.length - candidates.length,
    };
  };

  const processCertificateParticipantsInBatches = async ({
    items,
    selectedWorkshop,
    initialSuccess = 0,
    initialProcessed = 0,
    initialFailed = [],
  }) => {
    let successCount = initialSuccess;
    let processedCount = initialProcessed;
    const failedItems = [...initialFailed];

    for (let startIndex = 0; startIndex < items.length; startIndex += BULK_BATCH_SIZE) {
      if (bulkCancelRef.current) {
        break;
      }

      const batch = items.slice(startIndex, startIndex + BULK_BATCH_SIZE);

      setBulkProgress((current) => ({
        ...current,
        currentName:
          batch.length === 1
            ? batch[0].participantName
            : `${batch[0].participantName} + ${batch.length - 1} peserta`,
      }));

      const results = await Promise.allSettled(
        batch.map((participant) =>
          createCertificateForParticipant(participant, selectedWorkshop, {
            forceAutoNumber: true,
          }),
        ),
      );

      results.forEach((result, index) => {
        const participant = batch[index];
        processedCount += 1;

        if (result.status === 'fulfilled') {
          successCount += 1;
          return;
        }

        failedItems.push({
          participant,
          message:
            result.reason?.message ||
            'Generate atau upload sertifikat gagal.',
        });
      });

      setBulkProgress((current) => ({
        ...current,
        processed: processedCount,
        success: successCount,
        failed: failedItems,
      }));
    }

    return {
      successCount,
      processedCount,
      failedItems,
      cancelled: bulkCancelRef.current,
    };
  };

  const handleGenerateAllCertificates = async () => {
    setError('');

    const selectedWorkshop = workshops.find(
      (workshop) => String(workshop.id) === String(form.workshopId),
    );

    if (!selectedWorkshop) {
      setError('Pilih workshop terlebih dahulu.');
      return;
    }

    if (!String(form.description || '').trim()) {
      setError('Deskripsi sertifikat wajib diisi sebelum generate massal.');
      return;
    }

    if (!String(form.instructor || '').trim()) {
      setError('Instruktur wajib diisi sebelum generate massal.');
      return;
    }

    if (!String(form.organizer || '').trim()) {
      setError('Penyelenggara wajib diisi sebelum generate massal.');
      return;
    }

    const {
      workshopParticipants,
      candidates,
      skipped,
    } = getBulkCandidates(selectedWorkshop);

    if (workshopParticipants.length === 0) {
      setError('Belum ada peserta yang mendaftar workshop ini.');
      return;
    }

    if (candidates.length === 0) {
      setError('Semua peserta workshop ini sudah memiliki file sertifikat.');
      return;
    }

    bulkCancelRef.current = false;
    setIsSaving(true);
    setBulkProgress({
      ...initialBulkProgress,
      isOpen: true,
      isRunning: true,
      workshopId: selectedWorkshop.id,
      workshopTitle: selectedWorkshop.title,
      totalParticipants: workshopParticipants.length,
      totalToProcess: candidates.length,
      skipped,
    });

    try {
      const result = await processCertificateParticipantsInBatches({
        items: candidates,
        selectedWorkshop,
      });

      await loadCertificates();

      setBulkProgress((current) => ({
        ...current,
        isRunning: false,
        isDone: true,
        isCancelled: result.cancelled,
        processed: result.processedCount,
        success: result.successCount,
        failed: result.failedItems,
        currentName: '',
      }));

      if (!result.cancelled && result.failedItems.length === 0) {
        setForm(initialCertificateForm);
        setFormOpen(false);
      }
    } catch (submitError) {
      setBulkProgress((current) => ({
        ...current,
        isRunning: false,
        isDone: true,
        failed: [
          ...current.failed,
          {
            participant: {
              registrationId: 'bulk-error',
              participantName: 'Proses massal',
              participantEmail: '',
            },
            message:
              submitError.message || 'Generate semua sertifikat gagal.',
          },
        ],
      }));
      setError(submitError.message || 'Generate semua sertifikat gagal.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBulkGenerate = () => {
    bulkCancelRef.current = true;
    setBulkProgress((current) => ({
      ...current,
      isCancelled: true,
    }));
  };

  const handleRetryFailedCertificates = async () => {
    const retryItems = bulkProgress.failed
      .map((item) => item.participant)
      .filter(
        (participant) =>
          participant?.registrationId &&
          participant.registrationId !== 'bulk-error',
      );

    if (retryItems.length === 0) {
      return;
    }

    const selectedWorkshop = workshops.find(
      (workshop) =>
        String(workshop.id) === String(bulkProgress.workshopId),
    );

    if (!selectedWorkshop) {
      setError('Workshop untuk retry tidak ditemukan.');
      return;
    }

    bulkCancelRef.current = false;
    setIsSaving(true);
    setBulkProgress((current) => ({
      ...current,
      isRunning: true,
      isDone: false,
      isCancelled: false,
      totalToProcess: retryItems.length,
      processed: 0,
      success: 0,
      failed: [],
      currentName: '',
    }));

    try {
      const result = await processCertificateParticipantsInBatches({
        items: retryItems,
        selectedWorkshop,
      });

      await loadCertificates();

      setBulkProgress((current) => ({
        ...current,
        isRunning: false,
        isDone: true,
        isCancelled: result.cancelled,
        processed: result.processedCount,
        success: result.successCount,
        failed: result.failedItems,
        currentName: '',
      }));
    } catch (retryError) {
      setError(retryError.message || 'Retry sertifikat gagal.');
      setBulkProgress((current) => ({
        ...current,
        isRunning: false,
        isDone: true,
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseBulkProgress = () => {
    if (bulkProgress.isRunning) {
      return;
    }

    setBulkProgress(initialBulkProgress);
    setError('');
    setForm(initialCertificateForm);
    setFormOpen(false);
  };

  const handleUploadCertificate = async (certificate, file, options = {}) => {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('certificate', file);

    if (!options.silent) {
      setError('');
    }

    try {
      const response = await fetch(buildCertificateEndpoint({ action: 'upload-certificate', id: certificate.id }), {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Upload sertifikat gagal.');
      }

      if (!options.silent) {
        await loadCertificates();
      }
    } catch (uploadError) {
      setError(uploadError.message || 'Upload sertifikat gagal.');
      throw uploadError;
    }
  };

  const handleDeleteCertificate = async (certificate) => {
    const confirmed = window.confirm(`Hapus sertifikat ${certificate.certificateTitle}?`);

    if (!confirmed) {
      return;
    }

    setError('');

    try {
      const response = await fetch(buildCertificateEndpoint({ id: certificate.id }), {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Sertifikat gagal dihapus.');
      }

      await loadCertificates();
    } catch (deleteError) {
      setError(deleteError.message || 'Sertifikat gagal dihapus.');
    }
  };

  const exportCsv = () => {
    const header = ['Nama User', 'Email', 'Nama Sertifikat', 'Jenis', 'Materi / Program', 'Tgl Selesai', 'Tgl Terbit', 'No. Sertifikat', 'Status'];
    const rows = filteredCertificates.map((certificate) => [
      certificate.userName,
      certificate.email,
      certificate.certificateTitle,
      certificate.type,
      certificate.workshopTitle,
      certificate.completedAt,
      certificate.issuedAt,
      certificate.certificateNumber,
      certificate.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sertifikat-arduflow.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className={`admin-dashboard-page admin-certificates-page${isSidebarCollapsed ? ' admin-dashboard-page--collapsed' : ''}`}>
      <AdminSidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={handleToggleSidebar} />

      <section className="admin-dashboard-main" aria-label="Sertifikat admin">
        <AdminCertificatesTopbar query={query} onQueryChange={setQuery} />

        <div className="admin-certificates-layout">
          <section className="admin-certificates-content">
            <div className="admin-certificates-heading">
              <div>
                <h1>Sertifikat</h1>
                <p>Dashboard <span>/</span> Sertifikat</p>
              </div>
              <button type="button" className="admin-certificates-primary" onClick={() => { setForm(initialCertificateForm); setFormOpen(true); }}>
                + Tambah Sertifikat
              </button>
            </div>

            {error ? <p className="admin-certificates-alert">{error}</p> : null}

            <section className="admin-certificates-stats" aria-label="Ringkasan sertifikat">
              {stats.map((item) => (
                <article className="admin-certificates-stat" key={item.label}>
                  <span className={`admin-certificates-stat-icon is-${item.tone}`}>
                    <img src={item.icon} alt="" />
                  </span>
                  <div>
                    <p>{item.label}</p>
                    <strong>{item.value}</strong>
                    <small>{item.note}</small>
                  </div>
                </article>
              ))}
            </section>

            <section className="admin-certificates-filter" aria-label="Filter sertifikat">
              <label className="admin-certificates-search">
                <input
                  type="search"
                  placeholder="Cari nama user, email, atau nomor sertifikat..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <label>
                <span>Jenis</span>
                <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
                  <option value="">Semua Jenis</option>
                  {uniqueTypes.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                  <option value="">Semua Status</option>
                  {uniqueStatuses.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span>Materi / Program</span>
                <select value={filters.workshopTitle} onChange={(event) => setFilters({ ...filters, workshopTitle: event.target.value })}>
                  <option value="">Semua Materi</option>
                  {uniquePrograms.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span>Tanggal Terbit</span>
                <input type="date" value={filters.issuedAt} onChange={(event) => setFilters({ ...filters, issuedAt: event.target.value })} />
              </label>
              <label>
                <span>Tanggal Selesai</span>
                <input type="date" value={filters.completedAt} onChange={(event) => setFilters({ ...filters, completedAt: event.target.value })} />
              </label>
              <button type="button" onClick={() => setFilters({ type: '', status: '', workshopTitle: '', issuedAt: '', completedAt: '' })}>
                Reset Filter
              </button>
              <button type="button" className="admin-certificates-primary" onClick={exportCsv}>Export CSV</button>
            </section>

            <section className="admin-certificates-table-card">
              <div className="admin-certificates-table-scroll">
                <table className="admin-certificates-table">
                  <thead>
                    <tr>
                      <th><input type="checkbox" aria-label="Pilih semua sertifikat" /></th>
                      <th>Nama User</th>
                      <th>Email</th>
                      <th>Nama Sertifikat</th>
                      <th>Jenis</th>
                      <th>Materi / Program</th>
                      <th>Tgl Selesai</th>
                      <th>Tgl Terbit</th>
                      <th>No. Sertifikat</th>
                      <th>Status</th>
                      <th>File</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan="12" className="admin-certificates-empty">Memuat data sertifikat...</td></tr>
                    ) : filteredCertificates.length === 0 ? (
                      <tr><td colSpan="12" className="admin-certificates-empty">Belum ada sertifikat yang cocok dengan filter.</td></tr>
                    ) : (
                      filteredCertificates.map((certificate) => {
                        const fileUrl = getCertificateFileUrl(certificate.file);

                        return (
                          <tr key={certificate.id || `${certificate.email}-${certificate.certificateTitle}`}>
                            <td><input type="checkbox" aria-label={`Pilih ${certificate.userName}`} /></td>
                            <td><span className="admin-certificates-avatar" />{safeText(certificate.userName)}</td>
                            <td>{safeText(certificate.email)}</td>
                            <td>{safeText(certificate.certificateTitle)}</td>
                            <td><CertificateBadge>{certificate.type}</CertificateBadge></td>
                            <td>{safeText(certificate.workshopTitle)}</td>
                            <td>{formatDate(certificate.completedAt)}</td>
                            <td>{formatDate(certificate.issuedAt)}</td>
                            <td>{safeText(certificate.certificateNumber)}</td>
                            <td><CertificateBadge>{certificate.status}</CertificateBadge></td>
                            <td>{fileUrl ? <a href={fileUrl} target="_blank" rel="noreferrer">Buka</a> : 'Belum ada'}</td>
                            <td>
                              <div className="admin-certificates-actions">
                                <CertificateAction label={`Lihat ${certificate.certificateTitle}`} onClick={() => setSelectedCertificate(certificate)}>
                                  <img src={eyeIcon} alt="" />
                                </CertificateAction>
                                <label className="admin-certificates-upload-action" aria-label={`Upload ${certificate.certificateTitle}`}>
                                  <img src={fileIcon} alt="" />
                                  <input
                                    type="file"
                                    accept="application/pdf,image/png,image/jpeg,image/webp"
                                    onChange={(event) => {
                                      handleUploadCertificate(certificate, event.target.files?.[0]);
                                      event.target.value = '';
                                    }}
                                  />
                                </label>
                                <CertificateAction
                                  label={`Download ${certificate.certificateTitle}`}
                                  disabled={!fileUrl}
                                  onClick={() => fileUrl && window.open(fileUrl, '_blank', 'noopener,noreferrer')}
                                >
                                  <img src={downloadIcon} alt="" />
                                </CertificateAction>
                                <CertificateAction
                                  label={`Kirim email ${certificate.certificateTitle}`}
                                  onClick={() => {
                                    window.location.href = `mailto:${certificate.email}?subject=${encodeURIComponent(certificate.certificateTitle)}`;
                                  }}
                                >
                                  <img src={mailIcon} alt="" />
                                </CertificateAction>
                                <CertificateAction className="danger" label={`Hapus ${certificate.certificateTitle}`} onClick={() => handleDeleteCertificate(certificate)}>
                                  Delete
                                </CertificateAction>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="admin-certificates-pagination">
                <span>Menampilkan {filteredCertificates.length} dari {certificates.length} data</span>
                <div>
                  <button type="button" disabled>&lt;</button>
                  <button type="button" className="is-active">1</button>
                  <button type="button" disabled>&gt;</button>
                </div>
              </div>
            </section>

            <section className="admin-certificates-bottom">
              <article className="admin-certificates-panel">
                <div className="admin-certificates-panel-head">
                  <h2>Menunggu Penerbitan</h2>
                </div>
                <div className="admin-certificates-panel-list">
                  {pendingItems.length === 0 ? (
                    <p>Tidak ada sertifikat yang menunggu.</p>
                  ) : pendingItems.map((item) => (
                    <p key={item.id || item.email}><b>{item.userName}</b><span>{item.workshopTitle || item.certificateTitle}</span></p>
                  ))}
                </div>
              </article>

              <article className="admin-certificates-panel admin-certificates-problems">
                <div className="admin-certificates-panel-head">
                  <h2>Sertifikat Bermasalah</h2>
                </div>
                {problemItems.map((item) => (
                  <p key={item[0]}><span>{item[0]}</span><strong>{item[1]}</strong></p>
                ))}
              </article>

              <article className="admin-certificates-panel">
                <div className="admin-certificates-panel-head">
                  <h2>Aktivitas Terbaru</h2>
                </div>
                <div className="admin-certificates-activity">
                  {activityItems.length === 0 ? (
                    <p><span className="admin-certificates-dot is-gray" /><b>Belum ada aktivitas sertifikat.</b><time>-</time></p>
                  ) : activityItems.map((item) => (
                    <p key={item.id || item.email}>
                      <span className={`admin-certificates-dot is-${item.status === 'Tersedia' ? 'green' : item.status === 'Error' ? 'red' : 'orange'}`} />
                      <b>{item.certificateTitle}</b>
                      <time>{formatDate(item.updatedAt || item.issuedAt)}</time>
                    </p>
                  ))}
                </div>
              </article>
            </section>
          </section>
        </div>

        {isFormOpen ? (
          <CertificateFormModal
            form={form}
            workshops={workshops}
            participants={participants}
            certificates={certificates}
            onChange={setForm}
            onClose={() => setFormOpen(false)}
            onSubmit={handleCreateCertificate}
            onSubmitAll={handleGenerateAllCertificates}
            isSaving={isSaving}
          />
        ) : null}

        <BulkProgressModal
          progress={bulkProgress}
          onCancel={handleCancelBulkGenerate}
          onClose={handleCloseBulkProgress}
          onRetryFailed={handleRetryFailedCertificates}
        />

        <CertificateDetailModal certificate={selectedCertificate} onClose={() => setSelectedCertificate(null)} />
      </section>
    </main>
  );
}