import { paymentCountToTermMonths } from '../data/plans.js';
import { ServiceError } from './http.js';
import { request } from './http.js';
import { getCustomerToken } from './session.js';

export async function createLayawayPlan({ productId, paymentCount, dates }) {
  const token = getCustomerToken();
  if (!token) {
    throw new ServiceError('Please sign in to continue.', 401);
  }
  return request('/api/layaway/plans', {
    method: 'POST',
    token,
    body: {
      product_id: productId,
      term_months: paymentCountToTermMonths(paymentCount),
      installment_dates: dates,
    },
  });
}

export { defaultDates } from '../data/plans.js';
