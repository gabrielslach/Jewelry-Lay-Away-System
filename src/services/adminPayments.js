import { adminRequest, withAdminAuth } from './ensureAdminToken.js';
import { requestForm } from './http.js';

export function getAdminPendingPayments() {
  return adminRequest('/api/admin/payments/pending').then((data) => data.results ?? data);
}

export function getAdminDuePayments() {
  return adminRequest('/api/admin/payments/due');
}

export function getPaymentProofUrl(paymentId) {
  const base = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');
  const path = `/api/admin/payments/${paymentId}/proof`;
  return base ? `${base}${path}` : path;
}

export async function fetchPaymentProof(paymentId) {
  return adminRequest(`/api/admin/payments/${paymentId}/proof`);
}

function staffForm(fields, fileField, file) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, value);
    }
  });
  if (file) {
    form.append(fileField, file);
  }
  return form;
}

export async function confirmAdminPayment(paymentId, { note, confirmerProof } = {}) {
  if (confirmerProof) {
    return withAdminAuth((token) =>
      requestForm(`/api/admin/payments/${paymentId}/confirm`, {
        method: 'POST',
        token,
        formData: staffForm({ note }, 'confirmer_proof', confirmerProof),
      }),
    );
  }
  return adminRequest(`/api/admin/payments/${paymentId}/confirm`, {
    method: 'POST',
    body: note ? { note } : {},
  });
}

export async function rejectAdminPayment(paymentId, { reason, confirmerProof } = {}) {
  if (confirmerProof) {
    return withAdminAuth((token) =>
      requestForm(`/api/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        token,
        formData: staffForm({ reason }, 'confirmer_proof', confirmerProof),
      }),
    );
  }
  return adminRequest(`/api/admin/payments/${paymentId}/reject`, {
    method: 'POST',
    body: { reason },
  });
}
