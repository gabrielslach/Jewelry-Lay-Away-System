import { adminRequest } from './ensureAdminToken.js';

export async function getAdminStaff() {
  const data = await adminRequest('/api/admin/staff');
  return data ?? [];
}
