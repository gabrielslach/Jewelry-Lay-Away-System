import { describe, expect, it } from 'vitest';
import { registerCustomer } from '../../src/services/registerCustomer.js';

describe('registerCustomer', () => {
  it('creates a customer and stores the session', async () => {
    const data = await registerCustomer({
      name: 'New Guest',
      email: 'guest@sampleemail.com',
      phone: '555-0100',
      password: 'password',
    });
    expect(data.customer.name).toBe('New Guest');
    expect(data.customer.phone).toBe('555-0100');
    expect(localStorage.getItem('customerRefreshToken')).toBe(data.refresh_token);
    expect(sessionStorage.getItem('customerAccessToken')).toBe(data.access_token);
  });
});
