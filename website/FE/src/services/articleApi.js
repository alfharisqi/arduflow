import { apiEndpoint } from './apiEndpoints.js';

const ARTICLE_API_URL = apiEndpoint(
  import.meta.env.VITE_ARTICLE_API_URL,
  '/api/article-api.php',
);

function normalizeTutorial(item) {
  return {
    id: item.id,
    title: item.title || 'Materi Tanpa Judul',
    slug: item.slug || '',
    category: item.category || 'Umum',
    shortDescription: item.short_description || '',
    fullDescription: item.full_description || '',
    cardImageName: item.card_image_name || '',
    difficulty: item.difficulty_level || 'Semua Level',
    estimatedTime: item.estimated_time || '',
    pageOrder: Number(item.page_order) || 1,
    displayOrder: Number(item.display_order) || 1,
    status: item.status || 'draft',
    userLevel: item.user_level || 'semua_pengguna',
    accessRequirement: item.access_requirement || '',
    slides: Array.isArray(item.slides) ? item.slides : [],
    totalSlides: Number(item.total_slides) || 0,
    createdAt: item.created_at || null,
    updatedAt: item.updated_at || null,
  };
}

export function isPublishedTutorial(item) {
  return String(item.status || '').toLowerCase() === 'published';
}

export async function fetchTutorialArticles() {
  const response = await fetch(ARTICLE_API_URL, {
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

  return (payload.data || payload.articles || []).map(normalizeTutorial);
}
