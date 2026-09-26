import { request } from './http.js';
import { setCustomerSession } from './session.js';

export async function registerCustomer({ name, email, password }) {
  const data = await request('/api/customers/register', {
    method: 'POST',
    body: { name, email, password },
  });
  setCustomerSession(data);
  return data;
}
