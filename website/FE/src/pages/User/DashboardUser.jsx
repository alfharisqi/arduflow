import { useState } from 'react';
import arrowDownIcon from '../../assets/icons/icon-arrowdown-1.svg';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import certificateIcon from '../../assets/icons/icon-downloadsim-1.svg';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import { updateUserProfile } from '../../services/authApi.js';
import { getInitialSidebarCollapsed, persistSidebarCollapsed } from './sidebarState.js';

const menuItems = [
  { label: 'Profil', icon: 'user', href: '/dashboard', active: true },
  { label: 'Progres Belajar', icon: 'graduation', href: '/progress-belajar' },
  { label: 'Proyek Saya', icon: 'folder', href: '/proyek-saya' },
  { label: 'Workshop / Program', icon: 'calendar', href: '/workshop-program' },
  { label: 'Sertifikat', icon: 'certificate', href: '/sertifikat' },
  { label: 'IDE', icon: 'cpu', href: '/ide' },
  { label: 'Settings', icon: 'settings', href: '/settings' },
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

const calendarDays = [
  ['', '', '1', '2', '3', '4', '5'],
  ['6', '7', '8', '9', '10', '11', '12'],
  ['13', '14', '15', '16', '17', '18', '19'],
  ['20', '21', '22', '23', '24', '25', '26'],
  ['27', '28', '29', '30', '', '', ''],
];

const eventDays = new Set(['6', '23', '24', '25', '26', '29', '30']);

const upcomingPrograms = Array.from({ length: 4 }, (_, index) => ({
  id: index + 1,
  title: 'Nama Workshop/Program',
  meta: 'Tanggal Bulan Jam Pukul WIB',
}));

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
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(getInitialSidebarCollapsed);
  const [storedUser, setStoredUser] = useState(getStoredUser);
  const [isEditingProfile, setEditingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileValues, setProfileValues] = useState(() => {
    const user = getStoredUser();
    const fullName = user.name || user.fullName || 'Nama Lengkap';

    return {
      name: fullName,
      nickname: user.nickname || '',
      phone: user.phone || user.whatsapp || '',
      email: user.email || 'mail@mail.com',
      username: user.username || '',
      jobType: user.jobType || user.job || user.occupation || '',
      institutionName: user.institutionName || user.company || '',
    };
  });
  const fullName = profileValues.name || storedUser.name || storedUser.fullName || 'Nama Lengkap';
  const greetingName = profileValues.nickname || fullName;
  const email = profileValues.email || storedUser.email || 'mail@mail.com';

  function handleLogout() {
    window.localStorage.removeItem('arduflow_user');
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

  function updateProfileValue(event) {
    const { name, value } = event.target;
    setProfileValues((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSaveProfile() {
    setProfileMessage('');

    try {
      const result = await updateUserProfile({
        id: storedUser.id,
        name: profileValues.name,
        username: profileValues.username,
        nickname: profileValues.nickname,
        whatsapp: profileValues.phone,
        occupation: profileValues.jobType,
        institutionName: profileValues.institutionName,
      });
      const nextUser = { ...storedUser, ...result.user };

      window.localStorage.setItem('arduflow_user', JSON.stringify(nextUser));
      window.dispatchEvent(new Event('arduflow-auth-change'));
      setStoredUser(nextUser);
      setProfileValues((current) => ({
        ...current,
        name: result.user.name || current.name,
        username: result.user.username || '',
        nickname: result.user.nickname || '',
        phone: result.user.whatsapp || '',
        email: result.user.email || current.email,
        jobType: result.user.occupation || '',
        institutionName: result.user.institutionName || '',
      }));
      setEditingProfile(false);
      setProfileMessage('Profil berhasil disimpan.');
    } catch (error) {
      setProfileMessage(error.message || 'Profil gagal disimpan.');
    }
  }

  return (
    <div className={`dashboard-user-page${isSidebarCollapsed ? ' dashboard-user-page--collapsed' : ''}`}>
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
              {item.icon === 'certificate' ? (
                <img className="dashboard-sidebar__asset-icon" src={certificateIcon} alt="" aria-hidden="true" />
              ) : (
                <SidebarIcon name={item.icon} />
              )}
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
            <div className="dashboard-mini-avatar" aria-hidden="true">{getInitials(fullName)}</div>
            <strong>{fullName}</strong>
          </div>
        </header>

        <main className="dashboard-content">
          <div className="dashboard-user-greeting">
            <h1>Hello {greetingName}</h1>
            <span aria-hidden="true">&#128075;&#127995;</span>
          </div>

          <div className="dashboard-main-content">
            <section className="dashboard-profile-panel">
              <div className="dashboard-profile-header">
                <div className="dashboard-profile-avatar" aria-hidden="true">{getInitials(fullName)}</div>
                <div className="dashboard-profile-title">
                  <h2>{fullName}</h2>
                  <p>{email}</p>
                </div>
                <div className={`dashboard-actions${isEditingProfile ? ' dashboard-actions--editing' : ''}`}>
                  <button
                    className="dashboard-button dashboard-button--edit"
                    type="button"
                    onClick={() => {
                      setEditingProfile(true);
                      setProfileMessage('');
                    }}
                  >
                    Edit
                  </button>
                  {isEditingProfile ? (
                    <button className="dashboard-button dashboard-button--save" type="button" onClick={handleSaveProfile}>
                      Save
                    </button>
                  ) : null}
                </div>
              </div>

              <form className="dashboard-form">
                {fieldGroups.map((group, groupIndex) => (
                  <div className="dashboard-form__column" key={groupIndex}>
                    {group.map((field) => (
                      <label className="dashboard-field" key={field.key}>
                        <span>{field.label}</span>
                        {field.select ? (
                          <select
                            name={field.key}
                            value={profileValues[field.key] || ''}
                            onChange={updateProfileValue}
                            disabled={!isEditingProfile}
                          >
                            <option value="" disabled>{field.placeholder}</option>
                            <option value="Siswa">Siswa</option>
                            <option value="Mahasiswa">Mahasiswa</option>
                            <option value="Pengajar">Pengajar</option>
                            <option value="Profesional">Profesional</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>
                        ) : (
                          <input
                            type={field.type || 'text'}
                            name={field.key}
                            placeholder={field.placeholder}
                            value={profileValues[field.key] || ''}
                            onChange={updateProfileValue}
                            disabled={!isEditingProfile || field.key === 'email'}
                          />
                        )}
                      </label>
                    ))}
                  </div>
                ))}
              </form>
              {profileMessage ? <p className="dashboard-profile-message">{profileMessage}</p> : null}
            </section>

            <aside className="dashboard-program-panel" aria-label="Kalender Workshop dan Program">
              <section className="dashboard-calendar">
                <h2>Kalender Workshop / Program</h2>
                <div className="dashboard-calendar__month">
                  <button type="button" aria-label="Bulan sebelumnya">&lsaquo;</button>
                  <span>April 2025</span>
                  <button className="dashboard-calendar__next" type="button" aria-label="Bulan berikutnya">&rsaquo;</button>
                </div>
                <div className="dashboard-calendar__grid">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                    <strong key={day}>{day}</strong>
                  ))}
                  {calendarDays.flat().map((day, index) => (
                    <span className={eventDays.has(day) ? 'dashboard-calendar__day dashboard-calendar__day--event' : 'dashboard-calendar__day'} key={`${day}-${index}`}>
                      {day}
                    </span>
                  ))}
                </div>
              </section>

              <section className="dashboard-upcoming">
                <h2>Workshop / Program mendatang</h2>
                <div className="dashboard-upcoming__list">
                  {upcomingPrograms.map((program) => (
                    <a className="dashboard-upcoming__card" href="#" key={program.id}>
                      <span>
                        <strong>{program.title}</strong>
                        <small>{program.meta}</small>
                      </span>
                      <b aria-hidden="true">&rsaquo;</b>
                    </a>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </main>
      </section>
    </div>
  );
}
