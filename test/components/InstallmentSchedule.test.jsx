import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InstallmentSchedule from '../../src/components/InstallmentSchedule.jsx';

describe('InstallmentSchedule', () => {
  it('lists each payment with its amount and status', () => {
    render(
      <InstallmentSchedule
        installments={[
          { id: 1, term_number: 1, amount: 1000, status: 'paid' },
          { id: 2, term_number: 2, amount: 1000, status: 'submitted' },
          { id: 4, term_number: 4, amount: 1000, status: 'pending', payment_status: 'submitted' },
          { id: 3, term_number: 3, amount: 1000, status: 'pending', due_date: '2026-12-15' },
        ]}
      />,
    );
    expect(screen.getByText('Payment 1 of 4')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getAllByText('Awaiting confirmation')).toHaveLength(2);
    expect(screen.getByText('Dec 15, 2026')).toBeInTheDocument();
    expect(screen.queryByText('Pending')).not.toBeInTheDocument();
  });
});
