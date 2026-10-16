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

  it('rejects payments on cancelled and defaulted plans', () => {
    const store = createStore();
    const login = call(store, 'POST', '/api/customers/login', {
      body: { email: 'client@sampleemail.com', password: 'password' },
    });
    const auth = { authorization: `Bearer ${login.body.access_token}` };
    const orders = call(store, 'GET', '/api/customers/orders', { headers: auth });
    const cancelled = orders.body.find((row) => row.status === 'cancelled');
    const result = call(store, 'POST', `/api/layaway/plans/${cancelled.id}/payments/manual`, {
      headers: auth,
      body: {
        installment_id: cancelled.installments[3].id,
        bank_account_id: 1,
        reference_number: 'BT-CLOSED',
        amount: '1000',
        paid_on: store.now().toISOString().slice(0, 10),
      },
    });
    expect(result.status).toBe(409);
    expect(result.body.error).toBe('Plan is cancelled');
  });

  it('seeds cancelled and defaulted orders with per-installment payment status', () => {
    const store = createStore();
    const login = call(store, 'POST', '/api/customers/login', {
      body: { email: 'buyer@sampleemail.com', password: 'password' },
    });
    const orders = call(store, 'GET', '/api/customers/orders', {
      headers: { authorization: `Bearer ${login.body.access_token}` },
    });
    const defaulted = orders.body.find((row) => row.status === 'defaulted');
    expect(defaulted.installments.map((row) => row.payment_status)).toEqual([
      'paid',
      'paid',
      'unpaid',
      'unpaid',
    ]);
    expect(defaulted.installments[2]).toMatchObject({
      due_date: expect.stringMatching(/T/),
      rejection_reason: null,
    });
    expect(defaulted.next_due_date).toBeNull();
  });

  it('flags submitted and rejected installments in payment_status', () => {
    const store = createStore();
    const plan = store.plans.find((row) => row.id === 'LA-1001');
    plan.installments[3].status = 'submitted';
    plan.installments[4].status = 'rejected';
    plan.installments[4].rejection_reason = 'Blurry proof';
    const login = call(store, 'POST', '/api/customers/login', {
      body: { email: 'client@sampleemail.com', password: 'password' },
    });
    const orders = call(store, 'GET', '/api/customers/orders', {
      headers: { authorization: `Bearer ${login.body.access_token}` },
    });
    const statuses = orders.body
      .find((row) => row.id === 1001)
      .installments.map((row) => row.payment_status);
    expect(statuses.slice(3, 5)).toEqual(['awaiting_confirmation', 'rejected']);
  });

  it('says to pay the earlier installment first even when the later one is due', () => {
    const store = createStore();
    const login = call(store, 'POST', '/api/customers/login', {
      body: { email: 'client@sampleemail.com', password: 'password' },
    });
    const auth = { authorization: `Bearer ${login.body.access_token}` };
    const plan = store.plans.find((row) => row.id === 'LA-1001');
    const result = call(store, 'POST', '/api/layaway/plans/1001/payments/manual', {
      headers: auth,
      body: {
        installment_id: plan.installments[4].id,
        bank_account_id: 1,
        reference_number: 'BT-SKIPPED',
        amount: '1000',
        paid_on: store.now().toISOString().slice(0, 10),
      },
    });
    expect(result.status).toBe(409);
    expect(result.body.error).toBe('Pay the earlier installment first');
  });
});
