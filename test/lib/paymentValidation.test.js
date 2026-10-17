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
        paidOn: '2026-10-11',
        today: '2026-10-10',
      }),
    ).toMatchObject({
      bank_account_id: 'Please choose a bank account.',
      reference_number: 'Reference number is required.',
      paid_on: 'Date cannot be in the future.',
    });
  });

  it('shows the server amount error with the expected amount', () => {
    expect(mapPaymentError(400, 'The amount must match the amount due.', 2500)).toEqual({
      amount: 'The amount must match the amount due. Expected ₱2,500.00',
    });
  });

  it('maps reused reference conflicts to the reference field', () => {
    expect(mapPaymentError(409, 'reference number already used')).toEqual({
      reference_number: 'This reference number was already submitted. Please check it.',
    });
  });
});
