import { request } from './http.js';
import { setCustomerSession } from './session.js';

export async function loginCustomer({ email, password }) {
  const data = await request('/api/customers/login', {
    method: 'POST',
    body: { email, password },
  });
  setCustomerSession(data);
  return data;
}
