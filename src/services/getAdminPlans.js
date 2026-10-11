import { adminRequest } from './ensureAdminToken.js';

const NEXT_DUE = { month: 'short', day: 'numeric', timeZone: 'UTC' };

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

function planStatus(row) {
  if (row.status != null && row.status !== '') {
    return badgeStatus(row.status);
  }
  return row.overdue_count > 0 ? 'warn' : 'ok';
}

function presentPlan(row) {
  return {
    ...row,
    status: planStatus(row),
    next_due: formatDate(row.next_due_date ?? row.next_due, NEXT_DUE),
    installments: row.installments ?? [],
  };
}

export async function getAdminPlans() {
  const data = await adminRequest('/api/admin/plans');
  const rows = data.results ?? data;
  return Array.isArray(rows) ? rows.map(presentPlan) : [];
}
