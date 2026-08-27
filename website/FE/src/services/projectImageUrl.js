const DEFAULT_PROJECT_UPLOADS_URL = 'http://192.168.130.10:8000/uploads/projects/';

export const PROJECT_UPLOADS_BASE_URL =
  import.meta.env?.VITE_PROJECT_UPLOADS_URL?.trim() || DEFAULT_PROJECT_UPLOADS_URL;

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return '';
}

function getProjectImageValue(projectOrValue) {
  if (typeof projectOrValue === 'string') return projectOrValue;
  if (!projectOrValue || typeof projectOrValue !== 'object') return '';

  const coverImage = projectOrValue.coverImage;

  return firstString(
    projectOrValue.imageUrl,
    projectOrValue.image_url,
    projectOrValue.coverUrl,
    projectOrValue.cover_url,
    projectOrValue.coverPath,
    projectOrValue.cover_path,
    projectOrValue.thumbnail,
    projectOrValue.thumbnailUrl,
    projectOrValue.thumbnail_url,
    projectOrValue.image,
    typeof coverImage === 'string' ? coverImage : '',
    coverImage?.url,
    coverImage?.path,
    coverImage?.fileName,
    coverImage?.filename,
    coverImage?.name,
  );
}

export function resolveProjectImageUrl(projectOrValue, fallback = '') {
  const rawValue = getProjectImageValue(projectOrValue);

  if (!rawValue) return fallback;

  if (/^(data:image\/|blob:)/i.test(rawValue)) {
    return rawValue;
  }

  if (rawValue.startsWith('/src/') || rawValue.startsWith('/assets/')) {
    return rawValue;
  }

  const normalizedRawValue = rawValue.replace(/\\/g, '/');
  const uploadsMarker = '/uploads/projects/';
  const uploadsIndex = normalizedRawValue.toLowerCase().indexOf(uploadsMarker);
  const pathValue =
    uploadsIndex >= 0
      ? normalizedRawValue.slice(uploadsIndex + uploadsMarker.length)
      : normalizedRawValue.replace(/^https?:\/\/[^/]+\/?/i, '');

  const cleanedPath = pathValue
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^storage\/uploads\/projects\//i, '')
    .replace(/^storage\/projects\//i, '')
    .replace(/^storage\//i, '')
    .replace(/^uploads\/projects\//i, '')
    .replace(/^upload\/projects\//i, '')
    .replace(/^projects\//i, '');

  const baseUrl = PROJECT_UPLOADS_BASE_URL.replace(/\/+$/, '');
  const encodedPath = cleanedPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${baseUrl}/${encodedPath}`;
}
