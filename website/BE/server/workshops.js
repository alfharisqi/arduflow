import {
  createWorkshop,
  findWorkshopById,
  listWorkshops,
  softDeleteWorkshop,
  updateWorkshop,
} from './database.js';

function workshopPayload(body = {}) {
  return {
    title: String(body.title || '').trim(),
    category: String(body.category || '').trim(),
    method: String(body.method || '').trim(),
    location: String(body.location || '').trim(),
    description: String(body.description || '').trim(),
    startsAt: body.startsAt || body.starts_at || null,
    endsAt: body.endsAt || body.ends_at || null,
    capacity: body.capacity === '' || body.capacity == null ? null : Number(body.capacity),
    status: String(body.status || 'draft').trim(),
  };
}

export async function getWorkshops(_request, response) {
  response.json({ workshops: await listWorkshops() });
}

export async function getWorkshop(request, response) {
  const workshop = await findWorkshopById(Number(request.params.id));
  if (!workshop) {
    response.status(404).json({ message: 'Workshop tidak ditemukan.' });
    return;
  }
  response.json({ workshop });
}

export async function postWorkshop(request, response) {
  const payload = workshopPayload(request.body);
  if (!payload.title) {
    response.status(422).json({ message: 'Judul workshop wajib diisi.' });
    return;
  }
  if (payload.capacity != null && (!Number.isInteger(payload.capacity) || payload.capacity < 0)) {
    response.status(422).json({ message: 'Kapasitas workshop tidak valid.' });
    return;
  }
  response.status(201).json({ workshop: await createWorkshop(payload) });
}

export async function putWorkshop(request, response) {
  const id = Number(request.params.id);
  const payload = workshopPayload(request.body);
  const workshop = await updateWorkshop(id, payload);
  if (!workshop) {
    response.status(404).json({ message: 'Workshop tidak ditemukan.' });
    return;
  }
  response.json({ workshop });
}

export async function deleteWorkshop(request, response) {
  const workshop = await softDeleteWorkshop(Number(request.params.id));
  if (!workshop) {
    response.status(404).json({ message: 'Workshop tidak ditemukan.' });
    return;
  }
  response.json({ message: 'Workshop berhasil dihapus.', workshop });
}
