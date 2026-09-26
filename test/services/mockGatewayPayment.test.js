import { describe, expect, it } from 'vitest';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import { mockGatewayPayment } from '../../src/services/mockGatewayPayment.js';
import { createLayawayPlan } from '../../src/services/createLayawayPlan.js';

describe('mockGatewayPayment', () => {
  it('reserves without marking an installment paid', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    const plan = await createLayawayPlan({
      productId: 3,
      paymentCount: 2,
      dates: ['2026-10-01', '2026-10-15'],
    });
    const result = await mockGatewayPayment({ planId: plan.id, method: 'gcash' });
    expect(result.status).toBe('reserved');
  });
});
