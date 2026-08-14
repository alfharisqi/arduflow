import { apiEndpoint, apiUrl } from './apiEndpoints.js';

const TRANSACTION_API_URL = apiEndpoint(
  import.meta.env.VITE_TRANSACTION_API_URL,
  '/api/transactions-api.php'
);

async function requestTransactions(url, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
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
    throw new Error(payload?.message || `Gagal mengakses transaksi (${response.status}).`);
  }

  return payload;
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value).trim());
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

function normalizeTransaction(transaction) {
  if (!transaction || typeof transaction !== 'object') return null;
  const proofFile = transaction.proofFile ?? transaction.proof_file ?? null;
  const proofUrl = proofFile?.url || proofFile?.file_url || '';
  const qrisFile = transaction.qrisFile ?? transaction.qris_file ?? null;
  const qrisUrl = qrisFile?.url || qrisFile?.file_url || '';

  return {
    id: transaction.id,
    userId: transaction.userId ?? transaction.user_id ?? null,
    userName: transaction.userName ?? transaction.user_name ?? '',
    email: transaction.email ?? '',
    itemType: transaction.itemType ?? transaction.item_type ?? 'workshop',
    itemId: transaction.itemId ?? transaction.item_id ?? null,
    itemTitle: transaction.itemTitle ?? transaction.item_title ?? '',
    amount: Number(transaction.amount || 0),
    currency: transaction.currency || 'IDR',
    paymentMethod: transaction.paymentMethod ?? transaction.payment_method ?? '',
    paymentChannel: transaction.paymentChannel ?? transaction.payment_channel ?? '',
    paymentCode: transaction.paymentCode ?? transaction.payment_code ?? '',
    recipientName: transaction.recipientName ?? transaction.recipient_name ?? '',
    qrisFile: qrisFile
      ? {
          ...qrisFile,
          url: qrisUrl && !/^https?:\/\//i.test(qrisUrl) ? apiUrl(qrisUrl) : qrisUrl,
        }
      : null,
    invoiceNumber: transaction.invoiceNumber ?? transaction.invoice_number ?? '',
    referenceNumber: transaction.referenceNumber ?? transaction.reference_number ?? '',
    status: transaction.status || 'pending',
    paidAt: transaction.paidAt ?? transaction.paid_at ?? null,
    dueAt: transaction.dueAt ?? transaction.due_at ?? null,
    notes: transaction.notes || '',
    proofFile: proofFile
      ? {
          ...proofFile,
          url: proofUrl && !/^https?:\/\//i.test(proofUrl) ? apiUrl(proofUrl) : proofUrl,
        }
      : null,
    proofUploadedAt: transaction.proofUploadedAt ?? transaction.proof_uploaded_at ?? null,
    reviewedAt: transaction.reviewedAt ?? transaction.reviewed_at ?? null,
    reviewedBy: transaction.reviewedBy ?? transaction.reviewed_by ?? '',
    rejectionReason: transaction.rejectionReason ?? transaction.rejection_reason ?? '',
    payload: transaction.payload && typeof transaction.payload === 'object' ? transaction.payload : {},
    createdAt: transaction.createdAt ?? transaction.created_at ?? '',
    updatedAt: transaction.updatedAt ?? transaction.updated_at ?? '',
  };
}

export async function fetchTransactions(params = {}) {
  const payload = await requestTransactions(`${TRANSACTION_API_URL}${buildQuery(params)}`);
  const records = payload?.data?.transactions || payload?.transactions || payload?.data || [];
  return Array.isArray(records) ? records.map(normalizeTransaction).filter(Boolean) : [];
}

export async function createTransaction(data) {
  if (typeof File !== 'undefined' && data?.qrisFile instanceof File) {
    const { qrisFile, ...payloadData } = data;
    const formData = new FormData();
    formData.append('payload', JSON.stringify({ data: payloadData }));
    formData.append('qris', qrisFile);

    const payload = await requestTransactions(TRANSACTION_API_URL, {
      method: 'POST',
      body: formData,
    });
    return normalizeTransaction(payload?.data?.transaction || payload?.transaction || payload?.data);
  }

  const payload = await requestTransactions(TRANSACTION_API_URL, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
  return normalizeTransaction(payload?.data?.transaction || payload?.transaction || payload?.data);
}

export async function updateTransaction(id, data) {
  const payload = await requestTransactions(`${TRANSACTION_API_URL}?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
  return normalizeTransaction(payload?.data?.transaction || payload?.transaction || payload?.data);
}

export async function deleteTransaction(id) {
  return requestTransactions(`${TRANSACTION_API_URL}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function uploadPaymentProof(id, { proofFile, paymentMethod, paymentChannel, referenceNumber }) {
  const formData = new FormData();
  formData.append('proof', proofFile);
  formData.append('referenceNumber', referenceNumber || '');

  const payload = await requestTransactions(
    `${TRANSACTION_API_URL}?id=${encodeURIComponent(id)}&action=upload-proof`,
    {
      method: 'POST',
      body: formData,
    }
  );
  return normalizeTransaction(payload?.data?.transaction || payload?.transaction || payload?.data);
}

export async function approveTransaction(id, reviewedBy = 'Admin') {
  const payload = await requestTransactions(
    `${TRANSACTION_API_URL}?id=${encodeURIComponent(id)}&action=approve`,
    {
      method: 'POST',
      body: JSON.stringify({ data: { reviewedBy } }),
    }
  );
  return normalizeTransaction(payload?.data?.transaction || payload?.transaction || payload?.data);
}

export async function rejectTransaction(id, reason, reviewedBy = 'Admin') {
  const payload = await requestTransactions(
    `${TRANSACTION_API_URL}?id=${encodeURIComponent(id)}&action=reject`,
    {
      method: 'POST',
      body: JSON.stringify({ data: { reason, reviewedBy } }),
    }
  );
  return normalizeTransaction(payload?.data?.transaction || payload?.transaction || payload?.data);
}
