import { useEffect, useMemo, useState } from 'react';
import { AdminPage, AdminTopbar, createSlug } from './AdminChrome.jsx';
import { apiEndpoint } from '../../services/apiEndpoints.js';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import mailIcon from '../../assets/icons/icon-mail-1.svg';
import messageIcon from '../../assets/icons/icon-message-square-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import phoneIcon from '../../assets/icons/icon-phone-1.svg';

const FORMHANDLE_ENDPOINT = apiEndpoint(
  import.meta.env.VITE_FORMHANDLE_API_URL,
  '/api/formhandle.php',
);

const PAGE_SIZE = 8;

function LeadBadge({ children }) {
  return <span className={`admin-leads-badge admin-leads-badge--${createSlug(children)}`}>{children}</span>;
}

function LeadAction({ label, children, onClick }) {
  return (
    <button className="admin-leads-action" type="button" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
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
    priority: item?.priority || 'Normal',
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
};

function leadMetaRows(meta) {
  return Object.entries(meta || {})
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
  const priorityCount = leads.filter((lead) => lead.priority === 'Tinggi').length;
  const todayCount = leads.filter((lead) => isTodayIso(lead.createdAt)).length;

  return [
    { label: 'Total Lead Masuk', value: total, note: 'Semua waktu', icon: messageIcon, tone: 'blue' },
    { label: 'Lead Baru', value: newCount, note: `Hari ini ${todayCount}`, icon: clockIcon, tone: 'red' },
    { label: 'Sedang Diproses', value: processedCount, note: `${total ? ((processedCount / total) * 100).toFixed(1) : 0}% dari total`, icon: mailIcon, tone: 'orange' },
    { label: 'Selesai', value: doneCount, note: `${total ? ((doneCount / total) * 100).toFixed(1) : 0}% dari total`, icon: checkIcon, tone: 'green' },
    { label: 'Lead Prioritas', value: priorityCount, note: 'Perlu perhatian', icon: usersIcon, tone: 'red' },
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
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [picFilter, setPicFilter] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [page, setPage] = useState(1);

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
      if (priorityFilter && lead.priority !== priorityFilter) return false;
      if (dateFilter && !String(lead.createdAt).startsWith(dateFilter)) return false;
      if (picFilter && lead.pic !== picFilter) return false;

      return true;
    });
  }, [dateFilter, leads, picFilter, priorityFilter, searchTerm, statusFilter, topicFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleLeads = filteredLeads.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) || filteredLeads[0] || leads[0] || null;
  const stats = getLeadStats(leads);
  const statusOptions = Object.keys(countBy(leads, (lead) => lead.status));
  const topicOptions = Object.keys(countBy(leads, (lead) => lead.topic));
  const priorityOptions = Object.keys(countBy(leads, (lead) => lead.priority));
  const picOptions = Object.keys(countBy(leads, (lead) => lead.pic)).filter((item) => item !== '-');
  const priorityLeads = leads.filter((lead) => lead.priority === 'Tinggi').slice(0, 4);
  const selectedLeadMetaRows = leadMetaRows(selectedLead?.meta);
  const activityItems = leads.slice(0, 4).map((lead) => ({
    text: `Lead baru dari ${lead.name}`,
    time: lead.createdAtLabel,
    tone: lead.priority === 'Tinggi' ? 'red' : 'green',
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
    setPriorityFilter('');
    setDateFilter('');
    setPicFilter('');
    setPage(1);
  }

  function openLeadDetail(leadId) {
    setSelectedLeadId(leadId);
    setDetailOpen(true);
  }

  return (
    <AdminPage pageClassName="admin-leads-page" ariaLabel="Lead dan kontak admin">
      <AdminTopbar searchPlaceholder="Cari lead / kontak" searchLabel="Cari lead atau kontak" />

      <div className="admin-leads-layout">
        <section className="admin-leads-content">
          <div className="admin-leads-heading">
            <div>
              <h1>Lead / Kontak</h1>
              <p>Dashboard <span>/</span> Lead / Kontak</p>
            </div>
          </div>

          <section className="admin-leads-stats" aria-label="Ringkasan lead kontak">
            {stats.map((item) => (
              <article className="admin-leads-stat" key={item.label}>
                <span className={`admin-leads-stat-icon is-${item.tone}`}>
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

          <section className="admin-leads-filter" aria-label="Filter lead kontak">
            <label className="admin-leads-search">
              <input
                type="search"
                placeholder="Cari nama, email, atau WhatsApp..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label>
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">Semua Status</option>
                {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label>
              <span>Topik</span>
              <select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}>
                <option value="">Semua Topik</option>
                {topicOptions.map((topic) => <option key={topic} value={topic}>{topic}</option>)}
              </select>
            </label>
            <label>
              <span>Prioritas</span>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                <option value="">Semua Prioritas</option>
                {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </label>
            <label>
              <span>Tanggal Masuk</span>
              <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
            </label>
            <label>
              <span>PIC / Penanggung Jawab</span>
              <select value={picFilter} onChange={(event) => setPicFilter(event.target.value)}>
                <option value="">Semua PIC</option>
                {picOptions.map((pic) => <option key={pic} value={pic}>{pic}</option>)}
              </select>
            </label>
            <button type="button" onClick={resetFilters}>Reset Filter</button>
          </section>

          {error && <p className="admin-leads-error">{error}</p>}

          <section className="admin-leads-table-card">
            <table className="admin-leads-table">
              <thead>
                <tr>
                  <th><input type="checkbox" aria-label="Pilih semua lead" /></th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>WhatsApp</th>
                  <th>Topik</th>
                  <th>Pesan Singkat</th>
                  <th>Prioritas</th>
                  <th>Status</th>
                  <th>PIC</th>
                  <th>Tgl Masuk</th>
                  <th>Respons Terakhir</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="12">Mengambil data lead dari database...</td></tr>
                ) : visibleLeads.length ? (
                  visibleLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td><input type="checkbox" aria-label={`Pilih ${lead.name}`} /></td>
                      <td><span className="admin-leads-avatar" />{lead.name}</td>
                      <td>{lead.email}</td>
                      <td>{lead.whatsapp}</td>
                      <td>{lead.topic}</td>
                      <td>{lead.messageShort}</td>
                      <td><LeadBadge>{lead.priority}</LeadBadge></td>
                      <td><LeadBadge>{lead.status}</LeadBadge></td>
                      <td>{lead.pic}</td>
                      <td>{lead.createdAtLabel}</td>
                      <td>{lead.updatedAtLabel}</td>
                      <td>
                        <div className="admin-leads-actions">
                          <LeadAction label={`Lihat ${lead.name}`} onClick={() => openLeadDetail(lead.id)}><img src={eyeIcon} alt="" /></LeadAction>
                          <LeadAction label={`Salin ${lead.name}`} onClick={() => navigator.clipboard?.writeText(`${lead.name}\n${lead.email}\n${lead.whatsapp}`)}>Copy</LeadAction>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="12">Belum ada lead yang cocok dengan filter.</td></tr>
                )}
              </tbody>
            </table>
            <div className="admin-leads-pagination">
              <span>Menampilkan {visibleLeads.length ? (safePage - 1) * PAGE_SIZE + 1 : 0} - {Math.min(safePage * PAGE_SIZE, filteredLeads.length)} dari {filteredLeads.length} lead</span>
              <div>
                <button type="button" disabled={safePage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>&lt;</button>
                <button type="button" className="is-active">{safePage}</button>
                <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>&gt;</button>
              </div>
            </div>
          </section>

          <section className="admin-leads-bottom">
            <article className="admin-leads-panel">
              <div className="admin-leads-panel-head">
                <h2>Lead Prioritas</h2>
                <span>{priorityLeads.length} lead</span>
              </div>
              {priorityLeads.length ? priorityLeads.map((lead) => (
                <p key={lead.id}>
                  <span className="admin-leads-priority-dot" />
                  <b>{lead.name}</b>
                  <span>{lead.topic}</span>
                  <LeadBadge>{lead.status}</LeadBadge>
                  <time>{lead.createdAtLabel}</time>
                </p>
              )) : <p>Belum ada lead prioritas.</p>}
            </article>

            <article className="admin-leads-panel">
              <div className="admin-leads-panel-head">
                <h2>Aktivitas Terbaru</h2>
                <span>{activityItems.length} aktivitas</span>
              </div>
              {activityItems.map((item) => (
                <p key={`${item.text}-${item.time}`} className="admin-leads-activity-row">
                  <span className={`admin-leads-dot is-${item.tone}`} />
                  <b>{item.text}</b>
                  <time>{item.time}</time>
                </p>
              ))}
            </article>

            <article className="admin-leads-panel admin-leads-problems">
              <div className="admin-leads-panel-head">
                <h2>Lead Bermasalah</h2>
                <span>Validasi data</span>
              </div>
              {leadProblems.map((item) => (
                <p key={item[0]}>
                  <span>{item[0]}</span>
                  <strong>{item[1]}</strong>
                </p>
              ))}
            </article>

            <article className="admin-leads-panel admin-leads-conversion">
              <div className="admin-leads-panel-head">
                <h2>Jenis Lead</h2>
                <span>Semua Data</span>
              </div>
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

          <section className="admin-leads-quick">
            <h2>Aksi Cepat</h2>
            <div>
              {['Export CSV Lead', 'Assign Lead Baru ke Admin', 'Kirim Template Balasan Workshop', 'Buat Reminder Follow-up', 'Lihat Template Pesan'].map((item) => (
                <button type="button" key={item}>{item}</button>
              ))}
            </div>
          </section>
        </section>

      </div>

      {isDetailOpen && selectedLead && (
        <div
          className="admin-leads-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Detail lead ${selectedLead.name}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDetailOpen(false);
            }
          }}
        >
          <aside className="admin-leads-detail admin-leads-detail--modal">
            <div className="admin-leads-detail-head">
              <h2>Detail Lead</h2>
              <button type="button" aria-label="Tutup detail" onClick={() => setDetailOpen(false)}>x</button>
            </div>
            <div className="admin-leads-detail-profile">
              <span className="admin-leads-detail-avatar">{initials(selectedLead.name)}</span>
              <h3>{selectedLead.name}</h3>
              <p>{selectedLead.email}</p>
              <p>{selectedLead.whatsapp} <img src={phoneIcon} alt="" /></p>
            </div>
            <dl>
              <dt>Topik</dt><dd><LeadBadge>{selectedLead.topic}</LeadBadge></dd>
              <dt>Status</dt><dd><LeadBadge>{selectedLead.status}</LeadBadge></dd>
              <dt>Prioritas</dt><dd><LeadBadge>{selectedLead.priority}</LeadBadge></dd>
              <dt>Tanggal Masuk</dt><dd>{selectedLead.createdAtLabel}</dd>
              <dt>Sumber</dt><dd>{selectedLead.source}</dd>
              <dt>PIC</dt><dd>{selectedLead.pic}</dd>
            </dl>
            <section className="admin-leads-message">
              <h3>Pesan Masuk</h3>
              <p>{selectedLead.message || '-'}</p>
            </section>
            {selectedLeadMetaRows.length > 0 && (
              <section className="admin-leads-message">
                <h3>Detail Form</h3>
                <dl>
                  {selectedLeadMetaRows.map((item) => (
                    <div key={item.label}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
            <section className="admin-leads-note">
              <h3>Catatan Internal</h3>
              <textarea placeholder="Tambah catatan..." />
              <p>Belum ada catatan.</p>
            </section>
            <section className="admin-leads-timeline">
              <p>Lead masuk - {selectedLead.createdAtLabel}</p>
              <p>Update terakhir - {selectedLead.updatedAtLabel}</p>
            </section>
            <div className="admin-leads-detail-actions">
              <button type="button" className="is-blue">Balas Email</button>
              <button type="button" className="is-green">Hubungi WhatsApp</button>
              <button type="button">Assign PIC</button>
              <button type="button" className="is-orange">Tandai Selesai</button>
            </div>
          </aside>
        </div>
      )}
    </AdminPage>
  );
}
