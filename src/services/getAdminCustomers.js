import { adminRequest } from './ensureAdminToken.js';

export async function getAdminCustomers() {
  const data = await adminRequest('/api/admin/customers');
  return data.results ?? [];
}
