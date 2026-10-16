export function paymentCountToTermMonths(paymentCount) {
  return paymentCount / 2;
}

export function termMonthOptions(maxMonths = 3) {
  return Array.from({ length: maxMonths }, (_, index) => {
    const termMonths = maxMonths - index;
    const payments = termMonths * 2;
    const monthLabel = termMonths === 1 ? '1 Month' : `${termMonths} Months`;
    return {
      termMonths,
      payments,
      label: `${monthLabel} (${payments} payments)`,
    };
  });
}
