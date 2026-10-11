import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LayawayPlanCard from '../../src/components/LayawayPlanCard.jsx';
import { ToastProvider } from '../../src/components/ToastProvider.jsx';
import { addDaysIso, todayIsoLocal } from '../../src/lib/dates.js';
import * as bankAccounts from '../../src/services/getBankAccounts.js';

function todayIso() {
  return todayIsoLocal();
}

function daysFromToday(days) {
  return addDaysIso(todayIsoLocal(), days);
}

const basePlan = {
  id: 'LA-9',
  item_name: 'Solitaire Halo Ring',
  plan_label: '1 Mo. / 2 Payments',
  status: 'ok',
  next_due: 'Oct 25',
  down_payment_amount: 1000,
  down_payment_status: 'paid',
  grace_period_days: 7,
  installments: [
    {
      id: 'LA-9-i1',
      term_number: 1,
      amount: '500',
      due_date: todayIso(),
      status: 'pending',
    },
    {
      id: 'LA-9-i2',
      term_number: 2,
      amount: '500',
      due_date: daysFromToday(21),
      status: 'pending',
    },
  ],
};

describe('LayawayPlanCard', () => {
  it('shows waiting-for-stock, keeps the schedule, and hides pay actions', () => {
    render(
      <ToastProvider>
        <LayawayPlanCard
          plan={{ ...basePlan, reservation_status: 'waiting_for_stock' }}
        />
      </ToastProvider>,
    );
    expect(screen.getAllByText('Waiting for stock').length).toBeGreaterThan(0);
    expect(screen.getByText('Down payment')).toBeInTheDocument();
    expect(screen.getByText('Payment 1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pay' })).not.toBeInTheDocument();
  });

  it('opens the pay form in a dialog for a due installment', async () => {
    vi.spyOn(bankAccounts, 'getBankAccounts').mockResolvedValue([]);
    render(
      <ToastProvider>
        <LayawayPlanCard plan={basePlan} />
      </ToastProvider>,
    );
    expect(screen.getByText('Due today')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pay' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAccessibleName('Pay Payment 1');
    expect(await screen.findByLabelText('Reference number')).toBeInTheDocument();
  });
});
