const PROJECT_API_PATH = '/api/projects-api.php';

export function getProjectApiUrl() {
  const envUrl = import.meta.env?.VITE_PROJECT_API_URL?.trim();

  if (envUrl) {
    return envUrl;
  }

  if (typeof window === 'undefined') {
    return `http://localhost:8000${PROJECT_API_PATH}`;
  }

  const { protocol, hostname } = window.location;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocalhost) {
    return `http://localhost:8000${PROJECT_API_PATH}`;
  }

  return `${protocol}//${hostname}:8000${PROJECT_API_PATH}`;
}
