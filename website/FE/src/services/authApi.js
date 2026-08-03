const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

async function request(path, options = {}) {
  const { headers = {}, ...fetchOptions } = options;

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
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

export function getUserSession(token) {
  return request('/api/auth/session', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function logoutUser(token) {
  return request('/api/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function loginAdmin(payload) {
  return request('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getAdminSession(token) {
  return request('/api/admin/session', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function logoutAdmin(token) {
  return request('/api/admin/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getAdminDashboard(token = window.localStorage.getItem('arduflow_admin_token')) {
  return request('/api/admin/dashboard', {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  });
}

export function verifyEmailToken(token) {
  return request(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
}

export function requestPasswordReset(email) {
  return request('/api/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function confirmPasswordReset({ token, password }) {
  return request('/api/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
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

export function updateUserProfile(payload, token = window.localStorage.getItem('arduflow_user_token')) {
  return request('/api/auth/profile', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
    body: JSON.stringify(payload),
  });
}
