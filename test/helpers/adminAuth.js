import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';
import {
  clearAdminSession,
  getAdmin,
  getAdminRefreshToken,
  getAdminToken,
  setAdminSession,
} from '../../src/services/session.js';

export async function signInAdmin(role) {
  clearAdminSession();
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
