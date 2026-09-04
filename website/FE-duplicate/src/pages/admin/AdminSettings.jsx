import { useMemo, useState } from 'react';
import { AdminPage, AdminTopbar } from './AdminChrome.jsx';

const STORAGE_KEY = 'arduflow_admin_settings';

const DEFAULT_SETTINGS = {
  profile: {
    name: 'Admin ArduFlow',
    email: 'admin@arduflow.com',
    username: 'arduflow_admin',
    avatar: '',
  },
  brand: {
    platformName: 'ArduFlow',
    tagline: 'Berbagi ide, Wujudkan Inovasi',
    description: 'Platform berbagi proyek Arduino dan IoT serta belajar bersama melalui workshop.',
    logo: '',
    favicon: '',
    primaryColor: '#2563EB',
  },
  contact: {
    email: 'info@arduflow.com',
    whatsapp: '0812-3456-7890',
    address: 'Jl. Inovasi No. 123, Bandung, Jawa Barat, Indonesia',
    instagram: '@arduflow',
    youtube: '@arduflow',
    tiktokLinkedin: '@arduflow',
  },
  payment: {
    instructionDefault: 'Silakan lakukan pembayaran ke rekening yang tersedia sesuai nominal yang tertera.',
    approvalMessage: 'Pembayaran berhasil! Terima kasih, pesanan Anda sedang kami proses.',
    deadlineValue: '24',
    deadlineUnit: 'Jam',
    createdMessage: 'Terima kasih! Silakan selesaikan pembayaran Anda sebelum batas waktu yang ditentukan.',
  },
  projectContent: {
    maxFileSize: '50',
    maxFileUnit: 'MB',
    allowedFormats: ['ino', 'cpp', 'h', 'zip'],
    reviewBeforePublic: false,
    defaultStatus: 'draft',
    defaultCategory: '',
  },
  workshopContent: {
    defaultCapacity: '20',
    capacityUnit: 'Orang',
    defaultMode: 'online',
    registrationTemplate: 'Silakan isi formulir pendaftaran dengan data yang lengkap dan benar.',
    confirmationTemplate: 'Pendaftaran Anda berhasil! Kami akan menghubungi Anda melalui email/WhatsApp.',
  },
  email: {
    senderName: 'ArduFlow Team',
    senderEmail: 'no-reply@arduflow.com',
    verificationTemplate: 'default',
    resetTemplate: 'default',
    notifyTransactions: true,
    notifyProjects: true,
  },
  security: {
    sessionTimeout: '60',
    sessionUnit: 'Menit',
    verifyEmail: true,
    loginAttempts: '5',
    loginAttemptUnit: 'Kali',
    passwordUpdatedAt: '',
  },
  maintenance: {
    enabled: false,
    date: '',
    time: '',
    message: 'Situs sedang dalam pemeliharaan. Mohon coba beberapa saat lagi.',
    allowAdmin: true,
  },
};

const TABS = [
  { id: 'profile', label: 'Profil', icon: 'user' },
  { id: 'brand', label: 'Brand', icon: 'brand' },
  { id: 'contact', label: 'Kontak', icon: 'phone' },
  { id: 'payment', label: 'Pembayaran', icon: 'card' },
  { id: 'content', label: 'Konten', icon: 'content' },
  { id: 'security', label: 'Keamanan', icon: 'shield' },
  { id: 'maintenance', label: 'Maintenance', icon: 'tool' },
];

const FORMAT_OPTIONS = ['ino', 'cpp', 'h', 'zip', 'pdf', 'txt'];

function mergeSettings(base, saved) {
  if (!saved || typeof saved !== 'object') {
    return base;
  }

  return Object.fromEntries(
    Object.entries(base).map(([key, value]) => [
      key,
      {
        ...value,
        ...(saved[key] && typeof saved[key] === 'object' ? saved[key] : {}),
      },
    ])
  );
}

function readSettings() {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    return mergeSettings(DEFAULT_SETTINGS, saved);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function Field({ label, children }) {
  return (
    <label className="admin-settings-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Section({ id, icon, title, children, className = '' }) {
  return (
    <section id={id} className={`admin-settings-card ${className}`}>
      <header className="admin-settings-card__head">
        <SettingIcon name={icon} />
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function SettingIcon({ name }) {
  const paths = {
    user: <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 8a7 7 0 0 0-14 0" />,
    brand: <path d="m12 3 8 5-8 5-8-5 8-5Zm-6 9 6 4 6-4M6 16l6 4 6-4" />,
    phone: <path d="M7 4h4l1 5-2 1a12 12 0 0 0 5 5l1-2 5 1v4a2 2 0 0 1-2 2A15 15 0 0 1 4 6a2 2 0 0 1 2-2Z" />,
    card: <path d="M3 6h18v12H3V6Zm0 4h18M7 15h4" />,
    content: <path d="M6 4h12v16H6V4Zm3 4h6M9 12h6M9 16h4" />,
    shield: <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />,
    tool: <path d="M14 5a5 5 0 0 0 5 5l-8 8a3 3 0 1 1-4-4l8-8Z" />,
    mail: <path d="M4 6h16v12H4V6Zm0 1 8 6 8-6" />,
    info: <path d="M12 18v-6m0-4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" />,
  };

  return (
    <svg className="admin-settings-icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name] || paths.info}
    </svg>
  );
}

export function AdminSettings() {
  const [settings, setSettings] = useState(readSettings);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [status, setStatus] = useState('');
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showHistory, setShowHistory] = useState(false);

  const loginHistory = useMemo(() => {
    const now = new Date().toLocaleString('id-ID');
    const updated = settings.security.passwordUpdatedAt;
    return [
      { label: 'Sesi admin aktif', value: now },
      updated ? { label: 'Password terakhir diperbarui', value: updated } : null,
    ].filter(Boolean);
  }, [settings.security.passwordUpdatedAt]);

  const updateField = (section, field, value) => {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
    setStatus('');
  };

  const scrollToSection = (id) => {
    setActiveTab(id);
    const target = document.getElementById(`settings-${id}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const saveSettings = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('arduflow-admin-settings-change', { detail: settings }));
    setStatus('Perubahan settings berhasil disimpan.');
  };

  const resetSettings = () => {
    const approved = window.confirm('Reset semua settings admin ke nilai default?');
    if (!approved) {
      return;
    }
    setSettings(DEFAULT_SETTINGS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setStatus('Settings berhasil dikembalikan ke default.');
  };

  const handleFile = (section, field, file, maxBytes) => {
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      setStatus('File harus berupa gambar.');
      return;
    }
    if (file.size > maxBytes) {
      setStatus(`Ukuran file maksimal ${Math.round(maxBytes / 1024 / 1024) || 1}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updateField(section, field, reader.result);
    reader.readAsDataURL(file);
  };

  const toggleFormat = (format) => {
    setSettings((current) => {
      const selected = current.projectContent.allowedFormats;
      return {
        ...current,
        projectContent: {
          ...current.projectContent,
          allowedFormats: selected.includes(format)
            ? selected.filter((item) => item !== format)
            : [...selected, format],
        },
      };
    });
  };

  const changePassword = () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setStatus('Isi password baru dan konfirmasi password.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setStatus('Password baru minimal 6 karakter.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatus('Konfirmasi password tidak sama.');
      return;
    }
    updateField('security', 'passwordUpdatedAt', new Date().toLocaleString('id-ID'));
    setPasswordForm({ newPassword: '', confirmPassword: '' });
    setStatus('Password admin berhasil diperbarui di settings lokal.');
  };

  const matchesSearch = (label) => {
    const query = search.trim().toLowerCase();
    return !query || label.toLowerCase().includes(query);
  };

  return (
    <AdminPage pageClassName="admin-settings-page" ariaLabel="Settings Admin">
      <AdminTopbar
        searchPlaceholder="Cari settings..."
        searchLabel="Cari settings admin"
        searchValue={search}
        onSearchChange={setSearch}
        adminName={settings.profile.name || 'Admin ArduFlow'}
        adminRole="Super Admin"
      >
        <button className="admin-settings-reset" type="button" onClick={resetSettings}>
          Reset
        </button>
        <button className="admin-settings-save" type="button" onClick={saveSettings}>
          Simpan Perubahan
        </button>
      </AdminTopbar>

      <div className="admin-settings-content">
        <div className="admin-settings-titlebar">
          <div>
            <h1>Settings Admin</h1>
            <p>Kelola konfigurasi aplikasi dan preferensi platform ArduFlow.</p>
          </div>
          {status ? <span className="admin-settings-status">{status}</span> : null}
        </div>

        <nav className="admin-settings-tabs" aria-label="Navigasi settings">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'is-active' : ''}
              type="button"
              onClick={() => scrollToSection(tab.id)}
            >
              <SettingIcon name={tab.icon} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="admin-settings-grid">
          {matchesSearch('Profil Admin') ? (
            <Section id="settings-profile" icon="user" title="Profil Admin">
              <div className="admin-settings-split">
                <div className="admin-settings-stack">
                  <Field label="Nama admin">
                    <input value={settings.profile.name} onChange={(event) => updateField('profile', 'name', event.target.value)} />
                  </Field>
                  <Field label="Email">
                    <input type="email" value={settings.profile.email} onChange={(event) => updateField('profile', 'email', event.target.value)} />
                  </Field>
                  <Field label="Username">
                    <input value={settings.profile.username} onChange={(event) => updateField('profile', 'username', event.target.value)} />
                  </Field>
                  <div className="admin-settings-inline">
                    <Field label="Ubah password">
                      <input type="password" value={passwordForm.newPassword} placeholder="Masukkan password baru" onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} />
                    </Field>
                    <Field label="Konfirmasi password">
                      <input type="password" value={passwordForm.confirmPassword} placeholder="Konfirmasi password baru" onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
                    </Field>
                  </div>
                  <button className="admin-settings-secondary" type="button" onClick={changePassword}>Ubah Password</button>
                </div>
                <div className="admin-settings-upload">
                  <span>Foto profil</span>
                  <div className="admin-settings-preview">
                    {settings.profile.avatar ? <img src={settings.profile.avatar} alt="Preview foto profil" /> : <SettingIcon name="user" />}
                  </div>
                  <label className="admin-settings-file">
                    Pilih Gambar
                    <input type="file" accept="image/png,image/jpeg" onChange={(event) => handleFile('profile', 'avatar', event.target.files?.[0], 2 * 1024 * 1024)} />
                  </label>
                  <small>PNG, JPG, maks. 2MB</small>
                </div>
              </div>
            </Section>
          ) : null}

          {matchesSearch('Brand Website') ? (
            <Section id="settings-brand" icon="brand" title="Brand Website">
              <div className="admin-settings-inline">
                <Field label="Nama platform">
                  <input value={settings.brand.platformName} onChange={(event) => updateField('brand', 'platformName', event.target.value)} />
                </Field>
                <Field label="Tagline">
                  <input value={settings.brand.tagline} onChange={(event) => updateField('brand', 'tagline', event.target.value)} />
                </Field>
              </div>
              <Field label="Deskripsi singkat">
                <textarea value={settings.brand.description} onChange={(event) => updateField('brand', 'description', event.target.value)} />
              </Field>
              <div className="admin-settings-inline admin-settings-inline--uploads">
                <div className="admin-settings-upload admin-settings-upload--compact">
                  <span>Logo</span>
                  <div className="admin-settings-preview">{settings.brand.logo ? <img src={settings.brand.logo} alt="Preview logo" /> : <SettingIcon name="brand" />}</div>
                  <label className="admin-settings-file">Pilih Logo<input type="file" accept="image/png,image/jpeg" onChange={(event) => handleFile('brand', 'logo', event.target.files?.[0], 2 * 1024 * 1024)} /></label>
                </div>
                <div className="admin-settings-upload admin-settings-upload--compact">
                  <span>Favicon</span>
                  <div className="admin-settings-preview">{settings.brand.favicon ? <img src={settings.brand.favicon} alt="Preview favicon" /> : <SettingIcon name="brand" />}</div>
                  <label className="admin-settings-file">Pilih Favicon<input type="file" accept="image/png,image/x-icon" onChange={(event) => handleFile('brand', 'favicon', event.target.files?.[0], 512 * 1024)} /></label>
                </div>
                <Field label="Warna utama website">
                  <div className="admin-settings-color">
                    <input type="color" value={settings.brand.primaryColor} onChange={(event) => updateField('brand', 'primaryColor', event.target.value)} />
                    <input value={settings.brand.primaryColor} onChange={(event) => updateField('brand', 'primaryColor', event.target.value)} />
                  </div>
                </Field>
              </div>
            </Section>
          ) : null}

          {matchesSearch('Kontak Sosial Media') ? (
            <Section id="settings-contact" icon="phone" title="Kontak & Sosial Media">
              <div className="admin-settings-inline">
                <Field label="Email kontak"><input type="email" value={settings.contact.email} onChange={(event) => updateField('contact', 'email', event.target.value)} /></Field>
                <Field label="Instagram"><input value={settings.contact.instagram} onChange={(event) => updateField('contact', 'instagram', event.target.value)} /></Field>
                <Field label="Nomor WhatsApp"><input value={settings.contact.whatsapp} onChange={(event) => updateField('contact', 'whatsapp', event.target.value)} /></Field>
                <Field label="YouTube"><input value={settings.contact.youtube} onChange={(event) => updateField('contact', 'youtube', event.target.value)} /></Field>
                <Field label="Alamat"><textarea value={settings.contact.address} onChange={(event) => updateField('contact', 'address', event.target.value)} /></Field>
                <Field label="TikTok / LinkedIn"><input value={settings.contact.tiktokLinkedin} onChange={(event) => updateField('contact', 'tiktokLinkedin', event.target.value)} /></Field>
              </div>
            </Section>
          ) : null}

          {matchesSearch('Pembayaran') ? (
            <Section id="settings-payment" icon="card" title="Pembayaran">
              <Field label="Instruksi pembayaran default"><textarea value={settings.payment.instructionDefault} onChange={(event) => updateField('payment', 'instructionDefault', event.target.value)} /></Field>
              <div className="admin-settings-inline admin-settings-inline--tight">
                <Field label="Batas waktu pembayaran"><input type="number" min="1" value={settings.payment.deadlineValue} onChange={(event) => updateField('payment', 'deadlineValue', event.target.value)} /></Field>
                <Field label="Satuan"><select value={settings.payment.deadlineUnit} onChange={(event) => updateField('payment', 'deadlineUnit', event.target.value)}><option>Jam</option><option>Hari</option></select></Field>
              </div>
              <Field label="Pesan setelah transaksi dibuat"><textarea value={settings.payment.createdMessage} onChange={(event) => updateField('payment', 'createdMessage', event.target.value)} /></Field>
              <Field label="Pesan setelah pembayaran disetujui"><textarea value={settings.payment.approvalMessage} onChange={(event) => updateField('payment', 'approvalMessage', event.target.value)} /></Field>
              <p className="admin-settings-note">Detail metode pembayaran tetap dikelola di halaman Transaksi.</p>
            </Section>
          ) : null}

          {matchesSearch('Konten Proyek') ? (
            <Section id="settings-content" icon="content" title="Konten - Proyek">
              <div className="admin-settings-inline admin-settings-inline--tight">
                <Field label="Maksimal ukuran file proyek"><input type="number" min="1" value={settings.projectContent.maxFileSize} onChange={(event) => updateField('projectContent', 'maxFileSize', event.target.value)} /></Field>
                <Field label="Satuan"><select value={settings.projectContent.maxFileUnit} onChange={(event) => updateField('projectContent', 'maxFileUnit', event.target.value)}><option>MB</option><option>KB</option></select></Field>
              </div>
              <div className="admin-settings-field">
                <span>Format file yang diizinkan</span>
                <div className="admin-settings-chips">
                  {FORMAT_OPTIONS.map((format) => (
                    <button key={format} className={settings.projectContent.allowedFormats.includes(format) ? 'is-selected' : ''} type="button" onClick={() => toggleFormat(format)}>
                      {format}
                    </button>
                  ))}
                </div>
              </div>
              <div className="admin-settings-inline">
                <Switch label="Perlu review admin sebelum publik" checked={settings.projectContent.reviewBeforePublic} onChange={(value) => updateField('projectContent', 'reviewBeforePublic', value)} />
                <Field label="Default status proyek baru"><select value={settings.projectContent.defaultStatus} onChange={(event) => updateField('projectContent', 'defaultStatus', event.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="review">Review</option></select></Field>
                <Field label="Default kategori proyek"><select value={settings.projectContent.defaultCategory} onChange={(event) => updateField('projectContent', 'defaultCategory', event.target.value)}><option value="">Pilih kategori default</option><option value="iot">IoT</option><option value="robotik">Robotik</option><option value="otomasi">Otomasi</option></select></Field>
              </div>
            </Section>
          ) : null}

          {matchesSearch('Konten Workshop') ? (
            <Section id="settings-workshop" icon="content" title="Konten - Workshop">
              <div className="admin-settings-inline admin-settings-inline--tight">
                <Field label="Default kapasitas peserta"><input type="number" min="1" value={settings.workshopContent.defaultCapacity} onChange={(event) => updateField('workshopContent', 'defaultCapacity', event.target.value)} /></Field>
                <Field label="Satuan"><select value={settings.workshopContent.capacityUnit} onChange={(event) => updateField('workshopContent', 'capacityUnit', event.target.value)}><option>Orang</option><option>Seat</option></select></Field>
              </div>
              <RadioGroup label="Default mode" value={settings.workshopContent.defaultMode} options={[['online', 'Online'], ['offline', 'Offline']]} onChange={(value) => updateField('workshopContent', 'defaultMode', value)} />
              <Field label="Template instruksi pendaftaran"><textarea value={settings.workshopContent.registrationTemplate} onChange={(event) => updateField('workshopContent', 'registrationTemplate', event.target.value)} /></Field>
              <Field label="Template pesan konfirmasi"><textarea value={settings.workshopContent.confirmationTemplate} onChange={(event) => updateField('workshopContent', 'confirmationTemplate', event.target.value)} /></Field>
            </Section>
          ) : null}

          {matchesSearch('Email Notifikasi') ? (
            <Section id="settings-email" icon="mail" title="Email & Notifikasi">
              <div className="admin-settings-inline">
                <Field label="Nama pengirim email"><input value={settings.email.senderName} onChange={(event) => updateField('email', 'senderName', event.target.value)} /></Field>
                <Field label="Email pengirim"><input type="email" value={settings.email.senderEmail} onChange={(event) => updateField('email', 'senderEmail', event.target.value)} /></Field>
                <Field label="Template email verifikasi"><select value={settings.email.verificationTemplate} onChange={(event) => updateField('email', 'verificationTemplate', event.target.value)}><option value="default">Default</option><option value="ringkas">Ringkas</option><option value="formal">Formal</option></select></Field>
                <Field label="Template reset password"><select value={settings.email.resetTemplate} onChange={(event) => updateField('email', 'resetTemplate', event.target.value)}><option value="default">Default</option><option value="ringkas">Ringkas</option><option value="formal">Formal</option></select></Field>
                <Switch label="Notifikasi transaksi baru" checked={settings.email.notifyTransactions} onChange={(value) => updateField('email', 'notifyTransactions', value)} />
                <Switch label="Notifikasi proyek baru" checked={settings.email.notifyProjects} onChange={(value) => updateField('email', 'notifyProjects', value)} />
              </div>
            </Section>
          ) : null}

          {matchesSearch('Keamanan') ? (
            <Section id="settings-security" icon="shield" title="Keamanan">
              <div className="admin-settings-inline admin-settings-inline--tight">
                <Field label="Session timeout admin"><input type="number" min="1" value={settings.security.sessionTimeout} onChange={(event) => updateField('security', 'sessionTimeout', event.target.value)} /></Field>
                <Field label="Satuan"><select value={settings.security.sessionUnit} onChange={(event) => updateField('security', 'sessionUnit', event.target.value)}><option>Menit</option><option>Jam</option></select></Field>
              </div>
              <Switch label="Aktifkan verifikasi email user" checked={settings.security.verifyEmail} onChange={(value) => updateField('security', 'verifyEmail', value)} />
              <div className="admin-settings-inline admin-settings-inline--tight">
                <Field label="Pesan percobaan login"><input type="number" min="1" value={settings.security.loginAttempts} onChange={(event) => updateField('security', 'loginAttempts', event.target.value)} /></Field>
                <Field label="Satuan"><input value={settings.security.loginAttemptUnit} onChange={(event) => updateField('security', 'loginAttemptUnit', event.target.value)} /></Field>
              </div>
              <button className="admin-settings-secondary" type="button" onClick={() => setShowHistory((value) => !value)}>Lihat Riwayat Login</button>
              {showHistory ? (
                <div className="admin-settings-history">
                  {loginHistory.map((item) => <p key={item.label}><strong>{item.label}</strong><span>{item.value}</span></p>)}
                </div>
              ) : null}
            </Section>
          ) : null}

          {matchesSearch('Maintenance') ? (
            <Section id="settings-maintenance" icon="tool" title="Maintenance">
              <RadioGroup label="Aktif/nonaktif maintenance mode" value={settings.maintenance.enabled ? 'active' : 'inactive'} options={[['inactive', 'Nonaktif'], ['active', 'Aktif']]} onChange={(value) => updateField('maintenance', 'enabled', value === 'active')} />
              <div className="admin-settings-inline admin-settings-inline--tight">
                <Field label="Jadwal maintenance"><input type="date" value={settings.maintenance.date} onChange={(event) => updateField('maintenance', 'date', event.target.value)} /></Field>
                <Field label="Waktu"><input type="time" value={settings.maintenance.time} onChange={(event) => updateField('maintenance', 'time', event.target.value)} /></Field>
              </div>
              <Field label="Pesan maintenance"><textarea value={settings.maintenance.message} onChange={(event) => updateField('maintenance', 'message', event.target.value)} /></Field>
              <Switch label="Allow admin tetap akses" checked={settings.maintenance.allowAdmin} onChange={(value) => updateField('maintenance', 'allowAdmin', value)} />
            </Section>
          ) : null}

          {matchesSearch('Panduan Pengaturan') ? (
            <Section id="settings-guide" icon="info" title="Panduan Pengaturan" className="admin-settings-card--guide">
              <div className="admin-settings-guide">
                <div className="admin-settings-guide__preview" aria-hidden="true"><span /><span /><span /></div>
                <div>
                  <p>Lakukan perubahan pada setiap pengaturan sesuai kebutuhan, lalu klik tombol Simpan Perubahan di pojok kanan atas untuk menyimpan semua konfigurasi.</p>
                  <p>Gunakan tab di atas untuk berpindah cepat antar kategori: Profil, Brand, Kontak, Pembayaran, Konten, Keamanan, dan Maintenance.</p>
                </div>
              </div>
            </Section>
          ) : null}
        </div>
      </div>
    </AdminPage>
  );
}

function Switch({ label, checked, onChange }) {
  return (
    <label className="admin-settings-switch">
      <span>{label}</span>
      <button className={checked ? 'is-on' : ''} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
        <i />
      </button>
      <strong>{checked ? 'Ya' : 'Tidak'}</strong>
    </label>
  );
}

function RadioGroup({ label, value, options, onChange }) {
  return (
    <div className="admin-settings-radio">
      <span>{label}</span>
      <div>
        {options.map(([optionValue, optionLabel]) => (
          <label key={optionValue}>
            <input type="radio" checked={value === optionValue} onChange={() => onChange(optionValue)} />
            {optionLabel}
          </label>
        ))}
      </div>
    </div>
  );
}
