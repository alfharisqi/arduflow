const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request gagal.');
  }

  return data;
}

export function registerUser(payload) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function verifyEmailToken(token) {
  return request(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export function checkAuthAvailability({ email = '', whatsapp = '' }) {
  const params = new URLSearchParams();

  if (email) {
    params.set('email', email);
  }

  if (whatsapp) {
    params.set('whatsapp', whatsapp);
  }

  return request(`/api/auth/check-availability?${params.toString()}`);
}

export function updateUserProfile(payload) {
  return request('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
