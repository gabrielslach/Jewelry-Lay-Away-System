import { describe, expect, it } from 'vitest';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import { ServiceError } from '../../src/services/http.js';

describe('loginCustomer', () => {
  it('stores the refresh token and customer locally and the access token per tab', async () => {
    const data = await loginCustomer({
      email: 'client@sampleemail.com',
      password: 'password',
    });
    expect(data.customer.email).toBe('client@sampleemail.com');
    expect(localStorage.getItem('customerRefreshToken')).toBe(data.refresh_token);
    expect(JSON.parse(localStorage.getItem('customer')).email).toBe('client@sampleemail.com');
    expect(sessionStorage.getItem('customerAccessToken')).toBe(data.access_token);
  });

  it('surfaces invalid credentials', async () => {
    await expect(
      loginCustomer({ email: 'client@sampleemail.com', password: 'nope' }),
    ).rejects.toBeInstanceOf(ServiceError);
  });
});
