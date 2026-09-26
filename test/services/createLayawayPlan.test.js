import { describe, expect, it } from 'vitest';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import { createLayawayPlan } from '../../src/services/createLayawayPlan.js';

describe('createLayawayPlan', () => {
  it('creates an authenticated plan', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    const plan = await createLayawayPlan({
      productId: 1,
      paymentCount: 4,
      dates: ['2026-10-01', '2026-10-15', '2026-10-29', '2026-11-12'],
    });
    expect(plan.term_months).toBe(2);
    expect(plan.installments).toHaveLength(4);
  });
});
