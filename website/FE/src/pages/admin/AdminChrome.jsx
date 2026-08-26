import { useId, useState } from 'react';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import { AdminSidebar } from './AdminSidebar.jsx';
import { AdminRealtimeBridge } from './AdminRealtimeBridge.jsx';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';

export function createSlug(value) {
  return String(value).toLowerCase().trim().replace(/\s+/g, '-').replace(/\//g, '-');
}

export function useAdminSidebar() {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(
    getInitialAdminSidebarCollapsed
  );

  const handleToggleSidebar = () => {
    setSidebarCollapsed((value) => {
      const nextValue = !value;
      persistAdminSidebarCollapsed(nextValue);
      return nextValue;
    });
  };

  return {
    isSidebarCollapsed,
    handleToggleSidebar,
  };
}

export function AdminTopbar({
  searchPlaceholder = 'Cari data admin',
  searchLabel = searchPlaceholder,
  searchId,
  searchName,
  searchValue,
  onSearchChange,
  adminName = 'Admin',
  adminRole = 'Super Admin',
  children,
}) {
  const generatedSearchId = useId();
  const inputId = searchId || generatedSearchId;
  const inputName = searchName || createSlug(searchLabel || 'admin-search');

  return (
    <header className="admin-dashboard-topbar">
      <label className="admin-dashboard-search" htmlFor={inputId}>
        <span aria-hidden="true" />
        <input
          id={inputId}
          name={inputName}
          type="search"
          placeholder={searchPlaceholder}
          aria-label={searchLabel}
          value={searchValue}
          onChange={onSearchChange ? (event) => onSearchChange(event.target.value) : undefined}
        />
      </label>
      <div className="admin-dashboard-account">
        {children}
        <button className="admin-dashboard-notif" type="button" aria-label="Notifikasi">
          <img src={bellIcon} alt="" />
        </button>
        <span className="admin-dashboard-avatar" aria-hidden="true" />
        <span>
          <strong>{adminName}</strong>
          <small>{adminRole}</small>
        </span>
      </div>
    </header>
  );
}

export function AdminPage({ pageClassName = '', ariaLabel, children }) {
  const { isSidebarCollapsed, handleToggleSidebar } = useAdminSidebar();
  const className = [
    'admin-dashboard-page',
    pageClassName,
    isSidebarCollapsed ? 'admin-dashboard-page--collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <main className={className}>
      <AdminSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      <AdminRealtimeBridge />
      <section className="admin-dashboard-main" aria-label={ariaLabel}>
        {children}
      </section>
    </main>
  );
}
