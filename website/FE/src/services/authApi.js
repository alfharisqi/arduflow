const apiBaseUrl = (
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

async function request(path, options = {}) {
  const { headers = {}, ...fetchOptions } = options;

  const endpoint = `${apiBaseUrl}${path}`;

  console.log("Request API:", endpoint);

  let response;

  try {
    response = await fetch(endpoint, {
      ...fetchOptions,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...headers,
      },
    });
  } catch (error) {
    console.error("Request API gagal:", error);

    throw new Error(
      `API tidak dapat dihubungi di ${endpoint}. ` +
        "Pastikan server PHP berjalan."
    );
  }

  const responseText = await response.text();

  console.log("HTTP Status:", response.status);
  console.log("Response mentah API:", responseText);

  if (!responseText.trim()) {
    throw new Error(
      `API mengembalikan response kosong. HTTP ${response.status}.`
    );
  }

  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Response API bukan JSON. HTTP ${response.status}: ` +
        responseText.slice(0, 300)
    );
  }

  console.log("Response JSON API:", data);

  if (!response.ok || data.success === false) {
    const apiError = new Error(
      data.message ||
        `Request gagal. HTTP ${response.status}`
    );

    apiError.status = response.status;
    apiError.errors = data.errors || {};
    apiError.data = data.data || {};
    apiError.response = data;

    throw apiError;
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| User authentication
|--------------------------------------------------------------------------
*/

export function registerUser(payload) {
  return request("/api/auth/register.php", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return request("/api/auth/login.php", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getUserSession(token) {
  return request("/api/auth/session.php", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function logoutUser(token) {
  return request("/api/auth/logout.php", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/*
|--------------------------------------------------------------------------
| Admin authentication
|--------------------------------------------------------------------------
*/

export function loginAdmin(payload) {
  return request("/api/admin/login.php", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAdminSession(token) {
  return request("/api/admin/session.php", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function logoutAdmin(token) {
  return request("/api/admin/logout.php", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getAdminDashboard(
  token = window.localStorage.getItem(
    "arduflow_admin_token"
  )
) {
  return request("/api/admin/dashboard.php", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token || ""}`,
    },
  });
}

/*
|--------------------------------------------------------------------------
| Email verification
|--------------------------------------------------------------------------
*/

export function verifyEmailToken(token) {
  return request(
    `/api/auth/verify-email.php?token=${encodeURIComponent(
      token
    )}`,
    {
      method: "GET",
    }
  );
}

/*
|--------------------------------------------------------------------------
| Password reset
|--------------------------------------------------------------------------
*/

export function requestPasswordReset(email) {
  return request(
    "/api/auth/password-reset-request.php",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    }
  );
}

export function confirmPasswordReset({
  token,
  password,
}) {
  return request(
    "/api/auth/password-reset-confirm.php",
    {
      method: "POST",
      body: JSON.stringify({
        token,
        password,
      }),
    }
  );
}

/*
|--------------------------------------------------------------------------
| Availability
|--------------------------------------------------------------------------
*/

export function checkAuthAvailability({
  email = "",
  whatsapp = "",
}) {
  const params = new URLSearchParams();

  if (email) {
    params.set("email", email);
  }

  if (whatsapp) {
    params.set("whatsapp", whatsapp);
  }

  return request(
    `/api/auth/check-availability.php?${params.toString()}`,
    {
      method: "GET",
    }
  );
}

/*
|--------------------------------------------------------------------------
| User profile
|--------------------------------------------------------------------------
*/

export function updateUserProfile(
  payload,
  token = window.localStorage.getItem(
    "arduflow_user_token"
  )
) {
  return request("/api/auth/profile.php", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token || ""}`,
    },
    body: JSON.stringify(payload),
  });
}