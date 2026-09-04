export const SIDEBAR_COLLAPSED_KEY = 'arduflow_user_sidebar_collapsed';

export function getInitialSidebarCollapsed() {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function persistSidebarCollapsed(value) {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(value));
  } catch {
    // Ignore storage failures so sidebar interaction still works.
  }
}
