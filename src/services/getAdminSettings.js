import { adminRequest } from './ensureAdminToken.js';

export function getAdminSettings() {
  return adminRequest('/api/admin/settings');
}
