import { paymentCountToTermMonths } from '../data/plans.js';
import { customerRequest } from './customerRequest.js';

export async function createLayawayPlan({ productId, paymentCount, dates }) {
  return customerRequest('/api/layaway/plans', {
    method: 'POST',
    body: {
      product_id: productId,
      term_months: paymentCountToTermMonths(paymentCount),
      installment_dates: dates,
    },
  });
}

export { defaultDates } from '../data/plans.js';
