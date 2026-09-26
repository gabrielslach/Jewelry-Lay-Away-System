import { adminRequest } from './ensureAdminToken.js';

export function getAdminCustomer(id) {
  return adminRequest(`/api/admin/customers/${id}`);
}
