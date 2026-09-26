import { customerRequest } from './customerRequest.js';

export async function getCustomerOrders(customerId) {
  const data = await customerRequest(`/api/customers/${customerId}/orders`);
  const rows = data.results ?? [];
  return {
    active: rows.filter((row) => row.status !== 'completed'),
    completed: rows.filter((row) => row.status === 'completed'),
  };
}
