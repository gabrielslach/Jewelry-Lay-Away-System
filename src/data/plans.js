export function paymentCountToTermMonths(paymentCount) {
  return paymentCount / 2;
}

export function createLayawayPlan({ productId, paymentCount, dates }) {
  return Promise.resolve({
    id: `plan-${productId}`,
    product_id: productId,
    term_months: paymentCountToTermMonths(paymentCount),
    installment_dates: dates,
    note: 'Markup not applied (mock).',
  });
}

export function defaultDates(count) {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const d = new Date(today);
    d.setDate(d.getDate() + 7 + index * 14);
    return d.toISOString().slice(0, 10);
  });
}
