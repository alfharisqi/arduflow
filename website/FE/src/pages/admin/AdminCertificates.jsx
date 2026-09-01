import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminPage, AdminTopbar } from './AdminChrome.jsx';
import { AdminActionDropdown } from './AdminActionDropdown.jsx';
import bookIcon from '../../assets/icons/icon-book-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import downloadIcon from '../../assets/icons/icon-downloadsim-1.svg';
import mailIcon from '../../assets/icons/icon-mail-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import {
  CertificateGeneratorPreview,
  CustomCertificatePreview,
} from '../../features/certificates/CertificateGenerator.jsx';
import {
  certificateFontOptions,
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
const CUSTOM_CERTIFICATE_TEMPLATES_STORAGE_KEY = 'arduflow-admin-certificate-templates';

const initialCertificateForm = {
  templateId: ARDUFLOW_CERTIFICATE_TEMPLATE_ID,
  certificateFontId: 'roboto',
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

const customTemplateFields = [
  { key: 'brandLogo', label: 'Logo / Brand', type: 'text', sample: 'arduflow', fontSize: 20, x: 8, y: 8, width: 22, height: 8, align: 'left' },
  { key: 'certificateTitle', label: 'Judul Sertifikat', type: 'text', sample: 'Sertifikat Workshop Arduflow IDE', fontSize: 18, x: 50, y: 18, width: 52, align: 'center' },
  { key: 'participantName', label: 'Nama Peserta', type: 'text', sample: 'Nama Lengkap', fontSize: 32, x: 50, y: 42, width: 62, align: 'center' },
  { key: 'programName', label: 'Workshop / Program', type: 'text', sample: 'Workshop Pemula Mahasiswa', fontSize: 20, x: 50, y: 55, width: 58, align: 'center' },
  { key: 'description', label: 'Deskripsi Pencapaian', type: 'text', sample: 'Atas partisipasi dan keberhasilannya mengikuti kegiatan.', fontSize: 12, x: 50, y: 64, width: 60, align: 'center' },
  { key: 'issueDate', label: 'Tanggal Terbit', type: 'text', sample: '17 Agustus 2026', fontSize: 12, x: 18, y: 82, width: 28, align: 'left' },
  { key: 'authorizedBy', label: 'Nama Instruktur', type: 'text', sample: 'Dimas Permana', fontSize: 13, x: 72, y: 82, width: 28, align: 'center' },
  { key: 'authorizedRole', label: 'Jabatan Instruktur', type: 'text', sample: 'Instruktur Arduflow IDE', fontSize: 10, x: 72, y: 88, width: 30, align: 'center' },
  { key: 'certificateNumber', label: 'Nomor Sertifikat', type: 'text', sample: 'AFW-CERT-2026-124579', fontSize: 10, x: 18, y: 14, width: 32, align: 'left' },
  { key: 'verificationUrl', label: 'QR / URL Verifikasi', type: 'qr', sample: 'QR', fontSize: 10, x: 86, y: 67, width: 12, height: 12, align: 'center' },
  { key: 'signatureImage', label: 'Tanda Tangan Gambar', type: 'signature', sample: 'Upload PNG TTD', fontSize: 10, x: 72, y: 74, width: 22, height: 9, align: 'center' },
];

const initialCustomTemplateLayout = customTemplateFields.reduce((layout, field) => ({
  ...layout,
  [field.key]: {
    x: field.x,
    y: field.y,
    width: field.width,
    height: field.height || 6,
    fontSize: field.fontSize,
    align: field.align,
    visible: true,
    content: field.sample,
  },
}), {});

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

function normalizeCertificateType(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized === 'program') {
    return 'Program';
  }

  if (normalized === 'course' || normalized === 'kursus') {
    return 'Course';
  }

  return 'Workshop';
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

function loadCustomCertificateTemplates() {
  try {
    const rawValue = localStorage.getItem(CUSTOM_CERTIFICATE_TEMPLATES_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function saveCustomCertificateTemplates(templates) {
  localStorage.setItem(
    CUSTOM_CERTIFICATE_TEMPLATES_STORAGE_KEY,
    JSON.stringify(templates),
  );
}

function getCustomTemplateOptionId(template) {
  return template?.id ? `custom:${template.id}` : '';
}

function getDefaultCertificateTemplateId(customTemplates = []) {
  return getCustomTemplateOptionId(customTemplates[0]) || ARDUFLOW_CERTIFICATE_TEMPLATE_ID;
}

function isKnownTemplateId(templateId, customTemplates = []) {
  return (
    certificateTemplateOptions.some((template) => template.id === templateId) ||
    customTemplates.some((template) => getCustomTemplateOptionId(template) === templateId)
  );
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
    .map((line) => cleanCertificatePersonName(line))
    .filter(Boolean);
}

function cleanCertificatePersonName(value, fallback = '') {
  const cleanedValue = String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, ' ')
    .replace(/^\s*\d+\s*[\).\-\:]\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleanedValue || fallback;
}

function createMemberKey(registrationId, memberName, index) {
  const slug = cleanCertificatePersonName(memberName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${registrationId}-${index + 1}-${slug || 'member'}`;
}

function expandParticipantMembers(participant) {
  const names = parseMemberNames(participant.memberNames);
  const memberNames = names.length > 0
    ? names
    : [cleanCertificatePersonName(participant.participantName, participant.participantName)];

  return memberNames.map((memberName, index) => {
    const cleanMemberName = cleanCertificatePersonName(memberName, participant.participantName);

    return {
      ...participant,
      certificateTargetId: `${participant.registrationId}::${index}`,
      memberKey: createMemberKey(participant.registrationId, cleanMemberName, index),
      memberName: cleanMemberName,
      participantName: cleanMemberName,
      registrationParticipantName: cleanCertificatePersonName(participant.participantName, participant.participantName),
      hasExplicitMemberList: names.length > 0,
      memberIndex: index,
    };
  });
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

function CertificateFormModal({
  form,
  workshops,
  participants,
  customTemplates,
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
  const isSingleMember = Boolean(form.certificateTargetId);
  const selectedCustomTemplate = customTemplates.find(
    (template) => getCustomTemplateOptionId(template) === form.templateId,
  );

  useEffect(() => {
    if (!isKnownTemplateId(form.templateId, customTemplates)) {
      onChange({
        ...form,
        templateId: getDefaultCertificateTemplateId(customTemplates),
      });
    }
  }, [customTemplates, form, onChange]);

  return (
    <div className="admin-certificates-modal-backdrop" role="presentation">
      <section
        className="admin-certificates-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="certificate-form-title"
      >
        <div className="admin-certificates-modal-head">
          <div>
            <h2 id="certificate-form-title">
              {isSingleMember ? 'Generate Sertifikat Member' : 'Generate Semua Member'}
            </h2>
            <p className="admin-certificates-modal-subtitle">
              {selectedWorkshop?.title || form.workshopTitle || 'Workshop belum dipilih'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup form">
            x
          </button>
        </div>

        <div className="admin-certificates-generate-summary">
          <span><b>Mode</b>{isSingleMember ? 'Satu member' : 'Semua member belum dibuat'}</span>
          <span><b>Target</b>{isSingleMember ? safeText(form.userName) : `${workshopParticipants.length} member`}</span>
          <span><b>Email</b>{isSingleMember ? safeText(form.email) : 'Otomatis per member'}</span>
        </div>

        <div className="admin-certificates-form-grid">
          <label>
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
              {customTemplates.length ? (
                <optgroup label="Template Custom">
                  {customTemplates.map((template) => (
                    <option key={template.id} value={getCustomTemplateOptionId(template)}>
                      {template.name}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
            <small>
              {customTemplates.length
                ? `${customTemplates.length} template custom tersimpan.`
                : 'Belum ada template custom tersimpan.'}
            </small>
          </label>

          <label>
            <span>Font Sertifikat</span>
            <select
              value={form.certificateFontId}
              onChange={(event) =>
                onChange({ ...form, certificateFontId: event.target.value })
              }
            >
              {certificateFontOptions.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Tanggal Terbit</span>
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

          <div className="admin-certificates-form-wide">
            <span className="admin-certificates-preview-label">
              Preview Template
            </span>
            {selectedCustomTemplate ? (
              <CustomCertificatePreview data={form} template={selectedCustomTemplate} />
            ) : (
              <CertificateGeneratorPreview data={form} />
            )}
          </div>
        </div>

        <div className="admin-certificates-modal-actions">
          <button type="button" onClick={onClose} disabled={isSaving}>
            Batal
          </button>
          {isSingleMember ? (
            <button
              type="button"
              className="admin-certificates-primary"
              onClick={onSubmit}
              disabled={isSaving || !form.certificateTargetId}
            >
              {isSaving ? 'Membuat PDF...' : 'Generate Sertifikat'}
            </button>
          ) : (
            <button
              type="button"
              className="admin-certificates-primary"
              onClick={onSubmitAll}
              disabled={
                isSaving ||
                !form.workshopId ||
                workshopParticipants.length === 0
              }
            >
              {isSaving ? 'Memproses...' : `Generate Semua (${workshopParticipants.length})`}
            </button>
          )}
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
  onGenerateMember,
  onGenerateAll,
  onSendCertificate,
  onSendWorkshopCertificates,
  sendingCertificateIds,
  isSendingWorkshop,
}) {
  const activeRow = row || { members: [] };
  const [memberQuery, setMemberQuery] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('');
  const sendableCertificates = activeRow.members
    .map((member) => member.certificate)
    .filter((certificate) => certificate && getCertificateFileUrl(certificate.file));
  const memberStatusOptions = useMemo(
    () => [
      ...new Set(
        activeRow.members
          .map((member) => member.certificate?.status || 'Belum dibuat')
          .filter(Boolean),
      ),
    ],
    [activeRow.members],
  );
  const filteredMembers = useMemo(() => {
    const normalizedQuery = memberQuery.trim().toLowerCase();

    return activeRow.members.filter((member) => {
      const status = member.certificate?.status || 'Belum dibuat';
      const memberLabel = member.hasExplicitMemberList
        ? member.memberName
        : member.participantName;
      const haystack = [
        memberLabel,
        member.registrationParticipantName,
        member.participantName,
        member.participantEmail,
        member.certificate?.certificateNumber,
      ].join(' ').toLowerCase();

      if (normalizedQuery && !haystack.includes(normalizedQuery)) {
        return false;
      }

      if (memberStatusFilter && status !== memberStatusFilter) {
        return false;
      }

      return true;
    });
  }, [activeRow.members, memberQuery, memberStatusFilter]);

  if (!row) {
    return null;
  }

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

        <div className="admin-certificates-member-filter">
          <label className="admin-certificates-search">
            <input
              type="search"
              placeholder="Cari nama, email, atau nomor sertifikat..."
              value={memberQuery}
              onChange={(event) => setMemberQuery(event.target.value)}
            />
          </label>
          <label>
            <span>Status</span>
            <select value={memberStatusFilter} onChange={(event) => setMemberStatusFilter(event.target.value)}>
              <option value="">Semua Status</option>
              {memberStatusOptions.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => {
            setMemberQuery('');
            setMemberStatusFilter('');
          }}>
            Reset
          </button>
          <span>{filteredMembers.length} dari {row.members.length} member</span>
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
              ) : filteredMembers.length === 0 ? (
                <tr><td colSpan="7" className="admin-certificates-empty">Tidak ada member yang cocok dengan filter.</td></tr>
              ) : (
                filteredMembers.map((member) => {
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
                        <AdminActionDropdown
                          label={`Buka aksi sertifikat ${memberLabel}`}
                          items={[
                            {
                              label: certificate ? 'Generate Ulang' : 'Generate',
                              onSelect: () => onGenerateMember(row, member),
                            },
                            {
                              label: 'Lihat',
                              icon: <img src={eyeIcon} alt="" />,
                              disabled: !certificate,
                              onSelect: () => certificate && onViewCertificate(certificate),
                            },
                            {
                              label: 'Download',
                              icon: <img src={downloadIcon} alt="" />,
                              disabled: !fileUrl,
                              onSelect: () => fileUrl && window.open(fileUrl, '_blank', 'noopener,noreferrer'),
                            },
                            {
                              label: 'Kirim',
                              icon: <img src={mailIcon} alt="" />,
                              disabled: !certificate || !fileUrl || sendingCertificateIds.has(certificate.id),
                              onSelect: () => certificate && onSendCertificate(certificate),
                            },
                          ]}
                        />
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

function CustomCertificateTemplateModal({ onClose, templates, onTemplatesChange }) {
  const previewRef = useRef(null);
  const [templateName, setTemplateName] = useState('Template Sertifikat Baru');
  const [savedTemplates, setSavedTemplates] = useState(templates);
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [backgroundName, setBackgroundName] = useState('');
  const [selectedFieldKey, setSelectedFieldKey] = useState('participantName');
  const [layout, setLayout] = useState(initialCustomTemplateLayout);
  const selectedField = customTemplateFields.find((field) => field.key === selectedFieldKey) || customTemplateFields[0];
  const selectedLayout = layout[selectedField.key] || initialCustomTemplateLayout[selectedField.key];
  const layoutJson = JSON.stringify({ name: templateName, backgroundName, backgroundUrl, fields: layout }, null, 2);

  useEffect(() => {
    setSavedTemplates(templates);
  }, [templates]);

  const persistTemplates = (nextTemplates) => {
    setSavedTemplates(nextTemplates);
    saveCustomCertificateTemplates(nextTemplates);
    onTemplatesChange(nextTemplates);
  };

  const updateSelectedLayout = (patch) => {
    setLayout((current) => ({
      ...current,
      [selectedField.key]: {
        ...current[selectedField.key],
        ...patch,
      },
    }));
  };

  const handleBackgroundUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBackgroundName(file.name);
      setBackgroundUrl(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleSelectedFieldImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (selectedField.key === 'signatureImage' && file.type !== 'image/png') {
      window.alert('Tanda tangan harus menggunakan file PNG, sebaiknya PNG transparan.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateSelectedLayout({
        imageUrl: String(reader.result || ''),
        content: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const moveFieldFromPointer = (fieldKey, event) => {
    const preview = previewRef.current;

    if (!preview) {
      return;
    }

    const rect = preview.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setLayout((current) => ({
      ...current,
      [fieldKey]: {
        ...current[fieldKey],
        x: Math.max(0, Math.min(100, Number(x.toFixed(1)))),
        y: Math.max(0, Math.min(100, Number(y.toFixed(1)))),
      },
    }));
  };

  const handleFieldPointerDown = (fieldKey, event) => {
    event.preventDefault();
    setSelectedFieldKey(fieldKey);
    moveFieldFromPointer(fieldKey, event);

    const handlePointerMove = (moveEvent) => {
      moveFieldFromPointer(fieldKey, moveEvent);
    };
    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const copyLayoutJson = async () => {
    await navigator.clipboard?.writeText(layoutJson);
  };

  const saveCurrentTemplate = () => {
    const id = `${Date.now()}`;
    const nextTemplate = {
      id,
      name: templateName.trim() || 'Template Sertifikat',
      backgroundName,
      backgroundUrl,
      fields: layout,
      updatedAt: new Date().toISOString(),
    };
    const nextTemplates = [
      nextTemplate,
      ...savedTemplates.filter((template) => template.name !== nextTemplate.name),
    ];

    persistTemplates(nextTemplates);
  };

  const loadTemplate = (template) => {
    setTemplateName(template.name || 'Template Sertifikat');
    setBackgroundName(template.backgroundName || '');
    setBackgroundUrl(template.backgroundUrl || '');
    setLayout({
      ...initialCustomTemplateLayout,
      ...(template.fields || {}),
    });
    setSelectedFieldKey('participantName');
  };

  const deleteTemplate = (templateId) => {
    persistTemplates(savedTemplates.filter((template) => template.id !== templateId));
  };

  return (
    <div className="admin-certificates-modal-backdrop" role="presentation">
      <section className="admin-certificates-modal admin-certificates-template-modal" role="dialog" aria-modal="true" aria-labelledby="custom-template-title">
        <div className="admin-certificates-modal-head">
          <div>
            <h2 id="custom-template-title">Buat Template Sertifikat</h2>
            <p className="admin-certificates-modal-subtitle">Upload background lalu atur field dengan drag atau input posisi.</p>
          </div>
          <button type="button" aria-label="Tutup template builder" onClick={onClose}>x</button>
        </div>

        <div className="admin-certificates-template-builder">
          <aside className="admin-certificates-template-sidebar">
            <label className="admin-certificates-template-upload">
              <span>Nama Template</span>
              <input type="text" value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
            </label>

            <label className="admin-certificates-template-upload">
              <span>Background Sertifikat</span>
              <input type="file" accept="image/*" onChange={handleBackgroundUpload} />
              <small>{backgroundName || 'PNG/JPG landscape direkomendasikan.'}</small>
            </label>

            <div className="admin-certificates-template-saved">
              <span>Template Tersimpan</span>
              {savedTemplates.length === 0 ? (
                <small>Belum ada template tersimpan.</small>
              ) : savedTemplates.map((template) => (
                <div key={template.id}>
                  <button type="button" onClick={() => loadTemplate(template)}>{template.name}</button>
                  <button type="button" onClick={() => deleteTemplate(template.id)}>Hapus</button>
                </div>
              ))}
            </div>

            <div className="admin-certificates-template-field-list">
              {customTemplateFields.map((field) => {
                const fieldLayout = layout[field.key];

                return (
                  <button
                    type="button"
                    className={selectedFieldKey === field.key ? 'is-active' : ''}
                    key={field.key}
                    onClick={() => setSelectedFieldKey(field.key)}
                  >
                    <span>{field.label}</span>
                    <small>{fieldLayout.visible ? `${fieldLayout.x}% / ${fieldLayout.y}%` : 'Disembunyikan'}</small>
                  </button>
                );
              })}
            </div>

            <div className="admin-certificates-template-controls">
              <label className="admin-certificates-template-control-wide">
                <span>Isi Field</span>
                <textarea value={selectedLayout.content} onChange={(event) => updateSelectedLayout({ content: event.target.value })} rows="3" />
              </label>
              {['brandLogo', 'signatureImage'].includes(selectedField.key) ? (
                <label className="admin-certificates-template-control-wide">
                  <span>{selectedField.key === 'signatureImage' ? 'Upload PNG TTD' : 'Upload Gambar Field'}</span>
                  <input
                    type="file"
                    accept={selectedField.key === 'signatureImage' ? 'image/png,.png' : 'image/*'}
                    onChange={handleSelectedFieldImageUpload}
                  />
                  <small>
                    {selectedField.key === 'signatureImage'
                      ? selectedLayout.imageUrl
                        ? selectedLayout.content || 'PNG TTD sudah dipilih.'
                        : 'Gunakan PNG transparan agar menyatu dengan background sertifikat.'
                      : selectedLayout.imageUrl
                        ? selectedLayout.content || 'Gambar sudah dipilih.'
                        : 'PNG/JPG untuk logo atau elemen gambar.'}
                  </small>
                </label>
              ) : null}
              <label>
                <span>X (%)</span>
                <input type="number" min="0" max="100" step="0.1" value={selectedLayout.x} onChange={(event) => updateSelectedLayout({ x: Number(event.target.value) })} />
              </label>
              <label>
                <span>Y (%)</span>
                <input type="number" min="0" max="100" step="0.1" value={selectedLayout.y} onChange={(event) => updateSelectedLayout({ y: Number(event.target.value) })} />
              </label>
              <label>
                <span>Lebar (%)</span>
                <input type="number" min="4" max="100" step="0.5" value={selectedLayout.width} onChange={(event) => updateSelectedLayout({ width: Number(event.target.value) })} />
              </label>
              {['brandLogo', 'signatureImage', 'verificationUrl'].includes(selectedField.key) ? (
                <label>
                  <span>Tinggi (%)</span>
                  <input type="number" min="2" max="100" step="0.5" value={selectedLayout.height || 6} onChange={(event) => updateSelectedLayout({ height: Number(event.target.value) })} />
                </label>
              ) : null}
              <label>
                <span>Font</span>
                <input type="number" min="6" max="64" step="1" value={selectedLayout.fontSize} onChange={(event) => updateSelectedLayout({ fontSize: Number(event.target.value) })} />
              </label>
              <label>
                <span>Alignment</span>
                <select value={selectedLayout.align} onChange={(event) => updateSelectedLayout({ align: event.target.value })}>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
              <label className="admin-certificates-template-toggle">
                <input type="checkbox" checked={selectedLayout.visible} onChange={(event) => updateSelectedLayout({ visible: event.target.checked })} />
                <span>Tampilkan field</span>
              </label>
            </div>
          </aside>

          <div className="admin-certificates-template-stage-wrap">
            <div className="admin-certificates-template-stage" ref={previewRef}>
              {backgroundUrl ? (
                <img src={backgroundUrl} alt="" />
              ) : (
                <div className="admin-certificates-template-placeholder">
                  Upload background sertifikat
                </div>
              )}
              {customTemplateFields.map((field) => {
                const fieldLayout = layout[field.key];

                if (!fieldLayout.visible) {
                  return null;
                }

                if (fieldLayout.imageUrl) {
                  return (
                    <img
                      className={`admin-certificates-template-field-image${selectedFieldKey === field.key ? ' is-active' : ''}`}
                      src={fieldLayout.imageUrl}
                      alt=""
                      key={field.key}
                      style={{
                        left: `${fieldLayout.x}%`,
                        top: `${fieldLayout.y}%`,
                        width: `${fieldLayout.width}%`,
                        height: `${fieldLayout.height || 6}%`,
                      }}
                      onPointerDown={(event) => handleFieldPointerDown(field.key, event)}
                    />
                  );
                }

                return (
                  <button
                    type="button"
                    className={`admin-certificates-template-field${selectedFieldKey === field.key ? ' is-active' : ''} is-${field.type}`}
                    key={field.key}
                    style={{
                      left: `${fieldLayout.x}%`,
                      top: `${fieldLayout.y}%`,
                      width: `${fieldLayout.width}%`,
                      fontSize: `${fieldLayout.fontSize}px`,
                      textAlign: fieldLayout.align,
                    }}
                    onPointerDown={(event) => handleFieldPointerDown(field.key, event)}
                  >
                    {fieldLayout.content || field.sample}
                  </button>
                );
              })}
            </div>
            <pre className="admin-certificates-template-json">{layoutJson}</pre>
          </div>
        </div>

        <div className="admin-certificates-modal-actions">
          <button type="button" onClick={onClose}>Tutup</button>
          <button type="button" onClick={() => setLayout(initialCustomTemplateLayout)}>Reset Layout</button>
          <button type="button" onClick={saveCurrentTemplate}>Simpan Layout</button>
          <button type="button" className="admin-certificates-primary" onClick={copyLayoutJson}>Copy JSON Layout</button>
        </div>
      </section>
    </div>
  );
}

export function AdminCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [savedCustomTemplates, setSavedCustomTemplates] = useState(loadCustomCertificateTemplates);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialCertificateForm);
  const [isFormOpen, setFormOpen] = useState(false);
  const [isTemplateBuilderOpen, setTemplateBuilderOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [selectedWorkshopMembers, setSelectedWorkshopMembers] = useState(null);
  const [sendingCertificateIds, setSendingCertificateIds] = useState(() => new Set());
  const [sendingWorkshopId, setSendingWorkshopId] = useState('');

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

      if (filters.status && getWorkshopStatus(row) !== filters.status) {
        return false;
      }

      return true;
    });
  }, [filters, query, workshopCertificateRows]);

  const stats = useMemo(() => {
    const totalWorkshops = workshopCertificateRows.length;
    const totalMembers = workshopCertificateRows.reduce((sum, row) => sum + row.totalMembers, 0);
    const generated = workshopCertificateRows.reduce((sum, row) => sum + row.generatedCount, 0);
    const missing = workshopCertificateRows.reduce((sum, row) => sum + row.missingCount, 0);
    const sendable = workshopCertificateRows.reduce(
      (sum, row) =>
        sum +
        row.members.filter((member) => member.certificate && getCertificateFileUrl(member.certificate.file)).length,
      0,
    );

    return [
      { label: 'Total Workshop', value: totalWorkshops, note: `${totalMembers} member terdaftar`, icon: bookIcon, tone: 'blue' },
      { label: 'Sertifikat Dibuat', value: generated, note: 'Sudah masuk sistem', icon: checkIcon, tone: 'green' },
      { label: 'Belum Dibuat', value: missing, note: 'Menunggu generate', icon: clockIcon, tone: 'orange' },
      { label: 'Siap Dikirim', value: sendable, note: 'File sertifikat tersedia', icon: mailIcon, tone: 'blue' },
    ];
  }, [workshopCertificateRows]);

  const resetFilters = () => {
    setQuery('');
    setFilters({ status: '' });
  };

  const refreshCustomCertificateTemplates = () => {
    const templates = loadCustomCertificateTemplates();
    setSavedCustomTemplates(templates);

    return templates;
  };

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
    const latestCustomTemplates = loadCustomCertificateTemplates();
    const availableCustomTemplates = latestCustomTemplates.length ? latestCustomTemplates : savedCustomTemplates;
    const customTemplate = availableCustomTemplates.find(
      (template) => getCustomTemplateOptionId(template) === form.templateId,
    );
    const participantCertificateName = cleanCertificatePersonName(
      participant.participantName || participant.memberName,
      participant.participantName || participant.memberName,
    );

    const payload = {
      ...form,
      registrationId: participant.registrationId,
      certificateTargetId: participant.certificateTargetId || '',
      memberKey: participant.memberKey || '',
      memberName: cleanCertificatePersonName(participant.memberName, participantCertificateName),
      userId: participant.userId || '',
      userName: participantCertificateName,
      email: participant.participantEmail,
      workshopId: selectedWorkshop.id,
      workshopTitle: selectedWorkshop.title,
      type: normalizeCertificateType(form.type || selectedWorkshop.category),
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
      customTemplate,
      participantName: cleanCertificatePersonName(certificate.userName || payload.userName, payload.userName),
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
      ) || {
        id: form.workshopId,
        title: form.workshopTitle,
        category: form.type || 'Workshop',
      };
      const participant = participants.find(
        (item) => String(item.workshopId) === String(form.workshopId),
      );
      const workshopMemberTargets = participants
        .filter((item) => String(item.workshopId) === String(form.workshopId))
        .flatMap(expandParticipantMembers);
      const selectedTarget = workshopMemberTargets.find(
        (item) => String(item.certificateTargetId) === String(form.certificateTargetId),
      );

      if (!selectedWorkshop.id) {
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
      ) || {
        id: form.workshopId,
        title: form.workshopTitle,
        category: form.type || 'Workshop',
      };

      if (!selectedWorkshop.id) {
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
    const customTemplates = refreshCustomCertificateTemplates();

    setSelectedWorkshopMembers(null);
    setForm({
      ...initialCertificateForm,
      templateId: getDefaultCertificateTemplateId(customTemplates),
      workshopId: row?.id || '',
      workshopTitle: row?.title || initialCertificateForm.workshopTitle,
      type: normalizeCertificateType(row?.category || initialCertificateForm.type),
      certificateTitle: row?.title ? `Sertifikat ${row.title}` : initialCertificateForm.certificateTitle,
    });
    setFormOpen(true);
  };

  const openGenerateMemberCertificate = (row, member) => {
    const customTemplates = refreshCustomCertificateTemplates();

    setSelectedWorkshopMembers(null);
    setForm({
      ...initialCertificateForm,
      templateId: getDefaultCertificateTemplateId(customTemplates),
      workshopId: row?.id || '',
      workshopTitle: row?.title || initialCertificateForm.workshopTitle,
      type: normalizeCertificateType(row?.category || initialCertificateForm.type),
      certificateTitle: row?.title ? `Sertifikat ${row.title}` : initialCertificateForm.certificateTitle,
      registrationId: member?.registrationId || '',
      certificateTargetId: member?.certificateTargetId || '',
      memberKey: member?.memberKey || '',
      memberName: member?.memberName || '',
      userId: member?.userId || '',
      userName: member?.participantName || '',
      email: member?.participantEmail || '',
    });
    setFormOpen(true);
  };

  const exportCsv = () => {
    const header = ['Workshop', 'Total Member', 'Sertifikat Dibuat', 'Belum Dibuat', 'Status'];
    const rows = filteredWorkshopRows.map((row) => [
      row.title,
      row.totalMembers,
      row.generatedCount,
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
    <AdminPage pageClassName="admin-certificates-page" ariaLabel="Sertifikat admin">
      <AdminTopbar
        searchPlaceholder="Cari sertifikat"
        searchLabel="Cari sertifikat"
        searchValue={query}
        onSearchChange={setQuery}
      />

      <div className="admin-users-layout">
        <section className="admin-users-content">
          <div className="admin-users-heading">
              <div>
                <h1>Sertifikat</h1>
                <p>Dashboard <span>/</span> Sertifikat</p>
              </div>
              <button
                type="button"
                className="admin-users-primary"
                onClick={() => {
                  refreshCustomCertificateTemplates();
                  setTemplateBuilderOpen(true);
                }}
              >
                Buat Template
              </button>
            </div>

          {error ? <small className="admin-dashboard-error">{error}</small> : null}

          <section className="admin-users-summary" aria-label="Ringkasan sertifikat">
            {stats.map((item) => (
              <article className="admin-users-stat" key={item.label}>
                <span>
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

          <section className="admin-users-filter" aria-label="Filter sertifikat">
            <div className="admin-users-filter-row">
              <label className="admin-users-search">
                <input
                  type="search"
                  placeholder="Cari workshop, member, email, atau nomor sertifikat..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      setQuery(query.trim());
                    }
                  }}
                />
              </label>
              <button type="button" onClick={() => setQuery(query.trim())}>Cari</button>
              <button type="button" onClick={resetFilters}>Reset Filter</button>
              <button type="button" onClick={loadCertificates}>Refresh</button>
            </div>
            <div className="admin-users-select-grid admin-certificates-select-grid">
              <label>
                <span>Status Workshop</span>
                <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                  <option value="">Semua Status</option>
                  <option value="Belum ada member">Belum ada member</option>
                  <option value="Belum dibuat">Belum dibuat</option>
                  <option value="Sebagian">Sebagian</option>
                  <option value="Lengkap">Lengkap</option>
                </select>
              </label>
            </div>
          </section>

          <section className="admin-users-toolbar">
            <span>{filteredWorkshopRows.length} workshop ditampilkan</span>
            <button type="button" className="admin-users-primary" onClick={exportCsv}>Export CSV</button>
          </section>

          <section className="admin-users-table-card">
            <div className="admin-users-table-header">
              <div>
                <h2>Daftar Sertifikat</h2>
                <p>{workshopCertificateRows.length} workshop terdaftar</p>
              </div>
              <span>{filteredWorkshopRows.length} ditampilkan</span>
            </div>
            <table className="admin-users-table admin-certificates-main-table">
                  <thead>
                    <tr>
                      <th>Workshop / Program</th>
                      <th>Total Member</th>
                      <th>Sertifikat Dibuat</th>
                      <th>Status Workshop</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan="5" className="admin-empty-state">Memuat data sertifikat...</td></tr>
                    ) : filteredWorkshopRows.length === 0 ? (
                      <tr><td colSpan="5" className="admin-empty-state">Belum ada workshop yang cocok dengan filter.</td></tr>
                    ) : (
                      filteredWorkshopRows.map((row) => (
                        <tr key={row.id || row.title}>
                          <td>
                            <div className="admin-certificates-workshop-title">
                              <span className="admin-certificates-avatar" />
                              <span>
                                <b>{safeText(row.title)}</b>
                                <small>{row.certificates.length} sertifikat tersimpan</small>
                              </span>
                            </div>
                          </td>
                          <td>{row.totalMembers}</td>
                          <td>{row.generatedCount} / {row.totalMembers}</td>
                          <td><CertificateBadge>{getWorkshopStatus(row)}</CertificateBadge></td>
                          <td>
                            <AdminActionDropdown
                              label={`Buka aksi sertifikat ${safeText(row.title)}`}
                              items={[
                                {
                                  label: 'Lihat Member',
                                  onSelect: () => setSelectedWorkshopMembers(row),
                                },
                                {
                                  label: 'Generate Semua',
                                  onSelect: () => openGenerateWorkshopCertificates(row),
                                },
                                {
                                  label: sendingWorkshopId === String(row.id || row.title || '') ? 'Mengirim...' : 'Kirim Email',
                                  disabled:
                                    sendingWorkshopId === String(row.id || row.title || '') ||
                                    row.members.every((member) => !member.certificate || !getCertificateFileUrl(member.certificate.file)),
                                  onSelect: () => handleSendWorkshopCertificates(row),
                                },
                              ]}
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
            </table>
            <div className="admin-users-pagination">
              <button type="button" disabled>Previous</button>
              <div>
                <button type="button" className="is-active">1</button>
              </div>
              <span>
                Page 1 of 1
                <small>Menampilkan {filteredWorkshopRows.length} dari {workshopCertificateRows.length} workshop</small>
              </span>
              <button type="button" disabled>Next</button>
            </div>
          </section>
        </section>
      </div>

        {isFormOpen ? (
          <CertificateFormModal
            form={form}
            workshops={workshops}
            participants={participants}
            customTemplates={savedCustomTemplates}
            onChange={setForm}
            onClose={() => setFormOpen(false)}
            onSubmit={handleCreateCertificate}
            onSubmitAll={handleGenerateAllCertificates}
            isSaving={isSaving}
          />
        ) : null}

        {isTemplateBuilderOpen ? (
          <CustomCertificateTemplateModal
            templates={savedCustomTemplates}
            onTemplatesChange={setSavedCustomTemplates}
            onClose={() => {
              refreshCustomCertificateTemplates();
              setTemplateBuilderOpen(false);
            }}
          />
        ) : null}

        <WorkshopMembersModal
          row={selectedWorkshopMembers}
          onClose={() => setSelectedWorkshopMembers(null)}
          onViewCertificate={(certificate) => {
            setSelectedCertificate(certificate);
          }}
          onGenerateMember={openGenerateMemberCertificate}
          onGenerateAll={openGenerateWorkshopCertificates}
          onSendCertificate={handleSendCertificateEmail}
          onSendWorkshopCertificates={handleSendWorkshopCertificates}
          sendingCertificateIds={sendingCertificateIds}
          isSendingWorkshop={sendingWorkshopId === String(selectedWorkshopMembers?.id || selectedWorkshopMembers?.title || '')}
        />

      <CertificateDetailModal certificate={selectedCertificate} onClose={() => setSelectedCertificate(null)} />
    </AdminPage>
  );
}
