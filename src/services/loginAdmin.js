import { request } from './http.js';
import { setAdminSession } from './session.js';

export async function loginAdmin({ email, password }) {
  const data = await request('/api/admin/login', {
    method: 'POST',
    body: { email, password },
  });
  setAdminSession(data);
  return data;
}
