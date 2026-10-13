import { adminRequest } from './ensureAdminToken.js';

export function createAdminStaff({ name, email, password, role }) {
  return adminRequest('/api/admin/staff', {
    method: 'POST',
    body: { name, email, password, role },
  });
}
