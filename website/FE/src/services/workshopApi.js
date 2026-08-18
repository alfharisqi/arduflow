import { apiEndpoint, apiUrl } from './apiEndpoints.js';

const WORKSHOP_API_URL = apiEndpoint(
  import.meta.env.VITE_WORKSHOP_API_URL,
  '/api/workshop-api.php',
);

function normalizeWorkshop(workshop) {
  const payload = workshop.payload || {};
  const schedule = payload.schedule || {};
  const publication = payload.publication || {};
  const media = payload.media || {};
  const coverImage = media.coverImage || workshop.coverImage || workshop.cover_image || null;
  const coverUrl = coverImage?.url || coverImage?.file_url || workshop.coverImageUrl || workshop.cover_image_url || '';
  const registrationFee = payload.registrationFee ?? payload.registration_fee ?? payload.price ?? workshop.registrationFee ?? workshop.registration_fee ?? '';

  return {
    id: workshop.id,
    slug: workshop.slug || payload.slug || '',
    title: workshop.title || payload.title || 'Workshop Tanpa Judul',
    summary: payload.summary || workshop.summary || '',
    description: workshop.description || payload.summary || payload.about || '',
    about: payload.about || workshop.about || '',
    level: payload.level || workshop.level || '',
    duration: payload.duration || workshop.duration || '',
    platform: payload.platform || workshop.platform || '',
    category: workshop.category || payload.category || 'Workshop',
    method: workshop.method || payload.type || '',
    location: workshop.location || payload.location || payload.platform || workshop.meetingUrl || workshop.meeting_url || '-',
    meetingUrl: workshop.meetingUrl || workshop.meeting_url || '',
    startsAt: workshop.startsAt || workshop.starts_at || workshop.start_at || schedule.date || null,
    endsAt: workshop.endsAt || workshop.ends_at || workshop.end_at || null,
    timeText: schedule.time || '',
    timezone: schedule.timezone || '',
    price: payload.price ?? workshop.price ?? '',
    registrationFee,
    facilities: payload.facilities || '',
    bringItems: payload.bringItems || '',
    capacity: Number(workshop.capacity) || 0,
    status: publication.status || workshop.status || 'draft',
    visibility: publication.visibility || workshop.visibility || 'Publik',
    certificateEnabled: Boolean(workshop.certificateEnabled || workshop.certificate_enabled),
    coverImage,
    coverImageUrl: coverUrl && !/^https?:\/\//i.test(coverUrl) && !coverUrl.startsWith('data:')
      ? apiUrl(coverUrl)
      : coverUrl,
    gallery: Array.isArray(media.gallery) ? media.gallery : [],
    raw: payload,
  };
}

export function isPublicWorkshop(workshop) {
  const status = String(workshop.status || '').toLowerCase();

  return ['published', 'terbit', 'terjadwal', 'selesai'].includes(status);
}

export async function fetchWorkshops() {
  const response = await fetch(WORKSHOP_API_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : {};

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Gagal memuat workshop. HTTP ${response.status}`);
  }

  return (payload.workshops || payload.data?.workshops || payload.data || []).map(normalizeWorkshop);
}

export async function fetchWorkshopDetail({ id, slug } = {}) {
  const cleanId = String(id || '').trim();
  const cleanSlug = String(slug || '').trim();

  if (cleanId) {
    const response = await fetch(`${WORKSHOP_API_URL}?id=${encodeURIComponent(cleanId)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    const responseText = await response.text();
    const payload = responseText ? JSON.parse(responseText) : {};

    if (!response.ok || payload.success === false) {
      throw new Error(payload.message || `Gagal memuat detail workshop. HTTP ${response.status}`);
    }

    return normalizeWorkshop(payload.workshop || payload.data?.workshop || payload.data);
  }

  if (cleanSlug) {
    const workshops = await fetchWorkshops();
    const workshop = workshops.find((item) => item.slug === cleanSlug);
    if (workshop) return workshop;
  }

  throw new Error('Workshop tidak ditemukan.');
}
