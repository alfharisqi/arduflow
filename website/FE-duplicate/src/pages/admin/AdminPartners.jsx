import { useEffect, useMemo, useState } from 'react';
import { AdminPage, AdminTopbar, createSlug } from './AdminChrome.jsx';
import calendarIcon from '../../assets/icons/icon-clock-1.svg';
import checkIcon from '../../assets/icons/icon-circle-check-1.svg';
import eyeIcon from '../../assets/icons/icon-eyeopen-1.svg';
import globeIcon from '../../assets/icons/icons-globe-1.svg';
import mailIcon from '../../assets/icons/icon-mail-1.svg';
import mapIcon from '../../assets/icons/icon-map-pin-1.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import { createPartner, deletePartner, fetchPartners, updatePartner } from '../../services/partnerApi.js';
import { ADMIN_REALTIME_EVENT } from './AdminRealtimeBridge.jsx';

const emptyForm = {
  name: '',
  type: 'Institusi',
  picName: '',
  picRole: '',
  email: '',
  whatsapp: '',
  city: '',
  province: '',
  website: '',
  socialMedia: '',
  description: '',
  programs: '',
  status: 'Draft',
  showHomepage: false,
  featured: false,
  followUpNote: '',
  startDate: '',
  lastContactAt: '',
};

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date);
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function percent(value, total) {
  if (!total) return '0% dari total';
  return `${((Number(value || 0) / total) * 100).toFixed(1)}% dari total`;
}

function PartnerBadge({ children }) {
  const slug = createSlug(children || 'draft');
  return <span className={`admin-partners-badge admin-partners-badge--${slug}`}>{children}</span>;
}

function PartnerLogo({ index = 0 }) {
  return <span className={`admin-partners-logo is-${index % 6}`} />;
}

function PartnerAction({ label, onClick, children, tone = '' }) {
  return (
    <button className={`admin-partners-action ${tone}`} type="button" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

function formFromPartner(partner) {
  if (!partner) return emptyForm;
  return {
    ...emptyForm,
    ...partner,
    programs: Array.isArray(partner.programs) ? partner.programs.join(', ') : '',
    startDate: partner.startDate || '',
    lastContactAt: partner.lastContactAt || '',
  };
}

function payloadFromForm(form) {
  return {
    ...form,
    programs: String(form.programs || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  };
}

function PartnerFormModal({ mode, form, setForm, onSubmit, onClose, busy }) {
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  return (
    <div className="admin-partners-modal-backdrop" role="presentation">
      <section className="admin-partners-modal" role="dialog" aria-modal="true" aria-label={mode === 'edit' ? 'Edit partner' : 'Tambah partner'}>
        <header>
          <h2>{mode === 'edit' ? 'Edit Partner' : 'Tambah Partner'}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup form">x</button>
        </header>
        <form onSubmit={onSubmit}>
          <label>Nama Partner<input value={form.name} onChange={(event) => update('name', event.target.value)} required /></label>
          <label>Tipe Partner<input value={form.type} onChange={(event) => update('type', event.target.value)} /></label>
          <label>PIC Partner<input value={form.picName} onChange={(event) => update('picName', event.target.value)} /></label>
          <label>Jabatan PIC<input value={form.picRole} onChange={(event) => update('picRole', event.target.value)} /></label>
          <label>Email<input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label>
          <label>WhatsApp<input value={form.whatsapp} onChange={(event) => update('whatsapp', event.target.value)} /></label>
          <label>Kota<input value={form.city} onChange={(event) => update('city', event.target.value)} /></label>
          <label>Provinsi<input value={form.province} onChange={(event) => update('province', event.target.value)} /></label>
          <label>Website<input value={form.website} onChange={(event) => update('website', event.target.value)} /></label>
          <label>Sosial Media<input value={form.socialMedia} onChange={(event) => update('socialMedia', event.target.value)} /></label>
          <label>Status
            <select value={form.status} onChange={(event) => update('status', event.target.value)}>
              {['Aktif', 'Menunggu', 'Draft', 'Inactive', 'Archived'].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label>Tanggal Mulai<input type="date" value={form.startDate} onChange={(event) => update('startDate', event.target.value)} /></label>
          <label>Kontak Terakhir<input type="date" value={form.lastContactAt} onChange={(event) => update('lastContactAt', event.target.value)} /></label>
          <label>Program Terkait<input value={form.programs} onChange={(event) => update('programs', event.target.value)} placeholder="Pisahkan dengan koma" /></label>
          <label className="admin-partners-modal-wide">Catatan Follow-up<input value={form.followUpNote} onChange={(event) => update('followUpNote', event.target.value)} /></label>
          <label className="admin-partners-modal-wide">Deskripsi<textarea value={form.description} onChange={(event) => update('description', event.target.value)} rows="4" /></label>
          <label className="admin-partners-check"><input type="checkbox" checked={form.showHomepage} onChange={(event) => update('showHomepage', event.target.checked)} /> Tampil di homepage</label>
          <label className="admin-partners-check"><input type="checkbox" checked={form.featured} onChange={(event) => update('featured', event.target.checked)} /> Featured</label>
          <footer>
            <button type="button" onClick={onClose}>Batal</button>
            <button type="submit" className="admin-partners-primary" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function PartnerDetailModal({ partner, busy, onClose, onEdit, onEmail, onAccept, onFollowUp, onArchive }) {
  if (!partner) return null;

  return (
    <div className="admin-partners-modal-backdrop" role="presentation">
      <aside className="admin-partners-detail admin-partners-detail-modal" role="dialog" aria-modal="true" aria-label="Detail partner">
        <div className="admin-partners-detail-head">
          <h2>Detail Partner</h2>
          <button type="button" aria-label="Tutup detail" onClick={onClose}>x</button>
        </div>
        <div className="admin-partners-detail-profile">
          <PartnerLogo index={partner.id} />
          <div>
            <h3>{partner.name}</h3>
            <PartnerBadge>{partner.status}</PartnerBadge>
            <p>{partner.type}</p>
          </div>
        </div>
        <dl>
          <dt><img src={usersIcon} alt="" />PIC Partner</dt><dd>{partner.picName || '-'}<br /><small>{partner.picRole || '-'}</small></dd>
          <dt><img src={mailIcon} alt="" />Email</dt><dd>{partner.email || '-'}</dd>
          <dt>WhatsApp</dt><dd>{partner.whatsapp || '-'}</dd>
          <dt><img src={mapIcon} alt="" />Lokasi</dt><dd>{[partner.city, partner.province].filter(Boolean).join(', ') || '-'}</dd>
          <dt><img src={globeIcon} alt="" />Website</dt><dd>{partner.website || '-'}</dd>
          <dt>Sosial Media</dt><dd>{partner.socialMedia || '-'}</dd>
        </dl>
        <section className="admin-partners-description">
          <h3>Deskripsi Kerja Sama</h3>
          <p>{partner.description || 'Belum ada deskripsi kerja sama.'}</p>
        </section>
        <section className="admin-partners-programs">
          <h3>Program Terkait</h3>
          <div>{(partner.programs?.length ? partner.programs : ['Belum ada program']).map((item) => <span key={item}>{item}</span>)}</div>
        </section>
        <section className="admin-partners-history">
          <h3>Riwayat Komunikasi</h3>
          <p><span className="admin-partners-dot is-green" />{formatDate(partner.lastContactAt)} <b>{partner.followUpNote || 'Kontak terakhir tercatat'}</b></p>
          <p><span className="admin-partners-dot is-gray" />{formatDate(partner.updatedAt)} <b>Data partner diperbarui</b></p>
        </section>
        <div className="admin-partners-detail-actions">
          <button type="button" className="is-green" disabled={busy} onClick={() => onAccept(partner)}>Terima Partner</button>
          <button type="button" className="is-orange" disabled={busy} onClick={() => onFollowUp(partner)}>Perlu Follow-up</button>
          <button type="button" className="is-purple" onClick={() => onEmail(partner)}>Kirim Email</button>
          <button type="button" className="is-blue" onClick={() => onEdit(partner)}>Edit Data</button>
          <button type="button" className="is-danger" disabled={busy} onClick={() => onArchive(partner)}>Arsipkan</button>
        </div>
      </aside>
    </div>
  );
}

export function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState({});
  const [options, setOptions] = useState({ types: [], cities: [], statuses: [] });
  const [filters, setFilters] = useState({ search: '', type: '', status: '', city: '' });
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [modalMode, setModalMode] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedPartner = useMemo(
    () => partners.find((partner) => partner.id === selectedId) || partners[0] || null,
    [partners, selectedId],
  );

  const loadPartners = async (nextFilters = filters) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPartners(nextFilters);
      const rows = Array.isArray(data.partners) ? data.partners : [];
      setPartners(rows);
      setStats(data.stats || {});
      setOptions(data.options || { types: [], cities: [], statuses: [] });
      setSelectedId((current) => (rows.some((partner) => partner.id === current) ? current : rows[0]?.id || null));
      setSelectedIds((current) => current.filter((id) => rows.some((partner) => partner.id === id)));
    } catch (loadError) {
      setError(loadError.message || 'Gagal memuat data partner.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => loadPartners(filters), 250);
    return () => window.clearTimeout(timer);
  }, [filters.search, filters.type, filters.status, filters.city]);

  useEffect(() => {
    const handleRealtime = (event) => {
      const type = String(event.detail?.payload?.type || '');
      if (type.startsWith('partner.')) {
        loadPartners(filters);
      }
    };
    window.addEventListener(ADMIN_REALTIME_EVENT, handleRealtime);
    return () => window.removeEventListener(ADMIN_REALTIME_EVENT, handleRealtime);
  }, [filters]);

  const partnerStats = [
    { label: 'Total Partner', value: stats.total || 0, note: 'Semua partner', icon: usersIcon, tone: 'blue' },
    { label: 'Partner Aktif', value: stats.active || 0, note: percent(stats.active, stats.total), icon: checkIcon, tone: 'green' },
    { label: 'Menunggu Konfirmasi', value: stats.waiting || 0, note: percent(stats.waiting, stats.total), icon: calendarIcon, tone: 'orange' },
    { label: 'Kerja Sama Selesai', value: stats.archived || 0, note: percent(stats.archived, stats.total), icon: calendarIcon, tone: 'gray' },
    { label: 'Tampil di Homepage', value: stats.homepage || 0, note: percent(stats.homepage, stats.total), icon: globeIcon, tone: 'blue' },
    { label: 'Lead Kerja Sama Baru', value: stats.newLeads || 0, note: '30 hari terakhir', icon: usersIcon, tone: 'purple' },
  ];

  const todayIso = new Date().toISOString().slice(0, 10);
  const waitingPartners = partners.filter((partner) => partner.status === 'Menunggu');
  const newPartners = partners.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const activePartners = partners.filter((partner) => partner.status === 'Aktif').slice(0, 5);
  const followUpPartners = partners.filter((partner) => partner.followUpNote).slice(0, 5);
  const homepagePartners = partners.filter((partner) => partner.showHomepage).slice(0, 5);
  const draftPartners = partners.filter((partner) => partner.status === 'Draft').slice(0, 5);
  const activities = partners.slice(0, 4).map((partner) => [
    `Partner "${partner.name}" diperbarui`,
    formatDateTime(partner.updatedAt),
    partner.status === 'Aktif' ? 'green' : partner.status === 'Menunggu' ? 'purple' : 'gray',
  ]);

  const openCreate = () => {
    setForm(emptyForm);
    setModalMode('create');
  };

  const openEdit = (partner = selectedPartner) => {
    if (!partner) return;
    setForm(formFromPartner(partner));
    setModalMode('edit');
  };

  const savePartner = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const payload = payloadFromForm(form);
      const result = modalMode === 'edit' && selectedPartner
        ? await updatePartner(selectedPartner.id, payload)
        : await createPartner(payload);
      setMessage(modalMode === 'edit' ? 'Partner berhasil diperbarui.' : 'Partner berhasil ditambahkan.');
      setModalMode('');
      await loadPartners(filters);
      if (result.partner?.id) {
        setSelectedId(result.partner.id);
      }
    } catch (saveError) {
      setError(saveError.message || 'Gagal menyimpan partner.');
    } finally {
      setBusy(false);
    }
  };

  const quickUpdate = async (partner, patch, successMessage) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await updatePartner(partner.id, { ...partner, ...patch });
      setMessage(successMessage);
      await loadPartners(filters);
      setSelectedId(partner.id);
    } catch (updateError) {
      setError(updateError.message || 'Gagal memperbarui partner.');
    } finally {
      setBusy(false);
    }
  };

  const acceptPartner = (partner) => quickUpdate(
    partner,
    {
      status: 'Aktif',
      startDate: partner.startDate || todayIso,
      lastContactAt: todayIso,
      followUpNote: '',
    },
    'Partner diterima dan status diubah menjadi Aktif.',
  );

  const markFollowUp = (partner) => quickUpdate(
    partner,
    {
      status: 'Menunggu',
      lastContactAt: todayIso,
      followUpNote: partner.followUpNote || 'Perlu follow-up dari admin.',
    },
    'Partner ditandai perlu follow-up.',
  );

  const archivePartner = (partner) => quickUpdate(
    partner,
    { status: 'Archived', showHomepage: false, featured: false },
    'Partner berhasil diarsipkan.',
  );

  const removePartner = async (partner) => {
    if (!partner || !window.confirm(`Hapus partner "${partner.name}"?`)) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await deletePartner(partner.id);
      setMessage('Partner berhasil dihapus.');
      await loadPartners(filters);
    } catch (deleteError) {
      setError(deleteError.message || 'Gagal menghapus partner.');
    } finally {
      setBusy(false);
    }
  };

  const resetFilters = () => setFilters({ search: '', type: '', status: '', city: '' });
  const selectedPartners = partners.filter((partner) => selectedIds.includes(partner.id));
  const allVisibleSelected = partners.length > 0 && partners.every((partner) => selectedIds.includes(partner.id));
  const toggleSelectAll = (checked) => {
    setSelectedIds(checked ? partners.map((partner) => partner.id) : []);
  };
  const toggleSelectPartner = (partnerId, checked) => {
    setSelectedIds((current) => (
      checked
        ? Array.from(new Set([...current, partnerId]))
        : current.filter((id) => id !== partnerId)
    ));
  };
  const runBulkUpdate = async (patch, successMessage) => {
    if (selectedPartners.length === 0) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await Promise.all(selectedPartners.map((partner) => updatePartner(partner.id, { ...partner, ...patch })));
      setMessage(successMessage);
      setSelectedIds([]);
      await loadPartners(filters);
    } catch (bulkError) {
      setError(bulkError.message || 'Aksi massal partner gagal.');
    } finally {
      setBusy(false);
    }
  };
  const runBulkDelete = async () => {
    if (selectedPartners.length === 0 || !window.confirm(`Hapus ${selectedPartners.length} partner terpilih?`)) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await Promise.all(selectedPartners.map((partner) => deletePartner(partner.id)));
      setMessage('Partner terpilih berhasil dihapus.');
      setSelectedIds([]);
      await loadPartners(filters);
    } catch (bulkError) {
      setError(bulkError.message || 'Gagal menghapus partner terpilih.');
    } finally {
      setBusy(false);
    }
  };
  const openDetail = (partner) => {
    setSelectedId(partner.id);
    setDetailOpen(true);
  };
  const emailPartner = (partner) => {
    window.location.href = `mailto:${partner.email || ''}`;
  };

  return (
    <AdminPage pageClassName="admin-partners-page" ariaLabel="Partner dan kolaborator admin">
      <AdminTopbar searchPlaceholder="Cari partner / kolaborator" searchLabel="Cari partner atau kolaborator" />

      <div className="admin-partners-layout">
        <section className="admin-partners-content">
          <div className="admin-partners-heading">
            <div>
              <h1>Partner / Kolaborator</h1>
              <p>Dashboard <span>/</span> Partner / Kolaborator</p>
            </div>
          </div>

          {error ? <p className="admin-partners-alert is-error">{error}</p> : null}
          {message ? <p className="admin-partners-alert is-success">{message}</p> : null}

          <section className="admin-partners-stats" aria-label="Ringkasan partner">
            {partnerStats.map((item) => (
              <article className="admin-partners-stat" key={item.label}>
                <span className={`admin-partners-stat-icon is-${item.tone}`}><img src={item.icon} alt="" /></span>
                <div><p>{item.label}</p><strong>{item.value}</strong><small>{item.note}</small></div>
              </article>
            ))}
          </section>

          <section className="admin-partners-filter" aria-label="Filter partner">
            <label className="admin-partners-search">
              <input type="search" placeholder="Cari nama partner / PIC..." value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} />
            </label>
            <label><span>Tipe Partner</span><select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}><option value="">Semua Tipe</option>{(options.types || []).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label><span>Status</span><select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">Semua Status</option>{(options.statuses || []).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label><span>Kota / Lokasi</span><select value={filters.city} onChange={(event) => setFilters((current) => ({ ...current, city: event.target.value }))}><option value="">Semua Kota</option>{(options.cities || []).map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label><span>PIC Internal</span><select defaultValue=""><option value="">Semua PIC</option><option value="admin">Admin</option></select></label>
            <label><span>Tanggal Mulai Kerja Sama</span><input type="text" placeholder="Dikelola dari form partner" disabled /></label>
            <button type="button" onClick={resetFilters}>Reset Filter</button>
            <button type="button" className="admin-partners-primary" onClick={openCreate}>+ Tambah Partner</button>
          </section>

          <section className="admin-partners-review" aria-labelledby="admin-partners-review-title">
            <div className="admin-partners-review-head">
              <div>
                <h2 id="admin-partners-review-title">Antrian Review Partner</h2>
                <p>Partner dari form kolaborasi cukup diputuskan dari sini.</p>
              </div>
              <button type="button" onClick={() => setFilters((current) => ({ ...current, status: 'Menunggu' }))}>
                Lihat Semua Menunggu
              </button>
            </div>

            <div className="admin-partners-review-list">
              {waitingPartners.length ? waitingPartners.slice(0, 4).map((partner) => (
                <article className="admin-partners-review-card" key={partner.id}>
                  <div>
                    <PartnerLogo index={partner.id} />
                    <div>
                      <h3>{partner.name}</h3>
                      <p>{partner.picName || '-'} · {partner.email || partner.whatsapp || '-'}</p>
                    </div>
                  </div>
                  <p>{partner.description || partner.followUpNote || 'Belum ada deskripsi.'}</p>
                  <div>
                    <button type="button" className="is-green" disabled={busy} onClick={() => acceptPartner(partner)}>Terima</button>
                    <button type="button" className="is-orange" disabled={busy} onClick={() => markFollowUp(partner)}>Follow-up</button>
                    <button type="button" onClick={() => openDetail(partner)}>Detail</button>
                    <button type="button" className="is-danger" disabled={busy} onClick={() => archivePartner(partner)}>Arsipkan</button>
                  </div>
                </article>
              )) : (
                <p className="admin-partners-review-empty">Tidak ada partner yang menunggu approval.</p>
              )}
            </div>
          </section>

          <section className="admin-partners-table-card">
            {selectedIds.length > 0 ? (
              <div className="admin-partners-bulkbar">
                <strong>{selectedIds.length} partner dipilih</strong>
                <button type="button" disabled={busy} onClick={() => runBulkUpdate({ status: 'Aktif', startDate: todayIso, followUpNote: '' }, 'Partner terpilih diterima.')}>Terima</button>
                <button type="button" disabled={busy} onClick={() => runBulkUpdate({ status: 'Menunggu', lastContactAt: todayIso, followUpNote: 'Perlu follow-up dari admin.' }, 'Partner terpilih ditandai follow-up.')}>Follow-up</button>
                <button type="button" disabled={busy} onClick={() => runBulkUpdate({ status: 'Archived', showHomepage: false, featured: false }, 'Partner terpilih diarsipkan.')}>Arsipkan</button>
                <button type="button" className="is-danger" disabled={busy} onClick={runBulkDelete}>Hapus</button>
                <button type="button" onClick={() => setSelectedIds([])}>Batal Pilih</button>
              </div>
            ) : null}
            <table className="admin-partners-table">
              <thead>
                <tr>
                  <th><input type="checkbox" aria-label="Pilih semua partner" checked={allVisibleSelected} onChange={(event) => toggleSelectAll(event.target.checked)} /></th>
                  <th>Logo</th>
                  <th>Nama Partner</th>
                  <th>Tipe Partner</th>
                  <th>PIC Partner</th>
                  <th>Kontak / Email</th>
                  <th>Kota</th>
                  <th>Status Kerja Sama</th>
                  <th>Tampil Homepage</th>
                  <th>Tgl Mulai</th>
                  <th>Update Terakhir</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {partners.length ? partners.map((partner, index) => (
                  <tr key={partner.id} className={partner.id === selectedPartner?.id ? 'is-selected' : ''}>
                    <td><input type="checkbox" aria-label={`Pilih ${partner.name}`} checked={selectedIds.includes(partner.id)} onChange={(event) => toggleSelectPartner(partner.id, event.target.checked)} /></td>
                    <td><PartnerLogo index={index} /></td>
                    <td>{partner.name}</td>
                    <td>{partner.type}</td>
                    <td><b>{partner.picName || '-'}</b><small>{partner.picRole || '-'}</small></td>
                    <td><b>{partner.email || '-'}</b><small>{partner.whatsapp || '-'}</small></td>
                    <td>{partner.city || '-'}</td>
                    <td><PartnerBadge>{partner.status}</PartnerBadge></td>
                    <td><span className={`admin-partners-homepage${partner.showHomepage ? ' is-active' : ''}`}>{partner.showHomepage ? 'check' : 'x'}</span></td>
                    <td>{formatDate(partner.startDate)}</td>
                    <td>{formatDate(partner.updatedAt)}</td>
                    <td>
                      <div className="admin-partners-actions">
                        <PartnerAction label={`Preview ${partner.name}`} onClick={() => openDetail(partner)}><img src={eyeIcon} alt="" /></PartnerAction>
                        {partner.status === 'Menunggu' ? (
                          <PartnerAction label={`Terima ${partner.name}`} tone="is-accept" onClick={() => acceptPartner(partner)}>Terima</PartnerAction>
                        ) : null}
                        <PartnerAction label={`Follow-up ${partner.name}`} onClick={() => markFollowUp(partner)}>Follow</PartnerAction>
                        <PartnerAction label={`Email ${partner.name}`} onClick={() => emailPartner(partner)}><img src={mailIcon} alt="" /></PartnerAction>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="12">{loading ? 'Memuat partner...' : 'Belum ada partner sesuai filter.'}</td></tr>
                )}
              </tbody>
            </table>
            <div className="admin-partners-pagination">
              <span>Menampilkan {partners.length ? `1 - ${partners.length}` : '0'} dari {stats.total || 0} partner</span>
              <div><button type="button">&lt;</button><button type="button" className="is-active">1</button><button type="button">&gt;</button></div>
              <select defaultValue="10"><option value="10">10 / halaman</option></select>
            </div>
          </section>

          <section className="admin-partners-panels">
            <article className="admin-partners-panel"><div className="admin-partners-panel-head"><h2>Partner Baru Masuk</h2></div>{newPartners.map((item, index) => <p key={item.id}><PartnerLogo index={index} /><b>{item.name}</b><time>{formatDate(item.createdAt)}</time></p>)}</article>
            <article className="admin-partners-panel"><div className="admin-partners-panel-head"><h2>Partner Aktif Terbaru</h2></div>{activePartners.map((item) => <p key={item.id}><span className="admin-partners-dot is-green" /><b>{item.name}</b><time>{formatDate(item.updatedAt)}</time></p>)}</article>
            <article className="admin-partners-panel admin-partners-followup"><div className="admin-partners-panel-head"><h2>Partner Perlu Follow-up</h2></div>{followUpPartners.map((item) => <p key={item.id}><span>{item.name}</span><strong>{item.followUpNote}</strong></p>)}</article>
            <article className="admin-partners-panel"><div className="admin-partners-panel-head"><h2>Partner Homepage / Featured</h2></div>{homepagePartners.map((item, index) => <p key={item.id}><PartnerLogo index={index + 1} /><b>{item.name}</b><span>{item.featured ? 'Featured' : ''}</span><time>{item.city}</time></p>)}</article>
            <article className="admin-partners-panel"><div className="admin-partners-panel-head"><h2>Draft Belum Publish</h2></div>{draftPartners.map((item, index) => <p key={item.id}><span className={`admin-partners-mini-logo is-${index}`} /><b>{item.name}</b><PartnerBadge>{item.status}</PartnerBadge></p>)}<button type="button" onClick={() => setFilters((current) => ({ ...current, status: 'Draft' }))}>Lihat semua draft</button></article>
          </section>

          <section className="admin-partners-bottom">
            <article className="admin-partners-panel admin-partners-activity"><div className="admin-partners-panel-head"><h2>Aktivitas Terbaru</h2></div>{activities.map((item) => <p key={item[0]}><span className={`admin-partners-dot is-${item[2]}`} /><b>{item[0]}</b><time>{item[1]}</time></p>)}</article>
            <section className="admin-partners-quick">
              <h2>Aksi Cepat</h2>
              <div>
                <button type="button" onClick={openCreate}>Tambah Partner Baru</button>
                <button type="button" onClick={() => loadPartners(filters)}>Refresh Data Partner</button>
                <button type="button" onClick={() => setFilters((current) => ({ ...current, status: 'Menunggu' }))}>Review Menunggu</button>
                <button type="button" onClick={() => setFilters((current) => ({ ...current, status: 'Aktif' }))}>Partner Aktif</button>
                <button type="button" onClick={() => setFilters((current) => ({ ...current, status: 'Archived' }))}>Arsip</button>
                <button type="button" onClick={resetFilters}>Tampilkan Semua</button>
              </div>
            </section>
          </section>
        </section>
      </div>

      {modalMode ? <PartnerFormModal mode={modalMode} form={form} setForm={setForm} onSubmit={savePartner} onClose={() => setModalMode('')} busy={busy} /> : null}
      {isDetailOpen ? (
        <PartnerDetailModal
          partner={selectedPartner}
          busy={busy}
          onClose={() => setDetailOpen(false)}
          onEdit={(partner) => {
            setDetailOpen(false);
            openEdit(partner);
          }}
          onEmail={emailPartner}
          onAccept={acceptPartner}
          onFollowUp={markFollowUp}
          onArchive={archivePartner}
        />
      ) : null}
    </AdminPage>
  );
}
