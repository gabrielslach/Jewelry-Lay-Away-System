import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/App.jsx';
import { signInAdmin, signOutAdmin } from '../../helpers/adminAuth.js';
import * as adminPayments from '../../../src/services/adminPayments.js';
import * as getLayawayPlanModule from '../../../src/services/getLayawayPlan.js';

describe('PendingPayments', () => {
  beforeEach(async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    await signInAdmin();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    signOutAdmin();
  });

  it('lists pending payments with a View button and opens the review modal', async () => {
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
    vi.spyOn(adminPayments, 'fetchPaymentProof').mockResolvedValue({
      url: '/placeholders/1.svg',
      content_type: 'image/svg+xml',
    });
    vi.spyOn(getLayawayPlanModule, 'getLayawayPlan').mockResolvedValue({
      installments: [],
    });
    render(
      <MemoryRouter initialEntries={['/admin/payments']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Sample Client')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Order/ })).toBeInTheDocument();
    expect(screen.getByText('#LA-1001')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View proof' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAccessibleName('Order #LA-1001');
    expect(
      await within(dialog).findByRole('img', { name: 'Proof of payment' }),
    ).toBeInTheDocument();
  });

  it('closes the modal and refreshes the list after confirming', async () => {
    const list = vi.spyOn(adminPayments, 'getAdminPendingPayments').mockResolvedValue([
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
    vi.spyOn(adminPayments, 'fetchPaymentProof').mockRejectedValue(new Error('none'));
    vi.spyOn(getLayawayPlanModule, 'getLayawayPlan').mockResolvedValue({
      installments: [],
    });
    vi.spyOn(adminPayments, 'confirmAdminPayment').mockResolvedValue({
      reservation: null,
    });
    render(
      <MemoryRouter initialEntries={['/admin/payments']}>
        <App />
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: 'View' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm payment' }),
    );
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('sorts by the expected amount number rather than its text', async () => {
    const payment = (id, plan, amount) => ({
      id,
      kind: 'down_payment',
      plan_id: plan,
      customer_name: `Client ${id}`,
      amount,
      amount_submitted: amount,
      amount_mismatch: 0,
      reference_number: `BT-${id}`,
      paid_on: '2026-10-09',
    });
    vi.spyOn(adminPayments, 'getAdminPendingPayments').mockResolvedValue([
      payment(1, 'LA-1', '9000'),
      payment(2, 'LA-2', '10000'),
    ]);
    render(
      <MemoryRouter initialEntries={['/admin/payments']}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText('Client 1');
    fireEvent.click(
      within(
        screen.getByRole('columnheader', { name: /^Amount Expected/ }),
      ).getByRole('button'),
    );
    const customers = screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[1].textContent);
    expect(customers).toEqual(['Client 1', 'Client 2']);
  });
});
