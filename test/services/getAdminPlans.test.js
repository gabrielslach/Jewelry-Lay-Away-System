import { describe, expect, it } from 'vitest';
import { getAdminPlans } from '../../src/services/getAdminPlans.js';

describe('getAdminPlans', () => {
  it('includes item names for the orders table', async () => {
    const plans = await getAdminPlans();
    expect(plans[0].item_name).toBeTruthy();
    expect(plans[0].customer_name).toBeTruthy();
  });
});
