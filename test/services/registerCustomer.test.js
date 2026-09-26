import { describe, expect, it } from 'vitest';
import { registerCustomer } from '../../src/services/registerCustomer.js';

describe('registerCustomer', () => {
  it('creates a customer and session', async () => {
    const data = await registerCustomer({
      name: 'New Guest',
      email: 'guest@sampleemail.com',
      password: 'password',
    });
    expect(data.customer.name).toBe('New Guest');
    expect(data.token).toBeTruthy();
  });
});
