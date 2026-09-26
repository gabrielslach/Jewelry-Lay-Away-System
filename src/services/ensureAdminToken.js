import { request } from './http.js';
import { getAdminToken, setAdminSession } from './session.js';

export async function ensureAdminToken() {
  const existing = getAdminToken();
  if (existing) {
    return existing;
  }
  const data = await request('/api/dev/session/admin', { method: 'POST', body: {} });
  setAdminSession(data);
  return data.token;
}

export async function adminRequest(path, options = {}) {
  const token = await ensureAdminToken();
  return request(path, { ...options, token });
}
