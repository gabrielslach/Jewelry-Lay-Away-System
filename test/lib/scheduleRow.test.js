import { describe, expect, it } from 'vitest';
import { downPaymentRowState, installmentRowState } from '../../src/lib/scheduleRow.js';

describe('scheduleRow', () => {
  it('maps down payment statuses for pay actions', () => {
    expect(downPaymentRowState({ down_payment_status: 'paid' }).showForm).toBe(false);
    expect(downPaymentRowState({ down_payment_status: 'submitted' }).badge).toBe(
      'Awaiting confirmation',
    );
    expect(
      downPaymentRowState({
        down_payment_status: 'rejected',
        down_payment_rejection_reason: 'Blurry proof',
      }),
    ).toMatchObject({
      badge: 'Rejected',
      note: 'Rejected: Blurry proof',
      payLabel: 'Pay again',
      showForm: true,
    });
    expect(downPaymentRowState({}).badge).toBe('Due now');
  });

  it('maps installment row badges and only opens pay when due', () => {
    expect(installmentRowState({ status: 'paid' }, { today: '2026-10-10' }).showForm).toBe(false);
    expect(
      installmentRowState(
        { status: 'pending', due_date: '2026-10-10' },
        { today: '2026-10-10' },
      ),
    ).toMatchObject({
      badge: 'Due today',
      badgeClass: 'badge badge-amber',
      showForm: true,
      payLabel: 'Pay',
    });
    expect(
      installmentRowState(
        { status: 'pending', due_date: '2026-10-01' },
        { gracePeriodDays: 7, today: '2026-10-10' },
      ),
    ).toMatchObject({
      badge: 'Overdue',
      badgeClass: 'badge badge-warn',
      graceNote: 'Grace period ends Oct 8, 2026',
      showForm: true,
    });
    expect(
      installmentRowState(
        { status: 'awaiting_confirmation', due_date: '2026-10-10' },
        { today: '2026-10-10' },
      ),
    ).toMatchObject({
      badge: 'Awaiting confirmation',
      badgeClass: 'badge badge-info',
    });
    expect(
      installmentRowState(
        { status: 'pending', due_date: '2026-11-01' },
        { today: '2026-10-10' },
      ),
    ).toMatchObject({
      badge: 'Pending',
      badgeClass: 'badge badge-mute',
      showForm: false,
    });
  });
});
