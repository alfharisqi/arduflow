export const API_BASE_URL = (
  import.meta.env.VITE_DEPLOY_URL ||
  'http://arduflow.indobilliard.com/apk/uploads/web-arduflow-deploy-alfha/'
).replace(/\/$/, '');

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
