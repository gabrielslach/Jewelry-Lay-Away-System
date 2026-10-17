import { formatPesoDecimals } from './money.js';

export const PAYMENT_FIELD_MESSAGES = {
  bank_account_id: 'Please choose a bank account.',
  reference_number: 'Reference number is required.',
  paid_on: 'Date cannot be in the future.',
  reference_reused: 'This reference number was already submitted. Please check it.',
};

export function mapPaymentError(status, message, expectedAmount) {
  if (status === 400 && (expectedAmount != null || message?.toLowerCase().includes('amount'))) {
    const expected = expectedAmount != null ? ` Expected ${formatPesoDecimals(expectedAmount)}` : '';
    return { amount: `${message}${expected}` };
  }
  if (status === 409 && message?.toLowerCase().includes('reference')) {
    return { reference_number: PAYMENT_FIELD_MESSAGES.reference_reused };
  }
  const lower = message?.toLowerCase() ?? '';
  if (lower.includes('bank')) {
    return { bank_account_id: PAYMENT_FIELD_MESSAGES.bank_account_id };
  }
  if (lower.includes('reference')) {
    return { reference_number: PAYMENT_FIELD_MESSAGES.reference_number };
  }
  if (lower.includes('date') || lower.includes('paid_on') || lower.includes('future')) {
    return { paid_on: PAYMENT_FIELD_MESSAGES.paid_on };
  }
  return { form: message || 'Unable to submit payment.' };
}

export function validatePaymentForm({ bankAccountId, referenceNumber, paidOn, today }) {
  const errors = {};
  if (!bankAccountId) {
    errors.bank_account_id = PAYMENT_FIELD_MESSAGES.bank_account_id;
  }
  if (!referenceNumber?.trim()) {
    errors.reference_number = PAYMENT_FIELD_MESSAGES.reference_number;
  } else if (referenceNumber.length > 100) {
    errors.reference_number = PAYMENT_FIELD_MESSAGES.reference_number;
  }
  if (!paidOn) {
    errors.paid_on = PAYMENT_FIELD_MESSAGES.paid_on;
  } else if (paidOn > today) {
    errors.paid_on = PAYMENT_FIELD_MESSAGES.paid_on;
  }
  return errors;
}
