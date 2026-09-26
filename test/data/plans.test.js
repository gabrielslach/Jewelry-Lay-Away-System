import { describe, expect, it } from 'vitest';
import { createLayawayPlan, paymentCountToTermMonths } from '../../src/data/plans.js';

describe('plans', () => {
  it('maps demo payment counts to API term_months', () => {
    expect(paymentCountToTermMonths(6)).toBe(3);
    expect(paymentCountToTermMonths(4)).toBe(2);
    expect(paymentCountToTermMonths(2)).toBe(1);
  });

  it('creates a mocked plan without auth', async () => {
    const plan = await createLayawayPlan({
      productId: 1,
      paymentCount: 6,
      dates: ['2026-10-01'],
    });
    expect(plan.term_months).toBe(3);
    expect(plan.note).toMatch(/mock/i);
  });
});
