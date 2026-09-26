import { adminRequest } from './ensureAdminToken.js';

export function getAdminDashboard() {
  return adminRequest('/api/admin/dashboard');
}
