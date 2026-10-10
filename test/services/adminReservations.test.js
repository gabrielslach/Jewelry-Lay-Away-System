import { describe, expect, it } from 'vitest';
import {
  cancelReservation,
  retryReservation,
} from '../../src/services/adminReservations.js';
import { getAdminPlans } from '../../src/services/getAdminPlans.js';

describe('adminReservations', () => {
  it('retries and cancels a reserved plan', async () => {
    const plans = await getAdminPlans();
    const reserved = plans.find((plan) => plan.reservation_status === 'reserved');
    expect(reserved).toBeTruthy();
    const retried = await retryReservation(reserved.id);
    expect(retried.ok).toBe(true);
    const cancelled = await cancelReservation(reserved.id, {
      reason: 'Customer asked to stop',
      handoffConfirmed: true,
    });
    expect(cancelled.state).toBe('cancelled');
  });
});
