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
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
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

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !readKeys.has(notification.key)).length,
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
    function handleClickOutside(event) {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleToggle() {
    setIsOpen((current) => !current);
    if (!isOpen) {
      loadNotifications({ sendEmail: true });
    }
  }

  function markAllAsRead() {
    const nextKeys = new Set([
      ...readKeys,
      ...notifications.map((notification) => notification.key),
    ]);
    setReadKeys(nextKeys);
    persistNotificationReads(nextKeys);
  }

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar__user">
        <div className="dashboard-notification-wrap" ref={dropdownRef}>
          <button
            className={`dashboard-notification${unreadCount > 0 ? ' dashboard-notification--has-testimonial' : ''}`}
            type="button"
            aria-label={unreadCount > 0 ? `${unreadCount} notifikasi baru` : 'Notifikasi'}
            aria-expanded={isOpen}
            onClick={handleToggle}
          >
            <img src={bellIcon} alt="" aria-hidden="true" />
          </button>

          {isOpen ? (
            <div className="dashboard-notification-panel" role="dialog" aria-label="Daftar notifikasi">
              <div className="dashboard-notification-panel__head">
                <div>
                  <strong>Notifikasi</strong>
                  <span>{unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca'}</span>
                </div>
                <button type="button" onClick={markAllAsRead} disabled={notifications.length === 0}>
                  Tandai dibaca
                </button>
              </div>

              <div className="dashboard-notification-panel__body">
                {isLoading ? (
                  <p className="dashboard-notification-state">Memuat notifikasi...</p>
                ) : error ? (
                  <p className="dashboard-notification-state">{error}</p>
                ) : notifications.length === 0 ? (
                  <p className="dashboard-notification-state">Belum ada notifikasi aktif.</p>
                ) : (
                  notifications.map((notification) => (
                    <a
                      className={`dashboard-notification-item${readKeys.has(notification.key) ? '' : ' is-unread'}`}
                      href={notification.href || '#'}
                      key={notification.key}
                      onClick={() => {
                        const nextKeys = new Set([...readKeys, notification.key]);
                        setReadKeys(nextKeys);
                        persistNotificationReads(nextKeys);
                      }}
                    >
                      <span className={`dashboard-notification-item__dot is-${notification.priority}`} />
                      <span>
                        <strong>{notification.title}</strong>
                        <small>{notification.message}</small>
                        <em>{formatNotificationTime(notification.createdAt)}</em>
                      </span>
                    </a>
                  ))
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
