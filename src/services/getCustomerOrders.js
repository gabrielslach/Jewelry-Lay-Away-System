import { request } from './http.js';
import { getCustomerToken } from './session.js';

export async function getCustomerOrders(customerId) {
  const data = await request(`/api/customers/${customerId}/orders`, {
    token: getCustomerToken(),
  });
  const rows = data.results ?? [];
  return {
    active: rows.filter((row) => row.status !== 'completed'),
    completed: rows.filter((row) => row.status === 'completed'),
  };
}
