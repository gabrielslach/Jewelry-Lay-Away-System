import { adminRequest } from './ensureAdminToken.js';

export function putAdminSettings(settings) {
  return adminRequest('/api/admin/settings', { method: 'PUT', body: settings });
}
