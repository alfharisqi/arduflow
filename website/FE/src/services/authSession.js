import { logoutUser } from './authApi.js';

export const USER_STORAGE_KEY = 'arduflow_user';
export const USER_TOKEN_STORAGE_KEY = 'arduflow_user_token';
export const AUTH_CHANGE_EVENT = 'arduflow-auth-change';

export function getStoredUserToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  return String(window.localStorage.getItem(USER_TOKEN_STORAGE_KEY) || '').trim();
}

export function getStoredUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = getStoredUserToken();
  if (!token) {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }

  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    const user = raw ? JSON.parse(raw) : null;
    return user && typeof user === 'object' ? user : null;
  } catch {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}

export function setStoredUser(user) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!user || typeof user !== 'object') {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    dispatchAuthChange();
    return;
  }

  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  dispatchAuthChange();
}

export function dispatchAuthChange() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function clearUserAuthState({ notify = true } = {}) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.localStorage.removeItem(USER_TOKEN_STORAGE_KEY);

  if (notify) {
    dispatchAuthChange();
  }
}

export async function logoutCurrentUser({ redirectTo = '/signin' } = {}) {
  const token = getStoredUserToken();

  try {
    if (token) {
      await logoutUser(token);
    }
  } catch {
    // Browser cleanup below is still authoritative for local auth state.
  } finally {
    clearUserAuthState();
    if (redirectTo && typeof window !== 'undefined') {
      window.location.assign(redirectTo);
    }
  }
}
