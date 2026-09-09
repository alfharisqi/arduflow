function resolveApiBaseUrl() {
  const apiUrl = String(
    import.meta.env.VITE_API_URL || ''
  ).trim();

  const deployUrl = String(
    import.meta.env.VITE_DEPLOY_URL || ''
  ).trim();

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

export function backendAssetUrl(value) {
  const rawUrl = String(value || '').trim();

  if (!rawUrl) {
    return '';
  }

  if (/^(data:image\/|blob:)/i.test(rawUrl)) {
    return rawUrl;
  }

  if (/^https?:\/\//i.test(rawUrl)) {
    try {
      const parsedUrl = new URL(rawUrl);
      const isLocalBackend =
        ['127.0.0.1', 'localhost'].includes(parsedUrl.hostname) &&
        ['8000', '8001', ''].includes(parsedUrl.port);

      if (isLocalBackend && parsedUrl.pathname.startsWith('/uploads/')) {
        return apiUrl(parsedUrl.pathname);
      }

      return rawUrl;
    } catch {
      return rawUrl;
    }
  }

  const normalizedPath = rawUrl
    .replace(/^\/+/, '')
    .replace(/^storage\/uploads\//i, 'uploads/');

  return apiUrl(normalizedPath);
}
