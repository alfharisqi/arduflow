import { apiEndpoint } from './apiEndpoints.js';

const PARTNER_API_URL = apiEndpoint(
  import.meta.env.VITE_PARTNER_API_URL,
  '/api/partners',
);

async function requestPartner(path = '', options = {}) {
  const url = new URL(PARTNER_API_URL, window.location.origin);
  if (path) {
    Object.entries(path).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value) !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const isFormData = options.body instanceof FormData;
  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || `Request partner gagal. HTTP ${response.status}`);
    error.errors = payload.errors || {};
    throw error;
  }

  return payload.data || {};
}

export function fetchPartners(filters = {}) {
  return requestPartner(filters);
}

export function createPartner(data) {
  return requestPartner(null, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updatePartner(id, data) {
  return requestPartner({ id }, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function uploadPartnerLogo(file) {
  const formData = new FormData();
  formData.append('logo', file);

  return requestPartner({ action: 'upload-logo' }, {
    method: 'POST',
    body: formData,
  });
}

export function deletePartner(id) {
  return requestPartner({ id }, {
    method: 'DELETE',
  });
}
