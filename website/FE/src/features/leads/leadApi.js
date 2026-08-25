const DEFAULT_API_URL = "http://127.0.0.1:8000";

function getApiUrl() {
  return (
    import.meta.env.VITE_API_URL || DEFAULT_API_URL
  ).replace(/\/$/, "");
}

async function postJson(
  payload,
  defaultErrorMessage
) {
  const endpoint = `${getApiUrl()}/api/formhandle.php`;

  console.log("Mengirim request ke:", endpoint);
  console.log("Payload request:", payload);

  const isFormData = payload instanceof FormData;
  let response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(isFormData
          ? {}
          : { "Content-Type": "application/json" }),
      },
      body: isFormData ? payload : JSON.stringify(payload),
    });
  } catch (fetchError) {
    console.error("Fetch gagal:", fetchError);

    throw new Error(
      `API tidak dapat dihubungi di ${endpoint}. ` +
        "Pastikan server PHP berjalan."
    );
  }

  const responseText = await response.text();

  console.log("Status API:", response.status);
  console.log("Response mentah:", responseText);

  let body = {};

  try {
    body = responseText
      ? JSON.parse(responseText)
      : {};
  } catch {
    throw new Error(
      `Response API bukan JSON. HTTP ${response.status}: ` +
        responseText.slice(0, 300)
    );
  }

  if (!response.ok || body.success === false) {
    const detail =
      body?.data?.detail ||
      body?.errors?.detail ||
      body?.detail ||
      "";

    const databasePath =
      body?.data?.database_path ||
      body?.database_path ||
      "";

    const messageParts = [
      body?.message ||
        `${defaultErrorMessage} HTTP ${response.status}`,
    ];

    if (detail) {
      messageParts.push(`Detail: ${detail}`);
    }

    if (databasePath) {
      messageParts.push(`Database: ${databasePath}`);
    }

    const apiError = new Error(
      messageParts.join(" ")
    );

    apiError.status = response.status;
    apiError.errors = body?.errors || {};
    apiError.data = body?.data || {};
    apiError.response = body;

    throw apiError;
  }

  return body;
}

export function submitLead(payload) {
  return postJson(
    {
      ...payload,
      form_type: "lead",
    },
    "Form leads gagal dikirim."
  );
}

export function submitCollaboration(payload) {
  if (payload instanceof FormData) {
    payload.set("form_type", "collaboration");

    return postJson(
      payload,
      "Permintaan kolaborasi gagal dikirim."
    );
  }

  return postJson(
    {
      ...payload,
      form_type: "collaboration",
    },
    "Permintaan kolaborasi gagal dikirim."
  );
}

export function submitWorkshop(payload) {
  return postJson(
    {
      ...payload,
      form_type: "workshop",
    },
    "Pendaftaran workshop gagal dikirim."
  );
}
