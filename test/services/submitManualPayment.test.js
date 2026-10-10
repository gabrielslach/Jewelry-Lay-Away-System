import { describe, expect, it } from 'vitest';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import {
  submitDownPaymentManual,
  submitInstallmentManual,
} from '../../src/services/submitManualPayment.js';
import { createLayawayPlan } from '../../src/services/createLayawayPlan.js';
import { getGallery } from '../../src/services/getGallery.js';

describe('submitManualPayment', () => {
  it('submits a down payment through the manual endpoint', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    const { results } = await getGallery({ pageSize: 1 });
    const plan = await createLayawayPlan({ productId: results[0].id, termMonths: 1 });
    const result = await submitDownPaymentManual(plan.id, {
      bank_account_id: 1,
      reference_number: `BT-DP-${Date.now()}`,
      amount: plan.down_payment_amount,
      paid_on: new Date().toISOString().slice(0, 10),
    });
    expect(result.status).toBe('submitted');
  });

  it('submits an installment through the manual endpoint', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    const { results } = await getGallery({ pageSize: 1 });
    const plan = await createLayawayPlan({ productId: results[0].id, termMonths: 1 });
    const result = await submitInstallmentManual(plan.id, {
      installment_id: `${plan.id}-i1`,
      bank_account_id: 1,
      reference_number: `BT-INST-${Date.now()}`,
      amount: plan.schedule[0].amount,
      paid_on: new Date().toISOString().slice(0, 10),
    });
    expect(result.status).toBe('submitted');
  });
});
