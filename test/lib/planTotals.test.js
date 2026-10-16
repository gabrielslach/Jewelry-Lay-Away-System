import { describe, expect, it } from 'vitest';
import { planTotals } from '../../src/lib/planTotals.js';

describe('planTotals', () => {
  const plan = {
    down_payment_amount: 1000,
    down_payment_status: 'paid',
    installments: [
      { amount: 500, status: 'paid' },
      { amount: 500, status: 'pending' },
      { amount: 700, status: 'superseded' },
    ],
  };

  it('sums down payment and active installments, ignoring superseded ones', () => {
    const totals = planTotals(plan);
    expect(totals.financedPrincipal).toBe(1000);
    expect(totals.totalPayable).toBe(2000);
    expect(totals.amountPaid).toBe(1500);
  });

  it('excludes an unpaid down payment from amount paid', () => {
    expect(planTotals({ ...plan, down_payment_status: 'pending' }).amountPaid).toBe(500);
  });

  it('handles plans without installments', () => {
    const totals = planTotals({ down_payment_amount: 300 });
    expect(totals.totalPayable).toBe(300);
    expect(totals.amountPaid).toBe(0);
  });

  it('stamps today as the as-of date', () => {
    expect(planTotals(plan).asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
