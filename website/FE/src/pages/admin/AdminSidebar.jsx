import dashboardIcon from '../../assets/icons/icons-dashboard-1.svg';
import usersIcon from '../../assets/icons/icon-users-1.svg';
import clockIcon from '../../assets/icons/icon-clock-1.svg';
import graduationIcon from '../../assets/icons/icon-graduation-cap-1.svg';
import galleryIcon from '../../assets/icons/icon-image-placeholder-1.svg';
import globeIcon from '../../assets/icons/icons-globe-1.svg';
import bookIcon from '../../assets/icons/icon-book-1.svg';
import mailIcon from '../../assets/icons/icon-mail-1.svg';
import cpuIcon from '../../assets/icons/icon-cpu-1.svg';
import databaseIcon from '../../assets/icons/icons-database-1.svg';
import settingsIcon from '../../assets/icons/icon-settings-1.svg';
import logoutIcon from '../../assets/icons/icon-logout-1.svg';
import collapseIcon from '../../assets/icons/icon-arrowdown-1.svg';

const adminItems = [
  {
    title: 'Manajemen Utama',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: dashboardIcon, active: true },
      { label: 'User', href: '/admin/users', icon: usersIcon },
      { label: 'Verifikasi Akun', href: '/admin/verification', icon: mailIcon, count: 12 },
      { label: 'Workshop / Program', href: '/admin/program', icon: clockIcon },
      { label: 'Lead / Kontak', href: '/admin/leads', icon: usersIcon },
      { label: 'Sertifikat', href: '/admin/certificates', icon: bookIcon },
    ],
  },
  {
    title: 'Konten',
    items: [
      { label: 'Tutorial', href: '/admin/tutorial', icon: graduationIcon },
      { label: 'Proyek', href: '/admin/projects', icon: galleryIcon },
      { label: 'Galeri Kegiatan', href: '/admin/gallery', icon: galleryIcon },
      { label: 'Partner / Kolaborator', href: '/admin/partners', icon: globeIcon },
      { label: 'Arduflow IDE', href: '/admin/ide', icon: cpuIcon },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { label: 'Settings', href: '/admin/settings', icon: settingsIcon },
      { label: 'Backup / Database', href: '/admin/database', icon: databaseIcon },
    ],
  },
];

export function AdminSidebar({ isCollapsed = false, onToggleCollapse = () => {} }) {
  return (
    <aside className="admin-sidebar" aria-label="Admin sidebar">
      <a className="admin-sidebar-brand" href="/admin/dashboard" aria-label="Arduflow Admin">
        <span>Admin Panel</span>
      </a>

      <button
        className="admin-sidebar-toggle"
        type="button"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? 'Expand sidebar admin' : 'Minimize sidebar admin'}
        aria-expanded={!isCollapsed}
      >
        <img src={collapseIcon} alt="" aria-hidden="true" />
      </button>

      <nav className="admin-sidebar-items" aria-label="Admin navigation">
        {adminItems.map((group) => (
          <section className="admin-sidebar-group" key={group.title}>
            <h2>{group.title}</h2>
            {group.items.map((item) => (
              <a
                className={`admin-sidebar-link${item.active ? ' is-active' : ''}`}
                href={item.href}
                key={item.label}
              >
                <img className="admin-sidebar-icon" src={item.icon} alt="" aria-hidden="true" />
                <span>{item.label}</span>
                {item.count ? <em>{item.count}</em> : null}
              </a>
            ))}
          </section>
        ))}
      </nav>

      <div className="admin-sidebar-user">
        <div className="admin-sidebar-profile">
          <span className="admin-sidebar-avatar" aria-hidden="true">
            NA
          </span>
          <span className="admin-sidebar-profile-text">
            <span className="admin-sidebar-name">Nama Admin</span>
            <span className="admin-sidebar-role">Admin</span>
          </span>
        </div>

        <div className="admin-sidebar-actions">
          <a className="admin-sidebar-link admin-sidebar-link--danger" href="/admin/login">
            <img className="admin-sidebar-icon" src={logoutIcon} alt="" aria-hidden="true" />
            <span>Keluar</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
