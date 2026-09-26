import { describe, expect, it, vi } from 'vitest';
import { getCustomerOrders } from '../../src/services/getCustomerOrders.js';
import { loginCustomer } from '../../src/services/loginCustomer.js';

describe('getCustomerOrders', () => {
  it('loads the token-scoped list, splits status, and formats display fields', async () => {
    await loginCustomer({
      email: 'client@sampleemail.com',
      password: 'password',
    });
    const fetchSpy = vi.fn(globalThis.fetch);
    vi.stubGlobal('fetch', fetchSpy);

    const orders = await getCustomerOrders();
    expect(fetchSpy.mock.calls.some(([url]) => url === '/api/customers/orders')).toBe(true);
    expect(fetchSpy.mock.calls.some(([url]) => String(url).includes('/api/customers/1/'))).toBe(
      false,
    );

    const active = orders.active.find((row) => row.id === 1001);
    expect(active).toMatchObject({
      item_name: 'Solitaire Halo Ring',
      plan_label: '3 Mo. / 6 Payments',
      status: 'ok',
      next_due: 'Oct 25',
    });
    expect(active.installments.length).toBeGreaterThan(0);

    const completed = orders.completed.find((row) => row.id === 987);
    expect(completed).toMatchObject({
      item_name: 'Vintage Rose Pendant',
      status: 'completed',
      completed_on: 'Jul 2026',
    });
  });
});
