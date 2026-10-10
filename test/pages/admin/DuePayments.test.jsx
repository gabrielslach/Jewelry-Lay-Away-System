import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from '../../../src/App.jsx';
import * as adminPayments from '../../../src/services/adminPayments.js';

describe('DuePayments', () => {
  it('filters due-today and overdue rows', async () => {
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
    fireEvent.click(screen.getByRole('button', { name: /Due today/ }));
    expect(screen.getByText('Due Today Client')).toBeInTheDocument();
    expect(screen.queryByText('Overdue Client')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Overdue/ }));
    expect(screen.getByText('Overdue Client')).toBeInTheDocument();
    expect(screen.getByText('Payment awaiting confirmation')).toBeInTheDocument();
  });
});
