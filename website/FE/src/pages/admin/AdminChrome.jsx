import { useEffect, useId, useRef, useState } from 'react';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import { AdminSidebar } from './AdminSidebar.jsx';
import { ADMIN_REALTIME_EVENT, AdminRealtimeBridge } from './AdminRealtimeBridge.jsx';
import { getAdminDashboard } from '../../services/authApi.js';
import {
  getInitialAdminSidebarCollapsed,
  persistAdminSidebarCollapsed,
} from './adminSidebarState.js';

export function createSlug(value) {
  return String(value).toLowerCase().trim().replace(/\s+/g, '-').replace(/\//g, '-');
}

function formatNotificationTime(value) {
  if (!value) return 'Baru saja';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function buildAdminNotifications(data) {
  const queue = (data?.actionQueue || [])
    .filter((item) => Number(item.count || 0) > 0)
    .map((item) => ({
      title: item.label,
      detail: item.detail,
      time: 'Perlu tindakan',
      route: item.route,
      priority: item.priority || 'info',
    }));

  const logs = (data?.logs || []).map((item) => ({
    title: item.level === 'ERROR' ? 'Error sistem' : 'Peringatan sistem',
    detail: item.message,
    time: formatNotificationTime(item.time),
    route: '/admin/database',
    priority: item.level === 'ERROR' ? 'danger' : 'warning',
  }));

  const activities = (data?.activities || []).slice(0, 4).map((item) => ({
    title: item.title,
    detail: item.detail,
    time: formatNotificationTime(item.time),
    route: '/admin/dashboard',
    priority: 'normal',
  }));

  return [...queue, ...logs, ...activities].slice(0, 8);
}

function realtimeNotification(detail) {
  const payload = detail?.payload || {};
  const topic = detail?.topic || 'Realtime';
  const title = payload.title || payload.event || payload.type || 'Update realtime';
  const message = payload.message || payload.detail || payload.email || payload.name || topic;

  return {
    title,
    detail: message,
    time: 'Baru saja',
    route: '/admin/dashboard',
    priority: 'info',
  };
}

export function AdminNotificationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    getAdminDashboard()
      .then((data) => {
        if (!isMounted) return;
        setNotifications(buildAdminNotifications(data));
      })
      .catch(() => {
        if (!isMounted) return;
        setNotifications([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function handleRealtime(event) {
      setNotifications((current) => [
        realtimeNotification(event.detail),
        ...current,
      ].slice(0, 8));
    }

    window.addEventListener(ADMIN_REALTIME_EVENT, handleRealtime);
    return () => window.removeEventListener(ADMIN_REALTIME_EVENT, handleRealtime);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const importantCount = notifications.filter((item) => item.priority !== 'normal').length;

  return (
    <div className="admin-notification-menu" ref={menuRef}>
      <button
        className="admin-dashboard-notif"
        type="button"
        aria-label="Notifikasi"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((value) => !value)}
      >
        <img src={bellIcon} alt="" />
        {importantCount > 0 ? <span>{importantCount > 9 ? '9+' : importantCount}</span> : null}
      </button>

      {isOpen ? (
        <div className="admin-notification-panel" role="menu">
          <header>
            <span>
              <strong>Notifikasi</strong>
              <small>{isLoading ? 'Memuat data...' : `${notifications.length} update terbaru`}</small>
            </span>
            <button
              type="button"
              disabled={notifications.length === 0}
              onClick={() => setNotifications([])}
            >
              Bersihkan
            </button>
          </header>

          <div className="admin-notification-list">
            {notifications.length ? notifications.map((item, index) => (
              <button
                className={`admin-notification-item is-${item.priority}`}
                key={`${item.title}-${item.time}-${index}`}
                type="button"
                role="menuitem"
                onClick={() => {
                  if (item.route) {
                    window.location.href = item.route;
                  }
                }}
              >
                <i aria-hidden="true" />
                <span>
                  <b>{item.title}</b>
                  <small>{item.detail || '-'}</small>
                  <time>{item.time}</time>
                </span>
              </button>
            )) : (
              <p className="admin-notification-empty">
                {isLoading ? 'Memuat notifikasi...' : 'Belum ada notifikasi baru.'}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
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
  onSearchSubmit,
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
          onKeyDown={onSearchSubmit ? (event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onSearchSubmit();
            }
          } : undefined}
        />
      </label>
      <div className="admin-dashboard-account">
        {children}
        <AdminNotificationButton />
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
