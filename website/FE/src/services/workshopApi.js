import { apiEndpoint } from './apiEndpoints.js';

const WORKSHOP_API_URL = apiEndpoint(
  import.meta.env.VITE_WORKSHOP_API_URL,
  '/api/workshop-api.php',
);

function normalizeWorkshop(workshop) {
  const payload = workshop.payload || {};
  const schedule = payload.schedule || {};
  const publication = payload.publication || {};

  return {
    id: workshop.id,
    title: workshop.title || payload.title || 'Workshop Tanpa Judul',
    description: workshop.description || payload.summary || payload.about || '',
    category: workshop.category || payload.category || 'Workshop',
    method: workshop.method || payload.type || '',
    location: workshop.location || payload.location || payload.platform || workshop.meetingUrl || workshop.meeting_url || '-',
    meetingUrl: workshop.meetingUrl || workshop.meeting_url || '',
    startsAt: workshop.startsAt || workshop.starts_at || workshop.start_at || schedule.date || null,
    endsAt: workshop.endsAt || workshop.ends_at || workshop.end_at || null,
    timeText: schedule.time || '',
    capacity: Number(workshop.capacity) || 0,
    status: publication.status || workshop.status || 'draft',
    visibility: publication.visibility || workshop.visibility || 'Publik',
    certificateEnabled: Boolean(workshop.certificateEnabled || workshop.certificate_enabled),
  };
}

export function isPublicWorkshop(workshop) {
  const status = String(workshop.status || '').toLowerCase();
  const visibility = String(workshop.visibility || '').toLowerCase();

  return ['published', 'terbit', 'terjadwal', 'selesai'].includes(status) && visibility !== 'privat';
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
