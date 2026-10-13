import { describe, expect, it } from 'vitest';
import { createStore, handleRequest } from '../../mock-server/handleRequest.js';

function call(store, method, url, opts = {}) {
  return handleRequest(store, { method, url, ...opts });
}

function bearer(token) {
  return { authorization: `Bearer ${token}` };
}

function staffLogin(store, email = 'admin@samplejewelry.example') {
  const login = call(store, 'POST', '/api/admin/login', { body: { email, password: 'password' } });
  return bearer(login.body.access_token);
}

function createStaff(store, auth, body) {
  return call(store, 'POST', '/api/admin/staff', { headers: auth, body });
}

const newStaff = (n, role) => ({
  name: `Staff ${n}`,
  email: `staff${n}@example.com`,
  password: 'password1',
  role,
});

describe('mock plan detail access', () => {
  it('returns 401 without a token', () => {
    expect(call(createStore(), 'GET', '/api/layaway/plans/LA-1001').status).toBe(401);
  });

  it('returns 403 for another customer and 200 for the owner or staff', () => {
    const store = createStore();
    const login = (email) =>
      bearer(
        call(store, 'POST', '/api/customers/login', { body: { email, password: 'password' } }).body
          .access_token,
      );
    const url = '/api/layaway/plans/LA-1001';
    expect(call(store, 'GET', url, { headers: login('buyer@sampleemail.com') }).status).toBe(403);
    const owner = call(store, 'GET', url, { headers: login('client@sampleemail.com') });
    expect(owner.status).toBe(200);
    expect(owner.body.installments[0]).toHaveProperty('payment_status');
    expect(call(store, 'GET', url, { headers: staffLogin(store) }).status).toBe(200);
  });
});

describe('mock staff', () => {
  it('lists staff for admins and hides it from accounting', () => {
    const store = createStore();
    const list = call(store, 'GET', '/api/admin/staff', { headers: staffLogin(store) });
    expect(list.status).toBe(200);
    expect(list.body.map((m) => m.role)).toEqual(['admin', 'accounting']);
    expect(list.body[0]).not.toHaveProperty('password');
    const accounting = staffLogin(store, 'accounting@samplejewelry.example');
    expect(call(store, 'GET', '/api/admin/staff', { headers: accounting }).status).toBe(403);
  });

  it('creates staff and enforces the accounting cap of 3', () => {
    const store = createStore();
    const auth = staffLogin(store);
    expect(createStaff(store, auth, newStaff(1, 'accounting')).status).toBe(201);
    expect(createStaff(store, auth, newStaff(2, 'accounting')).status).toBe(201);
    const full = createStaff(store, auth, newStaff(3, 'accounting'));
    expect(full.status).toBe(409);
    expect(full.body.error).toMatch(/accounting role is full/);
  });

  it('enforces the admin cap of 2 and rejects the retired roles', () => {
    const store = createStore();
    const auth = staffLogin(store);
    expect(createStaff(store, auth, newStaff(1, 'admin')).status).toBe(201);
    expect(createStaff(store, auth, newStaff(2, 'admin')).status).toBe(409);
    expect(createStaff(store, auth, newStaff(3, 'receivables')).status).toBe(400);
  });

  it('rejects a duplicate email', () => {
    const store = createStore();
    const auth = staffLogin(store);
    const duplicate = createStaff(store, auth, {
      ...newStaff(1, 'accounting'),
      email: 'accounting@samplejewelry.example',
    });
    expect(duplicate.status).toBe(409);
  });

  it('edits and deactivates staff, blocking self-demotion and cap overflow', () => {
    const store = createStore();
    const auth = staffLogin(store);
    const patch = (id, body) =>
      call(store, 'PATCH', `/api/admin/staff/${id}`, { headers: auth, body });
    expect(patch(2, { name: 'Renamed' }).body.name).toBe('Renamed');
    expect(patch(1, { is_active: false }).status).toBe(403);
    expect(patch(1, { role: 'accounting' }).status).toBe(403);
    expect(patch(2, { role: 'admin' }).body.role).toBe('admin');
    expect(patch(2, { is_active: false }).body.is_active).toBe(false);
    expect(patch(99, { name: 'x' }).status).toBe(404);
  });

  it('blocks a deactivated account from signing in', () => {
    const store = createStore();
    call(store, 'PATCH', '/api/admin/staff/2', {
      headers: staffLogin(store),
      body: { is_active: false },
    });
    const login = call(store, 'POST', '/api/admin/login', {
      body: { email: 'accounting@samplejewelry.example', password: 'password' },
    });
    expect(login.status).toBe(401);
  });
});

describe('mock staff permissions', () => {
  function pendingPayment(store) {
    store.pendingPayments.push({
      id: 1,
      kind: 'installment',
      plan_id: 'LA-1001',
      installment_id: 'LA-1001-i4',
      status: 'submitted',
      reference_number: 'BT-1',
      created_at: '2026-10-01',
    });
  }

  it('lets accounting confirm a payment', () => {
    const store = createStore();
    pendingPayment(store);
    const result = call(store, 'POST', '/api/admin/payments/1/confirm', {
      headers: staffLogin(store, 'accounting@samplejewelry.example'),
      body: {},
    });
    expect(result.status).toBe(200);
  });

  it('lets accounting reject a payment but not retry or cancel a reservation', () => {
    const store = createStore();
    pendingPayment(store);
    const accounting = staffLogin(store, 'accounting@samplejewelry.example');
    const reject = call(store, 'POST', '/api/admin/payments/1/reject', {
      headers: accounting,
      body: { reason: 'Blurry' },
    });
    expect(reject.status).toBe(200);
    const retry = call(store, 'POST', '/api/admin/plans/LA-1001/reservation/retry', {
      headers: accounting,
    });
    const cancel = call(store, 'POST', '/api/admin/plans/LA-1001/reservation/cancel', {
      headers: accounting,
      body: { reason: 'x', handoff_confirmed: true },
    });
    expect([retry.status, cancel.status]).toEqual([403, 403]);
  });
});
