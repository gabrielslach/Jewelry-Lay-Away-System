import { todayIsoLocal } from './dates.js';

export function planTotals(plan) {
  const installments = (plan.installments ?? []).filter((row) => row.status !== 'superseded');
  const downPayment = Number(plan.down_payment_amount) || 0;
  const financedPrincipal = installments.reduce((sum, row) => sum + Number(row.amount), 0);
  const paidInstallments = installments
    .filter((row) => row.status === 'paid')
    .reduce((sum, row) => sum + Number(row.amount), 0);
  return {
    financedPrincipal: plan.financed_principal ?? financedPrincipal,
    totalPayable: plan.total_payable ?? downPayment + financedPrincipal,
    amountPaid:
      plan.amount_paid ??
      (plan.down_payment_status === 'paid' ? downPayment : 0) + paidInstallments,
    asOf: todayIsoLocal(),
  };
}
