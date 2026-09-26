import { describe, expect, it } from 'vitest';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import { refreshCustomerToken } from '../../src/services/refreshCustomerToken.js';
import { getCustomer, getCustomerToken } from '../../src/services/session.js';

describe('refreshCustomerToken', () => {
  it('stores a new access token and keeps the refresh token', async () => {
    const { refresh_token } = await loginCustomer({
      email: 'client@sampleemail.com',
      password: 'password',
    });
    sessionStorage.clear();
    const accessToken = await refreshCustomerToken();
    expect(getCustomerToken()).toBe(accessToken);
    expect(localStorage.getItem('customerRefreshToken')).toBe(refresh_token);
  });

  it('clears the session when the refresh token is unknown', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    localStorage.setItem('customerRefreshToken', 'unknown');
    await expect(refreshCustomerToken()).rejects.toMatchObject({ status: 401 });
    expect(getCustomer()).toBeNull();
    expect(getCustomerToken()).toBeNull();
  });
});
