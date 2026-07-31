import { useEffect, useRef, useState } from 'react';
import { navigation } from '../features/content/arduflowContent.js';

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const syncUser = () => {
      setStoredUser(getStoredUser());
      setIsProfileOpen(false);
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
    if (!isProfileOpen && !isMenuOpen) {
      return undefined;
    }

    const closeOnOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);

    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [isProfileOpen, isMenuOpen]);

  const isSignedIn = Boolean(storedUser);
  const displayName = storedUser?.name || storedUser?.username || 'Nama Lengkap';
  const username = storedUser?.username || storedUser?.email || 'USERNAME';
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || 'A';

  const handleLogout = () => {
    window.localStorage.removeItem('arduflow_user');
    window.dispatchEvent(new Event('arduflow-auth-change'));
    window.location.assign('/signin');
  };

  const profileMenuItems = [
    { label: 'Detail Profil', href: '/profile' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Project Saya', href: '/project-saya' },
    { label: 'Token IDE', href: '/token-ide' },
    { label: 'Program yang Diikuti', href: '/program-saya' },
    { label: 'Sertifikat', href: '/sertifikat' },
    { label: 'Bantuan', href: '/bantuan' },
  ];

  return (
    <header className={`site-header${isSignedIn ? ' site-header--user' : ''}`}>
      <a className="brand" href="/">
        <span>ARDU<span>FLOW</span></span>
      </a>
      <nav className="nav" aria-label="Navigasi utama">
        {navigation.map((item) => (
          <a
            className={
              current === item.path ||
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
        <div className="navbar-user-actions" aria-label="Aksi pengguna" ref={profileMenuRef}>
          <a className="nav-ide" href="/ide">Masuk IDE</a>
          <button
            className="navbar-icon-button"
            type="button"
            aria-expanded={isProfileOpen}
            aria-label="Buka menu profil"
            onClick={() => {
              setIsMenuOpen(false);
              setIsProfileOpen((open) => !open);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12.5c2.35 0 4.25-1.9 4.25-4.25S14.35 4 12 4 7.75 5.9 7.75 8.25 9.65 12.5 12 12.5Zm0 2.25c-3.38 0-6.25 1.62-6.25 3.55v1.2h12.5v-1.2c0-1.93-2.87-3.55-6.25-3.55Z" />
            </svg>
          </button>
          <button
            className="navbar-icon-button navbar-menu-toggle"
            type="button"
            aria-expanded={isMenuOpen}
            aria-label="Buka menu"
            onClick={() => {
              setIsProfileOpen(false);
              setIsMenuOpen((open) => !open);
            }}
          >
            <span />
            <span />
            <span />
          </button>
          {isProfileOpen && (
            <aside className="profile-dropdown" aria-label="Menu profil">
              <div className="profile-dropdown__arrow" aria-hidden="true" />
              <div className="profile-dropdown__traffic" aria-hidden="true">
                <span className="profile-dropdown__traffic-red" />
                <span className="profile-dropdown__traffic-yellow" />
                <span className="profile-dropdown__traffic-green" />
              </div>
              <div className="profile-dropdown__user">
                <div className="profile-dropdown__avatar" aria-hidden="true">{avatarInitial}</div>
                <div>
                  <span className="profile-dropdown__username">{username}</span>
                  <strong>{displayName}</strong>
                </div>
              </div>
              <nav className="profile-dropdown__list" aria-label="Navigasi profil">
                {profileMenuItems.map((item) => (
                  <a href={item.href} key={item.label}>{item.label}</a>
                ))}
                <button type="button" onClick={handleLogout}>Log Out</button>
              </nav>
            </aside>
          )}
          {isMenuOpen && (
            <aside className="profile-dropdown menu-dropdown" aria-label="Menu utama">
              <div className="profile-dropdown__arrow" aria-hidden="true" />
              <div className="profile-dropdown__traffic" aria-hidden="true">
                <span className="profile-dropdown__traffic-red" />
                <span className="profile-dropdown__traffic-yellow" />
                <span className="profile-dropdown__traffic-green" />
              </div>
              <div className="profile-dropdown__user">
                <div className="profile-dropdown__avatar" aria-hidden="true">{avatarInitial}</div>
                <div>
                  <span className="profile-dropdown__username">{username}</span>
                  <strong>{displayName}</strong>
                </div>
              </div>
              <nav className="profile-dropdown__list menu-dropdown__list" aria-label="Navigasi menu">
                <a href="/ide">Masuk IDE</a>
                {navigation.map((item) => (
                  <a href={item.path} key={item.path}>{item.label}</a>
                ))}
              </nav>
            </aside>
          )}
        </div>
      ) : (
        <>
          <a className="nav-ide" href="/ide">Masuk IDE</a>
          <a className="navbar-button" href="/akses">Daftar Akses</a>
        </>
      )}
    </header>
  );
}
