import { adminRequest } from './ensureAdminToken.js';

export async function getLayawayPlan(id) {
  return adminRequest(`/api/layaway/plans/${encodeURIComponent(id)}`);
}
