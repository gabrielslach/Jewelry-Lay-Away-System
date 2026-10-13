import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LayawayPlanCard from '../../src/components/LayawayPlanCard.jsx';
import { ToastProvider } from '../../src/components/ToastProvider.jsx';
import { addDaysIso, formatDisplayDate, todayIsoLocal } from '../../src/lib/dates.js';
import * as bankAccounts from '../../src/services/getBankAccounts.js';

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
    { id: 'LA-9-i1', amount: '1000.00', due_date: todayIsoLocal(), status: 'pending' },
    { id: 'LA-9-i2', amount: '1000.00', due_date: daysFromToday(21), status: 'pending' },
  ],
};

function renderCard(plan = basePlan, props = {}) {
  return render(
    <ToastProvider>
      <LayawayPlanCard plan={plan} {...props} />
    </ToastProvider>,
  );
}

function expand() {
  fireEvent.click(screen.getByRole('button', { name: /Solitaire Halo Ring/ }));
}

describe('LayawayPlanCard', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('summarizes the plan in a single collapsed header button', () => {
    renderCard();
    const header = screen.getByRole('button', { name: /Solitaire Halo Ring/ });
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(header).toHaveAttribute('aria-controls', 'plan-LA-9-details');
    expect(within(header).getByText('On Track')).toBeInTheDocument();
    expect(within(header).getByText('Next due Oct 25')).toBeInTheDocument();
    expect(within(header).getByText('0 of 2 paid')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '0 of 2 installments paid' })).toBeInTheDocument();
    expect(screen.queryByText('Payment schedule')).not.toBeVisible();
  });

  it('reveals order, money summary and the schedule when expanded', () => {
    renderCard();
    expand();
    expect(screen.getByRole('button', { name: /Solitaire Halo Ring/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText(/Order #LA-9/)).toBeVisible();
    expect(screen.getByText('Total to be paid')).toBeVisible();
    expect(screen.getByText(`Paid so far as of ${formatDisplayDate(todayIsoLocal())}`)).toBeVisible();
    expect(screen.getByText('Down payment', { selector: 'b' })).toBeInTheDocument();
    expect(screen.getByText('Payment 1')).toBeVisible();
    expect(screen.getByText('Payment 2')).toBeVisible();
  });

  it('shows No payment due when nothing is upcoming', () => {
    renderCard({ ...basePlan, next_due: '' });
    expect(screen.getByText('No payment due')).toBeInTheDocument();
  });

  it('numbers payments by position and hides superseded installments', () => {
    const superseded = {
      id: 'LA-9-old',
      amount: '500.00',
      due_date: daysFromToday(-5),
      status: 'superseded',
    };
    renderCard({ ...basePlan, installments: [superseded, ...basePlan.installments] });
    expect(screen.getByText('Payment 1')).toBeInTheDocument();
    expect(screen.getByText('Payment 2')).toBeInTheDocument();
    expect(screen.queryByText('Payment 3')).not.toBeInTheDocument();
  });

  it('shows waiting-for-stock, keeps the schedule, and hides pay actions', () => {
    renderCard({ ...basePlan, reservation_status: 'waiting_for_stock' });
    expand();
    expect(screen.getAllByText('Waiting for stock').length).toBeGreaterThan(0);
    const badge = screen
      .getAllByText('Waiting for stock')
      .find((el) => el.classList.contains('badge'));
    expect(badge).toHaveClass('badge-amber');
    expect(screen.queryByText('On Track')).not.toBeInTheDocument();
    expect(screen.getByText('Payment 1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pay' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pay ahead' })).not.toBeInTheDocument();
  });

  it('opens the pay form in a dialog for a due installment', async () => {
    vi.spyOn(bankAccounts, 'getBankAccounts').mockResolvedValue([]);
    renderCard();
    expand();
    expect(screen.getByText('Due today')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pay' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAccessibleName('Pay Payment 1');
    expect(await screen.findByLabelText('Reference number')).toBeInTheDocument();
  });

  it('summarizes rejected or overdue payments in the header', () => {
    const rejected = { ...basePlan.installments[0], status: 'rejected' };
    const overdue = { ...basePlan.installments[1], due_date: daysFromToday(-3) };
    const { rerender } = renderCard({ ...basePlan, installments: [rejected, basePlan.installments[1]] });
    expect(screen.getByText('1 payment needs attention')).toBeInTheDocument();
    rerender(
      <ToastProvider>
        <LayawayPlanCard plan={{ ...basePlan, installments: [rejected, overdue] }} />
      </ToastProvider>,
    );
    expect(screen.getByText('2 payments need attention')).toBeInTheDocument();
  });

  it('omits the attention flag when nothing needs attention', () => {
    renderCard({ ...basePlan, installments: [basePlan.installments[1]] });
    expect(screen.queryByText(/need.* attention/)).not.toBeInTheDocument();
  });

  describe('advance payment', () => {
    const paidFirst = { ...basePlan.installments[0], status: 'paid' };
    const later = [
      { id: 'LA-9-i2', amount: '1000.00', due_date: daysFromToday(21), status: 'pending' },
      { id: 'LA-9-i3', amount: '1000.00', due_date: daysFromToday(51), status: 'pending' },
    ];

    it('offers Pay ahead on the next future row and a note on the locked one', () => {
      renderCard({ ...basePlan, installments: [paidFirst, ...later] });
      expand();
      const buttons = screen.getAllByRole('button', { name: 'Pay ahead' });
      expect(buttons[0]).toBeEnabled();
      expect(buttons[1]).toBeDisabled();
      expect(screen.getByText('Pay Payment 2 first')).toBeInTheDocument();
    });

    it('disables every later Pay button, with a hint on each, while an earlier payment is open', () => {
      renderCard({ ...basePlan, installments: [basePlan.installments[0], ...later] });
      expand();
      const locked = screen.getAllByRole('button', { name: 'Pay ahead' });
      expect(locked).toHaveLength(2);
      locked.forEach((button) => {
        expect(button).toBeDisabled();
        expect(button).toHaveAccessibleDescription('Pay Payment 1 first');
        expect(button.parentElement).toHaveAttribute('title', 'Pay Payment 1 first');
      });
      expect(screen.getByRole('button', { name: 'Pay' })).toBeEnabled();
      expect(screen.getAllByText('Pay Payment 1 first')).toHaveLength(2);
    });

    it('does not let an unpaid down payment lock installments', () => {
      renderCard({
        ...basePlan,
        down_payment_status: 'pending',
        installments: [basePlan.installments[0]],
      });
      expand();
      expect(screen.getAllByRole('button', { name: 'Pay' })[1]).toBeEnabled();
      expect(screen.queryByText(/first/)).not.toBeInTheDocument();
    });

    it('does not offer Pay ahead while the down payment is unpaid', () => {
      renderCard({
        ...basePlan,
        down_payment_status: 'pending',
        installments: [paidFirst, ...later],
      });
      expand();
      expect(screen.queryByRole('button', { name: 'Pay ahead' })).not.toBeInTheDocument();
    });

    it('opens an early-payment dialog explaining the due date', async () => {
      vi.spyOn(bankAccounts, 'getBankAccounts').mockResolvedValue([]);
      renderCard({ ...basePlan, installments: [paidFirst, ...later] });
      expand();
      fireEvent.click(screen.getAllByRole('button', { name: 'Pay ahead' })[0]);
      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveAccessibleName('Pay Payment 2 early');
      expect(within(dialog).getByText(/isn't due until/)).toBeInTheDocument();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
      expect(screen.getAllByRole('button', { name: 'Pay ahead' })[0]).toHaveFocus();
    });
  });

  it('shows installments paid, not money paid, in the progress bar', () => {
    const installments = Array.from({ length: 6 }, (_, index) => ({
      id: `LA-9-i${index + 1}`,
      amount: '1000.00',
      due_date: daysFromToday(index * 7 + 7),
      status: 'pending',
    }));
    renderCard({ ...basePlan, down_payment_amount: 100000, installments });
    expect(screen.getByRole('progressbar')).toHaveAccessibleName('0 of 6 installments paid');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '6');
  });

  it('renders 0 of 0 installments paid with an empty bar', () => {
    renderCard({ ...basePlan, installments: [] });
    expect(screen.getByRole('progressbar')).toHaveAccessibleName('0 of 0 installments paid');
  });

  it('shows the due date on a rejected row and the reason in the warning note', () => {
    const dueDate = daysFromToday(3);
    renderCard({
      ...basePlan,
      installments: [
        { ...basePlan.installments[0], due_date: dueDate, payment_status: 'rejected', rejection_reason: 'Blurry proof' },
      ],
    });
    expand();
    expect(screen.getByText(`Due ${formatDisplayDate(dueDate)}`)).toHaveClass('plan-row-meta');
    expect(screen.getByText('Rejected: Blurry proof')).toHaveClass('plan-row-warn');
  });

  describe('read only (closed plans)', () => {
    const closedPlan = (status) => ({
      ...basePlan,
      status,
      installments: [
        { id: 'LA-9-i1', amount: '1000.00', due_date: '2026-01-10', status: 'paid' },
        { id: 'LA-9-i2', amount: '1000.00', due_date: '2026-02-10', status: 'overdue' },
        { id: 'LA-9-i3', amount: '1000.00', due_date: '2026-03-10', payment_status: 'rejected' },
        { id: 'LA-9-i4', amount: '1000.00', due_date: '2026-04-10', status: 'pending' },
      ],
    });

    it('shows the plan status and only the paid count in the header', () => {
      renderCard(closedPlan('defaulted'), { readOnly: true });
      const header = screen.getByRole('button', { name: /Solitaire Halo Ring/ });
      expect(within(header).getByText('Defaulted')).toHaveClass('badge-warn');
      expect(within(header).getByText('1 of 4 paid')).toBeInTheDocument();
      expect(within(header).queryByText(/Next due|No payment due|attention|On Track|Overdue/)).toBeNull();
      expect(screen.getByRole('progressbar')).toHaveAccessibleName('1 of 4 installments paid');
      expect(header).toHaveAttribute('aria-expanded', 'false');
    });

    it('offers no actions and marks unpaid rows with the plan status, never Overdue', () => {
      renderCard(closedPlan('cancelled'), { readOnly: true });
      expand();
      expect(screen.queryByRole('button', { name: /Pay|Submit proof/ })).not.toBeInTheDocument();
      expect(screen.queryByText(/first$/)).not.toBeInTheDocument();
      expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
      expect(screen.queryByText(/Grace period/)).not.toBeInTheDocument();
      const body = document.getElementById('plan-LA-9-details');
      expect(within(body).getAllByText('Cancelled')).toHaveLength(3);
      expect(within(body).getAllByText('Cancelled')[0]).toHaveClass('badge-mute');
      expect(within(body).getAllByText('Paid')).toHaveLength(2);
      expect(within(body).getByText(formatDisplayDate('2026-02-10'))).toBeInTheDocument();
      expect(within(body).queryByText(/^Due /)).not.toBeInTheDocument();
    });

    it('marks a pending down payment as defaulted without a button', () => {
      renderCard({ ...closedPlan('defaulted'), down_payment_status: 'pending' }, { readOnly: true });
      expand();
      expect(screen.getAllByText('Defaulted')).toHaveLength(5);
      expect(screen.queryByRole('button', { name: 'Pay' })).not.toBeInTheDocument();
    });
  });

  describe('focused', () => {
    it('starts expanded, highlighted, scrolled into view and focused', () => {
      renderCard(basePlan, { focused: true });
      const header = screen.getByRole('button', { name: /Solitaire Halo Ring/ });
      expect(header).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Just reserved')).toBeInTheDocument();
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        block: 'start',
        behavior: 'smooth',
      });
      expect(header).toHaveFocus();
    });

    it('scrolls instantly when reduced motion is preferred', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true });
      renderCard(basePlan, { focused: true });
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
        block: 'start',
        behavior: 'auto',
      });
    });

    it('clears the highlight after 6 seconds but keeps the card expanded', () => {
      vi.useFakeTimers();
      renderCard(basePlan, { focused: true });
      act(() => {
        vi.advanceTimersByTime(6000);
      });
      expect(screen.queryByText('Just reserved')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Solitaire Halo Ring/ })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });

    it('clears the highlight when collapsed', () => {
      renderCard(basePlan, { focused: true });
      expand();
      expect(screen.queryByText('Just reserved')).not.toBeInTheDocument();
    });
  });

  it('has no thumbnail in the plan header block', () => {
    renderCard();
    expect(document.querySelector('.plan-thumb')).toBeNull();
    expect(screen.getByText(/Order #LA-9/)).toBeInTheDocument();
  });

  it('treats payment_status awaiting_confirmation as settled and unlocks the next term', () => {
    renderCard({
      ...basePlan,
      installments: [
        {
          id: 'a',
          amount: '1000.00',
          due_date: daysFromToday(-2),
          status: 'overdue',
          payment_status: 'awaiting_confirmation',
        },
        { id: 'b', amount: '1000.00', due_date: daysFromToday(21), status: 'pending' },
      ],
    });
    expand();
    expect(screen.getByText('Awaiting confirmation')).toBeInTheDocument();
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
    expect(screen.queryByText(/payments? needs? attention/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pay Payment 1 first/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay ahead' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Pay/ })).toHaveLength(1);
  });
});
