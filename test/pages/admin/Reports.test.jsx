import { MemoryRouter } from 'react-router-dom';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/App.jsx';
import * as downloadModule from '../../../src/lib/downloadBlob.js';
import * as reportsModule from '../../../src/services/adminReports.js';
import { ServiceError } from '../../../src/services/http.js';
import { signInAdmin, signOutAdmin } from '../../helpers/adminAuth.js';

function renderReports() {
  render(
    <MemoryRouter initialEntries={['/admin/reports']}>
      <App />
    </MemoryRouter>,
  );
}

const receivables = {
  overdue: { count: 2, amount: 3000 },
  outstanding_receivable: { count: 5, amount: 12000.5 },
  aging: {
    days_1_7: { count: 1, amount: 1000 },
    days_31_plus: 2000,
    odd_bucket: 5,
  },
  items: [
    {
      plan_id: 'LA-1002',
      customer_name: 'Ana Cruz',
      due_date: '2026-09-15',
      amount: 1500,
      days_overdue: 29,
    },
  ],
};

const ledgerRows = (count) =>
  Array.from({ length: count }, (_, index) => ({
    date: '2026-10-01',
    entry_type: 'payment',
    plan_id: `LA-${index}`,
    description: `Entry ${index}`,
    amount: 100,
  }));

const profit = {
  interest_profit: { realized: 1000, scheduled_remaining: 400 },
  markup_profit: { booked_on_new_plans: 5000, realized_on_installments: 250 },
  total_realized: 1250,
  by_month: [
    {
      month: '2026-10',
      interest_profit: 1000,
      markup_profit: 250,
      total: 1250,
    },
  ],
};

describe.each(['admin', 'accounting'])('admin reports page as %s', (role) => {
  beforeEach(async () => {
    await signInAdmin(role);
    vi.spyOn(reportsModule, 'getReport').mockImplementation(
      async (report, filters) => {
        if (report === 'receivables') {
          return receivables;
        }
        if (report === 'ledger') {
          return { results: ledgerRows(25), count: 60, offset: filters.offset };
        }
        return profit;
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    signOutAdmin();
  });

  it('shows three tabs with Receivables selected first', async () => {
    renderReports();
    expect(
      screen.getByText(
        'Receivables, ledger and profit. Export any view as CSV.',
      ),
    ).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Receivables',
      'Ledger',
      'Profit',
    ]);
    expect(screen.getByRole('tab', { name: 'Receivables' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(await screen.findByText('Ana Cruz')).toBeInTheDocument();
  });

  it('shows receivable totals with humanized aging buckets and only the columns present', async () => {
    renderReports();
    expect(await screen.findByText('Ana Cruz')).toBeInTheDocument();
    expect(screen.getByText('As of today')).toBeInTheDocument();
    const tiles = document.querySelectorAll('.stat-tile');
    expect(
      [...tiles].map((tile) => tile.querySelector('.stat-label').textContent),
    ).toEqual([
      'Outstanding receivable',
      'Overdue',
      '1-7 days',
      '31+ days',
      'odd_bucket',
    ]);
    expect(screen.getByText('₱12,000.50')).toBeInTheDocument();
    const headers = screen
      .getAllByRole('columnheader')
      .map((header) => header.textContent);
    expect(headers).toEqual([
      'Plan/Order',
      'Customer',
      'Due date',
      'Amount due',
      'Days overdue',
    ]);
    expect(screen.getByText('Sep 15, 2026')).toBeInTheDocument();
    expect(screen.getByText('₱1,500.00')).toBeInTheDocument();
  });

  it('shows the empty state when nothing is outstanding', async () => {
    reportsModule.getReport.mockResolvedValue({ items: [] });
    renderReports();
    expect(await screen.findByText('Nothing outstanding.')).toBeInTheDocument();
  });

  it('shows the error with a retry', async () => {
    reportsModule.getReport
      .mockRejectedValueOnce(new ServiceError('Server down', 500))
      .mockResolvedValue(receivables);
    renderReports();
    expect(await screen.findByRole('alert')).toHaveTextContent('Server down');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Ana Cruz')).toBeInTheDocument();
  });

  it('pages the ledger and resets to the first page on Apply', async () => {
    renderReports();
    fireEvent.click(screen.getByRole('tab', { name: 'Ledger' }));
    expect(await screen.findByText('Entry 0')).toBeInTheDocument();
    expect(screen.getByText('Showing 1-25')).toBeInTheDocument();
    expect(screen.getByText('Entries shown')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Showing 26-50')).toBeInTheDocument();
    expect(reportsModule.getReport).toHaveBeenLastCalledWith(
      'ledger',
      expect.objectContaining({ limit: 25, offset: 25 }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Showing 51-75')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Entry type'), {
      target: { value: 'penalty' },
    });
    fireEvent.change(screen.getByLabelText('Plan ID'), {
      target: { value: '7' },
    });
    fireEvent.change(screen.getByLabelText('From'), {
      target: { value: '2026-10-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() =>
      expect(reportsModule.getReport).toHaveBeenLastCalledWith('ledger', {
        from: '2026-10-01',
        to: '',
        entry_type: 'penalty',
        plan_id: '7',
        limit: 25,
        offset: 0,
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await waitFor(() =>
      expect(reportsModule.getReport).toHaveBeenLastCalledWith(
        'ledger',
        expect.objectContaining({
          from: '',
          entry_type: '',
          plan_id: '',
          offset: 0,
        }),
      ),
    );
    expect(screen.getByLabelText('Plan ID')).toHaveValue(null);
  });

  it('shows the ledger empty state', async () => {
    reportsModule.getReport.mockResolvedValue({ results: [] });
    renderReports();
    fireEvent.click(screen.getByRole('tab', { name: 'Ledger' }));
    expect(
      await screen.findByText('No results for these filters.'),
    ).toBeInTheDocument();
  });

  it('exports the ledger without paging', async () => {
    const save = vi
      .spyOn(downloadModule, 'downloadBlob')
      .mockImplementation(() => {});
    let finish;
    vi.spyOn(reportsModule, 'exportReportCsv').mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderReports();
    fireEvent.click(screen.getByRole('tab', { name: 'Ledger' }));
    await screen.findByText('Entry 0');
    fireEvent.change(screen.getByLabelText('From'), {
      target: { value: '2026-10-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    expect(screen.getByRole('button', { name: 'Exporting...' })).toBeDisabled();
    expect(reportsModule.exportReportCsv).toHaveBeenCalledWith(
      'ledger',
      expect.not.objectContaining({ limit: 25 }),
    );
    const blob = new Blob(['a']);
    finish({ blob, filename: 'ledger.csv' });
    await waitFor(() => expect(save).toHaveBeenCalledWith(blob, 'ledger.csv'));
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeEnabled();
  });

  it('shows an inline message when the export fails', async () => {
    vi.spyOn(reportsModule, 'exportReportCsv').mockRejectedValue(
      new Error('x'),
    );
    renderReports();
    await screen.findByText('Ana Cruz');
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    expect(
      await screen.findByText('Could not export. Try again.'),
    ).toBeInTheDocument();
  });

  it('keeps interest and markup profit apart and only totals realized', async () => {
    renderReports();
    fireEvent.click(screen.getByRole('tab', { name: 'Profit' }));
    expect(await screen.findByText('Oct 2026')).toBeInTheDocument();
    const [interest, markup, total] = [
      ...document.querySelectorAll('.stat-tile'),
    ];
    expect(interest).toHaveTextContent('Interest profit');
    expect(interest).toHaveTextContent('Realized: ₱1,000.00');
    expect(interest).toHaveTextContent('Scheduled remaining: ₱400.00');
    expect(markup).toHaveTextContent('Booked on new plans: ₱5,000.00');
    expect(markup).toHaveTextContent('Realized on installments: ₱250.00');
    expect(total).toHaveTextContent('Total realized');
    expect(total).toHaveTextContent('₱1,250.00');
    expect(total).toHaveClass('stat-tile-emphasis');
    const row = screen.getByText('Oct 2026').closest('tr');
    expect(
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['Oct 2026', '₱1,000.00', '₱250.00', '₱1,250.00']);
  });

  it('applies the profit date range', async () => {
    renderReports();
    fireEvent.click(screen.getByRole('tab', { name: 'Profit' }));
    await screen.findByText('Oct 2026');
    fireEvent.change(screen.getByLabelText('To'), {
      target: { value: '2026-10-31' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await waitFor(() =>
      expect(reportsModule.getReport).toHaveBeenLastCalledWith('profit', {
        from: '',
        to: '2026-10-31',
      }),
    );
  });

  it('shows the profit empty state', async () => {
    reportsModule.getReport.mockImplementation(async (report) =>
      report === 'profit' ? { by_month: [], total_realized: 0 } : receivables,
    );
    renderReports();
    fireEvent.click(screen.getByRole('tab', { name: 'Profit' }));
    expect(
      await screen.findAllByText('No profit recorded for this period.'),
    ).not.toHaveLength(0);
  });
});
