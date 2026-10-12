import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/App.jsx';
import { signInAdmin, signOutAdmin } from '../../helpers/adminAuth.js';
import * as adminPayments from '../../../src/services/adminPayments.js';

describe('DuePayments', () => {
  beforeEach(async () => {
    await signInAdmin();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    signOutAdmin();
  });

  it('filters due-today and overdue rows and opens a summary dialog', async () => {
    vi.spyOn(adminPayments, 'getAdminDuePayments').mockResolvedValue({
      items: [
        {
          installment_id: 'a',
          plan_id: 'LA-1',
          term_number: 1,
          due_date: '2026-10-10',
          amount: '1000',
          days_overdue: 0,
          due_today: true,
          awaiting_confirmation: false,
          item_name: 'Solitaire Halo Ring',
          grace_period_days: 7,
          grace_ends_on: '2026-10-17',
          customer_name: 'Due Today Client',
          customer_email: 'due@example.com',
          customer_phone: '111',
        },
        {
          installment_id: 'b',
          plan_id: 'LA-2',
          term_number: 2,
          due_date: '2026-10-01',
          amount: '2000',
          days_overdue: 9,
          due_today: false,
          awaiting_confirmation: true,
          item_name: 'Vintage Rose Pendant',
          grace_period_days: 7,
          grace_ends_on: '2026-10-08',
          customer_name: 'Overdue Client',
          customer_email: 'over@example.com',
          customer_phone: '222',
        },
      ],
    });
    render(
      <MemoryRouter initialEntries={['/admin/payments/due']}>
        <App />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Due Today Client')).toBeInTheDocument();
    expect(screen.getByText('Overdue Client')).toBeInTheDocument();
    expect(screen.getByText('Due today')).toBeInTheDocument();
    expect(screen.getByText('9 days overdue')).toBeInTheDocument();
    expect(screen.getByText('Payment awaiting confirmation')).toBeInTheDocument();
    expect(screen.getByText(/Grace period expired/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Due today \(/ }));
    expect(screen.getByText('Due Today Client')).toBeInTheDocument();
    expect(screen.queryByText('Overdue Client')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Overdue \(/ }));
    expect(screen.getByText('Overdue Client')).toBeInTheDocument();
    expect(screen.getByText('9 days overdue')).toBeInTheDocument();
    expect(screen.getByText('Payment awaiting confirmation')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAccessibleName('Order #LA-2');
    expect(within(dialog).getByText('Overdue Client')).toBeInTheDocument();
    expect(within(dialog).getByText('Vintage Rose Pendant')).toBeInTheDocument();
    expect(within(dialog).getByText(/Payment 2 -/)).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Open Pending payments to confirm or reject/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View' })).not.toBeInTheDocument();
  });

  it('sorts by the numeric amount when the header is clicked', async () => {
    const row = (id, name, amount) => ({
      installment_id: id,
      plan_id: `LA-${id}`,
      term_number: 1,
      due_date: '2026-10-10',
      amount,
      days_overdue: 0,
      due_today: true,
      customer_name: name,
      customer_email: `${id}@example.com`,
      customer_phone: '1',
    });
    vi.spyOn(adminPayments, 'getAdminDuePayments').mockResolvedValue({
      items: [row('a', 'Big Client', '10000'), row('b', 'Small Client', '900')],
    });
    render(
      <MemoryRouter initialEntries={['/admin/payments/due']}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByText('Big Client');
    fireEvent.click(
      within(screen.getByRole('columnheader', { name: /^Amount/ })).getByRole('button'),
    );
    const names = screen
      .getAllByRole('row')
      .slice(1)
      .map((r) => within(r).getAllByRole('cell')[1].textContent);
    expect(names[0]).toContain('Small Client');
    expect(names[1]).toContain('Big Client');
  });
});
