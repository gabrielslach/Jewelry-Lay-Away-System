import { formatDisplayDate } from './dates.js';

export function paymentKindLabel(payment) {
  return payment.kind === 'down_payment'
    ? 'Down payment'
    : `Payment ${payment.term_number}`;
}

export function paymentDueDateLabel(payment) {
  if (payment.kind !== 'installment') {
    return '—';
  }
  return formatDisplayDate(payment.due_date);
}
