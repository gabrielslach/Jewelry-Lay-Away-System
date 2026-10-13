import { adminRequest, withAdminAuth } from './ensureAdminToken.js';
import { requestBlob } from './http.js';

const REPORTS = {
  receivables: {
    path: '/api/admin/reports/receivables',
    file: 'receivables.csv',
  },
  ledger: { path: '/api/finance/ledger', file: 'ledger.csv' },
  profit: { path: '/api/admin/reports/profit', file: 'profit-by-month.csv' },
};

function reportUrl(report, filters = {}, extra = {}) {
  const query = new URLSearchParams();
  Object.entries({ ...filters, ...extra }).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) {
      query.set(key, value);
    }
  });
  const text = query.toString();
  return text ? `${REPORTS[report].path}?${text}` : REPORTS[report].path;
}

export function getReport(report, filters) {
  return adminRequest(reportUrl(report, filters));
}

export async function exportReportCsv(report, filters) {
  const { blob } = await withAdminAuth((token) =>
    requestBlob(reportUrl(report, filters, { format: 'csv' }), { token }),
  );
  return { blob, filename: REPORTS[report].file };
}
