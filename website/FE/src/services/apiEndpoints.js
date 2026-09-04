<<<<<<< HEAD
export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:8000'
).replace(/\/$/, '');

export function apiUrl(path) {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
=======
function resolveApiBaseUrl() {
  const apiUrl = String(import.meta.env.VITE_API_URL || '').trim();
  const deployUrl = String(import.meta.env.VITE_DEPLOY_URL || '').trim();

  return (
    apiUrl ||
    deployUrl ||
    'https://arduflow.indobilliard.com/apk/uploads/web-arduflow-deploy-alfha/'
  ).replace(/\/+$/, '');
}

export const API_BASE_URL = resolveApiBaseUrl();

export function apiUrl(path) {
  const normalizedPath = String(path || '').trim();

  if (!normalizedPath) {
    return API_BASE_URL;
  }

  return `${API_BASE_URL}${
    normalizedPath.startsWith('/')
      ? normalizedPath
      : `/${normalizedPath}`
  }`;
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
}

export function apiEndpoint(envValue, fallbackPath) {
  const value = String(envValue || '').trim();

  if (!value) {
    return apiUrl(fallbackPath);
  }

  if (/^https?:\/\//i.test(value)) {
<<<<<<< HEAD
    return value;
  }

  return apiUrl(value);
}
=======
    return value.replace(/\/+$/, '');
  }

  return apiUrl(value);
}
>>>>>>> 6a7aa1f8d9998e3fe071562cdfcae924f28d61a6
