import { useEffect, useMemo, useState } from 'react';
import { AdminNotificationButton } from './AdminChrome.jsx';
import { AdminSidebar } from './AdminSidebar.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';
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
import { apiEndpoint } from '../../services/apiEndpoints.js';

const CERTIFICATE_ENDPOINT = apiEndpoint(import.meta.env.VITE_CERTIFICATE_API_URL, '/api/certificate-api.php');

const initialCertificateForm = {
  templateId: ARDUFLOW_CERTIFICATE_TEMPLATE_ID,
  registrationId: '',
  certificateTargetId: '',
  memberKey: '',
  memberName: '',
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
    memberKey: row?.memberKey || row?.member_key || payload.memberKey || '',
    memberName: row?.memberName || row?.member_name || payload.memberName || '',
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
  const memberNames = row?.memberNames || row?.member_names || '';

  return {
    id: row?.registrationId || row?.registration_id || row?.id || '',
    registrationId: row?.registrationId || row?.registration_id || row?.id || '',
    userId: row?.userId || row?.user_id || '',
    workshopId: row?.workshopId || row?.workshop_id || '',
    workshopChoice: row?.workshopChoice || row?.workshop_choice || '-',
    participantName: row?.participantName || row?.participant_name || row?.name || '-',
    participantEmail: row?.participantEmail || row?.participant_email || row?.email || '',
    memberNames,
    status: row?.status || 'Baru',
    createdAt: row?.createdAt || row?.created_at || '',
  };
}

function parseMemberNames(value) {
  return String(value || '')
    .split(/\r?\n|[,;]/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function createMemberKey(registrationId, memberName, index) {
  const slug = String(memberName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${registrationId}-${index + 1}-${slug || 'member'}`;
}

function expandParticipantMembers(participant) {
  const names = parseMemberNames(participant.memberNames);
  const memberNames = names.length > 0 ? names : [participant.participantName];

  return memberNames.map((memberName, index) => ({
    ...participant,
    certificateTargetId: `${participant.registrationId}::${index}`,
    memberKey: createMemberKey(participant.registrationId, memberName, index),
    memberName,
    participantName: memberName,
    registrationParticipantName: participant.participantName,
    hasExplicitMemberList: names.length > 0,
    memberIndex: index,
  }));
}

function createCertificateLookupKey(registrationId, memberKey) {
  return `${registrationId || ''}::${memberKey || ''}`;
}

function getWorkshopStatus(row) {
  if (!row.totalMembers) {
    return 'Belum ada member';
  }

  if (row.generatedCount >= row.totalMembers) {
    return 'Lengkap';
  }

  if (row.generatedCount > 0) {
    return 'Sebagian';
  }

  return 'Belum dibuat';
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
        <AdminNotificationButton />
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
      participants
        .filter(
          (participant) =>
            String(participant.workshopId) === String(form.workshopId),
        )
        .flatMap(expandParticipantMembers),
    [participants, form.workshopId],
  );

  const selectedParticipant = workshopParticipants.find(
    (participant) =>
      String(participant.certificateTargetId) === String(form.certificateTargetId),
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
      certificateTargetId: '',
      memberKey: '',
      memberName: '',
      userId: '',
      userName: '',
      email: '',
    });
  };

  const handleParticipantChange = (event) => {
    const certificateTargetId = event.target.value;
    const participant = workshopParticipants.find(
      (item) => String(item.certificateTargetId) === certificateTargetId,
    );

    onChange({
      ...form,
      certificateTargetId,
      registrationId: participant?.registrationId || '',
      memberKey: participant?.memberKey || '',
      memberName: participant?.memberName || '',
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
              value={form.certificateTargetId}
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
                  key={participant.certificateTargetId}
                  value={participant.certificateTargetId}
                >
                  {participant.memberName} — daftar #{participant.registrationId} — {participant.participantEmail || 'tanpa email'} — {participant.status}
                </option>
              ))}
            </select>
            {form.workshopId ? (
              <small style={{ display: 'block', marginTop: 6 }}>
                {workshopParticipants.length} member ditemukan untuk {selectedWorkshop?.title || 'workshop ini'}.
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
              value={form.registrationId ? `${form.registrationId}${form.memberName ? ` / ${form.memberName}` : ''}` : ''}
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
              Untuk Generate Semua Member, nomor sertifikat dibuat otomatis dan unik untuk setiap member.
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
              workshopParticipants.length === 0
            }
          >
            {isSaving ? 'Memproses...' : `Generate Semua Member (${workshopParticipants.length})`}
          </button>
          <button
            type="button"
            className="admin-certificates-primary"
            onClick={onSubmit}
            disabled={isSaving || !form.certificateTargetId}
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

function WorkshopMembersModal({
  row,
  onClose,
  onViewCertificate,
  onGenerateAll,
  onSendCertificate,
  onSendWorkshopCertificates,
  sendingCertificateIds,
  isSendingWorkshop,
}) {
  if (!row) {
    return null;
  }

  const sendableCertificates = row.members
    .map((member) => member.certificate)
    .filter((certificate) => certificate && getCertificateFileUrl(certificate.file));

  return (
    <div className="admin-certificates-modal-backdrop" role="presentation">
      <section className="admin-certificates-modal detail admin-certificates-modal--wide" role="dialog" aria-modal="true" aria-labelledby="workshop-members-title">
        <div className="admin-certificates-modal-head">
          <div>
            <h2 id="workshop-members-title">Member Workshop</h2>
            <p className="admin-certificates-modal-subtitle">{safeText(row.title)}</p>
          </div>
          <button type="button" aria-label="Tutup detail member" onClick={onClose}>x</button>
        </div>

        <div className="admin-certificates-member-summary">
          <span><b>{row.totalMembers}</b> member</span>
          <span><b>{row.generatedCount}</b> sertifikat dibuat</span>
          <span><b>{row.missingCount}</b> belum dibuat</span>
          <CertificateBadge>{getWorkshopStatus(row)}</CertificateBadge>
        </div>

        <div className="admin-certificates-table-scroll admin-certificates-member-scroll">
          <table className="admin-certificates-table admin-certificates-member-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Pendaftar</th>
                <th>Email</th>
                <th>No. Sertifikat</th>
                <th>Status</th>
                <th>File</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {row.members.length === 0 ? (
                <tr><td colSpan="7" className="admin-certificates-empty">Belum ada member yang terdaftar di workshop ini.</td></tr>
              ) : (
                row.members.map((member) => {
                  const certificate = member.certificate;
                  const fileUrl = getCertificateFileUrl(certificate?.file);
                  const memberLabel = member.hasExplicitMemberList
                    ? member.memberName
                    : member.participantName;

                  return (
                    <tr key={member.certificateTargetId || `${member.registrationId}-${member.memberIndex}`}>
                      <td><span className="admin-certificates-avatar" />{safeText(memberLabel)}</td>
                      <td>{safeText(member.registrationParticipantName || member.participantName)}</td>
                      <td>{safeText(member.participantEmail)}</td>
                      <td>{safeText(certificate?.certificateNumber)}</td>
                      <td><CertificateBadge>{certificate?.status || 'Belum dibuat'}</CertificateBadge></td>
                      <td>{fileUrl ? <a href={fileUrl} target="_blank" rel="noreferrer">Buka</a> : 'Belum ada'}</td>
                      <td>
                        <div className="admin-certificates-actions">
                          <CertificateAction
                            label={`Lihat sertifikat ${memberLabel}`}
                            disabled={!certificate}
                            onClick={() => certificate && onViewCertificate(certificate)}
                          >
                            <img src={eyeIcon} alt="" />
                          </CertificateAction>
                          <CertificateAction
                            label={`Download sertifikat ${memberLabel}`}
                            disabled={!fileUrl}
                            onClick={() => fileUrl && window.open(fileUrl, '_blank', 'noopener,noreferrer')}
                          >
                            <img src={downloadIcon} alt="" />
                          </CertificateAction>
                          <CertificateAction
                            label={`Kirim sertifikat ${memberLabel}`}
                            disabled={!certificate || !fileUrl || sendingCertificateIds.has(certificate.id)}
                            onClick={() => certificate && onSendCertificate(certificate)}
                          >
                            <img src={mailIcon} alt="" />
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

        <div className="admin-certificates-modal-actions">
          <button type="button" onClick={onClose}>Tutup</button>
          <button
            type="button"
            disabled={isSendingWorkshop || sendableCertificates.length === 0}
            onClick={() => onSendWorkshopCertificates(row)}
          >
            {isSendingWorkshop ? 'Mengirim...' : `Kirim Email (${sendableCertificates.length})`}
          </button>
          <button type="button" className="admin-certificates-primary" onClick={() => onGenerateAll(row)}>
            Generate Semua Member
          </button>
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
  const [selectedWorkshopMembers, setSelectedWorkshopMembers] = useState(null);
  const [sendingCertificateIds, setSendingCertificateIds] = useState(() => new Set());
  const [sendingWorkshopId, setSendingWorkshopId] = useState('');

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

  const workshopCertificateRows = useMemo(() => {
    const workshopMap = new Map();

    workshops.forEach((workshop) => {
      if (!workshop?.id) {
        return;
      }

      workshopMap.set(String(workshop.id), {
        ...workshop,
        title: workshop.title || 'Workshop tanpa judul',
        category: workshop.category || 'Workshop',
      });
    });

    participants.forEach((participant) => {
      const key = String(participant.workshopId || '');

      if (!key || workshopMap.has(key)) {
        return;
      }

      workshopMap.set(key, {
        id: participant.workshopId,
        title: participant.workshopChoice || 'Workshop tanpa judul',
        category: 'Workshop',
      });
    });

    certificates.forEach((certificate) => {
      const key = String(certificate.workshopId || '');

      if (!key || workshopMap.has(key)) {
        return;
      }

      workshopMap.set(key, {
        id: certificate.workshopId,
        title: certificate.workshopTitle || 'Workshop tanpa judul',
        category: certificate.type || 'Workshop',
      });
    });

    return Array.from(workshopMap.values()).map((workshop) => {
      const workshopId = String(workshop.id || '');
      const memberTargets = participants
        .filter((participant) => String(participant.workshopId || '') === workshopId)
        .flatMap(expandParticipantMembers);
      const workshopCertificates = certificates.filter(
        (certificate) => String(certificate.workshopId || '') === workshopId,
      );

      const certificateByMember = new Map();
      const legacyCertificateByRegistration = new Map();

      workshopCertificates.forEach((certificate) => {
        if (certificate.memberKey) {
          certificateByMember.set(
            createCertificateLookupKey(certificate.registrationId, certificate.memberKey),
            certificate,
          );
        } else if (certificate.registrationId) {
          legacyCertificateByRegistration.set(String(certificate.registrationId), certificate);
        }
      });

      const members = memberTargets.map((member) => {
        const certificate =
          certificateByMember.get(createCertificateLookupKey(member.registrationId, member.memberKey)) ||
          (!member.hasExplicitMemberList
            ? legacyCertificateByRegistration.get(String(member.registrationId))
            : null);

        return { ...member, certificate: certificate || null };
      });

      const generatedCount = members.filter((member) => member.certificate).length;
      const availableCount = members.filter((member) => member.certificate?.status === 'Tersedia').length;

      return {
        ...workshop,
        members,
        certificates: workshopCertificates,
        totalMembers: members.length,
        generatedCount,
        availableCount,
        missingCount: Math.max(members.length - generatedCount, 0),
      };
    });
  }, [certificates, participants, workshops]);

  const filteredWorkshopRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return workshopCertificateRows.filter((row) => {
      const haystack = [
        row.title,
        row.category,
        getWorkshopStatus(row),
        ...row.members.flatMap((member) => [
          member.memberName,
          member.participantName,
          member.registrationParticipantName,
          member.participantEmail,
          member.certificate?.certificateNumber,
        ]),
      ].join(' ').toLowerCase();

      if (normalizedQuery && !haystack.includes(normalizedQuery)) {
        return false;
      }

      if (filters.type && row.category !== filters.type) {
        return false;
      }

      if (filters.status && !row.members.some((member) => member.certificate?.status === filters.status)) {
        return false;
      }

      if (filters.workshopTitle && row.title !== filters.workshopTitle) {
        return false;
      }

      if (filters.issuedAt && !row.members.some((member) => member.certificate?.issuedAt === filters.issuedAt)) {
        return false;
      }

      if (filters.completedAt && !row.members.some((member) => member.certificate?.completedAt === filters.completedAt)) {
        return false;
      }

      return true;
    });
  }, [filters, query, workshopCertificateRows]);

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

  const uniqueTypes = useMemo(() => [...new Set(workshopCertificateRows.map((item) => item.category).filter(Boolean))], [workshopCertificateRows]);
  const uniqueStatuses = useMemo(() => [...new Set(certificates.map((item) => item.status).filter(Boolean))], [certificates]);
  const uniquePrograms = useMemo(() => [...new Set(workshopCertificateRows.map((item) => item.title).filter(Boolean))], [workshopCertificateRows]);
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
      ? createCertificateNumber(options.seed || `${Date.now()}${participant.memberIndex || 0}`)
      : form.certificateNumber || createCertificateNumber();
    const verificationUrl = options.forceAutoNumber
      ? createVerificationUrl(certificateNumber)
      : form.verificationUrl || createVerificationUrl(certificateNumber);

    const payload = {
      ...form,
      registrationId: participant.registrationId,
      certificateTargetId: participant.certificateTargetId || '',
      memberKey: participant.memberKey || '',
      memberName: participant.memberName || participant.participantName,
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

    if (!response.ok || !result?.success) {
      const apiErrors = result?.errors
        ? Object.values(result.errors).join(' ')
        : '';
      throw new Error(
        apiErrors || result?.message || 'Sertifikat gagal disimpan.',
      );
    }

    const certificate = normalizeCertificate(result.data?.certificate || {});
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
        (item) => String(item.workshopId) === String(form.workshopId),
      );
      const workshopMemberTargets = participants
        .filter((item) => String(item.workshopId) === String(form.workshopId))
        .flatMap(expandParticipantMembers);
      const selectedTarget = workshopMemberTargets.find(
        (item) => String(item.certificateTargetId) === String(form.certificateTargetId),
      );

      if (!selectedWorkshop) {
        throw new Error('Pilih workshop terlebih dahulu.');
      }

      if (!participant || !selectedTarget) {
        throw new Error(
          'Pilih member dari daftar pendaftaran workshop. Nama peserta tidak dapat diisi manual.',
        );
      }

      await createCertificateForParticipant(selectedTarget, selectedWorkshop);

      setForm(initialCertificateForm);
      setFormOpen(false);
      await loadCertificates();
    } catch (submitError) {
      setError(submitError.message || 'Sertifikat gagal disimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateAllCertificates = async () => {
    setIsSaving(true);
    setError('');

    try {
      const selectedWorkshop = workshops.find(
        (workshop) => String(workshop.id) === String(form.workshopId),
      );

      if (!selectedWorkshop) {
        throw new Error('Pilih workshop terlebih dahulu.');
      }

      const workshopParticipants = participants
        .filter(
          (participant) =>
            String(participant.workshopId) === String(selectedWorkshop.id),
        )
        .flatMap(expandParticipantMembers);

      if (workshopParticipants.length === 0) {
        throw new Error('Belum ada peserta yang mendaftar workshop ini.');
      }

      const existingRegistrationIds = new Set(
        certificates
          .filter(
            (certificate) =>
              String(certificate.workshopId) === String(selectedWorkshop.id),
          )
          .map((certificate) => `${certificate.registrationId || ''}::${certificate.memberKey || ''}`)
          .filter(Boolean),
      );
      const legacyRegistrationIds = new Set(
        certificates
          .filter(
            (certificate) =>
              String(certificate.workshopId) === String(selectedWorkshop.id) &&
              !certificate.memberKey,
          )
          .map((certificate) => String(certificate.registrationId || ''))
          .filter(Boolean),
      );

      const participantsToGenerate = workshopParticipants.filter(
        (participant) =>
          !existingRegistrationIds.has(`${participant.registrationId || ''}::${participant.memberKey || ''}`) &&
          (participant.hasExplicitMemberList ||
            !legacyRegistrationIds.has(String(participant.registrationId || ''))),
      );

      if (participantsToGenerate.length === 0) {
        throw new Error(
          'Semua member workshop ini sudah memiliki sertifikat.',
        );
      }

      const failed = [];

      for (const [index, participant] of participantsToGenerate.entries()) {
        try {
          await createCertificateForParticipant(participant, selectedWorkshop, {
            forceAutoNumber: true,
            seed: `${Date.now()}${index}`,
          });
        } catch (participantError) {
          failed.push(
            `${participant.participantName}: ${participantError.message}`,
          );
        }
      }

      await loadCertificates();

      if (failed.length > 0) {
        throw new Error(
          `${participantsToGenerate.length - failed.length} sertifikat berhasil dibuat. ${failed.length} gagal: ${failed.join(' | ')}`,
        );
      }

      setForm(initialCertificateForm);
      setFormOpen(false);
    } catch (submitError) {
      setError(submitError.message || 'Generate semua sertifikat gagal.');
    } finally {
      setIsSaving(false);
    }
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

  const handleSendCertificateEmail = async (certificate, options = {}) => {
    if (!certificate?.id) {
      throw new Error('Sertifikat tidak valid.');
    }

    const fileUrl = getCertificateFileUrl(certificate.file);

    if (!fileUrl) {
      throw new Error('File sertifikat belum tersedia. Generate atau upload sertifikat terlebih dahulu.');
    }

    setSendingCertificateIds((current) => {
      const next = new Set(current);
      next.add(certificate.id);
      return next;
    });

    try {
      const response = await fetch(buildCertificateEndpoint({
        action: 'send-certificate',
        id: certificate.id,
      }), {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Sertifikat gagal dikirim melalui email.');
      }

      if (!options.silent) {
        setError('');
        window.alert(`Sertifikat berhasil dikirim ke ${certificate.email}.`);
        await loadCertificates();
      }

      return result;
    } catch (sendError) {
      if (!options.silent) {
        setError(sendError.message || 'Sertifikat gagal dikirim melalui email.');
      }

      throw sendError;
    } finally {
      setSendingCertificateIds((current) => {
        const next = new Set(current);
        next.delete(certificate.id);
        return next;
      });
    }
  };

  const handleSendWorkshopCertificates = async (row) => {
    const sendableCertificates = (row?.members || [])
      .map((member) => member.certificate)
      .filter((certificate) => certificate && getCertificateFileUrl(certificate.file));

    if (sendableCertificates.length === 0) {
      setError('Belum ada sertifikat dengan file yang bisa dikirim pada workshop ini.');
      return;
    }

    setSendingWorkshopId(String(row.id || row.title || ''));
    setError('');

    const failed = [];

    for (const certificate of sendableCertificates) {
      try {
        await handleSendCertificateEmail(certificate, { silent: true });
      } catch (sendError) {
        failed.push(`${certificate.userName || certificate.email}: ${sendError.message}`);
      }
    }

    setSendingWorkshopId('');
    await loadCertificates();

    if (failed.length > 0) {
      setError(`Sebagian sertifikat gagal dikirim: ${failed.join('; ')}`);
      return;
    }

    window.alert(`${sendableCertificates.length} sertifikat berhasil dikirim melalui email.`);
  };

  const openGenerateWorkshopCertificates = (row) => {
    setSelectedWorkshopMembers(null);
    setForm({
      ...initialCertificateForm,
      workshopId: row?.id || '',
      workshopTitle: row?.title || initialCertificateForm.workshopTitle,
      type: row?.category || initialCertificateForm.type,
      certificateTitle: row?.title ? `Sertifikat ${row.title}` : initialCertificateForm.certificateTitle,
    });
    setFormOpen(true);
  };

  const exportCsv = () => {
    const header = ['Workshop', 'Jenis', 'Total Member', 'Sertifikat Dibuat', 'Tersedia', 'Belum Dibuat', 'Status'];
    const rows = filteredWorkshopRows.map((row) => [
      row.title,
      row.category,
      row.totalMembers,
      row.generatedCount,
      row.availableCount,
      row.missingCount,
      getWorkshopStatus(row),
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
                + Generate Sertifikat
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
                  placeholder="Cari workshop, member, email, atau nomor sertifikat..."
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
                      <th><input type="checkbox" aria-label="Pilih semua workshop" /></th>
                      <th>Workshop / Program</th>
                      <th>Jenis</th>
                      <th>Total Member</th>
                      <th>Sertifikat Dibuat</th>
                      <th>Tersedia</th>
                      <th>Belum Dibuat</th>
                      <th>Status Workshop</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan="9" className="admin-certificates-empty">Memuat data sertifikat...</td></tr>
                    ) : filteredWorkshopRows.length === 0 ? (
                      <tr><td colSpan="9" className="admin-certificates-empty">Belum ada workshop yang cocok dengan filter.</td></tr>
                    ) : (
                      filteredWorkshopRows.map((row) => (
                        <tr key={row.id || row.title}>
                          <td><input type="checkbox" aria-label={`Pilih ${row.title}`} /></td>
                          <td>
                            <div className="admin-certificates-workshop-title">
                              <span className="admin-certificates-avatar" />
                              <span>
                                <b>{safeText(row.title)}</b>
                                <small>{row.certificates.length} data sertifikat tersimpan</small>
                              </span>
                            </div>
                          </td>
                          <td><CertificateBadge>{row.category}</CertificateBadge></td>
                          <td>{row.totalMembers}</td>
                          <td>{row.generatedCount}</td>
                          <td>{row.availableCount}</td>
                          <td>{row.missingCount}</td>
                          <td><CertificateBadge>{getWorkshopStatus(row)}</CertificateBadge></td>
                          <td>
                            <div className="admin-certificates-actions">
                              <button
                                type="button"
                                className="admin-certificates-secondary"
                                onClick={() => setSelectedWorkshopMembers(row)}
                              >
                                Lihat Member
                              </button>
                              <button
                                type="button"
                                className="admin-certificates-secondary"
                                onClick={() => openGenerateWorkshopCertificates(row)}
                              >
                                Generate Semua
                              </button>
                              <button
                                type="button"
                                className="admin-certificates-secondary"
                                disabled={
                                  sendingWorkshopId === String(row.id || row.title || '') ||
                                  row.members.every((member) => !member.certificate || !getCertificateFileUrl(member.certificate.file))
                                }
                                onClick={() => handleSendWorkshopCertificates(row)}
                              >
                                {sendingWorkshopId === String(row.id || row.title || '') ? 'Mengirim...' : 'Kirim Email'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="admin-certificates-pagination">
                <span>Menampilkan {filteredWorkshopRows.length} dari {workshopCertificateRows.length} workshop</span>
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
            onChange={setForm}
            onClose={() => setFormOpen(false)}
            onSubmit={handleCreateCertificate}
            onSubmitAll={handleGenerateAllCertificates}
            isSaving={isSaving}
          />
        ) : null}

        <WorkshopMembersModal
          row={selectedWorkshopMembers}
          onClose={() => setSelectedWorkshopMembers(null)}
          onViewCertificate={(certificate) => {
            setSelectedCertificate(certificate);
          }}
          onGenerateAll={openGenerateWorkshopCertificates}
          onSendCertificate={handleSendCertificateEmail}
          onSendWorkshopCertificates={handleSendWorkshopCertificates}
          sendingCertificateIds={sendingCertificateIds}
          isSendingWorkshop={sendingWorkshopId === String(selectedWorkshopMembers?.id || selectedWorkshopMembers?.title || '')}
        />

        <CertificateDetailModal certificate={selectedCertificate} onClose={() => setSelectedCertificate(null)} />
      </section>
    </main>
  );
}
