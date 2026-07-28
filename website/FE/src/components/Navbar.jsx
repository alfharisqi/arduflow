import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const syncUser = () => setStoredUser(getStoredUser());

    window.addEventListener('storage', syncUser);
    window.addEventListener('arduflow-auth-change', syncUser);

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('arduflow-auth-change', syncUser);
    };
  }, []);

  const isSignedIn = Boolean(storedUser);

  return (
    <header className={`site-header${isSignedIn ? ' site-header--user' : ''}`}>
      <a className="brand" href="/">
        <span>ARDU<span>FLOW</span></span>
      </a>
      <nav className="nav" aria-label="Navigasi utama">
        {navigation.map((item) => (
          <a className={current === item.path ? 'active' : ''} href={item.path} key={item.path}>
            {item.label}
          </a>
        ))}
      </nav>
      {isSignedIn ? (
        <div className="navbar-user-actions" aria-label="Aksi pengguna">
          <a className="nav-ide" href="/ide">Masuk IDE</a>
          <a className="navbar-icon-button" href="/profile" aria-label="Profil pengguna">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 12.5c2.35 0 4.25-1.9 4.25-4.25S14.35 4 12 4 7.75 5.9 7.75 8.25 9.65 12.5 12 12.5Zm0 2.25c-3.38 0-6.25 1.62-6.25 3.55v1.2h12.5v-1.2c0-1.93-2.87-3.55-6.25-3.55Z" />
            </svg>
          </a>
          <button className="navbar-icon-button navbar-menu-toggle" type="button" aria-label="Buka menu">
            <span />
            <span />
            <span />
          </button>
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
