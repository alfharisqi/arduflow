import { apiEndpoint } from './apiEndpoints.js';

const IDE_CONFIG_API_URL = apiEndpoint(
  import.meta.env.VITE_IDE_CONFIG_API_URL,
  '/api/ide-config-api.php'
);

const IDE_TOKENS_API_URL = apiEndpoint(
  import.meta.env.VITE_IDE_TOKENS_API_URL,
  '/api/ide-tokens-api.php'
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

function normalizeIdeToken(token = {}) {
  return {
    id: token.id,
    transactionId: token.transactionId ?? token.transaction_id ?? null,
    token: token.token || '',
    userId: token.userId ?? token.user_id ?? null,
    userName: token.userName || token.user_name || token.name || '',
    email: token.email || '',
    productTitle: token.productTitle || token.product_title || 'Akses ArduFlow IDE',
    status: token.status || 'active',
    isActive: Boolean(token.isActive ?? token.is_active ?? String(token.status || 'active').toLowerCase() === 'active'),
    grantedAt: token.grantedAt || token.granted_at || '',
    disabledReason: token.disabledReason || token.disabled_reason || '',
    disabledAt: token.disabledAt || token.disabled_at || '',
    disabledBy: token.disabledBy || token.disabled_by || '',
    createdAt: token.createdAt || token.created_at || '',
    updatedAt: token.updatedAt || token.updated_at || '',
  };
}

function normalizeIdeTokenPayload(payload = {}) {
  const data = payload?.data || payload || {};
  const tokens = Array.isArray(data.tokens) ? data.tokens.map(normalizeIdeToken) : [];
  const activeToken = data.activeToken ? normalizeIdeToken(data.activeToken) : tokens.find((token) => token.isActive) || null;
  const disabledToken = data.disabledToken ? normalizeIdeToken(data.disabledToken) : tokens.find((token) => !token.isActive) || null;

  return {
    tokens,
    activeToken,
    disabledToken,
    summary: data.summary || {
      total: tokens.length,
      active: tokens.filter((token) => token.isActive).length,
      disabled: tokens.filter((token) => !token.isActive).length,
    },
  };
}

async function requestIdeTokens(params = {}, options = {}) {
  const url = new URL(IDE_TOKENS_API_URL, window.location.origin);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
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
    throw new Error(payload?.message || `Gagal mengakses token IDE (${response.status}).`);
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

export async function fetchIdeTokens(filters = {}) {
  const payload = await requestIdeTokens(filters);
  return normalizeIdeTokenPayload(payload);
}

export async function fetchUserIdeTokens(user = {}) {
  const filters = {};
  if (user.userId || user.id) filters.userId = user.userId || user.id;
  if (user.email) filters.email = user.email;

  return fetchIdeTokens(filters);
}

export async function deactivateIdeToken(id, reason) {
  const payload = await requestIdeTokens(
    { id, action: 'deactivate' },
    {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    },
  );

  return normalizeIdeToken(payload?.data?.token || payload?.token || {});
}
