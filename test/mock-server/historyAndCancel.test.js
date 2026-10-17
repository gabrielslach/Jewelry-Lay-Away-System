import { describe, expect, it } from 'vitest';
import galleryPage from '../../mock-server/gallery-items.json';
import { createStore, handleRequest } from '../../mock-server/handleRequest.js';

function call(store, method, url, opts = {}) {
  return handleRequest(store, { method, url, ...opts });
}

function customerAuth(store) {
  const session = call(store, 'POST', '/api/dev/session/customer', { body: {} });
  return { authorization: `Bearer ${session.body.access_token}` };
}

function adminAuth(store) {
  const session = call(store, 'POST', '/api/dev/session/admin', { body: {} });
  return { authorization: `Bearer ${session.body.access_token}` };
}

function createPlan(store, auth) {
  return call(store, 'POST', '/api/layaway/plans', {
    headers: auth,
    body: { product_id: galleryPage.results[0].id, term_months: 1 },
  }).body;
}

function manualBody(store, amount, reference) {
  return {
    bank_account_id: 1,
    reference_number: reference,
    amount,
    paid_on: store.now().toISOString().slice(0, 10),
  };
}

describe('mock gallery', () => {
  it('returns the marked-up price and the lowest payment on the longest term', () => {
    const store = createStore();
    const item = call(store, 'GET', '/api/gallery?page=1&page_size=1').body.results[0];
    const preview = call(store, 'GET', `/api/layaway/preview?product_id=${item.id}`).body;
    const longest = preview.options.find((row) => row.term_months === preview.max_term_months);
    expect(item.price).toBe(preview.total_price);
    expect(item.lowest_payment_amount).toBe(Math.min(...longest.schedule.map((row) => row.amount)));
  });
});

describe('mock exact payment amounts', () => {
  it('rejects a wrong down payment amount with expected_amount', () => {
    const store = createStore();
    const auth = customerAuth(store);
    const plan = createPlan(store, auth);
    const result = call(store, 'POST', `/api/layaway/plans/${plan.id}/down-payment/manual`, {
      headers: auth,
      body: manualBody(store, plan.down_payment_amount + 1, 'BT-WRONG-DP'),
    });
    expect(result.status).toBe(400);
    expect(result.body.expected_amount).toBe(plan.down_payment_amount);
    expect(result.body.error).toBeTruthy();
  });

  it('rejects a wrong installment amount with expected_amount', () => {
    const store = createStore();
    const auth = customerAuth(store);
    const plan = createPlan(store, auth);
    const result = call(store, 'POST', `/api/layaway/plans/${plan.id}/payments/manual`, {
      headers: auth,
      body: {
        ...manualBody(store, 1, 'BT-WRONG-INST'),
        installment_id: `${plan.id}-i1`,
      },
    });
    expect(result.status).toBe(400);
    expect(result.body.expected_amount).toBe(plan.schedule[0].amount);
  });
});

describe('mock plan cancel', () => {
  it('cancels a plan with a pending down payment', () => {
    const store = createStore();
    const auth = customerAuth(store);
    const plan = createPlan(store, auth);
    const result = call(store, 'POST', `/api/layaway/plans/${plan.id}/cancel`, { headers: auth });
    expect(result.status).toBe(200);
    const orders = call(store, 'GET', '/api/customers/orders', { headers: auth }).body;
    const cancelled = orders.find((row) => row.id === Number(plan.id.replace('LA-', '')));
    expect(cancelled.status).toBe('cancelled');
  });

  it('returns 409 while the down payment is awaiting review', () => {
    const store = createStore();
    const auth = customerAuth(store);
    const plan = createPlan(store, auth);
    call(store, 'POST', `/api/layaway/plans/${plan.id}/down-payment/manual`, {
      headers: auth,
      body: manualBody(store, plan.down_payment_amount, 'BT-CANCEL-DP'),
    });
    const result = call(store, 'POST', `/api/layaway/plans/${plan.id}/cancel`, { headers: auth });
    expect(result.status).toBe(409);
    expect(result.body.error).toBeTruthy();
  });
});

describe('mock payment history', () => {
  it('lists reviewed payments newest first and filters by outcome', () => {
    const store = createStore();
    const headers = adminAuth(store);
    const all = call(store, 'GET', '/api/admin/payments/history', { headers }).body;
    expect(all.results.length).toBeGreaterThan(1);
    const dates = all.results.map((row) => row.reviewed_at);
    expect(dates).toEqual([...dates].sort().reverse());
    const rejected = call(store, 'GET', '/api/admin/payments/history?status=rejected', {
      headers,
    }).body;
    expect(rejected.results.every((row) => row.outcome === 'rejected')).toBe(true);
  });

  it('requires a staff session', () => {
    const store = createStore();
    expect(call(store, 'GET', '/api/admin/payments/history').status).toBe(401);
  });
});
