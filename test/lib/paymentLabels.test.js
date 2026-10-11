import { describe, expect, it } from 'vitest';
import {
  paymentKindLabel,
  paymentTermLabel,
} from '../../src/lib/paymentLabels.js';

describe('paymentLabels', () => {
  it('labels down payments and installments', () => {
    expect(paymentKindLabel({ kind: 'down_payment' })).toBe('Down payment');
    expect(paymentKindLabel({ kind: 'installment', term_number: 2 })).toBe(
      'Payment 2',
    );
  });

  it('shows a dash for down payments and the term for installments', () => {
    expect(paymentTermLabel({ kind: 'down_payment' })).toBe('—');
    expect(
      paymentTermLabel({
        kind: 'installment',
        term_number: 2,
        due_date: '2026-11-01',
      }),
    ).toMatch(/^Payment 2 /);
  });
});
