import { describe, expect, it } from 'vitest';
import {
  downPaymentRowState,
  effectiveStatus,
  installmentRowState,
} from '../../src/lib/scheduleRow.js';

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

  it('offers Pay ahead on a future pending row only when advance is eligible', () => {
    const row = { status: 'pending', due_date: '2026-11-10' };
    const locked = installmentRowState(row, { today: '2026-10-10' });
    expect(locked).toMatchObject({ key: 'pending', showForm: false });
    const open = installmentRowState(row, { today: '2026-10-10', advanceEligible: true });
    expect(open).toMatchObject({ showForm: true, payLabel: 'Pay ahead' });
  });

  it('lets payment_status override status when awaiting or rejected', () => {
    expect(effectiveStatus({ status: 'pending', payment_status: 'rejected' })).toBe('rejected');
    expect(effectiveStatus({ status: 'paid', payment_status: 'confirmed' })).toBe('paid');
    const state = installmentRowState(
      { status: 'overdue', payment_status: 'awaiting_confirmation', due_date: '2026-10-01' },
      { today: '2026-10-10' },
    );
    expect(state).toMatchObject({
      key: 'awaiting',
      badge: 'Awaiting confirmation',
      dateLabel: 'Oct 1, 2026',
      note: 'Submitted - waiting for our confirmation.',
      showForm: false,
    });
  });
});
