import { describe, expect, it } from 'vitest';
import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';
import { markNextPaid } from '../../src/services/markNextPaid.js';
import { getAdminPlans } from '../../src/services/getAdminPlans.js';

describe('markNextPaid', () => {
  it('marks a plan on track', async () => {
    await ensureAdminToken();
    const overdue = (await getAdminPlans()).find((plan) => plan.status === 'warn');
    const updated = await markNextPaid(overdue.id);
    expect(updated.status).toBe('ok');
  });
});
