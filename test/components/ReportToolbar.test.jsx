import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ReportToolbar from '../../src/components/ReportToolbar.jsx';
import * as downloadModule from '../../src/lib/downloadBlob.js';
import { ServiceError } from '../../src/services/http.js';
import * as reportsModule from '../../src/services/adminReports.js';

describe('ReportToolbar', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the filters and downloads the CSV with the given filters', async () => {
    const blob = new Blob(['x']);
    const exportCsv = vi
      .spyOn(reportsModule, 'exportReportCsv')
      .mockResolvedValue({ blob, filename: 'ledger.csv' });
    const save = vi
      .spyOn(downloadModule, 'downloadBlob')
      .mockImplementation(() => {});
    render(
      <ReportToolbar report="ledger" exportFilters={{ from: '2026-10-01' }}>
        <span>filters</span>
      </ReportToolbar>,
    );
    expect(screen.getByText('filters')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(blob, 'ledger.csv'));
    expect(exportCsv).toHaveBeenCalledWith('ledger', { from: '2026-10-01' });
  });

  it('reports a failed export inline', async () => {
    vi.spyOn(reportsModule, 'exportReportCsv').mockRejectedValue(
      new Error('x'),
    );
    render(<ReportToolbar report="profit" exportFilters={{}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    expect(
      await screen.findByText('Could not export. Try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeEnabled();
  });

  it.each([400, 401, 403])('shows the server text for status %s', async (status) => {
    vi.spyOn(reportsModule, 'exportReportCsv').mockRejectedValue(
      new ServiceError('Not allowed', status),
    );
    render(<ReportToolbar report="profit" exportFilters={{}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    expect(await screen.findByText('Not allowed')).toBeInTheDocument();
  });

  it('falls back to the generic text for an empty 403 or a 500', async () => {
    const exportCsv = vi
      .spyOn(reportsModule, 'exportReportCsv')
      .mockRejectedValueOnce(new ServiceError('', 403))
      .mockRejectedValueOnce(new ServiceError('Boom', 500));
    render(<ReportToolbar report="profit" exportFilters={{}} />);
    const button = screen.getByRole('button', { name: 'Export CSV' });
    fireEvent.click(button);
    expect(
      await screen.findByText('Could not export. Try again.'),
    ).toBeInTheDocument();
    fireEvent.click(button);
    await waitFor(() => expect(exportCsv).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Could not export. Try again.')).toBeInTheDocument();
    expect(screen.queryByText('Boom')).not.toBeInTheDocument();
  });

  it('clears the message when a new export starts', async () => {
    let finish;
    vi.spyOn(reportsModule, 'exportReportCsv')
      .mockRejectedValueOnce(new ServiceError('Not allowed', 403))
      .mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    render(<ReportToolbar report="profit" exportFilters={{}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    await screen.findByText('Not allowed');
    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    await waitFor(() =>
      expect(screen.queryByText('Not allowed')).not.toBeInTheDocument(),
    );
    finish({ blob: new Blob(['a']), filename: 'a.csv' });
  });
});
