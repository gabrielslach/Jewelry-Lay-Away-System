import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PaymentHistoryModal from '../../src/components/PaymentHistoryModal.jsx';
import * as adminPayments from '../../src/services/adminPayments.js';

const confirmedRow = {
  id: 1,
  kind: 'installment',
  plan_id: 'LA-1001',
  term_number: 2,
  customer_name: 'Sample Client',
  amount: '9000',
  outcome: 'confirmed',
  reviewed_at: '2026-08-01T05:00:00.000Z',
};

describe('PaymentHistoryModal', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows confirmed payments first with their columns and status badge', async () => {
    const load = vi.spyOn(adminPayments, 'getPaymentHistory').mockResolvedValue([confirmedRow]);
    render(<PaymentHistoryModal onClose={() => {}} />);
    expect(screen.getByText('Loading history…')).toBeInTheDocument();
    const dialog = screen.getByRole('dialog', { name: 'Payment history' });
    expect(await within(dialog).findByText('Sample Client')).toBeInTheDocument();
    ['Date', 'Customer', 'Plan/Order', 'Method', 'Amount', 'Status'].forEach((name) =>
      expect(within(dialog).getByRole('columnheader', { name })).toBeInTheDocument(),
    );
    expect(within(dialog).getByText('#LA-1001 · Payment 2')).toBeInTheDocument();
    expect(within(dialog).getByText('Confirmed', { selector: '.badge-ok' })).toBeInTheDocument();
    expect(load).toHaveBeenCalledWith({ status: 'confirmed', limit: 50 });
  });

  it('switches to rejected and shows an empty message', async () => {
    const load = vi
      .spyOn(adminPayments, 'getPaymentHistory')
      .mockResolvedValueOnce([confirmedRow])
      .mockResolvedValueOnce([]);
    render(<PaymentHistoryModal onClose={() => {}} />);
    await screen.findByText('Sample Client');
    fireEvent.click(screen.getByRole('tab', { name: 'Rejected' }));
    expect(await screen.findByText('No rejected payments.')).toBeInTheDocument();
    expect(load).toHaveBeenLastCalledWith({ status: 'rejected', limit: 50 });
  });

  it('shows the confirmed empty message', async () => {
    vi.spyOn(adminPayments, 'getPaymentHistory').mockResolvedValue([]);
    render(<PaymentHistoryModal onClose={() => {}} />);
    expect(await screen.findByText('No confirmed payments.')).toBeInTheDocument();
  });

  it('shows an error and retries', async () => {
    vi.spyOn(adminPayments, 'getPaymentHistory')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([confirmedRow]);
    render(<PaymentHistoryModal onClose={() => {}} />);
    expect(await screen.findByText("Couldn't load history.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Sample Client')).toBeInTheDocument();
    expect(screen.queryByText("Couldn't load history.")).not.toBeInTheDocument();
  });
});
