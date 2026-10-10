import { describe, expect, it } from 'vitest';
import {
  mapPaymentError,
  validatePaymentForm,
} from '../../src/lib/paymentValidation.js';

describe('paymentValidation', () => {
  it('validates required payment fields', () => {
    expect(
      validatePaymentForm({
        bankAccountId: '',
        referenceNumber: '',
        amount: '',
        paidOn: '2026-10-11',
        today: '2026-10-10',
      }),
    ).toMatchObject({
      bank_account_id: 'Please choose the bank you used.',
      reference_number: 'Reference number is required.',
      amount: 'Enter a valid amount.',
      paid_on: 'Date cannot be in the future.',
    });
  });

  it('maps reused reference conflicts to the reference field', () => {
    expect(mapPaymentError(409, 'reference number already used')).toEqual({
      reference_number: 'This reference number was already submitted. Please check it.',
    });
  });
});
