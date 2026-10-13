import { adminRequest } from './ensureAdminToken.js';

export function updateAdminStaff(id, changes) {
  return adminRequest(`/api/admin/staff/${id}`, { method: 'PATCH', body: changes });
}
