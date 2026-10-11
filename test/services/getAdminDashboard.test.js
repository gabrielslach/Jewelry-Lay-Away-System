import { afterEach, describe, expect, it, vi } from 'vitest';
import * as ensureAdminToken from '../../src/services/ensureAdminToken.js';
import { ensureAdminToken as signIn } from '../../src/services/ensureAdminToken.js';
import { getAdminDashboard } from '../../src/services/getAdminDashboard.js';

describe('getAdminDashboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns KPI fields from the mock API', async () => {
    await signIn();
    const data = await getAdminDashboard();
    expect(data.active_layaways).toBe(5);
    expect(data.collections_last_6_weeks).toHaveLength(6);
  });

  it('keeps mock-shaped activity titles and details', async () => {
    vi.spyOn(ensureAdminToken, 'adminRequest').mockResolvedValue({
      active_layaways: 1,
      collected_this_month: 100,
      overdue_payments: 0,
      active_customers: 1,
      collections_last_6_weeks: [62, 80, 55, 90, 74, 96],
      recent_activity: [
        { title: 'New reservation — Solitaire Halo Ring', detail: 'Sample Client · 2h ago' },
      ],
    });

    const data = await getAdminDashboard();
    expect(data.recent_activity).toEqual([
      {
        title: 'New reservation — Solitaire Halo Ring',
        detail: 'Sample Client · 2h ago',
        key: 'New reservation — Solitaire Halo Ring|Sample Client · 2h ago||0',
      },
    ]);
    expect(data.collections_last_6_weeks).toEqual([62, 80, 55, 90, 74, 96]);
  });

  it('normalizes live-shaped activity and collection bars', async () => {
    vi.spyOn(ensureAdminToken, 'adminRequest').mockResolvedValue({
      collected_this_month: { total: 37400, currency: 'PHP' },
      collections_last_6_weeks: [
        { week_start: '2026-08-16', total: 0 },
        { week_start: '2026-08-23', total: 0 },
        { week_start: '2026-08-30', total: 0 },
        { week_start: '2026-09-06', total: 18700 },
        { week_start: '2026-09-13', total: 0 },
        { week_start: '2026-09-20', total: 37400 },
      ],
      recent_activity: [
        {
          label: 'New reservation',
          detail: 'Rounding Test - plan #8',
          timestamp: '2026-09-26T02:02:10.000Z',
        },
        {
          label: 'Payment received',
          detail: '₱37400.00',
          timestamp: '2026-09-23T15:09:59.000Z',
        },
      ],
    });

    const data = await getAdminDashboard();

    expect(data.collections_last_6_weeks).toEqual([0, 0, 0, 50, 0, 100]);
    expect(data.recent_activity).toHaveLength(2);
    expect(data.recent_activity[0].title).toBe('New reservation');
    expect(data.recent_activity[0].detail).toMatch(/^Rounding Test - plan #8 · /);
    expect(data.recent_activity[0].key).toBe(
      'New reservation|Rounding Test - plan #8|2026-09-26T02:02:10.000Z|0',
    );
    expect(data.recent_activity[1].title).toBe('Payment received');
    expect(data.recent_activity[1].key).not.toBe(data.recent_activity[0].key);
  });
});
