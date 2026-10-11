import { afterEach, describe, expect, it, vi } from 'vitest';
import * as ensureAdminToken from '../../src/services/ensureAdminToken.js';
import { ensureAdminToken as signIn } from '../../src/services/ensureAdminToken.js';
import { getAdminPlans } from '../../src/services/getAdminPlans.js';

describe('getAdminPlans', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('includes item names for the orders table from mock { results }', async () => {
    await signIn();
    const plans = await getAdminPlans();
    expect(plans.length).toBeGreaterThan(0);
    expect(plans[0].item_name).toBeTruthy();
    expect(plans[0].customer_name).toBeTruthy();
    expect(plans[0].status === 'ok' || plans[0].status === 'warn').toBe(true);
    expect(Array.isArray(plans[0].installments)).toBe(true);
  });

  it('accepts a live bare array and normalizes rows for the orders UI', async () => {
    vi.spyOn(ensureAdminToken, 'adminRequest').mockResolvedValue([
      {
        id: 8,
        customer_name: 'Rounding Test',
        customer_email: 'round@example.com',
        item_name: 'Solitaire Halo Ring',
        plan_label: '3 Mo. / 6 Payments',
        next_due_date: '2026-10-25T00:00:00.000Z',
        overdue_count: 0,
        pending_count: 2,
        paid_count: 1,
        reservation_status: 'reserved',
        reservation_error: null,
      },
      {
        id: 9,
        customer_name: 'Late Client',
        item_name: 'Vintage Rose Pendant',
        status: 'overdue',
        next_due: '2026-09-15',
        overdue_count: 2,
        reservation_status: 'none',
        installments: [{ id: 'i1', status: 'overdue' }],
      },
      {
        id: 10,
        customer_name: 'On Track Client',
        item_name: 'Emerald Drop Earrings',
        status: 'on_track',
        next_due_date: '2026-11-01T12:00:00.000Z',
        overdue_count: 0,
      },
    ]);

    const plans = await getAdminPlans();

    expect(plans).toHaveLength(3);
    expect(plans[0]).toMatchObject({
      id: 8,
      customer_name: 'Rounding Test',
      item_name: 'Solitaire Halo Ring',
      plan_label: '3 Mo. / 6 Payments',
      status: 'ok',
      next_due: 'Oct 25',
      reservation_status: 'reserved',
      reservation_error: null,
      installments: [],
    });
    expect(plans[1]).toMatchObject({
      id: 9,
      status: 'warn',
      next_due: 'Sep 15',
      installments: [{ id: 'i1', status: 'overdue' }],
    });
    expect(plans[2]).toMatchObject({
      id: 10,
      status: 'ok',
      next_due: 'Nov 1',
      installments: [],
    });
  });

  it('derives warn from overdue_count when status is omitted', async () => {
    vi.spyOn(ensureAdminToken, 'adminRequest').mockResolvedValue([
      {
        id: 11,
        customer_name: 'Behind',
        item_name: 'Classic Tennis Bracelet',
        overdue_count: 1,
        next_due_date: '2026-09-01T00:00:00.000Z',
      },
    ]);

    const [plan] = await getAdminPlans();
    expect(plan.status).toBe('warn');
    expect(plan.next_due).toBe('Sep 1');
  });
});
