import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from '../../../src/App.jsx';
import * as adminPayments from '../../../src/services/adminPayments.js';

describe('PendingPayments', () => {
  it('lists pending payments and confirms one', async () => {
    vi.spyOn(adminPayments, 'getAdminPendingPayments').mockResolvedValue([
      {
        id: 11,
        kind: 'down_payment',
        plan_id: 'LA-1001',
        customer_name: 'Sample Client',
        amount: '14400',
        amount_submitted: '14400',
        amount_mismatch: 0,
        reference_number: 'BT-11',
        paid_on: '2026-10-09',
      },
    ]);
    const confirm = vi
      .spyOn(adminPayments, 'confirmAdminPayment')
      .mockResolvedValue({ status: 'confirmed', reservation: { state: 'reserved' } });
    render(
      <MemoryRouter initialEntries={['/admin/payments']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Sample Client')).toBeInTheDocument();
    expect(screen.getByText('BT-11')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));
    await waitFor(() => {
      expect(confirm).toHaveBeenCalledWith(11, expect.any(Object));
    });
    expect(await screen.findByText(/Payment confirmed/)).toBeInTheDocument();
  });
});
