import { customerRequest } from './customerRequest.js';

const NEXT_DUE = { month: 'short', day: 'numeric', timeZone: 'UTC' };
const COMPLETED_ON = { month: 'short', year: 'numeric', timeZone: 'UTC' };

function formatDate(iso, options) {
  if (!iso) {
    return '';
  }
  return new Date(iso).toLocaleString('en-US', options);
}

function badgeStatus(status) {
  if (status === 'on_track') {
    return 'ok';
  }
  if (status === 'overdue') {
    return 'warn';
  }
  return status;
}

function presentOrder(row) {
  return {
    id: row.id,
    item_name: row.item_name,
    plan_label: row.plan_label,
    installments: row.installments ?? [],
    status: badgeStatus(row.status),
    next_due: formatDate(row.next_due_date ?? row.next_due, NEXT_DUE),
    down_payment_amount: row.down_payment_amount,
    down_payment_status: row.down_payment_status,
    down_payment_rejection_reason: row.down_payment_rejection_reason,
    reservation_status: row.reservation_status,
    grace_period_days: row.grace_period_days,
    completed_on: formatDate(row.completed_on, COMPLETED_ON),
  };
}

export async function getCustomerOrders() {
  const data = await customerRequest('/api/customers/orders');
  const rows = Array.isArray(data) ? data : [];
  return {
    active: rows
      .filter((row) => row.status === 'on_track' || row.status === 'overdue')
      .map(presentOrder),
    closed: rows
      .filter((row) => row.status === 'cancelled' || row.status === 'defaulted')
      .map(presentOrder),
    completed: rows.filter((row) => row.status === 'completed').map(presentOrder),
  };
}
