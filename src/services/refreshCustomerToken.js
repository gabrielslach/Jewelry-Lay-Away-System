import { request } from './http.js';
import {
  clearCustomerSession,
  getCustomerRefreshToken,
  setCustomerToken,
} from './session.js';

export async function refreshCustomerToken() {
  try {
    const { access_token } = await request('/api/customers/refresh', {
      method: 'POST',
      body: { refresh_token: getCustomerRefreshToken() },
    });
    setCustomerToken(access_token);
    return access_token;
  } catch (err) {
    if (err.status === 401) {
      clearCustomerSession();
    }
    throw err;
  }
}
