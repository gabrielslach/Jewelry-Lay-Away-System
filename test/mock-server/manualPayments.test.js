import { describe, expect, it } from 'vitest';
import galleryPage from '../../mock-server/gallery-items.json';
import { createStore, handleRequest } from '../../mock-server/handleRequest.js';

function call(store, method, url, opts = {}) {
  return handleRequest(store, { method, url, ...opts });
}

describe('mock manual payments', () => {
  it('accepts a manual payment using the numeric customer order id', () => {
    const store = createStore();
    const login = call(store, 'POST', '/api/customers/login', {
      body: { email: 'client@sampleemail.com', password: 'password' },
    });
    const auth = { authorization: `Bearer ${login.body.access_token}` };
    const orders = call(store, 'GET', '/api/customers/orders', { headers: auth });
    const active = orders.body.find((row) => row.id === 1001);
    expect(active).toBeTruthy();
    const paidOn = store.now().toISOString().slice(0, 10);
    const result = call(store, 'POST', `/api/layaway/plans/${active.id}/payments/manual`, {
      headers: auth,
      body: {
        installment_id: active.installments.find((row) => row.status !== 'paid').id,
        bank_account_id: 1,
        reference_number: 'BT-ORDER-ID',
        amount: '1000',
        paid_on: paidOn,
      },
    });
    expect(result.status).toBe(201);
    expect(result.body.status).toBe('submitted');
  });

  it('keeps awaiting_confirmation rows on the due list', () => {
    const store = createStore();
    const session = call(store, 'POST', '/api/dev/session/customer', { body: {} });
    const auth = { authorization: `Bearer ${session.body.access_token}` };
    const created = call(store, 'POST', '/api/layaway/plans', {
      headers: auth,
      body: { product_id: galleryPage.results[0].id, term_months: 1 },
    });
    const dueDate = created.body.schedule[0].due_date;
    store.now = () => new Date(`${dueDate}T12:00:00.000Z`);
    const plan = store.plans.find((row) => row.id === created.body.id);
    plan.installments[0].status = 'submitted';
    plan.installments[0].due_date = dueDate;
    const admin = call(store, 'POST', '/api/dev/session/admin', { body: {} });
    const due = call(store, 'GET', '/api/admin/payments/due', {
      headers: { authorization: `Bearer ${admin.body.access_token}` },
    });
    expect(due.body.items.some((row) => row.awaiting_confirmation)).toBe(true);
  });

  it('requires earlier installments before accepting a not-yet-due one', () => {
    const store = createStore();
    const session = call(store, 'POST', '/api/dev/session/customer', { body: {} });
    const auth = { authorization: `Bearer ${session.body.access_token}` };
    const created = call(store, 'POST', '/api/layaway/plans', {
      headers: auth,
      body: { product_id: galleryPage.results[0].id, term_months: 3 },
    });
    const [first, second] = created.body.schedule;
    const submit = (id, amount, ref) =>
      call(store, 'POST', `/api/layaway/plans/${created.body.id}/payments/manual`, {
        headers: auth,
        body: {
          installment_id: id,
          bank_account_id: 1,
          reference_number: ref,
          amount: String(amount),
          paid_on: store.now().toISOString().slice(0, 10),
        },
      });
    expect(submit(`${created.body.id}-i2`, second.amount, 'BT-SKIP').status).toBe(409);
    expect(submit(`${created.body.id}-i1`, first.amount, 'BT-FIRST').status).toBe(201);
    expect(submit(`${created.body.id}-i2`, second.amount, 'BT-SECOND').status).toBe(201);
  });

  it('adds money, image and as-of fields to customer orders', () => {
    const store = createStore();
    const login = call(store, 'POST', '/api/customers/login', {
      body: { email: 'client@sampleemail.com', password: 'password' },
    });
    const orders = call(store, 'GET', '/api/customers/orders', {
      headers: { authorization: `Bearer ${login.body.access_token}` },
    });
    const active = orders.body.find((row) => row.id === 1001);
    const installmentTotal = active.installments.reduce((sum, row) => sum + Number(row.amount), 0);
    const paid = active.installments
      .filter((row) => row.status === 'paid')
      .reduce((sum, row) => sum + Number(row.amount), 0);
    expect(active.total_payable).toBe(active.down_payment_amount + installmentTotal);
    expect(active.amount_paid).toBe(active.down_payment_amount + paid);
    expect(active.financed_principal).toBeGreaterThan(0);
    expect(active.as_of).toBe(store.now().toISOString().slice(0, 10));
    expect(active).toHaveProperty('image_url');
  });
});
