import { apiEndpoint } from './apiEndpoints.js';

const MATERIAL_API_URL = apiEndpoint(
  import.meta.env.VITE_MATERIAL_API_URL,
  '/api/materi-api.php',
);

function normalizeSlide(slide, index) {
  const order = Number(slide.order || slide.slide_order || slide.display_order || index + 1);

  return {
    id: slide.id || `slide-${order}`,
    order,
    title: slide.title || `Materi ${order}`,
    contentType: slide.content_type || slide.contentType || 'text',
    content: slide.content || slide.body_text || slide.bodyText || '',
    estimatedTime: slide.estimated_time || slide.estimatedTime || '',
    status: slide.status || 'published',
    imageName: slide.image_name || '',
    imageUrl: slide.image_url || slide.imageUrl || '',
    videoUrl: slide.video_url || slide.videoUrl || '',
  };
}

function normalizeMaterial(item) {
  const slides = Array.isArray(item.slides)
    ? item.slides.map(normalizeSlide).sort((a, b) => a.order - b.order)
    : [];

  return {
    id: item.id,
    title: item.title || 'Materi Tanpa Judul',
    slug: item.slug || '',
    category: item.category || 'Umum',
    shortDescription: item.short_description || item.shortDescription || '',
    fullDescription: item.full_description || item.fullDescription || '',
    cardImageName: item.card_image_name || '',
    cardImageUrl: item.card_image_url || item.cardImageUrl || '',
    difficulty: item.difficulty_level || item.difficulty || 'Semua Level',
    estimatedTime: item.estimated_time || item.estimatedTime || '',
    pageOrder: Number(item.page_order || item.pageOrder) || 1,
    displayOrder: Number(item.display_order || item.displayOrder) || 1,
    status: item.status || 'draft',
    active: item.active !== false,
    showOnPage: item.show_on_page !== false,
    featured: item.featured === true || item.featured === 1 || item.featured === '1',
    comments: Number(item.comments || 0) || 0,
    featuredOrder: Number(item.featured_order || item.featuredOrder || 0) || 0,
    userLevel: item.user_level || 'semua_pengguna',
    accessRequirement: item.access_requirement || '',
    slides,
    totalSlides: Number(item.total_slides) || slides.length,
    createdAt: item.created_at || item.createdAt || null,
    updatedAt: item.updated_at || item.updatedAt || null,
  };
}

export function isPublishedMaterial(item) {
  return String(item.status || '').toLowerCase() === 'published' && item.active !== false && item.showOnPage !== false;
}

export async function fetchMaterials() {
  const response = await fetch(MATERIAL_API_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : {};

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Gagal memuat materi. HTTP ${response.status}`);
  }

  return (payload.data || payload.materials || []).map(normalizeMaterial);
}

export async function fetchMaterial(identifier) {
  const key = String(identifier || '').trim();

  if (!key) {
    throw new Error('ID materi tidak ditemukan di URL.');
  }

  const params = new URLSearchParams();
  if (/^\d+$/.test(key)) {
    params.set('id', key);
  } else {
    params.set('slug', key);
  }

  const response = await fetch(`${MATERIAL_API_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : {};

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Gagal memuat detail materi. HTTP ${response.status}`);
  }

  return normalizeMaterial(payload.data || payload.material || {});
}
