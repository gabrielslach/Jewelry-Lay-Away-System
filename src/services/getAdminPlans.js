import { adminRequest } from './ensureAdminToken.js';

export async function getAdminPlans() {
  const data = await adminRequest('/api/admin/plans');
  return data.results ?? [];
}
