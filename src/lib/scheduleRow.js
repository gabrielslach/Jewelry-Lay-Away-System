import { addDaysIso, formatDisplayDate, isSameCalendarDay, todayIsoLocal } from './dates.js';

export function downPaymentRowState(plan) {
  const status = plan.down_payment_status ?? 'pending';
  if (status === 'paid') {
    return { key: 'paid', badge: 'Paid', badgeClass: 'badge badge-ok', showForm: false };
  }
  if (status === 'submitted' || status === 'awaiting_confirmation') {
    return {
      key: 'awaiting',
      badge: 'Awaiting confirmation',
      badgeClass: 'badge badge-info',
      note: 'Submitted - waiting for our confirmation.',
      showForm: false,
    };
  }
  if (status === 'rejected') {
    return {
      key: 'rejected',
      badge: 'Rejected',
      badgeClass: 'badge badge-warn',
      note: plan.down_payment_rejection_reason
        ? `Rejected: ${plan.down_payment_rejection_reason}`
        : 'Rejected',
      showForm: true,
      payLabel: 'Pay again',
    };
  }
  return { key: 'due', badge: 'Due now', showForm: true, payLabel: 'Pay' };
}

const PAYMENT_OVERRIDES = ['submitted', 'awaiting_confirmation', 'rejected'];

export function effectiveStatus(row) {
  return PAYMENT_OVERRIDES.includes(row.payment_status) ? row.payment_status : row.status;
}

export function installmentRowState(row, { gracePeriodDays, today = todayIsoLocal(), advanceEligible = false } = {}) {
  const dueDate = row.due_date?.slice(0, 10);
  const status = effectiveStatus(row);
  if (status === 'paid') {
    return { key: 'paid', badge: 'Paid', badgeClass: 'badge badge-ok', showForm: false };
  }
  if (status === 'submitted' || status === 'awaiting_confirmation') {
    return {
      key: 'awaiting',
      badge: 'Awaiting confirmation',
      badgeClass: 'badge badge-info',
      dateLabel: formatDisplayDate(dueDate),
      note: 'Submitted - waiting for our confirmation.',
      showForm: false,
    };
  }
  if (status === 'rejected') {
    return {
      key: 'rejected',
      badge: 'Rejected',
      badgeClass: 'badge badge-warn',
      note: row.rejection_reason ? `Rejected: ${row.rejection_reason}` : 'Rejected',
      showForm: true,
      payLabel: 'Pay again',
    };
  }
  const overdue = row.status === 'overdue' || (dueDate && dueDate < today);
  if (overdue) {
    const graceEnd =
      gracePeriodDays != null && dueDate
        ? addDaysIso(dueDate, Number(gracePeriodDays))
        : null;
    return {
      key: 'overdue',
      badge: 'Overdue',
      badgeClass: 'badge badge-warn',
      dateLabel: formatDisplayDate(dueDate),
      graceNote:
        graceEnd != null ? `Grace period ends ${formatDisplayDate(graceEnd)}` : null,
      showForm: true,
      payLabel: 'Pay',
    };
  }
  if (dueDate && isSameCalendarDay(dueDate, today)) {
    return {
      key: 'due_today',
      badge: 'Due today',
      badgeClass: 'badge badge-amber',
      dateLabel: formatDisplayDate(dueDate),
      showForm: true,
      payLabel: 'Pay',
    };
  }
  return {
    key: 'pending',
    badge: 'Pending',
    badgeClass: 'badge badge-mute',
    dateLabel: formatDisplayDate(dueDate),
    showForm: advanceEligible,
    payLabel: 'Pay ahead',
  };
}
