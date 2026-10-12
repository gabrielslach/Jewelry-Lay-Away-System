import { request } from './http.js';
import { setCustomerSession } from './session.js';

export async function registerCustomer({ name, email, phone, password }) {
  const data = await request('/api/customers/register', {
    method: 'POST',
    body: { name, email, phone, password },
  });
  setCustomerSession(data);
  return data;
}
