import { apiEndpoint } from './apiEndpoints.js';

const TESTIMONIAL_API_URL = apiEndpoint(
  import.meta.env.VITE_TESTIMONIAL_API_URL,
  '/api/testimonials',
);

async function requestTestimonials(filters = {}, options = {}) {
  const url = new URL(TESTIMONIAL_API_URL, window.location.origin);
  Object.entries(filters || {}).forEach(([key, value]) => {
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
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || `Request testimoni gagal. HTTP ${response.status}`);
    error.errors = payload.errors || {};
    throw error;
  }

  return payload.data || {};
}

export function fetchTestimonials(filters = {}) {
  return requestTestimonials(filters);
}

export function createTestimonial(data) {
  return requestTestimonials({}, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateTestimonial(id, data) {
  return requestTestimonials({ id }, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteTestimonial(id) {
  return requestTestimonials({ id }, {
    method: 'DELETE',
  });
}
