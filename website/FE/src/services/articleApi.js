import { apiEndpoint } from './apiEndpoints.js';

const ARTICLE_API_URL =
  apiEndpoint(import.meta.env.VITE_ARTICLE_API_URL, '/api/article-api.php');

function normalizeBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return ['1', 'true', 'yes', 'on'].includes(
    String(value).trim().toLowerCase()
  );
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map((tag) => String(tag).trim()).filter(Boolean);
      }
    } catch {
      return value
        .split(/[,;]/)
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export function normalizeArticle(item = {}) {
  return {
    id: Number(item.id || 0),
    title: String(item.title || 'Tanpa Judul'),
    slug: String(item.slug || ''),
    category: String(item.category || 'Umum'),
    author: String(item.author || 'Admin ArduFlow'),
    excerpt: String(item.excerpt || ''),
    content: String(item.content || ''),
    coverImageName: String(item.cover_image_name || ''),
    coverImageUrl: String(item.cover_image_url || ''),
    tags: normalizeTags(item.tags),
    status: String(item.status || 'draft').toLowerCase(),
    featured: normalizeBoolean(item.featured, false),
    viewer: Number(item.viewer || 0),
    publishedAt: item.published_at || null,
    createdAt: item.created_at || null,
    updatedAt: item.updated_at || null,
    raw: item,
  };
}

async function parseResponse(response) {
  const responseText = await response.text();

  if (!responseText.trim()) {
    if (!response.ok) {
      throw new Error(`API artikel mengembalikan HTTP ${response.status}.`);
    }

    return {};
  }

  let payload;

  try {
    payload = JSON.parse(responseText);
  } catch {
    const trimmed = responseText.trim();

    if (
      trimmed.startsWith('<!DOCTYPE') ||
      trimmed.startsWith('<html')
    ) {
      throw new Error(
        `article-api.php mengembalikan HTML, bukan JSON. Endpoint: ${ARTICLE_API_URL}`
      );
    }

    throw new Error(
      `Response article-api.php bukan JSON valid: ${responseText.slice(0, 180)}`
    );
  }

  if (!response.ok || payload.success === false) {
    const validationErrors =
      payload?.errors && typeof payload.errors === 'object'
        ? Object.values(payload.errors).filter(Boolean)
        : [];

    throw new Error(
      validationErrors[0] ||
        payload.message ||
        `Request artikel gagal. HTTP ${response.status}`
    );
  }

  return payload;
}

export async function fetchArticles() {
  const response = await fetch(ARTICLE_API_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const payload = await parseResponse(response);
  const rows = Array.isArray(payload.data) ? payload.data : [];

  return rows.map(normalizeArticle);
}

export async function fetchPublishedArticles() {
  const rows = await fetchArticles();

  return rows
    .filter((article) => article.status === 'published')
    .sort((first, second) => {
      const firstDate = new Date(
        first.publishedAt || first.createdAt || 0
      ).getTime();

      const secondDate = new Date(
        second.publishedAt || second.createdAt || 0
      ).getTime();

      return secondDate - firstDate;
    });
}

export async function fetchArticle(identifier, options = {}) {
  const key = String(identifier || '').trim();

  if (!key) {
    throw new Error('ID atau slug artikel tidak ditemukan.');
  }

  const params = new URLSearchParams();

  if (/^\d+$/.test(key)) {
    params.set('id', key);
  } else {
    params.set('slug', key);
  }

  const response = await fetch(
    `${ARTICLE_API_URL}?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  );

  const payload = await parseResponse(response);
  const row = Array.isArray(payload.data) ? payload.data[0] : null;

  if (!row) {
    throw new Error('Artikel tidak ditemukan.');
  }

  const article = normalizeArticle(row);

  if (options.publishedOnly && article.status !== 'published') {
    throw new Error('Artikel belum dipublikasikan.');
  }

  return article;
}

function makeArticleFormData(data, coverFile) {
  const formData = new FormData();

  const payload = {
    title: data.title,
    slug: data.slug,
    category: data.category,
    author: data.author,
    excerpt: data.excerpt,
    content: data.content,
    tags: Array.isArray(data.tags)
      ? data.tags
      : String(data.tags || '')
          .split(/[,;]/)
          .map((tag) => tag.trim())
          .filter(Boolean),
    status: data.status,
    featured: Boolean(data.featured),
    remove_cover: Boolean(data.removeCover),
  };

  formData.append('payload', JSON.stringify(payload));

  if (coverFile instanceof File) {
    formData.append('cover_image', coverFile, coverFile.name);
  }

  return formData;
}

export async function saveArticle(data, options = {}) {
  const id = options.id ? String(options.id) : '';
  const requestUrl = id
    ? `${ARTICLE_API_URL}?id=${encodeURIComponent(id)}`
    : ARTICLE_API_URL;

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: makeArticleFormData(data, options.coverFile),
    cache: 'no-store',
  });

  const payload = await parseResponse(response);

  return {
    ...payload,
    data: payload.data ? normalizeArticle(payload.data) : null,
  };
}

export async function deleteArticle(id) {
  const response = await fetch(
    `${ARTICLE_API_URL}?id=${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  );

  return parseResponse(response);
}

export async function incrementArticleView(id) {
  if (!id) return;

  try {
    await fetch(
      `${ARTICLE_API_URL}?action=view&id=${encodeURIComponent(id)}`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );
  } catch {
    // Viewer bukan proses kritis.
  }
}

export { ARTICLE_API_URL };
