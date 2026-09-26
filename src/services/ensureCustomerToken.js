import { request } from './http.js';
import { getCustomerToken, setCustomerSession } from './session.js';

export async function ensureCustomerToken() {
  const existing = getCustomerToken();
  if (existing) {
    return existing;
  }
  const data = await request('/api/dev/session/customer', { method: 'POST', body: {} });
  setCustomerSession(data);
  return data.token;
}
