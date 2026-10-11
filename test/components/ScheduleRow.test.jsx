import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ScheduleRow from '../../src/components/ScheduleRow.jsx';

describe('ScheduleRow', () => {
  it('shows title, date, grace note, amount, badge and children', () => {
    render(
      <ScheduleRow
        title="Payment 2"
        amount={500}
        state={{
          badge: 'Overdue',
          badgeClass: 'badge badge-warn',
          dateLabel: 'Oct 1, 2026',
          graceNote: 'Grace period ends Oct 8, 2026',
        }}
      >
        <button type="button">Pay</button>
      </ScheduleRow>,
    );
    expect(screen.getByText('Payment 2')).toBeInTheDocument();
    expect(screen.getByText('Oct 1, 2026 · Grace period ends Oct 8, 2026')).toBeInTheDocument();
    expect(screen.getByText('₱500.00')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toHaveClass('badge-warn');
    expect(screen.getByRole('button', { name: 'Pay' })).toBeInTheDocument();
  });

  it('highlights a rejection note', () => {
    render(
      <ScheduleRow
        title="Down payment"
        amount={100}
        state={{ key: 'rejected', badge: 'Rejected', note: 'Rejected: blurry' }}
      />,
    );
    expect(screen.getByText('Rejected: blurry')).toHaveClass('plan-row-warn');
  });
});
