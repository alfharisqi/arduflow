import { useEffect, useRef, useState } from 'react';
import { navigation } from '../features/content/arduflowContent.js';
import { ProfileAvatar } from '../features/profile-image-crop/ProfileAvatar.jsx';
import { logoutUser } from '../services/authApi.js';

function getStoredUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return JSON.parse(window.localStorage.getItem('arduflow_user'));
  } catch {
    return null;
  }
}

export function Navbar() {
  const current = window.location.pathname.replace(/\/$/, '') || '/';
  const [storedUser, setStoredUser] = useState(getStoredUser);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const syncUser = () => {
      setStoredUser(getStoredUser());
      setIsMenuOpen(false);
    };

    window.addEventListener('storage', syncUser);
    window.addEventListener('arduflow-auth-change', syncUser);

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('arduflow-auth-change', syncUser);
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const closeOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);

    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [isMenuOpen]);

  const isSignedIn = Boolean(storedUser);
  const displayName = storedUser?.name || storedUser?.username || 'Nama Lengkap';
  const username = storedUser?.username || storedUser?.email || 'USERNAME';
  const profileImage = storedUser?.profileImage || storedUser?.avatar || '';

  const handleLogout = async () => {
    const token = window.localStorage.getItem('arduflow_user_token');
    try {
      if (token) await logoutUser(token);
    } catch {
      // Local cleanup still prevents reuse in the browser.
    }
    window.localStorage.removeItem('arduflow_user');
    window.localStorage.removeItem('arduflow_user_token');
    window.dispatchEvent(new Event('arduflow-auth-change'));
    window.location.assign('/signin');
  };

  const dashboardLinks = [
    { label: 'Profil', href: '/dashboard' },
    { label: 'Project Saya', href: '/proyek-saya' },
    { label: 'Masuk IDE', href: '/ide' },
    { label: 'Program yang Diikuti', href: '/workshop-program' },
    { label: 'Sertifikat', href: '/sertifikat' },
  ];

  const menuLinks = [
    { label: 'Beranda', href: '/' },
    { label: 'Tutorial', href: '/tutorial' },
    { label: 'Materi', href: '/materi' },
    { label: 'Proyek', href: '/project' },
    { label: 'Workshop', href: '/workshop' },
  ];

  return (
    <header className={`site-header${isSignedIn ? ' site-header--user' : ''}`}>
      <a className="brand" href="/">
        <span>
          ARDU<span>FLOW</span>
        </span>
      </a>
      <nav className="nav" aria-label="Navigasi utama">
        {navigation.map((item) => (
          <a
            className={
              current === item.path ||
              (item.path === '/materi' && current.startsWith('/materi/')) ||
              (item.path === '/workshop' &&
                (current === '/daftar-workshop' ||
                  current === '/workshop/daftar' ||
                  current === '/detail-workshop' ||
                  current === '/workshop/detail'))
                ? 'active'
                : ''
            }
            href={item.path}
            key={item.path}
          >
            {item.label}
          </a>
        ))}
      </nav>
      {isSignedIn ? (
        <div className="navbar-user-actions" aria-label="Aksi pengguna" ref={menuRef}>
          <a className="nav-ide" href="/ide">Masuk IDE</a>
          <a className="navbar-user-avatar" href="/dashboard" aria-label="Profil pengguna">
            <ProfileAvatar image={profileImage} name={displayName} />
          </a>
          <button
            className={`navbar-icon-button navbar-menu-toggle${isMenuOpen ? ' is-open' : ''}`}
            type="button"
            aria-expanded={isMenuOpen}
            aria-label="Buka menu"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          {isMenuOpen && (
            <aside className="profile-dropdown menu-dropdown" aria-label="Menu utama">
              <div className="profile-dropdown__traffic" aria-hidden="true">
                <span className="profile-dropdown__traffic-red" />
                <span className="profile-dropdown__traffic-yellow" />
                <span className="profile-dropdown__traffic-green" />
              </div>
              <div className="profile-dropdown__user">
                <ProfileAvatar className="profile-dropdown__avatar" image={profileImage} name={displayName} />
                <div>
                  <span className="profile-dropdown__username">{username}</span>
                  <strong>{displayName}</strong>
                </div>
              </div>
              <nav className="menu-dropdown__main" aria-label="Navigasi menu">
                <div className="menu-dropdown__section">
                  <div className="menu-dropdown__section-head">
                    <span>Dashboard</span>
                    <span className="menu-dropdown__chevron" aria-hidden="true" />
                  </div>
                  <div className="menu-dropdown__details">
                    {dashboardLinks.map((item) => (
                      <a href={item.href} key={item.href}>
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="menu-dropdown__section">
                  <div className="menu-dropdown__section-head">
                    <span>Menu</span>
                    <span className="menu-dropdown__chevron" aria-hidden="true" />
                  </div>
                  <div className="menu-dropdown__details">
                    {menuLinks.map((item) => (
                      <a href={item.href} key={item.href}>
                        {item.label}
                      </a>
                    ))}
                  </div>
                </div>
                <a className="menu-dropdown__item" href="/partner">Tentang Kami</a>
                <a className="menu-dropdown__item" href="/bantuan">Bantuan</a>
                <button className="menu-dropdown__item menu-dropdown__logout" type="button" onClick={handleLogout}>
                  Log Out
                </button>
              </nav>
            </aside>
          )}
        </div>
      ) : (
        <>
          <a className="nav-ide" href="/ide">Masuk IDE</a>
          <a className="navbar-button" href="/signup">Daftar Akses</a>
        </>
      )}
    </header>
  );
}
