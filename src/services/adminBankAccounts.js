import { adminRequest, withAdminAuth } from './ensureAdminToken.js';
import { requestForm } from './http.js';

export function getAdminBankAccounts() {
  return adminRequest('/api/admin/bank-accounts').then(
    (data) => data.results ?? data,
  );
}

function toFormData({ qrFile, removeQr, ...fields }) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  if (qrFile) {
    form.append('qr_code', qrFile);
  }
  if (removeQr) {
    form.append('remove_qr_code', 'true');
  }
  return form;
}

export function createAdminBankAccount(account) {
  return withAdminAuth((token) =>
    requestForm('/api/admin/bank-accounts', {
      token,
      formData: toFormData(account),
    }),
  );
}

export function updateAdminBankAccount(id, changes) {
  return withAdminAuth((token) =>
    requestForm(`/api/admin/bank-accounts/${id}`, {
      method: 'PATCH',
      token,
      formData: toFormData(changes),
    }),
  );
}
