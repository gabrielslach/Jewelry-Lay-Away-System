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
    expect(active).toMatchObject({ term_months: 3, installment_count: 6, is_reconstructed: false });
    expect(active.financed_principal).toBeGreaterThan(0);
    expect(active.total_payable).toBeGreaterThan(active.amount_paid);
    expect(active).not.toHaveProperty('image_url');

    const completed = orders.completed.find((row) => row.id === 987);
    expect(completed).toMatchObject({
      item_name: 'Vintage Rose Pendant',
      status: 'completed',
      completed_on: 'Jul 2026',
    });
  });

  it('labels plans from the real installment count and passes is_reconstructed through', async () => {
    await loginCustomer({ email: 'buyer@sampleemail.com', password: 'password' });
    const orders = await getCustomerOrders();
    const rebuilt = orders.active.find((row) => row.id === 1002);
    expect(rebuilt.is_reconstructed).toBe(true);
    expect(rebuilt.plan_label).toBe('2 Mo. / 4 Payments');
  });

  it('groups cancelled and defaulted plans as closed, keeping their status', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    const orders = await getCustomerOrders();
    expect(orders.closed.map((row) => [row.id, row.status])).toEqual([[988, 'cancelled']]);
    expect(orders.active.some((row) => row.id === 988)).toBe(false);
    expect(orders.completed.some((row) => row.id === 988)).toBe(false);
  });
});
