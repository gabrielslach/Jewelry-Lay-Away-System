import { customerRequest } from './customerRequest.js';

export function getCustomerNotifications(params = {}) {
  const search = new URLSearchParams();
  if (params.unread) {
    search.set('unread', '1');
  }
  if (params.limit) {
    search.set('limit', String(params.limit));
  }
  const query = search.toString();
  return customerRequest(`/api/customers/notifications${query ? `?${query}` : ''}`);
}

export function markCustomerNotificationsRead(ids) {
  return customerRequest('/api/customers/notifications/read', {
    method: 'POST',
    body: ids?.length ? { ids } : {},
  });
}
