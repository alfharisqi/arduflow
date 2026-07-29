import { useState } from 'react';
import arrowDownIcon from '../assets/icons/icon-arrowdown-1.svg';

const menuItems = [
  { label: 'Profil', icon: 'user', active: true },
  { label: 'Progress Belajar', icon: 'graduation' },
  { label: 'Proyek Saya', icon: 'folder' },
  { label: 'Workshop / Program', icon: 'calendar' },
  { label: 'IDE', icon: 'cpu' },
  { label: 'Settings', icon: 'settings' },
];

const fieldGroups = [
  [
    { label: 'Nama Lengkap', placeholder: 'Nama Lengkap', key: 'name' },
    { label: 'Nickname', placeholder: 'Nickname', key: 'nickname' },
    { label: 'No Whastapp', placeholder: 'No Whastapp', key: 'phone' },
    { label: 'Email', placeholder: 'mail@mail.com', key: 'email', type: 'email' },
  ],
  [
    { label: 'Username', placeholder: 'Username', key: 'username' },
    { label: 'Pekerjaan / Instansi', placeholder: 'Pekerjaan / Instansi', key: 'jobType', select: true },
    { label: 'Nama Pekerjaan / Instansi', placeholder: 'Nama Pekerjaan / Instansi / Instansi', key: 'institutionName' },
  ],
];

function getStoredUser() {
  try {
    const raw = window.localStorage.getItem('arduflow_user');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getInitials(name) {
  return (name || 'Nama Lengkap')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function SidebarIcon({ name }) {
  const commonProps = {
    width: '18',
    height: '18',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  const paths = {
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    graduation: (
      <>
        <path d="M22 10 12 5 2 10l10 5 10-5Z" />
        <path d="M6 12v5c3 2 9 2 12 0v-5" />
      </>
    ),
    folder: (
      <>
        <path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        <path d="M3 7V5a2 2 0 0 1 2-2h4l2 4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M8 2v4M16 2v4M3 10h18" />
        <path d="M8 14h2v2H8zM14 14h2v2h-2z" />
      </>
    ),
    cpu: (
      <>
        <rect x="7" y="7" width="10" height="10" rx="1" />
        <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 1 1-4 0V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2.8a2 2 0 1 1 0-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V2.8a2 2 0 1 1 4 0V3a1.7 1.7 0 0 0 1 1.6h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
  };

  return <svg {...commonProps}>{paths[name]}</svg>;
}

export function DashboardUser() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const user = getStoredUser();
  const fullName = user.name || user.fullName || 'Nama Lengkap';
  const email = user.email || 'mail@mail.com';
  const username = user.username || fullName.toLowerCase().replace(/\s+/g, '');

  const values = {
    name: fullName,
    nickname: user.nickname || '',
    phone: user.phone || user.whatsapp || '',
    email,
    username,
    jobType: user.jobType || user.job || '',
    institutionName: user.institutionName || user.company || '',
  };

  function handleLogout() {
    window.localStorage.removeItem('arduflow_user');
    window.dispatchEvent(new Event('arduflow-auth-change'));
    window.location.assign('/signin');
  }

  return (
    <div className={`dashboard-user-page${isSidebarCollapsed ? ' dashboard-user-page--collapsed' : ''}`}>
      <aside className="dashboard-sidebar" aria-label="Dashboard sidebar">
        <div className="dashboard-sidebar__brand">
          <span>ARDU</span>
          <strong>FLOW</strong>
        </div>
        <button
          className="dashboard-sidebar__collapse"
          type="button"
          aria-expanded={!isSidebarCollapsed}
          aria-label={isSidebarCollapsed ? 'Buka sidebar' : 'Minimize sidebar'}
          onClick={() => setSidebarCollapsed((value) => !value)}
        >
          <img src={arrowDownIcon} alt="" aria-hidden="true" />
        </button>

        <nav className="dashboard-sidebar__nav">
          {menuItems.map((item) => (
            <a
              className={`dashboard-sidebar__item${item.active ? ' dashboard-sidebar__item--active' : ''}`}
              href={item.active ? '/dashboard' : '#'}
              key={item.label}
            >
              <SidebarIcon name={item.icon} />
              <span>{item.label}</span>
            </a>
          ))}
          <button className="dashboard-sidebar__item dashboard-sidebar__item--logout" type="button" onClick={handleLogout}>
            <SidebarIcon name="settings" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <section className="dashboard-shell">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__user">
            <button className="dashboard-notification" type="button" aria-label="Notifikasi">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span />
            </button>
            <div className="dashboard-mini-avatar" aria-hidden="true">{getInitials(fullName)}</div>
            <strong>{fullName}</strong>
          </div>
        </header>

        <main className="dashboard-content">
          <h1>Hello Nama <span aria-hidden="true">👋🏻</span></h1>

          <section className="dashboard-profile-header">
            <div className="dashboard-profile-avatar" aria-hidden="true">{getInitials(fullName)}</div>
            <div className="dashboard-profile-title">
              <h2>{fullName}</h2>
              <p>{email}</p>
            </div>
            <div className="dashboard-actions">
              <button className="dashboard-button dashboard-button--edit" type="button">Edit</button>
              <button className="dashboard-button dashboard-button--save" type="button">Save</button>
            </div>
          </section>

          <form className="dashboard-form">
            {fieldGroups.map((group, groupIndex) => (
              <div className="dashboard-form__column" key={groupIndex}>
                {group.map((field) => (
                  <label className="dashboard-field" key={field.key}>
                    <span>{field.label}</span>
                    {field.select ? (
                      <select defaultValue={values[field.key] || ''}>
                        <option value="" disabled>{field.placeholder}</option>
                        <option value="Siswa">Siswa</option>
                        <option value="Mahasiswa">Mahasiswa</option>
                        <option value="Pengajar">Pengajar</option>
                        <option value="Profesional">Profesional</option>
                      </select>
                    ) : (
                      <input type={field.type || 'text'} placeholder={field.placeholder} defaultValue={values[field.key]} />
                    )}
                  </label>
                ))}
              </div>
            ))}
          </form>
        </main>
      </section>
    </div>
  );
}
