import { request } from './http.js';

export async function getLayawayPlan(id) {
  return request(`/api/layaway/plans/${encodeURIComponent(id)}`);
}
