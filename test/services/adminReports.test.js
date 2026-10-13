import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportReportCsv, getReport } from '../../src/services/adminReports.js';
import { signInAdmin } from '../helpers/adminAuth.js';

function readText(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsText(blob);
  });
}

describe.each(['admin', 'accounting'])(
  'admin report services as %s',
  (role) => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('loads receivables, ledger and profit', async () => {
      await signInAdmin(role);
      const receivables = await getReport('receivables');
      expect(receivables).toHaveProperty('outstanding_receivable');
      expect(receivables).toHaveProperty('overdue');
      expect(Array.isArray(receivables.items)).toBe(true);

      const ledger = await getReport('ledger', { limit: 2, offset: 0 });
      expect(ledger.results).toHaveLength(2);
      expect(ledger.count).toBeGreaterThan(2);

      const profit = await getReport('profit');
      expect(profit.interest_profit).toHaveProperty('realized');
      expect(Array.isArray(profit.by_month)).toBe(true);
    });

    it('exports each report as CSV with its file name', async () => {
      await signInAdmin(role);
      const profit = await exportReportCsv('profit');
      expect(profit.filename).toBe('profit-by-month.csv');
      expect(await readText(profit.blob)).toContain(
        'month,interest_profit,markup_profit,total',
      );
      expect((await exportReportCsv('ledger')).filename).toBe('ledger.csv');
      expect((await exportReportCsv('receivables')).filename).toBe(
        'receivables.csv',
      );
    });
  },
);

describe('admin report filters', () => {
  it('sends only the filters that have a value, plus format=csv for exports', async () => {
    await signInAdmin();
    const calls = [];
    const real = fetch;
    vi.stubGlobal('fetch', (url, init) => {
      calls.push(url);
      return real(url, init);
    });
    await getReport('ledger', {
      from: '2026-08-01',
      to: '',
      entry_type: 'payment',
      limit: 25,
    });
    await exportReportCsv('ledger', { from: '2026-08-01', plan_id: '' });
    expect(calls[0]).toBe(
      '/api/finance/ledger?from=2026-08-01&entry_type=payment&limit=25',
    );
    expect(calls[1]).toBe('/api/finance/ledger?from=2026-08-01&format=csv');
  });
});
