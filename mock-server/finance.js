export function markedUpTotal(rawPrice) {
  return Math.round(Number(rawPrice) * 1.3);
}

export function buildSchedule({ totalPrice, termMonths, startDate }) {
  const downPayment = Math.round(totalPrice * 0.3);
  const financed = totalPrice - downPayment;
  const termCount = termMonths * 2;
  const rate = 0.05;
  let balance = financed;
  const principalBase = financed / termCount;
  const schedule = [];
  const start = startDate ? new Date(startDate) : new Date();

  for (let index = 0; index < termCount; index += 1) {
    const due = new Date(start);
    due.setDate(due.getDate() + 15 * (index + 1));
    const interest = Math.round(balance * rate * 100) / 100;
    const principal =
      index === termCount - 1 ? balance : Math.round(principalBase * 100) / 100;
    const amount = Math.round((principal + interest) * 100) / 100;
    balance = Math.max(0, Math.round((balance - principal) * 100) / 100);
    schedule.push({
      term_number: index + 1,
      due_date: due.toISOString().slice(0, 10),
      principal_amount: principal,
      interest_amount: interest,
      amount,
    });
  }

  return { down_payment_amount: downPayment, financed_principal: financed, schedule };
}
