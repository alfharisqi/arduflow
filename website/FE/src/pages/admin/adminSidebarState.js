export const ADMIN_SIDEBAR_COLLAPSED_KEY = 'arduflow_admin_sidebar_collapsed';

export function getInitialAdminSidebarCollapsed() {
  try {
    return window.localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function persistAdminSidebarCollapsed(value) {
  try {
    window.localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, String(value));
  } catch {
    // Keep sidebar interaction working even when storage is unavailable.
  }
}
