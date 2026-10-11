import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLayawayPlan } from '../../src/services/getLayawayPlan.js';
import * as http from '../../src/services/http.js';

describe('getLayawayPlan', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests the plan by id', async () => {
    const request = vi
      .spyOn(http, 'request')
      .mockResolvedValue({ id: 'LA-1001' });
    await getLayawayPlan('LA-1001');
    expect(request).toHaveBeenCalledWith('/api/layaway/plans/LA-1001');
  });

  it('returns installments from the mock server', async () => {
    const plan = await getLayawayPlan('LA-1001');
    expect(plan.id).toBe('LA-1001');
    expect(Array.isArray(plan.installments)).toBe(true);
  });

  it('rejects when the plan is not found', async () => {
    await expect(getLayawayPlan('missing')).rejects.toBeInstanceOf(
      http.ServiceError,
    );
  });
});
