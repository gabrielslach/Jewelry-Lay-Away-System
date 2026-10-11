import { adminRequest } from './ensureAdminToken.js';

export function deleteAdminCustomerSessions(id) {
  return adminRequest(`/api/admin/customers/${id}/sessions`, { method: 'DELETE' });
}
