import { describe, expect, it } from 'vitest';
import galleryPage from '../../mock-server/gallery-items.json';
import { createStore, handleRequest } from '../../mock-server/handleRequest.js';

const firstPiece = galleryPage.results[0];

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
    expect(page1.body.results[0].title).toBe(firstPiece.title);
    expect(page1.body.results[0].images[0].url).toBe(firstPiece.images[0].url);
    expect(page1.body.results[0].images[0].url).toContain('digitaloceanspaces.com');
  });

  it('returns a single piece or 404', () => {
    const store = createStore();
    expect(call(store, 'GET', `/api/gallery/${firstPiece.id}`).body.title).toBe(
      firstPiece.title,
    );
    expect(call(store, 'GET', '/api/gallery/999').status).toBe(404);
  });

  it('logs in Sample Client and lists active and completed orders', () => {
    const store = createStore();
    const login = call(store, 'POST', '/api/customers/login', {
      body: { email: 'client@sampleemail.com', password: 'password' },
    });
    expect(login.body.customer.member_since).toBe('Jan 2026');
    expect(call(store, 'GET', '/api/customers/orders').status).toBe(401);
    const orders = call(store, 'GET', '/api/customers/orders', {
      headers: { authorization: `Bearer ${login.body.access_token}` },
    });
    expect(orders.status).toBe(200);
    expect(Array.isArray(orders.body)).toBe(true);
    const active = orders.body.find((row) => row.id === 1001);
    const completed = orders.body.find((row) => row.id === 987);
    expect(active).toMatchObject({
      item_name: 'Solitaire Halo Ring',
      status: 'on_track',
      plan_status: 'active',
      next_due_date: '2026-10-25T00:00:00.000Z',
    });
    expect(completed).toMatchObject({
      item_name: 'Vintage Rose Pendant',
      status: 'completed',
      completed_on: '2026-07-01T00:00:00.000Z',
      next_due_date: null,
    });
    expect(active.installments[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        due_date: expect.stringMatching(/T/),
        amount: expect.any(String),
        status: expect.any(String),
      }),
    );
  });

  it('returns only the authenticated customer\'s orders', () => {
    const store = createStore();
    const login = call(store, 'POST', '/api/customers/login', {
      body: { email: 'buyer@sampleemail.com', password: 'password' },
    });
    const orders = call(store, 'GET', '/api/customers/orders', {
      headers: { authorization: `Bearer ${login.body.access_token}` },
    });
    expect(orders.status).toBe(200);
    expect(orders.body.map((row) => row.id)).toEqual([1002]);
    expect(orders.body[0].item_name).toBe('Emerald Drop Earrings');
  });

  it('creates a plan when authenticated and 501s the live gateway', () => {
    const store = createStore();
    const session = call(store, 'POST', '/api/dev/session/customer', { body: {} });
    const created = call(store, 'POST', '/api/layaway/plans', {
      headers: { authorization: `Bearer ${session.body.access_token}` },
      body: {
        product_id: firstPiece.id,
        term_months: 3,
        installment_dates: ['2026-10-01', '2026-10-15'],
      },
    });
    expect(created.status).toBe(201);
    expect(created.body.installments).toHaveLength(2);
    const gateway = call(store, 'POST', `/api/layaway/plans/${created.body.id}/payments`, {
      headers: { authorization: `Bearer ${session.body.access_token}` },
      body: {},
    });
    expect(gateway.status).toBe(501);
    const mockPay = call(
      store,
      'POST',
      `/api/layaway/plans/${created.body.id}/payments/mock-gateway`,
      {
        headers: { authorization: `Bearer ${session.body.access_token}` },
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

  it('expires access tokens at 15 minutes and refresh tokens at 24 hours', () => {
    const store = createStore();
    const start = store.now().getTime();
    store.now = () => new Date(start);
    const login = call(store, 'POST', '/api/customers/login', {
      body: { email: 'client@sampleemail.com', password: 'password' },
    });
    const orders = (token) =>
      call(store, 'GET', '/api/customers/orders', {
        headers: { authorization: `Bearer ${token}` },
      }).status;
    const refresh = () =>
      call(store, 'POST', '/api/customers/refresh', {
        body: { refresh_token: login.body.refresh_token },
      });

    store.now = () => new Date(start + 15 * 60 * 1000 - 1);
    expect(orders(login.body.access_token)).toBe(200);
    store.now = () => new Date(start + 15 * 60 * 1000);
    expect(orders(login.body.access_token)).toBe(401);

    const refreshed = refresh();
    expect(refreshed.status).toBe(200);
    expect(Object.keys(refreshed.body)).toEqual(['access_token']);
    expect(orders(refreshed.body.access_token)).toBe(200);

    store.now = () => new Date(start + 24 * 60 * 60 * 1000);
    expect(refresh().status).toBe(401);
  });

  it('logout revokes only that refresh token', () => {
    const store = createStore();
    const login = () =>
      call(store, 'POST', '/api/customers/login', {
        body: { email: 'client@sampleemail.com', password: 'password' },
      });
    const first = login().body.refresh_token;
    const second = login().body.refresh_token;
    const refresh = (token) =>
      call(store, 'POST', '/api/customers/refresh', { body: { refresh_token: token } }).status;

    expect(call(store, 'POST', '/api/customers/logout', { body: { refresh_token: first } }).status).toBe(
      200,
    );
    expect(refresh(first)).toBe(401);
    expect(refresh(second)).toBe(200);
    expect(refresh('unknown')).toBe(401);
  });

  it('returns the customer envelope from register and dev session, admin unchanged', () => {
    const store = createStore();
    const registered = call(store, 'POST', '/api/customers/register', {
      body: { name: 'New Guest', email: 'guest@sampleemail.com', password: 'password' },
    });
    const dev = call(store, 'POST', '/api/dev/session/customer', { body: {} });
    for (const { body } of [registered, dev]) {
      expect(Object.keys(body).sort()).toEqual(['access_token', 'customer', 'refresh_token']);
    }
    const admin = call(store, 'POST', '/api/admin/login', {
      body: { email: 'admin@samplejewelry.example', password: 'password' },
    });
    expect(Object.keys(admin.body).sort()).toEqual(['admin', 'token']);
    expect(Object.keys(call(store, 'POST', '/api/dev/session/admin').body).sort()).toEqual([
      'admin',
      'token',
    ]);
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
