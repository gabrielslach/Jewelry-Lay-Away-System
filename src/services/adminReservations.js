import { adminRequest } from './ensureAdminToken.js';

export function retryReservation(planId) {
  return adminRequest(`/api/admin/plans/${planId}/reservation/retry`, { method: 'POST', body: {} });
}

export function cancelReservation(planId, { reason, handoffConfirmed }) {
  return adminRequest(`/api/admin/plans/${planId}/reservation/cancel`, {
    method: 'POST',
    body: { reason, handoff_confirmed: handoffConfirmed },
  });
}
