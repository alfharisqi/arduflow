function resolveApiBaseUrl() {
  const envUrl = String(import.meta.env.VITE_API_URL || '').trim();

  return (envUrl || 'http://192.168.130.10:8000').replace(/\/$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl();

export function apiUrl(path) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function apiEndpoint(envValue, fallbackPath) {
  const value = String(envValue || '').trim();

  if (!value) {
    return apiUrl(fallbackPath);
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return apiUrl(value);
}
