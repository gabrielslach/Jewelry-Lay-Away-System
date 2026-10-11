import { request } from './http.js';
import {
  clearAdminSession,
  getAdminRefreshToken,
  setAdminToken,
} from './session.js';

export async function refreshAdminToken() {
  try {
    const { access_token } = await request('/api/admin/refresh', {
      method: 'POST',
      body: { refresh_token: getAdminRefreshToken() },
    });
    setAdminToken(access_token);
    return access_token;
  } catch (err) {
    if (err.status === 401) {
      clearAdminSession();
    }
    throw err;
  }
}
