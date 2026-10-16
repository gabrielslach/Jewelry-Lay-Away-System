import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';
import { loginAdmin } from '../../src/services/loginAdmin.js';
import {
  clearAdminSession,
  getAdmin,
  getAdminRefreshToken,
  getAdminToken,
  setAdminSession,
} from '../../src/services/session.js';

export async function signInAdmin(role) {
  clearAdminSession();
  if (role === 'accounting') {
    await loginAdmin({ email: 'accounting@samplejewelry.example', password: 'password' });
    return;
  }
  await ensureAdminToken();
  if (role) {
    setAdminSession({
      access_token: getAdminToken(),
      refresh_token: getAdminRefreshToken(),
      admin: { ...getAdmin(), role },
    });
  }
}

export function signOutAdmin() {
  clearAdminSession();
}
