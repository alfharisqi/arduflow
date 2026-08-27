import { apiEndpoint } from './apiEndpoints.js';

const IDE_CONFIG_API_URL = apiEndpoint(
  import.meta.env.VITE_IDE_CONFIG_API_URL,
  '/api/ide-config-api.php'
);

function normalizeIdeConfig(config = {}) {
  return {
    title: config.title || 'Akses ArduFlow IDE',
    price: Number(config.price ?? 150000),
    currency: config.currency || 'IDR',
    durationDays: Number(config.durationDays ?? config.duration_days ?? 365),
    isActive: Boolean(config.isActive ?? config.is_active ?? true),
    description:
      config.description ||
      'Akses visual programming ArduFlow IDE untuk membuat dan mengelola project Arduino dan IoT.',
    updatedAt: config.updatedAt ?? config.updated_at ?? '',
  };
}

async function requestIdeConfig(options = {}) {
  const response = await fetch(IDE_CONFIG_API_URL, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || `Gagal mengakses konfigurasi IDE (${response.status}).`);
  }

  return payload;
}

export async function fetchIdeConfig() {
  const payload = await requestIdeConfig();
  return normalizeIdeConfig(payload?.data?.config || payload?.config || payload?.data);
}

export async function updateIdeConfig(data) {
  const payload = await requestIdeConfig({
    method: 'PUT',
    body: JSON.stringify({ data }),
  });

  return normalizeIdeConfig(payload?.data?.config || payload?.config || payload?.data);
}
