import { useEffect, useMemo, useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import { DashboardUserSidebarIcon } from './userSidebarIcons.jsx';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import { ProfileAvatar } from '../../features/profile-image-crop/ProfileAvatar.jsx';
import { API_BASE_URL } from '../../services/apiEndpoints.js';
import { fetchPartners, updatePartner, uploadPartnerLogo } from '../../services/partnerApi.js';
import { createTestimonial, fetchTestimonials, updateTestimonial } from '../../services/testimonialApi.js';
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';

const menuItems = [
  { label: 'Profil', icon: 'user', href: '/dashboard' },
  { label: 'Progres Belajar', icon: 'graduation', href: '/progress-belajar' },
  { label: 'Proyek Saya', icon: 'folder', href: '/proyek-saya' },
  { label: 'Workshop / Program', icon: 'calendar', href: '/workshop-program' },
  { label: 'Lead Saya', icon: 'lead', href: '/lead-saya' },
  { label: 'Partner Saya', icon: 'partner', href: '/partner-saya', active: true },
  { label: 'Transaksi', icon: 'transaction', href: '/transaksi' },
  { label: 'Sertifikat', icon: 'certificate', href: '/sertifikat' },
  { label: 'IDE', icon: 'cpu', href: '/ide-saya' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
];

function getStoredUser() {
  try {
    const raw = window.localStorage.getItem('arduflow_user');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
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

function partnerMatchesUser(partner, user) {
  const userEmail = normalizeText(user.email);
  const userName = normalizeText(user.name || user.fullName || user.full_name);
  const username = normalizeText(user.username || user.nickname);
  const partnerEmail = normalizeText(partner.email);
  const partnerPic = normalizeText(partner.picName || partner.pic_name);
  const partnerName = normalizeText(partner.name);

  if (userEmail && partnerEmail === userEmail) return true;
  if (userName && (partnerPic === userName || partnerName === userName)) return true;
  if (username && (partnerPic === username || partnerName === username)) return true;

  return false;
}

function statusTone(status) {
  const normalized = normalizeText(status);
  if (normalized === 'aktif') return 'active';
  if (normalized === 'menunggu') return 'waiting';
  if (normalized === 'archived') return 'archived';
  if (normalized === 'inactive') return 'inactive';
  return 'draft';
}

function PartnerStatus({ children }) {
  return <span className={`user-partner-status user-partner-status--${statusTone(children)}`}>{children || 'Draft'}</span>;
}

function resolveAssetUrl(value) {
  const rawUrl = String(value || '').trim();
  if (!rawUrl) return '';
  if (/^(https?:\/\/|data:|blob:)/i.test(rawUrl)) return rawUrl;

  return `${API_BASE_URL}${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`;
}

function partnerLogo(partner) {
  const logoUrl = partner?.logoUrl || partner?.logo_url || '';
  if (logoUrl) {
    return <img src={resolveAssetUrl(logoUrl)} alt="" />;
  }

  return String(partner?.name || 'P').slice(0, 1).toUpperCase();
}

function formFromPartner(partner) {
  return {
    name: partner?.name || '',
    type: partner?.type || '',
    picName: partner?.picName || '',
    picRole: partner?.picRole || '',
    email: partner?.email || '',
    whatsapp: partner?.whatsapp || '',
    city: partner?.city || '',
    province: partner?.province || '',
    website: partner?.website || '',
    socialMedia: partner?.socialMedia || '',
    logoUrl: partner?.logoUrl || '',
    programs: Array.isArray(partner?.programs) ? partner.programs.join(', ') : '',
    description: partner?.description || '',
  };
}

function payloadFromForm(form, partner) {
  return {
    ...partner,
    name: form.name,
    type: form.type,
    picName: form.picName,
    picRole: form.picRole,
    email: form.email,
    whatsapp: form.whatsapp,
    city: form.city,
    province: form.province,
    website: form.website,
    socialMedia: form.socialMedia,
    logoUrl: form.logoUrl,
    programs: form.programs.split(',').map((item) => item.trim()).filter(Boolean),
    description: form.description,
  };
}

function testimonialKey(sourceType, sourceId) {
  return `${normalizeText(sourceType)}:${String(sourceId || '').trim()}`;
}

export function UserPartnerDashboard() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const [partners, setPartners] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [editForm, setEditForm] = useState(() => formFromPartner(null));
  const [isSaving, setSaving] = useState(false);
  const [isUploadingLogo, setUploadingLogo] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialTarget, setTestimonialTarget] = useState(null);
  const [testimonialForm, setTestimonialForm] = useState({ quote: '', role: '', rating: 5, consentPublic: true });
  const [testimonialError, setTestimonialError] = useState('');
  const [isSendingTestimonial, setSendingTestimonial] = useState(false);

  const user = getStoredUser();
  const fullName = user.name || user.fullName || user.full_name || 'Nama Lengkap';
  const greetingName = user.nickname || user.username || fullName;
  const profileImage = user.profileImage || user.profile_image || user.avatar || '';
  const email = user.email || '';

  async function loadPartners() {
    setLoading(true);
    setError('');

    try {
      const data = await fetchPartners();
      const rows = Array.isArray(data.partners) ? data.partners : [];
      setPartners(rows.filter((partner) => partnerMatchesUser(partner, user)));
    } catch (loadError) {
      setPartners([]);
      setError(loadError.message || 'Data partner gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }

  async function loadTestimonials() {
    if (!email) {
      setTestimonials([]);
      return;
    }

    try {
      const data = await fetchTestimonials({ email });
      setTestimonials(Array.isArray(data.testimonials) ? data.testimonials : []);
    } catch (_error) {
      setTestimonials([]);
    }
  }

  useEffect(() => {
    loadPartners();
    loadTestimonials();
  }, [email, fullName]);

  const visiblePartners = useMemo(() => {
    if (statusFilter === 'all') return partners;
    return partners.filter((partner) => statusTone(partner.status) === statusFilter);
  }, [partners, statusFilter]);

  const stats = useMemo(() => ({
    total: partners.length,
    active: partners.filter((partner) => statusTone(partner.status) === 'active').length,
    waiting: partners.filter((partner) => statusTone(partner.status) === 'waiting').length,
    followUp: partners.filter((partner) => partner.followUpNote).length,
  }), [partners]);

  function handleLogout() {
    window.localStorage.removeItem('arduflow_user');
    window.localStorage.removeItem('arduflow_user_token');
    window.dispatchEvent(new Event('arduflow-auth-change'));
    window.location.assign('/signin');
  }

  function handleSidebarToggle() {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistSidebarCollapsed(nextValue);
      return nextValue;
    });
  }

  function openEdit(partner) {
    setSelectedPartner(null);
    setEditingPartner(partner);
    setEditForm(formFromPartner(partner));
    setFormError('');
    setSaveMessage('');
  }

  function closeEdit() {
    if (isSaving || isUploadingLogo) return;
    setEditingPartner(null);
    setFormError('');
  }

  function canSendTestimonial(partner) {
    return statusTone(partner?.status) === 'active';
  }

  function testimonialForPartner(partner) {
    const key = testimonialKey('partner', partner?.id);
    return testimonials.find((testimonial) => testimonialKey(testimonial.sourceType, testimonial.sourceId) === key) || null;
  }

  function openTestimonial(partner) {
    const existingTestimonial = testimonialForPartner(partner);
    setSelectedPartner(null);
    setTestimonialTarget({ ...partner, existingTestimonial });
    setTestimonialForm({
      quote: existingTestimonial?.quote || '',
      role: existingTestimonial?.role || partner?.picRole || partner?.type || '',
      rating: existingTestimonial?.rating || 5,
      consentPublic: existingTestimonial?.consentPublic ?? true,
    });
    setTestimonialError('');
    setSaveMessage('');
  }

  function closeTestimonial() {
    if (isSendingTestimonial) return;
    setTestimonialTarget(null);
    setTestimonialError('');
  }

  function updateTestimonialForm(field, value) {
    setTestimonialForm((current) => ({ ...current, [field]: value }));
  }

  function updateForm(field, value) {
    setEditForm((current) => ({ ...current, [field]: value }));
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    if (!editingPartner) return;

    setSaving(true);
    setFormError('');
    setSaveMessage('');

    try {
      const result = await updatePartner(editingPartner.id, payloadFromForm(editForm, editingPartner));
      const updatedPartner = result.partner || payloadFromForm(editForm, editingPartner);
      setPartners((current) => current.map((partner) => (partner.id === updatedPartner.id ? updatedPartner : partner)));
      setEditingPartner(null);
      setSelectedPartner(updatedPartner);
      setSaveMessage('Data partner berhasil diperbarui.');
    } catch (saveError) {
      setFormError(saveError.message || 'Data partner gagal disimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestimonialSubmit(event) {
    event.preventDefault();
    if (!testimonialTarget) return;

    const quote = testimonialForm.quote.trim();
    if (quote.length < 12) {
      setTestimonialError('Testimoni minimal 12 karakter.');
      return;
    }
    if (!testimonialForm.consentPublic) {
      setTestimonialError('Centang izin tampil agar testimoni bisa direview admin.');
      return;
    }

    setSendingTestimonial(true);
    setTestimonialError('');
    setSaveMessage('');

    try {
      const existingTestimonial = testimonialTarget.existingTestimonial;
      const payload = {
        sourceType: 'partner',
        sourceId: testimonialTarget.id,
        userId: user.id || user.userId || '',
        name: fullName,
        email,
        role: testimonialForm.role || testimonialTarget.picRole || testimonialTarget.type || 'Partner Arduflow',
        quote,
        rating: testimonialForm.rating,
        consentPublic: testimonialForm.consentPublic,
        status: 'Menunggu',
      };
      const result = existingTestimonial
        ? await updateTestimonial(existingTestimonial.id, payload)
        : await createTestimonial(payload);
      const savedTestimonial = result.testimonial || { ...payload, id: existingTestimonial?.id };
      setTestimonials((current) => {
        if (existingTestimonial) {
          return current.map((testimonial) => (testimonial.id === existingTestimonial.id ? savedTestimonial : testimonial));
        }
        return [savedTestimonial, ...current];
      });
      setTestimonialTarget(null);
      setSaveMessage(existingTestimonial ? 'Testimoni berhasil diperbarui dan menunggu review ulang admin.' : 'Testimoni berhasil dikirim dan menunggu review admin.');
    } catch (sendError) {
      setTestimonialError(sendError.message || 'Testimoni gagal dikirim.');
    } finally {
      setSendingTestimonial(false);
    }
  }

  async function handleLogoUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('File logo harus berupa gambar.');
      return;
    }

    setUploadingLogo(true);
    setFormError('');

    try {
      const result = await uploadPartnerLogo(file);
      const uploadedLogo = result.logo || {};
      if (!uploadedLogo.url) {
        throw new Error('URL logo tidak diterima dari server.');
      }

      setEditForm((current) => ({ ...current, logoUrl: uploadedLogo.url }));
    } catch (uploadError) {
      setFormError(uploadError.message || 'Upload logo gagal.');
    } finally {
      setUploadingLogo(false);
    }
  }

  return (
    <div className={`dashboard-user-page user-partner-page${isSidebarCollapsed ? ' dashboard-user-page--collapsed' : ''}`}>
      <aside className="dashboard-sidebar" aria-label="Dashboard sidebar">
        <a className="dashboard-sidebar__brand" href="/" aria-label="Kembali ke beranda">
          <span>ARDU</span>
          <strong>FLOW</strong>
        </a>
        <button
          className="dashboard-sidebar__collapse"
          type="button"
          aria-expanded={!isSidebarCollapsed}
          aria-label={isSidebarCollapsed ? 'Buka sidebar' : 'Minimize sidebar'}
          onClick={handleSidebarToggle}
        >
          <img src={arrowDownIcon} alt="" aria-hidden="true" />
        </button>

        <nav className="dashboard-sidebar__nav">
          {menuItems.map((item) => (
            <a
              className={`dashboard-sidebar__item${item.active ? ' dashboard-sidebar__item--active' : ''}`}
              href={item.href}
              key={item.label}
            >
              <DashboardUserSidebarIcon name={item.icon} />
              <span>{item.label}</span>
            </a>
          ))}
          <button className="dashboard-sidebar__item dashboard-sidebar__item--logout" type="button" onClick={handleLogout}>
            <img className="dashboard-sidebar__logout-icon" src={logoutIcon} alt="" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__user">
            <button className="dashboard-notification" type="button" aria-label="Notifikasi">
              <img src={bellIcon} alt="" aria-hidden="true" />
            </button>
            <ProfileAvatar className="dashboard-mini-avatar" image={profileImage} name={fullName} />
            <strong>{fullName}</strong>
          </div>
        </header>

        <main className="dashboard-content user-partner-content">
          <div className="dashboard-user-greeting">
            <h1>Partner Saya</h1>
            <span>{greetingName}</span>
          </div>

          <section className="user-partner-hero" aria-labelledby="user-partner-title">
            <div>
              <span>Dashboard Partner</span>
              <h2 id="user-partner-title">Kelola status kerja sama, profil partner, dan tindak lanjut admin</h2>
              <p>{email || 'Email user belum tersedia'}</p>
            </div>
            <button type="button" onClick={loadPartners} disabled={isLoading}>
              {isLoading ? 'Memuat...' : 'Refresh'}
            </button>
          </section>

          {saveMessage ? <p className="user-partner-alert is-success">{saveMessage}</p> : null}

          <section className="user-partner-stats" aria-label="Ringkasan partner user">
            <article><span>Total Partner</span><strong>{stats.total}</strong><small>Data yang terhubung ke akun ini</small></article>
            <article><span>Aktif</span><strong>{stats.active}</strong><small>Kerja sama sedang berjalan</small></article>
            <article><span>Menunggu</span><strong>{stats.waiting}</strong><small>Masih dalam review admin</small></article>
            <article><span>Follow-up</span><strong>{stats.followUp}</strong><small>Ada catatan admin</small></article>
          </section>

          <section className="user-partner-list" aria-labelledby="user-partner-list-title">
            <div className="user-partner-section-head">
              <div>
                <h2 id="user-partner-list-title">Daftar Partner</h2>
                <p>Partner yang cocok dengan email atau nama akun kamu.</p>
              </div>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Semua status</option>
                <option value="active">Aktif</option>
                <option value="waiting">Menunggu</option>
                <option value="draft">Draft</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {isLoading ? (
              <p className="user-partner-empty">Memuat data partner...</p>
            ) : error ? (
              <p className="user-partner-empty">{error}</p>
            ) : visiblePartners.length === 0 ? (
              <p className="user-partner-empty">Belum ada partner yang terhubung ke akun ini.</p>
            ) : (
              <div className="user-partner-grid">
                {visiblePartners.map((partner) => (
                  <article className="user-partner-card" key={partner.id}>
                    <div className="user-partner-card__head">
                      <span className="user-partner-logo" aria-hidden="true">{partnerLogo(partner)}</span>
                      <div>
                        <h3>{partner.name || 'Partner tanpa nama'}</h3>
                        <p>{partner.type || 'Partner'}</p>
                      </div>
                      <PartnerStatus>{partner.status}</PartnerStatus>
                    </div>
                    <p>{partner.description || partner.followUpNote || 'Belum ada deskripsi kerja sama.'}</p>
                    <dl>
                      <div><dt>PIC</dt><dd>{partner.picName || '-'}</dd></div>
                      <div><dt>Kontak</dt><dd>{partner.email || partner.whatsapp || '-'}</dd></div>
                      <div><dt>Lokasi</dt><dd>{[partner.city, partner.province].filter(Boolean).join(', ') || '-'}</dd></div>
                      <div><dt>Update</dt><dd>{formatDate(partner.updatedAt)}</dd></div>
                    </dl>
                    <div className="user-partner-card__actions">
                      <button type="button" onClick={() => setSelectedPartner(partner)}>Lihat Detail</button>
                      <button type="button" className="is-secondary" onClick={() => openEdit(partner)}>Edit Data</button>
                      {canSendTestimonial(partner) ? (
                        <button type="button" className="is-testimonial" onClick={() => openTestimonial(partner)}>
                          {testimonialForPartner(partner) ? 'Edit Testimoni' : 'Berikan Testimoni'}
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </section>

      {selectedPartner ? (
        <div className="user-partner-modal" role="dialog" aria-modal="true" aria-labelledby="user-partner-detail-title" onClick={() => setSelectedPartner(null)}>
          <aside className="user-partner-detail" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <span>{selectedPartner.type || 'Partner'}</span>
                <h2 id="user-partner-detail-title">{selectedPartner.name || 'Detail Partner'}</h2>
                <p>Update terakhir: {formatDate(selectedPartner.updatedAt)}</p>
              </div>
              <button type="button" aria-label="Tutup detail partner" onClick={() => setSelectedPartner(null)}>&times;</button>
            </header>

            <section className="user-partner-detail__summary">
              <article><span>Status</span><strong>{selectedPartner.status || '-'}</strong></article>
              <article><span>PIC</span><strong>{selectedPartner.picName || '-'}</strong></article>
              <article><span>Email</span><strong>{selectedPartner.email || '-'}</strong></article>
              <article><span>WhatsApp</span><strong>{selectedPartner.whatsapp || '-'}</strong></article>
            </section>

            <section className="user-partner-detail__section">
              <h3>Deskripsi Kerja Sama</h3>
              <p>{selectedPartner.description || 'Belum ada deskripsi kerja sama.'}</p>
            </section>

            <section className="user-partner-detail__section">
              <h3>Program Terkait</h3>
              <div className="user-partner-programs">
                {(selectedPartner.programs?.length ? selectedPartner.programs : ['Belum ada program']).map((program) => (
                  <span key={program}>{program}</span>
                ))}
              </div>
            </section>

            <section className="user-partner-detail__section">
              <h3>Catatan Admin</h3>
              <p>{selectedPartner.followUpNote || 'Belum ada catatan follow-up dari admin.'}</p>
            </section>

            <div className="user-partner-detail__actions">
              {canSendTestimonial(selectedPartner) ? (
                <button type="button" className="is-testimonial" onClick={() => openTestimonial(selectedPartner)}>
                  {testimonialForPartner(selectedPartner) ? 'Edit Testimoni' : 'Berikan Testimoni'}
                </button>
              ) : null}
              <button type="button" onClick={() => openEdit(selectedPartner)}>Edit Data Partner</button>
            </div>
          </aside>
        </div>
      ) : null}

      {testimonialTarget ? (
        <div className="user-partner-modal" role="dialog" aria-modal="true" aria-labelledby="user-partner-testimonial-title" onClick={closeTestimonial}>
          <aside className="user-partner-detail user-partner-testimonial" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <span>{testimonialTarget.existingTestimonial ? 'Edit Testimoni Partner' : 'Testimoni Partner'}</span>
                <h2 id="user-partner-testimonial-title">{testimonialTarget.name || 'Partner Arduflow'}</h2>
                <p>{testimonialTarget.existingTestimonial ? 'Perubahan testimoni harus disetujui ulang oleh admin.' : 'Testimoni akan tampil di halaman publik setelah disetujui admin.'}</p>
              </div>
              <button type="button" aria-label="Tutup form testimoni partner" onClick={closeTestimonial}>&times;</button>
            </header>

            {testimonialError ? <p className="user-partner-alert is-error">{testimonialError}</p> : null}

            <form className="user-partner-testimonial-form" onSubmit={handleTestimonialSubmit}>
              <label>
                <span>Peran / Instansi</span>
                <input
                  value={testimonialForm.role}
                  onChange={(event) => updateTestimonialForm('role', event.target.value)}
                  placeholder="Guru, mentor, komunitas, institusi"
                />
              </label>
              <label>
                <span>Rating</span>
                <select
                  value={testimonialForm.rating}
                  onChange={(event) => updateTestimonialForm('rating', Number(event.target.value))}
                >
                  <option value="5">5 - Sangat puas</option>
                  <option value="4">4 - Puas</option>
                  <option value="3">3 - Cukup</option>
                  <option value="2">2 - Perlu perbaikan</option>
                  <option value="1">1 - Kurang puas</option>
                </select>
              </label>
              <label className="user-partner-testimonial-form__wide">
                <span>Isi Testimoni</span>
                <textarea
                  value={testimonialForm.quote}
                  onChange={(event) => updateTestimonialForm('quote', event.target.value)}
                  rows="5"
                  placeholder="Ceritakan pengalaman kerja sama atau penggunaan Arduflow"
                  required
                />
              </label>
              <label className="user-partner-consent">
                <input
                  type="checkbox"
                  checked={testimonialForm.consentPublic}
                  onChange={(event) => updateTestimonialForm('consentPublic', event.target.checked)}
                />
                <span>Saya mengizinkan testimoni ini tampil di halaman publik Arduflow setelah disetujui admin.</span>
              </label>

              <div className="user-partner-edit-actions">
                <button type="button" className="is-secondary" onClick={closeTestimonial} disabled={isSendingTestimonial}>Batal</button>
                <button type="submit" disabled={isSendingTestimonial}>
                  {isSendingTestimonial ? 'Menyimpan...' : testimonialTarget.existingTestimonial ? 'Simpan Edit Testimoni' : 'Kirim Testimoni'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}

      {editingPartner ? (
        <div className="user-partner-modal" role="dialog" aria-modal="true" aria-labelledby="user-partner-edit-title" onClick={closeEdit}>
          <aside className="user-partner-detail user-partner-edit" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <span>Update Profil Partner</span>
                <h2 id="user-partner-edit-title">Lengkapi Data Partner</h2>
                <p>Perubahan akan tersimpan ke data partner admin.</p>
              </div>
              <button type="button" aria-label="Tutup form edit partner" onClick={closeEdit}>&times;</button>
            </header>

            {formError ? <p className="user-partner-alert is-error">{formError}</p> : null}

            <form className="user-partner-edit-form" onSubmit={handleEditSubmit}>
              <div className="user-partner-edit-logo">
                <span className="user-partner-logo" aria-hidden="true">{partnerLogo({ ...editingPartner, logoUrl: editForm.logoUrl, name: editForm.name })}</span>
                <div className="user-partner-logo-fields">
                  <label className="user-partner-logo-upload">
                    <span>{isUploadingLogo ? 'Mengupload logo...' : 'Upload Logo'}</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" onChange={handleLogoUpload} disabled={isUploadingLogo || isSaving} />
                  </label>
                  <label>
                    <span>Logo URL</span>
                    <input value={editForm.logoUrl} onChange={(event) => updateForm('logoUrl', event.target.value)} placeholder="Terisi otomatis setelah upload" />
                  </label>
                </div>
              </div>

              <label>
                <span>Nama Partner</span>
                <input value={editForm.name} onChange={(event) => updateForm('name', event.target.value)} required />
              </label>
              <label>
                <span>Tipe Partner</span>
                <input value={editForm.type} onChange={(event) => updateForm('type', event.target.value)} placeholder="Sekolah, Komunitas, Institusi" />
              </label>
              <label>
                <span>PIC Partner</span>
                <input value={editForm.picName} onChange={(event) => updateForm('picName', event.target.value)} />
              </label>
              <label>
                <span>Jabatan PIC</span>
                <input value={editForm.picRole} onChange={(event) => updateForm('picRole', event.target.value)} />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={editForm.email} onChange={(event) => updateForm('email', event.target.value)} />
              </label>
              <label>
                <span>WhatsApp</span>
                <input value={editForm.whatsapp} onChange={(event) => updateForm('whatsapp', event.target.value)} />
              </label>
              <label>
                <span>Kota</span>
                <input value={editForm.city} onChange={(event) => updateForm('city', event.target.value)} />
              </label>
              <label>
                <span>Provinsi</span>
                <input value={editForm.province} onChange={(event) => updateForm('province', event.target.value)} />
              </label>
              <label>
                <span>Website</span>
                <input value={editForm.website} onChange={(event) => updateForm('website', event.target.value)} placeholder="https://..." />
              </label>
              <label>
                <span>Sosial Media</span>
                <input value={editForm.socialMedia} onChange={(event) => updateForm('socialMedia', event.target.value)} placeholder="Instagram / LinkedIn / TikTok" />
              </label>
              <label className="user-partner-edit-form__wide">
                <span>Program Terkait</span>
                <input value={editForm.programs} onChange={(event) => updateForm('programs', event.target.value)} placeholder="Pisahkan dengan koma" />
              </label>
              <label className="user-partner-edit-form__wide">
                <span>Deskripsi Kerja Sama</span>
                <textarea value={editForm.description} onChange={(event) => updateForm('description', event.target.value)} rows="4" />
              </label>

              <div className="user-partner-edit-actions">
                <button type="button" className="is-secondary" onClick={closeEdit} disabled={isSaving || isUploadingLogo}>Batal</button>
                <button type="submit" disabled={isSaving || isUploadingLogo}>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

export default UserPartnerDashboard;
