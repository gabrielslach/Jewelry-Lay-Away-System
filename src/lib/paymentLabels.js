import { formatDisplayDate } from './dates.js';

export function paymentKindLabel(payment) {
  return payment.kind === 'down_payment'
    ? 'Down payment'
    : `Payment ${payment.term_number}`;
}

export function paymentTermLabel(payment) {
  if (payment.kind !== 'installment') {
    return '—';
  }
  return `${payment.term_number ? `Payment ${payment.term_number}` : ''} ${formatDisplayDate(payment.due_date)}`;
}
