import { describe, expect, it } from 'vitest';
import { createStore, handleRequest } from '../../mock-server/handleRequest.js';

function call(store, method, url, opts = {}) {
  return handleRequest(store, { method, url, ...opts });
}

function login(store, email) {
  const res = call(store, 'POST', '/api/admin/login', {
    body: { email, password: 'password' },
  });
  return { authorization: `Bearer ${res.body.access_token}` };
}

const ADMIN = 'admin@samplejewelry.example';
const ACCOUNTING = 'accounting@samplejewelry.example';

describe('mock bank accounts', () => {
  it('lists inactive accounts for staff but only active ones publicly', () => {
    const store = createStore();
    const admin = login(store, ADMIN);
    call(store, 'PATCH', '/api/admin/bank-accounts/2', {
      headers: admin,
      body: { is_active: 'false' },
    });
    expect(
      call(store, 'GET', '/api/admin/bank-accounts', { headers: admin }).body,
    ).toHaveLength(2);
    expect(call(store, 'GET', '/api/bank-accounts').body.results).toHaveLength(
      1,
    );
  });

  it('returns 401 without a token and 403 for accounting writes', () => {
    const store = createStore();
    expect(call(store, 'GET', '/api/admin/bank-accounts').status).toBe(401);
    const accounting = login(store, ACCOUNTING);
    expect(
      call(store, 'GET', '/api/admin/bank-accounts', { headers: accounting })
        .status,
    ).toBe(200);
    expect(
      call(store, 'POST', '/api/admin/bank-accounts', {
        headers: accounting,
        body: {},
      }).status,
    ).toBe(403);
    expect(
      call(store, 'PATCH', '/api/admin/bank-accounts/1', {
        headers: accounting,
        body: {},
      }).status,
    ).toBe(403);
  });

  it('answers 400 with fields, 404 and 409 for duplicates', () => {
    const store = createStore();
    const admin = login(store, ADMIN);
    const invalid = call(store, 'POST', '/api/admin/bank-accounts', {
      headers: admin,
      body: { bank_name: '', account_name: 'A' },
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toBe('Invalid bank account');
    expect(Object.keys(invalid.body.fields)).toEqual([
      'bank_name',
      'account_number',
    ]);
    expect(
      call(store, 'PATCH', '/api/admin/bank-accounts/99', {
        headers: admin,
        body: {},
      }).status,
    ).toBe(404);
    const duplicate = call(store, 'POST', '/api/admin/bank-accounts', {
      headers: admin,
      body: {
        bank_name: 'Sample Bank',
        account_name: 'A',
        account_number: '0011-2233-4455',
      },
    });
    expect(duplicate.status).toBe(409);
  });
});

describe('mock reports', () => {
  it.each([ADMIN, ACCOUNTING])(
    'serves receivables, ledger and profit to %s',
    (email) => {
      const store = createStore();
      const headers = login(store, email);
      expect(
        call(store, 'GET', '/api/admin/reports/receivables', { headers }).body
          .items,
      ).toBeDefined();
      const ledger = call(
        store,
        'GET',
        '/api/finance/ledger?limit=3&offset=3',
        { headers },
      );
      expect(ledger.body.results).toHaveLength(3);
      expect(ledger.body.count).toBeGreaterThan(6);
      expect(
        call(store, 'GET', '/api/admin/reports/profit', { headers }).body
          .by_month.length,
      ).toBeGreaterThan(0);
    },
  );

  it('filters the ledger and returns CSV without paging', () => {
    const store = createStore();
    const headers = login(store, ADMIN);
    const filtered = call(
      store,
      'GET',
      '/api/finance/ledger?entry_type=receivable',
      { headers },
    );
    expect(
      filtered.body.results.every((row) => row.entry_type === 'receivable'),
    ).toBe(true);
    const csv = call(store, 'GET', '/api/finance/ledger?format=csv&limit=1', {
      headers,
    });
    expect(csv.headers['Content-Type']).toContain('text/csv');
    expect(csv.body.split('\n').length).toBeGreaterThan(5);
    const profit = call(store, 'GET', '/api/admin/reports/profit?format=csv', {
      headers,
    });
    expect(profit.body.split('\n')[0]).toBe(
      'month,interest_profit,markup_profit,total',
    );
  });

  it('requires a staff token', () => {
    const store = createStore();
    expect(call(store, 'GET', '/api/admin/reports/profit').status).toBe(401);
  });
});

describe('mock customer sessions', () => {
  it('lets admins delete sessions and refuses accounting with 403', () => {
    const store = createStore();
    const url = '/api/admin/customers/1/sessions';
    expect(
      call(store, 'DELETE', url, { headers: login(store, ACCOUNTING) }).status,
    ).toBe(403);
    expect(
      call(store, 'DELETE', url, { headers: login(store, ADMIN) }).status,
    ).toBe(200);
  });
});
