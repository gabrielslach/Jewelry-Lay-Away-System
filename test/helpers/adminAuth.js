import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';
import { clearAdminSession } from '../../src/services/session.js';

export async function signInAdmin() {
  clearAdminSession();
  await ensureAdminToken();
}

export function signOutAdmin() {
  clearAdminSession();
}
