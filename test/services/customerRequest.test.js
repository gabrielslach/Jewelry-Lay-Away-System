import { beforeEach, describe, expect, it, vi } from 'vitest';
import { customerRequest } from '../../src/services/customerRequest.js';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import {
  getCustomer,
  getCustomerRefreshToken,
  getCustomerToken,
  setCustomerToken,
} from '../../src/services/session.js';

const ORDERS = '/api/customers/orders';
let fetchSpy;

function callsTo(path) {
  return fetchSpy.mock.calls.filter(([url]) => url === path);
}

async function signIn(email = 'client@sampleemail.com') {
  await loginCustomer({ email, password: 'password' });
  fetchSpy.mockClear();
}

describe('customerRequest', () => {
  beforeEach(() => {
    fetchSpy = vi.fn(globalThis.fetch);
    vi.stubGlobal('fetch', fetchSpy);
  });

  it('sends the stored access token as Bearer', async () => {
    await signIn();
    const data = await customerRequest(ORDERS);
    expect(data.length).toBeGreaterThan(0);
    const [, init] = callsTo(ORDERS)[0];
    expect(init.headers.Authorization).toBe(`Bearer ${getCustomerToken()}`);
    expect(callsTo('/api/customers/refresh')).toHaveLength(0);
  });

  it('refreshes first in a new tab with only localStorage', async () => {
    await signIn();
    sessionStorage.clear();
    await customerRequest(ORDERS);
    expect(callsTo('/api/customers/refresh')).toHaveLength(1);
    expect(callsTo(ORDERS)).toHaveLength(1);
    expect(getCustomerToken()).toBeTruthy();
  });

  it('refreshes once and retries after a 401', async () => {
    await signIn();
    setCustomerToken('expired');
    const data = await customerRequest(ORDERS);
    expect(data.length).toBeGreaterThan(0);
    expect(callsTo('/api/customers/refresh')).toHaveLength(1);
    expect(callsTo(ORDERS)).toHaveLength(2);
    expect(getCustomerToken()).not.toBe('expired');
  });

  it('shares one refresh between overlapping 401s', async () => {
    await signIn();
    setCustomerToken('expired');
    await Promise.all([customerRequest(ORDERS), customerRequest(ORDERS)]);
    expect(callsTo('/api/customers/refresh')).toHaveLength(1);
    expect(callsTo(ORDERS)).toHaveLength(4);
  });

  it('signs out when the refresh token is rejected', async () => {
    await signIn();
    setCustomerToken('expired');
    localStorage.setItem('customerRefreshToken', 'revoked');
    await expect(customerRequest(ORDERS)).rejects.toMatchObject({
      message: 'Please sign in to continue.',
      status: 401,
    });
    expect(getCustomer()).toBeNull();
    expect(getCustomerRefreshToken()).toBeNull();
    expect(getCustomerToken()).toBeNull();
  });

  it('asks guests to sign in without calling the API', async () => {
    await expect(customerRequest(ORDERS)).rejects.toMatchObject({
      message: 'Please sign in to continue.',
      status: 401,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not refresh on 403', async () => {
    await signIn();
    fetchSpy.mockImplementationOnce(async () => ({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ error: 'Forbidden' }),
    }));
    await expect(customerRequest(ORDERS)).rejects.toMatchObject({ status: 403 });
    expect(callsTo('/api/customers/refresh')).toHaveLength(0);
  });
});
