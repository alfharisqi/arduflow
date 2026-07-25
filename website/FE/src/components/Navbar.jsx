import { navigation } from '../features/content/arduflowContent.js';

export function Navbar() {
  const current = window.location.pathname.replace(/\/$/, '') || '/';

  return (
    <header className="site-header">
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
      <a className="nav-ide" href="/ide">Masuk IDE</a>
      <a className="navbar-button" href="/akses">Daftar Akses</a>
    </header>
  );
}
