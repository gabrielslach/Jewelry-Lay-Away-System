import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ReportToolbar from '../../src/components/ReportToolbar.jsx';
import * as downloadModule from '../../src/lib/downloadBlob.js';
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
});
