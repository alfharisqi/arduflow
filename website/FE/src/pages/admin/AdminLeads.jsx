import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminPage, AdminTopbar, createSlug } from './AdminChrome.jsx';
import { apiEndpoint } from '../../services/apiEndpoints.js';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import mailIcon from '../../assets/icons/icon-mail-1.svg';
import messageIcon from '../../assets/icons/icon-message-square-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import phoneIcon from '../../assets/icons/icon-phone-1.svg';

const FORMHANDLE_ENDPOINT = apiEndpoint(
  import.meta.env.VITE_FORMHANDLE_API_URL,
  '/api/formhandle.php',
);

const PAGE_SIZE = 8;

function LeadBadge({ children }) {
  return <span className={`admin-users-badge admin-users-badge--${createSlug(children)}`}>{children}</span>;
}

function initials(name) {
  return String(name || '-')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '-';
}

function normalizeLead(item) {
  return {
    id: item?.id || `${item?.form_type || 'lead'}-${item?.numeric_id || Math.random()}`,
    name: item?.name || '-',
    email: item?.email || '-',
    whatsapp: item?.whatsapp || '-',
    topic: item?.topic || '-',
    message: item?.message || '',
    messageShort: item?.message_short || item?.message || '-',
    status: item?.status || 'Baru',
    pic: item?.pic || '-',
    source: item?.source || 'website',
    formType: item?.form_type || 'lead',
    createdAt: item?.created_at || '',
    updatedAt: item?.updated_at || '',
    createdAtLabel: item?.created_at_label || '-',
    updatedAtLabel: item?.updated_at_label || '-',
    meta: item?.meta || {},
  };
}

function countBy(items, getter) {
  return items.reduce((counts, item) => {
    const key = getter(item) || '-';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

const META_LABELS = {
  institution_name: 'Asal Institusi',
  institution_type: 'Tipe Institusi',
  workshop_id: 'ID Workshop',
  workshop_choice: 'Pilihan Workshop',
  participant_estimate: 'Jumlah Peserta',
  member_names: 'Nama Anggota',
  demo_schedule: 'Jadwal Demo',
  description: 'Deskripsi Kebutuhan',
  proposal_file_name: 'Nama Proposal',
  proposal_file_type: 'Tipe Proposal',
  proposal_file_size: 'Ukuran Proposal',
  proposal_file_url: 'Link Proposal',
};

const DETAIL_META_EXCLUDED_KEYS = new Set([
  'description',
  'proposal_file_name',
  'proposal_file_type',
  'proposal_file_size',
  'proposal_file_url',
]);

function formatFileSize(value) {
  const size = Number(value);

  if (!Number.isFinite(size) || size <= 0) {
    return '-';
  }

  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function resolveApiUrl(value) {
  const rawValue = String(value || '').trim();

  if (!rawValue) {
    return '';
  }

  try {
    return new URL(rawValue, FORMHANDLE_ENDPOINT).toString();
  } catch {
    return rawValue;
  }
}

function getProposalMeta(meta = {}) {
  const url = resolveApiUrl(meta.proposal_file_url);

  if (!url) {
    return null;
  }

  return {
    name: meta.proposal_file_name || 'Proposal kolaborasi.pdf',
    type: meta.proposal_file_type || 'application/pdf',
    size: formatFileSize(meta.proposal_file_size),
    url,
  };
}

function getLeadNumericId(lead) {
  const [, id = ''] = String(lead?.id || '').split('-');
  return id;
}

function makeMailtoUrl(lead) {
  const subject = encodeURIComponent(`Tindak lanjut ${lead.topic} - ArduFlow`);
  const body = encodeURIComponent(
    `Halo ${lead.name},\n\nTerima kasih sudah menghubungi ArduFlow.`
  );

  return `mailto:${lead.email}?subject=${subject}&body=${body}`;
}

function makeWhatsappUrl(lead) {
  const phone = String(lead.whatsapp || '').replace(/\D+/g, '');
  const normalizedPhone = phone.startsWith('0')
    ? `62${phone.slice(1)}`
    : phone;
  const message = encodeURIComponent(
    `Halo ${lead.name}, kami dari ArduFlow ingin menindaklanjuti ${lead.topic}.`
  );

  return normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${message}`
    : '';
}

function getVisiblePages(currentPage, totalPages) {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sortedPages = [...pages]
    .filter((item) => item >= 1 && item <= totalPages)
    .sort((a, b) => a - b);

  return sortedPages.flatMap((pageNumber, index) => {
    if (index > 0 && pageNumber - sortedPages[index - 1] > 1) {
      return [`gap-${sortedPages[index - 1]}-${pageNumber}`, pageNumber];
    }

    return [pageNumber];
  });
}

function csvCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function makeLeadSummary(lead) {
  const proposal = getProposalMeta(lead.meta);

  return [
    `Nama: ${lead.name}`,
    `Email: ${lead.email}`,
    `WhatsApp: ${lead.whatsapp}`,
    `Topik: ${lead.topic}`,
    `Status: ${lead.status}`,
    `Pesan: ${lead.meta?.description || lead.message || '-'}`,
    proposal ? `Proposal: ${proposal.url}` : '',
  ].filter(Boolean).join('\n');
}

function leadMetaRows(meta) {
  return Object.entries(meta || {})
    .filter(([key]) => !DETAIL_META_EXCLUDED_KEYS.has(key))
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
    .map(([key, value]) => ({
      label: META_LABELS[key] || key.replaceAll('_', ' '),
      value: String(value),
    }));
}

function isTodayIso(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function getLeadStats(leads) {
  const total = leads.length;
  const statusCounts = countBy(leads, (lead) => lead.status);
  const newCount = statusCounts.Baru || 0;
  const processedCount = statusCounts.Diproses || statusCounts['Menunggu Balasan'] || 0;
  const doneCount = statusCounts.Selesai || 0;
  const todayCount = leads.filter((lead) => isTodayIso(lead.createdAt)).length;

  return [
    { label: 'Total Lead Masuk', value: total, note: 'Semua waktu', icon: messageIcon, tone: 'blue' },
    { label: 'Lead Baru', value: newCount, note: `Hari ini ${todayCount}`, icon: clockIcon, tone: 'red' },
    { label: 'Sedang Diproses', value: processedCount, note: `${total ? ((processedCount / total) * 100).toFixed(1) : 0}% dari total`, icon: mailIcon, tone: 'orange' },
    { label: 'Selesai', value: doneCount, note: `${total ? ((doneCount / total) * 100).toFixed(1) : 0}% dari total`, icon: checkIcon, tone: 'green' },
    { label: 'Rata-rata Waktu Respons', value: '-', note: 'Belum ada histori respons', icon: clockIcon, tone: 'purple' },
  ];
}

export function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [picFilter, setPicFilter] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [checkedLeadIds, setCheckedLeadIds] = useState([]);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [openActionLeadId, setOpenActionLeadId] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 12, left: 12 });
  const actionButtonRefs = useRef(new Map());

  useEffect(() => {
    let isActive = true;

    async function loadLeads() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(FORMHANDLE_ENDPOINT, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });
        const text = await response.text();
        const result = text ? JSON.parse(text) : {};

        if (!response.ok || result.success === false) {
          throw new Error(result.message || `Gagal mengambil lead. HTTP ${response.status}`);
        }

        const rows = Array.isArray(result.data?.leads) ? result.data.leads : [];
        const nextLeads = rows.map(normalizeLead);

        if (!isActive) return;

        setLeads(nextLeads);
        setSelectedLeadId((current) => current || nextLeads[0]?.id || '');
      } catch (fetchError) {
        if (!isActive) return;
        setError(fetchError.message || 'Data lead tidak dapat diambil.');
        setLeads([]);
        setSelectedLeadId('');
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadLeads();

    return () => {
      isActive = false;
    };
  }, []);

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

  useEffect(() => {
    if (openActionLeadId === null) {
      return undefined;
    }

    function closeActions(event) {
      if (!event.target.closest?.('.admin-users-action-menu') && !event.target.closest?.('.admin-users-action-popover')) {
        setOpenActionLeadId(null);
      }
    }

    function closeWithEscape(event) {
      if (event.key === 'Escape') {
        setOpenActionLeadId(null);
      }
    }

    document.addEventListener('mousedown', closeActions);
    document.addEventListener('keydown', closeWithEscape);

    return () => {
      document.removeEventListener('mousedown', closeActions);
      document.removeEventListener('keydown', closeWithEscape);
    };
  }, [openActionLeadId]);

  useEffect(() => {
    if (openActionLeadId === null) {
      return undefined;
    }

    function updateActionMenuPosition() {
      const button = actionButtonRefs.current.get(openActionLeadId);
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
  }, [openActionLeadId]);

  const filteredLeads = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return leads.filter((lead) => {
      const searchable = [
        lead.name,
        lead.email,
        lead.whatsapp,
        lead.topic,
        lead.message,
        lead.status,
      ].join(' ').toLowerCase();

      if (query && !searchable.includes(query)) return false;
      if (statusFilter && lead.status !== statusFilter) return false;
      if (topicFilter && lead.topic !== topicFilter) return false;
      if (dateFilter && !String(lead.createdAt).startsWith(dateFilter)) return false;
      if (picFilter && lead.pic !== picFilter) return false;

      return true;
    });
  }, [dateFilter, leads, picFilter, searchTerm, statusFilter, topicFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleLeads = filteredLeads.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) || filteredLeads[0] || leads[0] || null;
  const openActionLead = leads.find((lead) => lead.id === openActionLeadId) || null;
  const stats = getLeadStats(leads);
  const statusOptions = Object.keys(countBy(leads, (lead) => lead.status));
  const topicOptions = Object.keys(countBy(leads, (lead) => lead.topic));
  const picOptions = Object.keys(countBy(leads, (lead) => lead.pic)).filter((item) => item !== '-');
  const selectedLeadMetaRows = leadMetaRows(selectedLead?.meta);
  const selectedLeadProposal = getProposalMeta(selectedLead?.meta);
  const selectedLeadDescription = String(selectedLead?.meta?.description || selectedLead?.message || '').trim();
  const selectedLeadWhatsappUrl = selectedLead ? makeWhatsappUrl(selectedLead) : '';
  const visiblePages = getVisiblePages(safePage, totalPages);
  const checkedLeadSet = new Set(checkedLeadIds);
  const checkedLeads = leads.filter((lead) => checkedLeadSet.has(lead.id));
  const allVisibleChecked = visibleLeads.length > 0 && visibleLeads.every((lead) => checkedLeadSet.has(lead.id));
  const someVisibleChecked = visibleLeads.some((lead) => checkedLeadSet.has(lead.id));
  const activityItems = leads.slice(0, 4).map((lead) => ({
    text: `Lead baru dari ${lead.name}`,
    time: lead.createdAtLabel,
    tone: lead.status === 'Baru' ? 'red' : 'green',
  }));
  const leadProblems = [
    ['WhatsApp kosong', leads.filter((lead) => !lead.whatsapp || lead.whatsapp === '-').length],
    ['Email tidak valid', leads.filter((lead) => !lead.email.includes('@')).length],
    ['Pesan kosong', leads.filter((lead) => !lead.message.trim()).length],
    ['Belum diproses', leads.filter((lead) => lead.status === 'Baru').length],
  ];
  const formTypeCounts = countBy(leads, (lead) => lead.formType);

  function resetFilters() {
    setSearchTerm('');
    setStatusFilter('');
    setTopicFilter('');
    setDateFilter('');
    setPicFilter('');
    setPage(1);
  }

  function openLeadDetail(leadId) {
    setSelectedLeadId(leadId);
    setOpenActionLeadId(null);
    setDetailOpen(true);
  }

  function toggleLeadChecked(leadId) {
    setCheckedLeadIds((currentIds) => (
      currentIds.includes(leadId)
        ? currentIds.filter((id) => id !== leadId)
        : [...currentIds, leadId]
    ));
  }

  function toggleVisibleChecked() {
    const visibleIds = visibleLeads.map((lead) => lead.id);

    setCheckedLeadIds((currentIds) => {
      const currentSet = new Set(currentIds);

      if (visibleIds.every((id) => currentSet.has(id))) {
        return currentIds.filter((id) => !visibleIds.includes(id));
      }

      visibleIds.forEach((id) => currentSet.add(id));
      return [...currentSet];
    });
  }

  async function copyLeadSummary(lead) {
    const summary = makeLeadSummary(lead);

    await navigator.clipboard?.writeText(summary);
  }

  async function copyCheckedLeads() {
    const targetLeads = checkedLeads.length > 0 ? checkedLeads : visibleLeads;
    await navigator.clipboard?.writeText(targetLeads.map(makeLeadSummary).join('\n\n---\n\n'));
  }

  function exportLeadsCsv(targetLeads = filteredLeads) {
    const rows = [
      ['Nama', 'Email', 'WhatsApp', 'Topik', 'Status', 'PIC', 'Tanggal Masuk', 'Pesan', 'Proposal'],
      ...targetLeads.map((lead) => {
        const proposal = getProposalMeta(lead.meta);

        return [
          lead.name,
          lead.email,
          lead.whatsapp,
          lead.topic,
          lead.status,
          lead.pic,
          lead.createdAtLabel,
          lead.meta?.description || lead.message || '',
          proposal?.url || '',
        ];
      }),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arduflow-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function openFirstCheckedEmail() {
    const targetLead = checkedLeads[0] || visibleLeads[0];

    if (targetLead) {
      window.location.href = makeMailtoUrl(targetLead);
    }
  }

  function openFirstCheckedWhatsapp() {
    const targetLead = checkedLeads.find((lead) => makeWhatsappUrl(lead)) || visibleLeads.find((lead) => makeWhatsappUrl(lead));
    const whatsappUrl = targetLead ? makeWhatsappUrl(targetLead) : '';

    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  }

  async function updateLeadStatus(lead, status) {
    const numericId = getLeadNumericId(lead);

    if (!numericId) {
      setError('ID lead tidak valid.');
      return false;
    }

    try {
      const response = await fetch(FORMHANDLE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          action: 'update-status',
          form_type: lead.formType,
          id: numericId,
          status,
        }),
      });
      const text = await response.text();
      const result = text ? JSON.parse(text) : {};

      if (!response.ok || result.success === false) {
        throw new Error(result.message || `Status gagal diperbarui. HTTP ${response.status}`);
      }

      const nextStatus = result.data?.status || status;
      const nextUpdatedAt = result.data?.updated_at || new Date().toISOString();
      const nextUpdatedAtLabel = result.data?.updated_at_label || lead.updatedAtLabel;

      setLeads((currentLeads) => currentLeads.map((item) => (
        item.id === lead.id
          ? {
              ...item,
              status: nextStatus,
              updatedAt: nextUpdatedAt,
              updatedAtLabel: nextUpdatedAtLabel,
            }
          : item
      )));
      setError('');
      return true;
    } catch (updateError) {
      setError(updateError.message || 'Status lead gagal diperbarui.');
      return false;
    }
  }

  async function updateCheckedLeadStatus(status) {
    const targetLeads = checkedLeads.length > 0 ? checkedLeads : visibleLeads;
    let successCount = 0;

    for (const lead of targetLeads) {
      // Sequential updates keep server errors readable and avoid SQLite write contention.
      // eslint-disable-next-line no-await-in-loop
      const didUpdate = await updateLeadStatus(lead, status);
      if (didUpdate) successCount += 1;
    }

    if (successCount > 0) {
      setCheckedLeadIds([]);
    }
  }

  return (
    <AdminPage pageClassName="admin-leads-page" ariaLabel="Lead dan kontak admin">
      <AdminTopbar searchPlaceholder="Cari lead / kontak" searchLabel="Cari lead atau kontak" />

      <div className="admin-users-layout">
        <section className="admin-users-content">
          <div className="admin-users-heading">
            <div>
              <h1>Lead / Kontak</h1>
              <p>Dashboard <span>/</span> Lead / Kontak</p>
            </div>
          </div>

          <section className="admin-users-summary" aria-label="Ringkasan lead kontak">
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

          <section className="admin-users-filter" aria-label="Filter lead kontak">
            <div className="admin-users-filter-row">
              <label className="admin-users-search">
                <input
                  type="search"
                  placeholder="Cari nama, email, atau WhatsApp..."
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      setPage(1);
                    }
                  }}
                />
              </label>
              <button type="button" onClick={() => setPage(1)}>Cari</button>
              <button type="button" onClick={resetFilters}>Reset Filter</button>
              <button type="button" onClick={() => setPage(1)}>Refresh</button>
            </div>
            <div className="admin-users-select-grid">
              <label>
                <span>Status</span>
                <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
                  <option value="">Semua Status</option>
                  {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label>
                <span>Topik</span>
                <select value={topicFilter} onChange={(event) => { setTopicFilter(event.target.value); setPage(1); }}>
                  <option value="">Semua Topik</option>
                  {topicOptions.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
                </select>
              </label>
              <label>
                <span>Tanggal Masuk</span>
                <input type="date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1); }} />
              </label>
              <label>
                <span>PIC / Penanggung Jawab</span>
                <select value={picFilter} onChange={(event) => { setPicFilter(event.target.value); setPage(1); }}>
                  <option value="">Semua PIC</option>
                  {picOptions.map((pic) => <option key={pic} value={pic}>{pic}</option>)}
                </select>
              </label>
            </div>
          </section>

          {error && <p className="admin-leads-error">{error}</p>}

          <section className="admin-users-toolbar">
            <span>{checkedLeads.length} dipilih</span>
            <button type="button" disabled={!checkedLeads.length} onClick={() => copyCheckedLeads()}>Salin Terpilih</button>
            <button type="button" className="admin-users-primary" disabled={!checkedLeads.length} onClick={() => exportLeadsCsv(checkedLeads)}>Export Terpilih</button>
            <button type="button" disabled={!checkedLeads.length} onClick={() => updateCheckedLeadStatus('Diproses')}>Tandai Diproses</button>
            <button type="button" disabled={!checkedLeads.length} onClick={() => updateCheckedLeadStatus('Selesai')}>Tandai Selesai</button>
            <button type="button" disabled={!checkedLeads.length} onClick={() => setCheckedLeadIds([])}>Batal Pilih</button>
            <button type="button" disabled={!filteredLeads.length} onClick={() => exportLeadsCsv(filteredLeads)}>Export CSV</button>
            <button type="button" disabled={!leads.length} onClick={() => setCheckedLeadIds(leads.filter((lead) => lead.status === 'Baru').map((lead) => lead.id))}>Pilih Lead Baru</button>
            <button type="button" onClick={openFirstCheckedEmail}>Email</button>
            <button type="button" onClick={openFirstCheckedWhatsapp}>WhatsApp</button>
          </section>

          <section className="admin-users-table-card admin-leads-users-table-card">
            <div className="admin-users-table-header">
              <div>
                <h2>Daftar Lead / Kontak</h2>
                <p>{filteredLeads.length} lead sesuai filter</p>
              </div>
              <span>{checkedLeads.length} dipilih</span>
            </div>
            <table className="admin-users-table admin-leads-users-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Pilih semua lead pada halaman ini"
                      aria-checked={someVisibleChecked && !allVisibleChecked ? 'mixed' : allVisibleChecked}
                      checked={allVisibleChecked}
                      onChange={toggleVisibleChecked}
                    />
                  </th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>WhatsApp</th>
                  <th>Topik</th>
                  <th>Pesan Singkat</th>
                  <th>Status</th>
                  <th>PIC</th>
                  <th>Tgl Masuk</th>
                  <th>Respons Terakhir</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="11">Mengambil data lead dari database...</td></tr>
                ) : visibleLeads.length ? (
                  visibleLeads.map((lead) => (
                    <tr className={checkedLeadSet.has(lead.id) ? 'is-selected' : ''} key={lead.id}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Pilih ${lead.name}`}
                          checked={checkedLeadSet.has(lead.id)}
                          onChange={() => toggleLeadChecked(lead.id)}
                        />
                      </td>
                      <td>
                        <button type="button" className="admin-users-name-button" onClick={() => openLeadDetail(lead.id)}>
                          <span>
                            <b>{lead.name}</b>
                            <small>{lead.email}</small>
                          </span>
                        </button>
                      </td>
                      <td>{lead.email}</td>
                      <td>{lead.whatsapp}</td>
                      <td>{lead.topic}</td>
                      <td>{lead.messageShort}</td>
                      <td><LeadBadge>{lead.status}</LeadBadge></td>
                      <td>{lead.pic}</td>
                      <td>{lead.createdAtLabel}</td>
                      <td>{lead.updatedAtLabel}</td>
                      <td>
                        <div className="admin-users-actions admin-users-action-menu">
                          <button
                            type="button"
                            className="admin-users-action-trigger"
                            ref={(node) => {
                              if (node) {
                                actionButtonRefs.current.set(lead.id, node);
                              } else {
                                actionButtonRefs.current.delete(lead.id);
                              }
                            }}
                            aria-label={`Buka aksi untuk ${lead.name}`}
                            aria-expanded={openActionLeadId === lead.id}
                            onClick={() => setOpenActionLeadId((current) => (current === lead.id ? null : lead.id))}
                          >
                            ...
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="11">Belum ada lead yang cocok dengan filter.</td></tr>
                )}
              </tbody>
            </table>
            <div className="admin-users-pagination">
                <button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                  Previous
                </button>
                <div>
                {visiblePages.map((pageItem) => (
                  typeof pageItem === 'string' ? (
                    <span className="admin-leads-pagination-gap" key={pageItem}>...</span>
                  ) : (
                    <button
                      type="button"
                      className={pageItem === safePage ? 'is-active' : ''}
                      key={pageItem}
                      onClick={() => setPage(pageItem)}
                    >
                      {pageItem}
                    </button>
                  )
                ))}
                </div>
                <span>
                  Page {safePage} of {totalPages}
                  <small>Menampilkan {visibleLeads.length ? (safePage - 1) * PAGE_SIZE + 1 : 0} - {Math.min(safePage * PAGE_SIZE, filteredLeads.length)} dari {filteredLeads.length} lead</small>
                </span>
                <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                  Next
                </button>
              </div>
          </section>

          <section className="admin-users-bottom">
            <article className="admin-users-panel">
              <h2>Aktivitas Terbaru</h2>
              <p className="admin-leads-panel-meta">{activityItems.length} aktivitas</p>
              {activityItems.map((item) => (
                <p key={`${item.text}-${item.time}`} className="admin-leads-activity-row">
                  <span className={`admin-leads-dot is-${item.tone}`} />
                  <b>{item.text}</b>
                  <time>{item.time}</time>
                </p>
              ))}
            </article>

            <article className="admin-users-panel">
              <h2>Lead Bermasalah</h2>
              <p className="admin-leads-panel-meta">Validasi data</p>
              {leadProblems.map((item) => (
                <p key={item[0]}>
                  <span>{item[0]}</span>
                  <strong>{item[1]}</strong>
                </p>
              ))}
            </article>

            <article className="admin-users-panel admin-leads-conversion">
              <h2>Jenis Lead</h2>
              <p className="admin-leads-panel-meta">Semua Data</p>
              <div className="admin-leads-donut">
                <strong>Total<br />{leads.length}<br />Lead</strong>
              </div>
              <ul>
                <li><span className="admin-leads-dot is-green" />Kontak <b>{formTypeCounts.lead || 0}</b></li>
                <li><span className="admin-leads-dot is-blue" />Partner <b>{formTypeCounts.collaboration || 0}</b></li>
                <li><span className="admin-leads-dot is-orange" />Workshop <b>{formTypeCounts.workshop || 0}</b></li>
              </ul>
            </article>
          </section>

        </section>

      </div>

      {isDetailOpen && selectedLead && (
        <div
          className="admin-users-modal admin-leads-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Detail lead ${selectedLead.name}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDetailOpen(false);
            }
          }}
        >
          <aside className="admin-users-detail admin-leads-detail admin-leads-detail--modal">
            <div className="admin-users-detail-head admin-leads-detail-head">
              <div>
                <h2>Detail Lead</h2>
                <span>{selectedLead.id}</span>
              </div>
              <button type="button" aria-label="Tutup detail" onClick={() => setDetailOpen(false)}>x</button>
            </div>

            <div className="admin-leads-detail-body">
              <section className="admin-leads-detail-hero">
                <div className="admin-users-detail-profile admin-leads-detail-profile">
                  <span className="admin-leads-detail-avatar">{initials(selectedLead.name)}</span>
                  <div>
                    <h3>{selectedLead.name}</h3>
                    <p>{selectedLead.email}</p>
                    <p>{selectedLead.whatsapp} <img src={phoneIcon} alt="" /></p>
                  </div>
                </div>

                <div className="admin-leads-detail-badges">
                  <LeadBadge>{selectedLead.topic}</LeadBadge>
                  <LeadBadge>{selectedLead.status}</LeadBadge>
                </div>
              </section>

              <section className="admin-leads-detail-grid" aria-label="Ringkasan lead">
                {[
                  ['Tanggal Masuk', selectedLead.createdAtLabel],
                  ['Update Terakhir', selectedLead.updatedAtLabel],
                  ['Sumber', selectedLead.source],
                  ['PIC', selectedLead.pic],
                  ['Jenis Form', selectedLead.formType],
                  ['ID Lead', selectedLead.id],
                ].map(([label, value]) => (
                  <article key={label}>
                    <span>{label}</span>
                    <strong>{value || '-'}</strong>
                  </article>
                ))}
              </section>

              <section className="admin-leads-detail-section">
                <div className="admin-leads-detail-section-head">
                  <h3>Kebutuhan / Pesan</h3>
                  <span>{selectedLeadDescription ? `${selectedLeadDescription.length} karakter` : 'Kosong'}</span>
                </div>
                <p className="admin-leads-detail-copy">{selectedLeadDescription || '-'}</p>
              </section>

              <div className="admin-leads-detail-columns">
                <section className="admin-leads-detail-section">
                  <div className="admin-leads-detail-section-head">
                    <h3>Detail Form</h3>
                    <span>{selectedLeadMetaRows.length} item</span>
                  </div>
                  {selectedLeadMetaRows.length > 0 ? (
                    <dl className="admin-leads-detail-meta">
                      {selectedLeadMetaRows.map((item) => (
                        <div key={item.label}>
                          <dt>{item.label}</dt>
                          <dd>{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="admin-leads-detail-empty">Tidak ada detail tambahan.</p>
                  )}
                </section>

                <section className="admin-leads-detail-section">
                  <div className="admin-leads-detail-section-head">
                    <h3>Proposal PDF</h3>
                    <span>{selectedLeadProposal ? selectedLeadProposal.size : 'Tidak ada'}</span>
                  </div>
                  {selectedLeadProposal ? (
                    <div className="admin-leads-proposal-card">
                      <div>
                        <strong>{selectedLeadProposal.name}</strong>
                        <span>{selectedLeadProposal.type} · {selectedLeadProposal.size}</span>
                      </div>
                      <a href={selectedLeadProposal.url} target="_blank" rel="noreferrer">
                        Lihat PDF
                      </a>
                    </div>
                  ) : (
                    <p className="admin-leads-detail-empty">Lead ini belum melampirkan proposal.</p>
                  )}
                </section>
              </div>

              <section className="admin-leads-note">
                <h3>Catatan Internal</h3>
                <textarea placeholder="Tambah catatan..." />
                <p>Belum ada catatan.</p>
              </section>

              <section className="admin-leads-timeline">
                <p>Lead masuk - {selectedLead.createdAtLabel}</p>
                <p>Update terakhir - {selectedLead.updatedAtLabel}</p>
              </section>
            </div>

            <div className="admin-leads-detail-actions">
              <a className="is-blue" href={makeMailtoUrl(selectedLead)}>
                Balas Email
              </a>
              {selectedLeadWhatsappUrl ? (
                <a className="is-green" href={selectedLeadWhatsappUrl} target="_blank" rel="noreferrer">
                  Hubungi WhatsApp
                </a>
              ) : (
                <button type="button" className="is-green" disabled>
                  Hubungi WhatsApp
                </button>
              )}
              {selectedLeadProposal && (
                <a href={selectedLeadProposal.url} target="_blank" rel="noreferrer">
                  Lihat Proposal
                </a>
              )}
              <button type="button" onClick={() => copyLeadSummary(selectedLead)}>Salin Detail</button>
              <button type="button" className="is-orange" onClick={() => updateLeadStatus(selectedLead, 'Selesai')}>Tandai Selesai</button>
            </div>
          </aside>
        </div>
      )}

      {openActionLead ? (
        <div
          className="admin-users-action-popover"
          role="menu"
          style={{
            top: `${actionMenuPosition.top}px`,
            left: `${actionMenuPosition.left}px`,
          }}
        >
          <button type="button" role="menuitem" onClick={() => openLeadDetail(openActionLead.id)}>Detail</button>
          <button type="button" role="menuitem" onClick={() => {
            copyLeadSummary(openActionLead);
            setOpenActionLeadId(null);
          }}>Copy</button>
          <button type="button" role="menuitem" onClick={() => { setOpenActionLeadId(null); updateLeadStatus(openActionLead, 'Diproses'); }}>Tandai Diproses</button>
          <button type="button" role="menuitem" onClick={() => { setOpenActionLeadId(null); updateLeadStatus(openActionLead, 'Selesai'); }}>Tandai Selesai</button>
          <a href={makeMailtoUrl(openActionLead)} role="menuitem" onClick={() => setOpenActionLeadId(null)}>Email</a>
          {makeWhatsappUrl(openActionLead) ? (
            <a
              href={makeWhatsappUrl(openActionLead)}
              target="_blank"
              rel="noreferrer"
              role="menuitem"
              onClick={() => setOpenActionLeadId(null)}
            >
              WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}
    </AdminPage>
  );
}
