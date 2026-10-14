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
  aging: [
    { label: '1-7 days', count: 1, amount: 1000 },
    { label: '8-30 days', count: 0, amount: 0 },
    { label: '31+ days', count: 3, amount: 2000 },
  ],
  items: [
    {
      installment_id: 7,
      plan_id: 12,
      term_number: 2,
      due_date: '2026-10-07T16:00:00.000Z',
      amount: 1500,
      days_overdue: 6,
      customer_id: 3,
      customer_name: 'Ana Cruz',
      customer_email: 'ana@example.com',
      customer_phone: '+63 900 000 0003',
    },
    {
      installment_id: 8,
      plan_id: 13,
      term_number: 1,
      due_date: '2026-10-13T16:00:00.000Z',
      amount: 500,
      days_overdue: 0,
      customer_id: 4,
      customer_name: '',
      customer_email: '',
      customer_phone: '',
    },
  ],
};

const ledgerRows = (count) =>
  Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    created_at: '2026-10-07T16:30:00.000Z',
    entry_type: 'payment',
    amount: '100.50',
    plan_id: index + 1,
    installment_id: index === 0 ? null : index,
    finance_account_id: 4,
    customer_name: `Customer ${index}`,
  }));

const profit = {
  interest_profit: {
    realized: 1000,
    scheduled_remaining: 400,
    installments_paid: 13,
  },
  markup_profit: {
    booked_on_new_plans: 5000,
    realized_on_installments: 250,
    plans_counted: 14,
  },
  total_realized: 1250,
  principal_collected: 8000,
  down_payments_collected: 2500.5,
  by_month: [{ month: '2026-10', interest_profit: 1000, markup_profit: 250.5 }],
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
          return ledgerRows(Math.min(26, 60 - filters.offset));
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

  it('shows receivable totals, aging tiles and the fixed columns', async () => {
    renderReports();
    expect(await screen.findByText('Ana Cruz')).toBeInTheDocument();
    expect(screen.getByText('As of today')).toBeInTheDocument();
    const tiles = [...document.querySelectorAll('.stat-tile')];
    expect(
      tiles.map((tile) => tile.querySelector('.stat-label').textContent),
    ).toEqual([
      'Outstanding receivable',
      'Overdue',
      '1-7 days',
      '8-30 days',
      '31+ days',
    ]);
    expect(tiles[2]).toHaveTextContent('₱1,000.00');
    expect(tiles[2]).toHaveTextContent('1 installment');
    expect(tiles[2]).not.toHaveTextContent('1 installments');
    expect(tiles[3]).toHaveTextContent('0 installments');
    expect(tiles[4]).toHaveTextContent('3 installments');
    expect(screen.getByText('₱12,000.50')).toBeInTheDocument();
    expect(
      screen.getAllByRole('columnheader').map((header) => header.textContent),
    ).toEqual([
      'Customer',
      'Plan',
      'Installment',
      'Due date',
      'Amount due',
      'Days overdue',
    ]);
    const [, first, second] = screen.getAllByRole('row');
    expect(
      within(first)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual([
      'Ana Cruzana@example.com+63 900 000 0003',
      '#12',
      '#2',
      'Oct 8, 2026',
      '₱1,500.00',
      '6',
    ]);
    expect(
      within(second)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['-', '#13', '#1', 'Oct 14, 2026', '₱500.00', '-']);
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
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
    expect(await screen.findByText('Customer 0')).toBeInTheDocument();
    expect(screen.getByText('Showing 1-25')).toBeInTheDocument();
    expect(screen.getByText('Entries shown')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Showing 26-50')).toBeInTheDocument();
    expect(reportsModule.getReport).toHaveBeenLastCalledWith(
      'ledger',
      expect.objectContaining({ limit: 26, offset: 25 }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Showing 51-60')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
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
        limit: 26,
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

  it('shows ledger columns, the page total and server rows only', async () => {
    renderReports();
    fireEvent.click(screen.getByRole('tab', { name: 'Ledger' }));
    expect(await screen.findByText('Customer 0')).toBeInTheDocument();
    expect(
      screen.getAllByRole('columnheader').map((header) => header.textContent),
    ).toEqual([
      'Date',
      'Type',
      'Customer',
      'Plan',
      'Installment',
      'Amount',
    ]);
    const cells = within(screen.getAllByRole('row')[1])
      .getAllByRole('cell')
      .map((cell) => cell.textContent.replace(/\s/g, ' '));
    expect(cells).toEqual([
      'Oct 8, 2026, 12:30 AM',
      'Payment',
      'Customer 0',
      '#1',
      '-',
      '₱100.50',
    ]);
    expect(screen.getByText('Page total')).toBeInTheDocument();
    expect(screen.getByText('₱2,512.50')).toBeInTheDocument();
    expect(screen.queryByText('Total entries')).not.toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(26);
  });

  it('shows the ledger empty state', async () => {
    reportsModule.getReport.mockResolvedValue([]);
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
    await screen.findByText('Customer 0');
    fireEvent.change(screen.getByLabelText('From'), {
      target: { value: '2026-10-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    expect(screen.getByRole('button', { name: 'Exporting...' })).toBeDisabled();
    expect(reportsModule.exportReportCsv).toHaveBeenCalledWith(
      'ledger',
      expect.not.objectContaining({ limit: 26 }),
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

  it('keeps interest and markup profit apart, shows counts as integers and totals each month', async () => {
    renderReports();
    fireEvent.click(screen.getByRole('tab', { name: 'Profit' }));
    expect(await screen.findByText('Oct 2026')).toBeInTheDocument();
    const [interest, markup, total, principal, downPayments] = [
      ...document.querySelectorAll('.stat-tile'),
    ];
    expect(interest).toHaveTextContent('Interest profit');
    expect(interest).toHaveTextContent('Realized: ₱1,000.00');
    expect(interest).toHaveTextContent('Scheduled remaining: ₱400.00');
    expect(interest).toHaveTextContent('Installments paid: 13');
    expect(markup).toHaveTextContent('Booked on new plans: ₱5,000.00');
    expect(markup).toHaveTextContent('Realized on installments: ₱250.00');
    expect(markup).toHaveTextContent('Plans counted: 14');
    expect(total).toHaveTextContent('Total realized');
    expect(total).toHaveTextContent('₱1,250.00');
    expect(total).toHaveClass('stat-tile-emphasis');
    expect(principal).toHaveTextContent('Principal collected');
    expect(principal).toHaveTextContent('₱8,000.00');
    expect(principal).toHaveClass('stat-tile-small');
    expect(downPayments).toHaveTextContent('Down payments collected');
    expect(downPayments).toHaveTextContent('₱2,500.50');
    const row = screen.getByText('Oct 2026').closest('tr');
    expect(
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['Oct 2026', '₱1,000.00', '₱250.50', '₱1,250.50']);
  });

  it('shows zero for missing secondary profit values', async () => {
    reportsModule.getReport.mockResolvedValue({ ...profit, principal_collected: undefined, down_payments_collected: undefined });
    renderReports();
    fireEvent.click(screen.getByRole('tab', { name: 'Profit' }));
    await screen.findByText('Oct 2026');
    expect(screen.getByText('Principal collected').parentElement).toHaveTextContent('₱0.00');
    expect(screen.getByText('Down payments collected').parentElement).toHaveTextContent('₱0.00');
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
