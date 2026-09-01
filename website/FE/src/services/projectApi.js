import { API_BASE_URL, apiEndpoint } from './apiEndpoints.js';

const PROJECT_API_URL = apiEndpoint(
  import.meta.env.VITE_PROJECT_API_URL,
  '/api/projects-api.php',
);

function normalizeList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function resolveFileUrl(file) {
  const rawUrl = String(file?.file_url || file?.url || file?.src || '').trim();

  if (!rawUrl) {
    return '';
  }

  if (/^https?:\/\//i.test(rawUrl) || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    return rawUrl;
  }

  return `${API_BASE_URL}${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`;
}

function normalizeProject(project) {
  const tags = normalizeList(project.tags);
  const category = project.category || tags[0] || 'Proyek';
  const coverImage = project.coverImage || project.cover_image || project.image || null;
  const projectFile = project.projectFile || project.project_file || null;
  const circuitImage = project.circuitImage || project.circuit_image || null;
  const viewerAccess = project.viewerAccess || project.viewer_access || {};

  const tools = normalizeList(project.tools).map((tool) => {
    if (!tool || typeof tool !== 'object') return tool;

    return {
      ...tool,
      imageUrl: resolveFileUrl(tool.image),
    };
  });

  return {
    id: project.id,
    title: project.title || 'Tanpa Judul',
    category,
    description: project.description || 'Belum ada deskripsi proyek.',
    status: project.status || 'draft',
    visibility: project.visibility || 'draft',
    ownerName: project.ownerName || 'User',
    difficulty: project.difficulty || 'Pemula',
    estimatedTime: project.estimatedTime || '',
    tags: tags.length ? tags : [category],
    tools,
    nodes: normalizeList(project.nodes).map((node) => {
      if (!node || typeof node !== 'object') return node;

      return {
        ...node,
        imageUrl: resolveFileUrl(node.image),
      };
    }),
    steps: normalizeList(project.steps),
    coverImage,
    coverImageUrl: resolveFileUrl(coverImage),
    circuitImage,
    circuitImageUrl: resolveFileUrl(circuitImage),
    projectFile,
    projectFileUrl: resolveFileUrl(projectFile),
    projectFiles: normalizeList(project.projectFiles || project.project_files).map((entry) => ({
      ...entry,
      fileUrl: resolveFileUrl(entry?.file || entry),
    })),
    projectArchiveUrl: project.id
      ? `${PROJECT_API_URL}${PROJECT_API_URL.includes('?') ? '&' : '?'}id=${encodeURIComponent(project.id)}&action=download`
      : '',
    programmingLanguage: project.programmingLanguage || '',
    payment: project.payment || null,
    viewerAccess,
    hasPurchased: Boolean(
      project.hasPurchased ||
      project.has_purchased ||
      viewerAccess.hasPurchased ||
      viewerAccess.has_purchased
    ),
    viewer: Number(project.viewer) || 0,
    likes: Number(project.likes) || 0,
    saves: Number(project.saves) || 0,
    shares: Number(project.shares) || 0,
    comments: Number(project.comments) || 0,
    commentItems: normalizeList(project.commentItems || project.comment_items || project.commentList || project.comment_list),
    averageRating: Math.min(5, Math.max(0, Number(project.averageRating || project.average_rating || 0))),
    ratingCount: Number(project.ratingCount || project.rating_count || 0),
    viewerRating: Number(project.viewerRating || project.viewer_rating || 0),
    viewerReview: project.viewerReview || project.viewer_review || null,
    categoryAverages: project.categoryAverages || project.category_averages || {},
    ratingItems: normalizeList(project.ratingItems || project.rating_items || project.ratings),
    createdAt: project.createdAt || project.created_at || null,
    updatedAt: project.updatedAt || project.updated_at || null,
    payload: project.payload || {},
  };
}

export async function updateProjectRating(id, rating, params = {}) {
  const projectId = String(id || '').trim();
  const ratingPayload = rating && typeof rating === 'object' ? rating : { value: rating };
  const value = Number(ratingPayload.value ?? ratingPayload.rating);

  if (!projectId) {
    throw new Error('ID proyek tidak tersedia.');
  }

  if (!Number.isFinite(value) || value < 1 || value > 5) {
    throw new Error('Rating harus bernilai 1 sampai 5.');
  }

  const url = new URL(PROJECT_API_URL, window.location.origin);
  url.searchParams.set('id', projectId);
  url.searchParams.set('action', 'rating');
  Object.entries(params).forEach(([key, paramValue]) => {
    if (paramValue !== undefined && paramValue !== null && String(paramValue).trim() !== '') {
      url.searchParams.set(key, String(paramValue).trim());
    }
  });

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...ratingPayload,
      value,
    }),
  });
  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : {};

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Gagal menyimpan rating proyek. HTTP ${response.status}`);
  }

  return normalizeProject(payload.data?.project || payload.project || payload.data || {});
}

export async function deleteProjectRating(id, params = {}) {
  const projectId = String(id || '').trim();

  if (!projectId) {
    throw new Error('ID proyek tidak tersedia.');
  }

  const url = new URL(PROJECT_API_URL, window.location.origin);
  url.searchParams.set('id', projectId);
  url.searchParams.set('action', 'rating');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value).trim());
    }
  });

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : {};

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Gagal menghapus rating proyek. HTTP ${response.status}`);
  }

  return normalizeProject(payload.data?.project || payload.project || payload.data || {});
}

export async function addProjectComment(id, comment, params = {}) {
  const projectId = String(id || '').trim();

  if (!projectId) {
    throw new Error('ID proyek tidak tersedia.');
  }

  const url = new URL(PROJECT_API_URL, window.location.origin);
  url.searchParams.set('id', projectId);
  url.searchParams.set('action', 'comment');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value).trim());
    }
  });

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(comment),
  });
  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : {};

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Gagal menyimpan komentar proyek. HTTP ${response.status}`);
  }

  return normalizeProject(payload.data?.project || payload.project || payload.data || {});
}

export async function updateProjectInteraction(id, type, active = true, params = {}) {
  const projectId = String(id || '').trim();

  if (!projectId) {
    throw new Error('ID proyek tidak tersedia.');
  }

  const url = new URL(PROJECT_API_URL, window.location.origin);
  url.searchParams.set('id', projectId);
  url.searchParams.set('action', 'interaction');
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value).trim());
    }
  });

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, active }),
  });
  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : {};

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Gagal memperbarui interaksi proyek. HTTP ${response.status}`);
  }

  return normalizeProject(payload.data?.project || payload.project || payload.data || {});
}

export function isPublicProject(project) {
  const status = String(project.status || '').toLowerCase();
  const visibility = String(project.visibility || '').toLowerCase();

  return status === 'published' && !['draft', 'private'].includes(visibility);
}

export async function fetchProjectSubmissions() {
  const response = await fetch(PROJECT_API_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : {};

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Gagal memuat proyek. HTTP ${response.status}`);
  }

  return (payload.data || []).map(normalizeProject);
}

export async function fetchProjectSubmission(id, params = {}) {
  const projectId = String(id || '').trim();

  if (!projectId) {
    throw new Error('ID proyek tidak tersedia.');
  }

  const url = new URL(PROJECT_API_URL, window.location.origin);
  url.searchParams.set('id', projectId);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      url.searchParams.set(key, String(value).trim());
    }
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : {};

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Gagal memuat detail proyek. HTTP ${response.status}`);
  }

  return normalizeProject(payload.data || payload.project || {});
}
