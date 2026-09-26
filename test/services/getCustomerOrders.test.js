import { describe, expect, it } from 'vitest';
import { getCustomerOrders } from '../../src/services/getCustomerOrders.js';
import { loginCustomer } from '../../src/services/loginCustomer.js';

describe('getCustomerOrders', () => {
  it('splits active and completed plans', async () => {
    const { customer } = await loginCustomer({
      email: 'client@sampleemail.com',
      password: 'password',
    });
    const orders = await getCustomerOrders(customer.id);
    expect(orders.active.some((row) => row.id === 'LA-1001')).toBe(true);
    expect(orders.completed.some((row) => row.id === 'LA-0987')).toBe(true);
  });
});
