import { adminRequest } from './ensureAdminToken.js';

export function changeAdminPassword({ currentPassword, newPassword }) {
  return adminRequest('/api/admin/change-password', {
    method: 'POST',
    body: { current_password: currentPassword, new_password: newPassword },
  });
}
