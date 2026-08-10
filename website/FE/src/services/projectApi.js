import { apiEndpoint } from './apiEndpoints.js';

const PROJECT_API_URL = apiEndpoint(
  import.meta.env.VITE_PROJECT_API_URL,
  '/api/projects',
);

function normalizeList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeProject(project) {
  const tags = normalizeList(project.tags);
  const category = project.category || tags[0] || 'Proyek';

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
    tools: normalizeList(project.tools),
    viewer: Number(project.viewer) || 0,
    likes: Number(project.likes) || 0,
    saves: Number(project.saves) || 0,
    createdAt: project.createdAt || project.created_at || null,
    updatedAt: project.updatedAt || project.updated_at || null,
  };
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
