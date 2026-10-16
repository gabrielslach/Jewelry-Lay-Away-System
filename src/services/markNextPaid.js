import { adminRequest } from './ensureAdminToken.js';

export function markNextPaid(planId) {
  return adminRequest(`/api/admin/plans/${planId}/mark-next-paid`, { method: 'POST', body: {} });
}
