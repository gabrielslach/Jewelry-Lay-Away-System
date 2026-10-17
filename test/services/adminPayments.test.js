import { describe, expect, it } from 'vitest';
import {
  confirmAdminPayment,
  fetchPaymentProof,
  getAdminDuePayments,
  getAdminPendingPayments,
  getPaymentHistory,
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
    const installment = await submitInstallmentManual(plan.id, {
      installment_id: `${plan.id}-i1`,
      bank_account_id: 1,
      reference_number: `BT-ADMIN-IN-${Date.now()}`,
      amount: plan.schedule[0].amount,
      paid_on: paidOn,
    });
    await ensureAdminToken();
    const confirmed = await confirmAdminPayment(down.id, { note: 'ok' });
    expect(confirmed.status).toBe('confirmed');
    const rejected = await rejectAdminPayment(installment.id, { reason: 'Unclear proof' });
    expect(rejected.status).toBe('rejected');
  });

  it('fetches payment proof as a blob object URL', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    const { results } = await getGallery({ pageSize: 1 });
    const plan = await createLayawayPlan({ productId: results[0].id, termMonths: 1 });
    const paidOn = new Date().toISOString().slice(0, 10);
    const down = await submitDownPaymentManual(plan.id, {
      bank_account_id: 1,
      reference_number: `BT-ADMIN-PROOF-${Date.now()}`,
      amount: plan.down_payment_amount,
      paid_on: paidOn,
      proof_of_payment: new File(['proof'], 'proof.png', { type: 'image/png' }),
    });
    await ensureAdminToken();
    const proof = await fetchPaymentProof(down.id);
    expect(proof.url).toMatch(/^blob:/);
    expect(proof.content_type).toMatch(/^image\//);
    URL.revokeObjectURL(proof.url);
  });

  it('surfaces missing proof as a not-found ServiceError', async () => {
    await loginCustomer({ email: 'client@sampleemail.com', password: 'password' });
    const { results } = await getGallery({ pageSize: 1 });
    const plan = await createLayawayPlan({ productId: results[0].id, termMonths: 1 });
    const paidOn = new Date().toISOString().slice(0, 10);
    const down = await submitDownPaymentManual(plan.id, {
      bank_account_id: 1,
      reference_number: `BT-ADMIN-NOPROOF-${Date.now()}`,
      amount: plan.down_payment_amount,
      paid_on: paidOn,
    });
    await ensureAdminToken();
    await expect(fetchPaymentProof(down.id)).rejects.toMatchObject({
      name: 'ServiceError',
      status: 404,
    });
  });
});

describe('getPaymentHistory', () => {
  it('lists reviewed payments filtered by outcome', async () => {
    await ensureAdminToken();
    const confirmed = await getPaymentHistory({ status: 'confirmed' });
    const rejected = await getPaymentHistory({ status: 'rejected', limit: 10, offset: 0 });
    expect(confirmed.length).toBeGreaterThan(0);
    expect(confirmed.every((row) => row.outcome === 'confirmed')).toBe(true);
    expect(rejected.every((row) => row.outcome === 'rejected')).toBe(true);
    expect(rejected[0]).toHaveProperty('review_note');
  });
});
