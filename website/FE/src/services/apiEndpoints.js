function resolveApiBaseUrl() {
  const deployUrl = String(
    import.meta.env.VITE_DEPLOY_URL || ''
  ).trim();

  return (
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
}

export function apiEndpoint(envValue, fallbackPath) {
  const value = String(envValue || '').trim();

  if (!value) {
    return apiUrl(fallbackPath);
  }

  if (/^https?:\/\//i.test(value)) {
    return value.replace(/\/+$/, '');
  }

  return apiUrl(value);
}