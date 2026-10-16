import { describe, expect, it, vi } from 'vitest';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import { logoutCustomer } from '../../src/services/logoutCustomer.js';
import { refreshCustomerToken } from '../../src/services/refreshCustomerToken.js';
import { getCustomer, getCustomerToken } from '../../src/services/session.js';

describe('logoutCustomer', () => {
  it('posts the refresh token, revokes it, and clears the session', async () => {
    const { refresh_token } = await loginCustomer({
      email: 'client@sampleemail.com',
      password: 'password',
    });
    const fetchSpy = vi.fn(globalThis.fetch);
    vi.stubGlobal('fetch', fetchSpy);
    await logoutCustomer();
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('/api/customers/logout');
    expect(JSON.parse(init.body)).toEqual({ refresh_token });
    expect(getCustomer()).toBeNull();
    expect(getCustomerToken()).toBeNull();

    localStorage.setItem('customerRefreshToken', refresh_token);
    await expect(refreshCustomerToken()).rejects.toMatchObject({ status: 401 });
  });

  it('still clears the session when the call fails', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('offline');
    });
    await expect(logoutCustomer()).resolves.toBeUndefined();
    expect(getCustomer()).toBeNull();
    expect(getCustomerToken()).toBeNull();
  });
});
