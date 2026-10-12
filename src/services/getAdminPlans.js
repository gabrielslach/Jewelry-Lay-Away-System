import { adminRequest } from './ensureAdminToken.js';

const NEXT_DUE = { month: 'short', day: 'numeric', timeZone: 'UTC' };

function formatDate(iso, options) {
  if (!iso) {
    return '';
  }
  return new Date(iso).toLocaleString('en-US', options);
}

function presentPlan(row) {
  return {
    ...row,
    next_due: formatDate(row.next_due_date ?? row.next_due, NEXT_DUE),
    next_due_date: row.next_due_date ?? row.next_due ?? null,
    installments: row.installments ?? [],
  };
}

export async function getAdminPlans() {
  const data = await adminRequest('/api/admin/plans');
  const rows = data.results ?? data;
  return Array.isArray(rows) ? rows.map(presentPlan) : [];
}
