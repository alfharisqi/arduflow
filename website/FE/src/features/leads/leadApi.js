export async function submitLead(payload) {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  const response = await fetch(`${apiUrl}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.message || 'Form gagal dikirim.');
  }

  return body;
}
