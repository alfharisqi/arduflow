import { useEffect, useMemo, useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import { ProfileAvatar } from '../../features/profile-image-crop/ProfileAvatar.jsx';
import { DashboardUserSidebarIcon } from './userSidebarIcons.jsx';
import {
  getUserSession,
  logoutUser,
  requestPasswordReset,
  updateUserProfile,
} from '../../services/authApi.js';
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';

const SETTINGS_KEY = 'arduflow_user_settings';

const menuItems = [
  { label: 'Profil', icon: 'user', href: '/dashboard' },
  { label: 'Progres Belajar', icon: 'graduation', href: '/progress-belajar' },
  { label: 'Proyek Saya', icon: 'folder', href: '/proyek-saya' },
  { label: 'Workshop / Program', icon: 'calendar', href: '/workshop-program' },
  { label: 'Lead Saya', icon: 'lead', href: '/lead-saya' },
  { label: 'Partner Saya', icon: 'partner', href: '/partner-saya' },
  { label: 'Transaksi', icon: 'transaction', href: '/transaksi' },
  { label: 'Sertifikat', icon: 'certificate', href: '/sertifikat' },
  { label: 'IDE', icon: 'cpu', href: '/ide-saya' },
  { label: 'Settings', icon: 'settings', href: '/settings', active: true },
];

const defaultSettings = {
  preferences: {
    level: 'Pemula',
    language: 'Indonesia',
    theme: 'System',
    interests: ['IoT', 'Arduino'],
  },
  notifications: {
    workshopReminder: true,
    transactionStatus: true,
    certificateReady: true,
    testimonialRequest: true,
    emailNotification: true,
    dashboardNotification: true,
  },
  privacy: {
    publicName: true,
    publicProfileImage: false,
    publicTestimonials: true,
    publicProjects: true,
  },
};

const tabs = [
  { key: 'profile', label: 'Profil' },
  { key: 'security', label: 'Keamanan' },
  { key: 'preferences', label: 'Preferensi' },
  { key: 'notifications', label: 'Notifikasi' },
  { key: 'privacy', label: 'Privasi' },
];

function getStoredUser() {
  try {
    const raw = window.localStorage.getItem('arduflow_user');
    if (!raw || raw === 'undefined' || raw === 'null') return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function getStoredSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    return {
      preferences: { ...defaultSettings.preferences, ...(parsed.preferences || {}) },
      notifications: { ...defaultSettings.notifications, ...(parsed.notifications || {}) },
      privacy: { ...defaultSettings.privacy, ...(parsed.privacy || {}) },
    };
  } catch {
    return defaultSettings;
  }
}

function buildProfile(user) {
  return {
    name: user.name || user.fullName || '',
    nickname: user.nickname || '',
    username: user.username || '',
    email: user.email || '',
    phone: user.phone || user.whatsapp || '',
    jobType: user.jobType || user.job_type || '',
    institutionName: user.institutionName || user.institution_name || '',
    profileImage: user.profileImage || user.profile_image || user.avatar || '',
  };
}

function mergeUserProfile(user, profile) {
  return {
    ...user,
    name: profile.name,
    nickname: profile.nickname,
    username: profile.username,
    email: profile.email,
    phone: profile.phone,
    whatsapp: profile.phone,
    jobType: profile.jobType,
    job_type: profile.jobType,
    institutionName: profile.institutionName,
    institution_name: profile.institutionName,
    profileImage: profile.profileImage,
    profile_image: profile.profileImage,
  };
}

function Toggle({ checked, label, note, onChange }) {
  return (
    <article className="user-settings-toggle">
      <span>
        <strong>{label}</strong>
        {note ? <small>{note}</small> : null}
      </span>
      <button
        type="button"
        className={checked ? 'is-on' : ''}
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </article>
  );
}

export function UserSettings() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const [activeTab, setActiveTab] = useState('profile');
  const [storedUser, setStoredUser] = useState(() => getStoredUser());
  const [profile, setProfile] = useState(() => buildProfile(getStoredUser()));
  const [settings, setSettings] = useState(getStoredSettings);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const fullName = profile.name || storedUser.name || 'Nama Lengkap';
  const profileImage = profile.profileImage || storedUser.profileImage || storedUser.avatar || '';
  const completion = useMemo(() => {
    const fields = [profile.name, profile.username, profile.email, profile.phone, profile.jobType, profile.institutionName, profile.profileImage];
    const done = fields.filter(Boolean).length;
    return Math.round((done / fields.length) * 100);
  }, [profile]);

  useEffect(() => {
    const token = window.localStorage.getItem('arduflow_user_token');
    if (!token) return undefined;

    let isMounted = true;

    getUserSession(token)
      .then((payload) => {
        const user = payload?.data?.user || payload?.user;
        if (!isMounted || !user) return;

        const nextUser = mergeUserProfile(getStoredUser(), buildProfile(user));
        window.localStorage.setItem('arduflow_user', JSON.stringify(nextUser));
        setStoredUser(nextUser);
        setProfile(buildProfile(nextUser));
      })
      .catch(() => {
        // Local cached user remains usable if session refresh fails.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function handleSidebarToggle() {
    setSidebarCollapsed((current) => {
      const next = !current;
      persistSidebarCollapsed(next);
      return next;
    });
  }

  function handleLogout() {
    const token = window.localStorage.getItem('arduflow_user_token');
    if (token) {
      logoutUser(token).catch(() => {});
    }
    window.localStorage.removeItem('arduflow_user_token');
    window.localStorage.removeItem('arduflow_user');
    window.dispatchEvent(new Event('arduflow-auth-change'));
    window.location.href = '/signin';
  }

  function updateProfileField(key, value) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function updateSettingsGroup(group, key, value) {
    setSettings((current) => {
      const next = {
        ...current,
        [group]: {
          ...current[group],
          [key]: value,
        },
      };
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      setMessage('Pengaturan berhasil disimpan.');
      setError('');
      return next;
    });
  }

  function toggleInterest(interest) {
    const interests = settings.preferences.interests.includes(interest)
      ? settings.preferences.interests.filter((item) => item !== interest)
      : [...settings.preferences.interests, interest];

    updateSettingsGroup('preferences', 'interests', interests);
  }

  async function saveProfile(event) {
    event.preventDefault();
    setIsSavingProfile(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        name: profile.name,
        username: profile.username,
        nickname: profile.nickname,
        phone: profile.phone,
        job_type: profile.jobType,
        institution_name: profile.institutionName,
        profile_image: profile.profileImage,
      };
      const response = await updateUserProfile(payload);
      const responseUser = response?.data?.user || response?.user || {};
      const nextUser = mergeUserProfile(storedUser, { ...profile, ...buildProfile(responseUser) });

      window.localStorage.setItem('arduflow_user', JSON.stringify(nextUser));
      window.dispatchEvent(new Event('arduflow-auth-change'));
      setStoredUser(nextUser);
      setProfile(buildProfile(nextUser));
      setMessage('Profil berhasil diperbarui.');
    } catch (saveError) {
      setError(saveError.message || 'Gagal menyimpan profil.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function sendPasswordReset() {
    if (!profile.email) {
      setError('Email belum tersedia untuk reset password.');
      return;
    }

    setIsResettingPassword(true);
    setMessage('');
    setError('');

    try {
      await requestPasswordReset(profile.email);
      setMessage(`Link reset password dikirim ke ${profile.email}.`);
    } catch (resetError) {
      setError(resetError.message || 'Gagal mengirim link reset password.');
    } finally {
      setIsResettingPassword(false);
    }
  }

  return (
    <main className={`dashboard-user-page user-settings-page${isSidebarCollapsed ? ' dashboard-user-page--collapsed' : ''}`}>
      <aside className="dashboard-sidebar">
        <a className="dashboard-sidebar__brand" href="/"><span>Ardu</span><strong>Flow</strong></a>
        <button className="dashboard-sidebar__collapse" type="button" aria-label={isSidebarCollapsed ? 'Buka sidebar' : 'Minimize sidebar'} onClick={handleSidebarToggle}>
          <img src={arrowDownIcon} alt="" aria-hidden="true" />
        </button>

        <nav className="dashboard-sidebar__nav">
          {menuItems.map((item) => (
            <a className={`dashboard-sidebar__item${item.active ? ' dashboard-sidebar__item--active' : ''}`} href={item.href} key={item.label}>
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

        <main className="dashboard-content user-settings-content">
          <section className="user-settings-hero">
            <div>
              <span>Pengaturan Akun</span>
              <h1>Kelola profil dan preferensi Arduflow</h1>
              <p>Atur identitas akun, keamanan, notifikasi, dan privasi yang digunakan di dashboard user.</p>
            </div>
            <article>
              <ProfileAvatar className="user-settings-hero__avatar" image={profileImage} name={fullName} />
              <strong>{completion}%</strong>
              <small>Kelengkapan profil</small>
            </article>
          </section>

          {message ? <p className="user-settings-alert is-success">{message}</p> : null}
          {error ? <p className="user-settings-alert is-error">{error}</p> : null}

          <section className="user-settings-layout">
            <nav className="user-settings-tabs" aria-label="Menu pengaturan">
              {tabs.map((tab) => (
                <button type="button" className={activeTab === tab.key ? 'is-active' : ''} onClick={() => setActiveTab(tab.key)} key={tab.key}>
                  {tab.label}
                </button>
              ))}
            </nav>

            {activeTab === 'profile' ? (
              <form className="user-settings-card" onSubmit={saveProfile}>
                <div className="user-settings-card__head">
                  <h2>Profil Akun</h2>
                  <p>Data ini dipakai untuk dashboard, project, workshop, dan sertifikat.</p>
                </div>
                <div className="user-settings-form-grid">
                  <label><span>Nama Lengkap</span><input value={profile.name} onChange={(event) => updateProfileField('name', event.target.value)} /></label>
                  <label><span>Nickname</span><input value={profile.nickname} onChange={(event) => updateProfileField('nickname', event.target.value)} /></label>
                  <label><span>Username</span><input value={profile.username} onChange={(event) => updateProfileField('username', event.target.value)} /></label>
                  <label><span>Email</span><input type="email" value={profile.email} disabled /></label>
                  <label><span>No WhatsApp</span><input value={profile.phone} onChange={(event) => updateProfileField('phone', event.target.value)} /></label>
                  <label>
                    <span>Pekerjaan / Instansi</span>
                    <select value={profile.jobType} onChange={(event) => updateProfileField('jobType', event.target.value)}>
                      <option value="">Pilih pekerjaan</option>
                      <option value="Siswa">Siswa</option>
                      <option value="Mahasiswa">Mahasiswa</option>
                      <option value="Guru">Guru</option>
                      <option value="Dosen">Dosen</option>
                      <option value="Engineer">Engineer</option>
                      <option value="Umum">Umum</option>
                    </select>
                  </label>
                  <label className="is-wide"><span>Nama Pekerjaan / Instansi</span><input value={profile.institutionName} onChange={(event) => updateProfileField('institutionName', event.target.value)} /></label>
                  <label className="is-wide"><span>URL Foto Profil</span><input value={profile.profileImage} onChange={(event) => updateProfileField('profileImage', event.target.value)} /></label>
                </div>
                <div className="user-settings-actions">
                  <button type="submit" disabled={isSavingProfile}>{isSavingProfile ? 'Menyimpan...' : 'Simpan Profil'}</button>
                </div>
              </form>
            ) : null}

            {activeTab === 'security' ? (
              <section className="user-settings-card">
                <div className="user-settings-card__head">
                  <h2>Keamanan</h2>
                  <p>Kelola akses akun dan pemulihan password.</p>
                </div>
                <div className="user-settings-security">
                  <article><span>Email Login</span><strong>{profile.email || '-'}</strong></article>
                  <article><span>Status Sesi</span><strong>{window.localStorage.getItem('arduflow_user_token') ? 'Aktif' : 'Tidak aktif'}</strong></article>
                </div>
                <div className="user-settings-actions">
                  <button type="button" onClick={sendPasswordReset} disabled={isResettingPassword}>{isResettingPassword ? 'Mengirim...' : 'Kirim Link Reset Password'}</button>
                  <button type="button" className="is-secondary" onClick={handleLogout}>Logout Akun Ini</button>
                </div>
              </section>
            ) : null}

            {activeTab === 'preferences' ? (
              <section className="user-settings-card">
                <div className="user-settings-card__head">
                  <h2>Preferensi Pembelajaran</h2>
                  <p>Preferensi ini disimpan di browser untuk menyesuaikan pengalaman dashboard.</p>
                </div>
                <div className="user-settings-form-grid">
                  <label><span>Level Belajar</span><select value={settings.preferences.level} onChange={(event) => updateSettingsGroup('preferences', 'level', event.target.value)}><option>Pemula</option><option>Menengah</option><option>Lanjutan</option></select></label>
                  <label><span>Bahasa</span><select value={settings.preferences.language} onChange={(event) => updateSettingsGroup('preferences', 'language', event.target.value)}><option>Indonesia</option><option>English</option></select></label>
                  <label><span>Tampilan</span><select value={settings.preferences.theme} onChange={(event) => updateSettingsGroup('preferences', 'theme', event.target.value)}><option>System</option><option>Terang</option><option>Gelap</option></select></label>
                </div>
                <div className="user-settings-chip-list">
                  {['IoT', 'Arduino', 'Sensor', 'Aktuator', 'Project', 'Workshop', 'Visual Programming'].map((interest) => (
                    <button type="button" className={settings.preferences.interests.includes(interest) ? 'is-active' : ''} onClick={() => toggleInterest(interest)} key={interest}>
                      {interest}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {activeTab === 'notifications' ? (
              <section className="user-settings-card">
                <div className="user-settings-card__head">
                  <h2>Notifikasi</h2>
                  <p>Pilih notifikasi yang ingin ditampilkan di dashboard atau dikirim lewat email.</p>
                </div>
                <Toggle checked={settings.notifications.workshopReminder} label="Reminder workshop" note="Pengingat jadwal workshop dan program." onChange={(value) => updateSettingsGroup('notifications', 'workshopReminder', value)} />
                <Toggle checked={settings.notifications.transactionStatus} label="Status transaksi" note="Update pembayaran dan akses." onChange={(value) => updateSettingsGroup('notifications', 'transactionStatus', value)} />
                <Toggle checked={settings.notifications.certificateReady} label="Sertifikat terbit" note="Saat sertifikat siap diunduh." onChange={(value) => updateSettingsGroup('notifications', 'certificateReady', value)} />
                <Toggle checked={settings.notifications.testimonialRequest} label="Permintaan testimoni" note="Ajakan mengisi testimoni partner/workshop." onChange={(value) => updateSettingsGroup('notifications', 'testimonialRequest', value)} />
                <Toggle checked={settings.notifications.emailNotification} label="Email notification" onChange={(value) => updateSettingsGroup('notifications', 'emailNotification', value)} />
                <Toggle checked={settings.notifications.dashboardNotification} label="Dashboard notification" onChange={(value) => updateSettingsGroup('notifications', 'dashboardNotification', value)} />
              </section>
            ) : null}

            {activeTab === 'privacy' ? (
              <section className="user-settings-card">
                <div className="user-settings-card__head">
                  <h2>Privasi & Publikasi</h2>
                  <p>Atur data yang boleh tampil di area publik Arduflow.</p>
                </div>
                <Toggle checked={settings.privacy.publicName} label="Tampilkan nama publik" note="Nama dapat tampil di project atau testimoni." onChange={(value) => updateSettingsGroup('privacy', 'publicName', value)} />
                <Toggle checked={settings.privacy.publicProfileImage} label="Tampilkan foto profil" note="Foto dapat tampil di project publik." onChange={(value) => updateSettingsGroup('privacy', 'publicProfileImage', value)} />
                <Toggle checked={settings.privacy.publicTestimonials} label="Izinkan testimoni publik" note="Testimoni yang disetujui admin boleh tampil di homepage." onChange={(value) => updateSettingsGroup('privacy', 'publicTestimonials', value)} />
                <Toggle checked={settings.privacy.publicProjects} label="Izinkan project publik" note="Project publish dapat tampil di galeri komunitas." onChange={(value) => updateSettingsGroup('privacy', 'publicProjects', value)} />
              </section>
            ) : null}
          </section>
        </main>
      </section>
    </main>
  );
}

export default UserSettings;
