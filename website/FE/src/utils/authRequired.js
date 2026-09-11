import { getStoredUserToken } from '../services/authSession.js';
import { showArduflowAlert } from './alerts.js';

const AFTER_LOGIN_REDIRECT_KEY = 'arduflow_after_login_redirect';

function safeInternalHref(href) {
  const value = String(href || '').trim();
  if (!value || value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//')) {
    return '/dashboard';
  }
  return value.startsWith('/') ? value : `/${value}`;
}

export function getAfterLoginRedirect(fallback = '/dashboard') {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const target = sessionStorage.getItem(AFTER_LOGIN_REDIRECT_KEY);
  sessionStorage.removeItem(AFTER_LOGIN_REDIRECT_KEY);
  return target ? safeInternalHref(target) : fallback;
}

export async function requireUserLoginForAction(event, targetHref, message) {
  if (getStoredUserToken()) {
    return true;
  }

  event?.preventDefault();

  const result = await showArduflowAlert({
    icon: 'warning',
    title: 'Login diperlukan',
    text: message || 'Silakan login terlebih dahulu untuk melanjutkan.',
    confirmButtonText: 'Login sekarang',
    showCancelButton: true,
    cancelButtonText: 'Nanti',
  });

  if (result.isConfirmed && typeof window !== 'undefined') {
    sessionStorage.setItem(AFTER_LOGIN_REDIRECT_KEY, safeInternalHref(targetHref));
    window.location.assign('/signin');
  }

  return false;
}
