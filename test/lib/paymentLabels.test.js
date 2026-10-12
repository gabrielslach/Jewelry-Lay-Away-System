import { describe, expect, it } from 'vitest';
import { formatDisplayDate } from '../../src/lib/dates.js';
import {
  paymentKindLabel,
  paymentDueDateLabel,
} from '../../src/lib/paymentLabels.js';

describe('paymentLabels', () => {
  it('labels down payments and installments', () => {
    expect(paymentKindLabel({ kind: 'down_payment' })).toBe('Down payment');
    expect(paymentKindLabel({ kind: 'installment', term_number: 2 })).toBe(
      'Payment 2',
    );
  });

  it('shows a dash for down payments and the due date for installments', () => {
    expect(paymentDueDateLabel({ kind: 'down_payment' })).toBe('—');
    expect(
      paymentDueDateLabel({
        kind: 'installment',
        term_number: 2,
        due_date: '2026-11-01',
      }),
    ).toBe(formatDisplayDate('2026-11-01'));
  });
});
