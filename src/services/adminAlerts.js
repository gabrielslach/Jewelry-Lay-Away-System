import { adminRequest } from './ensureAdminToken.js';

export function getAdminAlerts() {
  return adminRequest('/api/admin/alerts');
}

export function getAdminNotifications(params = {}) {
  const search = new URLSearchParams();
  if (params.unread) {
    search.set('unread', '1');
  }
  if (params.limit) {
    search.set('limit', String(params.limit));
  }
  const query = search.toString();
  return adminRequest(`/api/admin/notifications${query ? `?${query}` : ''}`);
}

export function markAdminNotificationsRead(ids) {
  return adminRequest('/api/admin/notifications/read', {
    method: 'POST',
    body: ids?.length ? { ids } : {},
  });
}
