import { describe, expect, it } from 'vitest';
import { paymentCountToTermMonths, termMonthOptions } from '../../src/data/plans.js';

describe('plans', () => {
  it('maps demo payment counts to API term_months', () => {
    expect(paymentCountToTermMonths(6)).toBe(3);
    expect(paymentCountToTermMonths(4)).toBe(2);
    expect(paymentCountToTermMonths(2)).toBe(1);
  });

  it('builds term options up to max months', () => {
    expect(termMonthOptions(3)).toEqual([
      { termMonths: 3, payments: 6, label: '3 Months (6 payments)' },
      { termMonths: 2, payments: 4, label: '2 Months (4 payments)' },
      { termMonths: 1, payments: 2, label: '1 Month (2 payments)' },
    ]);
  });
});
