import { customerRequest } from './customerRequest.js';

export function cancelLayawayPlan(planId) {
  return customerRequest(`/api/layaway/plans/${encodeURIComponent(planId)}/cancel`, {
    method: 'POST',
  });
}
