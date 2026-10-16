import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PlanMoneySummary from '../../src/components/PlanMoneySummary.jsx';

const plan = {
  down_payment_amount: 3600,
  down_payment_status: 'paid',
  installments: [
    { amount: 4200, status: 'pending' },
    { amount: 4200, status: 'pending' },
    { amount: 999, status: 'superseded' },
  ],
};

describe('PlanMoneySummary', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the four money figures and the as-of date', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 12, 12));
    render(<PlanMoneySummary plan={plan} />);
    expect(screen.getByText('Total to be paid').nextSibling).toHaveTextContent('₱12,000.00');
    expect(screen.getByText('Financed amount').nextSibling).toHaveTextContent('₱8,400.00');
    expect(screen.getByText('Down payment').nextSibling).toHaveTextContent('₱3,600.00');
    expect(screen.getByText('Paid so far').nextSibling).toHaveTextContent('₱3,600.00');
    expect(screen.getByText('Paid so far as of Oct 12, 2026')).toBeInTheDocument();
  });
});
