import { requestForm } from './http.js';
import { getCustomerToken } from './session.js';
import { refreshCustomerToken } from './refreshCustomerToken.js';

function buildForm(fields) {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      form.append(key, value);
    }
  });
  return form;
}

async function accessToken() {
  let token = getCustomerToken();
  if (!token) {
    token = await refreshCustomerToken();
  }
  return token;
}

async function submit(path, fields) {
  const token = await accessToken();
  return requestForm(path, { method: 'POST', token, formData: buildForm(fields) });
}

export function submitDownPaymentManual(planId, fields) {
  return submit(`/api/layaway/plans/${planId}/down-payment/manual`, fields);
}

export function submitInstallmentManual(planId, fields) {
  return submit(`/api/layaway/plans/${planId}/payments/manual`, fields);
}
