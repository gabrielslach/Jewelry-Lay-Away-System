import { describe, expect, it } from 'vitest';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import {
  changeCustomerPassword,
  forgotCustomerPassword,
} from '../../src/services/customerPassword.js';

describe('customerPassword', () => {
  it('always accepts forgot-password', async () => {
    const result = await forgotCustomerPassword('nobody@example.com');
    expect(result.ok).toBe(true);
  });

  it('changes the password for a signed-in customer', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    const result = await changeCustomerPassword({
      currentPassword: 'password',
      newPassword: 'password2',
    });
    expect(result.ok).toBe(true);
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password2' });
  });
});
