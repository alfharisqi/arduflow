import { apiEndpoint } from './apiEndpoints.js';

const USER_NOTIFICATION_API_URL = apiEndpoint(
  import.meta.env.VITE_USER_NOTIFICATION_API_URL,
  '/api/user-notifications-api.php'
);

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value).trim());
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

function normalizeNotification(notification) {
  if (!notification || typeof notification !== 'object') return null;

  return {
    id: String(notification.id || notification.key || ''),
    key: String(notification.key || notification.id || ''),
    type: notification.type || 'general',
    title: notification.title || 'Notifikasi',
    message: notification.message || notification.description || '',
    href: notification.href || notification.url || '',
    actionLabel: notification.actionLabel || notification.action_label || 'Lihat detail',
    priority: notification.priority || 'normal',
    createdAt: notification.createdAt || notification.created_at || '',
    emailSent: Boolean(notification.emailSent ?? notification.email_sent),
  };
}

export function getStoredNotificationReads() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem('arduflow_user_notification_reads') || '[]');
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

export function persistNotificationReads(keys) {
  window.localStorage.setItem(
    'arduflow_user_notification_reads',
    JSON.stringify([...keys].map(String))
  );
}

export async function fetchUserNotifications(params = {}) {
  const response = await fetch(`${USER_NOTIFICATION_API_URL}${buildQuery(params)}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Gagal memuat notifikasi (${response.status}).`);
  }

  const records = payload?.data?.notifications || payload?.notifications || [];
  return Array.isArray(records) ? records.map(normalizeNotification).filter(Boolean) : [];
}
