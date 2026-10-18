import { describe, expect, it, vi } from 'vitest';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import { refreshCustomerToken } from '../../src/services/refreshCustomerToken.js';
import { subscribeSessionExpired } from '../../src/services/sessionExpired.js';
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

  it('signals an expired session and keeps it for the modal when the refresh token is unknown', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    localStorage.setItem('customerRefreshToken', 'unknown');
    const expired = vi.fn();
    const unsubscribe = subscribeSessionExpired('customer', expired);
    await expect(refreshCustomerToken()).rejects.toMatchObject({ status: 401 });
    unsubscribe();
    expect(expired).toHaveBeenCalledOnce();
    expect(getCustomer()).not.toBeNull();
  });
});
