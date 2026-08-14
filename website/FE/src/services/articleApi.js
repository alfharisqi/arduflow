import { apiEndpoint } from './apiEndpoints.js';

const ARTICLE_API_URL = apiEndpoint(
  import.meta.env.VITE_ARTICLE_API_URL,
  '/api/article-api.php',
);

function normalizeSlide(slide, index) {
  const order = Number(slide.order || slide.slide_order || slide.display_order || index + 1);
  const imageUrl = slide.image_url || slide.image_path || slide.image?.url || '';

  return {
    id: slide.id || `slide-${order}`,
    order,
    title: slide.title || `Slide ${order}`,
    contentType: slide.content_type || slide.contentType || 'text',
    content: slide.content || slide.body_text || slide.bodyText || '',
    estimatedTime: slide.estimated_time || slide.estimatedTime || '',
    status: slide.status || 'published',
    imageName: slide.image_name || slide.image?.file_name || '',
    imageUrl,
    videoUrl: slide.video_url || slide.videoUrl || '',
  };
}

function normalizeTutorial(item) {
  const slides = Array.isArray(item.slides)
    ? item.slides
        .map(normalizeSlide)
        .sort((a, b) => a.order - b.order)
    : [];

  return {
    id: item.id,
    title: item.title || 'Materi Tanpa Judul',
    slug: item.slug || '',
    category: item.category || 'Umum',
    shortDescription: item.short_description || '',
    fullDescription: item.full_description || '',
    cardImageName: item.card_image_name || '',
    cardImageUrl: item.card_image_url || item.card_image_path || '',
    difficulty: item.difficulty_level || 'Semua Level',
    estimatedTime: item.estimated_time || '',
    pageOrder: Number(item.page_order) || 1,
    displayOrder: Number(item.display_order) || 1,
    status: item.status || 'draft',
    userLevel: item.user_level || 'semua_pengguna',
    accessRequirement: item.access_requirement || '',
    slides,
    totalSlides: Number(item.total_slides) || slides.length,
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

export async function fetchTutorialArticle(identifier) {
  const key = String(identifier || '').trim();

  if (!key) {
    throw new Error('ID tutorial tidak ditemukan di URL.');
  }

  const tutorials = await fetchTutorialArticles();
  const tutorial = tutorials.find(
    (item) => String(item.id) === key || String(item.slug || '') === key,
  );

  if (!tutorial) {
    throw new Error('Materi tutorial tidak ditemukan.');
  }

  return tutorial;
}
