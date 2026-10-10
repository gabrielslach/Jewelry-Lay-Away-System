import { describe, expect, it } from 'vitest';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import { createLayawayPlan } from '../../src/services/createLayawayPlan.js';
import { getGallery } from '../../src/services/getGallery.js';

describe('createLayawayPlan', () => {
  it('creates an authenticated plan with a fixed schedule', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    const { results } = await getGallery({ pageSize: 1 });
    const plan = await createLayawayPlan({
      productId: results[0].id,
      termMonths: 2,
    });
    expect(plan.term_months).toBe(2);
    expect(plan.schedule).toHaveLength(4);
    expect(plan.down_payment_amount).toBeGreaterThan(0);
  });
});
