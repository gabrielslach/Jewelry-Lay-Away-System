import { describe, expect, it } from 'vitest';
import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';
import { getAdminPlans } from '../../src/services/getAdminPlans.js';

describe('getAdminPlans', () => {
  it('includes item names for the orders table', async () => {
    await ensureAdminToken();
    const plans = await getAdminPlans();
    expect(plans[0].item_name).toBeTruthy();
    expect(plans[0].customer_name).toBeTruthy();
  });
});
