import { describe, expect, it } from 'vitest';
import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';
import { getAdminDashboard } from '../../src/services/getAdminDashboard.js';

describe('getAdminDashboard', () => {
  it('returns KPI fields', async () => {
    await ensureAdminToken();
    const data = await getAdminDashboard();
    expect(data.active_layaways).toBe(5);
    expect(data.collections_last_6_weeks).toHaveLength(6);
  });
});
