import { API_BASE_URL, apiEndpoint } from './apiEndpoints.js';

const GALLERY_API_URL = apiEndpoint(
  import.meta.env.VITE_GALLERY_API_URL,
  '/api/galery-api.php',
);

function stripHtml(value) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = String(value || '');
  return wrapper.textContent || wrapper.innerText || '';
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

  return {
    id: item.id,
    title: item.title || 'Dokumentasi Kegiatan',
    tag: item.tag || 'Dokumentasi',
    description: stripHtml(rawDescription),
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
