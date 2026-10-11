import { describe, expect, it } from 'vitest';
import {
  confirmAdminPayment,
  getAdminDuePayments,
  getAdminPendingPayments,
  rejectAdminPayment,
} from '../../src/services/adminPayments.js';
import { createLayawayPlan } from '../../src/services/createLayawayPlan.js';
import { ensureAdminToken } from '../../src/services/ensureAdminToken.js';
import { getGallery } from '../../src/services/getGallery.js';
import { loginCustomer } from '../../src/services/loginCustomer.js';
import {
  submitDownPaymentManual,
  submitInstallmentManual,
} from '../../src/services/submitManualPayment.js';

describe('adminPayments', () => {
  it('loads pending and due lists for staff', async () => {
    await ensureAdminToken();
    const pending = await getAdminPendingPayments();
    const due = await getAdminDuePayments();
    expect(Array.isArray(pending)).toBe(true);
    expect(due).toHaveProperty('items');
  });

  it('confirms a down payment and rejects an installment', async () => {
    await ensureAdminToken();
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    const { results } = await getGallery({ pageSize: 1 });
    const plan = await createLayawayPlan({ productId: results[0].id, termMonths: 1 });
    const paidOn = new Date().toISOString().slice(0, 10);
    const down = await submitDownPaymentManual(plan.id, {
      bank_account_id: 1,
      reference_number: `BT-ADMIN-DP-${Date.now()}`,
      amount: plan.down_payment_amount,
      paid_on: paidOn,
    });
    const confirmed = await confirmAdminPayment(down.id, { note: 'ok' });
    expect(confirmed.status).toBe('confirmed');

    const installment = await submitInstallmentManual(plan.id, {
      installment_id: `${plan.id}-i1`,
      bank_account_id: 1,
      reference_number: `BT-ADMIN-IN-${Date.now()}`,
      amount: plan.schedule[0].amount,
      paid_on: paidOn,
    });
    const rejected = await rejectAdminPayment(installment.id, { reason: 'Unclear proof' });
    expect(rejected.status).toBe('rejected');
  });
});
