import { describe, expect, it } from 'vitest';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import { ServiceError } from '../../src/services/http.js';

describe('loginCustomer', () => {
  it('returns a token for the seeded client', async () => {
    const data = await loginCustomer({
      email: 'client@sampleemail.com',
      password: 'password',
    });
    expect(data.token).toBeTruthy();
    expect(data.customer.email).toBe('client@sampleemail.com');
  });

  it('surfaces invalid credentials', async () => {
    await expect(
      loginCustomer({ email: 'client@sampleemail.com', password: 'nope' }),
    ).rejects.toBeInstanceOf(ServiceError);
  });
});
