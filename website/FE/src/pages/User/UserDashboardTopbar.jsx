import { useEffect, useMemo, useRef, useState } from 'react';
import bellIcon from '../../assets/icons/icon-bell-1.svg';
import { ProfileAvatar } from '../../features/profile-image-crop/ProfileAvatar.jsx';
import {
  fetchUserNotifications,
  getStoredNotificationReads,
  persistNotificationReads,
} from '../../services/userNotificationApi.js';

function getStoredUser() {
  try {
    const raw = window.localStorage.getItem('arduflow_user');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
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

function adminPriority(notification) {
  const priority = String(notification?.priority || 'normal').toLowerCase();
  if (priority === 'urgent') return 'danger';
  if (priority === 'high') return 'warning';
  if (priority === 'low') return 'info';
  return priority;
}

export function UserDashboardTopbar({ fullName, profileImage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readKeys, setReadKeys] = useState(getStoredNotificationReads);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);

  const user = getStoredUser();
  const displayName = fullName || user.name || user.fullName || 'Nama Lengkap';
  const avatarImage = profileImage || user.profileImage || user.avatar || '';

  const importantCount = useMemo(
    () => notifications.filter((notification) => adminPriority(notification) !== 'normal').length,
    [notifications, readKeys]
  );

  async function loadNotifications({ sendEmail = true } = {}) {
    const userId = user.id || user.userId || user.user_id || '';
    const email = user.email || '';

    if (!userId && !email) {
      setNotifications([]);
      setError('Login diperlukan untuk memuat notifikasi.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const rows = await fetchUserNotifications({
        userId,
        email,
        sendEmail: sendEmail ? 1 : 0,
      });
      setNotifications(rows);
    } catch (loadError) {
      setNotifications([]);
      setError(loadError.message || 'Notifikasi tidak dapat dimuat.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications({ sendEmail: true });
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handlePointerDown(event) {
      if (!dropdownRef.current?.contains(event.target)) {
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

  function handleToggle() {
    setIsOpen((current) => !current);
    if (!isOpen) {
      loadNotifications({ sendEmail: true });
    }
  }

  function clearNotifications() {
    const nextKeys = new Set([
      ...readKeys,
      ...notifications.map((notification) => notification.key),
    ]);
    setReadKeys(nextKeys);
    persistNotificationReads(nextKeys);
    setNotifications([]);
  }

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar__user">
        <div className="admin-notification-menu user-notification-menu" ref={dropdownRef}>
          <button
            className="admin-dashboard-notif user-dashboard-notif"
            type="button"
            aria-label="Notifikasi"
            aria-expanded={isOpen}
            aria-haspopup="menu"
            onClick={handleToggle}
          >
            <img src={bellIcon} alt="" />
            {importantCount > 0 ? <span>{importantCount > 9 ? '9+' : importantCount}</span> : null}
          </button>

          {isOpen ? (
            <div className="admin-notification-panel user-notification-panel" role="menu">
              <header>
                <span>
                  <strong>Notifikasi</strong>
                  <small>{isLoading ? 'Memuat data...' : `${notifications.length} update terbaru`}</small>
                </span>
                <button type="button" onClick={clearNotifications} disabled={notifications.length === 0}>
                  Bersihkan
                </button>
              </header>

              <div className="admin-notification-list">
                {error ? (
                  <p className="admin-notification-empty">{error}</p>
                ) : notifications.length ? (
                  notifications.map((notification, index) => (
                    <button
                      className={`admin-notification-item is-${adminPriority(notification)}`}
                      key={notification.key}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        const nextKeys = new Set([...readKeys, notification.key]);
                        setReadKeys(nextKeys);
                        persistNotificationReads(nextKeys);
                        if (notification.href) {
                          window.location.href = notification.href;
                        }
                      }}
                    >
                      <i aria-hidden="true" />
                      <span>
                        <b>{notification.title}</b>
                        <small>{notification.message}</small>
                        <time>{formatNotificationTime(notification.createdAt)}</time>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="admin-notification-empty">
                    {isLoading ? 'Memuat notifikasi...' : 'Belum ada notifikasi baru.'}
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <ProfileAvatar className="dashboard-mini-avatar" image={avatarImage} name={displayName} />
        <strong>{displayName}</strong>
      </div>
    </header>
  );
}
