import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as ensureAdminToken from '../../src/services/ensureAdminToken.js';
import { getLayawayPlan } from '../../src/services/getLayawayPlan.js';
import { ServiceError } from '../../src/services/http.js';
import { signInAdmin, signOutAdmin } from '../helpers/adminAuth.js';

describe('getLayawayPlan', () => {
  beforeEach(signInAdmin);

  afterEach(() => {
    vi.restoreAllMocks();
    signOutAdmin();
  });

  it('requests the plan by id with the staff token', async () => {
    const adminRequest = vi
      .spyOn(ensureAdminToken, 'adminRequest')
      .mockResolvedValue({ id: 'LA-1001' });
    await getLayawayPlan('LA-1001');
    expect(adminRequest).toHaveBeenCalledWith('/api/layaway/plans/LA-1001');
  });

  it('returns installments from the mock server', async () => {
    const plan = await getLayawayPlan('LA-1001');
    expect(plan.id).toBe('LA-1001');
    expect(Array.isArray(plan.installments)).toBe(true);
  });

  it('rejects when the plan is not found', async () => {
    await expect(getLayawayPlan('missing')).rejects.toBeInstanceOf(ServiceError);
  });

  it('rejects without a staff session', async () => {
    signOutAdmin();
    await expect(getLayawayPlan('LA-1001')).rejects.toMatchObject({ status: 401 });
  });
});
