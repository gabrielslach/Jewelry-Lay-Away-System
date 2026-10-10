import { customerRequest } from './customerRequest.js';
import { request } from './http.js';
import { clearCustomerSession } from './session.js';

export function forgotCustomerPassword(email) {
  return request('/api/customers/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export function resetCustomerPassword({ token, password }) {
  return request('/api/customers/reset-password', {
    method: 'POST',
    body: { token, password },
  });
}

export async function changeCustomerPassword({ currentPassword, newPassword }) {
  return customerRequest('/api/customers/change-password', {
    method: 'POST',
    body: { current_password: currentPassword, new_password: newPassword },
  });
}

export function signOutAfterPasswordReset() {
  clearCustomerSession();
}
