import { describe, expect, it } from 'vitest';
import {
  downPaymentRowState,
  closedRowState,
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

describe('closedRowState', () => {
  const dueLater = { due_date: '2099-01-01', status: 'pending' };

  it('keeps paid and awaiting rows unchanged', () => {
    const paid = installmentRowState({ status: 'paid' });
    expect(closedRowState(paid, 'defaulted', 'x')).toBe(paid);
    const awaiting = installmentRowState({ ...dueLater, payment_status: 'submitted' });
    expect(closedRowState(awaiting, 'cancelled', 'x')).toBe(awaiting);
  });

  it('shows the plan status badge on other rows', () => {
    const state = closedRowState(installmentRowState(dueLater), 'defaulted', 'Jan 1, 2099');
    expect(state).toMatchObject({
      key: 'closed',
      badge: 'Defaulted',
      badgeClass: 'badge badge-warn',
      dateLabel: 'Jan 1, 2099',
      showForm: false,
    });
  });

  it('falls back to a muted title-cased badge for unknown plan statuses', () => {
    expect(closedRowState(installmentRowState(dueLater), 'on_hold', 'x')).toMatchObject({
      badge: 'On Hold',
      badgeClass: 'badge badge-mute',
    });
  });
});

describe('installmentRowState rejected', () => {
  it('prefixes the due date label with Due', () => {
    const state = installmentRowState({
      status: 'pending',
      due_date: '2026-12-15',
      payment_status: 'rejected',
    });
    expect(state.dateLabel).toBe('Due Dec 15, 2026');
  });
});
