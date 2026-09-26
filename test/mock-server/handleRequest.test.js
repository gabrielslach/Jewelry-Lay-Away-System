import { describe, expect, it } from 'vitest';
import { createStore, handleRequest } from '../../mock-server/handleRequest.js';

function call(store, method, url, opts = {}) {
  return handleRequest(store, { method, url, ...opts });
}

describe('mock API', () => {
  it('paginates gallery with at least two pages', () => {
    const store = createStore();
    const page1 = call(store, 'GET', '/api/gallery?page=1&page_size=12');
    expect(page1.status).toBe(200);
    expect(page1.body.count).toBeGreaterThanOrEqual(24);
    expect(page1.body.results).toHaveLength(12);
    expect(page1.body.next).toContain('page=2');
    expect(page1.body.results[0].name).toBe('Solitaire Halo Ring');
    expect(page1.body.results[0].images.length).toBeGreaterThanOrEqual(2);
  });

  it('returns a single piece or 404', () => {
    const store = createStore();
    expect(call(store, 'GET', '/api/gallery/1').body.title).toBe('PJ17414');
    expect(call(store, 'GET', '/api/gallery/999').status).toBe(404);
  });

  it('logs in Sample Client and lists active and completed orders', () => {
    const store = createStore();
    const login = call(store, 'POST', '/api/customers/login', {
      body: { email: 'client@sampleemail.com', password: 'password' },
    });
    expect(login.body.customer.member_since).toBe('Jan 2026');
    const orders = call(store, 'GET', '/api/customers/1/orders', {
      headers: { authorization: `Bearer ${login.body.token}` },
    });
    expect(orders.status).toBe(200);
    expect(orders.body.results.some((row) => row.id === 'LA-1001')).toBe(true);
    expect(orders.body.results.some((row) => row.id === 'LA-0987')).toBe(true);
  });

  it('rejects another customer token with 403', () => {
    const store = createStore();
    const login = call(store, 'POST', '/api/customers/login', {
      body: { email: 'buyer@sampleemail.com', password: 'password' },
    });
    const orders = call(store, 'GET', '/api/customers/1/orders', {
      headers: { authorization: `Bearer ${login.body.token}` },
    });
    expect(orders.status).toBe(403);
  });

  it('creates a plan when authenticated and 501s the live gateway', () => {
    const store = createStore();
    const session = call(store, 'POST', '/api/dev/session/customer', { body: {} });
    const created = call(store, 'POST', '/api/layaway/plans', {
      headers: { authorization: `Bearer ${session.body.token}` },
      body: {
        product_id: 1,
        term_months: 3,
        installment_dates: ['2026-10-01', '2026-10-15'],
      },
    });
    expect(created.status).toBe(201);
    expect(created.body.installments).toHaveLength(2);
    const gateway = call(store, 'POST', `/api/layaway/plans/${created.body.id}/payments`, {
      headers: { authorization: `Bearer ${session.body.token}` },
      body: {},
    });
    expect(gateway.status).toBe(501);
    const mockPay = call(
      store,
      'POST',
      `/api/layaway/plans/${created.body.id}/payments/mock-gateway`,
      {
        headers: { authorization: `Bearer ${session.body.token}` },
        body: { method: 'gcash' },
      },
    );
    expect(mockPay.body.status).toBe('reserved');
  });

  it('requires admin auth for dashboard and includes Sample Shopper', () => {
    const store = createStore();
    expect(call(store, 'GET', '/api/admin/dashboard').status).toBe(401);
    const session = call(store, 'POST', '/api/dev/session/admin', { body: {} });
    const auth = { authorization: `Bearer ${session.body.token}` };
    const dash = call(store, 'GET', '/api/admin/dashboard', { headers: auth });
    expect(dash.body.active_layaways).toBe(5);
    expect(dash.body.collected_this_month).toBe(184200);
    const customers = call(store, 'GET', '/api/admin/customers', { headers: auth });
    expect(customers.body.results.some((row) => row.name === 'Sample Shopper')).toBe(true);
  });

  it('rate-limits login after 10 attempts', () => {
    const store = createStore();
    let last;
    for (let i = 0; i < 11; i += 1) {
      last = call(store, 'POST', '/api/customers/login', {
        ip: '1.1.1.1',
        body: { email: 'nobody@x.com', password: 'no' },
      });
    }
    expect(last.status).toBe(429);
  });
});
