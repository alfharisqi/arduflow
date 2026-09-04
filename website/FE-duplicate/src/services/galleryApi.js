import { API_BASE_URL, apiEndpoint } from './apiEndpoints.js';

const GALLERY_API_URL = apiEndpoint(
  import.meta.env.VITE_GALLERY_API_URL,
  '/api/galery-api.php',
);

const GALLERY_SUMMARY_MAX_LENGTH = 180;

function stripHtml(value) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = String(value || '');
  return wrapper.textContent || wrapper.innerText || '';
}

function normalizePlainText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function truncateText(value, maxLength = GALLERY_SUMMARY_MAX_LENGTH) {
  const text = normalizePlainText(value);

  if (text.length <= maxLength) {
    return text;
  }

  const clipped = text.slice(0, maxLength + 1);
  const lastSpace = clipped.lastIndexOf(' ');
  const safeText = lastSpace > Math.floor(maxLength * 0.7)
    ? clipped.slice(0, lastSpace)
    : text.slice(0, maxLength);

  return `${safeText.trim()}...`;
}

function gallerySummary(rawDescription, title) {
  const plainDescription = normalizePlainText(stripHtml(rawDescription));
  const normalizedTitle = normalizePlainText(title);
  const summarySource =
    normalizedTitle && plainDescription.toLowerCase().startsWith(normalizedTitle.toLowerCase())
      ? plainDescription.slice(normalizedTitle.length).trim()
      : plainDescription;

  return truncateText(summarySource);
}

function resolveGalleryImageUrl(item) {
  const rawUrl = String(
    item?.coverUrl ||
      item?.coverImage?.url ||
      item?.coverImage?.file_url ||
      item?.coverPath ||
      item?.coverImage?.path ||
      ''
  ).trim();

  if (!rawUrl) return '';

  if (/^(https?:\/\/|data:image\/|blob:)/i.test(rawUrl)) {
    return rawUrl;
  }

  const normalizedPath = rawUrl
    .replace(/^\/+/, '')
    .replace(/^storage\/uploads\//i, 'uploads/');

  return `${API_BASE_URL}/${normalizedPath}`;
}

function normalizeGallery(item) {
  const rawDescription = String(item.description || '');
  const title = item.title || 'Dokumentasi Kegiatan';

  return {
    id: item.id,
    title,
    tag: item.tag || 'Dokumentasi',
    description: gallerySummary(rawDescription, title),
    descriptionHtml: rawDescription,
    userName: item.userName || item.user_name || 'Admin',
    eventDate: item.eventDate || item.event_date || null,
    detailLink: item.detailLink || item.detail_link || '',
    note: item.note || '',
    imageUrl: resolveGalleryImageUrl(item),
    status: item.status || 'draft',
    createdAt: item.createdAt || item.created_at || null,
    updatedAt: item.updatedAt || item.updated_at || null,
    payload: item.payload || {},
  };
}

export function isPublishedGallery(item) {
  return String(item.status || '').toLowerCase() === 'published';
}

export async function fetchGallerySubmissions() {
  const response = await fetch(GALLERY_API_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : {};

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Gagal memuat galeri. HTTP ${response.status}`);
  }

  return (Array.isArray(payload.data) ? payload.data : []).map(normalizeGallery);
}

export async function fetchGallerySubmission(id) {
  const galleryId = String(id || '').trim();

  if (!galleryId) {
    throw new Error('ID galeri tidak tersedia.');
  }

  const url = new URL(GALLERY_API_URL);
  url.searchParams.set('id', galleryId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : {};

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Gagal memuat detail galeri. HTTP ${response.status}`);
  }

  return normalizeGallery(payload.data || {});
}
