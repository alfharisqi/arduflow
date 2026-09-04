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
    nodes: normalizeList(project.nodes),
    steps: normalizeList(project.steps),
    coverImage,
    coverImageUrl: resolveFileUrl(coverImage),
    circuitImage,
    circuitImageUrl: resolveFileUrl(circuitImage),
    projectFile,
    projectFileUrl: resolveFileUrl(projectFile),
    programmingLanguage: project.programmingLanguage || '',
    payment: project.payment || null,
    viewer: Number(project.viewer) || 0,
    likes: Number(project.likes) || 0,
    saves: Number(project.saves) || 0,
    createdAt: project.createdAt || project.created_at || null,
    updatedAt: project.updatedAt || project.updated_at || null,
    payload: project.payload || {},
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

export async function fetchProjectSubmission(id) {
  const projectId = String(id || '').trim();

  if (!projectId) {
    throw new Error('ID proyek tidak tersedia.');
  }

  const url = new URL(PROJECT_API_URL);
  url.searchParams.set('id', projectId);

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
