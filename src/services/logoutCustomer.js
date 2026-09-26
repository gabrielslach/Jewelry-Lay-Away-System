import { request } from './http.js';
import { clearCustomerSession, getCustomerRefreshToken } from './session.js';

export async function logoutCustomer() {
  try {
    await request('/api/customers/logout', {
      method: 'POST',
      body: { refresh_token: getCustomerRefreshToken() },
    });
  } catch {
    // This browser still signs out; the server-side token expires on its own.
  }
  clearCustomerSession();
}
